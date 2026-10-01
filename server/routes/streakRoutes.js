import express from 'express';
import { db } from '../db/schema.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { executePythonCode, normalizeOutput } from '../services/codeExecution.js';
import { generateStreakRestoreTask } from '../services/aiService.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('STUDENT'));

// 1. Get Streak Details
router.get('/', (req, res) => {
  const studentId = req.user.id;

  const streak = db.prepare('SELECT * FROM streaks WHERE student_id = ?').get(studentId) || {
    current_streak: 0,
    longest_streak: 0,
    last_active_date: null,
    streak_status: 'ACTIVE'
  };

  const profile = db.prepare('SELECT streak_broken FROM student_profiles WHERE user_id = ?').get(studentId);
  const isBroken = !!(profile && profile.streak_broken);

  const history = db.prepare(`
    SELECT * FROM streak_history
    WHERE student_id = ?
    ORDER BY id DESC
    LIMIT 14
  `).all(studentId);

  // Check if student owns a Restore Card
  const restoreCard = db.prepare(`
    SELECT spu.quantity
    FROM student_power_ups spu
    JOIN power_ups pu ON spu.power_up_id = pu.id
    WHERE spu.student_id = ? AND pu.item_key = 'restore_card'
  `).get(studentId);

  const restoreCardCount = restoreCard ? restoreCard.quantity : 0;

  return res.json({
    currentStreak: streak.current_streak,
    longestStreak: streak.longest_streak,
    lastActiveDate: streak.last_active_date,
    isBroken,
    restoreCardCount,
    history
  });
});

// 2. Simulate Missed Day (For testing & hackathon demonstration: Section 20 & 53)
router.post('/simulate-miss', (req, res) => {
  const studentId = req.user.id;

  // Set streak broken and last_active_date to 3 days ago
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];

  db.prepare(`
    UPDATE streaks
    SET last_active_date = ?, streak_status = 'BROKEN'
    WHERE student_id = ?
  `).run(threeDaysAgo, studentId);

  db.prepare(`
    UPDATE student_profiles
    SET streak_broken = 1, last_activity_date = ?
    WHERE user_id = ?
  `).run(threeDaysAgo, studentId);

  // Create notification
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (?, 'STREAK_BROKEN', 'Daily Streak Broken!', 'You missed your learning window. Complete the AI Streak Restore Challenge or use a Restore Card to save it!', '/challenges/streak')
  `).run(studentId);

  return res.json({
    message: 'Simulated missed day: Streak marked as broken.',
    streakBroken: true
  });
});

// 3. Get / Generate AI Streak Restore Task (Section 20)
router.get('/restore-task', (req, res) => {
  const studentId = req.user.id;
  const task = generateStreakRestoreTask(studentId);
  return res.json(task);
});

// 4. Submit AI Streak Restore Task
router.post('/restore-task/submit', (req, res) => {
  const studentId = req.user.id;
  const { taskId, code } = req.body;

  if (!code) return res.status(400).json({ error: 'Code is required.' });

  const task = db.prepare('SELECT * FROM streak_restore_tasks WHERE id = ? AND student_id = ?').get(taskId, studentId);
  if (!task) return res.status(404).json({ error: 'Restore task not found.' });

  if (task.status === 'COMPLETED') {
    return res.json({ message: 'Task already completed.', restored: true });
  }

  // Execute against task test
  const execRes = executePythonCode(code, task.test_code || '10 20 30', 3000);
  const actual = normalizeOutput(execRes.stdout);
  const expected = normalizeOutput(task.expected_output || '60');

  const passed = execRes.status === 'SUCCESS' && actual === expected;

  if (!passed) {
    return res.json({
      passed: false,
      error: execRes.stderr || 'Output did not match expected result.',
      actual,
      expected
    });
  }

  // Pass! Restore streak
  db.prepare("UPDATE streak_restore_tasks SET status = 'COMPLETED' WHERE id = ?").run(taskId);

  const streak = db.prepare('SELECT current_streak, longest_streak FROM streaks WHERE student_id = ?').get(studentId);
  const restoredStreak = (streak ? streak.current_streak : 0) + 1;
  const newLongest = Math.max(restoredStreak, streak ? streak.longest_streak : 0);
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    UPDATE streaks
    SET current_streak = ?, longest_streak = ?, last_active_date = ?, streak_status = 'ACTIVE'
    WHERE student_id = ?
  `).run(restoredStreak, newLongest, today, studentId);

  db.prepare(`
    UPDATE student_profiles
    SET current_streak = ?, longest_streak = ?, streak_broken = 0, last_activity_date = ?
    WHERE user_id = ?
  `).run(restoredStreak, newLongest, today, studentId);

  db.prepare(`
    INSERT INTO streak_history (student_id, activity_date, activity_description)
    VALUES (?, ?, 'AI Streak Restore Task Passed')
  `).run(studentId, today);

  db.prepare(`
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (?, 'STREAK_RESTORED', 'Streak Restored!', 'Congratulations! You solved your AI challenge and your streak has been restored.')
  `).run(studentId);

  return res.json({
    passed: true,
    message: 'Streak successfully restored!',
    newStreak: restoredStreak
  });
});

// 5. Use Restore Card from Inventory (Section 20 & 27)
router.post('/use-restore-card', (req, res) => {
  const studentId = req.user.id;

  const card = db.prepare(`
    SELECT spu.id, spu.quantity, spu.power_up_id
    FROM student_power_ups spu
    JOIN power_ups pu ON spu.power_up_id = pu.id
    WHERE spu.student_id = ? AND pu.item_key = 'restore_card' AND spu.quantity > 0
  `).get(studentId);

  if (!card) {
    return res.status(400).json({ error: 'You do not own a Restore Card. Visit the Reward Shop to acquire one!' });
  }

  // Deduct 1 card
  db.prepare('UPDATE student_power_ups SET quantity = quantity - 1 WHERE id = ?').run(card.id);

  // Restore streak
  const streak = db.prepare('SELECT current_streak, longest_streak FROM streaks WHERE student_id = ?').get(studentId);
  const restoredStreak = (streak ? streak.current_streak : 0) + 1;
  const newLongest = Math.max(restoredStreak, streak ? streak.longest_streak : 0);
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    UPDATE streaks
    SET current_streak = ?, longest_streak = ?, last_active_date = ?, streak_status = 'ACTIVE'
    WHERE student_id = ?
  `).run(restoredStreak, newLongest, today, studentId);

  db.prepare(`
    UPDATE student_profiles
    SET current_streak = ?, longest_streak = ?, streak_broken = 0, last_activity_date = ?
    WHERE user_id = ?
  `).run(restoredStreak, newLongest, today, studentId);

  db.prepare(`
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (?, 'STREAK_RESTORED', 'Streak Saved by Card!', 'You used a Restore Card to save your daily streak.')
  `).run(studentId);

  return res.json({
    message: 'Restore Card successfully activated! Streak restored.',
    newStreak: restoredStreak
  });
});

export default router;
