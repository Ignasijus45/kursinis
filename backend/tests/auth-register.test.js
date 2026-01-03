/**
 * Paprastas integracinis testas register endpointui.
 * Reikia, kad backend veiktų ant http://localhost:5001 (docker-compose up).
 * Naudoja Node 18 global fetch.
 */

const baseUrl = 'http://localhost:5001';

async function run() {
  const unique = Date.now();
  const body = {
    email: `regtest${unique}@example.com`,
    username: `regtest${unique}`,
    password: 'TestPass123',
    full_name: 'Test User'
  };

  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`Register failed: status ${res.status}, body: ${text}`);
  }

  const data = await res.json();
  if (!data.token || !data.user?.id) {
    throw new Error('Register response missing token or user id');
  }

  console.log('Register test OK:', data.user.email);
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
