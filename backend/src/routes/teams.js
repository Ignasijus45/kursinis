import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { requireTeamMember, requireTeamOwner } from '../middleware/team.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Gauti vartotojo komandas
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT t.*
       FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Klaida gaunant komandas:', error);
    res.status(500).json({ message: 'Klaida gaunant komandas' });
  }
});

// Sukurti komandą
router.post('/', authMiddleware, async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Pavadinimas privalomas' });
  }
  if (name.trim().length > 255) {
    return res.status(400).json({ message: 'Pavadinimas per ilgas (maks. 255 simbolių)' });
  }

  const client = await pool.connect();
  try {
    // User validation (apsauga nuo pasenusių tokenų)
    const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(401).json({ message: 'Vartotojas nebegalioja (token pasenęs)' });
    }

    await client.query('BEGIN');

    const teamResult = await client.query(
      `INSERT INTO teams (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, created_by, created_at, updated_at`,
      [name.trim(), description || null, req.user.id]
    );

    const team = teamResult.rows[0];

    // Pridėti kūrėją kaip OWNER į team_members
    await client.query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, 'OWNER')
       ON CONFLICT (team_id, user_id) DO NOTHING`,
      [team.id, req.user.id]
    );

    try {
      await logAudit({
        user_id: req.user.id,
        action: 'create_team',
        entity_type: 'team',
        entity_id: team.id,
        details: { name: team.name, description }
      });
    } catch (auditErr) {
      console.warn('Audit failed', auditErr);
    }

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Komanda sukurta',
      team
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Klaida kuriant komandą:', error);
    res.status(500).json({ message: 'Klaida kuriant komandą' });
  } finally {
    client.release();
  }
});

// Ištrinti komandą (tik savininkas/OWNER)
router.delete('/:id', authMiddleware, async (req, res) => {
  const teamId = req.params.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Patikrinti ar naudotojas yra kūrėjas
    const teamRes = await client.query('SELECT id, name, created_by FROM teams WHERE id = $1', [teamId]);
    if (teamRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Komanda nerasta' });
    }
    if (teamRes.rows[0].created_by !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Tik komandos savininkas gali ištrinti komandą' });
    }

    // Trinti komentarus -> tasks -> boards -> team_members -> team
    await client.query(
      `DELETE FROM comments 
       WHERE task_id IN (
         SELECT t.id FROM tasks t
         JOIN boards b ON b.id = t.board_id
         WHERE b.team_id = $1
       )`,
      [teamId]
    );
    await client.query(
      `DELETE FROM tasks
       WHERE board_id IN (SELECT id FROM boards WHERE team_id = $1)`,
      [teamId]
    );
    await client.query('DELETE FROM boards WHERE team_id = $1', [teamId]);
    await client.query('DELETE FROM team_members WHERE team_id = $1', [teamId]);
    await client.query('DELETE FROM teams WHERE id = $1', [teamId]);

    try {
      await logAudit({
        user_id: req.user.id,
        action: 'delete_team',
        entity_type: 'team',
        entity_id: teamId,
        details: null
      });
    } catch (auditErr) {
      console.warn('Audit failed', auditErr);
    }

    await client.query('COMMIT');
    res.json({ message: 'Komanda ištrinta' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Klaida trinant komandą:', error);
    res.status(500).json({ message: 'Klaida trinant komandą' });
  } finally {
    client.release();
  }
});
// Pakviesti narį į komandą
router.post('/:id/invite', authMiddleware, requireTeamOwner, async (req, res) => {
  const teamId = req.params.id;
  const { user_id, role } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: 'Reikalingas user_id' });
  }

  const client = await pool.connect();
  try {
    // Tikrinti, ar komanda egzistuoja ir ar kviečiantis yra kūrėjas (OWNER)
    const teamResult = await client.query('SELECT created_by FROM teams WHERE id = $1', [teamId]);
    if (teamResult.rows.length === 0) {
      return res.status(404).json({ message: 'Komanda nerasta' });
    }

    // Patikrinti, ar vartotojas egzistuoja
    const userResult = await client.query('SELECT id, email, username FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Vartotojas nerastas' });
    }

    const memberInsert = await client.query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (team_id, user_id) DO NOTHING
       RETURNING id, team_id, user_id, role, added_at`,
      [teamId, user_id, role || 'MEMBER']
    );

    const inserted = memberInsert.rows[0];

    try {
      await logAudit({
        user_id: req.user.id,
        action: 'add_team_member',
        entity_type: 'team',
        entity_id: teamId,
        details: {
          invited_user_id: user_id,
          role: role || 'MEMBER',
          already_member: !inserted
        }
      });
    } catch (auditErr) {
      console.warn('Audit failed', auditErr);
    }

    if (!inserted) {
      return res.status(200).json({ message: 'Vartotojas jau komandoje' });
    }

    return res.status(201).json({
      message: 'Narys pakviestas į komandą',
      member: inserted
    });
  } catch (error) {
    console.error('Klaida kviečiant narį:', error);
    res.status(500).json({ message: 'Klaida kviečiant narį' });
  } finally {
    client.release();
  }
});

export default router;

// Gauti komandos narius
router.get('/:id/members', authMiddleware, requireTeamMember, async (req, res) => {
  const teamId = req.params.id;
  const client = await pool.connect();
  try {
    const members = await client.query(
      `SELECT tm.id, tm.team_id, tm.user_id, tm.role, tm.added_at,
              u.email, u.username, u.full_name
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1
       ORDER BY tm.added_at ASC`,
      [teamId]
    );

    res.json(members.rows);
  } catch (error) {
    console.error('Klaida gaunant narius:', error);
    res.status(500).json({ message: 'Klaida gaunant komandos narius' });
  } finally {
    client.release();
  }
});

// Pašalinti narį iš komandos (leidžiama tik komandos kūrėjui)
router.delete('/:id/members/:userId', authMiddleware, requireTeamOwner, async (req, res) => {
  const teamId = req.params.id;
  const userId = req.params.userId;

  const client = await pool.connect();
  try {
    // Tikrinti, ar komanda egzistuoja ir ar šalinantis yra kūrėjas (OWNER)
    const teamResult = await client.query('SELECT created_by FROM teams WHERE id = $1', [teamId]);
    if (teamResult.rows.length === 0) {
      return res.status(404).json({ message: 'Komanda nerasta' });
    }
    if (teamResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Neturite teisės šalinti narių' });
    }

    // Neleisti pašalinti OWNER (kūrėjo)
    if (teamResult.rows[0].created_by === userId) {
      return res.status(400).json({ message: 'Negalima pašalinti komandos OWNER' });
    }

    const deleteResult = await client.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 RETURNING id, team_id, user_id, role, added_at',
      [teamId, userId]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Narys nerastas komandoje' });
    }

    try {
      await logAudit({
        user_id: req.user.id,
        action: 'remove_team_member',
        entity_type: 'team',
        entity_id: teamId,
        details: { removed_user_id: userId }
      });
    } catch (auditErr) {
      console.warn('Audit failed', auditErr);
    }

    return res.status(200).json({
      message: 'Narys pašalintas iš komandos',
      member: deleteResult.rows[0]
    });
  } catch (error) {
    console.error('Klaida šalinant narį:', error);
    res.status(500).json({ message: 'Klaida šalinant narį' });
  } finally {
    client.release();
  }
});

// Gauti komandos lentas
router.get('/:id/boards', authMiddleware, requireTeamMember, async (req, res) => {
  const teamId = req.params.id;
  const includeArchived = req.query.include_archived === 'true';
  try {
    const boards = await pool.query(
      `SELECT id, project_id, team_id, title, position, created_at, updated_at, archived
       FROM boards
       WHERE team_id = $1 ${includeArchived ? '' : 'AND archived = false'}
       ORDER BY position`,
      [teamId]
    );
    res.json(boards.rows);
  } catch (error) {
    console.error('Klaida gaunant lentas:', error);
    res.status(500).json({ message: 'Klaida gaunant komandos lentas' });
  }
});

// Sukurti komandai lentą
router.post('/:id/boards', authMiddleware, requireTeamOwner, async (req, res) => {
    const teamId = req.params.id;
    const { title, wip_limit } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Pavadinimas privalomas' });
  }
  if (title.trim().length > 255) {
    return res.status(400).json({ message: 'Pavadinimas per ilgas (maks. 255 simbolių)' });
  }

  try {
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO boards (id, project_id, team_id, title, position, wip_limit)
       VALUES ($1, NULL, $2, $3, (SELECT COUNT(*) FROM boards WHERE team_id = $2), $4)
       RETURNING *`,
      [id, teamId, title.trim(), wip_limit ?? null]
    );

    try {
      await logAudit({
        user_id: req.user.id,
        action: 'create_board',
        entity_type: 'board',
        entity_id: id,
        details: { team_id: teamId, title: title.trim() }
      });
    } catch (auditErr) {
      console.warn('Audit failed', auditErr);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Klaida kuriant lentą:', error);
    res.status(500).json({ message: 'Klaida kuriant lentą' });
  }
});
