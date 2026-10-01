import React, { useState, useEffect } from 'react';
import {
  BookOpen, Lock, CheckCircle, Play, ChevronRight, 
  Terminal, Code2, Globe, Brain, Cpu, Coffee,
  Trophy, Star, ArrowRight, Clock, Zap, Target
} from 'lucide-react';
import { api } from '../../api';

const COURSE_COLORS = {
  python: { primary: '#6366f1', glow: 'rgba(99,102,241,0.2)', bg: 'rgba(99,102,241,0.08)' },
  c: { primary: '#06b6d4', glow: 'rgba(6,182,212,0.2)', bg: 'rgba(6,182,212,0.08)' },
  cpp: { primary: '#10b981', glow: 'rgba(16,185,129,0.2)', bg: 'rgba(16,185,129,0.08)' },
  java: { primary: '#f59e0b', glow: 'rgba(245,158,11,0.2)', bg: 'rgba(245,158,11,0.08)' },
  'web-dev': { primary: '#3b82f6', glow: 'rgba(59,130,246,0.2)', bg: 'rgba(59,130,246,0.08)' },
  'machine-learning': { primary: '#a855f7', glow: 'rgba(168,85,247,0.2)', bg: 'rgba(168,85,247,0.08)' },
};

function getCourseIcon(iconName, color, size = 24) {
  const props = { size, color };
  switch (iconName) {
    case 'code': return <Terminal {...props} />;
    case 'cpu': return <Cpu {...props} />;
    case 'terminal': return <Code2 {...props} />;
    case 'coffee': return <Coffee {...props} />;
    case 'globe': return <Globe {...props} />;
    case 'brain': return <Brain {...props} />;
    default: return <BookOpen {...props} />;
  }
}

export default function CoursesView({ onSelectTopic, initialCourseSlug = 'python', viewMode = 'courses' }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState(initialCourseSlug);
  const [topicsData, setTopicsData] = useState(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [activeTab, setActiveTab] = useState(viewMode === 'learning-progress' ? 'progress' : viewMode === 'badges' ? 'badges' : 'courses');
  const [allBadges, setAllBadges] = useState([]);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseSlug) loadTopics(selectedCourseSlug);
  }, [selectedCourseSlug]);

  useEffect(() => {
    if (activeTab === 'badges') loadBadges();
  }, [activeTab]);

  const loadCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const data = await api.student.getCourses();
      setCourses(data);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const loadTopics = async (slug) => {
    setIsLoadingTopics(true);
    try {
      const data = await api.student.getTopics(slug);
      setTopicsData(data);
    } catch (err) {
      console.error('Failed to load topics:', err);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const loadBadges = async () => {
    try {
      const profile = await api.student.getProfile();
      setAllBadges(profile.badges || []);
    } catch (err) {
      console.error('Failed to load badges:', err);
    }
  };

  const selectedCourse = courses.find(c => c.slug === selectedCourseSlug);
  const colors = COURSE_COLORS[selectedCourseSlug] || COURSE_COLORS.python;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Learn</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          All courses, your progress, and earned badges — in one place.
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)' }}>
        {[
          { id: 'courses', label: 'Courses' },
          { id: 'progress', label: 'Learning Progress' },
          { id: 'badges', label: 'Badges' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              padding: '10px 20px',
              color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: COURSES ─────────────────────────────────────────────── */}
      {activeTab === 'courses' && (
        <>
          {/* Course Cards Grid */}
          {isLoadingCourses ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>Loading courses...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {courses.map((course) => {
                const isSelected = selectedCourseSlug === course.slug;
                const clr = COURSE_COLORS[course.slug] || COURSE_COLORS.python;
                const completedModules = course.completed_levels || 0;
                const totalModules = 10;
                const progress = course.progress_percent || 0;

                return (
                  <div
                    key={course.id}
                    className="card"
                    onClick={() => setSelectedCourseSlug(course.slug)}
                    style={{
                      cursor: 'pointer',
                      border: isSelected ? `1px solid ${clr.primary}` : '1px solid var(--border-subtle)',
                      background: isSelected ? clr.bg : undefined,
                      boxShadow: isSelected ? `0 0 20px ${clr.glow}` : undefined,
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: `${clr.primary}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {getCourseIcon(course.icon, clr.primary)}
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                        background: progress === 100 ? 'rgba(16,185,129,0.15)' : progress > 0 ? `${clr.primary}20` : 'rgba(255,255,255,0.05)',
                        color: progress === 100 ? 'var(--accent-emerald)' : progress > 0 ? clr.primary : 'var(--text-faint)'
                      }}>
                        {progress === 100 ? '✓ COMPLETE' : progress > 0 ? `${Math.round(progress)}%` : 'NOT STARTED'}
                      </span>
                    </div>

                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#fff' }}>{course.title}</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{course.description}</p>
                    </div>

                    <div>
                      <div className="progress-track" style={{ marginBottom: 8 }}>
                        <div className="progress-fill" style={{ width: `${progress}%`, background: clr.primary }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-faint)' }}>
                        <span>{completedModules} / {totalModules} modules</span>
                        <span style={{ color: isSelected ? clr.primary : 'var(--text-muted)', fontWeight: 600 }}>
                          {isSelected ? 'Viewing ↓' : 'View Modules →'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Course — Module Map */}
          {selectedCourse && (
            <div className="card" style={{
              padding: '28px 24px',
              border: `1px solid ${colors.primary}40`,
              background: colors.bg
            }}>
              {/* Course Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: `${colors.primary}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {getCourseIcon(selectedCourse.icon, colors.primary, 28)}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: colors.primary, textTransform: 'uppercase' }}>
                      Course Modules
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{selectedCourse.title}</h2>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: colors.primary }}>
                    {Math.round(selectedCourse.progress_percent || 0)}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                    {selectedCourse.completed_levels || 0} / 10 modules complete
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-track" style={{ height: 8, marginBottom: 24 }}>
                <div className="progress-fill" style={{
                  width: `${selectedCourse.progress_percent || 0}%`,
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.primary}cc)`
                }} />
              </div>

              {/* Module List */}
              {isLoadingTopics ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
                  Loading modules...
                </div>
              ) : topicsData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {topicsData.topics.map((topic, idx) => {
                    const isCompleted = topic.is_completed === 1;
                    const isUnlocked = topic.isUnlocked;
                    const isCurrent = isUnlocked && !isCompleted;

                    return (
                      <div
                        key={topic.id}
                        onClick={() => isUnlocked && onSelectTopic(topic.id)}
                        style={{
                          padding: '16px 20px',
                          borderRadius: 10,
                          background: isCompleted
                            ? 'rgba(16,185,129,0.08)'
                            : isCurrent
                            ? `${colors.primary}10`
                            : 'rgba(255,255,255,0.02)',
                          border: isCompleted
                            ? '1px solid rgba(16,185,129,0.25)'
                            : isCurrent
                            ? `1px solid ${colors.primary}40`
                            : '1px solid rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          cursor: isUnlocked ? 'pointer' : 'default',
                          opacity: isUnlocked ? 1 : 0.45,
                          transition: 'all 0.15s'
                        }}
                      >
                        {/* Module Number Icon */}
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                          background: isCompleted
                            ? 'var(--accent-emerald)'
                            : isCurrent
                            ? colors.primary
                            : 'rgba(255,255,255,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 13, fontWeight: 800
                        }}>
                          {isCompleted
                            ? <CheckCircle size={20} />
                            : isUnlocked
                            ? topic.level_number
                            : <Lock size={16} />}
                        </div>

                        {/* Module Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
                              color: isCompleted ? 'var(--accent-emerald)' : isCurrent ? colors.primary : 'var(--text-faint)',
                              textTransform: 'uppercase'
                            }}>
                              Module {topic.level_number}
                            </span>
                            {isCompleted && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '1px 6px',
                                borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: 'var(--accent-emerald)'
                              }}>DONE</span>
                            )}
                            {isCurrent && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '1px 6px',
                                borderRadius: 4, background: `${colors.primary}25`, color: colors.primary
                              }}>CURRENT</span>
                            )}
                          </div>
                          <div style={{
                            fontSize: 14, fontWeight: 700,
                            color: isUnlocked ? '#fff' : 'var(--text-faint)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {topic.title}
                          </div>
                          {!isUnlocked && (
                            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
                              Complete Module {topic.level_number - 1} to unlock
                            </div>
                          )}
                          {isCompleted && topic.completed_at && (
                            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
                              Completed {new Date(topic.completed_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Action */}
                        <div style={{ flexShrink: 0 }}>
                          {isCompleted ? (
                            <span style={{ fontSize: 18 }}>🏅</span>
                          ) : isCurrent ? (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '6px 14px', fontSize: 12 }}
                              onClick={(e) => { e.stopPropagation(); onSelectTopic(topic.id); }}
                            >
                              {idx === 0 ? 'Start' : 'Continue'} <ArrowRight size={12} />
                            </button>
                          ) : !isUnlocked ? (
                            <Lock size={16} color="var(--text-faint)" />
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      {/* ─── TAB: LEARNING PROGRESS ───────────────────────────────────── */}
      {activeTab === 'progress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Learning Progress</h2>
          {isLoadingCourses ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>Loading...</div>
          ) : courses.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
              No course progress yet. Start learning!
            </div>
          ) : (
            courses.map(course => {
              const clr = COURSE_COLORS[course.slug] || COURSE_COLORS.python;
              const progress = course.progress_percent || 0;
              const completed = course.completed_levels || 0;
              return (
                <div key={course.id} className="card" style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: `${clr.primary}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {getCourseIcon(course.icon, clr.primary, 20)}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{course.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                          {completed} / 10 modules completed
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: clr.primary }}>{Math.round(progress)}%</div>
                    </div>
                  </div>
                  <div className="progress-track" style={{ height: 6 }}>
                    <div className="progress-fill" style={{ width: `${progress}%`, background: clr.primary }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} style={{
                        flex: 1, height: 6, borderRadius: 3,
                        background: i < completed ? clr.primary : 'rgba(255,255,255,0.06)'
                      }} />
                    ))}
                  </div>
                  {progress > 0 && (
                    <button
                      className="btn btn-secondary"
                      style={{ marginTop: 14, fontSize: 12, padding: '6px 14px' }}
                      onClick={() => { setSelectedCourseSlug(course.slug); setActiveTab('courses'); }}
                    >
                      Continue Learning <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── TAB: BADGES ──────────────────────────────────────────────── */}
      {activeTab === 'badges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Badges</h2>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {allBadges.filter(b => b.isEarned).length} / {allBadges.length} earned
            </span>
          </div>

          {allBadges.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
              Loading badges...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {allBadges.map(badge => (
                <div
                  key={badge.id}
                  className="card"
                  style={{
                    padding: '20px 16px',
                    textAlign: 'center',
                    opacity: badge.isEarned ? 1 : 0.4,
                    border: badge.isEarned ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border-subtle)',
                    background: badge.isEarned ? 'rgba(99,102,241,0.06)' : undefined
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 10 }}>
                    {badge.isEarned ? '🏅' : '🔒'}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: badge.isEarned ? '#fff' : 'var(--text-faint)', marginBottom: 4 }}>
                    {badge.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.4 }}>
                    {badge.description}
                  </div>
                  {badge.isEarned && badge.earned_at && (
                    <div style={{ fontSize: 10, color: 'var(--accent-emerald)', marginTop: 8, fontWeight: 600 }}>
                      ✓ Earned {new Date(badge.earned_at).toLocaleDateString()}
                    </div>
                  )}
                  <div style={{
                    marginTop: 8, fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                    color: 'var(--text-faint)', textTransform: 'uppercase'
                  }}>
                    {badge.category}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
