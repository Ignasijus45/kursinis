/**
 * Teisių testas: ne narys bando pasiekti komandos lentas -> 403.
 * Reikia veikiančio backend http://127.0.0.1:5001 (docker-compose up).
 */

const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:5001';

async function register(email, username) {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      username,
      password: 'TestPass123',
      full_name: 'User'
    })
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Register failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return { token: data.token, user: data.user };
}

async function createTeamAndBoard(token) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
  const teamRes = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: `NonMember-${Date.now()}` })
  });
  if (teamRes.status !== 201) {
    const text = await teamRes.text();
    throw new Error(`Team create failed: ${teamRes.status} ${text}`);
  }
  const team = await teamRes.json();

  const boardRes = await fetch(`${baseUrl}/api/teams/${team.team.id}/boards`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: 'PrivateBoard' })
  });
  if (boardRes.status !== 201) {
    const text = await boardRes.text();
    throw new Error(`Board create failed: ${boardRes.status} ${text}`);
  }

  return team.team.id;
}

async function run() {
  const ownerEmail = `owner${Date.now()}@example.com`;
  const memberEmail = `other${Date.now()}@example.com`;

  const owner = await register(ownerEmail, ownerEmail);
  const other = await register(memberEmail, memberEmail);

  const teamId = await createTeamAndBoard(owner.token);

  const resp = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, {
    headers: {
      Authorization: `Bearer ${other.token}`
    }
  });

  if (resp.status !== 403) {
    const text = await resp.text();
    throw new Error(`Non-member expected 403, got ${resp.status}, body: ${text}`);
  }

  console.log('Edge team non-member board access OK');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
