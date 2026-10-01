import express from 'express';
import crypto from 'node:crypto';
import { db } from '../db/schema.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('MENTOR'));

// 1. Mentor Dashboard Statistics
router.get('/dashboard', (req, res) => {
  const mentorId = req.user.id;

  // Connected students
  const connectedStudents = db.prepare(`
    SELECT u.id, u.name, u.email, sp.xp, sp.level, sp.current_streak, sp.streak_broken,
      COALESCE(cp.progress_percent, 0) as progress_percent
    FROM mentor_student_relationships msr
    JOIN users u ON msr.student_id = u.id
    JOIN student_profiles sp ON u.id = sp.user_id
    LEFT JOIN course_progress cp ON u.id = cp.student_id
    WHERE msr.mentor_id = ? AND msr.status = 'ACTIVE'
  `).all(mentorId);

  const totalStudents = connectedStudents.length;

  // Calculate active students (active streak > 0)
  const activeStudents = connectedStudents.filter(s => s.current_streak > 0).length;

  // Average progress
  const avgProgress = totalStudents > 0
    ? Math.round(connectedStudents.reduce((acc, s) => acc + s.progress_percent, 0) / totalStudents)
    : 0;

  // Calculate accuracy across connected students
  const accuracyRows = totalStudents > 0 ? db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END), 0) as correct_quizzes,
      COUNT(qa.id) as total_quizzes,
      COALESCE(SUM(CASE WHEN cs.status = 'ACCEPTED' THEN 1 ELSE 0 END), 0) as correct_codes,
      COUNT(cs.id) as total_codes
    FROM mentor_student_relationships msr
    LEFT JOIN question_attempts qa ON msr.student_id = qa.student_id
    LEFT JOIN code_submissions cs ON msr.student_id = cs.student_id
    WHERE msr.mentor_id = ? AND msr.status = 'ACTIVE'
  `).get(mentorId) : { correct_quizzes: 0, total_quizzes: 0, correct_codes: 0, total_codes: 0 };

  const totalAttempts = (accuracyRows.total_quizzes || 0) + (accuracyRows.total_codes || 0);
  const totalCorrect = (accuracyRows.correct_quizzes || 0) + (accuracyRows.correct_codes || 0);
  const avgAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  // Students needing attention (progress < 25% or broken streak)
  const studentsNeedingAttention = connectedStudents.filter(s => s.progress_percent < 25 || s.streak_broken === 1).length;

  // Recent assignments sent by mentor
  const assignments = db.prepare(`
    SELECT a.*,
      (SELECT COUNT(*) FROM assignment_recipients WHERE assignment_id = a.id) as total_assigned,
      (SELECT COUNT(*) FROM assignment_recipients WHERE assignment_id = a.id AND status = 'SUBMITTED') as total_submitted
    FROM assignments a
    WHERE a.mentor_id = ?
    ORDER BY a.id DESC
    LIMIT 5
  `).all(mentorId);

  // Pending requests count
  const pendingRequestsCount = db.prepare(`
    SELECT COUNT(*) as count FROM mentor_requests WHERE mentor_id = ? AND status = 'PENDING'
  `).get(mentorId).count;

  return res.json({
    mentor: req.user,
    stats: {
      totalStudents,
      activeStudents,
      avgProgress,
      avgAccuracy,
      studentsNeedingAttention,
      pendingRequestsCount
    },
    students: connectedStudents,
    recentAssignments: assignments
  });
});

// 2. Search Students (Directory - Public data ONLY, Section 8 & 10)
router.get('/students/search', (req, res) => {
  const mentorId = req.user.id;
  const { query, course, minLevel } = req.query;

  let sql = `
    SELECT u.id, u.name, u.email, sp.level,
      (SELECT COUNT(*) FROM student_badges WHERE student_id = u.id) as badges_count,
      (SELECT c.title FROM course_progress cp JOIN courses c ON cp.course_id = c.id WHERE cp.student_id = u.id LIMIT 1) as course_title,
      (SELECT status FROM mentor_requests WHERE mentor_id = ? AND student_id = u.id ORDER BY id DESC LIMIT 1) as request_status,
      (SELECT status FROM mentor_student_relationships WHERE mentor_id = ? AND student_id = u.id) as relationship_status
    FROM users u
    JOIN student_profiles sp ON u.id = sp.user_id
    WHERE u.role = 'STUDENT'
  `;

  const params = [mentorId, mentorId];

  if (query) {
    sql += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
    params.push(`%${query}%`, `%${query}%`);
  }

  if (minLevel) {
    sql += ` AND sp.level >= ?`;
    params.push(parseInt(minLevel, 10));
  }

  sql += ` ORDER BY u.id DESC LIMIT 50`;

  const students = db.prepare(sql).all(...params);
  return res.json(students);
});

// 3. List Connected Students
router.get('/students', (req, res) => {
  const mentorId = req.user.id;
  const students = db.prepare(`
    SELECT u.id, u.name, u.email, sp.xp, sp.level, sp.current_streak, sp.streak_broken,
      COALESCE(cp.progress_percent, 0) as progress_percent,
      (SELECT COUNT(*) FROM student_badges WHERE student_id = u.id) as badges_count,
      msr.created_at as connected_since
    FROM mentor_student_relationships msr
    JOIN users u ON msr.student_id = u.id
    JOIN student_profiles sp ON u.id = sp.user_id
    LEFT JOIN course_progress cp ON u.id = cp.student_id
    WHERE msr.mentor_id = ? AND msr.status = 'ACTIVE'
    ORDER BY msr.id DESC
  `).all(mentorId);

  return res.json(students);
});

// 4. Detailed Student Analytics (RESTRICTED TO CONNECTED STUDENTS ONLY! Section 8)
router.get('/students/:studentId/analytics', (req, res) => {
  const mentorId = req.user.id;
  const studentId = parseInt(req.params.studentId, 10);

  // Security check: Must have active relationship
  const rel = db.prepare(`
    SELECT id FROM mentor_student_relationships
    WHERE mentor_id = ? AND student_id = ? AND status = 'ACTIVE'
  `).get(mentorId, studentId);

  if (!rel) {
    return res.status(403).json({
      error: 'Access denied. Detailed analytics are restricted until the student accepts your mentor request.'
    });
  }

  const student = db.prepare(`
    SELECT u.id, u.name, u.email, sp.*
    FROM users u
    JOIN student_profiles sp ON u.id = sp.user_id
    WHERE u.id = ?
  `).get(studentId);

  const courseProgress = db.prepare(`
    SELECT c.title, c.slug, cp.progress_percent, cp.completed_levels, cp.current_level
    FROM courses c
    LEFT JOIN course_progress cp ON c.id = cp.course_id AND cp.student_id = ?
  `).all(studentId);

  const completedTopics = db.prepare(`
    SELECT ct.title, ct.level_number, tp.completed_at
    FROM topic_progress tp
    JOIN course_topics ct ON tp.topic_id = ct.id
    WHERE tp.student_id = ? AND tp.completed = 1
    ORDER BY ct.level_number ASC
  `).all(studentId);

  const quizAttempts = db.prepare(`
    SELECT qa.*, q.prompt, q.correct_answer, ct.title as topic_title
    FROM question_attempts qa
    JOIN questions q ON qa.question_id = q.id
    JOIN course_topics ct ON q.topic_id = ct.id
    WHERE qa.student_id = ?
    ORDER BY qa.id DESC
    LIMIT 20
  `).all(studentId);

  const codeSubmissions = db.prepare(`
    SELECT cs.*, cp.title as problem_title, cp.difficulty
    FROM code_submissions cs
    JOIN coding_problems cp ON cs.problem_id = cp.id
    WHERE cs.student_id = ?
    ORDER BY cs.id DESC
    LIMIT 20
  `).all(studentId);

  const feedbackHistory = db.prepare(`
    SELECT * FROM mentor_feedback
    WHERE mentor_id = ? AND student_id = ?
    ORDER BY id DESC
  `).all(mentorId, studentId);

  const weakTopics = db.prepare(`
    SELECT ct.title, COUNT(*) as mistakes
    FROM question_attempts qa
    JOIN questions q ON qa.question_id = q.id
    JOIN course_topics ct ON q.topic_id = ct.id
    WHERE qa.student_id = ? AND qa.is_correct = 0
    GROUP BY ct.id
    ORDER BY mistakes DESC
    LIMIT 3
  `).all(studentId);

  return res.json({
    student,
    courseProgress,
    completedTopics,
    quizAttempts,
    codeSubmissions,
    feedbackHistory,
    weakTopics
  });
});

// 5. Send Mentor Request (Section 10)
router.post('/requests', (req, res) => {
  try {
    const mentorId = req.user.id;
    const { studentId, message } = req.body;

    if (!studentId) return res.status(400).json({ error: 'Student ID is required.' });

    const student = db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'STUDENT'").get(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    // Check existing relationship
    const activeRel = db.prepare(`
      SELECT id FROM mentor_student_relationships WHERE mentor_id = ? AND student_id = ? AND status = 'ACTIVE'
    `).get(mentorId, studentId);
    if (activeRel) return res.status(400).json({ error: 'You are already connected with this student.' });

    // Check pending request
    const existingPending = db.prepare(`
      SELECT id FROM mentor_requests WHERE mentor_id = ? AND student_id = ? AND status = 'PENDING'
    `).get(mentorId, studentId);
    if (existingPending) return res.status(400).json({ error: 'A pending mentor request was already sent to this student.' });

    const reqRes = db.prepare(`
      INSERT INTO mentor_requests (mentor_id, student_id, message, status)
      VALUES (?, ?, ?, 'PENDING')
    `).run(mentorId, studentId, message || `Hello ${student.name}! I would like to mentor you in your coding journey.`);

    // Create notification for student
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'MENTOR_REQUEST', 'New Mentor Request', ?, '/mentor/requests')
    `).run(studentId, `${req.user.name} sent you a mentor request.`);

    return res.status(201).json({
      message: 'Mentor request successfully sent to student.',
      requestId: reqRes.lastInsertRowid
    });
  } catch (err) {
    console.error('Error sending mentor request:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 6. List Sent Mentor Requests
router.get('/requests', (req, res) => {
  const mentorId = req.user.id;
  const requests = db.prepare(`
    SELECT mr.*, u.name as student_name, u.email as student_email
    FROM mentor_requests mr
    JOIN users u ON mr.student_id = u.id
    WHERE mr.mentor_id = ?
    ORDER BY mr.id DESC
  `).all(mentorId);

  return res.json(requests);
});

// 7. Send Mentor Feedback
router.post('/feedback', (req, res) => {
  const mentorId = req.user.id;
  const { studentId, courseName, topicName, taskName, feedbackText } = req.body;

  if (!studentId || !feedbackText) {
    return res.status(400).json({ error: 'Student ID and feedback text are required.' });
  }

  // Verify active relationship
  const rel = db.prepare(`
    SELECT id FROM mentor_student_relationships
    WHERE mentor_id = ? AND student_id = ? AND status = 'ACTIVE'
  `).get(mentorId, studentId);

  if (!rel) {
    return res.status(403).json({ error: 'You can only provide feedback to students who have accepted your mentorship.' });
  }

  const fbRes = db.prepare(`
    INSERT INTO mentor_feedback (mentor_id, student_id, course_name, topic_name, task_name, feedback_text)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(mentorId, studentId, courseName || 'Python Mastery', topicName || 'General', taskName || 'Recent Progress', feedbackText);

  // Notify student
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (?, 'MENTOR_FEEDBACK', 'New Mentor Feedback', ?, '/mentor/feedback')
  `).run(studentId, `${req.user.name} gave you feedback on ${topicName || 'your progress'}.`);

  return res.status(201).json({
    message: 'Feedback submitted successfully.',
    feedbackId: fbRes.lastInsertRowid
  });
});

// 8. Create Quiz (Section 34)
router.post('/quizzes', (req, res) => {
  const mentorId = req.user.id;
  const { title, description, courseName, levelNumber, topicName, timeLimitMinutes, questions } = req.body;

  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Quiz title and at least one question are required.' });
  }

  const quizRes = db.prepare(`
    INSERT INTO mentor_quizzes (mentor_id, title, description, course_name, level_number, topic_name, time_limit_minutes, questions_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    mentorId,
    title,
    description || '',
    courseName || 'Python Mastery',
    levelNumber || 1,
    topicName || 'General',
    timeLimitMinutes || 15,
    JSON.stringify(questions)
  );

  return res.status(201).json({
    message: 'Quiz created successfully.',
    quizId: quizRes.lastInsertRowid
  });
});

// 9. List Mentor Quizzes
router.get('/quizzes', (req, res) => {
  const quizzes = db.prepare(`
    SELECT * FROM mentor_quizzes
    WHERE mentor_id = ?
    ORDER BY id DESC
  `).all(req.user.id);

  return res.json(quizzes.map(q => ({
    ...q,
    questions: JSON.parse(q.questions_json)
  })));
});

// 10. Create Programming Challenge (Section 34)
router.post('/coding-challenges', (req, res) => {
  const mentorId = req.user.id;
  const { title, statement, difficulty, courseName, levelNumber, topicName, starterCode, publicTests, hiddenTests, timeLimitMs } = req.body;

  if (!title || !statement || !starterCode || !publicTests || !hiddenTests) {
    return res.status(400).json({ error: 'Title, problem statement, starter code, public tests, and hidden tests are required.' });
  }

  const probRes = db.prepare(`
    INSERT INTO mentor_programming_challenges (
      mentor_id, title, statement, difficulty, course_name,
      level_number, topic_name, starter_code, public_tests_json,
      hidden_tests_json, time_limit_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    mentorId,
    title,
    statement,
    difficulty || 'Easy',
    courseName || 'Python Mastery',
    levelNumber || 1,
    topicName || 'Algorithms',
    starterCode,
    JSON.stringify(publicTests),
    JSON.stringify(hiddenTests),
    timeLimitMs || 3000
  );

  return res.status(201).json({
    message: 'Coding challenge created successfully.',
    challengeId: probRes.lastInsertRowid
  });
});

// 11. List Mentor Coding Challenges
router.get('/coding-challenges', (req, res) => {
  const challenges = db.prepare(`
    SELECT * FROM mentor_programming_challenges
    WHERE mentor_id = ?
    ORDER BY id DESC
  `).all(req.user.id);

  return res.json(challenges.map(c => ({
    ...c,
    publicTests: JSON.parse(c.public_tests_json)
  })));
});

// 12. Send Assignment (Section 35)
router.post('/assignments', (req, res) => {
  const mentorId = req.user.id;
  const { type, quizId, codingId, title, courseName, dueDate, studentIds } = req.body;

  if (!type || !title || !dueDate || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: 'Assignment type, title, due date, and at least one student recipient are required.' });
  }

  const shareToken = crypto.randomBytes(16).toString('hex');

  const assignRes = db.prepare(`
    INSERT INTO assignments (mentor_id, type, quiz_id, coding_id, title, course_name, due_date, share_token)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    mentorId,
    type,
    type === 'QUIZ' ? quizId : null,
    type === 'CODING' ? codingId : null,
    title,
    courseName || 'Python Mastery',
    dueDate,
    shareToken
  );

  const assignmentId = assignRes.lastInsertRowid;

  const insertRecipient = db.prepare(`
    INSERT INTO assignment_recipients (assignment_id, student_id, status)
    VALUES (?, ?, 'SENT')
  `);

  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (?, 'NEW_ASSIGNMENT', 'New Assignment Received', ?, ?)
  `);

  for (const sId of studentIds) {
    insertRecipient.run(assignmentId, sId);
    insertNotification.run(
      sId,
      `Your mentor ${req.user.name} assigned you "${title}". Due date: ${dueDate}.`,
      `/assignments/${shareToken}`
    );
  }

  return res.status(201).json({
    message: 'Assignment dispatched to selected students.',
    assignmentId,
    shareToken,
    shareableLink: `/assignments/${shareToken}`
  });
});

// 13. List Mentor Assignments
router.get('/assignments', (req, res) => {
  const assignments = db.prepare(`
    SELECT a.*,
      (SELECT COUNT(*) FROM assignment_recipients WHERE assignment_id = a.id) as total_students,
      (SELECT COUNT(*) FROM assignment_recipients WHERE assignment_id = a.id AND status = 'SUBMITTED') as completed_students
    FROM assignments a
    WHERE a.mentor_id = ?
    ORDER BY a.id DESC
  `).all(req.user.id);

  return res.json(assignments);
});

// 14. View Assignment Detailed Results (Section 36)
router.get('/assignments/:id/results', (req, res) => {
  const mentorId = req.user.id;
  const assignmentId = req.params.id;

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ? AND mentor_id = ?').get(assignmentId, mentorId);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

  const submissions = db.prepare(`
    SELECT ar.*, u.name as student_name, u.email as student_email
    FROM assignment_recipients ar
    JOIN users u ON ar.student_id = u.id
    WHERE ar.assignment_id = ?
    ORDER BY ar.submitted_at DESC
  `).all(assignmentId);

  return res.json({
    assignment,
    submissions: submissions.map(s => ({
      ...s,
      submissionData: s.submission_data_json ? JSON.parse(s.submission_data_json) : null
    }))
  });
});

// 15. Mentor Profile
router.get('/profile', (req, res) => {
  const profile = db.prepare('SELECT * FROM mentor_profiles WHERE user_id = ?').get(req.user.id);
  const studentsCount = db.prepare("SELECT COUNT(*) as count FROM mentor_student_relationships WHERE mentor_id = ? AND status = 'ACTIVE'").get(req.user.id).count;

  return res.json({
    user: req.user,
    profile,
    studentsCount
  });
});

router.put('/profile', (req, res) => {
  const { expertise, experience, availability, bio } = req.body;

  db.prepare(`
    UPDATE mentor_profiles
    SET expertise = COALESCE(?, expertise),
        experience = COALESCE(?, experience),
        availability = COALESCE(?, availability),
        bio = COALESCE(?, bio)
    WHERE user_id = ?
  `).run(expertise, experience, availability, bio, req.user.id);

  const updated = db.prepare('SELECT * FROM mentor_profiles WHERE user_id = ?').get(req.user.id);
  return res.json({ message: 'Profile updated', profile: updated });
});

export default router;
