import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

// Sukurti naują stulpelį (board) projektui arba komandai
router.post('/', authMiddleware, async (req, res) => {
  const { project_id, team_id, title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Pavadinimas privalomas' });
  }
  if (!project_id && !team_id) {
    return res.status(400).json({ message: 'Reikia project_id arba team_id' });
  }

  try {
    // Access check
    if (project_id) {
      const access = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [project_id, req.user.id]
      );
      if (access.rows.length === 0) {
        return res.status(403).json({ message: 'Jūs neturite prieigos prie projekto' });
      }
    }
    if (team_id) {
      const team = await pool.query('SELECT created_by FROM teams WHERE id = $1', [team_id]);
      if (team.rows.length === 0) {
        return res.status(404).json({ message: 'Komanda nerasta' });
      }
      if (team.rows[0].created_by !== req.user.id) {
        return res.status(403).json({ message: 'Neturite teisės kurti lentos šioje komandoje' });
      }
    }

    const id = uuidv4();
    const filterColumn = project_id ? 'project_id' : 'team_id';
    const filterValue = project_id || team_id;
    const result = await pool.query(
      `INSERT INTO boards (id, project_id, team_id, title, position)
       VALUES ($1, $2, $3, $4, (SELECT COUNT(*) FROM boards WHERE ${filterColumn} = $5))
       RETURNING *`,
      [id, project_id || null, team_id || null, title.trim(), filterValue]
    );

    try {
      await logAudit({
        user_id: req.user.id,
        action: 'create_board',
        entity_type: 'board',
        entity_id: id,
        details: { project_id: project_id || null, team_id: team_id || null, title: title.trim() }
      });
    } catch (auditErr) {
      console.warn('Audit failed', auditErr);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Klaida kuriant stulpelį:', error);
    res.status(500).json({ message: 'Klaida kuriant stulpelį' });
  }
});

// Atnaujinti stulpelį (pavadinimą arba poziciją)
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, position } = req.body;
  const boardId = req.params.id;

  if (!title && (position === undefined || position === null)) {
    return res.status(400).json({ message: 'Reikia bent pavadinimo arba pozicijos' });
  }

  try {
    const boardResult = await pool.query(
      'SELECT id, project_id, team_id, title, position FROM boards WHERE id = $1',
      [boardId]
    );
    if (boardResult.rows.length === 0) {
      return res.status(404).json({ message: 'Stulpelis nerastas' });
    }
    const board = boardResult.rows[0];

    // Access check
    if (board.project_id) {
      const access = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [board.project_id, req.user.id]
      );
      if (access.rows.length === 0) {
        return res.status(403).json({ message: 'Jūs neturite prieigos prie projekto' });
      }
    }
    if (board.team_id) {
      const team = await pool.query('SELECT created_by FROM teams WHERE id = $1', [board.team_id]);
      if (team.rows.length === 0) {
        return res.status(404).json({ message: 'Komanda nerasta' });
      }
      if (team.rows[0].created_by !== req.user.id) {
        return res.status(403).json({ message: 'Neturite teisės redaguoti lentos šioje komandoje' });
      }
    }

    const newTitle = title ? title.trim() : board.title;
    const newPosition = position !== undefined && position !== null ? position : board.position;

    const updated = await pool.query(
      `UPDATE boards
       SET title = $1, position = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [newTitle, newPosition, boardId]
    );

    try {
      await logAudit({
        user_id: req.user.id,
        action: 'update_board',
        entity_type: 'board',
        entity_id: boardId,
        details: { title: newTitle, position: newPosition }
      });
    } catch (auditErr) {
      console.warn('Audit failed', auditErr);
    }

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Klaida atnaujinant stulpelį:', error);
    res.status(500).json({ message: 'Klaida atnaujinant stulpelį' });
  }
});

// Ištrinti stulpelį
router.delete('/:id', authMiddleware, async (req, res) => {
  const boardId = req.params.id;
  try {
    const boardResult = await pool.query(
      'SELECT id, project_id, team_id FROM boards WHERE id = $1',
      [boardId]
    );
    if (boardResult.rows.length === 0) {
      return res.status(404).json({ message: 'Stulpelis nerastas' });
    }
    const board = boardResult.rows[0];

    // Access check
    if (board.project_id) {
      const access = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [board.project_id, req.user.id]
      );
      if (access.rows.length === 0) {
        return res.status(403).json({ message: 'Jūs neturite prieigos prie projekto' });
      }
    }
    if (board.team_id) {
      const team = await pool.query('SELECT created_by FROM teams WHERE id = $1', [board.team_id]);
      if (team.rows.length === 0) {
        return res.status(404).json({ message: 'Komanda nerasta' });
      }
      if (team.rows[0].created_by !== req.user.id) {
        return res.status(403).json({ message: 'Neturite teisės trinti lentos šioje komandoje' });
      }
    }

    await pool.query('DELETE FROM boards WHERE id = $1', [boardId]);

    try {
      await logAudit({
        user_id: req.user.id,
        action: 'delete_board',
        entity_type: 'board',
        entity_id: boardId,
        details: { project_id: board.project_id, team_id: board.team_id }
      });
    } catch (auditErr) {
      console.warn('Audit failed', auditErr);
    }

    res.json({ message: 'Stulpelis ištrintas' });
  } catch (error) {
    console.error('Klaida trinant stulpelį:', error);
    res.status(500).json({ message: 'Klaida trinant stulpelį' });
  }
});

export default router;
