/**
 * Teisių testas: komandos narys bando pašalinti kitą narį -> 403.
 * Reikia veikiančio backend http://127.0.0.1:5001 (docker-compose up).
 */

const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:5001';

async function register(prefix) {
  const ts = Date.now() + Math.floor(Math.random() * 1000);
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `${prefix}${ts}@example.com`,
      username: `${prefix}${ts}`,
      password: 'TestPass123',
      full_name: `${prefix} User`
    })
  });
  if (res.status !== 201) {
    throw new Error(`Register failed: ${res.status}`);
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
    body: JSON.stringify({ name: `RemoveTest-${Date.now()}` })
  });
  const data = await res.json();
  return data.team.id;
}

async function invite(token, teamId, userId, role = 'MEMBER') {
  const res = await fetch(`${baseUrl}/api/teams/${teamId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ user_id: userId, role })
  });
  if (res.status !== 201 && res.status !== 200) {
    const text = await res.text();
    throw new Error(`Invite failed: ${res.status} ${text}`);
  }
}

async function run() {
  const owner = await register('owner');
  const memberA = await register('memberA');
  const memberB = await register('memberB');

  const teamId = await createTeam(owner.token);
  await invite(owner.token, teamId, memberA.user.id);
  await invite(owner.token, teamId, memberB.user.id);

  // memberA bando pašalinti memberB
  const resp = await fetch(`${baseUrl}/api/teams/${teamId}/members/${memberB.user.id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${memberA.token}`
    }
  });

  if (resp.status !== 403) {
    const text = await resp.text();
    throw new Error(`Member remove expected 403, got ${resp.status}, body: ${text}`);
  }

  // owner bando pašalinti save
  const respOwner = await fetch(`${baseUrl}/api/teams/${teamId}/members/${owner.user.id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${owner.token}`
    }
  });
  if (respOwner.status !== 400 && respOwner.status !== 403) {
    const text = await respOwner.text();
    throw new Error(`Owner self-remove expected 400/403, got ${respOwner.status}, body: ${text}`);
  }

  console.log('Edge member remove member -> 403 OK');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
