import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'upskill.sqlite');

export const db = new DatabaseSync(dbPath);

export function initDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('STUDENT', 'MENTOR')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      skill_coins INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_activity_date TEXT,
      streak_broken INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mentor_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expertise TEXT DEFAULT 'Python, Data Structures, Algorithms',
      experience TEXT DEFAULT '3+ years mentoring students',
      availability TEXT DEFAULT 'Available (10 slots)',
      bio TEXT DEFAULT 'Experienced software engineer dedicated to guiding students through hands-on mastery.',
      capacity INTEGER DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      is_locked INTEGER DEFAULT 0,
      total_levels INTEGER DEFAULT 16
    );

    CREATE TABLE IF NOT EXISTS course_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      level_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      concept_summary TEXT,
      content_markdown TEXT,
      code_example TEXT,
      expected_output TEXT,
      common_mistakes TEXT,
      xp_reward INTEGER DEFAULT 50,
      coins_reward INTEGER DEFAULT 15
    );

    CREATE TABLE IF NOT EXISTS topic_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic_id INTEGER NOT NULL REFERENCES course_topics(id) ON DELETE CASCADE,
      completed INTEGER DEFAULT 0,
      completed_at DATETIME,
      score INTEGER DEFAULT 0,
      UNIQUE(student_id, topic_id)
    );

    CREATE TABLE IF NOT EXISTS course_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      enrolled INTEGER DEFAULT 1,
      current_level INTEGER DEFAULT 1,
      completed_levels INTEGER DEFAULT 0,
      progress_percent REAL DEFAULT 0,
      UNIQUE(student_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER REFERENCES course_topics(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('mcq', 'prediction', 'debugging', 'concept')),
      prompt TEXT NOT NULL,
      code_snippet TEXT,
      options_json TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      xp_reward INTEGER DEFAULT 10,
      coins_reward INTEGER DEFAULT 5
    );

    CREATE TABLE IF NOT EXISTS question_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      selected_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      xp_awarded INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coding_problems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER REFERENCES course_topics(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      difficulty TEXT NOT NULL CHECK(difficulty IN ('Easy', 'Medium', 'Hard')),
      statement TEXT NOT NULL,
      input_format TEXT,
      output_format TEXT,
      constraints TEXT,
      starter_code TEXT NOT NULL,
      language TEXT DEFAULT 'python',
      xp_reward INTEGER DEFAULT 20,
      coins_reward INTEGER DEFAULT 10,
      time_limit_ms INTEGER DEFAULT 3000
    );

    CREATE TABLE IF NOT EXISTS code_test_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id INTEGER NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
      input TEXT NOT NULL,
      expected_output TEXT NOT NULL,
      is_hidden INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS code_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      problem_id INTEGER NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      status TEXT NOT NULL,
      passed_count INTEGER DEFAULT 0,
      total_count INTEGER DEFAULT 0,
      score REAL DEFAULT 0,
      execution_time_ms REAL DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS xp_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skill_coin_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('EARNED', 'SPENT')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_active_date TEXT,
      streak_status TEXT DEFAULT 'ACTIVE'
    );

    CREATE TABLE IF NOT EXISTS streak_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_date TEXT NOT NULL,
      activity_description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS streak_restore_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      missed_date TEXT NOT NULL,
      task_type TEXT NOT NULL,
      weak_topic TEXT NOT NULL,
      challenge_title TEXT NOT NULL,
      challenge_prompt TEXT NOT NULL,
      starter_code TEXT,
      expected_output TEXT,
      test_code TEXT,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'COMPLETED', 'FAILED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      badge_key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, badge_id)
    );

    CREATE TABLE IF NOT EXISTS daily_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_date TEXT NOT NULL UNIQUE,
      problem_id INTEGER NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
      xp_reward INTEGER DEFAULT 30,
      coins_reward INTEGER DEFAULT 15
    );

    CREATE TABLE IF NOT EXISTS weekly_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('INDIVIDUAL', 'TEAM')),
      target_problem_id INTEGER NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
      xp_reward INTEGER DEFAULT 100,
      coins_reward INTEGER DEFAULT 50
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER REFERENCES courses(id),
      target_level_min INTEGER DEFAULT 1,
      target_level_max INTEGER DEFAULT 16,
      score INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      student_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS team_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_a_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      team_b_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      challenge_title TEXT NOT NULL,
      score_a INTEGER DEFAULT 0,
      score_b INTEGER DEFAULT 0,
      winner_team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'COMPLETED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scratch_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      is_scratched INTEGER DEFAULT 0,
      reward_type TEXT NOT NULL CHECK(reward_type IN ('HINT_CARD', 'RESTORE_CARD', 'SKIP_CARD', 'SKILL_COINS', 'XP')),
      reward_amount INTEGER DEFAULT 1,
      reward_title TEXT NOT NULL,
      scratched_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS power_ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      price_coins INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_power_ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      power_up_id INTEGER NOT NULL REFERENCES power_ups(id) ON DELETE CASCADE,
      quantity INTEGER DEFAULT 0,
      UNIQUE(student_id, power_up_id)
    );

    CREATE TABLE IF NOT EXISTS mentor_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      responded_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS mentor_student_relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      student_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mentor_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_name TEXT NOT NULL,
      topic_name TEXT NOT NULL,
      task_name TEXT NOT NULL,
      feedback_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mentor_quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      course_name TEXT NOT NULL,
      level_number INTEGER DEFAULT 1,
      topic_name TEXT NOT NULL,
      time_limit_minutes INTEGER DEFAULT 15,
      questions_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mentor_programming_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      statement TEXT NOT NULL,
      difficulty TEXT DEFAULT 'Easy',
      course_name TEXT NOT NULL,
      level_number INTEGER DEFAULT 1,
      topic_name TEXT NOT NULL,
      language TEXT DEFAULT 'python',
      starter_code TEXT NOT NULL,
      public_tests_json TEXT NOT NULL,
      hidden_tests_json TEXT NOT NULL,
      time_limit_ms INTEGER DEFAULT 3000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('QUIZ', 'CODING')),
      quiz_id INTEGER REFERENCES mentor_quizzes(id) ON DELETE SET NULL,
      coding_id INTEGER REFERENCES mentor_programming_challenges(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      course_name TEXT NOT NULL,
      due_date TEXT NOT NULL,
      share_token TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assignment_recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'SENT' CHECK(status IN ('SENT', 'OPENED', 'IN_PROGRESS', 'SUBMITTED', 'EXPIRED')),
      score REAL DEFAULT 0,
      accuracy REAL DEFAULT 0,
      submission_data_json TEXT,
      started_at DATETIME,
      submitted_at DATETIME,
      UNIQUE(assignment_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT DEFAULT 'Learning Chat',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
      sender TEXT NOT NULL CHECK(sender IN ('USER', 'ASSISTANT')),
      message TEXT NOT NULL,
      context_used_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weekly_ai_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_name TEXT NOT NULL,
      level_number INTEGER DEFAULT 1,
      week_number INTEGER NOT NULL,
      quiz_accuracy REAL DEFAULT 0,
      coding_accuracy REAL DEFAULT 0,
      tasks_completed INTEGER DEFAULT 0,
      avg_attempts REAL DEFAULT 0,
      avg_time_seconds REAL DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      topics_completed INTEGER DEFAULT 0,
      strong_topics_json TEXT,
      weak_topics_json TEXT,
      streak_count INTEGER DEFAULT 0,
      comparison_json TEXT,
      ai_analysis_text TEXT NOT NULL,
      recommendations_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, course_name, level_number, week_number)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_topic_progress_student ON topic_progress(student_id);
    CREATE INDEX IF NOT EXISTS idx_code_submissions_student ON code_submissions(student_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_mentor_requests_student ON mentor_requests(student_id, status);
  `);
}
