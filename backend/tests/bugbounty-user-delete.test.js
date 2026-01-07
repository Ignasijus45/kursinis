/**
 * Bug bounty: bandymas ištrinti naudotoją ir stebėti kaskadas.
 * Sistemoje nėra vartotojo trynimo endpointo, todėl DELETE /api/users/:id turėtų grąžinti 404/405 (nepalaikoma).
 * Naudoja API_BASE_URL (default: http://127.0.0.1:5001).
 */

const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:5001';

async function ensureStatus(res, allowed, context) {
  if (!allowed.includes(res.status)) {
    const body = await res.text();
    throw new Error(`${context} failed ${res.status}: ${body}`);
  }
}

async function registerUser() {
  const ts = Date.now();
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `deluser${ts}@example.com`,
      username: `deluser${ts}`,
      password: 'TestPass123',
      full_name: 'Delete User'
    })
  });
  await ensureStatus(res, [201], 'Register');
  const data = await res.json();
  return { token: data.token, userId: data.user.id };
}

async function attemptDelete(headers, userId) {
  const res = await fetch(`${baseUrl}/api/users/${userId}`, {
    method: 'DELETE',
    headers
  });
  // tikimės 404/405, nes endpointo nėra
  if (![404, 405].includes(res.status)) {
    const body = await res.text();
    throw new Error(`Expected 404/405 for user delete, got ${res.status}: ${body}`);
  }
  return res.status;
}

async function run() {
  const { token, userId } = await registerUser();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const status = await attemptDelete(headers, userId);

  console.log('User delete not supported (as expected)', { userId, status });
  console.log('Kaskados tasks/comments/audit nepatikrintos – nėra vartotojo trynimo endpointo.');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
