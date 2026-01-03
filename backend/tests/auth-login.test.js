/**
 * Paprastas integracinis testas login endpointui.
 * Reikia, kad backend veiktų ant http://localhost:5001 (docker-compose up).
 * Naudoja Node 18 global fetch.
 */

const baseUrl = 'http://localhost:5001';

async function run() {
  const unique = Date.now();
  const creds = {
    email: `logintest${unique}@example.com`,
    username: `logintest${unique}`,
    password: 'TestPass123',
    full_name: 'Test User'
  };

  // Register user first
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds)
  });
  if (regRes.status !== 201) {
    const text = await regRes.text();
    throw new Error(`Register pre-step failed: ${regRes.status}, body: ${text}`);
  }

  // Login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: creds.email, password: creds.password })
  });

  if (loginRes.status !== 200) {
    const text = await loginRes.text();
    throw new Error(`Login failed: status ${loginRes.status}, body: ${text}`);
  }

  const data = await loginRes.json();
  if (!data.token || !data.user?.id) {
    throw new Error('Login response missing token or user id');
  }

  console.log('Login test OK:', data.user.email);
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
