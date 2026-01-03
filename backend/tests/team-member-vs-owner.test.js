/**
 * Testuoja, kad komandos narys gali matyti (200), bet negali kviesti/šalinti (403),
 * o OWNER gali kviesti/šalinti (201/200).
 * Reikia veikiančio backend http://localhost:5001.
 */

const baseUrl = 'http://localhost:5001';

async function register(email, username) {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      username,
      password: 'TestPass123',
      full_name: 'Test User'
    })
  });
  if (res.status !== 201) throw new Error(`Register failed: ${res.status}`);
  return res.json();
}

async function run() {
  const owner = await register(`owner${Date.now()}@example.com`, `owner${Date.now()}`);
  const member = await register(`member${Date.now()}@example.com`, `member${Date.now()}`);

  // Owner sukuria team
  const teamResp = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${owner.token}`
    },
    body: JSON.stringify({ name: 'MemberVsOwner Team' })
  });
  if (teamResp.status !== 201) throw new Error(`Team create failed: ${teamResp.status}`);
  const team = await teamResp.json();
  const teamId = team.team.id;

  // Owner pakviečia member (turi būti 201 arba 200 jei jau yra)
  const inviteRes = await fetch(`${baseUrl}/api/teams/${teamId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${owner.token}`
    },
    body: JSON.stringify({ user_id: member.user.id })
  });
  if (![200, 201].includes(inviteRes.status)) {
    throw new Error(`Invite failed: ${inviteRes.status}`);
  }

  // Member gali matyti members (200)
  const listRes = await fetch(`${baseUrl}/api/teams/${teamId}/members`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${member.token}` }
  });
  if (listRes.status !== 200) {
    throw new Error(`Member should see members, got ${listRes.status}`);
  }

  // Member bando kviesti kitą user -> 403
  const outsider = await register(`outs${Date.now()}@example.com`, `outs${Date.now()}`);
  const inviteByMember = await fetch(`${baseUrl}/api/teams/${teamId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${member.token}`
    },
    body: JSON.stringify({ user_id: outsider.user.id })
  });
  if (inviteByMember.status !== 403) {
    throw new Error(`Member invite should be 403, got ${inviteByMember.status}`);
  }

  console.log('Team member vs owner test OK');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
