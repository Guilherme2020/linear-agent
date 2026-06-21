import { describe, it, expect } from 'bun:test';
import { callLinearTool } from './helpers';

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

    await callLinearTool('update_issue', {
      id: issue.id,
      stateId: await getCancelledStateId(LINEAR_TEAM_ID)
    });
  });
});

async function getCancelledStateId(teamId: string): Promise<string> {
  const states = (await callLinearTool('list_issue_statuses', { teamId })) as {
    nodes?: Array<{ id: string; name: string }>;
  };
  const cancelled = states.nodes?.find(s =>
    s.name.toLowerCase().includes('cancel')
  );
  return cancelled?.id ?? '';
}
