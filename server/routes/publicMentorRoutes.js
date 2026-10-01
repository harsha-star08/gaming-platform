import express from 'express';
import { db } from '../db/schema.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── Public / Student routes for browsing and requesting mentors ───────────────

// GET /api/mentors — browse all available mentors (requires auth, student only)
router.get('/', authenticateToken, requireRole('STUDENT'), (req, res) => {
  const studentId = req.user.id;
  const { query, expertise, availability } = req.query;

  let sql = `
    SELECT
      u.id,
      u.name,
      mp.expertise,
      mp.experience,
      mp.availability,
      mp.bio,
      mp.capacity,
      (SELECT COUNT(*) FROM mentor_student_relationships WHERE mentor_id = u.id AND status = 'ACTIVE') as students_count,
      (SELECT status FROM mentor_requests WHERE student_id = ? AND mentor_id = u.id AND status = 'PENDING' LIMIT 1) as pending_request_status,
      (SELECT status FROM mentor_student_relationships WHERE student_id = ? AND mentor_id = u.id AND status = 'ACTIVE' LIMIT 1) as relationship_status
    FROM users u
    JOIN mentor_profiles mp ON u.id = mp.user_id
    WHERE u.role = 'MENTOR'
  `;

  const params = [studentId, studentId];

  if (query) {
    sql += ` AND (u.name LIKE ? OR mp.expertise LIKE ? OR mp.bio LIKE ?)`;
    params.push(`%${query}%`, `%${query}%`, `%${query}%`);
  }

  if (expertise) {
    sql += ` AND mp.expertise LIKE ?`;
    params.push(`%${expertise}%`);
  }

  if (availability) {
    sql += ` AND mp.availability LIKE ?`;
    params.push(`%${availability}%`);
  }

  sql += ` ORDER BY u.id DESC`;

  const mentors = db.prepare(sql).all(...params);

  // Also get total count of mentors
  const totalCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'MENTOR'").get().count;

  return res.json({
    mentors,
    totalCount
  });
});

// POST /api/mentors/:mentorId/request — student sends request to mentor
router.post('/:mentorId/request', authenticateToken, requireRole('STUDENT'), (req, res) => {
  try {
    const studentId = req.user.id;
    const mentorId = parseInt(req.params.mentorId, 10);
    const { message } = req.body;

    // Validate mentor exists
    const mentor = db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'MENTOR'").get(mentorId);
    if (!mentor) return res.status(404).json({ error: 'Mentor not found.' });

    // Cannot request yourself (edge case)
    if (mentorId === studentId) return res.status(400).json({ error: 'Invalid request.' });

    // Check existing active relationship
    const activeRel = db.prepare(`
      SELECT id FROM mentor_student_relationships WHERE mentor_id = ? AND student_id = ? AND status = 'ACTIVE'
    `).get(mentorId, studentId);
    if (activeRel) return res.status(400).json({ error: 'You are already connected with this mentor.' });

    // Check pending request already sent
    const existingPending = db.prepare(`
      SELECT id FROM mentor_requests WHERE mentor_id = ? AND student_id = ? AND status = 'PENDING'
    `).get(mentorId, studentId);
    if (existingPending) return res.status(400).json({ error: 'You already have a pending request to this mentor.' });

    // Insert request
    const reqResult = db.prepare(`
      INSERT INTO mentor_requests (mentor_id, student_id, message, status)
      VALUES (?, ?, ?, 'PENDING')
    `).run(mentorId, studentId, message || `Hello! I am ${req.user.name} and I would love to be mentored by you.`);

    // Notify mentor
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'MENTOR_REQUEST', 'New Mentor Request', ?, '/mentor/incoming-requests')
    `).run(mentorId, `${req.user.name} sent you a mentor request.`);

    return res.status(201).json({
      message: 'Mentor request sent successfully.',
      requestId: reqResult.lastInsertRowid
    });
  } catch (err) {
    console.error('Error sending mentor request:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/mentors/my-requests — student's own outgoing requests
router.get('/my-requests', authenticateToken, requireRole('STUDENT'), (req, res) => {
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

// GET /api/mentors/my-mentor — get the student's active mentor
router.get('/my-mentor', authenticateToken, requireRole('STUDENT'), (req, res) => {
  const studentId = req.user.id;

  const mentor = db.prepare(`
    SELECT u.id, u.name, u.email, mp.expertise, mp.experience, mp.availability, mp.bio,
      msr.created_at as connected_since
    FROM mentor_student_relationships msr
    JOIN users u ON msr.mentor_id = u.id
    JOIN mentor_profiles mp ON u.id = mp.user_id
    WHERE msr.student_id = ? AND msr.status = 'ACTIVE'
  `).get(studentId);

  return res.json({ mentor: mentor || null });
});

export default router;
