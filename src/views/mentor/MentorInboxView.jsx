import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Inbox, CheckCircle, XCircle, Clock } from 'lucide-react';
import { api } from '../../api';

export default function MentorInboxView() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await api.mentorInbox.getRequests();
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to load mentor inbox:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await api.mentorInbox.accept(requestId);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      loadRequests();
    } catch (err) {
      alert(err.message || 'Failed to accept request');
    }
  };

  const handleDecline = async (requestId) => {
    if (!window.confirm('Are you sure you want to decline this mentorship request?')) return;
    try {
      await api.mentorInbox.decline(requestId);
      loadRequests();
    } catch (err) {
      alert(err.message || 'Failed to decline request');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const pastRequests = requests.filter(r => r.status !== 'PENDING');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900, margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Mentor Inbox</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Review mentorship requests from students who want to learn from you.
        </p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>Loading requests...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Pending Requests Section */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Inbox size={20} color="var(--primary)" />
              New Requests ({pendingRequests.length})
            </h2>
            
            {pendingRequests.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
                No new mentorship requests right now.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {pendingRequests.map(req => (
                  <div key={req.id} className="card" style={{ borderLeft: '4px solid var(--primary)', padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 18, fontWeight: 700
                        }}>
                          {req.student_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{req.student_name}</h3>
                          <div style={{ fontSize: 12, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={12} /> {new Date(req.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 12,
                        background: 'rgba(99,102,241,0.15)', color: 'var(--primary)'
                      }}>
                        PENDING
                      </span>
                    </div>

                    <div style={{
                      background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 8,
                      fontSize: 14, color: 'var(--text-main)', lineHeight: 1.6, marginBottom: 20
                    }}>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Message from student:</div>
                      "{req.message}"
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" onClick={() => handleDecline(req.id)}>
                        <XCircle size={16} /> Decline
                      </button>
                      <button className="btn btn-primary" onClick={() => handleAccept(req.id)}>
                        <CheckCircle size={16} /> Accept Student
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Past Requests Section */}
          {pastRequests.length > 0 && (
            <section>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)' }}>
                Past Requests
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pastRequests.map(req => (
                  <div key={req.id} className="card" style={{
                    padding: 16,
                    borderLeft: req.status === 'ACCEPTED' ? '4px solid var(--accent-emerald)' : '4px solid var(--text-faint)',
                    opacity: 0.8
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{req.student_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{new Date(req.created_at).toLocaleDateString()}</div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 12,
                        background: req.status === 'ACCEPTED' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                        color: req.status === 'ACCEPTED' ? 'var(--accent-emerald)' : 'var(--text-faint)'
                      }}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
