import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Search, UserCheck, ArrowRight } from 'lucide-react';
import { api } from '../../api';

export default function MyStudentsView({ onSelectStudent, onNavigateToSearch }) {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const data = await api.mentor.getConnectedStudents();
      setStudents(data);
    } catch (err) {
      console.error('Failed to load connected students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>Loading connected students...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1050, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>My Connected Students</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Students who have accepted your mentorship invitation. Inspect their code submissions and accuracy.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onNavigateToSearch}>
          <Search size={15} />
          <span>Find More Students</span>
        </button>
      </div>

      {students.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <UserCheck size={48} color="var(--primary)" style={{ marginBottom: 12 }} />
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>No Connected Students Yet</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 480, margin: '0 auto 20px' }}>
            Head over to the Student Directory to discover learners and send mentorship invitations!
          </p>
          <button className="btn btn-primary" onClick={onNavigateToSearch}>
            Search Student Directory
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {students.map((s) => (
            <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 18, fontWeight: 700
                  }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>

                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4,
                    background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)'
                  }}>
                    ACTIVE MENTEE
                  </span>
                </div>

                <h3 style={{ fontSize: 18, marginBottom: 2 }}>{s.name}</h3>
                <div style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 14 }}>{s.email}</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Level</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Level {s.level}</div>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Progress</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>{s.progress_percent}%</div>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => onSelectStudent(s.id)}
                style={{ width: '100%' }}
              >
                <span>Inspect Analytics & Feedback</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
