/**
 * Edge case: ištrinti komandą, kai yra lentų ir užduočių (kaskados).
 * Reikia veikiančio backend http://127.0.0.1:5001 (docker-compose up).
 * Naudoja Node 18 global fetch.
 */

const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:5001';

async function registerAndLogin() {
  const ts = Date.now();
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `cascade${ts}@example.com`,
      username: `cascade${ts}`,
      password: 'TestPass123',
      full_name: 'Cascade User'
    })
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Register failed: ${res.status}, body: ${text}`);
  }
  const data = await res.json();
  return data.token;
}

async function createTeamBoardTask(token) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
  const teamRes = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: `CascadeTeam-${Date.now()}` })
  });
  const teamData = await teamRes.json();
  const teamId = teamData.team.id;

  const boardRes = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: 'CascadeBoard' })
  });
  const board = await boardRes.json();

  const taskRes = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ board_id: board.id, title: 'Cascade Task' })
  });
  const task = await taskRes.json();

  return { headers, teamId, boardId: board.id, taskId: task.id };
}

async function run() {
  const token = await registerAndLogin();
  const { headers, teamId, boardId } = await createTeamBoardTask(token);

  const delRes = await fetch(`${baseUrl}/api/teams/${teamId}`, {
    method: 'DELETE',
    headers
  });
  if (delRes.status !== 200) {
    const text = await delRes.text();
    throw new Error(`Delete team failed: ${delRes.status}, body: ${text}`);
  }

  const boardsRes = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, {
    headers
  });
  if (boardsRes.status !== 404) {
    throw new Error(`Boards endpoint expected 404 after delete, got ${boardsRes.status}`);
  }

  const taskRes = await fetch(`${baseUrl}/api/tasks/board/${boardId}`, {
    headers
  });
  if (taskRes.status !== 404) {
    throw new Error(`Tasks by board expected 404 after delete, got ${taskRes.status}`);
  }

  console.log('Edge delete team cascade OK');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
