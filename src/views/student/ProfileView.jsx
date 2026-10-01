import React, { useState, useEffect } from 'react';
import {
  User,
  Award,
  Shield,
  Flame,
  Zap,
  Coins,
  BookOpen,
  Users,
  UserCheck,
  CheckCircle,
  Lock
} from 'lucide-react';
import { api } from '../../api';

export default function ProfileView() {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await api.student.getProfile();
      setProfileData(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !profileData) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>Loading student profile...</div>;
  }

  const { user, profile, badges, enrolledCourses, team, mentor } = profileData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 950, margin: '0 auto' }}>
      {/* Profile Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(22, 29, 44, 0.8) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        padding: '32px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap'
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 32, fontWeight: 800, boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
        }}>
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
            Verified Student Profile
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginTop: 2 }}>{user.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{user.email}</p>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13, color: 'var(--text-faint)' }}>
            <span>Squad: <strong style={{ color: '#fff' }}>{team ? team.name : 'None'}</strong></span>
            <span>•</span>
            <span>Mentor: <strong style={{ color: '#fff' }}>{mentor ? mentor.name : 'Not Connected'}</strong></span>
          </div>
        </div>
      </div>

      {/* Core Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Current Level</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>Level {profile?.level || 1}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Total XP</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)' }}>{profile?.xp || 0} XP</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Skill Coins</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#eab308' }}>{profile?.skill_coins || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Active Streak</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#f59e0b' }}>{profile?.current_streak || 0} Days</div>
        </div>
      </div>

      {/* Badges Gallery (Section 21) */}
      <div className="card">
        <h2 style={{ fontSize: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={20} color="var(--accent-violet)" />
          <span>Earned Badges & Achievements</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {badges.map((b) => (
            <div key={b.id} style={{
              padding: '16px', borderRadius: 8,
              background: b.isEarned ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.02)',
              border: b.isEarned ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
              opacity: b.isEarned ? 1 : 0.45,
              display: 'flex', alignItems: 'center', gap: 12
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: b.isEarned ? 'var(--grad-primary)' : 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}>
                {b.isEarned ? <Award size={20} /> : <Lock size={16} />}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{b.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{b.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
