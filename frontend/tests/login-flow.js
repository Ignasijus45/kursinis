/**
 * Minimal login flow test (register + login against backend API).
 * Naudoja global fetch (Node 18) ir API_BASE_URL (default: http://127.0.0.1:5001/api).
 */

const API = process.env.API_BASE_URL || 'http://127.0.0.1:5001/api';

async function register(email, username, password) {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password, full_name: 'Login Flow' })
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Register failed ${res.status}: ${text}`);
  }
  return res.json();
}

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (res.status !== 200) {
    const text = await res.text();
    throw new Error(`Login failed ${res.status}: ${text}`);
  }
  return res.json();
}

async function run() {
  const ts = Date.now();
  const email = `loginflow${ts}@example.com`;
  const username = `loginflow${ts}`;
  const password = 'TestPass123';

  await register(email, username, password);
  const loginResp = await login(email, password);

  if (!loginResp.token || !loginResp.user?.id) {
    throw new Error('Login response missing token or user id');
  }

  console.log('Login flow OK:', loginResp.user.email);
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
