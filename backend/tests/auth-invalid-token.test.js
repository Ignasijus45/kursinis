/**
 * Auth testas: neteisingas/klastotas token grąžina 401.
 * Reikia veikiančio backend http://127.0.0.1:5001 (docker-compose up).
 */

const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:5001';

async function run() {
  // Neteisingas (suklastotas) token
  const fakeToken = 'Bearer faketoken123';
  const res = await fetch(`${baseUrl}/api/projects`, {
    headers: { Authorization: fakeToken }
  });

  if (res.status !== 401) {
    const text = await res.text();
    throw new Error(`Invalid token expected 401, got ${res.status}, body: ${text}`);
  }

  console.log('Auth invalid token test OK');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
