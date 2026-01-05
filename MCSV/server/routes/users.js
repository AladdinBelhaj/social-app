import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../utils/authMiddleware.js';

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

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [[userRow]] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);

    if (!userRow) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: mapUser(userRow) });
  } catch (error) {
    console.error('Fetch profile error', error);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { full_name: fullName, bio, avatar_url: avatarUrl } = req.body;
    const fields = [];
    const values = [];

    if (fullName !== undefined) {
      fields.push('full_name = ?');
      values.push(fullName);
    }
    if (bio !== undefined) {
      fields.push('bio = ?');
      values.push(bio);
    }
    if (avatarUrl !== undefined) {
      fields.push('avatar_url = ?');
      values.push(avatarUrl);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No profile fields to update' });
    }

    values.push(req.user.id);
    const updateQuery = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await pool.query(updateQuery, values);

    const [[userRow]] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);

    // ✅ SYNC PROFILE UPDATE TO MESSAGING SERVICE
    try {
      await axios.post(
        'http://localhost:8000/api/messaging/users/sync',
        {
          username: userRow.username,
          email: userRow.email,
          full_name: userRow.full_name,
          bio: userRow.bio,
          avatar_url: userRow.avatar_url,
        },
        {
          headers: {
            'X-Internal-Key': process.env.INTERNAL_SERVICE_KEY || 'dev-internal-key',
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );
      console.log(`✓ User profile ${userRow.username} (id=${req.user.id}) synced to messaging service`);
    } catch (syncError) {
      console.error(`✗ Failed to sync profile update: ${syncError.message}`);
      // Don't fail profile update - this is non-critical
    }

    return res.json({ user: mapUser(userRow) });
  } catch (error) {
    console.error('Update profile error', error);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [[userRow]] = await pool.query(
      'SELECT id, username, full_name, avatar_url FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!userRow) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: mapUser(userRow) });
  } catch (error) {
    console.error('Fetch user by ID error', error);
    return res.status(500).json({ message: 'Failed to fetch user' });
  }
});

export default router;

