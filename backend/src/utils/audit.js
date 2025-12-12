import { pool } from '../config/database.js';
import { randomUUID } from 'crypto';

async function logAudit({ user_id, action, entity_type, entity_id, details }) {
  try {
    const id = randomUUID();
    const detailsValue = details ? JSON.stringify(details) : null;
    await pool.query(
      'INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, user_id, action, entity_type, entity_id, detailsValue]
    );
  } catch (err) {
    console.error('Failed to write audit log', err);
  }
}

export { logAudit };
