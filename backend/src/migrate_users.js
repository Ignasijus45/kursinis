import { pool } from './config/database.js';

async function ensureUsersTable() {
  const client = await pool.connect();
  try {
    console.log('Ensuring users table exists and has required columns...');

    // Create table if not exists with the required minimal columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure additional columns used elsewhere exist (idempotent)
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE;");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");

    // Ensure unique index on email (if table existed earlier without constraint)
    await client.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);");

    console.log('✓ users table ensured');
  } catch (err) {
    console.error('Error ensuring users table:', err);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ensureUsersTable().then(() => process.exit());
}

export { ensureUsersTable };
