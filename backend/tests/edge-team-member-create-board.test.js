/**
 * Teisių testas: komandos narys (ne OWNER) bando kurti komandos lentą -> 403.
 * Reikia veikiančio backend http://127.0.0.1:5001 (docker-compose up).
 */

const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:5001';

async function registerUser(prefix) {
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
    body: JSON.stringify({ name: `OwnerTeam-${Date.now()}` })
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Create team failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.team.id;
}

async function addMember(token, teamId, userId) {
  const res = await fetch(`${baseUrl}/api/teams/${teamId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ user_id: userId, role: 'MEMBER' })
  });
  if (res.status !== 201 && res.status !== 200) {
    const text = await res.text();
    throw new Error(`Invite failed: ${res.status} ${text}`);
  }
}

async function run() {
  const owner = await registerUser('owner');
  const member = await registerUser('member');

  const teamId = await createTeam(owner.token);
  await addMember(owner.token, teamId, member.user.id);

  const resp = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${member.token}`
    },
    body: JSON.stringify({ title: 'MemberBoard' })
  });

  if (resp.status !== 403) {
    const text = await resp.text();
    throw new Error(`Member board create expected 403, got ${resp.status}, body: ${text}`);
  }

  console.log('Edge member create team board -> 403 OK');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
