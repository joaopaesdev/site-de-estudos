# 🧠 05-FINDINGS.md: Memória Técnica e Log de Autocura

## 🎯 1. Propósito e Uso

Este arquivo é o **Cérebro de Recuperação** do projeto. Sempre que ocorrer um erro de execução no backend em Python, bug visual no cronômetro ou inconsistência na soma das horas, o erro deve ser registrado aqui antes de solicitar a correção à IA.

**Protocolo de Autocura:**
1. Copie o erro/traceback do terminal ou console do navegador.
2. Cole na seção **"Log de Incidentes"** abaixo.
3. Invoque a IA com o comando: *"Analise os erros no FINDINGS.md, identifique a causa raiz e aplique uma correção cirúrgica no código"*.

## 📋 2. Log de Incidentes e Erros (The Log)

*Utilize esta tabela para registrar falhas técnicas e comportamentais da IA durante as sessões.*

| Data | Sessão | Descrição do Erro / Traceback | Causa Raiz | Correção Cirúrgica Aplicada |
|---|---|---|---|---|
| [Data] | [ID] | [Cole o erro aqui, ex: Cronômetro não salva] | [Ex: Alucinação de biblioteca] | [Resumo da mudança] |

## 🔬 3. Análise de Causa Raiz (Root Cause) e Padrões

*Espaço para documentar por que erros recorrentes estão acontecendo e evitar retrabalho.*
- **Padrão Detectado:** (Ex: A IA tenta resetar o banco de dados toda vez que a página recarrega).
- **Ação Preventiva:** (Ex: Reforçar a persistência via localStorage ou checagem de tabela existente no SQLite).

## 💡 4. Decisões Técnicas e Trade-offs (Findings)

*Conforme as Karpathy Guidelines ("Think Before Coding"), registre aqui as premissas assumidas antes de grandes mudanças.*
- **Decisão:** Armazenamento local / SQLite puro sem ORM.
  - **Justificativa:** Garantir latência zero, funcionamento offline e seguir a regra de simplicidade 80/20.
- **Decisão:** Design Glassmorphism Mobile & Desktop.
  - **Justificativa:** Foco em uma interface limpa que diminua a ansiedade e permita registrar o tempo de estudo em menos de 5 segundos.

## 🚧 5. Devedor Técnico e Lições Aprendidas

*O que ficou para as próximas versões do sistema ou o que aprendemos que não deve ser repetido.*
1. **Lição:** Nunca importar fontes ou estilos via CDN externa para manter o princípio **Offline-First**.
2. **Dívida:** Adicionar um sistema de metas diárias de estudo (ex: estudar 2h por dia) fica para a próxima versão (Fase de Evolução), mantendo o MVP focado apenas no registro simples.

### 🛂 Instrução para a IA
> *"Antes de cada correção, consulte as seções 2 e 4 deste arquivo para garantir que a nova solução não repita erros do passado e mantenha as decisões arquiteturais já validadas"*.
