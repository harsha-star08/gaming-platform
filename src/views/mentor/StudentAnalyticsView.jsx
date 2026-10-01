import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  MessageSquare,
  TrendingUp,
  Code2,
  BookOpen,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../api';

export default function StudentAnalyticsView({ studentId, onBack }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Feedback form
  const [feedbackText, setFeedbackText] = useState('');
  const [taskName, setTaskName] = useState('Recent Progress');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [studentId]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.mentor.getStudentAnalytics(studentId);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setIsSendingFeedback(true);
    try {
      await api.mentor.sendFeedback({
        studentId,
        courseName: 'Python Mastery',
        topicName: 'Algorithmic Progress',
        taskName,
        feedbackText: feedbackText.trim()
      });
      setFeedbackSuccess(true);
      setFeedbackText('');
      loadAnalytics();
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSendingFeedback(false);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-faint)' }}>Loading detailed student analytics...</div>;
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center', padding: 36 }}>
        <AlertTriangle size={36} color="var(--accent-rose)" style={{ marginBottom: 12 }} />
        <h3 style={{ fontSize: 20, marginBottom: 8 }}>Access Restricted</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{error}</p>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Students</span>
        </button>
      </div>
    );
  }

  const { student, courseProgress, completedTopics, quizAttempts, codeSubmissions, feedbackHistory, weakTopics } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1050, margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={15} />
          <span>Back to My Students</span>
        </button>
        <span style={{ fontSize: 13, color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldCheck size={16} /> Verified Active Mentorship
        </span>
      </div>

      {/* Student Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 22, fontWeight: 800
          }}>
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>{student.name}</h1>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{student.email}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ textAlign: 'center', padding: '10px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>LEVEL</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Level {student.level}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>TOTAL XP</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{student.xp}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>STREAK</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{student.current_streak}d</div>
          </div>
        </div>
      </div>

      {/* Weak Topics Alert */}
      {weakTopics.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-rose)' }}>
          <h3 style={{ fontSize: 16, color: 'var(--accent-rose)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} />
            <span>Topics Requiring Mentor Attention</span>
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
            This student has encountered repeated errors on:
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {weakTopics.map((w, i) => (
              <span key={i} style={{
                fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 4,
                background: 'rgba(244, 63, 94, 0.15)', color: '#fda4af'
              }}>
                {w.title} ({w.mistakes} mistakes)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Completed Topics & Submissions Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Completed Topics */}
        <div className="card">
          <h3 style={{ fontSize: 17, marginBottom: 14 }}>Completed Topics ({completedTopics.length}/16)</h3>
          {completedTopics.length === 0 ? (
            <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>Student is working on Level 1.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {completedTopics.map((ct, i) => (
                <div key={i} style={{
                  padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.02)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13
                }}>
                  <span style={{ color: '#fff' }}>Lvl {ct.level_number}: {ct.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--accent-emerald)' }}>✓ Completed</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Code Submissions */}
        <div className="card">
          <h3 style={{ fontSize: 17, marginBottom: 14 }}>Code Submissions</h3>
          {codeSubmissions.length === 0 ? (
            <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>No coding submissions recorded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {codeSubmissions.slice(0, 6).map((cs) => (
                <div key={cs.id} style={{
                  padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.02)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12
                }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{cs.problem_title}</span>
                    <span style={{
                      marginLeft: 8, fontSize: 11, fontWeight: 700,
                      color: cs.status === 'ACCEPTED' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                    }}>
                      {cs.status}
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-faint)' }}>{cs.passed_count}/{cs.total_count} tests</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mentor Feedback Section (Section 33) */}
      <div className="card">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Provide Guidance & Feedback</h3>

        {feedbackSuccess && (
          <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: 'var(--accent-emerald)', fontSize: 13, marginBottom: 14 }}>
            ✓ Feedback successfully delivered to student.
          </div>
        )}

        <form onSubmit={handleSendFeedback}>
          <div className="form-group">
            <label className="form-label">Task or Focus Topic</label>
            <input
              type="text"
              className="form-input"
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
              placeholder="e.g. Loops & Function Debugging"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Feedback Notes</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Write constructive guidance, recommendations, or words of encouragement..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" type="submit" disabled={isSendingFeedback}>
              <Send size={14} />
              <span>{isSendingFeedback ? 'Sending...' : 'Send Feedback to Student'}</span>
            </button>
          </div>
        </form>

        {/* Past Feedback History */}
        {feedbackHistory.length > 0 && (
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
            <h4 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
              Previous Feedback Given
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {feedbackHistory.map((fb) => (
                <div key={fb.id} style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: 4 }}>
                    <span>{fb.task_name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fb.created_at}</span>
                  </div>
                  <p style={{ color: 'var(--text-main)' }}>"{fb.feedback_text}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
