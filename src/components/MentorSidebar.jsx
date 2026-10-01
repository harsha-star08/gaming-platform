import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileCheck,
  PlusCircle,
  Code2,
  ListTodo,
  TrendingUp,
  MessageSquare,
  Sparkles,
  User,
  LogOut,
  ShieldCheck,
  Search
} from 'lucide-react';

export default function MentorSidebar({ currentView, setCurrentView, onLogout, user }) {
  const navSections = [
    {
      title: null,
      items: [
        { id: 'mentor-dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Students & Mentorship',
      items: [
        { id: 'my-students', label: 'My Students', icon: Users },
        { id: 'search-students', label: 'Search Students', icon: Search },
        { id: 'mentor-sent-requests', label: 'Mentor Requests', icon: UserPlus },
        { id: 'student-analytics', label: 'Student Analytics', icon: TrendingUp },
        { id: 'mentor-feedback', label: 'Student Feedback', icon: MessageSquare }
      ]
    },
    {
      title: 'Assignments & Tests',
      items: [
        { id: 'create-quiz', label: 'Create Quiz', icon: PlusCircle },
        { id: 'create-challenge', label: 'Create Coding Challenge', icon: Code2 },
        { id: 'mentor-assignments', label: 'My Assignments', icon: ListTodo }
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { id: 'mentor-ai-insights', label: 'AI Insights', icon: Sparkles }
      ]
    },
    {
      title: null,
      items: [
        { id: 'mentor-profile', label: 'Mentor Profile', icon: User }
      ]
    }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}>
          <ShieldCheck size={22} />
        </div>
        <div>
          <span className="brand-title">UpSkill</span>
          <div style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: 0.5 }}>
            MENTOR PORTAL
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
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Authenticated Mentor Banner */}
      <div className="sidebar-user">
        <div className="user-info-brief">
          <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div className="user-meta-brief">
            <span className="user-name-brief">{user?.name}</span>
            <span className="user-role-badge" style={{ color: 'var(--accent-emerald)' }}>MENTOR</span>
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
