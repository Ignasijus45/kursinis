import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

// Sukurti naują projektą
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, color } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Projekto pavadinimas yra privalomas' });
    }
    
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO projects (id, owner_id, title, description, color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, req.user.id, title, description, color || '#3498db']
    );
    
    // Pridėti savininką kaip projektų narį
    await pool.query(
      'INSERT INTO project_members (id, project_id, user_id, role) VALUES ($1, $2, $3, $4)',
      [uuidv4(), id, req.user.id, 'owner']
    );

    // Audit
    try {
      await logAudit({
        user_id: req.user.id,
        action: 'create_project',
        entity_type: 'project',
        entity_id: id,
        details: { title, description }
      });
    } catch (e) { console.warn('Audit failed', e); }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida sukuriant projektą' });
  }
});

// Gauti visus naudotojo projektus
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.* FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida gaunant projektus' });
  }
});

// Gauti konkretų projektą
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.* FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE p.id = $1 AND pm.user_id = $2`,
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Projektas nerastas' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida gaunant projektą' });
  }
});

// Atnaujinti projektą
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, color } = req.body;
    
    // Tikrinti ar vartotojas yra savininkas
    const ownerCheck = await pool.query(
      'SELECT owner_id FROM projects WHERE id = $1',
      [req.params.id]
    );
    
    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Jūs negalite redaguoti šio projekto' });
    }
    
    const result = await pool.query(
      'UPDATE projects SET title = COALESCE($1, title), description = COALESCE($2, description), color = COALESCE($3, color), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [title, description, color, req.params.id]
    );

    // Audit
    try {
      await logAudit({
        user_id: req.user.id,
        action: 'update_project',
        entity_type: 'project',
        entity_id: req.params.id,
        details: { title, description, color }
      });
    } catch (e) { console.warn('Audit failed', e); }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida atnaujinant projektą' });
  }
});

// Ištrinti projektą
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const ownerCheck = await pool.query(
      'SELECT owner_id FROM projects WHERE id = $1',
      [req.params.id]
    );
    
    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Jūs negalite ištrinti šio projekto' });
    }
    
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);

    // Audit
    try {
      await logAudit({
        user_id: req.user.id,
        action: 'delete_project',
        entity_type: 'project',
        entity_id: req.params.id,
        details: null
      });
    } catch (e) { console.warn('Audit failed', e); }

    res.json({ message: 'Projektas sėkmingai ištrintas' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida trinant projektą' });
  }
});

// Gauti projektų narius
router.get('/:id/members', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pm.id, pm.role, u.id as user_id, u.username, u.full_name, u.avatar_url
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1`,
      [req.params.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida gaunant projektų narius' });
  }
});

// Pridėti narį į projektą
router.post('/:id/members', authMiddleware, async (req, res) => {
  try {
    const { user_id } = req.body;
    
    const ownerCheck = await pool.query(
      'SELECT owner_id FROM projects WHERE id = $1',
      [req.params.id]
    );
    
    if (ownerCheck.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Tik savininkas gali pridėti narius' });
    }
    
    const result = await pool.query(
      'INSERT INTO project_members (id, project_id, user_id, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [uuidv4(), req.params.id, user_id, 'member']
    );

    // Audit
    try {
      await logAudit({
        user_id: req.user.id,
        action: 'add_project_member',
        entity_type: 'project_member',
        entity_id: result.rows[0].id,
        details: { project_id: req.params.id, user_id }
      });
    } catch (e) { console.warn('Audit failed', e); }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Vartotojas jau yra projektų narys' });
    }
    res.status(500).json({ message: 'Klaida pridedant narį' });
  }
});

export default router;
