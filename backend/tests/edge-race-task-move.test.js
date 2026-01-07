/**
 * Edge: greitas keliskartinis task move (spam drag).
 * Tikriname, kad galutinis position atitiktų paskutinę užklausą ir tvarka nelūžta.
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
      email: `racemove${ts}@example.com`,
      username: `racemove${ts}`,
      password: 'TestPass123',
      full_name: 'Race Move User'
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
    body: JSON.stringify({ name: `RaceTeam-${Date.now()}` })
  });
  await ensureStatus(teamRes, [201], 'Create team');
  const team = await teamRes.json();
  const teamId = team.team?.id || team.id;

  const boardA = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: 'Board A' })
  }).then(async (r) => {
    await ensureStatus(r, [201], 'Create board A');
    return r.json();
  });

  const boardB = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: 'Board B' })
  }).then(async (r) => {
    await ensureStatus(r, [201], 'Create board B');
    return r.json();
  });

  const task = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ board_id: boardA.id, title: 'Race task' })
  }).then(async (r) => {
    await ensureStatus(r, [201], 'Create task');
    return r.json();
  });

  return { boardA: boardA.id, boardB: boardB.id, taskId: task.id, teamId };
}

async function moveTask(headers, taskId, boardId, position) {
  const res = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ board_id: boardId, position })
  });
  await ensureStatus(res, [200], `Move to ${boardId}/${position}`);
  return res.json();
}

async function listBoard(headers, boardId) {
  const res = await fetch(`${baseUrl}/api/tasks/board/${boardId}`, { headers });
  await ensureStatus(res, [200], 'List board');
  return res.json();
}

async function run() {
  const { headers } = await registerUser();
  const { boardA, boardB, taskId } = await setupData(headers);

  // Du greiti move: A->B poz0, tada B->A poz0 (paskutinis turėtų galioti)
  await Promise.all([
    moveTask(headers, taskId, boardB, 0),
    moveTask(headers, taskId, boardA, 0)
  ]);

  // Patikrinam, kad taskas atgal Board A ir position = 0
  const tasksA = await listBoard(headers, boardA);
  const found = tasksA.find((t) => t.id === taskId);
  if (!found) {
    throw new Error('Task nerastas Board A po race move');
  }
  if (found.position !== 0) {
    throw new Error(`Neteisinga pozicija: ${found.position} (turi būti 0)`);
  }

  console.log('Edge race move OK', { boardA, boardB, taskId });
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
