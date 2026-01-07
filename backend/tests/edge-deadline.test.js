/**
 * Edge case: deadline/due_date praeityje ar neteisingas formatas.
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
      email: `deadline${ts}@example.com`,
      username: `deadline${ts}`,
      password: 'TestPass123',
      full_name: 'Deadline User'
    })
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Register failed: ${res.status}, body: ${text}`);
  }
  const data = await res.json();
  return data.token;
}

async function createTeam(token) {
  const res = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name: `DeadlineTeam-${Date.now()}` })
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Create team failed: ${res.status}, body: ${text}`);
  }
  const data = await res.json();
  return data.team.id;
}

async function createBoard(token, teamId) {
  const res = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title: 'Backlog' })
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Create board failed: ${res.status}, body: ${text}`);
  }
  const data = await res.json();
  return data.id;
}

async function expect400Task(token, boardId, payload, label) {
  const res = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (res.status !== 400) {
    const text = await res.text();
    throw new Error(`${label} expected 400, got ${res.status}, body: ${text}`);
  }
}

async function run() {
  const token = await registerAndLogin();
  const teamId = await createTeam(token);
  const boardId = await createBoard(token, teamId);

  // Vakar (UTC)
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Neteisingas formatas
  await expect400Task(
    token,
    boardId,
    { board_id: boardId, title: 'Bad date', deadline: 'not-a-date' },
    'Invalid date format'
  );

  // Praeities data
  await expect400Task(
    token,
    boardId,
    { board_id: boardId, title: 'Past deadline', deadline: pastDate },
    'Past deadline'
  );

  console.log('Edge deadline tests OK');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
