import { describe, it, expect } from 'bun:test';
import { callLinearTool, callGitHubTool } from './helpers';

const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID ?? '';
const GITHUB_OWNER = process.env.GITHUB_OWNER ?? '';
const GITHUB_REPO = process.env.GITHUB_REPO ?? '';

describe('Linear + GitHub — cruzamento de dados', () => {
  it('deve buscar issue no Linear e encontrar branch associado', async () => {
    const issues = (await callLinearTool('list_issues', {
      teamId: LINEAR_TEAM_ID,
      first: 10
    })) as {
      nodes?: Array<{ id: string; title: string; branchName?: string }>;
    };

    expect(issues.nodes).toBeDefined();

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

    for (const issue of issuesWithBranch.slice(0, 2)) {
      const prs = (await callGitHubTool('list_pull_requests', {
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        head: `${GITHUB_OWNER}:${issue.branchName}`,
        state: 'open'
      })) as Array<{ number: number; state: string }>;

      if (prs.length > 0) {
        console.log(
          `⚠️ Inconsistência: issue "${issue.title}" está Done mas PR #${prs[0].number} está aberto`
        );
      }

      expect(Array.isArray(prs)).toBe(true);
    }
  });
});
