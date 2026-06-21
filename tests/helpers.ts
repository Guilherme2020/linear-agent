
const LINEAR_GQL = 'https://api.linear.app/graphql';


async function linearGql<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const apiKey = process.env.LINEAR_API_KEY ?? '';
  if (!apiKey) {
    throw new Error(
      'LINEAR_API_KEY is not set. Generate one at linear.app/settings/api and add it to .env'
    );
  }

  const response = await fetch(LINEAR_GQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`Linear GraphQL HTTP ${response.status}`);
  }

  const body = (await response.json()) as { data?: T; errors?: unknown[] };

  if (body.errors?.length) {
    throw new Error(
      `Linear GraphQL errors: ${JSON.stringify(body.errors)}`
    );
  }

  return body.data as T;
}


export async function callLinearTool(
  tool: string,
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  switch (tool) {
    case 'list_projects': {
      const data = await linearGql<{ projects: { nodes: unknown[] } }>(`
        query { projects { nodes { id name } } }
      `);
      return data.projects as unknown as Record<string, unknown>;
    }

    case 'list_issues': {
      const { teamId, first = 50, filter } = input as {
        teamId?: string;
        first?: number;
        filter?: Record<string, unknown>;
      };
      const teamFilter = teamId ? { team: { id: { eq: teamId } } } : {};
      const combined = { ...teamFilter, ...(filter ?? {}) };
      const data = await linearGql<{
        issues: { nodes: unknown[] };
      }>(
        `query($filter: IssueFilter, $first: Int) {
           issues(filter: $filter, first: $first) {
             nodes { id title priority branchName state { id name type } }
           }
         }`,
        { filter: combined, first }
      );
      return data.issues as unknown as Record<string, unknown>;
    }

    case 'list_teams': {
      const data = await linearGql<{ teams: { nodes: unknown[] } }>(`
        query { teams { nodes { id name key } } }
      `);
      return data.teams as unknown as Record<string, unknown>;
    }

    case 'list_users': {
      const data = await linearGql<{ users: { nodes: unknown[] } }>(`
        query { users { nodes { id name email } } }
      `);
      return data.users as unknown as Record<string, unknown>;
    }

    case 'list_issue_statuses': {
      const { teamId } = input as { teamId: string };
      const data = await linearGql<{
        team: { states: { nodes: unknown[] } };
      }>(
        `query($id: String!) {
           team(id: $id) { states { nodes { id name type } } }
         }`,
        { id: teamId }
      );
      return data.team.states as unknown as Record<string, unknown>;
    }

    case 'create_issue': {
      const data = await linearGql<{
        issueCreate: { issue: Record<string, unknown> };
      }>(
        `mutation($input: IssueCreateInput!) {
           issueCreate(input: $input) {
             issue { id title priority description }
           }
         }`,
        { input }
      );
      return data.issueCreate.issue;
    }

    case 'update_issue': {
      const { id, ...rest } = input as { id: string } & Record<string, unknown>;
      const data = await linearGql<{
        issueUpdate: { issue: Record<string, unknown> };
      }>(
        `mutation($id: String!, $input: IssueUpdateInput!) {
           issueUpdate(id: $id, input: $input) {
             issue { id title priority state { id name } }
           }
         }`,
        { id, input: rest }
      );
      return data.issueUpdate.issue;
    }

    case 'get_issue': {
      const { id } = input as { id: string };
      const data = await linearGql<{ issue: Record<string, unknown> }>(
        `query($id: String!) {
           issue(id: $id) { id title state { id name } }
         }`,
        { id }
      );
      return data.issue;
    }

    case 'create_comment': {
      const data = await linearGql<{
        commentCreate: { comment: Record<string, unknown> };
      }>(
        `mutation($input: CommentCreateInput!) {
           commentCreate(input: $input) {
             comment { id body }
           }
         }`,
        { input }
      );
      return data.commentCreate.comment;
    }

    default:
      throw new Error(`Unknown Linear tool: "${tool}"`);
  }
}


export async function callGitHubTool(
  tool: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const response = await fetch(
    `https://api.github.com/${getGitHubEndpoint(tool, input)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN ?? ''}`,
        Accept: 'application/vnd.github.v3+json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API ${tool} failed: HTTP ${response.status}`);
  }

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
