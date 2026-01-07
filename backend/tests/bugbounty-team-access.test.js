/**
 * Bug bounty: attempt to access kitos komandos duomenis pakeitus teamId URL'e.
 * Tikslas: narys iš kitos komandos turėtų gauti 403 (jokio duomenų nutekėjimo).
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

async function createTeam(headers) {
  const res = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: `BugBounty-${Date.now()}` })
  });
  await ensureStatus(res, [201], 'Create team');
  const data = await res.json();
  const teamId = data.team?.id || data.id;
  if (!teamId) throw new Error('Team ID missing');
  return teamId;
}

async function createBoard(headers, teamId) {
  const res = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: 'Private Board' })
  });
  await ensureStatus(res, [201], 'Create board');
  const board = await res.json();
  if (!board.id) throw new Error('Board ID missing');
  return board.id;
}

async function expectForbidden(headers, url, context) {
  const res = await fetch(url, { headers });
  if (res.status !== 403) {
    const body = await res.text();
    throw new Error(`${context} expected 403, got ${res.status}: ${body}`);
  }
}

async function run() {
  // Team A owner
  const ownerA = await registerUser('bba');
  const ownerHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ownerA.token}`
  };
  const teamAId = await createTeam(ownerHeaders);
  const boardAId = await createBoard(ownerHeaders, teamAId);

  // Outsider (Team B)
  const outsider = await registerUser('bbb');
  const outsiderHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${outsider.token}`
  };
  const teamBId = await createTeam(outsiderHeaders);

  // Outsider bando prie Team A resursų
  await expectForbidden(outsiderHeaders, `${baseUrl}/api/teams/${teamAId}/members`, 'Members list other team');
  await expectForbidden(outsiderHeaders, `${baseUrl}/api/teams/${teamAId}/boards`, 'Boards list other team');
  await expectForbidden(outsiderHeaders, `${baseUrl}/api/tasks/board/${boardAId}`, 'Board tasks other team');

  console.log('Bug bounty: teamId swap forbidden OK', { teamAId, teamBId, boardAId, outsider: outsider.userId });
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
