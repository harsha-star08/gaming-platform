import { db } from '../db/schema.js';

export function calculateLevel(xp) {
  if (xp >= 3000) return 5;
  if (xp >= 2000) return 4;
  if (xp >= 1000) return 3;
  if (xp >= 500) return 2;
  return 1;
}

export function getXpForNextLevel(level) {
  switch (level) {
    case 1: return 500;
    case 2: return 1000;
    case 3: return 2000;
    case 4: return 3000;
    default: return 5000;
  }
}

export function awardXp(studentId, amount, reason, activityType) {
  if (!amount || amount <= 0) return { xp: 0, levelUp: false, newLevel: 1 };

  // 1. Insert transaction
  db.prepare(`
    INSERT INTO xp_transactions (student_id, amount, reason, activity_type)
    VALUES (?, ?, ?, ?)
  `).run(studentId, amount, reason, activityType);

  // 2. Fetch current profile
  const profile = db.prepare('SELECT xp, level FROM student_profiles WHERE user_id = ?').get(studentId);
  const oldXp = profile ? profile.xp : 0;
  const oldLevel = profile ? profile.level : 1;
  const newXp = oldXp + amount;
  const newLevel = calculateLevel(newXp);
  const levelUp = newLevel > oldLevel;

  // 3. Update profile
  db.prepare(`
    UPDATE student_profiles
    SET xp = ?, level = ?
    WHERE user_id = ?
  `).run(newXp, newLevel, studentId);

  // 4. If level up, create notification
  if (levelUp) {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (?, 'LEVEL_UP', 'Leveled Up!', ?)
    `).run(studentId, `Congratulations! You reached Level ${newLevel}! Keep up the great work.`);
  }

  return { newXp, oldLevel, newLevel, levelUp, amount };
}

export function awardSkillCoins(studentId, amount, reason) {
  if (!amount || amount <= 0) return { coins: 0 };

  db.prepare(`
    INSERT INTO skill_coin_transactions (student_id, amount, reason, transaction_type)
    VALUES (?, ?, ?, 'EARNED')
  `).run(studentId, amount, reason);

  const profile = db.prepare('SELECT skill_coins FROM student_profiles WHERE user_id = ?').get(studentId);
  const newCoins = (profile ? profile.skill_coins : 0) + amount;

  db.prepare(`
    UPDATE student_profiles
    SET skill_coins = ?
    WHERE user_id = ?
  `).run(newCoins, studentId);

  return { newCoins };
}

export function spendSkillCoins(studentId, amount, reason) {
  const profile = db.prepare('SELECT skill_coins FROM student_profiles WHERE user_id = ?').get(studentId);
  const currentCoins = profile ? profile.skill_coins : 0;

  if (currentCoins < amount) {
    throw new Error(`Insufficient Skill Coins. You have ${currentCoins}, but this item costs ${amount}.`);
  }

  const newCoins = currentCoins - amount;

  db.prepare(`
    INSERT INTO skill_coin_transactions (student_id, amount, reason, transaction_type)
    VALUES (?, ?, ?, 'SPENT')
  `).run(studentId, amount, reason);

  db.prepare(`
    UPDATE student_profiles
    SET skill_coins = ?
    WHERE user_id = ?
  `).run(newCoins, studentId);

  return { newCoins };
}

export function recordActivityAndStreak(studentId, description, xp = 0) {
  const today = new Date().toISOString().split('T')[0];

  // 1. Log activity
  db.prepare(`
    INSERT INTO activity_log (student_id, type, description, xp)
    VALUES (?, 'LEARNING_ACTIVITY', ?, ?)
  `).run(studentId, description, xp);

  // 2. Manage streak
  let streakRow = db.prepare('SELECT * FROM streaks WHERE student_id = ?').get(studentId);
  if (!streakRow) {
    db.prepare(`
      INSERT INTO streaks (student_id, current_streak, longest_streak, last_active_date, streak_status)
      VALUES (?, 1, 1, ?, 'ACTIVE')
    `).run(studentId, today);

    db.prepare(`
      UPDATE student_profiles
      SET current_streak = 1, longest_streak = 1, last_activity_date = ?, streak_broken = 0
      WHERE user_id = ?
    `).run(today, studentId);

    db.prepare(`
      INSERT INTO streak_history (student_id, activity_date, activity_description)
      VALUES (?, ?, ?)
    `).run(studentId, today, description);

    return { currentStreak: 1, longestStreak: 1, streakBroken: false };
  }

  const lastDate = streakRow.last_active_date;
  let newCurrent = streakRow.current_streak;
  let newLongest = streakRow.longest_streak;
  let streakBroken = false;

  if (lastDate === today) {
    // Already active today, streak count stays the same
  } else if (lastDate) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (lastDate === yesterday) {
      // Consecutive day!
      newCurrent += 1;
      if (newCurrent > newLongest) newLongest = newCurrent;
    } else {
      // Missed at least one day!
      streakBroken = true;
      newCurrent = 1; // starts fresh streak today unless restored
    }
  } else {
    newCurrent = 1;
    if (newLongest < 1) newLongest = 1;
  }

  db.prepare(`
    UPDATE streaks
    SET current_streak = ?, longest_streak = ?, last_active_date = ?, streak_status = 'ACTIVE'
    WHERE student_id = ?
  `).run(newCurrent, newLongest, today, studentId);

  db.prepare(`
    UPDATE student_profiles
    SET current_streak = ?, longest_streak = ?, last_activity_date = ?, streak_broken = ?
    WHERE user_id = ?
  `).run(newCurrent, newLongest, today, streakBroken ? 1 : 0, studentId);

  db.prepare(`
    INSERT INTO streak_history (student_id, activity_date, activity_description)
    VALUES (?, ?, ?)
  `).run(studentId, today, description);

  checkAndAwardBadges(studentId);

  return { currentStreak: newCurrent, longestStreak: newLongest, streakBroken };
}

export function checkAndAwardBadges(studentId) {
  const awardedBadges = [];

  const checkAndInsert = (badgeKey) => {
    const badge = db.prepare('SELECT id, name, description FROM badges WHERE badge_key = ?').get(badgeKey);
    if (!badge) return;

    const alreadyHas = db.prepare('SELECT id FROM student_badges WHERE student_id = ? AND badge_id = ?').get(studentId, badge.id);
    if (!alreadyHas) {
      db.prepare(`
        INSERT INTO student_badges (student_id, badge_id)
        VALUES (?, ?)
      `).run(studentId, badge.id);

      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, 'BADGE_EARNED', 'Badge Unlocked!', ?)
      `).run(studentId, `You earned the "${badge.name}" badge: ${badge.description}`);

      awardedBadges.push(badge);
    }
  };

  // 1. First Challenge: At least one ACCEPTED submission
  const acceptedCount = db.prepare(`
    SELECT COUNT(*) as count FROM code_submissions
    WHERE student_id = ? AND status = 'ACCEPTED'
  `).get(studentId).count;
  if (acceptedCount >= 1) checkAndInsert('first_challenge');

  // 2. 7-Day Learner: Streak >= 7
  const streak = db.prepare('SELECT current_streak, longest_streak FROM streaks WHERE student_id = ?').get(studentId);
  if (streak && (streak.current_streak >= 7 || streak.longest_streak >= 7)) {
    checkAndInsert('seven_day_learner');
  }

  // 3. Coding Streak: 5 or more unique active days
  const uniqueDays = db.prepare(`
    SELECT COUNT(DISTINCT activity_date) as days FROM streak_history WHERE student_id = ?
  `).get(studentId).days;
  if (uniqueDays >= 5) checkAndInsert('coding_streak');

  // 4. Python Master: All 16 topics completed
  const completedTopics = db.prepare(`
    SELECT COUNT(*) as count FROM topic_progress WHERE student_id = ? AND completed = 1
  `).get(studentId).count;
  if (completedTopics >= 16) checkAndInsert('python_master');

  // 5. Perfect Score: 100% on assignment
  const perfectAssignment = db.prepare(`
    SELECT COUNT(*) as count FROM assignment_recipients WHERE student_id = ? AND score >= 100
  `).get(studentId).count;
  if (perfectAssignment >= 1) checkAndInsert('perfect_score');

  return awardedBadges;
}
