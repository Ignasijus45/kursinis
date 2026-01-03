/**
 * Testuoja, kad protected endpointai grąžina 401 be tokeno.
 * Reikia veikiančio backend http://localhost:5001.
 */

const baseUrl = 'http://localhost:5001';

async function run() {
  // Bandome gauti projektų sąrašą be tokeno
  const res = await fetch(`${baseUrl}/api/projects`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (res.status !== 401) {
    const body = await res.text();
    throw new Error(`Tikėtasi 401, gauta ${res.status}. Body: ${body}`);
  }

  console.log('Unauthorized test OK (projects endpoint)');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
