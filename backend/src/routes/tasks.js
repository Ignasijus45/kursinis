import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

// Gauti visas lentos ir uždavinius iš projekto (su filtro parama)
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    const includeArchived = req.query.include_archived === 'true';
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
      `SELECT * FROM boards WHERE project_id = $1 ${includeArchived ? '' : 'AND archived = false'} ORDER BY position`,
      [req.params.projectId]
    );

    // extract filters from query
    const { assigned_to, status, priority, due_before, due_after } = req.query;

    // Gauti uždavinius kiekvienai lentai (with filters)
    const boardsWithTasks = await Promise.all(
      boards.rows.map(async (board) => {
        let baseQuery = 'SELECT * FROM tasks WHERE board_id = $1';
        if (!includeArchived) baseQuery += ' AND archived = false';
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
        const taskIds = tasks.rows.map((t) => t.id);
        let commentsByTask = {};

        if (taskIds.length > 0) {
          const comments = await pool.query(
            `SELECT c.*, u.username 
             FROM comments c 
             JOIN users u ON c.user_id = u.id
             WHERE c.task_id = ANY($1::uuid[])
             ORDER BY c.created_at`,
            [taskIds]
          );

          comments.rows.forEach((c) => {
            if (!commentsByTask[c.task_id]) commentsByTask[c.task_id] = [];
            commentsByTask[c.task_id].push(c);
          });
        }

        return {
          ...board,
          tasks: tasks.rows.map((t) => ({ ...t, comments: commentsByTask[t.id] || [] }))
        };
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

// Gauti konkrečios lentos užduotis (projektui arba komandai)
router.get('/board/:boardId', authMiddleware, async (req, res) => {
  const { boardId } = req.params;
  const includeArchived = req.query.include_archived === 'true';

  try {
    const boardResult = await pool.query(
      'SELECT id, project_id, team_id FROM boards WHERE id = $1',
      [boardId]
    );
    if (boardResult.rows.length === 0) {
      return res.status(404).json({ message: 'Lenta nerasta' });
    }
    const board = boardResult.rows[0];

    if (board.project_id) {
      const access = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [board.project_id, req.user.id]
      );
      if (access.rows.length === 0) {
        return res.status(403).json({ message: 'Neturite prieigos prie šio projekto' });
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

    const tasks = await pool.query(
      `SELECT * FROM tasks WHERE board_id = $1 ${includeArchived ? '' : 'AND archived = false'} ORDER BY position`,
      [boardId]
    );

    const taskIds = tasks.rows.map((t) => t.id);
    let commentsByTask = {};
    if (taskIds.length > 0) {
      const comments = await pool.query(
        `SELECT c.*, u.username 
         FROM comments c 
         JOIN users u ON c.user_id = u.id
         WHERE c.task_id = ANY($1::uuid[])
         ORDER BY c.created_at`,
        [taskIds]
      );
      comments.rows.forEach((c) => {
        if (!commentsByTask[c.task_id]) commentsByTask[c.task_id] = [];
        commentsByTask[c.task_id].push(c);
      });
    }

    const withComments = tasks.rows.map((t) => ({
      ...t,
      comments: commentsByTask[t.id] || []
    }));

    res.json(withComments);
  } catch (error) {
    console.error('Klaida gaunant lentos užduotis:', error);
    res.status(500).json({ message: 'Klaida gaunant lentos užduotis' });
  }
});

// Sukurti naują uždavinį
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { board_id, title, description, priority, assigned_to, due_date, deadline } = req.body;
    
    if (!board_id || !title) {
      return res.status(400).json({ message: 'Lentos ID ir pavadinimas yra privalomi' });
    }
    if (title.trim().length > 255) {
      return res.status(400).json({ message: 'Pavadinimas per ilgas (maks. 255 simbolių)' });
    }

    // Data validacija
    const isValidDate = (val) => {
      if (!val) return true;
      const d = new Date(val);
      return !isNaN(d.getTime());
    };
    const isPast = (val) => {
      if (!val) return false;
      const d = new Date(val);
      const now = Date.now();
      return !isNaN(d.getTime()) && d.getTime() < now;
    };
    if (!isValidDate(due_date) || !isValidDate(deadline)) {
      return res.status(400).json({ message: 'Neteisingas datos formatas' });
    }
    if (isPast(due_date) || isPast(deadline)) {
      return res.status(400).json({ message: 'Data negali būti praeityje' });
    }
    
    const id = uuidv4();
    // WIP limit check
    const boardInfo = await pool.query('SELECT wip_limit FROM boards WHERE id = $1', [board_id]);
    if (boardInfo.rows.length === 0) {
      return res.status(404).json({ message: 'Lenta nerasta' });
    }
    const wipLimit = boardInfo.rows[0].wip_limit;
    if (wipLimit !== null && wipLimit >= 0) {
      const countActive = await pool.query(
        'SELECT COUNT(*) FROM tasks WHERE board_id = $1 AND archived = false',
        [board_id]
      );
      if (Number(countActive.rows[0].count) >= wipLimit) {
        return res.status(400).json({ message: 'Viršytas WIP limitas šioje lentoje' });
      }
    }

    const result = await pool.query(
      `INSERT INTO tasks (id, board_id, title, description, priority, created_by, position, due_date, deadline) 
       VALUES ($1, $2, $3, $4, $5, $6, (SELECT COUNT(*) FROM tasks WHERE board_id = $2 AND archived = false), $7, $8)
       RETURNING *`,
      [id, board_id, title, description, priority || 'medium', req.user.id, due_date || null, deadline || null]
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
    const { title, description, status, priority, assigned_to, due_date, deadline } = req.body;

    // Data validacija (ISO date strings or timestamps)
    const isValidDate = (val) => {
      if (!val) return true;
      const d = new Date(val);
      return !isNaN(d.getTime());
    };
    if (!isValidDate(due_date) || !isValidDate(deadline)) {
      return res.status(400).json({ message: 'Neteisingas datos formatas' });
    }
    
    const result = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           assigned_to = COALESCE($5, assigned_to),
           due_date = COALESCE($6, due_date),
           deadline = COALESCE($7, deadline),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [title, description, status, priority, assigned_to, due_date, deadline, req.params.id]
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

// Drag & drop: atnaujinti uždavinio statusą/poziciją ir lentą
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const { board_id, status, position } = req.body;

  if (!board_id && status === undefined && position === undefined) {
    return res.status(400).json({ message: 'Reikia board_id arba status/position' });
  }

  try {
    // Gauti task ir jo board
    const taskResult = await pool.query(
      `SELECT t.id, t.board_id, b.project_id, b.team_id
       FROM tasks t
       JOIN boards b ON b.id = t.board_id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: 'Uždavinys nerastas' });
    }
    const task = taskResult.rows[0];

    // Prieigos tikrinimas: projektui - project_members, komandai - team owner
    if (task.project_id) {
      const access = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [task.project_id, req.user.id]
      );
      if (access.rows.length === 0) {
        return res.status(403).json({ message: 'Jūs neturite prieigos prie projekto' });
      }
    }
    if (task.team_id) {
      const team = await pool.query('SELECT created_by FROM teams WHERE id = $1', [task.team_id]);
      if (team.rows.length === 0 || team.rows[0].created_by !== req.user.id) {
        return res.status(403).json({ message: 'Neturite prieigos prie šios komandos lentos' });
      }
    }

    const newBoardId = board_id || task.board_id;
    const newPosition =
      position !== undefined && position !== null
        ? position
        : task.position;

    // WIP limit check for destination board
    const destBoard = await pool.query('SELECT wip_limit FROM boards WHERE id = $1', [newBoardId]);
    if (destBoard.rows.length === 0) {
      return res.status(404).json({ message: 'Lenta nerasta' });
    }
    const wipLimit = destBoard.rows[0].wip_limit;
    if (wipLimit !== null && wipLimit >= 0) {
      const countActive = await pool.query(
        'SELECT COUNT(*) FROM tasks WHERE board_id = $1 AND archived = false AND id <> $2',
        [newBoardId, req.params.id]
      );
      if (Number(countActive.rows[0].count) >= wipLimit) {
        return res.status(400).json({ message: 'Viršytas WIP limitas šioje lentoje' });
      }
    }

    const updated = await pool.query(
      `UPDATE tasks
       SET board_id = $1,
           status = COALESCE($2, status),
           position = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [newBoardId, status, newPosition, req.params.id]
    );

    try {
      await logAudit({
        user_id: req.user.id,
        action: 'move_task',
        entity_type: 'task',
        entity_id: req.params.id,
        details: { from_board: task.board_id, to_board: newBoardId, status, position: newPosition }
      });
    } catch (e) { console.warn('Audit log failed', e); }

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Klaida atnaujinant statusą:', error);
    res.status(500).json({ message: 'Klaida atnaujinant statusą' });
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

const archiveTaskHandler = async (req, res) => {
  const { archived = true } = req.body;
  try {
    const taskRes = await pool.query(
      `SELECT t.id, t.board_id, b.project_id, b.team_id, t.created_by
       FROM tasks t
       JOIN boards b ON b.id = t.board_id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (taskRes.rows.length === 0) {
      return res.status(404).json({ message: 'Uždavinys nerastas' });
    }
    const task = taskRes.rows[0];

    // Prieigos tikrinimas
    if (task.project_id) {
      const access = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [task.project_id, req.user.id]
      );
      if (access.rows.length === 0) {
        return res.status(403).json({ message: 'Jūs neturite prieigos prie projekto' });
      }
    }
    if (task.team_id) {
      const team = await pool.query('SELECT created_by FROM teams WHERE id = $1', [task.team_id]);
      if (team.rows.length === 0 || team.rows[0].created_by !== req.user.id) {
        return res.status(403).json({ message: 'Neturite prieigos prie šios komandos lentos' });
      }
    }

    const updated = await pool.query(
      'UPDATE tasks SET archived = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [archived, req.params.id]
    );

    try {
      await logAudit({
        user_id: req.user.id,
        action: archived ? 'archive_task' : 'unarchive_task',
        entity_type: 'task',
        entity_id: req.params.id,
        details: { board_id: task.board_id }
      });
    } catch (e) { console.warn('Audit log failed', e); }

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Klaida archyvuojant uždavinį:', error);
    res.status(500).json({ message: 'Klaida archyvuojant uždavinį' });
  }
};

// Archyvuoti / atarchyvuoti uždavinį (soft delete)
router.patch('/:id/archive', authMiddleware, archiveTaskHandler);
// Alias (jei kreipiamasi /archive/:id)
router.patch('/archive/:id', authMiddleware, archiveTaskHandler);

// Pridėti komentarą prie uždavinio
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Komentaro turinys yra privalomas' });
    }

    // Patikrinti ar vartotojas priklauso komandai/projektui
    const taskRes = await pool.query(
      `SELECT t.board_id, b.team_id, b.project_id
       FROM tasks t
       JOIN boards b ON b.id = t.board_id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (taskRes.rows.length === 0) {
      return res.status(404).json({ message: 'Uždavinys nerastas' });
    }
    const taskInfo = taskRes.rows[0];
    if (taskInfo.project_id) {
      const access = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [taskInfo.project_id, req.user.id]
      );
      if (access.rows.length === 0) {
        return res.status(403).json({ message: 'Neturite prieigos prie šio projekto' });
      }
    }
    if (taskInfo.team_id) {
      const access = await pool.query(
        'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
        [taskInfo.team_id, req.user.id]
      );
      if (access.rows.length === 0) {
        return res.status(403).json({ message: 'Neturite prieigos prie šios komandos lentos' });
      }
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

// Ištrinti komentarą
router.delete('/:taskId/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const { taskId, commentId } = req.params;

    const commentRes = await pool.query(
      'SELECT id, task_id, user_id FROM comments WHERE id = $1 AND task_id = $2',
      [commentId, taskId]
    );

    if (commentRes.rows.length === 0) {
      return res.status(404).json({ message: 'Komentaras nerastas' });
    }

    if (commentRes.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Negalite ištrinti kito naudotojo komentaro' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);

    try {
      await logAudit({
        user_id: req.user.id,
        action: 'delete_comment',
        entity_type: 'comment',
        entity_id: commentId,
        details: { task_id: taskId }
      });
    } catch (e) { console.warn('Audit log failed', e); }

    res.json({ message: 'Komentaras ištrintas' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida trinant komentarą' });
  }
});

export default router;
