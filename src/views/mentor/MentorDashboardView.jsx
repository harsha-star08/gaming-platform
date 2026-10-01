import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Award,
  CheckCircle,
  Clock,
  PlusCircle,
  Search,
  Code2,
  ListTodo,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../api';

export default function MentorDashboardView({ onNavigate }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.mentor.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load mentor dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>Loading mentor command center...</div>;
  }

  const { mentor, stats, students, recentAssignments } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        padding: '30px 26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
            Mentor Command Center
          </span>
          <h1 style={{ fontSize: 30, fontWeight: 800, marginTop: 4, marginBottom: 6 }}>
            Welcome, {mentor.name}!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Monitor connected students, evaluate code submissions, and create custom assessments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('search-students')}>
            <Search size={14} />
            <span>Search Students</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('create-quiz')}>
            <PlusCircle size={14} />
            <span>Create Quiz</span>
          </button>
        </div>
      </div>

      {/* Mentor Statistics Bar (Section 7) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {/* Total Students */}
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>TOTAL STUDENTS</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>{stats.totalStudents}</div>
          <span style={{ fontSize: 11, color: 'var(--accent-cyan)' }}>Connected mentees</span>
        </div>

        {/* Active Students */}
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>ACTIVE STUDENTS</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-emerald)' }}>{stats.activeStudents}</div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Active learning streaks</span>
        </div>

        {/* Average Progress */}
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>AVG PROGRESS</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)' }}>{stats.avgProgress}%</div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Course completion rate</span>
        </div>

        {/* Average Accuracy */}
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>AVG ACCURACY</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b' }}>{stats.avgAccuracy}%</div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Quiz and coding evaluations</span>
        </div>

        {/* Students Needing Attention */}
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>NEEDING ATTENTION</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: stats.studentsNeedingAttention > 0 ? 'var(--accent-rose)' : 'var(--text-faint)' }}>
            {stats.studentsNeedingAttention}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Broken streak or low progress</span>
        </div>
      </div>

      {/* Connected Students & Assignments Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        {/* Connected Students Table */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18 }}>My Connected Students</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('my-students')}>
              View All
            </button>
          </div>

          {students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-faint)', fontSize: 13 }}>
              No students connected yet. Use "Search Students" to discover students and send mentorship invitations!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {students.slice(0, 5).map((s) => (
                <div key={s.id} style={{
                  padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div>
                    <h4 style={{ fontSize: 15, color: '#fff' }}>{s.name}</h4>
                    <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Level {s.level} • {s.xp} XP</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        {s.progress_percent}% Progress
                      </span>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onNavigate('student-analytics', s.id)}
                    >
                      Analytics
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Assignments Sent */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18 }}>Recent Assignments</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('mentor-assignments')}>
              Manage
            </button>
          </div>

          {recentAssignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-faint)', fontSize: 13 }}>
              No assignments dispatched yet. Create quizzes or coding challenges to assign to your students!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentAssignments.map((a) => (
                <div key={a.id} style={{
                  padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{a.title}</span>
                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: 'var(--primary)' }}>
                      {a.type}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-faint)' }}>
                    <span>Due: {a.due_date}</span>
                    <span style={{ color: 'var(--accent-emerald)' }}>{a.total_submitted}/{a.total_assigned} Submitted</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
