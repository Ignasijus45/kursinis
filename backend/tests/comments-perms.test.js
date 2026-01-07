/**
 * Comments: create/delete + permissions.
 * Reikia veikiančio backend http://127.0.0.1:5001 (docker-compose up).
 */

const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';

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

async function createTeamBoardTask(token) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
  const teamRes = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: `CommTeam-${Date.now()}` })
  });
  const team = await teamRes.json();

  const boardRes = await fetch(`${baseUrl}/api/teams/${team.team.id}/boards`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: 'CommentsBoard' })
  });
  const board = await boardRes.json();

  const taskRes = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ board_id: board.id, title: 'Comment Task' })
  });
  const task = await taskRes.json();

  return { headers, teamId: team.team.id, taskId: task.id };
}

async function addMember(ownerToken, teamId, userId) {
  await fetch(`${baseUrl}/api/teams/${teamId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`
    },
    body: JSON.stringify({ user_id: userId, role: 'MEMBER' })
  });
}

async function run() {
  const owner = await register('cowner');
  const member = await register('cmember');
  const outsider = await register('coutsider');

  const { headers: ownerHeaders, teamId, taskId } = await createTeamBoardTask(owner.token);
  await addMember(owner.token, teamId, member.user.id);

  // Owner adds comment
  const commentRes = await fetch(`${baseUrl}/api/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: ownerHeaders,
    body: JSON.stringify({ content: 'Owner comment' })
  });
  if (commentRes.status !== 201) {
    throw new Error(`Owner comment failed: ${commentRes.status}`);
  }
  const comment = await commentRes.json();

  // Outsider cannot add comment (not in team)
  const outsiderRes = await fetch(`${baseUrl}/api/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${outsider.token}`
    },
    body: JSON.stringify({ content: 'Should fail' })
  });
  if (outsiderRes.status !== 403) {
    throw new Error(`Outsider comment expected 403, got ${outsiderRes.status}`);
  }

  // Member adds comment
  const memberRes = await fetch(`${baseUrl}/api/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${member.token}`
    },
    body: JSON.stringify({ content: 'Member comment' })
  });
  if (memberRes.status !== 201) {
    throw new Error(`Member comment failed: ${memberRes.status}`);
  }
  const memberComment = await memberRes.json();

  // Outsider cannot delete other's comment
  const delOutsider = await fetch(`${baseUrl}/api/tasks/${taskId}/comments/${comment.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${outsider.token}` }
  });
  if (delOutsider.status !== 403 && delOutsider.status !== 404) {
    throw new Error(`Outsider delete expected 403/404, got ${delOutsider.status}`);
  }

  // Member can delete own comment
  const delMember = await fetch(`${baseUrl}/api/tasks/${taskId}/comments/${memberComment.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${member.token}` }
  });
  if (delMember.status !== 200) {
    throw new Error(`Member delete own comment failed: ${delMember.status}`);
  }

  console.log('Comments create/delete + permissions OK');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
