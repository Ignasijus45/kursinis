import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

// Gauti visas lentos ir uždavinius iš projekto (su filtro parama)
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    // Tikrinti ar vartotojas turi prieigą prie projekto
    const access = await pool.query(
      `SELECT pm.* FROM project_members pm
       WHERE pm.project_id = $1 AND pm.user_id = $2`,
      [req.params.projectId, req.user.id]
    );

    if (access.rows.length === 0) {
      return res.status(403).json({ message: 'Jūs neturite prieigos prie šio projekto' });
    }

    // Gauti lentas
    const boards = await pool.query(
      'SELECT * FROM boards WHERE project_id = $1 ORDER BY position',
      [req.params.projectId]
    );

    // extract filters from query
    const { assigned_to, status, priority, due_before, due_after } = req.query;

    // Gauti uždavinius kiekvienai lentai (with filters)
    const boardsWithTasks = await Promise.all(
      boards.rows.map(async (board) => {
        let baseQuery = 'SELECT * FROM tasks WHERE board_id = $1';
        const params = [board.id];
        let idx = 2;

        if (assigned_to) {
          baseQuery += ` AND assigned_to = $${idx}`;
          params.push(assigned_to);
          idx++;
        }
        if (status) {
          baseQuery += ` AND status = $${idx}`;
          params.push(status);
          idx++;
        }
        if (priority) {
          baseQuery += ` AND priority = $${idx}`;
          params.push(priority);
          idx++;
        }
        if (due_before) {
          baseQuery += ` AND due_date <= $${idx}`;
          params.push(due_before);
          idx++;
        }
        if (due_after) {
          baseQuery += ` AND due_date >= $${idx}`;
          params.push(due_after);
          idx++;
        }

        baseQuery += ' ORDER BY position';

        const tasks = await pool.query(baseQuery, params);
        return { ...board, tasks: tasks.rows };
      })
    );

    res.json(boardsWithTasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida gaunant uždavinius' });
  }
});

// Sukurti naują lentą
router.post('/board', authMiddleware, async (req, res) => {
  try {
    const { project_id, title } = req.body;
    
    if (!project_id || !title) {
      return res.status(400).json({ message: 'Projekto ID ir pavadinimas yra privalomi' });
    }
    
    // Tikrinti prieigą
    const access = await pool.query(
      'SELECT pm.* FROM project_members pm WHERE pm.project_id = $1 AND pm.user_id = $2',
      [project_id, req.user.id]
    );
    
    if (access.rows.length === 0) {
      return res.status(403).json({ message: 'Jūs neturite prieigos' });
    }
    
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO boards (id, project_id, title, position) VALUES ($1, $2, $3, (SELECT COUNT(*) FROM boards WHERE project_id = $2)) RETURNING *',
      [id, project_id, title]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida sukuriant lentą' });
  }
});

// Sukurti naują uždavinį
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { board_id, title, description, priority, assigned_to } = req.body;
    
    if (!board_id || !title) {
      return res.status(400).json({ message: 'Lentos ID ir pavadinimas yra privalomi' });
    }
    
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO tasks (id, board_id, title, description, priority, created_by, position) 
       VALUES ($1, $2, $3, $4, $5, $6, (SELECT COUNT(*) FROM tasks WHERE board_id = $2))
       RETURNING *`,
      [id, board_id, title, description, priority || 'medium', req.user.id]
    );
    
    if (assigned_to) {
      await pool.query('UPDATE tasks SET assigned_to = $1 WHERE id = $2', [assigned_to, id]);
    }

    // Audit log
    try {
      await logAudit({
        user_id: req.user.id,
        action: 'create_task',
        entity_type: 'task',
        entity_id: id,
        details: { board_id, title, assigned_to: assigned_to || null }
      });
    } catch (e) { console.warn('Audit log failed', e); }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida sukuriant uždavinį' });
  }
});

// Gauti konkretų uždavinį su komentarais
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [req.params.id]
    );
    
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: 'Uždavinys nerastas' });
    }
    
    const commentsResult = await pool.query(
      `SELECT c.*, u.username, u.avatar_url FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at`,
      [req.params.id]
    );
    
    const task = taskResult.rows[0];
    res.json({ ...task, comments: commentsResult.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida gaunant uždavinį' });
  }
});

// Atnaujinti uždavinį
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, status, priority, assigned_to, due_date } = req.body;
    
    const result = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           assigned_to = COALESCE($5, assigned_to),
           due_date = COALESCE($6, due_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [title, description, status, priority, assigned_to, due_date, req.params.id]
    );

    // Audit
    try {
      await logAudit({
        user_id: req.user.id,
        action: 'update_task',
        entity_type: 'task',
        entity_id: req.params.id,
        details: { title, description, status, priority, assigned_to, due_date }
      });
    } catch (e) { console.warn('Audit log failed', e); }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida atnaujinant uždavinį' });
  }
});

// Ištrinti uždavinį
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await pool.query(
      'SELECT created_by FROM tasks WHERE id = $1',
      [req.params.id]
    );
    
    if (task.rows.length === 0) {
      return res.status(404).json({ message: 'Uždavinys nerastas' });
    }
    
    if (task.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Jūs negalite ištrinti šio uždavinio' });
    }
    
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);

    // Audit
    try {
      await logAudit({
        user_id: req.user.id,
        action: 'delete_task',
        entity_type: 'task',
        entity_id: req.params.id,
        details: null
      });
    } catch (e) { console.warn('Audit log failed', e); }

    res.json({ message: 'Uždavinys sėkmingai ištrintas' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida trinant uždavinį' });
  }
});

// Pridėti komentarą prie uždavinio
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Komentaro turinys yra privalomas' });
    }
    
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO comments (id, task_id, user_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, req.params.id, req.user.id, content]
    );

    // Audit
    try {
      await logAudit({
        user_id: req.user.id,
        action: 'create_comment',
        entity_type: 'comment',
        entity_id: id,
        details: { task_id: req.params.id, content }
      });
    } catch (e) { console.warn('Audit log failed', e); }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida pridedant komentarą' });
  }
});

export default router;
