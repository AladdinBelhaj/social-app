import express from 'express';
import multer from 'multer';
import path from 'path';
import pool from '../db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join('uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

router.get('/', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const [rows] = await pool.query(
      `
      SELECT 
        p.*,
        (SELECT type FROM reactions WHERE publication_id = p.id AND user_id = ?) as user_reaction,
        (SELECT COUNT(*) FROM reactions WHERE publication_id = p.id AND type = 'like') as like_count,
        (SELECT COUNT(*) FROM reactions WHERE publication_id = p.id AND type = 'love') as love_count,
        (SELECT COUNT(*) FROM reactions WHERE publication_id = p.id AND type = 'haha') as haha_count
      FROM publications p
      LEFT JOIN social_app.friendships f 
        ON f.user_id = ? AND f.friend_id = p.user_id AND f.status = 'accepted'
      WHERE p.user_id = ? OR f.id IS NOT NULL
      ORDER BY p.created_at DESC
      `,
      [currentUserId, currentUserId, currentUserId]
    );

    const publications = rows.map(p => ({
      ...p,
      media_urls: typeof p.media_urls === 'string' ? JSON.parse(p.media_urls) : p.media_urls,
      reactions: {
        like: p.like_count,
        love: p.love_count,
        haha: p.haha_count,
        user_reaction: p.user_reaction
      }
    }));
    res.json(publications);
  } catch (error) {
    console.error('Error fetching publications:', error);
    res.status(500).json({ message: 'Failed to fetch publications' });
  }
});

router.post('/:id/react', authMiddleware, async (req, res) => {
  try {
    const publicationId = req.params.id;
    const userId = req.user.id;
    const { type } = req.body;

    if (!['like', 'love', 'haha'].includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    // Check if reaction exists
    const [[existing]] = await pool.query(
      'SELECT id, type FROM reactions WHERE publication_id = ? AND user_id = ?',
      [publicationId, userId]
    );

    if (existing) {
      if (existing.type === type) {
        // Toggle off
        await pool.query('DELETE FROM reactions WHERE id = ?', [existing.id]);
        return res.json({ action: 'removed' });
      } else {
        // Change type
        await pool.query('UPDATE reactions SET type = ? WHERE id = ?', [type, existing.id]);
        return res.json({ action: 'updated', type });
      }
    } else {
      // New reaction
      await pool.query(
        'INSERT INTO reactions (publication_id, user_id, type) VALUES (?, ?, ?)',
        [publicationId, userId, type]
      );
      return res.status(201).json({ action: 'added', type });
    }
  } catch (error) {
    console.error('Error reacting to publication:', error);
    res.status(500).json({ message: 'Failed to process reaction' });
  }
});

router.post('/', authMiddleware, upload.array('mediaFiles', 5), async (req, res) => {
  try {
    const { text } = req.body;
    const user_id = req.user.id;
    const mediaUrls = req.files.map(file => `/uploads/${file.filename}`);

    const [result] = await pool.query(
      'INSERT INTO publications (user_id, text, media_urls) VALUES (?, ?, ?)',
      [user_id, text, JSON.stringify(mediaUrls)]
    );

    res.status(201).json({
      id: result.insertId,
      user_id,
      text,
      mediaUrls
    });
  } catch (error) {
    console.error('Error creating publication:', error);
    res.status(500).json({ message: 'Failed to create publication' });
  }
});

export default router;
