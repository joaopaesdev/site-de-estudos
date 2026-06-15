# 01-NORTH_STAR.md: Intenção e Limites do Projeto

🎯 1. Intenção Central (The North Star)
R: Registro ultra-rápido e visualização clara do tempo diário dedicado a cada matéria ou atividade de estudo.

😫 2. O Problema Real (A Dor)
R: Ao longo do dia, estudo e me dedico a várias matérias, mas perco a noção do tempo real investido em cada uma. A falta de um rastreamento simples gera ansiedade, frustração e a sensação de que o dia não foi produtivo, pois não sei exatamente quantas horas estudei.

👥 3. Público-Alvo (As Personas)
Eu (O Estudante): Quero registrar o tempo gasto em uma matéria (manualmente ou via cronômetro) em menos de 5 segundos e ver na hora um resumo visual do meu progresso no dia corrente.

🔍 4. Checklist de Descoberta (5 Questões)
- **Fonte do Dado**: Inserção manual de minutos ou um botão simples de Iniciar/Parar Cronômetro no navegador.
- **Entrega**: Persistência imediata dos dados de tempo no armazenamento local do navegador (localStorage).
- **Regra de Ouro**: O sistema deve abrir direto na tela de registro e mostrar o gráfico/resumo do dia atual logo abaixo, sem cliques desnecessários.
- **Resiliência**: Deve funcionar 100% offline (localmente na IDE Antigravity), sem depender de APIs externas ou bancos na nuvem.
- **Interface**: Design Glassmorphism, premium, limpo e adaptado tanto para celular quanto para desktop.

🚫 5. Limites e Fora de Escopo
- NÃO faremos sistema de login ou contas de usuário.
- NÃO criaremos relatórios complexos de meses anteriores (foco apenas no histórico simples e dia atual).
- NÃO utilizaremos frameworks pesados (React/Vue/Angular) — apenas HTML, CSS e JavaScript Vanilla.
- NÃO haverá integrações com Google Calendar ou outras ferramentas externas.

⚖️ 6. Mindset de Simplicidade (Karpathy Style)
Este projeto segue a Regra 80/20: 80% do valor operacional será entregue com 20% do código.
- **Foco**: Um campo para selecionar/digitar a matéria, um seletor de tempo (ou cronômetro básico) e um contador visual que soma as horas estudadas hoje.

### 🛂 Instrução para a IA
"Antes de iniciar o desenvolvimento, leia este arquivo. Qualquer funcionalidade sugerida que fira os limites do Item 5 ou o Mindset do Item 6 deve ser descartada imediatamente."
