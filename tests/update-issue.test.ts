import { describe, it, expect, afterAll } from 'bun:test';

/**
 * Testes de atualização de issues via Linear MCP
 *
 * Execução: bun test tests/update-issue.test.ts
 */

const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID ?? '';
const createdIssueIds: string[] = [];

afterAll(async () => {
  // Cleanup: cancelar todas as issues criadas nos testes
  const cancelledId = await getCancelledStateId(LINEAR_TEAM_ID);
  for (const id of createdIssueIds) {
    await callLinearTool('update_issue', { id, stateId: cancelledId });
  }
});

describe('Linear MCP — atualizar issues', () => {
  it('deve atualizar a prioridade de uma issue', async () => {
    const issue = (await callLinearTool('create_issue', {
      title: '[TEST] Issue para atualizar prioridade',
      teamId: LINEAR_TEAM_ID,
      priority: 3 // Medium
    })) as { id: string; priority: number };

    createdIssueIds.push(issue.id);

    const updated = (await callLinearTool('update_issue', {
      id: issue.id,
      priority: 1 // Urgent
    })) as { id: string; priority: number };

    expect(updated.priority).toBe(1);
  });

  it('deve atualizar o título de uma issue', async () => {
    const issue = (await callLinearTool('create_issue', {
      title: '[TEST] Título original',
      teamId: LINEAR_TEAM_ID,
      priority: 4
    })) as { id: string; title: string };

    createdIssueIds.push(issue.id);

    const updated = (await callLinearTool('update_issue', {
      id: issue.id,
      title: '[TEST] Título atualizado'
    })) as { id: string; title: string };

    expect(updated.title).toBe('[TEST] Título atualizado');
  });

  it('deve mover issue para In Progress e verificar o estado', async () => {
    const issue = (await callLinearTool('create_issue', {
      title: '[TEST] Issue para mover de estado',
      teamId: LINEAR_TEAM_ID,
      priority: 2
    })) as { id: string };

    createdIssueIds.push(issue.id);

    // Buscar ID do estado "In Progress"
    const states = (await callLinearTool('list_issue_statuses', {
      teamId: LINEAR_TEAM_ID
    })) as { nodes?: Array<{ id: string; name: string }> };

    const inProgressState = states.nodes?.find(s =>
      s.name.toLowerCase().includes('progress')
    );

    if (!inProgressState) {
      console.warn("Estado 'In Progress' não encontrado — pulando verificação");
      return;
    }

    const updated = (await callLinearTool('update_issue', {
      id: issue.id,
      stateId: inProgressState.id
    })) as { id: string };

    const fetched = (await callLinearTool('get_issue', {
      id: updated.id
    })) as { id: string; state?: { name: string } };

    expect(fetched.state?.name.toLowerCase()).toContain('progress');
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

async function getCancelledStateId(teamId: string): Promise<string> {
  const states = (await callLinearTool('list_issue_statuses', { teamId })) as {
    nodes?: Array<{ id: string; name: string }>;
  };
  const cancelled = states.nodes?.find(s =>
    s.name.toLowerCase().includes('cancel')
  );
  return cancelled?.id ?? '';
}
