# Linear MCP — Referência de Tools

> Documentação das 38 tools disponíveis no Linear MCP oficial.
> Endpoint: `https://mcp.linear.app/mcp` (HTTP, OAuth 2.1)
> Autenticação: `claude mcp add --transport http linear https://mcp.linear.app/mcp`

---

## Issues

### `create_issue`

Cria uma nova issue no Linear.

| Parâmetro     | Tipo     | Obrigatório | Descrição                                      |
| ------------- | -------- | ----------- | ---------------------------------------------- |
| `title`       | string   | ✅          | Título da issue                                |
| `teamId`      | string   | ✅          | ID do time                                     |
| `description` | string   | —           | Descrição em markdown                          |
| `priority`    | number   | —           | 0=nenhuma, 1=urgente, 2=alta, 3=média, 4=baixa |
| `assigneeId`  | string   | —           | ID do usuário responsável                      |
| `stateId`     | string   | —           | ID do status                                   |
| `labelIds`    | string[] | —           | IDs dos labels                                 |
| `projectId`   | string   | —           | ID do projeto                                  |
| `cycleId`     | string   | —           | ID do ciclo (sprint)                           |
| `dueDate`     | string   | —           | Data de entrega (ISO 8601)                     |
| `estimate`    | number   | —           | Estimativa em pontos                           |

---

### `update_issue`

Atualiza uma issue existente. Todos os campos são opcionais.

| Parâmetro     | Tipo     | Descrição            |
| ------------- | -------- | -------------------- |
| `id`          | string   | ID da issue ✅       |
| `title`       | string   | Novo título          |
| `description` | string   | Nova descrição       |
| `priority`    | number   | Nova prioridade      |
| `stateId`     | string   | Novo status          |
| `assigneeId`  | string   | Novo responsável     |
| `labelIds`    | string[] | Novos labels         |
| `projectId`   | string   | Mover para projeto   |
| `cycleId`     | string   | Mover para ciclo     |
| `dueDate`     | string   | Nova data de entrega |
| `estimate`    | number   | Nova estimativa      |

---

### `get_issue`

Retorna detalhes completos de uma issue por ID.

**Retorna:** id, title, description, state, priority, assignee, labels, project, cycle, branchName, url, createdAt, updatedAt, attachments.

> O campo `branchName` é usado para cruzar com PRs no GitHub.

---

### `list_issues`

Lista issues com filtros opcionais.

| Parâmetro    | Tipo   | Descrição                                                   |
| ------------ | ------ | ----------------------------------------------------------- |
| `teamId`     | string | Filtrar por time                                            |
| `assigneeId` | string | Filtrar por responsável (`"me"` para o usuário autenticado) |
| `projectId`  | string | Filtrar por projeto                                         |
| `cycleId`    | string | Filtrar por ciclo                                           |
| `filter`     | object | Filtros avançados (estado, prioridade, labels, datas)       |
| `first`      | number | Limite de resultados (padrão: 50)                           |
| `after`      | string | Cursor para paginação                                       |
| `orderBy`    | string | `createdAt`, `updatedAt`, `priority`                        |

---

### `get_issue_status`

Retorna detalhes de um status (estado) de issue por nome ou ID.

---

### `list_issue_statuses`

Lista os estados disponíveis de um time (Backlog, Todo, In Progress, In Review, Done, Cancelled, etc.).

**Parâmetro:** `teamId` (string)

---

### `create_issue_label`

Cria um novo label de issue no workspace.

| Parâmetro | Tipo   | Descrição                                     |
| --------- | ------ | --------------------------------------------- |
| `name`    | string | Nome do label ✅                              |
| `color`   | string | Cor em hexadecimal                            |
| `teamId`  | string | Time (opcional, cria no workspace se omitido) |

---

### `list_issue_labels`

Lista os labels disponíveis no workspace ou em um time específico.

---

## Comentários

### `create_comment`

Adiciona um comentário a uma issue.

| Parâmetro | Tipo   | Descrição               |
| --------- | ------ | ----------------------- |
| `issueId` | string | ID da issue ✅          |
| `body`    | string | Conteúdo em markdown ✅ |

---

### `list_comments`

Lista comentários de uma issue.

**Parâmetro:** `issueId` (string)

---

## Projetos

### `create_project`

Cria um novo projeto no Linear.

| Parâmetro     | Tipo     | Descrição                                                              |
| ------------- | -------- | ---------------------------------------------------------------------- |
| `name`        | string   | Nome do projeto ✅                                                     |
| `teamIds`     | string[] | Times associados ✅                                                    |
| `description` | string   | Descrição                                                              |
| `status`      | string   | `backlog`, `planned`, `inProgress`, `paused`, `completed`, `cancelled` |
| `targetDate`  | string   | Data alvo                                                              |
| `leadId`      | string   | ID do responsável                                                      |

---

### `get_project`

Retorna detalhes de um projeto por ID.

---

### `update_project`

Atualiza um projeto existente.

---

### `list_projects`

Lista projetos do workspace com filtros opcionais.

| Parâmetro | Tipo   | Descrição                 |
| --------- | ------ | ------------------------- |
| `teamId`  | string | Filtrar por time          |
| `filter`  | object | Filtros por status, datas |
| `first`   | number | Limite                    |

---

### `list_project_labels`

Lista os labels de projeto disponíveis.

---

## Documentos

### `create_document`

Cria um novo documento no Linear (ex: PRD, spec técnica).

| Parâmetro   | Tipo   | Descrição               |
| ----------- | ------ | ----------------------- |
| `title`     | string | Título ✅               |
| `content`   | string | Conteúdo em markdown ✅ |
| `projectId` | string | Projeto associado       |

---

### `get_document`

Retorna um documento por ID ou slug.

> Usado pelo agente para ler PRDs e gerar tasks automaticamente.

---

### `update_document`

Atualiza um documento existente.

---

### `list_documents`

Lista documentos do workspace com filtros.

| Parâmetro   | Tipo   | Descrição           |
| ----------- | ------ | ------------------- |
| `projectId` | string | Filtrar por projeto |
| `filter`    | object | Filtros adicionais  |
| `first`     | number | Limite              |

---

## Ciclos (Sprints)

### `list_cycles`

Lista os ciclos de um time.

**Parâmetro:** `teamId` (string)

**Retorna:** id, name, number, startsAt, endsAt, status (active, completed, future).

> Para encontrar o ciclo atual, filtre por `status: "active"`.

---

## Times e usuários

### `get_team`

Retorna detalhes de um time por ID.

---

### `list_teams`

Lista todos os times do workspace.

**Retorna:** id, name, key (ex: "NEX"), description, members.

---

### `get_user`

Retorna detalhes de um usuário por ID.

---

### `list_users`

Lista usuários do workspace.

**Retorna:** id, name, email, displayName, avatarUrl, active.

> Para usar `"me"` como assignee em `list_issues`, o usuário autenticado via OAuth é resolvido automaticamente.

---

### `search_documentation`

Busca na documentação do Linear para aprender sobre features da plataforma.

**Parâmetro:** `query` (string)

---

## Prioridades — referência rápida

| Valor | Significado    |
| ----- | -------------- |
| 0     | Sem prioridade |
| 1     | Urgente        |
| 2     | Alta           |
| 3     | Média          |
| 4     | Baixa          |

---

## Exemplos de uso pelo agente

**Criar task com contexto completo:**

```
create_issue({
  title: "Implementar autenticação JWT",
  teamId: "NEX",
  priority: 2,
  description: "Implementar auth com refresh token. Ver PRD do projeto Backend Core.",
  labelIds: ["backend", "p0"]
})
```

**Listar minhas tasks abertas:**

```
list_issues({
  assigneeId: "me",
  filter: { state: { type: { in: ["started", "unstarted"] } } },
  orderBy: "priority",
  first: 5
})
```

**Cruzar com GitHub — buscar branch da issue:**

```
get_issue({ id: "NEX-123" })
// retorna branchName: "feat/jwt-auth"
// agente usa o branchName para buscar PR no GitHub MCP
```
