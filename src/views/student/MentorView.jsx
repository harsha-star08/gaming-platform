import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  UserCheck,
  Inbox,
  MessageSquare,
  Check,
  X,
  Mail,
  ShieldCheck,
  Clock,
  Sparkles,
  Calendar
} from 'lucide-react';
import { api } from '../../api';

export default function MentorView({ initialTab = 'requests', onRefreshStats }) {
  const [tab, setTab] = useState(initialTab);
  const [requests, setRequests] = useState([]);
  const [mentorData, setMentorData] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reqs, profileData] = await Promise.all([
        api.mentorRequests.getRequests(),
        api.student.getProfile()
      ]);
      setRequests(reqs);
      setMentorData(profileData.mentor);

      // Load mentor feedback if connected
      const dash = await api.student.getDashboard();
      if (dash.mentor?.status === 'CONNECTED') {
        const fbRes = await fetch('/api/mentor/feedback', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('upskill_token')}` }
        }).then(r => r.json()).catch(() => []);
        setFeedbacks(Array.isArray(fbRes) ? fbRes : []);
      }
    } catch (err) {
      console.error('Failed to load mentor views data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await api.mentorRequests.accept(requestId);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDecline = async (requestId) => {
    try {
      await api.mentorRequests.decline(requestId);
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      alert(err.message);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>Loading mentorship hub...</div>;
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 950, margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Mentorship & Guidance</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Connect with industry mentors, review invitations, and access personalized coaching feedback.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', gap: 20 }}>
        <button
          type="button"
          onClick={() => setTab('requests')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: tab === 'requests' ? '2px solid var(--primary)' : '2px solid transparent',
            padding: '10px 0',
            color: tab === 'requests' ? '#fff' : 'var(--text-muted)',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Inbox size={16} />
          <span>Mentor Requests</span>
          {pendingRequests.length > 0 && (
            <span style={{ fontSize: 11, background: 'var(--accent-rose)', color: '#fff', padding: '2px 7px', borderRadius: 10 }}>
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab('my-mentor')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: tab === 'my-mentor' ? '2px solid var(--primary)' : '2px solid transparent',
            padding: '10px 0',
            color: tab === 'my-mentor' ? '#fff' : 'var(--text-muted)',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <UserCheck size={16} />
          <span>My Mentor</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('feedback')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: tab === 'feedback' ? '2px solid var(--primary)' : '2px solid transparent',
            padding: '10px 0',
            color: tab === 'feedback' ? '#fff' : 'var(--text-muted)',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <MessageSquare size={16} />
          <span>Mentor Feedback</span>
        </button>
      </div>

      {/* Tab 1: Mentor Requests Received (Section 6, 9, 10) */}
      {tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>
            Note: As a student, you receive requests directly from mentors. You can accept or decline below.
          </div>

          {requests.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-faint)' }}>
              No mentor requests received yet. Mentors search students in the directory and will send you proposals.
            </div>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="card" style={{
                borderLeft: r.status === 'PENDING' ? '4px solid var(--primary)' : r.status === 'ACCEPTED' ? '4px solid var(--accent-emerald)' : '4px solid var(--text-faint)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700
                    }}>
                      {r.mentor_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 17, color: '#fff' }}>{r.mentor_name}</h3>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.expertise} • {r.experience}</span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 4,
                    background: r.status === 'PENDING' ? 'rgba(99, 102, 241, 0.15)' : r.status === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                    color: r.status === 'PENDING' ? 'var(--primary)' : r.status === 'ACCEPTED' ? 'var(--accent-emerald)' : 'var(--text-faint)'
                  }}>
                    {r.status}
                  </span>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)', padding: '12px 16px', borderRadius: 8,
                  fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5, marginBottom: 14
                }}>
                  "{r.message}"
                </div>

                {r.status === 'PENDING' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleDecline(r.id)}>
                      <X size={14} />
                      <span>Decline</span>
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleAccept(r.id)}>
                      <Check size={14} />
                      <span>Accept Mentorship</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: My Connected Mentor */}
      {tab === 'my-mentor' && (
        <div>
          {mentorData ? (
            <div className="card" style={{ padding: '32px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700
                }}>
                  {mentorData.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 800 }}>{mentorData.name}</h2>
                  <span style={{ fontSize: 13, color: 'var(--accent-emerald)', fontWeight: 600 }}>
                    ✓ Active Mentor Connection
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Expertise</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{mentorData.expertise}</div>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Email</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{mentorData.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary btn-sm" onClick={() => setTab('feedback')}>
                  View Mentor Feedback
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-faint)' }}>
              No mentor currently connected. Check the "Mentor Requests" tab to review incoming invitations.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Mentor Feedback (Section 33) */}
      {tab === 'feedback' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {feedbacks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-faint)' }}>
              No mentor feedback entries yet. Once your connected mentor reviews your code or quizzes, their feedback will appear here.
            </div>
          ) : (
            feedbacks.map((fb) => (
              <div key={fb.id} className="card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {fb.topic_name} • {fb.task_name}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fb.created_at}</span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-main)', lineHeight: 1.6 }}>
                  "{fb.feedback_text}"
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
