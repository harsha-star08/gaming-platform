import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  Code,
  AlertTriangle,
  Play,
  Award,
  Sparkles,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { api } from '../../api';

export default function TopicLearnView({ topicId, onBack, onOpenProblem, onRefreshStats }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Practice state
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [questionResults, setQuestionResults] = useState({});
  const [submittingQ, setSubmittingQ] = useState({});

  // Topic completion
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    loadTopic();
  }, [topicId]);

  const loadTopic = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.student.getTopicDetail(topicId);
      setData(res);
      setIsCompleted(res.isCompleted);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId, option) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuestion = async (questionId) => {
    const answer = selectedAnswers[questionId];
    if (answer === undefined) return;

    setSubmittingQ(prev => ({ ...prev, [questionId]: true }));
    try {
      const res = await api.student.attemptQuestion(questionId, answer);
      setQuestionResults(prev => ({ ...prev, [questionId]: res }));
      if (res.isCorrect && res.xpAwarded > 0) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err) {
      console.error('Failed to submit question attempt:', err);
    } finally {
      setSubmittingQ(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleCompleteTopic = async () => {
    setIsCompleting(true);
    try {
      const res = await api.student.completeTopic(topicId);
      setIsCompleted(true);
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 }
      });
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error('Failed to complete topic:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-faint)' }}>
        Loading lesson materials...
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center', padding: 32 }}>
        <AlertTriangle size={36} color="var(--accent-rose)" style={{ marginBottom: 12 }} />
        <h3 style={{ fontSize: 20, marginBottom: 8 }}>Lesson Locked</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{error}</p>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Roadmap</span>
        </button>
      </div>
    );
  }

  const { topic, questions, problem } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1000, margin: '0 auto' }}>
      {/* Top Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={15} />
          <span>Back to Courses</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isCompleted && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 700, color: 'var(--accent-emerald)',
              background: 'rgba(16, 185, 129, 0.15)', padding: '5px 12px', borderRadius: 20
            }}>
              <CheckCircle size={15} /> Level Completed
            </span>
          )}
          <button
            className={`btn ${isCompleted ? 'btn-secondary' : 'btn-success'} btn-sm`}
            onClick={handleCompleteTopic}
            disabled={isCompleting || isCompleted}
          >
            <Sparkles size={14} />
            <span>{isCompleted ? 'Completed' : isCompleting ? 'Completing...' : 'Mark Level Complete (+50 XP)'}</span>
          </button>
        </div>
      </div>

      {/* Lesson Header Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        padding: '28px 24px'
      }}>
        <div style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2 }}>
          {topic.course_title} — LEVEL {topic.level_number}
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, marginTop: 4, marginBottom: 10 }}>{topic.title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6 }}>
          {topic.description}
        </p>
      </div>

      {/* Concept Summary */}
      <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
        <h3 style={{ fontSize: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={18} color="var(--primary)" />
          <span>Key Concept</span>
        </h3>
        <p style={{ color: 'var(--text-main)', fontSize: 14, lineHeight: 1.6 }}>
          {topic.concept_summary}
        </p>
      </div>

      {/* Code Example & Output Box */}
      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Code size={18} color="var(--accent-cyan)" />
          <span>Python Code Demonstration</span>
        </h3>
        <pre style={{
          background: '#090d16',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: 16,
          fontSize: 13,
          color: '#a5b4fc',
          overflowX: 'auto',
          marginBottom: 16
        }}>
          <code>{topic.code_example}</code>
        </pre>

        <h4 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
          Expected Output:
        </h4>
        <pre style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontSize: 13,
          color: 'var(--accent-emerald)',
          overflowX: 'auto'
        }}>
          <code>{topic.expected_output}</code>
        </pre>
      </div>

      {/* Common Mistakes Warning Card */}
      <div className="card" style={{ borderLeft: '4px solid var(--accent-amber)', background: 'rgba(245, 158, 11, 0.05)' }}>
        <h3 style={{ fontSize: 16, color: '#f59e0b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} color="#f59e0b" />
          <span>Common Mistakes to Avoid</span>
        </h3>
        <p style={{ color: 'var(--text-main)', fontSize: 14, lineHeight: 1.5 }}>
          {topic.common_mistakes}
        </p>
      </div>

      {/* Practice Mode (Section 15) */}
      {questions.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-violet)', fontWeight: 700 }}>
                Interactive Practice Mode
              </span>
              <h3 style={{ fontSize: 20, marginTop: 2 }}>Concept Validation Questions</h3>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              Earn +10 XP per first correct answer
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {questions.map((q, idx) => {
              const res = questionResults[q.id];
              const isSelected = selectedAnswers[q.id] !== undefined;

              return (
                <div key={q.id} style={{
                  padding: 18,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)'
                    }}>
                      Question {idx + 1} ({q.type.toUpperCase()})
                    </span>
                  </div>

                  <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                    {q.prompt}
                  </p>

                  {q.code_snippet && (
                    <pre style={{
                      background: '#0a0e18',
                      padding: '10px 14px',
                      borderRadius: 6,
                      fontSize: 13,
                      color: '#93c5fd',
                      marginBottom: 14,
                      overflowX: 'auto'
                    }}>
                      <code>{q.code_snippet}</code>
                    </pre>
                  )}

                  {/* Options */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 14 }}>
                    {q.options.map((opt, oIdx) => {
                      const isPicked = selectedAnswers[q.id] === opt;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSelectOption(q.id, opt)}
                          style={{
                            padding: '10px 16px',
                            borderRadius: 'var(--radius-sm)',
                            background: isPicked ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                            border: isPicked ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                            color: isPicked ? '#fff' : 'var(--text-muted)',
                            textAlign: 'left',
                            fontSize: 14,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            transition: 'var(--transition)'
                          }}
                        >
                          <span style={{
                            width: 20, height: 20, borderRadius: '50%',
                            border: isPicked ? '6px solid var(--primary)' : '2px solid var(--border-subtle)',
                            background: isPicked ? '#fff' : 'transparent',
                            flexShrink: 0
                          }} />
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSubmitQuestion(q.id)}
                      disabled={!isSelected || submittingQ[q.id]}
                    >
                      {submittingQ[q.id] ? 'Checking...' : 'Check Answer'}
                    </button>

                    {res && (
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: res.isCorrect ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                      }}>
                        {res.isCorrect ? `✓ Correct! (+${res.xpAwarded} XP)` : '✗ Incorrect. Try again!'}
                      </span>
                    )}
                  </div>

                  {res && (
                    <div style={{
                      marginTop: 12, padding: '10px 14px', borderRadius: 6,
                      background: 'rgba(0, 0, 0, 0.25)', fontSize: 13, color: 'var(--text-muted)'
                    }}>
                      <strong>Explanation:</strong> {res.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LeetCode Challenge Banner */}
      {problem && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          padding: '24px 28px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Code size={18} color="var(--accent-cyan)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                Algorithmic Code Challenge
              </span>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)'
              }}>
                {problem.difficulty}
              </span>
            </div>
            <h3 style={{ fontSize: 20, color: '#fff' }}>{problem.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 500 }}>
              Solve this in our real LeetCode-style code execution sandbox with public & hidden test cases.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => onOpenProblem(problem.slug)}
            style={{ padding: '12px 24px', fontSize: 15 }}
          >
            <span>Open Code Editor</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
