import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Flame,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  CheckCircle,
  Play,
  Heart,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../../api';

export default function StreakView({ onRefreshStats }) {
  const [streakData, setStreakData] = useState(null);
  const [restoreTask, setRestoreTask] = useState(null);
  const [restoreCode, setRestoreCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskResult, setTaskResult] = useState(null);
  const [isUsingCard, setIsUsingCard] = useState(false);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    setIsLoading(true);
    try {
      const data = await api.streaks.getDetails();
      setStreakData(data);
      if (data.isBroken) {
        loadRestoreTask();
      }
    } catch (err) {
      console.error('Failed to load streak details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRestoreTask = async () => {
    try {
      const task = await api.streaks.getRestoreTask();
      setRestoreTask(task);
      setRestoreCode(task.starter_code || '# Write solution to restore streak\n');
    } catch (err) {
      console.error('Failed to load restore task:', err);
    }
  };

  const handleSimulateMiss = async () => {
    setIsSimulating(true);
    try {
      await api.streaks.simulateMiss();
      loadStreak();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error('Failed to simulate miss:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSubmitRestoreTask = async () => {
    if (!restoreTask) return;
    setIsSubmittingTask(true);
    setTaskResult(null);
    try {
      const res = await api.streaks.submitRestoreTask(restoreTask.id, restoreCode);
      setTaskResult(res);
      if (res.passed) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        loadStreak();
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err) {
      setTaskResult({ passed: false, error: err.message });
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleUseRestoreCard = async () => {
    setIsUsingCard(true);
    try {
      const res = await api.streaks.useRestoreCard();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      loadStreak();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUsingCard(false);
    }
  };

  if (isLoading || !streakData) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>Loading streak tracker...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Daily Streak & AI Recovery</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Meaningful learning activities keep your streak alive. Missed a day? Recover it with AI!
          </p>
        </div>

        {/* Demo Simulator Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleSimulateMiss}
          disabled={isSimulating}
          title="Simulate missing yesterday's learning session to test the streak break & AI restore flow"
          style={{ borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fda4af' }}
        >
          <ShieldAlert size={14} />
          <span>{isSimulating ? 'Simulating...' : 'Simulate Missed Day (Demo)'}</span>
        </button>
      </div>

      {/* Streak Hero Card */}
      <div className="card" style={{
        background: streakData.isBroken
          ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(22, 29, 44, 0.8) 100%)'
          : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
        border: streakData.isBroken ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
        padding: '32px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: streakData.isBroken ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: streakData.isBroken ? 'var(--accent-rose)' : '#f59e0b',
            boxShadow: streakData.isBroken ? '0 0 25px rgba(244, 63, 94, 0.3)' : '0 0 25px rgba(245, 158, 11, 0.3)'
          }}>
            <Flame size={40} />
          </div>
          <div>
            <span style={{
              fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2,
              color: streakData.isBroken ? 'var(--accent-rose)' : '#f59e0b'
            }}>
              {streakData.isBroken ? 'STREAK BROKEN' : 'ACTIVE LEARNING STREAK'}
            </span>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginTop: 2 }}>
              {streakData.currentStreak} Days
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>
              Longest recorded streak: {streakData.longestStreak} days
            </span>
          </div>
        </div>

        {/* Milestone Badges */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ textAlign: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>7 DAYS</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: streakData.longestStreak >= 7 ? 'var(--accent-emerald)' : 'var(--text-faint)' }}>
              {streakData.longestStreak >= 7 ? '✓ Unlocked' : 'Locked'}
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>14 DAYS</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: streakData.longestStreak >= 14 ? 'var(--accent-emerald)' : 'var(--text-faint)' }}>
              {streakData.longestStreak >= 14 ? '✓ Unlocked' : 'Locked'}
            </div>
          </div>
        </div>
      </div>

      {/* When Streak is Broken: Recovery Options (Section 20) */}
      {streakData.isBroken && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-rose)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <AlertTriangle size={22} color="var(--accent-rose)" />
            <h3 style={{ fontSize: 18, color: '#fff' }}>Streak Recovery Available</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 18 }}>
            You missed a day, but you have 2 options to restore your eligible streak:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
            {/* Option 1: AI Generated Challenge */}
            <div style={{
              padding: 16, borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Sparkles size={16} color="var(--primary)" />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Option A: AI Restore Task</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Solve an AI-generated coding challenge tailored to your actual weak topic ({restoreTask?.weak_topic || 'Python Fundamentals'}).
              </p>
              <span style={{ fontSize: 11, color: 'var(--accent-emerald)', fontWeight: 600 }}>1 attempt per eligible missed day</span>
            </div>

            {/* Option 2: Use Restore Card */}
            <div style={{
              padding: 16, borderRadius: 'var(--radius-sm)', background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Heart size={16} color="#eab308" />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Option B: Use Restore Card</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                You own <strong>{streakData.restoreCardCount} Restore Card(s)</strong> in your inventory.
              </p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleUseRestoreCard}
                disabled={streakData.restoreCardCount <= 0 || isUsingCard}
                style={{ width: '100%' }}
              >
                {streakData.restoreCardCount > 0 ? (isUsingCard ? 'Activating...' : 'Use 1 Restore Card') : 'None Owned (Buy in Shop)'}
              </button>
            </div>
          </div>

          {/* AI Task Workspace */}
          {restoreTask && (
            <div style={{
              background: '#0a0d16',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: 18
            }}>
              <h4 style={{ fontSize: 16, color: '#fff', marginBottom: 4 }}>
                {restoreTask.challenge_title}
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                {restoreTask.challenge_prompt}
              </p>

              <textarea
                className="form-textarea"
                rows={6}
                value={restoreCode}
                onChange={(e) => setRestoreCode(e.target.value)}
                style={{ fontFamily: 'var(--font-code)', fontSize: 13, marginBottom: 12 }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSubmitRestoreTask}
                  disabled={isSubmittingTask}
                >
                  <Play size={14} />
                  <span>{isSubmittingTask ? 'Evaluating...' : 'Submit Solution & Restore'}</span>
                </button>

                {taskResult && (
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: taskResult.passed ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                  }}>
                    {taskResult.passed ? '✓ Streak successfully restored!' : `✗ ${taskResult.error || 'Failed output'}`}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Streak History */}
      <div className="card">
        <h3 style={{ fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} color="var(--primary)" />
          <span>Activity Log & Streak History</span>
        </h3>

        {streakData.history.length === 0 ? (
          <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>
            No streak activity history yet. Complete a lesson or challenge today!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {streakData.history.map((h) => (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 6, background: 'rgba(255,255,255,0.02)'
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-main)' }}>{h.activity_description}</span>
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{h.activity_date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
