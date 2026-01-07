import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

// Export board (columns/board) with tasks to JSON
router.get('/board/:boardId', authMiddleware, async (req, res) => {
  const { boardId } = req.params;
  try {
    const boardRes = await pool.query(
      'SELECT id, project_id, team_id, title, position, archived, wip_limit FROM boards WHERE id = $1',
      [boardId]
    );
    if (boardRes.rows.length === 0) {
      return res.status(404).json({ message: 'Lenta nerasta' });
    }
    const board = boardRes.rows[0];

    // Access check: project member or team member
    if (board.project_id) {
      const access = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [board.project_id, req.user.id]
      );
      if (access.rows.length === 0) {
        return res.status(403).json({ message: 'Jūs neturite prieigos prie šio projekto' });
      }
    }
    if (board.team_id) {
      const access = await pool.query(
        'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
        [board.team_id, req.user.id]
      );
      if (access.rows.length === 0) {
        return res.status(403).json({ message: 'Neturite prieigos prie šios komandos lentos' });
      }
    }

    const tasksRes = await pool.query(
      `SELECT t.*, COALESCE(
         (SELECT json_agg(c ORDER BY c.created_at) FROM comments c WHERE c.task_id = t.id),
         '[]'
       ) AS comments
       FROM tasks t
       WHERE t.board_id = $1
       ORDER BY t.position`,
      [boardId]
    );

    res.json({
      board,
      tasks: tasksRes.rows
    });
  } catch (error) {
    console.error('Klaida eksportuojant board:', error);
    res.status(500).json({ message: 'Klaida eksportuojant lentą' });
  }
});

// Import board from JSON
router.post('/board', authMiddleware, async (req, res) => {
  const { project_id, team_id, data } = req.body;
  if (!data || !data.board) {
    return res.status(400).json({ message: 'Trūksta board duomenų importui' });
  }
  // Access checks
  try {
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
      const access = await pool.query(
        'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
        [team_id, req.user.id]
      );
      if (access.rows.length === 0) {
        return res.status(403).json({ message: 'Neturite prieigos prie šios komandos lentos' });
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const boardId = uuidv4();
      const { board, tasks = [] } = data;
      const title = board.title || 'Imported Board';
      const wipLimit = board.wip_limit ?? null;

      const boardInsert = await client.query(
        `INSERT INTO boards (id, project_id, team_id, title, position, archived, wip_limit)
         VALUES ($1, $2, $3, $4, (SELECT COUNT(*) FROM boards WHERE project_id = $2 AND team_id IS NULL) 
                 + (SELECT COUNT(*) FROM boards WHERE team_id = $3 AND project_id IS NULL),
                 $5, $6)
         RETURNING *`,
        [boardId, project_id || null, team_id || null, title, board.archived || false, wipLimit]
      );

      for (const task of tasks) {
        const taskId = uuidv4();
        await client.query(
          `INSERT INTO tasks (id, board_id, title, description, position, priority, status, assigned_to, archived, created_by)
           VALUES ($1, $2, $3, $4, (SELECT COUNT(*) FROM tasks WHERE board_id = $2), $5, $6, $7, $8, $9)`,
          [
            taskId,
            boardId,
            task.title || 'Imported Task',
            task.description || '',
            task.priority || 'medium',
            task.status || 'todo',
            task.assigned_to || null,
            task.archived || false,
            req.user.id
          ]
        );
      }

      await logAudit({
        user_id: req.user.id,
        action: 'import_board',
        entity_type: 'board',
        entity_id: boardId,
        details: { project_id, team_id, source_board: board.id || null }
      });

      await client.query('COMMIT');
      res.status(201).json({ board: boardInsert.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Import board error:', err);
      res.status(500).json({ message: 'Klaida importuojant lentą' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Import board access error:', err);
    res.status(500).json({ message: 'Klaida importuojant lentą' });
  }
});

export default router;
