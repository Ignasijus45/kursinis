import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

// Registracija
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, full_name } = req.body;
    
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Privalomi laukai: email, username, password' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    
    const result = await pool.query(
      'INSERT INTO users (id, email, username, password_hash, full_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, username, full_name',
      [id, email, username, passwordHash, full_name]
    );

    // Audit
    try {
      await logAudit({
        user_id: id,
        action: 'register_user',
        entity_type: 'user',
        entity_id: id,
        details: { email, username, full_name }
      });
    } catch (e) { console.warn('Audit failed', e); }

    const token = jwt.sign({ id, email, username }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.status(201).json({
      message: 'Naudotojas sėkmingai registruotas',
      user: result.rows[0],
      token
    });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El. paštas arba naudotojo vardas jau egzistuoja' });
    }
    res.status(500).json({ message: 'Klaida registruojant naudotoją' });
  }
});

// Prisijungimas
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Reikalingas el. paštas ir slaptažodis' });
    }
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Neteisingas el. paštas arba slaptažodis' });
    }
    
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Neteisingas el. paštas arba slaptažodis' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    res.json({
      message: 'Sėkmingai prisijungta',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida prisijungiant' });
  }
});

// Gauti naudotoją
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, username, full_name, avatar_url, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Naudotojas nerasta' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida gaunant naudotoją' });
  }
});

// Atnaujinti naudotoją
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Jūs negalite atnaujinti kito naudotojo' });
    }
    
    const { full_name, avatar_url } = req.body;
    
    const result = await pool.query(
      'UPDATE users SET full_name = COALESCE($1, full_name), avatar_url = COALESCE($2, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, email, username, full_name, avatar_url',
      [full_name, avatar_url, req.params.id]
    );

    try {
      await logAudit({
        user_id: req.user.id,
        action: 'update_user',
        entity_type: 'user',
        entity_id: req.params.id,
        details: { full_name, avatar_url }
      });
    } catch (e) { console.warn('Audit failed', e); }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Klaida atnaujinant naudotoją' });
  }
});

export default router;
