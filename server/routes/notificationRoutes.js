import express from 'express';
import { db } from '../db/schema.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// 1. Get Notifications for Authenticated User
router.get('/', (req, res) => {
  const userId = req.user.id;

  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 30
  `).all(userId);

  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count FROM notifications
    WHERE user_id = ? AND is_read = 0
  `).get(userId).count;

  return res.json({
    notifications,
    unreadCount
  });
});

// 2. Mark Single Notification as Read
router.post('/:id/read', (req, res) => {
  db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE id = ? AND user_id = ?
  `).run(req.params.id, req.user.id);

  return res.json({ success: true });
});

// 3. Mark All Notifications as Read
router.post('/read-all', (req, res) => {
  db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = ?
  `).run(req.user.id);

  return res.json({ success: true });
});

export default router;
