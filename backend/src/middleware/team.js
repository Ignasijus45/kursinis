import { pool } from '../config/database.js';

// Tikrinti, ar vartotojas priklauso komandai (arba yra kūrėjas)
export const requireTeamMember = async (req, res, next) => {
  const teamId = req.params.id || req.params.teamId;
  if (!teamId) {
    return res.status(400).json({ message: 'Trūksta komandos ID' });
  }

  try {
    const teamResult = await pool.query('SELECT id, created_by FROM teams WHERE id = $1', [teamId]);
    if (teamResult.rows.length === 0) {
      return res.status(404).json({ message: 'Komanda nerasta' });
    }

    const team = teamResult.rows[0];
    if (team.created_by === req.user.id) {
      req.team = team;
      return next();
    }

    const membership = await pool.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ message: 'Neturite prieigos prie šios komandos' });
    }

    req.team = team;
    return next();
  } catch (error) {
    console.error('Klaida tikrinant komandos narystę:', error);
    return res.status(500).json({ message: 'Klaida tikrinant komandos narystę' });
  }
};

// Tik kūrėjas (OWNER) gali tęsti
export const requireTeamOwner = async (req, res, next) => {
  const teamId = req.params.id || req.params.teamId;
  if (!teamId) {
    return res.status(400).json({ message: 'Trūksta komandos ID' });
  }

  try {
    const teamResult = await pool.query('SELECT id, created_by FROM teams WHERE id = $1', [teamId]);
    if (teamResult.rows.length === 0) {
      return res.status(404).json({ message: 'Komanda nerasta' });
    }

    const team = teamResult.rows[0];
    if (team.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Neturite teisės šiam veiksmui' });
    }

    req.team = team;
    return next();
  } catch (error) {
    console.error('Klaida tikrinant komandos teisę:', error);
    return res.status(500).json({ message: 'Klaida tikrinant komandos teisę' });
  }
};
