import { describe, it, expect } from 'bun:test';
import { callLinearTool } from './helpers';

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
      filter: { priority: { in: [1, 2] } },
      first: 20
    })) as { nodes?: Array<{ id: string; priority: number }> };

    expect(result).toBeDefined();
    expect(result.nodes).toBeDefined();

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
