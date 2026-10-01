import express from 'express';
import { db } from '../db/schema.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('MENTOR'));

// GET /api/mentor-inbox — list all incoming requests to this mentor
router.get('/', (req, res) => {
  const mentorId = req.user.id;

  const requests = db.prepare(`
    SELECT
      mr.id,
      mr.student_id,
      mr.message,
      mr.status,
      mr.created_at,
      mr.responded_at,
      u.name as student_name,
      u.email as student_email,
      sp.level as student_level,
      sp.xp as student_xp,
      sp.current_streak,
      COALESCE(cp.progress_percent, 0) as progress_percent,
      (SELECT c.title FROM course_progress cp2 JOIN courses c ON cp2.course_id = c.id WHERE cp2.student_id = u.id ORDER BY cp2.id DESC LIMIT 1) as course_title,
      (SELECT COUNT(*) FROM student_badges WHERE student_id = u.id) as badges_count
    FROM mentor_requests mr
    JOIN users u ON mr.student_id = u.id
    JOIN student_profiles sp ON u.id = sp.user_id
    LEFT JOIN course_progress cp ON u.id = cp.student_id
    WHERE mr.mentor_id = ?
    ORDER BY mr.id DESC
  `).all(mentorId);

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return res.json({ requests, pendingCount });
});

// POST /api/mentor-inbox/:id/accept — mentor accepts student request
router.post('/:id/accept', (req, res) => {
  const mentorId = req.user.id;
  const requestId = req.params.id;

  const request = db.prepare(`
    SELECT * FROM mentor_requests WHERE id = ? AND mentor_id = ?
  `).get(requestId, mentorId);

  if (!request) {
    return res.status(404).json({ error: 'Request not found or does not belong to you.' });
  }

  if (request.status !== 'PENDING') {
    return res.status(400).json({ error: `This request is already ${request.status.toLowerCase()}.` });
  }

  // Update request status
  db.prepare(`
    UPDATE mentor_requests SET status = 'ACCEPTED', responded_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(requestId);

  // Create/update active relationship
  db.prepare(`
    INSERT INTO mentor_student_relationships (mentor_id, student_id, status)
    VALUES (?, ?, 'ACTIVE')
    ON CONFLICT(student_id) DO UPDATE SET mentor_id = ?, status = 'ACTIVE'
  `).run(mentorId, request.student_id, mentorId);

  // Notify student
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (?, 'MENTOR_ACCEPTED', 'Mentor Request Accepted!', ?, '/mentor/my-mentor')
  `).run(request.student_id, `${req.user.name} accepted your mentor request. You are now connected!`);

  return res.json({ message: 'Request accepted. Student is now connected to you.' });
});

// POST /api/mentor-inbox/:id/decline — mentor declines student request
router.post('/:id/decline', (req, res) => {
  const mentorId = req.user.id;
  const requestId = req.params.id;

  const request = db.prepare(`
    SELECT * FROM mentor_requests WHERE id = ? AND mentor_id = ?
  `).get(requestId, mentorId);

  if (!request) {
    return res.status(404).json({ error: 'Request not found or does not belong to you.' });
  }

  if (request.status !== 'PENDING') {
    return res.status(400).json({ error: `This request is already ${request.status.toLowerCase()}.` });
  }

  db.prepare(`
    UPDATE mentor_requests SET status = 'DECLINED', responded_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(requestId);

  // Notify student
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (?, 'MENTOR_DECLINED', 'Mentor Request Declined', ?)
  `).run(request.student_id, `${req.user.name} declined your mentor request.`);

  return res.json({ message: 'Request declined.' });
});

export default router;
