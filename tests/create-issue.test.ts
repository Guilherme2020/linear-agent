import { describe, it, expect, beforeAll } from 'bun:test';

/**
 * Testes de criação de issues via Linear MCP
 *
 * Pré-requisito: ANTHROPIC_API_KEY ou sessão claude.ai Pro ativa
 * Execução: bun test tests/create-issue.test.ts
 */

const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID ?? '';

describe('Linear MCP — criar issues', () => {
  it('deve criar uma issue com título e prioridade', async () => {
    const result = await callLinearTool('create_issue', {
      title: '[TEST] Issue criada por teste automatizado',
      teamId: LINEAR_TEAM_ID,
      priority: 2 // High
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.title).toContain('[TEST]');
    expect(result.priority).toBe(2);

    // Cleanup
    await callLinearTool('update_issue', {
      id: result.id,
      stateId: await getCancelledStateId(LINEAR_TEAM_ID)
    });
  });

  it('deve criar uma issue com descrição e label', async () => {
    const result = await callLinearTool('create_issue', {
      title: '[TEST] Issue com descrição',
      teamId: LINEAR_TEAM_ID,
      description: 'Issue criada por teste automatizado. Pode ser deletada.',
      priority: 4 // Low
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.description).toContain('teste automatizado');

    // Cleanup
    await callLinearTool('update_issue', {
      id: result.id,
      stateId: await getCancelledStateId(LINEAR_TEAM_ID)
    });
  });

  it('deve criar uma issue e adicionar comentário', async () => {
    const issue = await callLinearTool('create_issue', {
      title: '[TEST] Issue com comentário',
      teamId: LINEAR_TEAM_ID,
      priority: 3
    });

    expect(issue.id).toBeDefined();

    const comment = await callLinearTool('create_comment', {
      issueId: issue.id,
      body: 'Comentário adicionado por teste automatizado.'
    });

    expect(comment).toBeDefined();
    expect(comment.id).toBeDefined();

    // Cleanup
    await callLinearTool('update_issue', {
      id: issue.id,
      stateId: await getCancelledStateId(LINEAR_TEAM_ID)
    });
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
