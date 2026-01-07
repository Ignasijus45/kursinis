/**
 * Audit log: ar atsiranda įrašai po move/comment/invite.
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

async function createTeamBoardTask(token) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
  const teamRes = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: `AuditTeam-${Date.now()}` })
  });
  const team = await teamRes.json();

  const boardA = await fetch(`${baseUrl}/api/teams/${team.team.id}/boards`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: 'AuditBoardA' })
  }).then((r) => r.json());

  const boardB = await fetch(`${baseUrl}/api/columns`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ team_id: team.team.id, title: 'AuditBoardB' })
  }).then((r) => r.json());

  const task = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ board_id: boardA.id, title: 'Audit Task' })
  }).then((r) => r.json());

  return { headers, teamId: team.team.id, boardA: boardA.id, boardB: boardB.id, taskId: task.id, userId: team.team.created_by };
}

async function invite(ownerHeaders, teamId, userId) {
  const res = await fetch(`${baseUrl}/api/teams/${teamId}/invite`, {
    method: 'POST',
    headers: ownerHeaders,
    body: JSON.stringify({ user_id: userId, role: 'MEMBER' })
  });
  if (res.status !== 201 && res.status !== 200) {
    const text = await res.text();
    throw new Error(`Invite failed: ${res.status} ${text}`);
  }
}

async function moveTask(headers, taskId, boardId) {
  const res = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ board_id: boardId, position: 0 })
  });
  if (res.status !== 200) {
    throw new Error(`Move failed: ${res.status}`);
  }
}

async function addComment(headers, taskId) {
  const res = await fetch(`${baseUrl}/api/tasks/${taskId}/comments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content: 'Audit comment' })
  });
  if (res.status !== 201) {
    throw new Error(`Comment failed: ${res.status}`);
  }
}

async function fetchAudit(userId, headers) {
  const res = await fetch(`${baseUrl}/api/audit/user/${userId}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Audit fetch failed: ${res.status} ${text}`);
  }
  return await res.json();
}

async function run() {
  const owner = await register('auditOwner');
  const member = await register('auditMember');

  const { headers: ownerHeaders, teamId, boardA, boardB, taskId, userId } = await createTeamBoardTask(owner.token);

  await invite(ownerHeaders, teamId, member.user.id);
  await moveTask(ownerHeaders, taskId, boardB);
  await addComment(ownerHeaders, taskId);

  const audits = await fetchAudit(userId, ownerHeaders);
  const actions = audits.map((a) => a.action);

  const required = ['add_team_member', 'move_task', 'create_comment'];
  const missing = required.filter((r) => !actions.includes(r));
  if (missing.length) {
    throw new Error(`Audit missing actions: ${missing.join(', ')}`);
  }

  console.log('Audit log move/comment/invite OK');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
