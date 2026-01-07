import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireTeamMember } from '../middleware/team.js';

const router = express.Router();

// Get audit logs for a specific project
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    // Check access: user must be a member of the project
    const access = await pool.query(
      'SELECT pm.* FROM project_members pm WHERE pm.project_id = $1 AND pm.user_id = $2',
      [req.params.projectId, req.user.id]
    );
    
    if (access.rows.length === 0) {
      return res.status(403).json({ message: 'Jūs neturite prieigos' });
    }

    // Fetch audit logs for tasks created/updated in this project
    const logs = await pool.query(
      `SELECT al.*, u.username, u.avatar_url
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.entity_type IN ('task', 'comment', 'project_member')
         AND (al.details->>'project_id' = $1 OR al.entity_type = 'task')
       ORDER BY al.created_at DESC
       LIMIT 100`,
      [req.params.projectId]
    );

    res.json(logs.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida gaunant audit žurnalą' });
  }
});

// Get all user audit logs
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    // Only admins or the user themselves can view logs
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ message: 'Jūs neturite prieigos' });
    }

    const logs = await pool.query(
      `SELECT al.* FROM audit_logs al
       WHERE al.user_id = $1
       ORDER BY al.created_at DESC
       LIMIT 100`,
      [req.params.userId]
    );

    res.json(logs.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida gaunant audit žurnalą' });
  }
});

// Get audit logs for a specific team (last 20 actions)
router.get('/team/:teamId', authMiddleware, requireTeamMember, async (req, res) => {
  const teamId = req.params.teamId;
  try {
    const logs = await pool.query(
      `SELECT al.*, u.username, u.avatar_url
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE
         -- tiesioginiai team veiksmai ar detalėse yra team_id
         (al.entity_type = 'team' AND al.entity_id = $1)
         OR (al.details->>'team_id') = $1
         -- board veiksmai komandos lentose
         OR (al.entity_type = 'board' AND al.entity_id IN (SELECT id FROM boards WHERE team_id = $1))
         OR ((al.details->>'board_id')::uuid IN (SELECT id FROM boards WHERE team_id = $1))
         -- task/komentarai susiję su komandos board'ais
         OR (al.entity_type = 'task' AND (
              (al.details->>'board_id')::uuid IN (SELECT id FROM boards WHERE team_id = $1)
              OR al.entity_id IN (
                SELECT t.id FROM tasks t JOIN boards b ON b.id = t.board_id WHERE b.team_id = $1
              )
         ))
         OR (al.entity_type = 'comment' AND (al.details->>'board_id')::uuid IN (SELECT id FROM boards WHERE team_id = $1))
       ORDER BY al.created_at DESC
       LIMIT 20`,
      [teamId]
    );

    res.json(logs.rows);
  } catch (error) {
    console.error('Klaida gaunant komandos auditą:', error);
    res.status(500).json({ message: 'Klaida gaunant audit žurnalą' });
  }
});

export default router;
