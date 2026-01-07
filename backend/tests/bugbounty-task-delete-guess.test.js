/**
 * Bug bounty: bandymas atspėti taskId ir ištrinti užduotį kitoje lentoje.
 * Tikimasi 403 (outsider negali trinti kitų komandų užduočių).
 * Naudoja API_BASE_URL (default: http://127.0.0.1:5001).
 */

const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:5001';

async function ensureStatus(res, allowed, context) {
  if (!allowed.includes(res.status)) {
    const body = await res.text();
    throw new Error(`${context} failed ${res.status}: ${body}`);
  }
}

async function registerUser(prefix) {
  const ts = Date.now();
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `${prefix}${ts}@example.com`,
      username: `${prefix}${ts}`,
      password: 'TestPass123',
      full_name: `${prefix} user`
    })
  });
  await ensureStatus(res, [201], 'Register');
  const data = await res.json();
  if (!data.token || !data.user?.id) throw new Error('Register response missing token/user');
  return { token: data.token, userId: data.user.id };
}

async function createTeamAndTask(headers) {
  // team
  const teamRes = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: `BugBountyTask-${Date.now()}` })
  });
  await ensureStatus(teamRes, [201], 'Create team');
  const teamData = await teamRes.json();
  const teamId = teamData.team?.id || teamData.id;

  // board
  const boardRes = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: 'Victim Board' })
  });
  await ensureStatus(boardRes, [201], 'Create board');
  const board = await boardRes.json();

  // task
  const taskRes = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ board_id: board.id, title: 'Secret Task' })
  });
  await ensureStatus(taskRes, [201], 'Create task');
  const task = await taskRes.json();

  return { teamId, boardId: board.id, taskId: task.id };
}

async function outsiderDelete(taskId, outsiderHeaders) {
  const res = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
    method: 'DELETE',
    headers: outsiderHeaders
  });
  if (res.status !== 403) {
    const body = await res.text();
    throw new Error(`Outsider delete expected 403, got ${res.status}: ${body}`);
  }
}

async function run() {
  const owner = await registerUser('bbtaskowner');
  const ownerHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${owner.token}`
  };
  const { teamId, boardId, taskId } = await createTeamAndTask(ownerHeaders);

  const outsider = await registerUser('bbtaskoutsider');
  const outsiderHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${outsider.token}`
  };

  await outsiderDelete(taskId, outsiderHeaders);

  console.log('Bug bounty: outsider cannot delete foreign task OK', {
    teamId,
    boardId,
    taskId,
    outsider: outsider.userId
  });
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
