import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  UserSearch,
  UserCheck,
  Send,
  MessageSquare,
  Search,
  CheckCircle,
  Clock,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { api } from '../../api';

export default function MentorView({ initialTab = 'find-mentor' }) {
  const [tab, setTab] = useState(initialTab);
  
  // Find Mentors state
  const [mentors, setMentors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  
  // My Requests state
  const [myRequests, setMyRequests] = useState([]);
  
  // My Mentor state
  const [myMentor, setMyMentor] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (tab === 'find-mentor') {
        const data = await api.mentors.getAll({ search: searchQuery });
        setMentors(data.mentors || []);
      } else if (tab === 'my-requests') {
        const reqs = await api.mentors.getMyRequests();
        setMyRequests(reqs);
      } else if (tab === 'my-mentor' || tab === 'mentor-feedback') {
        const mentorData = await api.mentors.getMyMentor();
        setMyMentor(mentorData.mentor || null);
        
        if (mentorData.mentor) {
          const fbRes = await fetch('/api/mentor/feedback', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('upskill_token')}` }
          }).then(r => r.json()).catch(() => []);
          setFeedbacks(Array.isArray(fbRes) ? fbRes : []);
        }
      }
    } catch (err) {
      console.error('Failed to load mentor data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleSendRequest = async () => {
    if (!selectedMentor) return;
    try {
      await api.mentors.sendRequest(selectedMentor.id, requestMessage);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      alert('Request sent successfully!');
      setSelectedMentor(null);
      setRequestMessage('');
      setTab('my-requests');
    } catch (err) {
      alert(err.message || 'Failed to send request');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 950, margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Mentorship</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Find an expert mentor, track your requests, and get personalized feedback.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', gap: 20 }}>
        {[
          { id: 'find-mentor', label: 'Find a Mentor', icon: UserSearch },
          { id: 'my-requests', label: 'My Requests', icon: Clock },
          { id: 'my-mentor', label: 'My Mentor', icon: UserCheck },
          { id: 'mentor-feedback', label: 'Feedback', icon: GraduationCap }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
              padding: '10px 0',
              color: tab === t.id ? '#fff' : 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'color 0.2s'
            }}
          >
            <t.icon size={16} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>Loading...</div>
      )}

      {/* TAB: FIND MENTOR */}
      {!isLoading && tab === 'find-mentor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
            <div className="input-group" style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-faint)' }} />
              <input
                type="text"
                className="input"
                placeholder="Search mentors by name, expertise, or language..."
                style={{ paddingLeft: 42 }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>

          {mentors.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
              No mentors found matching your criteria.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {mentors.map(mentor => (
                <div key={mentor.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 18, fontWeight: 700
                    }}>
                      {mentor.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{mentor.name}</h3>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{mentor.expertise || 'Software Engineer'}</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 6 }}>
                    <strong>Experience:</strong> {mentor.experience || 'Not specified'}
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 'auto' }}
                    onClick={() => setSelectedMentor(mentor)}
                  >
                    Request Mentorship
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Request Modal */}
          {selectedMentor && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
            }}>
              <div className="card" style={{ width: 450, maxWidth: '90%' }}>
                <h3 style={{ fontSize: 20, marginBottom: 10 }}>Request Mentorship</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Send a request to <strong>{selectedMentor.name}</strong>. Introduce yourself and explain what you want to learn.
                </p>
                <textarea
                  className="input"
                  rows="4"
                  placeholder="Hi, I am looking to learn React and would love your guidance..."
                  value={requestMessage}
                  onChange={e => setRequestMessage(e.target.value)}
                  style={{ marginBottom: 20, resize: 'none' }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setSelectedMentor(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSendRequest} disabled={!requestMessage.trim()}>
                    <Send size={16} /> Send Request
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: MY REQUESTS */}
      {!isLoading && tab === 'my-requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {myRequests.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
              You haven't sent any mentorship requests yet. Go to "Find a Mentor" to get started.
            </div>
          ) : (
            myRequests.map(req => (
              <div key={req.id} className="card" style={{
                borderLeft: req.status === 'PENDING' ? '4px solid var(--primary)' : 
                            req.status === 'ACCEPTED' ? '4px solid var(--accent-emerald)' : 
                            '4px solid var(--text-faint)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Request to: {req.mentor_name}</div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 4,
                    background: req.status === 'PENDING' ? 'rgba(99,102,241,0.15)' : 
                               req.status === 'ACCEPTED' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                    color: req.status === 'PENDING' ? 'var(--primary)' : 
                           req.status === 'ACCEPTED' ? 'var(--accent-emerald)' : 'var(--text-faint)'
                  }}>
                    {req.status}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-main)', background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 6 }}>
                  "{req.message}"
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
                  Sent on: {new Date(req.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: MY MENTOR */}
      {!isLoading && tab === 'my-mentor' && (
        <div>
          {myMentor ? (
            <div className="card" style={{ padding: '32px 28px', border: '1px solid rgba(6,182,212,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 28, fontWeight: 800
                }}>
                  {myMentor.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 800 }}>{myMentor.name}</h2>
                    <ShieldCheck size={24} color="var(--accent-cyan)" />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--accent-emerald)', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 12 }}>
                    Active Mentor Connection
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div style={{ padding: '16px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>Expertise</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{myMentor.expertise || 'General Programming'}</div>
                </div>
                <div style={{ padding: '16px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 4 }}>Contact</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{myMentor.email}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>
              You don't have an active mentor yet. Search for mentors and send requests from the "Find a Mentor" tab!
            </div>
          )}
        </div>
      )}

      {/* TAB: MENTOR FEEDBACK */}
      {!isLoading && tab === 'mentor-feedback' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!myMentor ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
              You need to connect with a mentor first to receive feedback.
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
              No feedback entries yet from {myMentor.name}.
            </div>
          ) : (
            feedbacks.map((fb) => (
              <div key={fb.id} className="card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    Task: {fb.task_name}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                    {new Date(fb.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-main)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 8 }}>
                  "{fb.feedback_text}"
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
