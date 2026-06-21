import { describe, it, expect } from 'bun:test';

/**
 * Testes de cruzamento Linear + GitHub
 *
 * Pré-requisito: issue no Linear com branchName preenchido
 *                e PR correspondente no GitHub
 *
 * Execução: bun test tests/linear-github-cross.test.ts
 */

const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID ?? '';
const GITHUB_OWNER = process.env.GITHUB_OWNER ?? '';
const GITHUB_REPO = process.env.GITHUB_REPO ?? '';

describe('Linear + GitHub — cruzamento de dados', () => {
  it('deve buscar issue no Linear e encontrar branch associado', async () => {
    // Buscar issues com branch associado
    const issues = (await callLinearTool('list_issues', {
      teamId: LINEAR_TEAM_ID,
      first: 10
    })) as {
      nodes?: Array<{ id: string; title: string; branchName?: string }>;
    };

    expect(issues.nodes).toBeDefined();

    // Pelo menos verificar que a listagem funciona
    expect(Array.isArray(issues.nodes)).toBe(true);
  });

  it('deve listar PRs abertos no GitHub', async () => {
    if (!GITHUB_OWNER || !GITHUB_REPO) {
      console.warn('GITHUB_OWNER ou GITHUB_REPO não configurado — pulando');
      return;
    }

    const prs = (await callGitHubTool('list_pull_requests', {
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      state: 'open'
    })) as Array<{ number: number; title: string; state: string }>;

    expect(Array.isArray(prs)).toBe(true);

    prs.forEach(pr => {
      expect(pr.number).toBeGreaterThan(0);
      expect(pr.state).toBe('open');
    });
  });

  it('deve detectar PR aberto para issue marcada como Done', async () => {
    if (!GITHUB_OWNER || !GITHUB_REPO) {
      console.warn('GITHUB_OWNER ou GITHUB_REPO não configurado — pulando');
      return;
    }

    // Buscar issues concluídas com branch name
    const issues = (await callLinearTool('list_issues', {
      teamId: LINEAR_TEAM_ID,
      filter: { state: { type: { eq: 'completed' } } },
      first: 5
    })) as {
      nodes?: Array<{ id: string; title: string; branchName?: string }>;
    };

    const issuesWithBranch = issues.nodes?.filter(i => i.branchName) ?? [];

    if (issuesWithBranch.length === 0) {
      console.warn(
        'Nenhuma issue concluída com branch — pulando verificação de inconsistência'
      );
      return;
    }

    // Para cada issue concluída com branch, verificar se há PR aberto
    for (const issue of issuesWithBranch.slice(0, 2)) {
      const prs = (await callGitHubTool('list_pull_requests', {
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        head: `${GITHUB_OWNER}:${issue.branchName}`,
        state: 'open'
      })) as Array<{ number: number; state: string }>;

      if (prs.length > 0) {
        // Inconsistência detectada: issue Done com PR aberto
        console.log(
          `⚠️ Inconsistência: issue "${issue.title}" está Done mas PR #${prs[0].number} está aberto`
        );
      }

      // O teste valida que a consulta cruzada funciona sem erros
      expect(Array.isArray(prs)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function callLinearTool(
  tool: string,
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const response = await fetch('https://mcp.linear.app/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LINEAR_API_TOKEN ?? ''}`
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: tool, arguments: input }
    })
  });

  const data = (await response.json()) as {
    result?: { content?: Array<{ text?: string }> };
  };
  const text = data.result?.content?.[0]?.text ?? '{}';
  return JSON.parse(text) as Record<string, unknown>;
}

async function callGitHubTool(
  tool: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const response = await fetch(
    `https://api.github.com/${getGitHubEndpoint(tool, input)}`,
    {
      headers: {
        Authorization: `Bearer ${
          process.env.GITHUB_PERSONAL_ACCESS_TOKEN ?? ''
        }`,
        Accept: 'application/vnd.github.v3+json'
      }
    }
  );

  return response.json();
}

function getGitHubEndpoint(
  tool: string,
  input: Record<string, unknown>
): string {
  const { owner, repo, state, head } = input as {
    owner: string;
    repo: string;
    state?: string;
    head?: string;
  };

  switch (tool) {
    case 'list_pull_requests': {
      const params = new URLSearchParams();
      if (state) params.set('state', state);
      if (head) params.set('head', head);
      return `repos/${owner}/${repo}/pulls?${params.toString()}`;
    }
    default:
      return `repos/${owner}/${repo}`;
  }
}
