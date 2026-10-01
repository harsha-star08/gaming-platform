import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api, getToken, getStoredUser, setToken, setStoredUser } from './api';

// Auth
import AuthView from './views/AuthView';

// Components
import StudentSidebar from './components/StudentSidebar';
import MentorSidebar from './components/MentorSidebar';
import Navbar from './components/Navbar';
import AiChatDrawer from './components/AiChatDrawer';
import ScratchCardModal from './components/ScratchCardModal';

// Student Views
import DashboardView from './views/student/DashboardView';
import CoursesView from './views/student/CoursesView';
import TopicLearnView from './views/student/TopicLearnView';
import CodingArenaView from './views/student/CodingArenaView';
import RewardsView from './views/student/RewardsView';
import StreakView from './views/student/StreakView';
import TeamsView from './views/student/TeamsView';
import AssignmentsView from './views/student/AssignmentsView';
import AiPerformanceView from './views/student/AiPerformanceView';
import ProfileView from './views/student/ProfileView';
import MentorView from './views/student/MentorView';

// Mentor Views
import MentorDashboardView from './views/mentor/MentorDashboardView';
import SearchStudentsView from './views/mentor/SearchStudentsView';
import MyStudentsView from './views/mentor/MyStudentsView';
import StudentAnalyticsView from './views/mentor/StudentAnalyticsView';
import CreateQuizView from './views/mentor/CreateQuizView';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Routing state
  const [currentView, setCurrentView] = useState('dashboard');
  const [routeParam, setRouteParam] = useState(null);

  // Student state
  const [dashboardData, setDashboardData] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // AI Chat Drawer
  const [aiChatOpen, setAiChatOpen] = useState(false);

  // Scratch card modal
  const [scratchCard, setScratchCard] = useState(null);

  // Poll interval ref
  const notifPollRef = useRef(null);

  // ─── Auth Init ──────────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();
    if (token && storedUser) {
      setUser(storedUser);
      api.auth.me()
        .then(data => {
          setUser(data.user);
          setStoredUser(data.user);
          setAuthLoading(false);
        })
        .catch(() => {
          handleLogout();
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }
  }, []);

  // ─── Student: Load Dashboard ─────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    if (!user || user.role !== 'STUDENT') return;
    try {
      const data = await api.student.getDashboard();
      setDashboardData(data);
      setStudentStats(data.stats);
    } catch (err) {
      console.error('Dashboard load error:', err.message);
    }
  }, [user]);

  // ─── Load Notifications ───────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.notifications.getAll();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (_) {}
  }, [user]);

  // ─── Load Pending Mentor Requests (student) ────────────────────────────
  const loadPendingRequests = useCallback(async () => {
    if (!user || user.role !== 'STUDENT') return;
    try {
      const data = await api.mentorRequests.getRequests();
      const pending = (Array.isArray(data) ? data : (data.requests || [])).filter(r => r.status === 'PENDING');
      setPendingRequestsCount(pending.length);
    } catch (_) {}
  }, [user]);

  // ─── Effects after login ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    if (user.role === 'STUDENT') {
      loadDashboard();
      loadPendingRequests();
    }
    loadNotifications();

    notifPollRef.current = setInterval(() => {
      loadNotifications();
      if (user.role === 'STUDENT') loadPendingRequests();
    }, 30000);

    return () => clearInterval(notifPollRef.current);
  }, [user, loadDashboard, loadNotifications, loadPendingRequests]);

  // ─── Navigation helper ────────────────────────────────────────────────
  const handleNavigate = useCallback((view, param = null) => {
    setCurrentView(view);
    setRouteParam(param);
    if (view === 'dashboard' && user?.role === 'STUDENT') {
      loadDashboard();
    }
  }, [user, loadDashboard]);

  // ─── Auth handlers ────────────────────────────────────────────────────
  const handleAuthSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setCurrentView(loggedInUser.role === 'MENTOR' ? 'mentor-dashboard' : 'dashboard');
  };

  const handleLogout = () => {
    setToken(null);
    setStoredUser(null);
    setUser(null);
    setDashboardData(null);
    setStudentStats(null);
    setNotifications([]);
    setUnreadCount(0);
    setCurrentView('dashboard');
    setRouteParam(null);
    setScratchCard(null);
    clearInterval(notifPollRef.current);
  };

  // ─── Notifications handlers ───────────────────────────────────────────
  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      try {
        await api.notifications.markRead(n.id);
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: 1 } : x));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (_) {}
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(x => ({ ...x, is_read: 1 })));
      setUnreadCount(0);
    } catch (_) {}
  };

  // ─── Refresh student stats ─────────────────────────────────────────────
  const refreshStats = useCallback(() => {
    if (user?.role === 'STUDENT') loadDashboard();
  }, [user, loadDashboard]);

  // ─────────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{
          width: 52, height: 52,
          borderRadius: 16,
          background: 'var(--grad-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26
        }}>⚡</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading UpSkill Platform...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  // ─────────────────────────────────────────────────────────────────────
  // STUDENT APP SHELL
  // ─────────────────────────────────────────────────────────────────────
  if (user.role === 'STUDENT') {
    return (
      <div className="app-container">
        <StudentSidebar
          currentView={currentView}
          setCurrentView={(v) => handleNavigate(v)}
          onLogout={handleLogout}
          user={user}
          pendingRequestsCount={pendingRequestsCount}
        />

        <div className="main-wrapper">
          <Navbar
            user={user}
            studentStats={studentStats}
            notifications={notifications}
            unreadCount={unreadCount}
            onOpenAiChat={() => setAiChatOpen(true)}
            onNotificationClick={handleNotificationClick}
            onMarkAllNotificationsRead={handleMarkAllRead}
          />

          <main className="page-content">
            <StudentRouter
              currentView={currentView}
              routeParam={routeParam}
              user={user}
              dashboardData={dashboardData}
              onNavigate={handleNavigate}
              onRefreshStats={refreshStats}
              setScratchCard={setScratchCard}
            />
          </main>
        </div>

        {/* AI Chat Drawer */}
        <AiChatDrawer
          isOpen={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
        />

        {/* Scratch Card Modal */}
        {scratchCard && (
          <ScratchCardModal
            card={scratchCard}
            onClose={() => {
              setScratchCard(null);
              refreshStats();
            }}
          />
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // MENTOR APP SHELL
  // ─────────────────────────────────────────────────────────────────────
  if (user.role === 'MENTOR') {
    return (
      <div className="app-container">
        <MentorSidebar
          currentView={currentView}
          setCurrentView={(v) => handleNavigate(v)}
          onLogout={handleLogout}
          user={user}
        />

        <div className="main-wrapper">
          <Navbar
            user={user}
            notifications={notifications}
            unreadCount={unreadCount}
            onNotificationClick={handleNotificationClick}
            onMarkAllNotificationsRead={handleMarkAllRead}
          />

          <main className="page-content">
            <MentorRouter
              currentView={currentView}
              routeParam={routeParam}
              user={user}
              onNavigate={handleNavigate}
            />
          </main>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Student Router ────────────────────────────────────────────────────────────
function StudentRouter({ currentView, routeParam, user, dashboardData, onNavigate, onRefreshStats, setScratchCard }) {

  // Navigate helper that lets views trigger navigation
  const goTo = (view, param = null) => onNavigate(view, param);

  switch (currentView) {
    case 'dashboard':
      return (
        <DashboardView
          dashboardData={dashboardData}
          onNavigate={goTo}
        />
      );

    case 'courses':
    case 'my-courses':
    case 'learning-progress':
      return (
        <CoursesView
          initialCourseSlug="python"
          onSelectTopic={(topicId) => goTo('topic-detail', topicId)}
        />
      );

    case 'course-topics':
      return (
        <CoursesView
          initialCourseSlug={routeParam || 'python'}
          onSelectTopic={(topicId) => goTo('topic-detail', topicId)}
        />
      );

    case 'topic-detail':
      return (
        <TopicLearnView
          topicId={routeParam}
          onBack={() => goTo('courses')}
          onOpenProblem={(slug) => goTo('coding-arena', slug)}
          onRefreshStats={onRefreshStats}
        />
      );

    case 'coding-arena':
      return (
        <CodingArenaView
          problemSlug={routeParam}
          onBack={() => goTo('courses')}
          onRefreshStats={onRefreshStats}
        />
      );

    case 'daily-challenge':
      return (
        <CodingArenaView
          problemSlug={dashboardData?.dailyChallenge?.problem_slug || null}
          onBack={() => goTo('dashboard')}
          onRefreshStats={onRefreshStats}
        />
      );

    case 'weekly-challenge':
      return (
        <CodingArenaView
          problemSlug={dashboardData?.weeklyChallenge?.problem_slug || null}
          onBack={() => goTo('dashboard')}
          onRefreshStats={onRefreshStats}
        />
      );

    case 'rewards-shop':
    case 'power-ups':
    case 'coins-history':
    case 'badges':
      return (
        <RewardsView
          onRefreshStats={onRefreshStats}
        />
      );

    case 'streak':
      return (
        <StreakView
          onRefreshStats={onRefreshStats}
        />
      );

    case 'teams':
      return (
        <TeamsView
          onRefreshStats={onRefreshStats}
        />
      );

    case 'assignments':
    case 'assignment-detail':
      return (
        <AssignmentsView
          onRefreshStats={onRefreshStats}
        />
      );

    case 'ai-performance':
      return (
        <AiPerformanceView
          onNavigateToTopic={(topicId) => goTo('topic-detail', topicId)}
        />
      );

    case 'profile':
      return <ProfileView />;

    case 'my-mentor':
    case 'mentor-feedback':
    case 'mentor-requests': {
      const tabMap = {
        'mentor-requests': 'requests',
        'my-mentor': 'my-mentor',
        'mentor-feedback': 'feedback'
      };
      return (
        <MentorView
          initialTab={tabMap[currentView] || 'requests'}
          onRefreshStats={onRefreshStats}
        />
      );
    }

    default:
      return (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
          <h2 style={{ marginBottom: 8 }}>Coming Soon</h2>
          <p style={{ fontSize: 14 }}>This section is not yet available in the current version.</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => goTo('dashboard')}>
            Back to Dashboard
          </button>
        </div>
      );
  }
}

// ─── Mentor Router ─────────────────────────────────────────────────────────────
function MentorRouter({ currentView, routeParam, user, onNavigate }) {
  const goTo = (view, param = null) => onNavigate(view, param);

  switch (currentView) {
    case 'mentor-dashboard':
      return (
        <MentorDashboardView
          onNavigate={goTo}
        />
      );

    case 'search-students':
      return <SearchStudentsView />;

    case 'my-students':
      return (
        <MyStudentsView
          onSelectStudent={(studentId) => goTo('student-analytics', studentId)}
          onNavigateToSearch={() => goTo('search-students')}
        />
      );

    case 'student-analytics':
      return (
        <StudentAnalyticsView
          studentId={routeParam}
          onBack={() => goTo('my-students')}
        />
      );

    case 'create-quiz':
    case 'create-challenge':
    case 'create-assignment':
      return (
        <CreateQuizView
          onQuizCreated={() => goTo('mentor-dashboard')}
        />
      );

    case 'mentor-profile':
      return (
        <ProfileView />
      );

    default:
      return (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
          <h2 style={{ marginBottom: 8 }}>Mentor Section</h2>
          <p style={{ fontSize: 14 }}>Navigate using the sidebar.</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => goTo('mentor-dashboard')}>
            Back to Dashboard
          </button>
        </div>
      );
  }
}
