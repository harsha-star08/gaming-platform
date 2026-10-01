import React, { useState } from 'react';
import { ShieldCheck, GraduationCap, ArrowRight, Lock, Mail, User, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { api, setToken, setStoredUser } from '../api';

export default function AuthView({ onAuthSuccess }) {
  const [role, setRole] = useState('STUDENT'); // 'STUDENT' or 'MENTOR'
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        if (!email.trim() || !password) {
          throw new Error('Please enter both your email address and password.');
        }
        const data = await api.auth.login({ email, password, role });
        setToken(data.token);
        setStoredUser(data.user);
        onAuthSuccess(data.user);
      } else {
        if (!name.trim() || !email.trim() || !password || !confirmPassword) {
          throw new Error('All registration fields are required.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please verify.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const data = await api.auth.register({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          role
        });
        setToken(data.token);
        setStoredUser(data.user);
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative'
    }}>
      {/* Decorative Glow Blobs */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '25%',
        width: 380,
        height: 380,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }}></div>

      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '25%',
        width: 420,
        height: 420,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }}></div>

      <div className="card" style={{ maxWidth: 460, width: '100%', padding: '36px 32px', zIndex: 10 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: 'var(--grad-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)',
            marginBottom: 14
          }}>
            <Sparkles size={28} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>UpSkill Platform</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Real-world gamified mastery, coding execution, and mentor supervision
          </p>
        </div>

        {/* Role Selector Tabs (Section 1) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
          background: 'rgba(0, 0, 0, 0.35)',
          padding: 4,
          borderRadius: 'var(--radius-sm)',
          marginBottom: 24
        }}>
          <button
            type="button"
            className={`btn ${role === 'STUDENT' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 13, padding: '8px 12px' }}
            onClick={() => setRole('STUDENT')}
          >
            <GraduationCap size={16} />
            <span>Student</span>
          </button>
          <button
            type="button"
            className={`btn ${role === 'MENTOR' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 13, padding: '8px 12px' }}
            onClick={() => setRole('MENTOR')}
          >
            <ShieldCheck size={16} />
            <span>Mentor</span>
          </button>
        </div>

        {/* Login / Sign Up Toggle */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: isLogin ? '2px solid var(--primary)' : '2px solid transparent',
              color: isLogin ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: !isLogin ? '2px solid var(--primary)' : '2px solid transparent',
              color: !isLogin ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fda4af',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={role === 'STUDENT' ? "e.g. Jenifer Patel" : "e.g. Dr. Alan Turing"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: 38 }}
                />
                <User size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-faint)' }} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 38 }}
              />
              <Mail size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-faint)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: 38 }}
              />
              <Lock size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-faint)' }} />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: 38 }}
                />
                <Lock size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-faint)' }} />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={isLoading}
          >
            <span>{isLoading ? 'Processing...' : (isLogin ? `Log In as ${role}` : `Sign Up as ${role}`)}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>
          {role === 'STUDENT' ? (
            <span>🚀 New students start with clean zero XP & Level 1. Progress is earned through real challenges.</span>
          ) : (
            <span>🛡️ Mentors can guide students, inspect accepted analytics, and create assignments.</span>
          )}
        </div>
      </div>
    </div>
  );
}
