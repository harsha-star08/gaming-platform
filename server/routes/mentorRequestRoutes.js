import express from 'express';
import { db } from '../db/schema.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('STUDENT'));

// 1. List Mentor Requests received by this student
router.get('/', (req, res) => {
  const studentId = req.user.id;

  const requests = db.prepare(`
    SELECT mr.*, u.name as mentor_name, u.email as mentor_email,
      mp.expertise, mp.experience, mp.availability, mp.bio
    FROM mentor_requests mr
    JOIN users u ON mr.mentor_id = u.id
    JOIN mentor_profiles mp ON u.id = mp.user_id
    WHERE mr.student_id = ?
    ORDER BY mr.id DESC
  `).all(studentId);

  return res.json(requests);
});

// 2. Accept Mentor Request (Section 10)
router.post('/:id/accept', (req, res) => {
  const studentId = req.user.id;
  const requestId = req.params.id;

  const request = db.prepare(`
    SELECT * FROM mentor_requests WHERE id = ? AND student_id = ?
  `).get(requestId, studentId);

  if (!request) {
    return res.status(404).json({ error: 'Mentor request not found or not addressed to you.' });
  }

  if (request.status !== 'PENDING') {
    return res.status(400).json({ error: `This request has already been ${request.status.toLowerCase()}.` });
  }

  // 1. Update request status to ACCEPTED
  db.prepare(`
    UPDATE mentor_requests
    SET status = 'ACCEPTED', responded_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(requestId);

  // 2. Create or activate active relationship
  db.prepare(`
    INSERT INTO mentor_student_relationships (mentor_id, student_id, status)
    VALUES (?, ?, 'ACTIVE')
    ON CONFLICT(student_id) DO UPDATE SET mentor_id = ?, status = 'ACTIVE'
  `).run(request.mentor_id, studentId, request.mentor_id);

  // 3. Notify mentor
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (?, 'MENTOR_ACCEPTED', 'Student Accepted Mentorship!', ?, '/mentor/students')
  `).run(request.mentor_id, `${req.user.name} accepted your mentorship request. You can now view their analytics and assign tests.`);

  // 4. Notify student
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (?, 'MENTOR_CONNECTED', 'Mentor Connected', 'You are now connected with your mentor. Check My Mentor for guidance.', '/mentor/my')
  `).run(studentId);

  return res.json({
    message: 'Mentor request accepted! Mentorship is now active.',
    mentorId: request.mentor_id
  });
});

// 3. Decline Mentor Request (Section 10)
router.post('/:id/decline', (req, res) => {
  const studentId = req.user.id;
  const requestId = req.params.id;

  const request = db.prepare(`
    SELECT * FROM mentor_requests WHERE id = ? AND student_id = ?
  `).get(requestId, studentId);

  if (!request) {
    return res.status(404).json({ error: 'Mentor request not found or not addressed to you.' });
  }

  if (request.status !== 'PENDING') {
    return res.status(400).json({ error: `This request has already been ${request.status.toLowerCase()}.` });
  }

  db.prepare(`
    UPDATE mentor_requests
    SET status = 'DECLINED', responded_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(requestId);

  // Notify mentor
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (?, 'MENTOR_DECLINED', 'Mentor Request Declined', ?)
  `).run(request.mentor_id, `${req.user.name} has declined your mentorship request.`);

  return res.json({ message: 'Mentor request declined.' });
});

export default router;
