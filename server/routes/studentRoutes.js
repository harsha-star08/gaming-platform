import express from 'express';
import { db } from '../db/schema.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { awardXp, awardSkillCoins, recordActivityAndStreak, getXpForNextLevel, checkAndAwardBadges } from '../services/gamification.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('STUDENT'));

// 1. Student Dashboard Data
router.get('/dashboard', (req, res) => {
  const studentId = req.user.id;

  // Real profile data
  const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(studentId) || {
    xp: 0, level: 1, skill_coins: 0, current_streak: 0, longest_streak: 0, streak_broken: 0
  };

  // Next level threshold
  const xpNext = getXpForNextLevel(profile.level);

  // Earned badges count
  const badgesCount = db.prepare('SELECT COUNT(*) as count FROM student_badges WHERE student_id = ?').get(studentId).count;

  // Completed courses count
  const completedCoursesCount = db.prepare('SELECT COUNT(*) as count FROM course_progress WHERE student_id = ? AND progress_percent >= 100').get(studentId).count;

  // Next available topic to continue learning
  const nextTopic = db.prepare(`
    SELECT t.id, t.title, t.level_number, t.slug, c.title as course_title, c.slug as course_slug
    FROM course_topics t
    JOIN courses c ON t.course_id = c.id
    LEFT JOIN topic_progress tp ON t.id = tp.topic_id AND tp.student_id = ?
    WHERE (tp.completed IS NULL OR tp.completed = 0)
    ORDER BY c.id ASC, t.level_number ASC
    LIMIT 1
  `).get(studentId);

  // Enrolled courses with calculated progress
  const courses = db.prepare(`
    SELECT c.*,
      COALESCE(cp.progress_percent, 0) as progress_percent,
      COALESCE(cp.completed_levels, 0) as completed_levels
    FROM courses c
    LEFT JOIN course_progress cp ON c.id = cp.course_id AND cp.student_id = ?
    ORDER BY c.id ASC
  `).all(studentId);

  // Today's daily challenge
  const todayStr = new Date().toISOString().split('T')[0];
  const dailyChallenge = db.prepare(`
    SELECT dc.*, cp.title as problem_title, cp.slug as problem_slug, cp.difficulty,
      (SELECT COUNT(*) FROM code_submissions WHERE student_id = ? AND problem_id = cp.id AND status = 'ACCEPTED') as is_solved
    FROM daily_challenges dc
    JOIN coding_problems cp ON dc.problem_id = cp.id
    WHERE dc.challenge_date = ?
    LIMIT 1
  `).get(studentId, todayStr) || db.prepare(`
    SELECT dc.*, cp.title as problem_title, cp.slug as problem_slug, cp.difficulty,
      (SELECT COUNT(*) FROM code_submissions WHERE student_id = ? AND problem_id = cp.id AND status = 'ACCEPTED') as is_solved
    FROM daily_challenges dc
    JOIN coding_problems cp ON dc.problem_id = cp.id
    ORDER BY dc.id DESC
    LIMIT 1
  `).get(studentId);

  // Weekly challenge
  const weeklyChallenge = db.prepare(`
    SELECT wc.*, cp.title as problem_title, cp.slug as problem_slug, cp.difficulty
    FROM weekly_challenges wc
    JOIN coding_problems cp ON wc.target_problem_id = cp.id
    ORDER BY wc.id DESC
    LIMIT 1
  `).get();

  // Mentor connection status
  const connectedMentor = db.prepare(`
    SELECT u.id, u.name, u.email, mp.expertise, mp.experience
    FROM mentor_student_relationships msr
    JOIN users u ON msr.mentor_id = u.id
    JOIN mentor_profiles mp ON u.id = mp.user_id
    WHERE msr.student_id = ? AND msr.status = 'ACTIVE'
  `).get(studentId);

  const pendingRequest = !connectedMentor ? db.prepare(`
    SELECT mr.id, u.name as mentor_name, mr.message, mr.created_at
    FROM mentor_requests mr
    JOIN users u ON mr.mentor_id = u.id
    WHERE mr.student_id = ? AND mr.status = 'PENDING'
    LIMIT 1
  `).get(studentId) : null;

  let mentorStatus = 'NOT_CONNECTED';
  if (connectedMentor) mentorStatus = 'CONNECTED';
  else if (pendingRequest) mentorStatus = 'PENDING_REQUEST';

  // AI Learning recommendation
  const weakTopic = db.prepare(`
    SELECT t.title, COUNT(*) as fails
    FROM question_attempts qa
    JOIN questions q ON qa.question_id = q.id
    JOIN course_topics t ON q.topic_id = t.id
    WHERE qa.student_id = ? AND qa.is_correct = 0
    GROUP BY t.id
    ORDER BY fails DESC
    LIMIT 1
  `).get(studentId);

  const aiRecommendation = weakTopic
    ? `Review ${weakTopic.title}: our analytics identified areas for improvement. Practice 2 debugging challenges.`
    : (nextTopic ? `Ready for your next milestone: Level ${nextTopic.level_number} (${nextTopic.title}) in ${nextTopic.course_title}!` : 'Great job! You have explored available topics.');

  // Recent activity
  const recentActivities = db.prepare(`
    SELECT * FROM activity_log
    WHERE student_id = ?
    ORDER BY id DESC
    LIMIT 6
  `).all(studentId);

  return res.json({
    user: req.user,
    stats: {
      xp: profile.xp,
      level: profile.level,
      xpNextLevel: xpNext,
      skillCoins: profile.skill_coins,
      currentStreak: profile.current_streak,
      longestStreak: profile.longest_streak,
      streakBroken: !!profile.streak_broken,
      badgesCount,
      completedCoursesCount
    },
    continueLearning: nextTopic || null,
    courses,
    dailyChallenge,
    weeklyChallenge,
    mentor: {
      status: mentorStatus,
      connectedMentor,
      pendingRequest
    },
    aiRecommendation,
    recentActivities
  });
});

// 2. Course Library
router.get('/courses', (req, res) => {
  const studentId = req.user.id;
  const courses = db.prepare(`
    SELECT c.*,
      COALESCE(cp.progress_percent, 0) as progress_percent,
      COALESCE(cp.completed_levels, 0) as completed_levels
    FROM courses c
    LEFT JOIN course_progress cp ON c.id = cp.course_id AND cp.student_id = ?
    ORDER BY c.id ASC
  `).all(studentId);

  return res.json(courses);
});

// 3. Topics for a Course with real progression lock logic (Section 13)
router.get('/courses/:slug/topics', (req, res) => {
  const studentId = req.user.id;
  const course = db.prepare('SELECT * FROM courses WHERE slug = ?').get(req.params.slug);
  if (!course) return res.status(404).json({ error: 'Course not found.' });

  const topics = db.prepare(`
    SELECT t.*,
      COALESCE(tp.completed, 0) as is_completed,
      tp.completed_at
    FROM course_topics t
    LEFT JOIN topic_progress tp ON t.id = tp.topic_id AND tp.student_id = ?
    WHERE t.course_id = ?
    ORDER BY t.level_number ASC
  `).all(studentId, course.id);

  // Progression logic:
  // Level 1 is always unlocked.
  // Level N is unlocked if Level N-1 is completed.
  let previousCompleted = true;
  const topicsWithLock = topics.map((top) => {
    const isUnlocked = top.level_number === 1 || previousCompleted;
    if (!top.is_completed) {
      previousCompleted = false;
    }
    return {
      ...top,
      isUnlocked: !!isUnlocked
    };
  });

  return res.json({
    course,
    topics: topicsWithLock
  });
});

// 4. Detailed Topic Content
router.get('/topics/:id', (req, res) => {
  const studentId = req.user.id;
  const topicId = req.params.id;

  const topic = db.prepare(`
    SELECT t.*, c.title as course_title, c.slug as course_slug
    FROM course_topics t
    JOIN courses c ON t.course_id = c.id
    WHERE t.id = ?
  `).get(topicId);

  if (!topic) return res.status(404).json({ error: 'Topic not found.' });

  // Verify progression lock: cannot access locked future topics directly (Section 13)
  if (topic.level_number > 1) {
    const prevTopic = db.prepare(`
      SELECT tp.completed
      FROM course_topics t
      LEFT JOIN topic_progress tp ON t.id = tp.topic_id AND tp.student_id = ?
      WHERE t.course_id = ? AND t.level_number = ?
    `).get(studentId, topic.course_id, topic.level_number - 1);

    if (!prevTopic || !prevTopic.completed) {
      return res.status(403).json({
        error: `Level ${topic.level_number} is locked. Please complete Level ${topic.level_number - 1} first.`
      });
    }
  }

  const questions = db.prepare('SELECT id, type, prompt, code_snippet, options_json, xp_reward, coins_reward FROM questions WHERE topic_id = ?').all(topicId).map(q => ({
    ...q,
    options: JSON.parse(q.options_json)
  }));

  const problem = db.prepare('SELECT id, title, slug, difficulty, statement, input_format, output_format, constraints, starter_code, xp_reward, coins_reward FROM coding_problems WHERE topic_id = ?').get(topicId);

  const progress = db.prepare('SELECT * FROM topic_progress WHERE student_id = ? AND topic_id = ?').get(studentId, topicId);

  return res.json({
    topic,
    isCompleted: !!(progress && progress.completed),
    questions,
    problem
  });
});

// 5. Complete Topic
router.post('/topics/:id/complete', (req, res) => {
  const studentId = req.user.id;
  const topicId = req.params.id;

  const topic = db.prepare('SELECT * FROM course_topics WHERE id = ?').get(topicId);
  if (!topic) return res.status(404).json({ error: 'Topic not found.' });

  const existing = db.prepare('SELECT completed FROM topic_progress WHERE student_id = ? AND topic_id = ?').get(studentId, topicId);

  if (existing && existing.completed) {
    return res.json({ message: 'Topic already completed.', alreadyCompleted: true });
  }

  // Mark completed
  db.prepare(`
    INSERT INTO topic_progress (student_id, topic_id, completed, completed_at)
    VALUES (?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(student_id, topic_id) DO UPDATE SET completed = 1, completed_at = CURRENT_TIMESTAMP
  `).run(studentId, topicId);

  // Recalculate course progress
  const totalInCourse = db.prepare('SELECT COUNT(*) as count FROM course_topics WHERE course_id = ?').get(topic.course_id).count;
  const completedInCourse = db.prepare(`
    SELECT COUNT(*) as count FROM topic_progress tp
    JOIN course_topics ct ON tp.topic_id = ct.id
    WHERE tp.student_id = ? AND ct.course_id = ? AND tp.completed = 1
  `).get(studentId, topic.course_id).count;

  const progressPercent = Math.round((completedInCourse / totalInCourse) * 100);

  db.prepare(`
    INSERT INTO course_progress (student_id, course_id, enrolled, current_level, completed_levels, progress_percent)
    VALUES (?, ?, 1, ?, ?, ?)
    ON CONFLICT(student_id, course_id) DO UPDATE SET
      current_level = ?, completed_levels = ?, progress_percent = ?
  `).run(
    studentId, topic.course_id, topic.level_number + 1, completedInCourse, progressPercent,
    topic.level_number + 1, completedInCourse, progressPercent
  );

  // Award XP and Coins (Anti-duplication: awarded only on first completion!)
  const xpRes = awardXp(studentId, topic.xp_reward || 50, `Completed Level ${topic.level_number}: ${topic.title}`, 'TOPIC_COMPLETION');
  const coinRes = awardSkillCoins(studentId, topic.coins_reward || 15, `Completed Level ${topic.level_number}: ${topic.title}`);
  recordActivityAndStreak(studentId, `Completed Level ${topic.level_number}: ${topic.title}`, topic.xp_reward);

  return res.json({
    message: 'Topic completed successfully!',
    xpAwarded: topic.xp_reward,
    coinsAwarded: topic.coins_reward,
    levelUp: xpRes.levelUp,
    newLevel: xpRes.newLevel,
    progressPercent
  });
});

// 6. Practice Question Attempt
router.post('/questions/:id/attempt', (req, res) => {
  const studentId = req.user.id;
  const questionId = req.params.id;
  const { selectedAnswer } = req.body;

  if (selectedAnswer === undefined) {
    return res.status(400).json({ error: 'selectedAnswer is required.' });
  }

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);
  if (!question) return res.status(404).json({ error: 'Question not found.' });

  const isCorrect = String(selectedAnswer).trim() === String(question.correct_answer).trim();

  // Check if previously answered correctly
  const prevCorrect = db.prepare(`
    SELECT id FROM question_attempts
    WHERE student_id = ? AND question_id = ? AND is_correct = 1
  `).get(studentId, questionId);

  let xpAwarded = 0;
  if (isCorrect && !prevCorrect) {
    xpAwarded = question.xp_reward || 10;
    awardXp(studentId, xpAwarded, `Solved question: ${question.prompt.substring(0, 30)}...`, 'PRACTICE_QUESTION');
    awardSkillCoins(studentId, question.coins_reward || 5, 'Correct practice answer');
    recordActivityAndStreak(studentId, `Solved practice question: ${question.prompt.substring(0, 30)}...`, xpAwarded);
  }

  db.prepare(`
    INSERT INTO question_attempts (student_id, question_id, selected_answer, is_correct, xp_awarded)
    VALUES (?, ?, ?, ?, ?)
  `).run(studentId, questionId, String(selectedAnswer), isCorrect ? 1 : 0, xpAwarded);

  return res.json({
    isCorrect,
    correctAnswer: question.correct_answer,
    explanation: question.explanation,
    xpAwarded,
    alreadySolved: !!prevCorrect
  });
});

// 7. Student Profile & Badges
router.get('/profile', (req, res) => {
  const studentId = req.user.id;
  const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(studentId);

  const badges = db.prepare(`
    SELECT b.*, sb.earned_at
    FROM badges b
    JOIN student_badges sb ON b.id = sb.badge_id
    WHERE sb.student_id = ?
    ORDER BY sb.earned_at DESC
  `).all(studentId);

  const allBadges = db.prepare('SELECT * FROM badges ORDER BY id ASC').all().map(b => ({
    ...b,
    isEarned: badges.some(eb => eb.id === b.id)
  }));

  const courses = db.prepare(`
    SELECT c.title, c.slug, cp.progress_percent, cp.completed_levels
    FROM courses c
    JOIN course_progress cp ON c.id = cp.course_id
    WHERE cp.student_id = ?
  `).all(studentId);

  const team = db.prepare(`
    SELECT t.id, t.name, t.score
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    WHERE tm.student_id = ?
  `).get(studentId);

  const mentor = db.prepare(`
    SELECT u.name, u.email, mp.expertise
    FROM mentor_student_relationships msr
    JOIN users u ON msr.mentor_id = u.id
    JOIN mentor_profiles mp ON u.id = mp.user_id
    WHERE msr.student_id = ? AND msr.status = 'ACTIVE'
  `).get(studentId);

  return res.json({
    user: req.user,
    profile,
    badges: allBadges,
    enrolledCourses: courses,
    team: team || null,
    mentor: mentor || null
  });
});

export default router;
