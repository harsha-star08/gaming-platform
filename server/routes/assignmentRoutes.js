import express from 'express';
import { db } from '../db/schema.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { evaluateTestCases } from '../services/codeExecution.js';
import { awardXp, awardSkillCoins, recordActivityAndStreak, checkAndAwardBadges } from '../services/gamification.js';

const router = express.Router();

router.use(authenticateToken);

// 1. List Assignments for Student
router.get('/', (req, res) => {
  const studentId = req.user.id;

  const assignments = db.prepare(`
    SELECT a.*, ar.status as submission_status, ar.score, ar.accuracy,
      ar.started_at, ar.submitted_at, u.name as mentor_name
    FROM assignment_recipients ar
    JOIN assignments a ON ar.assignment_id = a.id
    JOIN users u ON a.mentor_id = u.id
    WHERE ar.student_id = ?
    ORDER BY a.id DESC
  `).all(studentId);

  return res.json(assignments);
});

// 2. Get Single Assignment by ID or Share Token
router.get('/:tokenOrId', (req, res) => {
  const param = req.params.tokenOrId;
  const isNumeric = /^\d+$/.test(param);

  let assignment = null;
  if (isNumeric) {
    assignment = db.prepare(`
      SELECT a.*, u.name as mentor_name
      FROM assignments a
      JOIN users u ON a.mentor_id = u.id
      WHERE a.id = ?
    `).get(parseInt(param, 10));
  } else {
    assignment = db.prepare(`
      SELECT a.*, u.name as mentor_name
      FROM assignments a
      JOIN users u ON a.mentor_id = u.id
      WHERE a.share_token = ?
    `).get(param);
  }

  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

  // Check authorization if user is student: must be an assigned recipient
  if (req.user.role === 'STUDENT') {
    const recipient = db.prepare(`
      SELECT * FROM assignment_recipients WHERE assignment_id = ? AND student_id = ?
    `).get(assignment.id, req.user.id);

    if (!recipient) {
      return res.status(403).json({ error: 'You are not an authorized recipient of this assignment.' });
    }

    let testContent = null;
    if (assignment.type === 'QUIZ' && assignment.quiz_id) {
      const quiz = db.prepare('SELECT id, title, description, time_limit_minutes, questions_json FROM mentor_quizzes WHERE id = ?').get(assignment.quiz_id);
      if (quiz) {
        const rawQuestions = JSON.parse(quiz.questions_json);
        // Do not expose correct_answer in initial payload
        const safeQuestions = rawQuestions.map((q, idx) => ({
          id: idx + 1,
          prompt: q.prompt,
          options: q.options
        }));
        testContent = { ...quiz, questions: safeQuestions };
      }
    } else if (assignment.type === 'CODING' && assignment.coding_id) {
      const problem = db.prepare('SELECT id, title, statement, difficulty, starter_code, public_tests_json, time_limit_ms FROM mentor_programming_challenges WHERE id = ?').get(assignment.coding_id);
      if (problem) {
        testContent = {
          ...problem,
          publicTests: JSON.parse(problem.public_tests_json)
        };
      }
    }

    return res.json({
      assignment,
      recipient,
      testContent
    });
  }

  return res.json({ assignment });
});

// 3. Start Assignment
router.post('/:id/start', (req, res) => {
  const studentId = req.user.id;
  const assignmentId = req.params.id;

  const recipient = db.prepare(`
    SELECT * FROM assignment_recipients WHERE assignment_id = ? AND student_id = ?
  `).get(assignmentId, studentId);

  if (!recipient) return res.status(404).json({ error: 'Assignment recipient record not found.' });

  if (recipient.status === 'SENT') {
    db.prepare(`
      UPDATE assignment_recipients
      SET status = 'IN_PROGRESS', started_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(recipient.id);
  }

  return res.json({ message: 'Assignment started.' });
});

// 4. Submit Assignment
router.post('/:id/submit', (req, res) => {
  const studentId = req.user.id;
  const assignmentId = req.params.id;
  const { answers, code } = req.body;

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignmentId);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

  const recipient = db.prepare(`
    SELECT * FROM assignment_recipients WHERE assignment_id = ? AND student_id = ?
  `).get(assignmentId, studentId);

  if (!recipient) return res.status(403).json({ error: 'You are not assigned to this assignment.' });
  if (recipient.status === 'SUBMITTED') {
    return res.status(400).json({ error: 'Assignment has already been submitted.' });
  }

  let finalScore = 0;
  let accuracy = 0;
  let submissionDetails = {};

  if (assignment.type === 'QUIZ') {
    const quiz = db.prepare('SELECT questions_json FROM mentor_quizzes WHERE id = ?').get(assignment.quiz_id);
    const questions = JSON.parse(quiz.questions_json);
    let correctCount = 0;

    const gradedAnswers = questions.map((q, idx) => {
      const studentAns = answers ? answers[idx] : null;
      const isCorrect = String(studentAns).trim() === String(q.correct_answer).trim();
      if (isCorrect) correctCount++;
      return {
        prompt: q.prompt,
        selected: studentAns,
        correct: q.correct_answer,
        isCorrect
      };
    });

    accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    finalScore = accuracy;
    submissionDetails = { type: 'QUIZ', correctCount, totalQuestions: questions.length, gradedAnswers };
  } else if (assignment.type === 'CODING') {
    const challenge = db.prepare('SELECT * FROM mentor_programming_challenges WHERE id = ?').get(assignment.coding_id);
    const publicTests = JSON.parse(challenge.public_tests_json);
    const hiddenTests = JSON.parse(challenge.hidden_tests_json);
    const allTests = [
      ...publicTests.map(t => ({ ...t, is_hidden: 0 })),
      ...hiddenTests.map(t => ({ ...t, is_hidden: 1 }))
    ];

    const evalRes = evaluateTestCases(code || '', allTests, challenge.time_limit_ms || 3000);
    accuracy = evalRes.score;
    finalScore = evalRes.score;
    submissionDetails = {
      type: 'CODING',
      passedCount: evalRes.passedCount,
      totalCount: evalRes.totalCount,
      results: evalRes.results,
      status: evalRes.status
    };
  }

  // Update recipient
  db.prepare(`
    UPDATE assignment_recipients
    SET status = 'SUBMITTED', score = ?, accuracy = ?,
        submission_data_json = ?, submitted_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(finalScore, accuracy, JSON.stringify(submissionDetails), recipient.id);

  // Award rewards if passing
  let xpAwarded = 0;
  if (finalScore >= 50) {
    xpAwarded = Math.round(finalScore * 0.8);
    awardXp(studentId, xpAwarded, `Completed assignment: ${assignment.title}`, 'ASSIGNMENT');
    awardSkillCoins(studentId, 25, `Completed assignment: ${assignment.title}`);
    recordActivityAndStreak(studentId, `Completed assignment: ${assignment.title}`, xpAwarded);
  }

  // Check badges (e.g. perfect_score if 100)
  checkAndAwardBadges(studentId);

  // Notify Mentor
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (?, 'ASSIGNMENT_SUBMISSION', 'Assignment Submitted', ?, ?)
  `).run(
    assignment.mentor_id,
    `${req.user.name} submitted "${assignment.title}" with a score of ${finalScore}%.`,
    `/mentor/assignments/${assignment.id}/results`
  );

  return res.json({
    message: 'Assignment submitted successfully!',
    score: finalScore,
    accuracy,
    xpAwarded,
    submissionDetails
  });
});

export default router;
