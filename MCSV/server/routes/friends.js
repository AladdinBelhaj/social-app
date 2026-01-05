import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../utils/authMiddleware.js';

const router = Router();

const mapFriend = (row) => ({
  id: row.id,
  friend_id: row.friend_id,
  friend: {
    id: row.friend_id,
    username: row.username,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
  },
});

const mapPending = (row) => ({
  id: row.id,
  user_id: row.user_id,
  user: {
    id: row.user_id,
    username: row.username,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
  },
});

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT f.id, f.friend_id, u.username, u.full_name, u.avatar_url
      FROM friendships f
      JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = ? AND f.status = 'accepted'
      ORDER BY u.username ASC
    `,
      [req.user.id],
    );

    return res.json({ friends: rows.map(mapFriend) });
  } catch (error) {
    console.error('Load friends error', error);
    return res.status(500).json({ message: 'Failed to load friends' });
  }
});

router.get('/pending', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT f.id, f.user_id, u.username, u.full_name, u.avatar_url
      FROM friendships f
      JOIN users u ON u.id = f.user_id
      WHERE f.friend_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `,
      [req.user.id],
    );

    return res.json({ pending: rows.map(mapPending) });
  } catch (error) {
    console.error('Load pending requests error', error);
    return res.status(500).json({ message: 'Failed to load pending requests' });
  }
});

router.get('/sent', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT f.id, f.friend_id, u.username, u.full_name, u.avatar_url
      FROM friendships f
      JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `,
      [req.user.id],
    );

    return res.json({
      sent: rows.map((row) => ({
        id: row.id,
        friend: {
          id: row.friend_id,
          username: row.username,
          full_name: row.full_name,
          avatar_url: row.avatar_url,
        },
      })),
    });
  } catch (error) {
    console.error('Load sent requests error', error);
    return res.status(500).json({ message: 'Failed to load sent requests' });
  }
});

router.post('/search', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username search term is required' });
    }

    const [rows] = await pool.query(
      `
      SELECT id, username, full_name, avatar_url
      FROM users
      WHERE username LIKE ? AND id != ?
      ORDER BY username ASC
      LIMIT 10
    `,
      [`%${username}%`, req.user.id],
    );

    return res.json({ results: rows });
  } catch (error) {
    console.error('Search users error', error);
    return res.status(500).json({ message: 'Failed to search users' });
  }
});

router.post('/requests', async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) {
      return res.status(400).json({ message: 'friendId is required' });
    }

    if (Number(friendId) === Number(req.user.id)) {
      return res.status(400).json({ message: 'Cannot friend yourself' });
    }

    const [[existing]] = await pool.query(
      'SELECT id, status FROM friendships WHERE user_id = ? AND friend_id = ?',
      [req.user.id, friendId],
    );

    if (existing) {
      return res.status(409).json({ message: `Request already ${existing.status}` });
    }

    await pool.query(
      'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, "pending")',
      [req.user.id, friendId],
    );

    return res.status(201).json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Send friend request error', error);
    return res.status(500).json({ message: 'Failed to send friend request' });
  }
});

router.post('/requests/:id/accept', async (req, res) => {
  try {
    const requestId = req.params.id;
    const [[request]] = await pool.query(
      'SELECT * FROM friendships WHERE id = ? AND friend_id = ? AND status = "pending"',
      [requestId, req.user.id],
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    await pool.query('UPDATE friendships SET status = "accepted" WHERE id = ?', [requestId]);

    await pool.query(
      'INSERT IGNORE INTO friendships (user_id, friend_id, status) VALUES (?, ?, "accepted")',
      [req.user.id, request.user_id],
    );

    return res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept friend request error', error);
    return res.status(500).json({ message: 'Failed to accept friend request' });
  }
});

router.delete('/requests/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    await pool.query(
      'DELETE FROM friendships WHERE id = ? AND friend_id = ? AND status = "pending"',
      [requestId, req.user.id],
    );
    return res.json({ message: 'Friend request removed' });
  } catch (error) {
    console.error('Reject friend request error', error);
    return res.status(500).json({ message: 'Failed to reject friend request' });
  }
});

router.delete('/:friendId', async (req, res) => {
  try {
    const friendId = req.params.friendId;
    await pool.query(
      'DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [req.user.id, friendId, friendId, req.user.id],
    );
    return res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error', error);
    return res.status(500).json({ message: 'Failed to remove friend' });
  }
});

export default router;

