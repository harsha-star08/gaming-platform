import { db } from '../db/schema.js';

export function getStudentPerformanceMetrics(studentId) {
  // Quiz statistics
  const quizStats = db.prepare(`
    SELECT
      COUNT(*) as total_attempts,
      COALESCE(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END), 0) as correct_attempts
    FROM question_attempts
    WHERE student_id = ?
  `).get(studentId);

  const quizAccuracy = quizStats.total_attempts > 0
    ? Math.round((quizStats.correct_attempts / quizStats.total_attempts) * 100)
    : 0;

  // Coding statistics
  const codeStats = db.prepare(`
    SELECT
      COUNT(*) as total_submissions,
      COALESCE(SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END), 0) as accepted_submissions,
      COALESCE(AVG(execution_time_ms), 0) as avg_time,
      COALESCE(AVG(score), 0) as avg_score
    FROM code_submissions
    WHERE student_id = ?
  `).get(studentId);

  const codingAccuracy = codeStats.total_submissions > 0
    ? Math.round((codeStats.accepted_submissions / codeStats.total_submissions) * 100)
    : 0;

  // Topics and course progress
  const completedTopics = db.prepare(`
    SELECT t.title, t.slug, t.level_number
    FROM topic_progress tp
    JOIN course_topics t ON tp.topic_id = t.id
    WHERE tp.student_id = ? AND tp.completed = 1
  `).all(studentId);

  // Weak topics (where attempts failed or questions answered incorrectly)
  const weakTopics = db.prepare(`
    SELECT t.title, COUNT(*) as failed_attempts
    FROM question_attempts qa
    JOIN questions q ON qa.question_id = q.id
    JOIN course_topics t ON q.topic_id = t.id
    WHERE qa.student_id = ? AND qa.is_correct = 0
    GROUP BY t.id
    ORDER BY failed_attempts DESC
    LIMIT 3
  `).all(studentId);

  // Strong topics (where questions or coding succeeded consistently)
  const strongTopics = db.prepare(`
    SELECT t.title, COUNT(*) as successes
    FROM question_attempts qa
    JOIN questions q ON qa.question_id = q.id
    JOIN course_topics t ON q.topic_id = t.id
    WHERE qa.student_id = ? AND qa.is_correct = 1
    GROUP BY t.id
    ORDER BY successes DESC
    LIMIT 3
  `).all(studentId);

  // Total XP
  const xpRow = db.prepare('SELECT xp, level, current_streak FROM student_profiles WHERE user_id = ?').get(studentId);

  return {
    quizAccuracy,
    codingAccuracy,
    totalQuizAttempts: quizStats.total_attempts,
    totalCodeSubmissions: codeStats.total_submissions,
    avgCodingTimeMs: Math.round(codeStats.avg_time),
    topicsCompletedCount: completedTopics.length,
    completedTopics: completedTopics.map(t => t.title),
    weakTopics: weakTopics.map(t => t.title),
    strongTopics: strongTopics.map(t => t.title),
    xp: xpRow ? xpRow.xp : 0,
    level: xpRow ? xpRow.level : 1,
    streak: xpRow ? xpRow.current_streak : 0
  };
}

export function generateContextAwareChat(studentId, userMessage) {
  const metrics = getStudentPerformanceMetrics(studentId);
  const currentTopic = db.prepare(`
    SELECT t.title, t.level_number
    FROM course_topics t
    LEFT JOIN topic_progress tp ON t.id = tp.topic_id AND tp.student_id = ?
    WHERE tp.completed IS NULL OR tp.completed = 0
    ORDER BY t.level_number ASC
    LIMIT 1
  `).get(studentId) || { title: 'Variables & Data Types', level_number: 1 };

  const promptLower = userMessage.toLowerCase();
  let aiReply = '';

  if (promptLower.includes('hint') || promptLower.includes('help') || promptLower.includes('stuck')) {
    if (metrics.weakTopics.length > 0) {
      aiReply = `I noticed you encountered difficulties on "${metrics.weakTopics[0]}". In Python, break down the logic into smaller atomic steps. Try writing out your variables, testing one assertion at a time, or using print statements to trace variable states. Would you like a hint on a specific loop, function, or data structure?`;
    } else {
      aiReply = `You're currently working on Level ${currentTopic.level_number}: ${currentTopic.title}. Focus on checking the problem input format, verifying edge conditions (like 0, negative values, or empty sequences), and ensuring clean function return types.`;
    }
  } else if (promptLower.includes('how am i doing') || promptLower.includes('progress') || promptLower.includes('status')) {
    aiReply = `Here is your verified performance summary:\n- Current Level: Level ${metrics.level} (${metrics.xp} XP)\n- Active Streak: ${metrics.streak} days\n- Quiz Accuracy: ${metrics.quizAccuracy}%\n- Coding Accuracy: ${metrics.codingAccuracy}%\n- Completed Topics: ${metrics.topicsCompletedCount}/16\n${metrics.strongTopics.length > 0 ? `\nStrongest area: ${metrics.strongTopics.join(', ')}.` : ''}\n${metrics.weakTopics.length > 0 ? `Recommended area to review: ${metrics.weakTopics.join(', ')}.` : ''}`;
  } else if (promptLower.includes('weak') || promptLower.includes('improve')) {
    if (metrics.weakTopics.length > 0) {
      aiReply = `Based on your recent attempts, your primary area for improvement is: ${metrics.weakTopics.join(', ')}. I recommend heading to Practice Mode for these topics and solving 2-3 targeted debugging challenges before advancing.`;
    } else {
      aiReply = `Your accuracy is solid with no major persistent weak points detected yet! Keep advancing through Level ${currentTopic.level_number}: ${currentTopic.title} to test your algorithmic problem solving.`;
    }
  } else {
    aiReply = `Hello! I'm your AI Learning Assistant. You are currently at Level ${metrics.level} working towards Python mastery. Your current focus topic is "${currentTopic.title}". Feel free to ask for conceptual explanations, debugging strategies, or advice on mastering difficult syntax!`;
  }

  // Store conversation and message
  let convo = db.prepare('SELECT id FROM ai_conversations WHERE student_id = ? ORDER BY id DESC LIMIT 1').get(studentId);
  if (!convo) {
    const res = db.prepare('INSERT INTO ai_conversations (student_id, title) VALUES (?, ?)').run(studentId, 'Learning Assistant');
    convo = { id: res.lastInsertRowid };
  }

  db.prepare(`
    INSERT INTO ai_messages (conversation_id, sender, message, context_used_json)
    VALUES (?, 'USER', ?, ?)
  `).run(convo.id, userMessage, JSON.stringify({ currentTopic: currentTopic.title, level: metrics.level }));

  db.prepare(`
    INSERT INTO ai_messages (conversation_id, sender, message, context_used_json)
    VALUES (?, 'ASSISTANT', ?, ?)
  `).run(convo.id, aiReply, JSON.stringify(metrics));

  return { reply: aiReply, metrics };
}

export function generateWeeklyAiAnalysis(studentId) {
  const metrics = getStudentPerformanceMetrics(studentId);

  // If no submissions and no quiz attempts, return insufficient data state (Section 31 & 54)
  if (metrics.totalQuizAttempts === 0 && metrics.totalCodeSubmissions === 0) {
    return {
      hasData: false,
      message: 'Not enough data for a meaningful comparison yet. Complete activities in the Course Library or Challenges to generate AI insights.'
    };
  }

  // Check existing stored weekly analyses
  const storedAnalyses = db.prepare(`
    SELECT * FROM weekly_ai_analysis
    WHERE student_id = ?
    ORDER BY week_number ASC
  `).all(studentId);

  let currentWeekNumber = storedAnalyses.length + 1;
  let previousWeek = storedAnalyses.length > 0 ? storedAnalyses[storedAnalyses.length - 1] : null;

  // If this is week 1 or baseline
  if (!previousWeek) {
    const analysisText = `Week 1 establishes your learning baseline. You achieved a quiz accuracy of ${metrics.quizAccuracy}% and coding accuracy of ${metrics.codingAccuracy}% with ${metrics.topicsCompletedCount} topic(s) mastered so far. ${metrics.weakTopics.length > 0 ? `Targeted focus needed on: ${metrics.weakTopics.join(', ')}.` : 'Strong early fundamentals detected.'}`;
    
    const recommendations = [
      metrics.weakTopics.length > 0 ? `Practice 3 exercises on ${metrics.weakTopics[0]}` : 'Maintain streak with daily challenge',
      'Solve at least one medium LeetCode problem this week',
      'Review function signatures and edge case handling'
    ];

    db.prepare(`
      INSERT OR REPLACE INTO weekly_ai_analysis (
        student_id, course_name, level_number, week_number,
        quiz_accuracy, coding_accuracy, tasks_completed, avg_attempts,
        avg_time_seconds, xp_earned, topics_completed, strong_topics_json,
        weak_topics_json, streak_count, comparison_json, ai_analysis_text, recommendations_json
      ) VALUES (?, 'Python Mastery', ?, 1, ?, ?, ?, 1.4, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      studentId,
      metrics.level,
      metrics.quizAccuracy,
      metrics.codingAccuracy,
      metrics.totalCodeSubmissions + metrics.totalQuizAttempts,
      metrics.avgCodingTimeMs / 1000,
      metrics.xp,
      metrics.topicsCompletedCount,
      JSON.stringify(metrics.strongTopics),
      JSON.stringify(metrics.weakTopics),
      metrics.streak,
      JSON.stringify({ isBaseline: true }),
      analysisText,
      JSON.stringify(recommendations)
    );

    return {
      hasData: true,
      weekNumber: 1,
      isBaseline: true,
      currentMetrics: {
        quizAccuracy: metrics.quizAccuracy,
        codingAccuracy: metrics.codingAccuracy,
        tasksCompleted: metrics.totalCodeSubmissions + metrics.totalQuizAttempts,
        xpEarned: metrics.xp,
        streak: metrics.streak
      },
      comparison: null,
      strongTopics: metrics.strongTopics,
      weakTopics: metrics.weakTopics,
      aiAnalysisText: analysisText,
      recommendations,
      allWeeks: [
        {
          weekNumber: 1,
          quizAccuracy: metrics.quizAccuracy,
          codingAccuracy: metrics.codingAccuracy,
          tasksCompleted: metrics.totalCodeSubmissions + metrics.totalQuizAttempts,
          xpEarned: metrics.xp
        }
      ]
    };
  } else {
    // Week N vs Week N-1 Comparison!
    const quizDiff = metrics.quizAccuracy - previousWeek.quiz_accuracy;
    const codeDiff = metrics.codingAccuracy - previousWeek.coding_accuracy;
    const taskDiff = (metrics.totalCodeSubmissions + metrics.totalQuizAttempts) - previousWeek.tasks_completed;
    const xpDiff = metrics.xp - previousWeek.xp_earned;

    const quizDiffStr = quizDiff >= 0 ? `+${quizDiff}%` : `${quizDiff}%`;
    const codeDiffStr = codeDiff >= 0 ? `+${codeDiff}%` : `${codeDiff}%`;

    const improvements = [];
    const declines = [];

    if (quizDiff > 0) improvements.push(`Quiz Accuracy improved by ${quizDiffStr}`);
    else if (quizDiff < 0) declines.push(`Quiz Accuracy dipped by ${quizDiffStr}`);

    if (codeDiff > 0) improvements.push(`Coding Accuracy increased by ${codeDiffStr}`);
    else if (codeDiff < 0) declines.push(`Coding Accuracy shifted by ${codeDiffStr}`);

    if (xpDiff > 0) improvements.push(`Gained +${xpDiff} XP`);

    const comparisonSummary = `Comparing Week ${currentWeekNumber} vs Week ${previousWeek.week_number}:\n` +
      `- Quiz Accuracy: ${previousWeek.quiz_accuracy}% → ${metrics.quizAccuracy}% (${quizDiffStr})\n` +
      `- Coding Accuracy: ${previousWeek.coding_accuracy}% → ${metrics.codingAccuracy}% (${codeDiffStr})\n` +
      `- Tasks Completed: ${previousWeek.tasks_completed} → ${metrics.totalCodeSubmissions + metrics.totalQuizAttempts}\n` +
      `- XP Progress: ${previousWeek.xp_earned} → ${metrics.xp} (${xpDiff >= 0 ? '+' : ''}${xpDiff})`;

    const analysisText = `${comparisonSummary}\n\n${improvements.length > 0 ? `What improved: ${improvements.join(', ')}.` : ''} ${declines.length > 0 ? `Areas to recover: ${declines.join(', ')}.` : 'Steady overall performance growth.'}`;

    const recommendations = [
      metrics.weakTopics.length > 0 ? `Re-attempt problems in ${metrics.weakTopics[0]}` : 'Advance to higher level algorithm topics',
      'Maintain continuous daily streak without missing',
      'Participate in weekly team competition to test real-time speed'
    ];

    return {
      hasData: true,
      weekNumber: currentWeekNumber,
      isBaseline: false,
      currentMetrics: {
        quizAccuracy: metrics.quizAccuracy,
        codingAccuracy: metrics.codingAccuracy,
        tasksCompleted: metrics.totalCodeSubmissions + metrics.totalQuizAttempts,
        xpEarned: metrics.xp,
        streak: metrics.streak
      },
      comparison: {
        previousWeekNumber: previousWeek.week_number,
        quizChange: quizDiffStr,
        codingChange: codeDiffStr,
        taskChange: taskDiff,
        xpChange: xpDiff,
        improvements,
        declines
      },
      strongTopics: metrics.strongTopics,
      weakTopics: metrics.weakTopics,
      aiAnalysisText: analysisText,
      recommendations,
      allWeeks: [
        ...storedAnalyses.map(w => ({
          weekNumber: w.week_number,
          quizAccuracy: w.quiz_accuracy,
          codingAccuracy: w.coding_accuracy,
          tasksCompleted: w.tasks_completed,
          xpEarned: w.xp_earned
        })),
        {
          weekNumber: currentWeekNumber,
          quizAccuracy: metrics.quizAccuracy,
          codingAccuracy: metrics.codingAccuracy,
          tasksCompleted: metrics.totalCodeSubmissions + metrics.totalQuizAttempts,
          xpEarned: metrics.xp
        }
      ]
    };
  }
}

export function generateStreakRestoreTask(studentId) {
  const metrics = getStudentPerformanceMetrics(studentId);
  const weakTopic = metrics.weakTopics.length > 0 ? metrics.weakTopics[0] : 'Loops';

  // Check if a pending restore task already exists
  const existingTask = db.prepare(`
    SELECT * FROM streak_restore_tasks
    WHERE student_id = ? AND status = 'PENDING'
    ORDER BY id DESC LIMIT 1
  `).get(studentId);

  if (existingTask) {
    return existingTask;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const taskTitle = `AI Streak Recovery: Master ${weakTopic}`;
  const taskPrompt = `Your learning analytics indicate recent difficulty on "${weakTopic}". Complete this targeted coding challenge to restore your broken streak!`;
  const starterCode = `# Write a Python program that reads integers from input and prints their sum\nimport sys\n\ndef solve():\n    nums = [int(x) for x in sys.stdin.read().split()]\n    print(sum(nums))\n\nif __name__ == '__main__':\n    solve()`;
  const testCode = '10 20 30';
  const expectedOutput = '60';

  const res = db.prepare(`
    INSERT INTO streak_restore_tasks (
      student_id, missed_date, task_type, weak_topic, challenge_title,
      challenge_prompt, starter_code, expected_output, test_code, status
    ) VALUES (?, ?, 'CODING', ?, ?, ?, ?, ?, ?, 'PENDING')
  `).run(
    studentId,
    yesterday,
    weakTopic,
    taskTitle,
    taskPrompt,
    starterCode,
    expectedOutput,
    testCode
  );

  return db.prepare('SELECT * FROM streak_restore_tasks WHERE id = ?').get(res.lastInsertRowid);
}
