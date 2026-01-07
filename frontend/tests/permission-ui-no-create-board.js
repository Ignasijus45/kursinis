/**
 * Permission/UI check: member should not be able to create a board (button hidden in UI logic).
 * Validates that membership data marks current user as MEMBER (not OWNER) and create board API returns 403.
 * Uses API_BASE_URL (default: http://127.0.0.1:5001).
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
    body: JSON.stringify({ name: `UI-Team-${Date.now()}` })
  });
  await ensureStatus(res, [201], 'Create team');
  const data = await res.json();
  const teamId = data.team?.id || data.id;
  if (!teamId) throw new Error('Team ID missing');
  return teamId;
}

async function inviteMember(headers, teamId, userId) {
  const res = await fetch(`${baseUrl}/api/teams/${teamId}/invite`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ user_id: userId, role: 'MEMBER' })
  });
  await ensureStatus(res, [201, 200], 'Invite member');
}

async function listMembers(headers, teamId) {
  const res = await fetch(`${baseUrl}/api/teams/${teamId}/members`, { headers });
  await ensureStatus(res, [200], 'List members');
  const members = await res.json();
  if (!Array.isArray(members)) throw new Error('Members response is not array');
  return members;
}

async function memberCreateBoard(memberHeaders, teamId) {
  const res = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, {
    method: 'POST',
    headers: memberHeaders,
    body: JSON.stringify({ title: 'Should be forbidden' })
  });
  if (res.status !== 403) {
    const body = await res.text();
    throw new Error(`Member create board expected 403, got ${res.status}: ${body}`);
  }
}

async function run() {
  // Owner
  const owner = await registerUser('uiowner');
  const ownerHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${owner.token}`
  };
  const teamId = await createTeam(ownerHeaders);

  // Member
  const member = await registerUser('uimember');
  await inviteMember(ownerHeaders, teamId, member.userId);
  const memberHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${member.token}`
  };

  // Membership list should mark member as MEMBER (UI uses this to hide button)
  const members = await listMembers(memberHeaders, teamId);
  const me = members.find((m) => m.user_id === member.userId);
  if (!me) throw new Error('Member not returned in team members list');
  if (me.role === 'OWNER') throw new Error('Member unexpectedly has OWNER role');

  // API forbids creation; UI should hide the button for members
  await memberCreateBoard(memberHeaders, teamId);

  console.log('Permission UI (no create board for member) OK:', { teamId, member: member.userId });
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
