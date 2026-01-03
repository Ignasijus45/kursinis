/**
 * Testuoja, kad non-member gauna 403 bandydamas pasiekti komandos resursus.
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
  const ownerEmail = `owner${Date.now()}@example.com`;
  const outsiderEmail = `outsider${Date.now()}@example.com`;

  const owner = await register(ownerEmail, ownerEmail);
  const outsider = await register(outsiderEmail, outsiderEmail);

  // Owner sukuria team
  const teamResp = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${owner.token}`
    },
    body: JSON.stringify({ name: 'PermTest Team' })
  });
  if (teamResp.status !== 201) throw new Error(`Team create failed: ${teamResp.status}`);
  const team = await teamResp.json();

  // Outsider bando gauti members
  const outsiderResp = await fetch(`${baseUrl}/api/teams/${team.team.id}/members`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${outsider.token}` }
  });

  if (outsiderResp.status !== 403) {
    const body = await outsiderResp.text();
    throw new Error(`Tikėtasi 403, gauta ${outsiderResp.status}. Body: ${body}`);
  }

  console.log('Team permissions test OK (non-member 403)');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
