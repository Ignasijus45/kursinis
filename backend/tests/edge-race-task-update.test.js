/**
 * Edge case: greiti nuoseklūs/lyg ir konkuruojantys to paties task update.
 * Tikslas: nėra 500, o paskutinis atnaujinimas lieka.
 * Reikia veikiančio backend http://127.0.0.1:5001 (docker-compose up).
 */

const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:5001';

async function registerAndLogin() {
  const ts = Date.now();
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `race${ts}@example.com`,
      username: `race${ts}`,
      password: 'TestPass123',
      full_name: 'Race User'
    })
  });
  if (res.status !== 201) {
    throw new Error(`Register failed: ${res.status}`);
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
    body: JSON.stringify({ name: `RaceTeam-${Date.now()}` })
  });
  const team = await teamRes.json();
  const teamId = team.team.id;

  const boardRes = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: 'RaceBoard' })
  });
  const board = await boardRes.json();

  const taskRes = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ board_id: board.id, title: 'Initial' })
  });
  const task = await taskRes.json();
  return { headers, taskId: task.id };
}

async function run() {
  const token = await registerAndLogin();
  const { headers, taskId } = await createTeamBoardTask(token);

  // Siunčiame du update beveik tuo pačiu metu (nuosekliai be laukimo)
  const p1 = fetch(`${baseUrl}/api/tasks/${taskId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ title: 'Version A' })
  });
  const p2 = fetch(`${baseUrl}/api/tasks/${taskId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ title: 'Version B' })
  });

  const [r1, r2] = await Promise.all([p1, p2]);
  if (!r1.ok || !r2.ok) {
    throw new Error(`Updates failed: ${r1.status}/${r2.status}`);
  }

  const finalRes = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
    method: 'GET',
    headers
  });
  const final = await finalRes.json();
  if (final.title !== 'Version B') {
    throw new Error(`Race update failed, expected 'Version B', got '${final.title}'`);
  }

  console.log('Edge race task update OK');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
