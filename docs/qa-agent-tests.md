# QA — Linear Agent: Script de Testes

## Bloco 1 — Projetos e navegação no Linear

### T01 — Listar projetos

**Mensagem:** `liste meus projetos no linear`

Esperado: lista dos 6 projetos criados, com nome e status.

Output recebido:

```
[[21/06/26, 14:17:04] Amor Da Minha Vida: Liste meus projetos no linear
[21/06/26, 14:18:04] Guilherme: Encontrei seus projetos no Linear 🔍

1.⁠ ⁠✅ Projeto 6 — QA, Evals e Produção (Backlog)
2.⁠ ⁠☁️ Projeto 5 — Infraestrutura e DevOps (Backlog)
3.⁠ ⁠📊 Projeto 4 — CRM e Dashboard (Backlog)
4.⁠ ⁠🤖 Projeto 3 — Agente de IA (Backlog)
5.⁠ ⁠⚙️ Projeto 2 — Backend Core (Backlog)

Mostrando 5 de pelo menos 6. Quer ver mais ou detalhes de algum projeto específico?]
```

---

### T02 — Ver tasks de um projeto

**Mensagem:** `quais são as tasks do Projeto 1 — Discovery e Produto?`

Esperado: lista de issues do projeto com título e status.

Output recebido:

```
[[21/06/26, 14:22:01] Guilherme: Projeto 1 — Discovery e Produto tem 1 task:

🔍 NEX-5 — Épico 1: Discovery, fluxos e regras de negócio
Status: Backlog | Prioridade: Alta
Labels: Sprint 0, P0, MVP

Quer ver os detalhes dessa task ou criar novas?
[21/06/26, 14:23:37] Amor Da Minha Vida: Sim, quero ver detalhes
[21/06/26, 14:23:57] Guilherme: NEX-5 — Épico 1: Discovery, fluxos e regras de negócio

Status: Backlog | Prioridade: Alta (P0) | Sprint 0

Objetivo: Mapear o comportamento esperado do produto, definindo escopo, fluxos e regras de negócio antes do desenvolvimento.

Atividades principais:
•⁠  ⁠Definir jornada do lead e funil comercial
•⁠  ⁠Definir regras de agendamento e disponibilidade
•⁠  ⁠Definir políticas de WhatsApp (opt-in/opt-out, anti-spam)
•⁠  ⁠Definir eventos de CRM e métricas de sucesso
•⁠  ⁠Definir escopo do MVP

Entregáveis:
•⁠  ⁠Fluxo da conversa e de agendamento
•⁠  ⁠Modelo inicial de dados
•⁠  ⁠Regras de negócio e critérios de aceite
•⁠  ⁠Roadmap do MVP
]
```

---

### T03 — Ver tasks do sprint/ciclo atual

**Mensagem:** `o que está no ciclo atual?`

Esperado: lista de issues do ciclo ativo, ou mensagem informando que não há ciclo configurado.

Output recebido:

```
[21/06/26, 14:50:22] Amor Da Minha Vida: o que esta no ciclo atual ?
[21/06/26, 14:50:43] Guilherme: Não há nenhum ciclo (sprint) ativo no momento para o time NextFitPersonal.

Quer que eu crie um novo ciclo/sprint?
[21/06/26, 14:52:54] Amor Da Minha Vida: Sim, quero que crie
[21/06/26, 14:53:09] Guilherme: Infelizmente ainda não tenho permissão para criar ciclos diretamente via bot. 😅

Para criar um novo sprint, acesse o Linear em:
linear.app/next-fit-personal → seu time → Cycles → New cycle

Posso te ajudar com qualquer outra coisa: tasks, projetos, comentários, atribuições...

```

Status: ⚠️ parcial
Observação: Turno 1 correto (list_cycles funcionou).
Turno 2 incorreto — agente disse "não tenho permissão"
em vez de "create_cycle não está disponível no MCP".
Correção: adicionado limitações explícitas no AGENTS.md.

# Tools NÃO disponíveis no MCP oficial (não invente permissão — informe claramente):

# - create_cycle, update_cycle, delete_cycle

# - Ações administrativas (webhooks, configurações de time)

---

## Bloco 2 — Criação e atualização de issues

### T04 — Criar issue simples

**Mensagem:** `cria task: implementar autenticação JWT, prioridade alta`

Esperado: confirmação com ID gerado (ex: NEX-123) e título.

Output recebido:

```

[cole aqui]

```

---

### T05 — Criar issue com mais detalhes

**Mensagem:** `cria task no projeto Backend Core: criar endpoint de consulta de horários disponíveis, prioridade urgente, label Backend`

Esperado: issue criada no projeto correto com prioridade e label.

Output recebido:

```

[cole aqui]

```

---

### T06 — Atualizar status de uma issue

**Mensagem:** `move a [ID da task criada no T04] para In Progress`

Esperado: confirmação de atualização de status.

Output recebido:

```

[cole aqui]

```

---

### T07 — Adicionar comentário

**Mensagem:** `comenta na [ID da task do T04]: iniciando implementação, estimativa 2 dias`

Esperado: confirmação de comentário adicionado.

Output recebido:

```

[cole aqui]

```

---

### T08 — Atribuir task para usuário

**Mensagem:** `atribui a [ID da task do T04] para mim`

Esperado: confirmação de atribuição.

Output recebido:

```

[cole aqui]

```

---

### T09 — Ação destrutiva com confirmação

**Mensagem:** `cancela a [ID da task do T04]`

Esperado: agente pede confirmação antes de mover para Cancelled.

Output recebido:

```

[cole aqui]

```

---

### T10 — Confirmar ação destrutiva

**Mensagem:** `sim` (em resposta ao T09)

Esperado: agente move para Cancelled e confirma.

Output recebido:

```

[cole aqui]

```

---

## Bloco 3 — Leitura de documentos e geração de tasks

### T11 — Ler PRD e gerar tasks

**Mensagem:** `leia o PRD do Projeto 3 — Agente de IA e crie as tasks principais`

Esperado: agente lê o documento via Linear MCP e cria múltiplas issues coerentes com o conteúdo.

Output recebido:

```

[cole aqui]

```

---

## Bloco 4 — GitHub MCP

> Para estes testes você precisa de um repositório no GitHub com pelo menos um PR aberto.
> Crie um PR de teste em qualquer repo seu antes de executar.

### T12 — Listar PRs de um repositório

**Mensagem:** `liste os PRs abertos do repositório [nome-do-seu-repo]`

Esperado: lista de PRs com número, título e status.

Output recebido:

```

[cole aqui]

```

---

### T13 — Ver detalhes de um PR

**Mensagem:** `qual o status do PR #[número] do repositório [nome-do-repo]?`

Esperado: título, estado (open/closed/merged), reviews, CI status.

Output recebido:

```

[cole aqui]

```

---

### T14 — Ver reviews pendentes

**Mensagem:** `tem review pendente no PR #[número] do [nome-do-repo]?`

Esperado: lista de reviewers e status de cada review (aprovado, pendente, changes requested).

Output recebido:

```

[cole aqui]

```

---

### T15 — Aprovar um PR

**Mensagem:** `aprova o PR #[número] do repositório [nome-do-repo]`

Esperado: agente submete review de aprovação via GitHub MCP e confirma.

> ⚠️ Requer que o token do GitHub tenha permissão de write no repositório.

Output recebido:

```

[cole aqui]

```

---

### T16 — Dar merge em um PR

**Mensagem:** `dá merge no PR #[número] do repositório [nome-do-repo]`

Esperado: agente pede confirmação (ação irreversível), depois executa o merge.

> ⚠️ Requer que o token do GitHub tenha permissão de write e que o PR esteja aprovado.

Output recebido:

```

[cole aqui]

```

---

## Bloco 5 — Cruzamento Linear + GitHub

### T17 — Ver PR de uma task do Linear

**Mensagem:** `qual o PR da task [ID]?`

Esperado: agente busca o branch da issue no Linear e encontra o PR correspondente no GitHub.

> Para este teste funcionar: crie uma issue no Linear, crie uma branch com o mesmo nome no GitHub, abra um PR.

Output recebido:

```

[cole aqui]

```

---

### T18 — Detectar inconsistência

**Mensagem:** `a task [ID] está como Done mas o PR está aberto?`

Esperado: agente cruza os dois sistemas e informa a inconsistência se existir.

Output recebido:

```

[cole aqui]

```

---

## Bloco 6 — Fallbacks e edge cases

### T19 — Áudio

Envie um **áudio** de voz para o WhatsApp do agente.

Esperado:

> "Recebi um áudio, mas ainda não processo voz. Me manda em texto? 🎙️"

Output recebido:

```

[cole aqui]

```

---

### T20 — Imagem

Envie uma **imagem** (screenshot qualquer) para o WhatsApp do agente.

Esperado:

> "Recebi uma imagem! Se for screenshot de um bug ou task, descreve em texto que eu crio a issue..."

Output recebido:

```

[cole aqui]

```

---

### T21 — Comando ambíguo

**Mensagem:** `atualiza a task de autenticação`

Esperado: agente pergunta qual task (se houver mais de uma com "autenticação") ou pede o ID.

Output recebido:

```

[cole aqui]

```

---

### T22 — Issue inexistente

**Mensagem:** `qual o status da task NEX-9999?`

Esperado: agente informa que não encontrou a task e oferece alternativas.

Output recebido:

```

[cole aqui]

```

---

### T23 — Contexto entre mensagens

**Mensagem 1:** `quais tasks estão abertas no Projeto 2?`
_(aguarde a resposta)_
**Mensagem 2:** `move a primeira para In Progress`

Esperado: agente usa o contexto da mensagem anterior para identificar qual task mover.

Output recebido:

```

[cole aqui]

```

---

### T24 — Listagem longa

**Mensagem:** `lista todas as issues do workspace`

Esperado: agente retorna máximo 5 e oferece "ver mais".

Output recebido:

```

[cole aqui]

```

---

## Resumo dos resultados

| Teste | Descrição                           | Status |
| ----- | ----------------------------------- | ------ |
| T01   | Listar projetos                     | ⬜     |
| T02   | Tasks de um projeto                 | ⬜     |
| T03   | Ciclo atual                         | ⬜     |
| T04   | Criar issue simples                 | ⬜     |
| T05   | Criar issue com detalhes            | ⬜     |
| T06   | Atualizar status                    | ⬜     |
| T07   | Adicionar comentário                | ⬜     |
| T08   | Atribuir task                       | ⬜     |
| T09   | Ação destrutiva — pedir confirmação | ⬜     |
| T10   | Ação destrutiva — confirmar         | ⬜     |
| T11   | Ler PRD e gerar tasks               | ⬜     |
| T12   | Listar PRs do GitHub                | ⬜     |
| T13   | Detalhes de um PR                   | ⬜     |
| T14   | Reviews pendentes                   | ⬜     |
| T15   | Aprovar PR                          | ⬜     |
| T16   | Merge de PR                         | ⬜     |
| T17   | PR de uma task (Linear + GitHub)    | ⬜     |
| T18   | Detectar inconsistência             | ⬜     |
| T19   | Fallback áudio                      | ⬜     |
| T20   | Fallback imagem                     | ⬜     |
| T21   | Comando ambíguo                     | ⬜     |
| T22   | Issue inexistente                   | ⬜     |
| T23   | Contexto entre mensagens            | ⬜     |
| T24   | Listagem longa                      | ⬜     |

Legenda: ✅ passou · ❌ falhou · ⚠️ parcial · ⬜ não executado

```

```
