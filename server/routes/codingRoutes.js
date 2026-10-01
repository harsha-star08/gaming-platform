import express from 'express';
import { db } from '../db/schema.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { evaluateTestCases, executePythonCode, normalizeOutput } from '../services/codeExecution.js';
import { awardXp, awardSkillCoins, recordActivityAndStreak, checkAndAwardBadges } from '../services/gamification.js';

const router = express.Router();

router.use(authenticateToken);

// 1. Get Problem Details (Hides hidden test cases!)
router.get('/problems/:slug', (req, res) => {
  const problem = db.prepare(`
    SELECT cp.*, ct.title as topic_title, c.title as course_title
    FROM coding_problems cp
    LEFT JOIN course_topics ct ON cp.topic_id = ct.id
    LEFT JOIN courses c ON ct.course_id = c.id
    WHERE cp.slug = ?
  `).get(req.params.slug);

  if (!problem) return res.status(404).json({ error: 'Coding problem not found.' });

  // Public test cases only!
  const publicTestCases = db.prepare(`
    SELECT id, input, expected_output
    FROM code_test_cases
    WHERE problem_id = ? AND is_hidden = 0
  `).all(problem.id);

  // Student's previous submissions for this problem
  const submissions = db.prepare(`
    SELECT id, status, score, passed_count, total_count, execution_time_ms, created_at
    FROM code_submissions
    WHERE student_id = ? AND problem_id = ?
    ORDER BY id DESC
    LIMIT 5
  `).all(req.user.id, problem.id);

  return res.json({
    problem: {
      ...problem,
      publicTestCases
    },
    submissions
  });
});

// 2. Run Code against Public Test Cases or Custom Input
router.post('/problems/:slug/run', (req, res) => {
  const { code, customInput } = req.body;
  if (!code) return res.status(400).json({ error: 'Code cannot be empty.' });

  const problem = db.prepare('SELECT id, time_limit_ms FROM coding_problems WHERE slug = ?').get(req.params.slug);
  if (!problem) return res.status(404).json({ error: 'Coding problem not found.' });

  const timeoutMs = problem.time_limit_ms || 3000;

  // Custom stdin execution
  if (customInput !== undefined && customInput !== null && customInput.trim() !== '') {
    const execRes = executePythonCode(code, customInput, timeoutMs);
    return res.json({
      type: 'custom',
      status: execRes.status,
      stdout: execRes.stdout,
      stderr: execRes.stderr,
      executionTimeMs: execRes.executionTimeMs
    });
  }

  // Evaluate against public test cases
  const publicTests = db.prepare(`
    SELECT id, input, expected_output, is_hidden
    FROM code_test_cases
    WHERE problem_id = ? AND is_hidden = 0
  `).all(problem.id);

  const evalResult = evaluateTestCases(code, publicTests, timeoutMs);
  return res.json({
    type: 'public_tests',
    ...evalResult
  });
});

// 3. Submit Code against ALL Test Cases (Public + Hidden)
router.post('/problems/:slug/submit', (req, res) => {
  const studentId = req.user.id;
  const { code, language = 'python' } = req.body;

  if (!code) return res.status(400).json({ error: 'Code cannot be empty.' });

  const problem = db.prepare('SELECT * FROM coding_problems WHERE slug = ?').get(req.params.slug);
  if (!problem) return res.status(404).json({ error: 'Coding problem not found.' });

  const allTestCases = db.prepare(`
    SELECT id, input, expected_output, is_hidden
    FROM code_test_cases
    WHERE problem_id = ?
    ORDER BY is_hidden ASC, id ASC
  `).all(problem.id);

  const evalResult = evaluateTestCases(code, allTestCases, problem.time_limit_ms || 3000);

  // Store submission in DB
  const subRes = db.prepare(`
    INSERT INTO code_submissions (
      student_id, problem_id, code, language, status,
      passed_count, total_count, score, execution_time_ms, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    studentId,
    problem.id,
    code,
    language,
    evalResult.status,
    evalResult.passedCount,
    evalResult.totalCount,
    evalResult.score,
    evalResult.executionTimeMs,
    evalResult.status !== 'ACCEPTED' ? (evalResult.results.find(r => r.error)?.error || 'Failed test cases') : null
  );

  let xpAwarded = 0;
  let coinsAwarded = 0;

  if (evalResult.status === 'ACCEPTED') {
    // Check if previously accepted to prevent duplicate XP farming
    const prevAccepted = db.prepare(`
      SELECT id FROM code_submissions
      WHERE student_id = ? AND problem_id = ? AND status = 'ACCEPTED' AND id != ?
    `).get(studentId, problem.id, subRes.lastInsertRowid);

    if (!prevAccepted) {
      xpAwarded = problem.xp_reward || 20;
      coinsAwarded = problem.coins_reward || 10;
      awardXp(studentId, xpAwarded, `Solved coding problem: ${problem.title}`, 'CODING_PROBLEM');
      awardSkillCoins(studentId, coinsAwarded, `Solved coding problem: ${problem.title}`);
    }

    recordActivityAndStreak(studentId, `Solved algorithm: ${problem.title}`, xpAwarded);
    checkAndAwardBadges(studentId);
  }

  return res.json({
    submissionId: subRes.lastInsertRowid,
    status: evalResult.status,
    score: evalResult.score,
    passedCount: evalResult.passedCount,
    totalCount: evalResult.totalCount,
    executionTimeMs: evalResult.executionTimeMs,
    results: evalResult.results,
    xpAwarded,
    coinsAwarded
  });
});

// 4. Student Submissions History
router.get('/submissions', (req, res) => {
  const submissions = db.prepare(`
    SELECT cs.*, cp.title as problem_title, cp.slug as problem_slug, cp.difficulty
    FROM code_submissions cs
    JOIN coding_problems cp ON cs.problem_id = cp.id
    WHERE cs.student_id = ?
    ORDER BY cs.id DESC
    LIMIT 20
  `).all(req.user.id);

  return res.json(submissions);
});

export default router;
