# 📊 SCHEMA.md: Constituição dos Dados e Contratos de API (Zeca)

## 📑 1. Identificação do Modelo

**Projeto:** Zeca — Rastreador de Tempo de Estudo Offline-First  
**Arquiteta de Dados:** Ana (Backend / Armazenamento)  
**Revisora:** Maria (Conformidade/Privacidade)  
**Versão:** 2.0 (Híbrida - SQLite & localStorage)  

---

## 🏛️ 2. Entidades e Estrutura no SQLite (Tabela estudos)

*Estes são os campos persistidos no banco local `database.db` por Ana.*

### 📋 Tabela: `estudos`

| Campo | Tipo | Restrição | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | Primary Key | ID único (gerado via UUID/Timestamp no frontend ou UUID no backend). |
| `subject` | TEXT | Not Null | Nome da matéria ou atividade (ex: "Programação"). |
| `duration` | INTEGER | Not Null / > 0 | Duração da sessão de estudo em **minutos**. |
| `date` | TEXT | Not Null / YYYY-MM-DD | Data local de gravação. |
| `timestamp` | TEXT | Default: CURRENT_TIMESTAMP | Data e hora em formato ISO do registro. |

---

## 🏛️ 3. Entidades e Estrutura no localStorage (Fallback/Failover)

*Utilizado como failover resiliente se o servidor Flask estiver inacessível.*

### 🔑 Chave: `zeca_study_sessions`
Lista contendo os registros consolidados de estudo (mesma estrutura que a tabela SQLite).

### 🔑 Chave: `zeca_timer_state`
Estado atual do cronômetro para manter a contagem após recarregar a página.

---

## 📜 4. Contratos de API (JSON is Law)

### 📥 1. Registro de Tempo (`POST /api/registrar_tempo`)
Envia uma nova sessão de estudo para gravação.

**Request Payload:**
```json
{
  "id": "session-1718042400000",
  "subject": "Programação",
  "duration": 45,
  "date": "2026-06-10",
  "timestamp": "2026-06-10T17:40:00.000Z"
}
```

**Response (Status 201):**
```json
{
  "status": "success",
  "message": "Minutos computados e salvos no database.db",
  "data": {
    "id": "session-1718042400000",
    "subject": "Programação",
    "duration": 45
  }
}
```

### 📤 2. Resumo Diário (`GET /api/resumo_diario`)
Obtém todos os registros e estatísticas agregadas do dia local atual.

**Response (Status 200):**
```json
{
  "status": "success",
  "date": "2026-06-10",
  "sessions": [
    {
      "id": "session-1718042400000",
      "subject": "Programação",
      "duration": 45,
      "date": "2026-06-10",
      "timestamp": "2026-06-10T17:40:00.000Z"
    }
  ]
}
```

### 🗑️ 3. Exclusão de Registro (`POST /api/excluir_tempo`)
Deleta uma sessão de estudo específica.

**Request Payload:**
```json
{
  "id": "session-1718042400000"
}
```

**Response (Status 200):**
```json
{
  "status": "success",
  "message": "Registro removido com sucesso."
}
```

---

## 🛡️ 5. Regras de Integridade e Validação

1. **Validação de Duração**: O campo `duration` deve ser um número inteiro estritamente positivo (maior que zero).
2. **Preenchimento Obrigatório**: O campo `subject` não pode ser vazio ou conter apenas espaços.
3. **Privacidade**: Não há qualquer persistência de dados pessoais (PII), respeitando o princípio de minimização por design.
