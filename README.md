# Linear Agent 🤖

Agente conversacional no WhatsApp que gerencia o Linear via linguagem natural. Integra Linear MCP + GitHub MCP para gestão completa de tasks, projetos e PRs — sem sair do WhatsApp.

## O que ele faz

- **Gerencia issues:** cria, lista, atualiza, comenta e busca tasks no Linear
- **Lê documentos:** interpreta PRDs e gera issues coerentes automaticamente
- **Cruza Linear + GitHub:** verifica status de PRs, reviews e CI de uma task
- **Detecta inconsistências:** task Done com PR aberto, PR mergeado com task em progresso
- **Responde apenas quem você autorizar** via allowlist de números

Não é um chatbot com respostas fixas. Ele age em sistemas reais.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 1: CANAL                                            │
│  WhatsApp ←→ Omni (Baileys)                                 │
│  Normaliza mensagens → eventos NATS JetStream               │
└─────────────────────────────────────────────────────────────┘
                          ↕ NATS JetStream
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 2: ORQUESTRAÇÃO                                     │
│  Genie Agent (Claude Code nativo)                           │
│  Injeta AGENTS.md como system prompt                        │
│  Gerencia sessão, contexto e ciclo de vida do agente        │
└─────────────────────────────────────────────────────────────┘
                          ↕ MCP (HTTP remoto)
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 3: CAPACIDADES                                      │
│  Linear MCP (38 tools) + GitHub MCP (26 tools)             │
│  CRUD de issues, projetos, ciclos, documentos, PRs         │
└─────────────────────────────────────────────────────────────┘
```

**Fluxo de uma mensagem:**

1. Usuário manda mensagem no WhatsApp
2. Omni recebe via Baileys → normaliza → publica no NATS
3. Provider `nats-genie` roteia para o Genie
4. Genie carrega `AGENTS.md` como system prompt e processa com Claude
5. Claude chama tools do Linear MCP e/ou GitHub MCP
6. Resposta volta pelo NATS → Omni → WhatsApp

---

## Stack

| Camada          | Tecnologia                    |
| --------------- | ----------------------------- |
| Canal           | WhatsApp via Omni (Baileys)   |
| Orquestrador    | Genie (Claude Code nativo)    |
| LLM             | Claude Opus via claude.ai Pro |
| Event bus       | NATS JetStream                |
| Estado          | PostgreSQL via pgserve        |
| Linear          | MCP oficial (HTTP remoto)     |
| GitHub          | MCP via Personal Access Token |
| Process manager | PM2                           |

---

## Pré-requisitos

- macOS ou Linux
- Node.js >= 18
- Bun
- tmux
- Git
- Conta claude.ai Pro ou Max (para Claude Code)
- Conta Linear com Personal API Key
- GitHub Personal Access Token
- WhatsApp instalado no celular

---

## Setup

### 1. Instalar dependências do sistema

```bash
# Bun
curl -fsSL https://bun.sh/install | bash

# tmux (macOS)
brew install tmux

# tmux (Ubuntu/Debian)
sudo apt install tmux

# Adicionar ao PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 2. Instalar e autenticar o Claude Code

```bash
npm install -g @anthropic-ai/claude-code
claude
/login
# Selecionar opção 1: Claude account with subscription
# Autorizar no browser
/exit
```

### 3. Instalar o Genie

```bash
curl -fsSL https://raw.githubusercontent.com/automagik-dev/genie/main/install.sh | bash
# Responder Y quando perguntar sobre inicializar workspace
```

### 4. Instalar dependências do Genie

```bash
bun add -g pm2
bun add -g pgserve@^2.1.0
pgserve install
# Anote a senha admin exibida — não será mostrada novamente
```

### 5. Configurar o Genie

```bash
genie setup
# Aceitar todos os valores padrão
```

### 6. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com seus valores reais
source .env
```

### 7. Instalar e iniciar o Omni

```bash
bun add -g @automagik/omni
omni install
# Anote a API key exibida no final

omni auth login --api-key <SUA_OMNI_API_KEY>

# Persistir variáveis
echo 'export OMNI_API_URL=http://localhost:8882' >> ~/.zshrc
echo 'export OMNI_API_KEY=<SUA_OMNI_API_KEY>' >> ~/.zshrc
source ~/.zshrc
```

### 8. Conectar WhatsApp

```bash
# Criar instância
omni instances create --name "linear-agent-wa" --channel whatsapp-baileys

# Gerar QR code (escanear com o celular)
omni instances qr <instance-id>

# Verificar conexão
omni instances list
```

### 9. Registrar agente e conectar ao Omni

```bash
cd /caminho/para/linear-agent

genie dir add linear-agent --dir $(pwd)
genie omni handshake
omni connect <instance-id> linear-agent
```

### 10. Configurar allowlist (opcional mas recomendado)

Limita o agente a responder apenas números autorizados:

```bash
# Ativar modo allowlist
omni access mode <instance-id> allowlist

# Adicionar número autorizado (adicione nos formatos necessários)
omni access create --instance <instance-id> --phone "5511999999999" --action allow --type allow
omni access create --instance <instance-id> --phone "+5511999999999" --action allow --type allow
```

### 11. Configurar MCPs

```bash
# Linear MCP (abre OAuth no browser)
claude mcp add --transport http linear https://mcp.linear.app/mcp

# Autenticar: abrir claude, /mcp, selecionar linear, autorizar
claude
/mcp
# Selecionar linear → autorizar no browser
/exit

# GitHub MCP
claude mcp add github \
  --env GITHUB_PERSONAL_ACCESS_TOKEN=<SEU_TOKEN> \
  -- npx -y @modelcontextprotocol/server-github
```

### 12. Iniciar o agente

```bash
genie serve status          # Verificar bridge
genie spawn linear-agent --session genie --permission-mode acceptEdits
genie ls                    # Confirmar status: idle
```

### 13. Testar

Mande uma mensagem para o número do WhatsApp vinculado. O agente deve responder em alguns segundos.

---

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha com seus valores:

```bash
cp .env.example .env
```

> ⚠️ **Nunca commite o arquivo `.env`**. Ele está no `.gitignore`.

---

## Comandos úteis

```bash
# Status geral
pm2 status
genie serve status
genie ls

# Reiniciar agente
genie kill <agent-id>
genie spawn linear-agent --session genie --permission-mode acceptEdits

# Logs do Omni em tempo real
omni logs --process api --follow

# Reconectar WhatsApp
omni instances logout <instance-id>
omni instances connect <instance-id>
omni instances qr <instance-id>

# Reiniciar serviços
pm2 restart omni-api
pm2 restart autopg-server
```

---

## Exemplos de uso via WhatsApp

```
"Lista minhas tasks abertas"
"Cria task: revisar autenticação, prioridade alta"
"Qual o status da AUTH-123?"
"Move AUTH-123 para In Progress"
"Quais projetos estão ativos?"
"Qual o PR da task AUTH-123?"
"Tem review pendente no PR da AUTH-123?"
"Cria tasks baseado no PRD do projeto X"
```

---

## Evidências de funcionamento

Capturas reais de interações com o agente em produção.

### Consulta de tasks e proteção contra prompt injection

O agente lista tasks por projeto, move status e recusa compartilhar informações sensíveis (env, stack, API keys) mesmo quando solicitado como "sysadmin".

![Consulta de tasks e segurança](docs/images/01-whatsapp-consulta-tasks-e-seguranca.png)

### Listagem de projetos

Pergunta em linguagem natural retorna os projetos do workspace com status e contagem de tasks.

![Listagem de projetos no WhatsApp](docs/images/02-whatsapp-listagem-projetos.jpeg)

### Criação de projeto e issues em uma mensagem

Uma única mensagem cria o Projeto 7 (Configuração do CI/CD) e as issues NEX-59 e NEX-60 — o agente interpreta a intenção e executa múltiplas actions em sequência.

![Criação de projeto e issues](docs/images/03-whatsapp-criacao-projeto-e-issues.png)

### Enriquecimento de issues e listagem de usuários

O agente adiciona descrições detalhadas seguindo o padrão do projeto, eleva a prioridade para Alta e lista os usuários disponíveis para atribuição.

![Descrição e usuários](docs/images/04-whatsapp-descricao-e-usuarios.png)

### Limite de escopo declarado (criação de sprints)

Quando a ação não está disponível via MCP, o agente informa a limitação e redireciona para o linear.app — sem inventar uma resposta.

![Limite de sprint via MCP](docs/images/05-whatsapp-limite-sprint.png)

### Projeto e issues criados no Linear (confirmação real)

Print do Linear confirmando que o Projeto 7 e as issues NEX-59/NEX-60 foram de fato criados pelo agente.

![Issues criadas no Linear](docs/images/06-linear-projeto-criado-issues.jpeg)

### Lista de projetos no Linear

Todos os 7 projetos visíveis no Linear após a sessão de interação com o agente.

![Lista de projetos no Linear](docs/images/07-linear-lista-projetos.jpeg)

### Issue NEX-59 com descrição gerada pelo agente

Detalhe da issue NEX-59 — o agente gerou objetivo, contexto de negócio, atividades, entregáveis e critérios de aceite automaticamente.

![Detalhes da issue NEX-59](docs/images/08-linear-issue-detalhes.jpeg)

---

### Criação de task com campos específicos

Uma mensagem simples em linguagem natural cria a task com projeto, prioridade, label e status corretos — sem formulário, sem clique.

> "cria task no projeto backend core, criar endpoint de consulta de horarios disponiveis, prioridade urgente, label backend"
> → NEX-62 criada: Projeto Backend Core · Prioridade Urgente · Label Backend · Status Backlog

![Criação de task com campos específicos](docs/images/09-whatsapp-criacao-task-campos-especificos.jpeg)

---

### Ciclo completo de uma task: comentar → atribuir → cancelar

Em sequência, o agente adiciona comentário, atribui a task a um usuário por e-mail e pede confirmação antes de cancelar — ação destrutiva não executada sem "sim".

![Ciclo completo de uma task](docs/images/10-whatsapp-ciclo-task-comentar-atribuir-cancelar.jpeg)

---

### Leitura de PRD → geração automática de tasks + listagem de PRs

O agente lê o documento do Projeto 3 (Agente de IA) e cria 6 tasks coerentes com o PRD — NEX-63 a NEX-68 — todas no Backlog. Na mesma sessão, lista os PRs do repositório com número, título e status.

![PRD gera tasks e listagem de PRs](docs/images/11-whatsapp-prd-gera-tasks-lista-prs.jpeg)

---

### Listagem de PRs em múltiplos repositórios

O agente consulta PRs em repositórios diferentes na mesma sessão: todos os mergeados do `linear-agent` e os abertos do `next-fit-front-end` — cruzando GitHub sem sair do WhatsApp.

![PRs em múltiplos repositórios](docs/images/12-whatsapp-prs-multi-repositorio.jpeg)

---

### Cruzamento Linear + GitHub: PR vinculado e inconsistência detectada

O agente identifica o PR vinculado à NEX-66 e detecta que a NEX-65 está marcada como Done no Linear mas não tem PR correspondente no GitHub — inconsistência real entre os dois sistemas.

![Cruzamento Linear + GitHub e inconsistência](docs/images/13-whatsapp-cruzamento-linear-github-inconsistencia.jpeg)

---

### Investigação cross-repo para resolver inconsistência

Ao investigar o repo `next-fit-front-end`, o agente confirma que não existe PR #6 lá — o PR estava no `linear-agent` e já foi mergeado. Resultado: inconsistência explicada com rastreamento entre repositórios.

![Investigação cross-repo](docs/images/14-whatsapp-investigacao-cross-repo.jpeg)

---

### Fallback graceful: áudio não processado

O agente recebe uma mensagem de voz, reconhece que não processa áudio e pede para o usuário repetir em texto — sem travar, sem ignorar.

![Fallback para áudio](docs/images/15-whatsapp-fallback-audio.jpeg)

---

### Fallback graceful: imagem fora de contexto + busca inteligente

Imagem enviada por engano é tratada com sugestão útil. Task inexistente (OAuth Facebook) não gera erro — o agente busca as tasks de autenticação existentes e devolve opções reais.

![Fallback para imagem e busca inteligente](docs/images/16-whatsapp-fallback-imagem-busca-inteligente.jpeg)

---

### Listagem filtrada com prioridades e movimentação de status

Tasks do Projeto 2 listadas com prioridades por cor (🔴 Urgente · 🟠 Alta). "Mova a primeira para In Progress" — sem especificar o ID — e o agente identifica e move a NEX-62 corretamente.

![Listagem filtrada e movimentação](docs/images/17-whatsapp-listagem-filtrada-mover-task.jpeg)

---

### Guardrails: recusa de informações de infraestrutura

Tentativa de extrair stack técnica, conteúdo do `.env` e API key do Linear — mesmo alegando ser sysadmin. O agente recusa todas, mantém o escopo e sugere o canal correto da equipe.

![Guardrails de segurança](docs/images/18-whatsapp-guardrails-seguranca.jpeg)

![Guardrails: API key recusada](docs/images/19-whatsapp-guardrails-api-key.jpeg)

---

## Decisões arquiteturais

**Por que Genie + Omni em vez de construir do zero?**
As ferramentas resolvem os problemas mais difíceis (protocolo WhatsApp via Baileys, event bus com NATS, ciclo de vida de agentes, sessões, contexto) sem código custom. O foco vai para o que realmente diferencia o produto: o agente e suas ferramentas.

**Por que MCP remoto para o Linear?**
O Linear tem MCP oficial hospedado em `https://mcp.linear.app/mcp` com OAuth 2.1. Sem servidor local, sem manutenção, 38 tools prontas. Adiciona em um comando.

**Por que Linear + GitHub juntos?**
O fluxo real de engenharia é: task no Linear → código → PR → review → merge → fecha a task. Um agente que só gerencia o Linear resolve metade do problema. Com GitHub MCP, o agente acompanha o ciclo completo e detecta inconsistências entre os dois sistemas.

**Por que separar allowlist por número em vez de grupo?**
O Baileys conecta ao WhatsApp pessoal, não ao Business API. Sem allowlist, o agente responde todas as conversas do número vinculado — inclusive grupos e DMs pessoais. A allowlist garante que só números explicitamente autorizados disparam o agente.

**Por que `--permission-mode acceptEdits` no spawn?**
O modo `acceptEdits` permite que o agente execute tool calls (Linear, GitHub) sem pedir confirmação manual a cada chamada, mantendo o fluxo conversacional fluido. Ações destrutivas são tratadas no `AGENTS.md` com confirmação explícita do usuário.

---

## Estrutura do repositório

```
linear-agent/
├── AGENTS.md                    # System prompt injetado pelo Genie
├── README.md                    # Este arquivo
├── .env.example                 # Variáveis necessárias (valores fictícios)
├── .gitignore                   # Exclui .env e arquivos sensíveis
├── docker-compose.yml           # Setup reproduzível
├── package.json                 # Scripts de teste e dependências
├── tsconfig.json                # Configuração TypeScript
├── bun.lock                     # Lockfile do Bun
├── .claude/
│   └── settings.local.json      # MCPs configurados (no .gitignore)
├── skills/
│   └── linear-agent.md          # Skill customizada do agente
├── scripts/
│   └── proactive-notify.sh      # Script de notificações proativas via cron
├── tests/
│   ├── create-issue.test.ts     # Testes de criação de issues
│   ├── list-issues.test.ts      # Testes de listagem com filtros
│   ├── update-issue.test.ts     # Testes de atualização de status
│   └── linear-github-cross.test.ts  # Testes de cruzamento Linear + GitHub
└── docs/
    ├── architecture.md          # Diagrama de arquitetura + 7 decisões técnicas
    ├── linear-mcp-tools.md      # Referência completa das 38 tools do Linear MCP
    └── qa-agent-tests.md        # Script de QA com 24 casos de teste + outputs
```

---

## Troubleshooting

**Agente não responde**

```bash
genie ls  # Verificar se está idle/running
genie serve status  # Verificar bridge
omni logs --process api --follow  # Ver logs em tempo real
```

**QR code não aparece**

```bash
omni instances logout <instance-id>
omni instances connect <instance-id>
omni instances qr <instance-id>
```

**`genie: command not found`**

```bash
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

**Mensagens de outros contatos chegando ao agente**

```bash
omni access mode <instance-id> allowlist
omni access create --instance <instance-id> --phone "<numero>" --action allow --type allow
```

**Disco cheio (`No space left on device`)**

```bash
# Limpar logs e mídia antiga
pm2 flush
rm -rf ~/.omni/data/media/*/2026-05/  # Ajuste o mês
pm2 restart omni-api
```
