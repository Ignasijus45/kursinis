/**
 * Edge case testai: tušti pavadinimai / privalomi laukai.
 * Reikia veikiančio backend http://localhost:5001 (docker-compose up).
 * Naudoja Node 18 global fetch.
 */

const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:5001';

async function registerAndLogin() {
  const unique = Date.now();
  const body = {
    email: `edge${unique}@example.com`,
    username: `edge${unique}`,
    password: 'TestPass123',
    full_name: 'Edge User'
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
  return { token: data.token, user: data.user };
}

async function createTeam(token) {
  const res = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name: `EdgeTeam-${Date.now()}` })
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

async function expect400(url, token, payload, label) {
  const res = await fetch(url, {
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
  const { token } = await registerAndLogin();

  // Team name required
  await expect400(
    `${baseUrl}/api/teams`,
    token,
    { name: '   ' },
    'Empty team name'
  );

  const teamId = await createTeam(token);

  // Board title required
  await expect400(
    `${baseUrl}/api/teams/${teamId}/boards`,
    token,
    { title: '' },
    'Empty board title'
  );

  const boardId = await createBoard(token, teamId, 'Valid Board');

  // Column title required
  await expect400(
    `${baseUrl}/api/columns`,
    token,
    { team_id: teamId, title: '   ' },
    'Empty column title'
  );

  // Task title required
  await expect400(
    `${baseUrl}/api/tasks`,
    token,
    { board_id: boardId, title: '' },
    'Empty task title'
  );

  console.log('Edge case empty-field tests OK');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
