import React, { useState } from 'react';
import { Flame, Coins, Zap, Shield, Bell, Bot, Check, ExternalLink } from 'lucide-react';

export default function Navbar({
  user,
  studentStats,
  notifications = [],
  unreadCount = 0,
  onOpenAiChat,
  onNotificationClick,
  onMarkAllNotificationsRead
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="topbar">
      <div>
        <h3 style={{ fontSize: 16, color: 'var(--text-muted)' }}>
          {user?.role === 'STUDENT' ? 'Student Workspace' : 'Mentor Command Center'}
        </h3>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Student Gamification Stats Pill Bar */}
        {user?.role === 'STUDENT' && studentStats && (
          <div className="topbar-stats">
            {/* Streak */}
            <div
              className={`stat-pill flame ${studentStats.streakBroken ? 'broken' : ''}`}
              title={`Current Streak: ${studentStats.currentStreak} days | Longest: ${studentStats.longestStreak} days`}
              style={studentStats.streakBroken ? { opacity: 0.6, borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)' } : {}}
            >
              <Flame size={16} />
              <span>{studentStats.currentStreak}d</span>
            </div>

            {/* Skill Coins */}
            <div className="stat-pill coin" title="Skill Coins">
              <Coins size={16} />
              <span>{studentStats.skillCoins}</span>
            </div>

            {/* XP */}
            <div className="stat-pill xp" title={`Total XP: ${studentStats.xp} | Next Level at ${studentStats.xpNextLevel} XP`}>
              <Zap size={16} />
              <span>{studentStats.xp} XP</span>
            </div>

            {/* Level */}
            <div className="stat-pill level" title={`Current Level: Level ${studentStats.level}`}>
              <Shield size={16} />
              <span>Lvl {studentStats.level}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="topbar-actions">
          {/* AI Learning Assistant Trigger */}
          {user?.role === 'STUDENT' && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onOpenAiChat}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'rgba(99, 102, 241, 0.4)' }}
            >
              <Bot size={16} color="var(--primary)" />
              <span>AI Assistant</span>
            </button>
          )}

          {/* Notifications Bell */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn-icon"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="badge-dot"></span>}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div style={{
                position: 'absolute',
                top: 48,
                right: 0,
                width: 360,
                background: '#131927',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '16px 0',
                zIndex: 60
              }}>
                <div style={{
                  padding: '0 18px 12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (onNotificationClick) onNotificationClick(n);
                          setShowNotifications(false);
                        }}
                        style={{
                          padding: '12px 18px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          cursor: 'pointer',
                          background: n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                          transition: 'var(--transition)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: n.is_read ? 'var(--text-muted)' : '#fff' }}>
                            {n.title}
                          </span>
                          {!n.is_read && (
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)' }}></span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.4 }}>
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
