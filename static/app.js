// ⚡ ZECA STUDY TRACKER - APLICATIVO VANILLA JS (OFFLINE-FIRST)

document.addEventListener('DOMContentLoaded', () => {
    // === 1. ESTADO DA APLICACÃO ===
    let sessions = [];
    let dailyGoal = parseFloat(localStorage.getItem('zeca_daily_goal')) || 4; // horas
    let timerState = JSON.parse(localStorage.getItem('zeca_timer_state')) || {
        subject: '',
        startTime: 0,
        accumulatedTime: 0,
        isRunning: false
    };

    let timerInterval = null;

    // === 2. ELEMENTOS DO DOM ===
    // Form & Inputs
    const subjectInput = document.getElementById('subject-input');
    const durationInput = document.getElementById('duration-input');
    const tabManual = document.getElementById('tab-manual');
    const tabTimer = document.getElementById('tab-timer');
    const panelManual = document.getElementById('panel-manual');
    const panelTimer = document.getElementById('panel-timer');
    
    // Botões
    const btnSaveManual = document.getElementById('btn-save-manual');
    const btnSaveTimer = document.getElementById('btn-save-timer');
    const btnTimerStart = document.getElementById('btn-timer-start');
    const btnTimerPause = document.getElementById('btn-timer-pause');
    const btnTimerReset = document.getElementById('btn-timer-reset');
    const btnExport = document.getElementById('btn-export-backup');
    const btnImportTrigger = document.getElementById('btn-import-trigger');
    const fileInput = document.getElementById('backup-file-input');
    
    // Timer Display
    const timerHours = document.getElementById('timer-hours');
    const timerMinutes = document.getElementById('timer-minutes');
    const timerSeconds = document.getElementById('timer-seconds');
    
    // Dashboard / Progresso
    const todayTotalTime = document.getElementById('today-total-time');
    const dailyGoalInput = document.getElementById('daily-goal-input');
    const subjectBarsList = document.getElementById('subject-bars-list');
    const sessionsLogList = document.getElementById('sessions-log-list');
    const circleProgress = document.querySelector('.progress-ring__circle');
    const toastContainer = document.getElementById('toast-container');

    // === 3. INICIALIZAÇÃO ===
    dailyGoalInput.value = dailyGoal;
    initTimerFromState();
    loadDailySessions(); // Carrega da API do backend Flask com failover para localStorage

    // === 4. NAVEGAÇÃO DE ABAS ===
    tabManual.addEventListener('click', () => switchTab('manual'));
    tabTimer.addEventListener('click', () => switchTab('timer'));

    function switchTab(mode) {
        if (timerState.isRunning) {
            showToast('Pausa o cronômetro para mudar de modo!', 'info');
            return;
        }
        if (mode === 'manual') {
            tabManual.classList.add('active');
            tabTimer.classList.remove('active');
            panelManual.classList.remove('hidden');
            panelTimer.classList.add('hidden');
            tabManual.setAttribute('aria-selected', 'true');
            tabTimer.setAttribute('aria-selected', 'false');
        } else {
            tabManual.classList.remove('active');
            tabTimer.classList.add('active');
            panelManual.classList.add('hidden');
            panelTimer.classList.remove('hidden');
            tabManual.setAttribute('aria-selected', 'false');
            tabTimer.setAttribute('aria-selected', 'true');
        }
    }

    // === 5. BOTÕES DE ATALHO DE MINUTOS ===
    document.querySelectorAll('.quick-btn').forEach(button => {
        button.addEventListener('click', () => {
            const mins = parseInt(button.dataset.minutes, 10);
            const currentVal = parseInt(durationInput.value, 10) || 0;
            durationInput.value = currentVal + mins;
        });
    });

    // === 6. SALVAR REGISTRO MANUAL ===
    btnSaveManual.addEventListener('click', () => {
        const subject = subjectInput.value.trim();
        const duration = parseInt(durationInput.value, 10);

        if (!subject) {
            showToast('Por favor, informe a matéria/atividade.', 'error');
            subjectInput.focus();
            return;
        }
        if (isNaN(duration) || duration <= 0) {
            showToast('Digite uma duração em minutos válida e maior que zero.', 'error');
            durationInput.focus();
            return;
        }

        saveSession(subject, duration);
        durationInput.value = ''; // Limpa apenas a duração para permitir novos registros rápidos
    });

    // === 7. META DIÁRIA ===
    dailyGoalInput.addEventListener('input', () => {
        const goal = parseFloat(dailyGoalInput.value);
        if (!isNaN(goal) && goal > 0 && goal <= 24) {
            dailyGoal = goal;
            localStorage.setItem('zeca_daily_goal', dailyGoal);
            updateDashboard();
        }
    });

    // === 8. MOTOR DO CRONÔMETRO (TIMER) ===
    btnTimerStart.addEventListener('click', startTimer);
    btnTimerPause.addEventListener('click', pauseTimer);
    btnTimerReset.addEventListener('click', resetTimer);
    btnSaveTimer.addEventListener('click', saveTimerTime);

    function initTimerFromState() {
        // CORREÇÃO BUG F5: Se o localStorage diz que estava rodando, mas a página
        // foi recarregada, o intervalo JS não existe mais. Nesse caso, calculamos
        // o tempo decorrido até o reload, acumulamos, e forçamos isRunning = false.
        // Isso evita que a guarda do switchTab trave o usuário na aba Manual.
        if (timerState.isRunning) {
            const elapsed = Date.now() - timerState.startTime;
            timerState.accumulatedTime += elapsed;
            timerState.isRunning = false;
            timerState.startTime = 0;
            localStorage.setItem('zeca_timer_state', JSON.stringify(timerState));
        }

        if (timerState.accumulatedTime > 0) {
            // Cronômetro pausado com tempo acumulado: vai direto para a aba Cronômetro
            subjectInput.value = timerState.subject;
            subjectInput.disabled = true;
            switchTab('timer');
            updateTimerDisplay(timerState.accumulatedTime);
            btnTimerStart.classList.remove('hidden');
            btnTimerPause.classList.add('hidden');
            btnSaveTimer.disabled = false;
        }
        // Caso sem estado (estado limpo): UI permanece no padrão da aba Manual, sem ação.
    }

    function startTimer() {
        const subject = subjectInput.value.trim();
        if (!subject) {
            showToast('Por favor, selecione ou digite a matéria antes de iniciar.', 'error');
            subjectInput.focus();
            return;
        }

        timerState.subject = subject;
        timerState.startTime = Date.now();
        timerState.isRunning = true;
        
        localStorage.setItem('zeca_timer_state', JSON.stringify(timerState));
        
        btnTimerStart.classList.add('hidden');
        btnTimerPause.classList.remove('hidden');
        subjectInput.disabled = true;
        btnSaveTimer.disabled = true;

        timerInterval = setInterval(timerTick, 100);
        showToast(`Cronômetro iniciado para: ${subject}`, 'success');
    }

    function pauseTimer() {
        if (!timerState.isRunning) return;

        clearInterval(timerInterval);
        const now = Date.now();
        timerState.accumulatedTime += (now - timerState.startTime);
        timerState.isRunning = false;
        
        localStorage.setItem('zeca_timer_state', JSON.stringify(timerState));
        
        btnTimerStart.classList.remove('hidden');
        btnTimerPause.classList.add('hidden');
        btnSaveTimer.disabled = false;
        showToast('Cronômetro pausado.', 'info');
    }

    function resetTimer() {
        if (timerState.accumulatedTime === 0 && !timerState.isRunning) return;
        
        if (confirm('Deseja realmente zerar o tempo atual do cronômetro?')) {
            clearInterval(timerInterval);
            timerState = {
                subject: '',
                startTime: 0,
                accumulatedTime: 0,
                isRunning: false
            };
            localStorage.setItem('zeca_timer_state', JSON.stringify(timerState));
            
            // Reset UI
            updateTimerDisplay(0);
            btnTimerStart.classList.remove('hidden');
            btnTimerPause.classList.add('hidden');
            subjectInput.disabled = false;
            btnSaveTimer.disabled = true;
            showToast('Cronômetro reiniciado.', 'info');
        }
    }

    function timerTick() {
        if (!timerState.isRunning) return;
        const now = Date.now();
        const elapsed = timerState.accumulatedTime + (now - timerState.startTime);
        updateTimerDisplay(elapsed);
        if (elapsed > 0) {
            btnSaveTimer.disabled = false;
        }
    }

    function updateTimerDisplay(ms) {
        const totalSecs = Math.floor(ms / 1000);
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;

        timerHours.textContent = String(hrs).padStart(2, '0');
        timerMinutes.textContent = String(mins).padStart(2, '0');
        timerSeconds.textContent = String(secs).padStart(2, '0');
    }

    function saveTimerTime() {
        clearInterval(timerInterval);
        const now = Date.now();
        let totalMs = timerState.accumulatedTime;
        if (timerState.isRunning) {
            totalMs += (now - timerState.startTime);
        }

        const minutes = Math.max(1, Math.round(totalMs / 60000));
        const subject = timerState.subject;

        // Reset cronômetro no storage e UI
        timerState = {
            subject: '',
            startTime: 0,
            accumulatedTime: 0,
            isRunning: false
        };
        localStorage.setItem('zeca_timer_state', JSON.stringify(timerState));
        updateTimerDisplay(0);
        btnTimerStart.classList.remove('hidden');
        btnTimerPause.classList.add('hidden');
        subjectInput.disabled = false;
        btnSaveTimer.disabled = true;

        saveSession(subject, minutes);
    }

    // === 9. CORE: CARREGAR, PERSISTIR E RENDERIZAR SESSÕES ===

    async function loadDailySessions() {
        const todayStr = getTodayDateString();
        try {
            const response = await fetch(`/api/resumo_diario?date=${todayStr}`);
            if (!response.ok) throw new Error('Erro na requisicao');
            
            const result = await response.json();
            if (result.status === 'success') {
                sessions = result.sessions;
                // Sincroniza localmente
                localStorage.setItem('zeca_study_sessions', JSON.stringify(sessions));
                updateDashboard();
                console.log('🔄 Dados carregados com sucesso do banco de dados SQLite.');
            }
        } catch (error) {
            console.warn('⚠️ Falha ao ler do backend. Usando localStorage fallback:', error);
            // Fallback
            sessions = JSON.parse(localStorage.getItem('zeca_study_sessions')) || [];
            updateDashboard();
            showToast('Servidor offline. Usando dados locais.', 'info');
        }
    }

    async function saveSession(subject, duration) {
        const todayDate = getTodayDateString();
        const newSession = {
            id: 'session-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            subject: subject,
            duration: duration,
            date: todayDate,
            timestamp: new Date().toISOString()
        };

        // Insere localmente
        sessions.push(newSession);

        try {
            const response = await fetch('/api/registrar_tempo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newSession)
            });

            if (!response.ok) throw new Error('Falha ao registrar no backend');

            const result = await response.json();
            if (result.status === 'success') {
                localStorage.setItem('zeca_study_sessions', JSON.stringify(sessions));
                updateDashboard();
                showToast(`Registrado: ${duration}m em ${subject}!`, 'success');
            }
        } catch (error) {
            console.warn('⚠️ Servidor offline. Salvando no localStorage local:', error);
            // Fallback
            localStorage.setItem('zeca_study_sessions', JSON.stringify(sessions));
            updateDashboard();
            showToast(`Registrado localmente (modo offline): ${duration}m em ${subject}`, 'info');
        }
    }

    window.deleteSession = async function(id) {
        if (confirm('Excluir este registro de estudo?')) {
            // Remove localmente
            sessions = sessions.filter(session => session.id !== id);

            try {
                const response = await fetch('/api/excluir_tempo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: id })
                });

                if (!response.ok) throw new Error('Falha ao excluir no backend');

                const result = await response.json();
                if (result.status === 'success') {
                    localStorage.setItem('zeca_study_sessions', JSON.stringify(sessions));
                    updateDashboard();
                    showToast('Registro removido com sucesso.', 'info');
                }
            } catch (error) {
                console.warn('⚠️ Servidor offline. Removendo localmente do localStorage:', error);
                // Fallback
                localStorage.setItem('zeca_study_sessions', JSON.stringify(sessions));
                updateDashboard();
                showToast('Registro removido localmente.', 'info');
            }
        }
    };

    function updateDashboard() {
        const todayStr = getTodayDateString();
        const todaySessions = sessions.filter(s => s.date === todayStr);

        // 1. Calcular tempo total
        const totalMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
        todayTotalTime.textContent = formatTimeDisplay(totalMinutes);

        // Atualiza o contador de horas no header do Foco Diário
        const headerTotalHours = document.getElementById('header-total-hours');
        if (headerTotalHours) {
            headerTotalHours.textContent = formatTimeDisplay(totalMinutes);
        }

        // 2. Atualizar o anel circular SVG
        const radius = circleProgress.r.baseVal.value;
        const circumference = 2 * Math.PI * radius; // ~427.26
        circleProgress.style.strokeDasharray = `${circumference} ${circumference}`;

        const goalMinutes = dailyGoal * 60;
        const percentage = Math.min(100, (totalMinutes / goalMinutes) * 100);
        const offset = circumference - (percentage / 100) * circumference;
        circleProgress.style.strokeDashoffset = offset;

        // Animação de brilho suave ao bater a meta
        if (percentage >= 100) {
            circleProgress.style.filter = 'drop-shadow(0 0 8px var(--accent-green))';
        } else {
            circleProgress.style.filter = 'none';
        }

        // 3. Agregar tempo por matéria
        const subjectTotals = {};
        todaySessions.forEach(s => {
            subjectTotals[s.subject] = (subjectTotals[s.subject] || 0) + s.duration;
        });

        // Ordenar matérias por duração decrescente
        const sortedSubjects = Object.keys(subjectTotals).map(subj => {
            return { name: subj, duration: subjectTotals[subj] };
        }).sort((a, b) => b.duration - a.duration);

        // Renderizar barras das matérias
        if (sortedSubjects.length === 0) {
            subjectBarsList.innerHTML = '<p class="empty-state">Nenhum registro hoje. Comece a estudar!</p>';
        } else {
            subjectBarsList.innerHTML = sortedSubjects.map(subj => {
                const color = getSubjectColor(subj.name);
                const percent = totalMinutes > 0 ? (subj.duration / totalMinutes) * 100 : 0;
                return `
                    <div class="subject-bar-item">
                        <div class="subject-info">
                            <span class="subject-name">${subj.name}</span>
                            <span class="subject-duration">${formatTimeDisplay(subj.duration)} (${Math.round(percent)}%)</span>
                        </div>
                        <div class="subject-bar-bg">
                            <div class="subject-bar-fill" style="width: ${percent}%; background: ${color}"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 4. Renderizar logs das sessões de hoje (mais recentes primeiro)
        const sortedTodaySessions = [...todaySessions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (sortedTodaySessions.length === 0) {
            sessionsLogList.innerHTML = '<p class="empty-state">Sem sessões registradas ainda.</p>';
        } else {
            sessionsLogList.innerHTML = sortedTodaySessions.map(session => {
                const color = getSubjectColor(session.subject);
                const timeString = new Date(session.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                return `
                    <div class="session-log-card">
                        <div class="log-meta">
                            <div class="log-title-row">
                                <span class="log-dot" style="background: ${color}"></span>
                                <span class="log-subject">${session.subject}</span>
                            </div>
                            <span class="log-time-details">Registrado às ${timeString}</span>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <span class="log-duration">${session.duration} min</span>
                            <button type="button" class="btn-delete-log" onclick="deleteSession('${session.id}')" aria-label="Remover sessão de ${session.subject}">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // === 10. BACKUP EXPORT & IMPORT ===
    btnExport.addEventListener('click', exportBackup);
    btnImportTrigger.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', importBackup);

    function exportBackup() {
        if (sessions.length === 0) {
            showToast('Nenhum registro para exportar!', 'info');
            return;
        }

        const dataStr = JSON.stringify(sessions, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const today = getTodayDateString();
        const a = document.createElement('a');
        a.href = url;
        a.download = `zeca-backup-estudos-${today}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Backup exportado com sucesso!', 'success');
    }

    function importBackup(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function(evt) {
            try {
                const importedData = JSON.parse(evt.target.result);
                
                if (!Array.isArray(importedData)) {
                    throw new Error('O arquivo deve conter uma lista de sessões.');
                }
                
                const validSessions = importedData.filter(item => {
                    return item.id && item.subject && typeof item.duration === 'number' && item.date && item.timestamp;
                });

                if (validSessions.length === 0) {
                    throw new Error('Nenhum registro válido encontrado no arquivo.');
                }

                const existingIds = new Set(sessions.map(s => s.id));
                let newCount = 0;
                
                for (const item of validSessions) {
                    if (!existingIds.has(item.id)) {
                        sessions.push(item);
                        newCount++;
                        // Envia para o SQLite em segundo plano
                        fetch('/api/registrar_tempo', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(item)
                        }).catch(err => console.warn('Erro ao sincronizar backup importado:', err));
                    }
                }

                localStorage.setItem('zeca_study_sessions', JSON.stringify(sessions));
                updateDashboard();
                showToast(`${newCount} novas sessões importadas!`, 'success');
            } catch (err) {
                showToast('Falha na importação: ' + err.message, 'error');
            } finally {
                fileInput.value = '';
            }
        };
        reader.readAsText(file);
    }

    // === 11. UTILITÁRIOS E HELPERS ===
    function getTodayDateString() {
        const d = new Date();
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    }

    function formatTimeDisplay(totalMins) {
        if (totalMins < 60) {
            return `${totalMins} min`;
        }
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }

    // Hash determinístico para cores
    function getSubjectColor(subjectName) {
        let hash = 0;
        for (let i = 0; i < subjectName.length; i++) {
            hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 80%, 55%)`;
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        if (type === 'success') {
            icon = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-green);"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else if (type === 'error') {
            icon = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-pink);"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        } else {
            icon = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-blue);"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }
        
        toast.innerHTML = `${icon} <span>${message}</span>`;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
});
