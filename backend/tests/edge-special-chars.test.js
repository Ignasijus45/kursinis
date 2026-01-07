/**
 * Edge case testai: specialūs simboliai / emoji pavadinimuose.
 * Reikia veikiančio backend http://127.0.0.1:5001 (docker-compose up).
 * Naudoja Node 18 global fetch.
 */

const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:5001';
const EMOJI = '🚀 Team Šą';
const EMOJI_BOARD = '🗂️ Backlog ✅';
const EMOJI_COLUMN = '✨ Doing ✅';
const EMOJI_TASK = '📌 Užduotis 😊';

async function registerAndLogin() {
  const ts = Date.now();
  const body = {
    email: `special${ts}@example.com`,
    username: `special${ts}`,
    password: 'TestPass123',
    full_name: 'Special User'
  };

  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Register failed: ${res.status}, body: ${text}`);
  }
  const data = await res.json();
  return data.token;
}

async function createTeam(token, name) {
  const res = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name })
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Create team failed: ${res.status}, body: ${text}`);
  }
  const data = await res.json();
  return data.team.id;
}

async function createBoard(token, teamId, title) {
  const res = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title })
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Create board failed: ${res.status}, body: ${text}`);
  }
  const data = await res.json();
  return data.id;
}

async function createColumn(token, teamId, title) {
  const res = await fetch(`${baseUrl}/api/columns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ team_id: teamId, title })
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Create column failed: ${res.status}, body: ${text}`);
  }
  const data = await res.json();
  return data.id;
}

async function createTask(token, boardId, title) {
  const res = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ board_id: boardId, title })
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Create task failed: ${res.status}, body: ${text}`);
  }
  const data = await res.json();
  return data.id;
}

async function run() {
  const token = await registerAndLogin();
  const teamId = await createTeam(token, EMOJI);
  const boardId = await createBoard(token, teamId, EMOJI_BOARD);
  await createColumn(token, teamId, EMOJI_COLUMN);
  await createTask(token, boardId, EMOJI_TASK);
  console.log('Edge special-chars tests OK');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
