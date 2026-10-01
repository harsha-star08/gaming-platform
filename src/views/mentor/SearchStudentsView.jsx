import React, { useState, useEffect } from 'react';
import { Search, UserPlus, CheckCircle, Clock, ShieldAlert, X } from 'lucide-react';
import { api } from '../../api';

export default function SearchStudentsView() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [minLevel, setMinLevel] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Send request modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const data = await api.mentor.searchStudents(searchQuery, minLevel);
      setStudents(data);
    } catch (err) {
      console.error('Failed to search students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSendModal = (student) => {
    setSelectedStudent(student);
    setRequestMessage(`Hello ${student.name}! I would like to mentor you on your Python and algorithms learning journey.`);
    setSuccessMsg(null);
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSending(true);
    try {
      const res = await api.mentor.sendRequest(selectedStudent.id, requestMessage);
      setSuccessMsg(res.message);
      handleSearch();
      setTimeout(() => setSelectedStudent(null), 1500);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1050, margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Student Directory Search</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Search for students by name or learning level. Send mentorship proposals to unlock detailed analytics and personalized coaching.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by student name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{ paddingLeft: 38 }}
          />
          <Search size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-faint)' }} />
        </div>

        <div style={{ width: 140 }}>
          <select
            className="form-select"
            value={minLevel}
            onChange={(e) => setMinLevel(e.target.value)}
          >
            <option value="">All Levels</option>
            <option value="1">Level 1+</option>
            <option value="2">Level 2+</option>
            <option value="3">Level 3+</option>
            <option value="4">Level 4+</option>
            <option value="5">Level 5+</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading}>
          <span>{isLoading ? 'Searching...' : 'Search'}</span>
        </button>
      </div>

      {/* Student Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {students.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
            No registered students match your search criteria.
          </div>
        ) : (
          students.map((s) => {
            const isConnected = s.relationship_status === 'ACTIVE';
            const isPending = s.request_status === 'PENDING';

            return (
              <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 16, fontWeight: 700
                    }}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>

                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4,
                      background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)'
                    }}>
                      Level {s.level}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 18, marginBottom: 4 }}>{s.name}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 10 }}>
                    {s.course_title || 'Python Mastery'} • {s.badges_count} Badges Earned
                  </div>

                  <div style={{
                    fontSize: 11, color: 'var(--text-faint)', background: 'rgba(0, 0, 0, 0.25)',
                    padding: '8px 10px', borderRadius: 6, marginBottom: 16
                  }}>
                    🛡️ Detailed progress & analytics locked until student accepts mentorship.
                  </div>
                </div>

                <div>
                  {isConnected ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-emerald)', fontSize: 13, fontWeight: 700 }}>
                      <CheckCircle size={16} />
                      <span>Connected Mentee</span>
                    </div>
                  ) : isPending ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: 13, fontWeight: 700 }}>
                      <Clock size={16} />
                      <span>Request Pending</span>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenSendModal(s)}
                      style={{ width: '100%' }}
                    >
                      <UserPlus size={14} />
                      <span>Send Mentor Request</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Send Mentor Request Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 20 }}>Send Mentorship Request</h3>
              <button onClick={() => setSelectedStudent(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 18 }}>
              Propose mentorship to <strong>{selectedStudent.name}</strong>. Once they accept, their complete analytics, topic breakdowns, and assignment submissions will become available.
            </p>

            {successMsg ? (
              <div style={{
                padding: '12px 16px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid var(--accent-emerald)', color: 'var(--accent-emerald)', fontSize: 14, fontWeight: 600, textAlign: 'center'
              }}>
                ✓ {successMsg}
              </div>
            ) : (
              <form onSubmit={handleSendRequest}>
                <div className="form-group">
                  <label className="form-label">Invitation Message</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={requestMessage}
                    onChange={e => setRequestMessage(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedStudent(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSending}>
                    <span>{isSending ? 'Sending Request...' : 'Send Request'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
