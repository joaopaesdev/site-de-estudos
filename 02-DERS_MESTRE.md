# 📝 02-DERS_MESTRE.md: Especificação Mestre de Requisitos

## 📑 1. Identificação e Controle de Versão

- **Projeto:** Sistema de Registro e Monitoramento de Horas de Estudo Diário.
- **Versão:** 1.0 (Baseada no VEM).
- **Responsáveis:** Desenvolvedor Solo (Estudante).
- **Histórico:** Consolidação pós-North Star da dor de gestão de tempo.

## 🎯 2. Visão Geral e Escopo

- **Objetivo Central:** Fornecer uma interface ultra-rápida para registrar minutos dedicados a matérias específicas e visualizar o progresso acumulado do dia atual.
- **Público-Alvo:** **Eu (O Estudante)** que precisa de agilidade no registro e clareza visual para reduzir a ansiedade de produtividade.
- **Fora de Escopo:** Cadastro/Login de usuários, relatórios mensais complexos, integrações com calendários externos e uso de frameworks pesados (Princípio Karpathy contra o *bloat*).

## 👥 3. Requisitos de Usuário (RU)

*Descrições abstratas das necessidades, escritas em linguagem natural.*
- **RU01:** O estudante deseja registrar o tempo dedicado a uma matéria de forma manual ou via cronômetro em menos de 5 segundos.
- **RU02:** O estudante deseja ver um resumo gráfico ou visual claro do total de horas estudadas **hoje** assim que abrir o site.

## ⚙️ 4. Requisitos de Sistema (RS)

*Detalhamento técnico das funções para orientar a implementação pela IA.*
- **RS01:** O sistema deve validar se o tempo inserido manualmente é um número inteiro positivo (em minutos).
- **RS02:** O motor de persistência deve utilizar **SQLite** (via Python/Backend) ou **localStorage** local para garantir operação estável e offline.

## ✅ 5. Requisitos Funcionais (RF) e Priorização

*Funcionalidades específicas mapeadas por prioridade.*

| ID | Descrição do Requisito | Tipo | Prioridade | Critério de Aceite (Sucesso) |
|---|---|---|---|---|
| **RF01** | Formulário simples para selecionar/digitar a matéria e inserir o tempo de estudo. | RS | **Essencial** | Registro feito em < 5s e salvo localmente. |
| **RF02** | Exibição do total de horas/minutos acumulados **apenas no dia de hoje**, divididos por matéria. | RS | **Essencial** | Gráfico ou barras visuais atualizadas imediatamente após o registro. |
| **RF03** | Cronômetro simples (Play/Pause) integrado para contagem automática do tempo. | RS | **Importante** | Permite iniciar o tempo e, ao parar, envia os minutos acumulados direto para a matéria. |

> **Legenda de Prioridade:**
> - **Essencial:** Imprescindível para o funcionamento básico e resolução da dor (Regra 80/20).
> - **Importante:** O sistema opera sem ele (usando só input manual), mas melhora a experiência.
> - **Desejável:** Funcionalidades acessórias para versões futures.

## 📏 6. Regras de Negócio (RN)

*Restrições que controlam a operação e a integridade do sistema.*

| ID | Descrição da Regra | Requisito Relacionado |
|---|---|---|
| **RN01** | Se o usuário registrar tempo na mesma matéria várias vezes no mesmo dia, os minutos devem ser somados. | RF01, RF02 |
| **RN02** | O histórico visual principal deve resetar visualmente a cada novo dia (foco no progresso diário). | RF02 |

## 🛡️ 7. Requisitos Não Funcionais (RNF)

*Atributos de qualidade seguindo o modelo **FURPS**.*

| ID | Nome / Atributo | Categoria | Prioridade | Descrição Técnica |
|---|---|---|---|---|
| **RNF01** | Latência Zero | Performance | **Essencial** | Atualização dos componentes visuais em menos de 1s após salvar o tempo. |
| **RNF02** | Interface Premium | Usabilidade | **Essencial** | Design Glassmorphism moderno e limpo, focado em evitar distrações. |
| **RNF03** | Offline-First | Confiabilidade | **Essencial** | Funcionar 100% localmente na IDE Antigravity sem depender de internet. |

## ⚖️ 8. Diretrizes Karpathy de Implementação (VEM)

*Instruções comportamentais inegociáveis para a IA do Antigravity.*
1. **Pense antes de codar:** Escreva códigos modulares e limpos. Explicite suposições no FINDINGS.md.
2. **Simplicidade Radical:** Implementar o código mínimo (HTML/JS Vanilla + Python simples se necessário) para satisfazer o contrato de rastreamento.
3. **Mudanças Cirúrgicas:** Ao fazer correções na lógica do cronômetro ou persistência, altere estritamente as linhas afetadas.

## 🔗 9. Matriz de Rastreabilidade Simples

*Mapeamento para garantir que nenhum objetivo do North Star foi esquecido.*
- **RU01** → RF01, RF03, RN01, RNF01.
- **RU02** → RF02, RN02, RNF02, RS02.

**💡 Instrução para a IA:** Se durante o desenvolvimento for solicitada uma função que não esteja listada neste documento (como relatórios mensais, perfis de usuários ou metas complexas), você deve "empurrar de volta" (*push back*) citando a soberania do DERS e da Regra 80/20.
