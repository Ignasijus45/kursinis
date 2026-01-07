/**
 * Boards: create/list (team vs project).
 * Reikia veikiančio backend http://127.0.0.1:5001 (docker-compose up).
 */

const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:5001';

async function registerUser() {
  const ts = Date.now();
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `boards${ts}@example.com`,
      username: `boards${ts}`,
      password: 'TestPass123',
      full_name: 'Boards User'
    })
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Register failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.token;
}

async function createProject(token) {
  const res = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title: `Proj-${Date.now()}`, description: 'Test project' })
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Create project failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.id;
}

async function createProjectBoard(token, projectId, title = 'ProjectBoard') {
  const res = await fetch(`${baseUrl}/api/tasks/board`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ project_id: projectId, title })
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Create project board failed: ${res.status} ${text}`);
  }
}

async function listProjectBoards(token, projectId) {
  const res = await fetch(`${baseUrl}/api/tasks/project/${projectId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`List project boards failed: ${res.status} ${text}`);
  }
  return await res.json();
}

async function createTeam(token) {
  const res = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name: `Team-${Date.now()}` })
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Create team failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.team.id;
}

async function createTeamBoard(token, teamId, title = 'TeamBoard') {
  const res = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title })
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Create team board failed: ${res.status} ${text}`);
  }
}

async function listTeamBoards(token, teamId) {
  const res = await fetch(`${baseUrl}/api/teams/${teamId}/boards`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`List team boards failed: ${res.status} ${text}`);
  }
  return await res.json();
}

async function run() {
  const token = await registerUser();

  // Project boards
  const projectId = await createProject(token);
  await createProjectBoard(token, projectId, 'ProjBoard1');
  const projectBoards = await listProjectBoards(token, projectId);
  if (!Array.isArray(projectBoards) || projectBoards.length === 0) {
    throw new Error('Project boards not returned');
  }

  // Team boards
  const teamId = await createTeam(token);
  await createTeamBoard(token, teamId, 'TeamBoard1');
  const teamBoards = await listTeamBoards(token, teamId);
  if (!Array.isArray(teamBoards) || teamBoards.length === 0) {
    throw new Error('Team boards not returned');
  }

  console.log('Boards create/list (project & team) OK');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
