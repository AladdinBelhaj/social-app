import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import axios from 'axios';  // npm install axios


const router = Router();

const mapUser = (row) => ({
  id: row.id,
  email: row.email,
  username: row.username,
  full_name: row.full_name,
  bio: row.bio,
  avatar_url: row.avatar_url,
  created_at: row.created_at,
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, username, fullName } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: 'Email, password, and username are required' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
      [email, username],
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email or username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [insertResult] = await pool.query(
      'INSERT INTO users (email, password, username, full_name) VALUES (?, ?, ?, ?)',
      [email, passwordHash, username, fullName || null],
    );

    const userId = insertResult.insertId;
    const [[userRow]] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);

    const token = jwt.sign(
      { id: userId, email },
      process.env.JWT_SECRET || 'SMAPP_JWT_SECRET',
      { expiresIn: '7d' },
    );

    // ✅ SYNC USER TO MESSAGING SERVICE
    try {
      await axios.post(
        'http://localhost:8000/api/messaging/users/sync',
        {
          username: username,
          email: email,
          password: passwordHash,
          full_name: fullName || null,
        },
        {
          headers: {
            'X-Internal-Key': process.env.INTERNAL_SERVICE_KEY || 'dev-internal-key',
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );
      console.log(`✓ User ${username} (id=${userId}) synced to messaging service`);
    } catch (syncError) {
      console.error(`✗ Failed to sync user: ${syncError.message}`);
      // Don't fail registration - this is non-critical
    }

    return res.status(201).json({
      token,
      user: mapUser(userRow),
    });

  } catch (error) {
    console.error('Register error', error);
    return res.status(500).json({ message: 'Failed to register user' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [[userRow]] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (!userRow) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, userRow.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: userRow.id, email: userRow.email },
      process.env.JWT_SECRET || 'SMAPP_JWT_SECRET',
      { expiresIn: '7d' },
    );

    return res.json({
      token,
      user: mapUser(userRow),
    });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ message: 'Failed to login' });
  }
});

// ✅ Token validation endpoint for microservices (e.g., messaging service)
router.get('/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || 'SMAPP_JWT_SECRET'
      );

      const [[userRow]] = await pool.query('SELECT id, username, email FROM users WHERE id = ?', [payload.id]);
      if (!userRow) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Return user data in format expected by messaging service
      return res.json({
        user_id: userRow.id,
        username: userRow.username,
        email: userRow.email,
      });
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Token validation error', error);
    return res.status(500).json({ message: 'Failed to validate token' });
  }
});

export default router;

