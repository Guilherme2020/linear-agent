import { describe, it, expect } from 'bun:test';

/**
 * Testes de listagem de issues via Linear MCP
 *
 * Execução: bun test tests/list-issues.test.ts
 */

const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID ?? '';

describe('Linear MCP — listar issues', () => {
  it('deve listar projetos do workspace', async () => {
    const result = (await callLinearTool('list_projects', {})) as {
      nodes?: Array<{ id: string; name: string }>;
    };

    expect(result).toBeDefined();
    expect(result.nodes).toBeDefined();
    expect(Array.isArray(result.nodes)).toBe(true);
    expect(result.nodes!.length).toBeGreaterThan(0);

    const firstProject = result.nodes![0];
    expect(firstProject.id).toBeDefined();
    expect(firstProject.name).toBeDefined();
  });

  it('deve listar issues de um time', async () => {
    const result = (await callLinearTool('list_issues', {
      teamId: LINEAR_TEAM_ID,
      first: 10
    })) as { nodes?: Array<{ id: string; title: string }> };

    expect(result).toBeDefined();
    expect(result.nodes).toBeDefined();
    expect(Array.isArray(result.nodes)).toBe(true);
  });

  it('deve listar issues com filtro de prioridade alta', async () => {
    const result = (await callLinearTool('list_issues', {
      teamId: LINEAR_TEAM_ID,
      filter: { priority: { in: [1, 2] } }, // urgent + high
      first: 20
    })) as { nodes?: Array<{ id: string; priority: number }> };

    expect(result).toBeDefined();
    expect(result.nodes).toBeDefined();

    // Todas as issues retornadas devem ter prioridade 1 ou 2
    result.nodes?.forEach(issue => {
      expect([1, 2]).toContain(issue.priority);
    });
  });

  it('deve listar times do workspace', async () => {
    const result = (await callLinearTool('list_teams', {})) as {
      nodes?: Array<{ id: string; name: string; key: string }>;
    };

    expect(result).toBeDefined();
    expect(result.nodes).toBeDefined();
    expect(result.nodes!.length).toBeGreaterThan(0);

    const firstTeam = result.nodes![0];
    expect(firstTeam.id).toBeDefined();
    expect(firstTeam.name).toBeDefined();
    expect(firstTeam.key).toBeDefined();
  });

  it('deve listar usuários do workspace', async () => {
    const result = (await callLinearTool('list_users', {})) as {
      nodes?: Array<{ id: string; name: string; email: string }>;
    };

    expect(result).toBeDefined();
    expect(result.nodes).toBeDefined();
    expect(result.nodes!.length).toBeGreaterThan(0);
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
