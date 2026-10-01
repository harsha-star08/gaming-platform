import React from 'react';
import {
  Flame,
  Zap,
  Coins,
  Shield,
  Award,
  BookOpen,
  ArrowRight,
  UserCheck,
  Clock,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Play
} from 'lucide-react';

export default function DashboardView({ dashboardData, onNavigate }) {
  if (!dashboardData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        Loading dashboard metrics...
      </div>
    );
  }

  const { user, stats, continueLearning, courses, dailyChallenge, weeklyChallenge, mentor, aiRecommendation, recentActivities } = dashboardData;

  const xpCurrentLevelFloor = (stats.level - 1) * 500;
  const xpInCurrentLevel = Math.max(0, stats.xp - xpCurrentLevelFloor);
  const xpNeededInLevel = Math.max(1, stats.xpNextLevel - xpCurrentLevelFloor);
  const xpPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeededInLevel) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* 1. Header Banner (Section 2 & 5) */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        padding: '32px 28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20
      }}>
        <div>
          <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-cyan)', fontWeight: 700 }}>
            Student Learning Hub
          </span>
          <h1 style={{ fontSize: 30, fontWeight: 800, marginTop: 4, marginBottom: 8 }}>
            Welcome, {user?.name}!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 540 }}>
            Track your verified progress, solve real coding challenges, and level up with AI-powered feedback.
          </p>
        </div>

        {/* Continue Learning CTA */}
        {continueLearning ? (
          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700 }}>Next Topic</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                Lvl {continueLearning.level_number}: {continueLearning.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{continueLearning.course_title}</div>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onNavigate('topic-detail', continueLearning.id)}
            >
              <span>Resume</span>
              <Play size={14} />
            </button>
          </div>
        ) : (
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: 13
          }}>
            Explore the Course Library to start your next curriculum!
          </div>
        )}
      </div>

      {/* 2. Top Metric Cards (Section 5) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16
      }}>
        {/* Level & XP */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT LEVEL</span>
            <div style={{ padding: 6, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
              <Shield size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            Level {stats.level}
          </div>
          <div className="progress-track" style={{ height: 6, marginBottom: 6 }}>
            <div className="progress-fill" style={{ width: `${xpPercent}%` }}></div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{stats.xp} / {stats.xpNextLevel} XP</span>
        </div>

        {/* Streak */}
        <div className="card" onClick={() => onNavigate('streak')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>DAILY STREAK</span>
            <div style={{ padding: 6, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: stats.streakBroken ? 'var(--accent-rose)' : '#fff', marginBottom: 4 }}>
            {stats.currentStreak} Days
          </div>
          <span style={{ fontSize: 11, color: stats.streakBroken ? 'var(--accent-rose)' : 'var(--text-faint)' }}>
            {stats.streakBroken ? '⚠️ Streak broken! Click to restore' : `Longest streak: ${stats.longestStreak} days`}
          </span>
        </div>

        {/* Skill Coins */}
        <div className="card" onClick={() => onNavigate('rewards-shop')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>SKILL COINS</span>
            <div style={{ padding: 6, borderRadius: 8, background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
              <Coins size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#eab308', marginBottom: 4 }}>
            {stats.skillCoins}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Spend in Reward Shop</span>
        </div>

        {/* Badges Earned */}
        <div className="card" onClick={() => onNavigate('badges')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>BADGES</span>
            <div style={{ padding: 6, borderRadius: 8, background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-violet)' }}>
              <Award size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            {stats.badgesCount}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Completed milestones</span>
        </div>

        {/* Completed Courses */}
        <div className="card" onClick={() => onNavigate('courses')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>COURSES</span>
            <div style={{ padding: 6, borderRadius: 8, background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            {stats.completedCoursesCount}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>16-level curricula</span>
        </div>
      </div>

      {/* 3. Main Split View: Challenges & Mentor Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        {/* Left Column: Challenges & Learning */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Daily Challenge Card */}
          {dailyChallenge && (
            <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Flame size={18} color="#f59e0b" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
                    Daily Challenge
                  </span>
                </div>
                <span style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontWeight: 600,
                  background: dailyChallenge.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: dailyChallenge.difficulty === 'Easy' ? 'var(--accent-emerald)' : '#f59e0b'
                }}>
                  {dailyChallenge.difficulty}
                </span>
              </div>

              <h3 style={{ fontSize: 18, marginBottom: 6 }}>{dailyChallenge.problem_title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                Solve today's coding puzzle to earn +{dailyChallenge.xp_reward} XP and +{dailyChallenge.coins_reward} Skill Coins while keeping your streak blazing!
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                  {dailyChallenge.is_solved ? '✅ Completed for today!' : '⚡ Not solved yet'}
                </span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onNavigate('coding-arena', dailyChallenge.problem_slug)}
                >
                  <span>{dailyChallenge.is_solved ? 'Review Code' : 'Solve Now'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Enrolled Courses Progress */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18 }}>My Courses</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate('courses')}
              >
                Browse Library
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {courses.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{c.title}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
                        {c.progress_percent}%
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${c.progress_percent}%` }}></div>
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onNavigate('course-topics', c.slug)}
                  >
                    View Levels
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Mentor Status & AI Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Mentor Status Card (Section 5 & 6) */}
          <div className="card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <UserCheck size={18} color="var(--accent-cyan)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                Mentor Status
              </span>
            </div>

            {mentor.status === 'CONNECTED' ? (
              <div>
                <h4 style={{ fontSize: 16, color: '#fff', marginBottom: 4 }}>{mentor.connectedMentor.name}</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Expertise: {mentor.connectedMentor.expertise}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('mentor-feedback')}>
                    View Feedback
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => onNavigate('my-mentor')}>
                    Mentor Profile
                  </button>
                </div>
              </div>
            ) : mentor.status === 'PENDING_REQUEST' ? (
              <div>
                <h4 style={{ fontSize: 15, color: '#fff', marginBottom: 4 }}>Pending Mentor Request</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  {mentor.pendingRequest.mentor_name} has invited you to be their student.
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onNavigate('mentor-requests')}
                >
                  Review Request
                </button>
              </div>
            ) : (
              <div>
                <h4 style={{ fontSize: 15, color: '#fff', marginBottom: 4 }}>Mentor: Not Connected</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Mentors search students in the directory to send mentorship requests. When a mentor requests you, it will appear here.
                </p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigate('mentor-requests')}
                >
                  Check Requests
                </button>
              </div>
            )}
          </div>

          {/* AI Learning Recommendation (Section 5) */}
          <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Sparkles size={18} color="var(--secondary)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>
                AI Learning Advisor
              </span>
            </div>
            <p style={{ color: '#fff', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
              "{aiRecommendation}"
            </p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('ai-performance')}
            >
              <span>Weekly AI Insights</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Recent Activity (Section 5) */}
          <div className="card">
            <h4 style={{ fontSize: 16, marginBottom: 14 }}>Recent Activity</h4>
            {recentActivities.length === 0 ? (
              <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>
                No recent activity recorded yet. Start solving exercises to generate your verified activity timeline!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentActivities.map((act) => (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <CheckCircle2 size={14} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {act.description}
                      </span>
                    </div>
                    {act.xp > 0 && (
                      <span style={{ color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>+{act.xp} XP</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
