# Arquitetura — Linear Agent

## Visão geral

O Linear Agent é um agente conversacional no WhatsApp que gerencia o Linear e o GitHub via linguagem natural. A arquitetura é composta por três camadas independentes que se comunicam via eventos NATS JetStream.

```
┌──────────────────────────────────────────────────────────────────┐
│  USUÁRIO                                                         │
│  WhatsApp (celular)                                              │
└────────────────────────────┬─────────────────────────────────────┘
                             │ mensagem
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  CAMADA 1 — CANAL                                                │
│  Omni + Baileys                                                  │
│                                                                  │
│  • Recebe mensagem via protocolo WhatsApp Web (Baileys)          │
│  • Verifica allowlist de números autorizados                     │
│  • Normaliza evento: {from, chatId, text, media, timestamp}      │
│  • Publica no NATS JetStream                                     │
│    subject: omni.message.<instance-id>.<chat-hash>              │
│  • Gerencia presença ("digitando...") e chunking de respostas    │
│  • Entrega resposta de volta ao WhatsApp                         │
└────────────────────────────┬─────────────────────────────────────┘
                             │ NATS JetStream
                             │ subject: omni.message.*
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  CAMADA 2 — ORQUESTRAÇÃO                                         │
│  Genie + Claude Code                                             │
│                                                                  │
│  • Bridge NATS consome eventos do Omni                           │
│  • Genie resolve agente pelo provider nats-genie                 │
│  • Carrega AGENTS.md como --append-system-prompt-file            │
│  • Spawna/retoma sessão Claude Code por chat (per_chat)          │
│  • Claude processa mensagem com contexto da conversa             │
│  • Decide quais tools chamar (Linear MCP, GitHub MCP)            │
│  • Publica resposta no NATS                                      │
│    subject: omni.reply.<instance-id>.<chat-hash>                │
│  • Estado persistido em PostgreSQL via pgserve                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │ MCP (HTTP remoto)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  CAMADA 3 — CAPACIDADES                                          │
│  Linear MCP + GitHub MCP                                         │
│                                                                  │
│  Linear MCP (38 tools) — https://mcp.linear.app/mcp             │
│  • Issues: create, update, get, list                             │
│  • Comments: create, list                                        │
│  • Projects: create, get, list, update                           │
│  • Cycles, Teams, Users, Documents                               │
│                                                                  │
│  GitHub MCP (26 tools)                                           │
│  • Pull requests: list, get, create, merge                       │
│  • Reviews: list, create, submit                                 │
│  • Check runs (CI): list, get                                    │
│  • Issues, branches, repositories                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## Fluxo detalhado de uma mensagem

```
1. Usuário: "lista minhas tasks abertas"
   └── WhatsApp → Baileys (Omni)

2. Omni verifica allowlist
   └── 558699999999 está autorizado? Sim → continua
   └── Não autorizado → Access denied (silencioso)

3. Omni normaliza e publica no NATS
   └── subject: omni.message.347dc74e.ff3da5bc
   └── payload: { from, chatId, text: "lista minhas tasks abertas", ... }

4. Bridge Genie consome o evento NATS
   └── Resolve provider: nats-genie → agente linear-agent
   └── Retoma sessão Claude Code existente (per_chat strategy)

5. Claude Code processa
   └── System prompt: conteúdo do AGENTS.md
   └── Histórico da conversa (contexto da sessão)
   └── Mensagem do usuário
   └── Decide: chamar list_issues com assignee="me", state="started"

6. Tool call: Linear MCP
   └── GET https://mcp.linear.app/mcp
   └── tool: list_issues { assignee: "me", states: ["started", "unstarted"] }
   └── Retorna: lista de issues com título, status, prioridade

7. Claude formula resposta
   └── Sem markdown (WhatsApp não renderiza)
   └── Max 5 items, oferece "ver mais"
   └── Emojis para status

8. Genie publica resposta no NATS
   └── subject: omni.reply.347dc74e.ff3da5bc

9. Omni recebe e envia pelo WhatsApp
   └── Chunking automático se > 4096 chars
   └── Typing indicator antes de cada chunk
```

---

## Fluxo de cruzamento Linear + GitHub

```
Usuário: "qual o status do PR da NEX-123?"

1. Claude chama get_issue(id: "NEX-123")
   └── Retorna: { branchName: "feat/login-auth", status: "In Progress", ... }

2. Claude chama list_pull_requests(head: "feat/login-auth")
   └── Retorna: { number: 47, state: "open", reviews: [...], checks: [...] }

3. Claude analisa:
   └── Task: In Progress ✓
   └── PR: aberto, 1 review aprovado, 1 pendente, CI passando

4. Resposta:
   "PR #47 da NEX-123 está aberto.
    Reviews: João aprovou ✅, Maria ainda não revisou ⏳
    CI: passando ✅
    Quer que eu notifique a Maria?"
```

---

## Decisões arquiteturais

### 1. Por que Genie + Omni em vez de construir do zero?

As duas ferramentas resolvem os problemas mais difíceis sem código custom:

- **Omni/Baileys:** protocolo WhatsApp Web (engenharia reversa complexa), reconexão automática, múltiplos dispositivos, identity graph
- **Genie:** ciclo de vida de agentes, sessões por chat, contexto persistente, auto-resume em falhas, OTLP/observabilidade
- **NATS JetStream:** event bus com replay, dead-letters, backpressure

O foco vai para o que diferencia o produto: o agente e suas ferramentas.

### 2. Por que MCP remoto para o Linear?

O Linear disponibiliza MCP oficial em `https://mcp.linear.app/mcp` com OAuth 2.1. Vantagens:

- Sem servidor local para manter
- 38 tools prontas, mantidas pela Linear
- Autenticação OAuth segura (token não fica em arquivo)
- Adiciona em um comando: `claude mcp add --transport http linear https://mcp.linear.app/mcp`

### 3. Por que Linear + GitHub juntos?

O fluxo real de engenharia é linear: task no Linear → código → PR → review → merge → fecha a task. Um agente que só gerencia o Linear resolve metade do problema. Com GitHub MCP, o agente:

- Cruza status da task com estado do PR
- Detecta inconsistências (task Done com PR aberto)
- Notifica quando PR recebe review ou CI falha
- Fecha tasks automaticamente quando PR é mergeado

### 4. Por que `per_chat` como session strategy?

O Omni suporta `per_user`, `per_chat` e `per_user_per_chat`. O `per_chat` mantém contexto separado por conversa — se o mesmo usuário fala com o agente em dois contextos diferentes (DM e grupo), cada um tem sua própria sessão e histórico. Isso evita vazamento de contexto entre conversas.

### 5. Por que allowlist em vez de blocklist?

Com blocklist, qualquer novo número desconhecido acessa o agente por padrão. Com allowlist, só números explicitamente autorizados passam. Para um agente com acesso a sistemas de gestão reais (Linear, GitHub), o padrão seguro é deny-by-default.

### 6. Por que `--permission-mode acceptEdits` no spawn?

O modo `acceptEdits` permite que o agente execute tool calls sem pedir confirmação manual a cada chamada, mantendo o fluxo conversacional fluido. O controle de ações destrutivas é feito no `AGENTS.md` via confirmação explícita do usuário ("Vou cancelar a NEX-123. Confirma?"), não via permissão do sistema.

### 7. Por que PostgreSQL + NATS como backbone?

O Genie v4 migrou de "JSON files + NATS" (v3) para PostgreSQL + LISTEN/NOTIFY. O Postgres serve como:

- State store para wishes, sessões e workers
- Coordenador de concorrência via advisory locks
- Event bus real-time via LISTEN/NOTIFY

O NATS JetStream (Omni) é separado e serve para mensagens de canal — com replay, dead-letters e backpressure que o Postgres não oferece para esse caso de uso.

---

## Componentes e portas

| Serviço        | PM2 Name      | Porta | Responsabilidade                           |
| -------------- | ------------- | ----- | ------------------------------------------ |
| PostgreSQL     | autopg-server | 5432  | Estado do Genie (sessões, workers, wishes) |
| PostgreSQL UI  | autopg-ui     | 8433  | Admin do banco (browser)                   |
| Omni API       | omni-api      | 8882  | API REST + dispatcher de eventos           |
| NATS JetStream | omni-nats     | 4222  | Event bus entre Omni e Genie               |
| Genie serve    | (processo)    | —     | Bridge NATS + scheduler + inbox            |
| Claude Code    | (tmux pane)   | —     | Agente em execução                         |

---

## Observabilidade

O Genie exporta traces via **OTLP** (`OTEL_EXPORTER_OTLP_ENDPOINT`), incluindo:

- Cada tool call com latência e resultado
- Custo estimado por token
- Sessão e contexto do agente
- Hooks de PreToolUse e PostToolUse

O Omni registra em `~/.omni/logs/`:

- `omni-api-out.log` — eventos processados, dispatches, respostas
- `omni-api-error.log` — falhas, timeouts, erros de provider

Dead-letters (eventos que falharam após retries) ficam acessíveis via:

```bash
omni events list --type "*.failed"
omni dead-letters list
```
