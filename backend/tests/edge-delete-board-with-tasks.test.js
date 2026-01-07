/**
 * Edge: trinti stulpelį (board) su užduotimis – kaskada ar blokas.
 * Tikslas: DELETE /columns/:id turi pašalinti board ir jo tasks (be siurprizų 500).
 * Naudoja API_BASE_URL (default: http://127.0.0.1:5001).
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
      email: `delboard${ts}@example.com`,
      username: `delboard${ts}`,
      password: 'TestPass123',
      full_name: 'Delete Board User'
    })
  });
  await ensureStatus(res, [201], 'Register');
  const data = await res.json();
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`
    }
  };
}

async function setupData(headers) {
  const teamRes = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: `DelBoard-${Date.now()}` })
  });
  await ensureStatus(teamRes, [201], 'Create team');
  const team = await teamRes.json();
  const teamId = team.team?.id || team.id;

  const boardRes = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: 'Board with tasks' })
  });
  await ensureStatus(boardRes, [201], 'Create board');
  const board = await boardRes.json();

  // Add two tasks
  for (let i = 0; i < 2; i++) {
    const tRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ board_id: board.id, title: `Task ${i}` })
    });
    await ensureStatus(tRes, [201], `Create task ${i}`);
  }

  return { teamId, boardId: board.id };
}

async function deleteBoard(headers, boardId) {
  const res = await fetch(`${baseUrl}/api/columns/${boardId}`, {
    method: 'DELETE',
    headers
  });
  await ensureStatus(res, [200], 'Delete board');
}

async function expect404Tasks(headers, boardId) {
  const res = await fetch(`${baseUrl}/api/tasks/board/${boardId}`, { headers });
  if (res.status !== 404) {
    const body = await res.text();
    throw new Error(`Expected 404 after board delete, got ${res.status}: ${body}`);
  }
}

async function run() {
  const { headers } = await registerUser();
  const { boardId } = await setupData(headers);

  await deleteBoard(headers, boardId);
  await expect404Tasks(headers, boardId);

  console.log('Delete board with tasks OK', { boardId });
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
