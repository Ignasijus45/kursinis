/**
 * Teisių testai: create / invite / remove (member vs owner).
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
    const text = await res.text();
    throw new Error(`Register failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return { token: data.token, user: data.user };
}

async function createTeam(ownerToken) {
  const res = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`
    },
    body: JSON.stringify({ name: `PermTeam-${Date.now()}` })
  });
  const data = await res.json();
  return data.team.id;
}

async function invite(ownerToken, teamId, userId, role = 'MEMBER') {
  const res = await fetch(`${baseUrl}/api/teams/${teamId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`
    },
    body: JSON.stringify({ user_id: userId, role })
  });
  return res.status;
}

async function remove(ownerToken, teamId, userId) {
  const res = await fetch(`${baseUrl}/api/teams/${teamId}/members/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${ownerToken}`
    }
  });
  return res.status;
}

async function run() {
  const owner = await register('ownerPerm');
  const member = await register('memberPerm');
  const outsider = await register('outsiderPerm');

  const teamId = await createTeam(owner.token);

  // Non-owner cannot invite
  const inviteByMember = await fetch(`${baseUrl}/api/teams/${teamId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${member.token}`
    },
    body: JSON.stringify({ user_id: outsider.user.id, role: 'MEMBER' })
  });
  if (inviteByMember.status !== 403) {
    const text = await inviteByMember.text();
    throw new Error(`Member invite expected 403, got ${inviteByMember.status}, body: ${text}`);
  }

  // Owner invites member
  const statusInvite = await invite(owner.token, teamId, member.user.id);
  if (statusInvite !== 201 && statusInvite !== 200) {
    throw new Error(`Owner invite failed: ${statusInvite}`);
  }

  // Member cannot remove another member
  const removeByMember = await fetch(`${baseUrl}/api/teams/${teamId}/members/${owner.user.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${member.token}` }
  });
  if (removeByMember.status !== 403) {
    const text = await removeByMember.text();
    throw new Error(`Member remove expected 403, got ${removeByMember.status}, body: ${text}`);
  }

  // Owner removes member (should be 200)
  const statusRemove = await remove(owner.token, teamId, member.user.id);
  if (statusRemove !== 200) {
    throw new Error(`Owner remove failed: ${statusRemove}`);
  }

  console.log('Team perms create/invite/remove tests OK');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
