import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Calendar,
  Layers,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { api } from '../../api';

export default function AiPerformanceView({ onNavigateToTopic }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPerformance();
  }, []);

  const loadPerformance = async () => {
    setIsLoading(true);
    try {
      const res = await api.ai.getPerformance();
      setData(res);
    } catch (err) {
      console.error('Failed to load AI performance metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-faint)' }}>Synthesizing real-time AI performance metrics...</div>;
  }

  const analysis = data?.analysis;
  const metrics = data?.metrics;

  // Empty State (Section 31 & 54)
  if (!analysis || !analysis.hasData) {
    return (
      <div className="card" style={{ maxWidth: 640, margin: '40px auto', textAlign: 'center', padding: '48px 32px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--primary)', marginBottom: 16
        }}>
          <Sparkles size={28} />
        </div>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>No Performance Data Yet</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {analysis?.message || "Complete your first challenge or practice quiz in the Course Library to generate your verified AI baseline."}
        </p>
        <button className="btn btn-primary" onClick={() => onNavigateToTopic && onNavigateToTopic('courses')}>
          <span>Explore Course Library</span>
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  const { currentMetrics, comparison, strongTopics, weakTopics, aiAnalysisText, recommendations, allWeeks, weekNumber, isBaseline } = analysis;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1050, margin: '0 auto' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Sparkles size={20} color="var(--primary)" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
            Dedicated AI Analytics Engine
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          Week-by-Week AI Performance Analysis
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {isBaseline
            ? 'Week 1 establishes your initial baseline across quiz accuracy, code execution, and topic mastery.'
            : `Comparing Week ${weekNumber} performance against Week ${comparison?.previousWeekNumber} based on verified database attempts.`}
        </p>
      </div>

      {/* Primary Comparison Metric Cards (Section 31) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Quiz Accuracy */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>QUIZ ACCURACY</span>
            {comparison ? (
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                background: comparison.quizChange.startsWith('+') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                color: comparison.quizChange.startsWith('+') ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                display: 'flex', alignItems: 'center', gap: 2
              }}>
                {comparison.quizChange.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {comparison.quizChange}
              </span>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 600 }}>Baseline</span>
            )}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>
            {currentMetrics.quizAccuracy}%
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Correct MCQ & prediction attempts</span>
        </div>

        {/* Coding Accuracy */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>CODING ACCURACY</span>
            {comparison ? (
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                background: comparison.codingChange.startsWith('+') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                color: comparison.codingChange.startsWith('+') ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                display: 'flex', alignItems: 'center', gap: 2
              }}>
                {comparison.codingChange.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {comparison.codingChange}
              </span>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 600 }}>Baseline</span>
            )}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>
            {currentMetrics.codingAccuracy}%
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Accepted LeetCode submissions</span>
        </div>

        {/* Tasks Completed */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>TASKS COMPLETED</span>
            {comparison && (
              <span style={{ fontSize: 12, fontWeight: 700, color: comparison.taskChange >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {comparison.taskChange >= 0 ? `+${comparison.taskChange}` : comparison.taskChange}
              </span>
            )}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>
            {currentMetrics.tasksCompleted}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Combined quizzes & coding problems</span>
        </div>

        {/* XP Progress */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>XP PROGRESS</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)' }}>
            {currentMetrics.xpEarned}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Total verified XP earned</span>
        </div>
      </div>

      {/* AI Synthesis Narrative Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        padding: '28px 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Sparkles size={20} color="var(--primary)" />
          <h3 style={{ fontSize: 18, color: '#fff' }}>
            AI Evaluation Summary: Week {weekNumber} {isBaseline ? '(Baseline)' : `vs Week ${comparison?.previousWeekNumber}`}
          </h3>
        </div>

        <p style={{ fontSize: 15, color: 'var(--text-main)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 20 }}>
          {aiAnalysisText}
        </p>

        {/* Action Plan */}
        {recommendations && recommendations.length > 0 && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '16px 20px'
          }}>
            <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--accent-cyan)', marginBottom: 10 }}>
              Personalized AI Action Plan:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recommendations.map((rec, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#fff' }}>
                  <CheckCircle size={15} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Topic Breakdown: Strong & Weak Areas (Section 31) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Strong Topics */}
        <div className="card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
          <h3 style={{ fontSize: 16, color: 'var(--accent-emerald)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} />
            <span>Demonstrated Strengths</span>
          </h3>
          {strongTopics.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Solve more questions accurately to identify your standout topics.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {strongTopics.map((st, i) => (
                <span key={i} style={{
                  fontSize: 13, fontWeight: 600, padding: '6px 12px', borderRadius: 20,
                  background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)'
                }}>
                  ✓ {st}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Weak Topics */}
        <div className="card" style={{ borderLeft: '4px solid var(--accent-rose)' }}>
          <h3 style={{ fontSize: 16, color: 'var(--accent-rose)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} />
            <span>Targeted Focus Areas</span>
          </h3>
          {weakTopics.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>No persistent weak points detected yet. Keep up the high accuracy!</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {weakTopics.map((wt, i) => (
                <span key={i} style={{
                  fontSize: 13, fontWeight: 600, padding: '6px 12px', borderRadius: 20,
                  background: 'rgba(244, 63, 94, 0.15)', color: '#fda4af'
                }}>
                  ⚠️ {wt}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All Weeks Timeline (Section 31) */}
      <div className="card">
        <h3 style={{ fontSize: 18, marginBottom: 14 }}>Historical Weekly Performance Log</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allWeeks.map((w) => (
            <div key={w.weekNumber} style={{
              padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 13
            }}>
              <div>
                <span style={{ fontWeight: 700, color: '#fff' }}>Week {w.weekNumber}</span>
                <span style={{ color: 'var(--text-faint)', marginLeft: 12 }}>{w.tasksCompleted} activities completed</span>
              </div>
              <div style={{ display: 'flex', gap: 18, color: 'var(--text-muted)' }}>
                <span>Quiz: <strong style={{ color: '#fff' }}>{w.quizAccuracy}%</strong></span>
                <span>Coding: <strong style={{ color: '#fff' }}>{w.codingAccuracy}%</strong></span>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{w.xpEarned} XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
