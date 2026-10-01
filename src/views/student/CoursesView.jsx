import React, { useState, useEffect } from 'react';
import { BookOpen, Lock, CheckCircle, Play, ChevronRight, Sparkles, Terminal, Code2, Globe, Brain, Cpu, Coffee } from 'lucide-react';
import { api } from '../../api';

export default function CoursesView({ onSelectTopic, initialCourseSlug = 'python' }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState(initialCourseSlug);
  const [topicsData, setTopicsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseSlug) {
      loadTopics(selectedCourseSlug);
    }
  }, [selectedCourseSlug]);

  const loadCourses = async () => {
    try {
      const data = await api.student.getCourses();
      setCourses(data);
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  const loadTopics = async (slug) => {
    setIsLoading(true);
    try {
      const data = await api.student.getTopics(slug);
      setTopicsData(data);
    } catch (err) {
      console.error('Failed to load topics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getCourseIcon = (iconName) => {
    switch (iconName) {
      case 'code': return <Terminal size={24} color="#6366f1" />;
      case 'cpu': return <Cpu size={24} color="#06b6d4" />;
      case 'terminal': return <Code2 size={24} color="#10b981" />;
      case 'coffee': return <Coffee size={24} color="#f59e0b" />;
      case 'globe': return <Globe size={24} color="#3b82f6" />;
      case 'brain': return <Brain size={24} color="#a855f7" />;
      default: return <BookOpen size={24} color="#6366f1" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Curriculum & Course Library</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Structured 16-level Python Mastery curriculum with progressive unlocks and real algorithmic assessments.
        </p>
      </div>

      {/* Courses Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {courses.map((course) => {
          const isSelected = selectedCourseSlug === course.slug;
          return (
            <div
              key={course.id}
              className={`card ${isSelected ? 'card-glowing' : ''}`}
              onClick={() => {
                if (!course.is_locked) {
                  setSelectedCourseSlug(course.slug);
                }
              }}
              style={{
                cursor: course.is_locked ? 'not-allowed' : 'pointer',
                opacity: course.is_locked ? 0.65 : 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {getCourseIcon(course.icon)}
                  </div>
                  {course.is_locked ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-faint)', fontWeight: 700 }}>
                      <Lock size={13} /> LOCKED
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      {course.progress_percent}% COMPLETE
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: 18, marginBottom: 6 }}>{course.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
                  {course.description}
                </p>
              </div>

              <div>
                <div className="progress-track" style={{ marginBottom: 10 }}>
                  <div className="progress-fill" style={{ width: `${course.progress_percent}%` }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-faint)' }}>
                  <span>{course.total_levels} Progressive Levels</span>
                  {!course.is_locked && (
                    <span style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                      {isSelected ? 'Currently Viewing' : 'Select'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Course 16-Level Curriculum Map (Section 12 & 13) */}
      {topicsData && (
        <div className="card" style={{ padding: '30px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-cyan)', fontWeight: 700 }}>
                Level Progression Roadmap
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                {topicsData.course.title} — 16 Mastery Levels
              </h2>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Complete each level's practice and code assessment to unlock the next!
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
              Loading curriculum topics...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {topicsData.topics.map((t) => {
                const isCompleted = t.is_completed === 1;
                const isUnlocked = t.isUnlocked;

                return (
                  <div
                    key={t.id}
                    style={{
                      padding: '16px 18px',
                      borderRadius: 'var(--radius-sm)',
                      background: isCompleted
                        ? 'rgba(16, 185, 129, 0.08)'
                        : isUnlocked
                        ? 'rgba(99, 102, 241, 0.08)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: isCompleted
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : isUnlocked
                        ? '1px solid rgba(99, 102, 241, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      cursor: isUnlocked ? 'pointer' : 'not-allowed',
                      opacity: isUnlocked ? 1 : 0.5,
                      transition: 'var(--transition)'
                    }}
                    onClick={() => {
                      if (isUnlocked) {
                        onSelectTopic(t.id);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: isCompleted ? 'var(--accent-emerald)' : isUnlocked ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700
                      }}>
                        {isCompleted ? <CheckCircle size={18} /> : isUnlocked ? <Play size={15} /> : <Lock size={15} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: isUnlocked ? 'var(--accent-cyan)' : 'var(--text-faint)', fontWeight: 700 }}>
                          LEVEL {t.level_number}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isUnlocked ? '#fff' : 'var(--text-faint)' }}>
                          {t.title}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isCompleted ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: 4 }}>
                          DONE
                        </span>
                      ) : isUnlocked ? (
                        <button className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: 12 }}>
                          Start
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
