import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Flame,
  Zap,
  Users,
  Coins,
  ShoppingBag,
  Sparkles,
  UserCheck,
  Bot,
  TrendingUp,
  User,
  LogOut,
  ChevronRight,
  Shield,
  Layers,
  Inbox,
  MessageCircle
} from 'lucide-react';

export default function StudentSidebar({ currentView, setCurrentView, onLogout, user, pendingRequestsCount = 0 }) {
  const navSections = [
    {
      title: null,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Learn',
      items: [
        { id: 'courses', label: 'Course Library', icon: BookOpen },
        { id: 'my-courses', label: 'My Courses', icon: Layers },
        { id: 'learning-progress', label: 'Learning Progress', icon: TrendingUp },
        { id: 'badges', label: 'Badges', icon: Award }
      ]
    },
    {
      title: 'Challenges',
      items: [
        { id: 'daily-challenge', label: 'Daily Challenge', icon: Flame },
        { id: 'weekly-challenge', label: 'Weekly Challenge', icon: Zap },
        { id: 'teams', label: 'Team Challenges', icon: Users }
      ]
    },
    {
      title: 'Rewards',
      items: [
        { id: 'rewards-shop', label: 'Reward Shop', icon: ShoppingBag },
        { id: 'power-ups', label: 'Power-Ups', icon: Sparkles },
        { id: 'coins-history', label: 'Skill Coins & XP', icon: Coins }
      ]
    },
    {
      title: 'Mentor',
      items: [
        { id: 'mentor-requests', label: 'Mentor Requests', icon: Inbox, badge: pendingRequestsCount },
        { id: 'my-mentor', label: 'My Mentor', icon: UserCheck },
        { id: 'mentor-feedback', label: 'Mentor Feedback', icon: MessageCircle }
      ]
    },
    {
      title: 'AI',
      items: [
        { id: 'ai-performance', label: 'AI Performance', icon: TrendingUp },
        { id: 'ai-chat', label: 'AI Learning Assistant', icon: Bot }
      ]
    },
    {
      title: null,
      items: [
        { id: 'profile', label: 'Profile', icon: User }
      ]
    }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Zap size={22} />
        </div>
        <div>
          <span className="brand-title">UpSkill</span>
          <div style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: 0.5 }}>
            STUDENT PORTAL
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="sidebar-nav">
        {navSections.map((sec, idx) => (
          <div key={idx}>
            {sec.title && <div className="nav-section-title">{sec.title}</div>}
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setCurrentView(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Authenticated User Banner */}
      <div className="sidebar-user">
        <div className="user-info-brief">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="user-meta-brief">
            <span className="user-name-brief">{user?.name}</span>
            <span className="user-role-badge">STUDENT</span>
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Logout"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 6 }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
