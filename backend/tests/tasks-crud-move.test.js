/**
 * Tasks: CRUD + move (drag&drop endpoint).
 * Reikia veikiančio backend http://127.0.0.1:5001 (docker-compose up).
 */

const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:5001';

async function register() {
  const ts = Date.now();
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `tasks${ts}@example.com`,
      username: `tasks${ts}`,
      password: 'TestPass123',
      full_name: 'Tasks User'
    })
  });
  const data = await res.json();
  return data.token;
}

async function createTeamAndBoards(token) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
  const teamRes = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: `TaskTeam-${Date.now()}` })
  });
  const team = await teamRes.json();

  const board1 = await fetch(`${baseUrl}/api/teams/${team.team.id}/boards`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: 'Board A' })
  }).then((r) => r.json());

  const board2 = await fetch(`${baseUrl}/api/columns`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ team_id: team.team.id, title: 'Board B' })
  }).then((r) => r.json());

  return { headers, teamId: team.team.id, boardA: board1.id, boardB: board2.id };
}

async function run() {
  const token = await register();
  const { headers, boardA, boardB } = await createTeamAndBoards(token);

  // Create
  const createRes = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ board_id: boardA, title: 'My Task', description: 'Desc' })
  });
  if (createRes.status !== 201) {
    throw new Error(`Create failed: ${createRes.status}`);
  }
  const task = await createRes.json();

  // Read
  const getRes = await fetch(`${baseUrl}/api/tasks/${task.id}`, { headers });
  if (getRes.status !== 200) {
    throw new Error(`Get failed: ${getRes.status}`);
  }

  // Update
  const updateRes = await fetch(`${baseUrl}/api/tasks/${task.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ title: 'Updated Task', description: 'New Desc' })
  });
  if (updateRes.status !== 200) {
    throw new Error(`Update failed: ${updateRes.status}`);
  }

  // Move (drag&drop)
  const moveRes = await fetch(`${baseUrl}/api/tasks/${task.id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ board_id: boardB, position: 0 })
  });
  if (moveRes.status !== 200) {
    throw new Error(`Move failed: ${moveRes.status}`);
  }

  // Delete
  const delRes = await fetch(`${baseUrl}/api/tasks/${task.id}`, {
    method: 'DELETE',
    headers
  });
  if (delRes.status !== 200) {
    throw new Error(`Delete failed: ${delRes.status}`);
  }

  console.log('Tasks CRUD + move tests OK');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
