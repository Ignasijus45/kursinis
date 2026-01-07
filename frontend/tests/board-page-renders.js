/**
 * Board page data test: ensures boards and their tasks are returned for rendering.
 * Uses API_BASE_URL (default: http://127.0.0.1:5001).
 */

const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:5001';

async function ensureStatus(res, allowed, context) {
  if (!allowed.includes(res.status)) {
    const body = await res.text();
    throw new Error(`${context} failed ${res.status}: ${body}`);
  }
}

async function registerUser() {
  const ts = Date.now();
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `boardpage${ts}@example.com`,
      username: `boardpage${ts}`,
      password: 'TestPass123',
      full_name: 'Board Page User'
    })
  });
  await ensureStatus(res, [201], 'Register');
  const data = await res.json();
  if (!data.token) {
    throw new Error('Register response missing token');
  }
  return data.token;
}

async function createTeam(token) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
  const res = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: `BoardPageTeam-${Date.now()}` })
  });
  await ensureStatus(res, [201], 'Create team');
  const data = await res.json();
  const teamId = data.team?.id || data.id;
  if (!teamId) throw new Error('Team ID missing in response');
  return { headers, teamId };
}

async function createBoard(headers, teamId) {
  const res = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: 'Board Page Column' })
  });
  await ensureStatus(res, [201], 'Create board');
  const board = await res.json();
  if (!board.id) throw new Error('Board ID missing in response');
  return board.id;
}

async function createTask(headers, boardId) {
  const res = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ board_id: boardId, title: 'Render Task', description: 'Should show on board' })
  });
  await ensureStatus(res, [201], 'Create task');
  const task = await res.json();
  if (!task.id) throw new Error('Task ID missing in response');
  return task.id;
}

async function verifyBoards(headers, teamId, boardId) {
  const res = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, { headers });
  await ensureStatus(res, [200], 'List boards');
  const boards = await res.json();
  if (!Array.isArray(boards) || !boards.some((b) => b.id === boardId)) {
    throw new Error('Created board not returned in boards list');
  }
}

async function verifyTasks(headers, boardId, taskId) {
  const res = await fetch(`${baseUrl}/api/tasks/board/${boardId}`, { headers });
  await ensureStatus(res, [200], 'List tasks');
  const tasks = await res.json();
  if (!Array.isArray(tasks) || !tasks.some((t) => t.id === taskId)) {
    throw new Error('Created task not returned for board');
  }
}

async function run() {
  const token = await registerUser();
  const { headers, teamId } = await createTeam(token);
  const boardId = await createBoard(headers, teamId);
  const taskId = await createTask(headers, boardId);

  await verifyBoards(headers, teamId, boardId);
  await verifyTasks(headers, boardId, taskId);

  console.log('Board page data OK:', { teamId, boardId, taskId });
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
