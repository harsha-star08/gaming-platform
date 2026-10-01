import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  FileText,
  Clock,
  CheckCircle,
  Play,
  ArrowRight,
  AlertTriangle,
  Code2,
  Send,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import { api } from '../../api';

export default function AssignmentsView({ onRefreshStats }) {
  const [assignments, setAssignments] = useState([]);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [assignmentDetail, setAssignmentDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [codeAnswer, setCodeAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setIsLoading(true);
    try {
      const data = await api.assignments.getStudentAssignments();
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load student assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAssignment = async (assignment) => {
    try {
      const detail = await api.assignments.getAssignmentDetail(assignment.id);
      setActiveAssignment(assignment);
      setAssignmentDetail(detail);
      setQuizAnswers({});
      setCodeAnswer(detail.testContent?.starter_code || '# Write solution\n');
      setSubmissionResult(null);

      // Start assignment if not started
      if (assignment.submission_status === 'SENT') {
        await api.assignments.start(assignment.id);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async () => {
    if (!activeAssignment) return;
    setIsSubmitting(true);
    try {
      const payload = activeAssignment.type === 'QUIZ'
        ? { answers: quizAnswers }
        : { code: codeAnswer };

      const res = await api.assignments.submit(activeAssignment.id, payload);
      setSubmissionResult(res);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      loadAssignments();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>Loading assignments...</div>;
  }

  // Active Assessment Test Runner View
  if (activeAssignment && assignmentDetail) {
    const { testContent } = assignmentDetail;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { setActiveAssignment(null); loadAssignments(); }}>
            <ArrowLeft size={14} />
            <span>Back to Assignments</span>
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Due: {activeAssignment.due_date}
          </span>
        </div>

        {/* Assessment Card */}
        <div className="card" style={{ padding: '28px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4,
              background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)'
            }}>
              {activeAssignment.type} ASSESSMENT
            </span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>{activeAssignment.title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            Mentor: {activeAssignment.mentor_name} • Course: {activeAssignment.course_name}
          </p>

          {/* Result Banner if already submitted */}
          {submissionResult && (
            <div style={{
              padding: '16px 20px', borderRadius: 8, marginBottom: 24,
              background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <h4 style={{ fontSize: 18, color: 'var(--accent-emerald)', fontWeight: 800 }}>
                  Assessment Submitted: {submissionResult.score}%
                </h4>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Accuracy: {submissionResult.accuracy}% | XP Earned: +{submissionResult.xpAwarded} XP
                </div>
              </div>
              <CheckCircle size={28} color="var(--accent-emerald)" />
            </div>
          )}

          {/* QUIZ MODE */}
          {activeAssignment.type === 'QUIZ' && testContent?.questions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {testContent.questions.map((q, idx) => (
                <div key={idx} style={{ padding: 18, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
                    {idx + 1}. {q.prompt}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.options.map((opt, oIdx) => {
                      const isPicked = quizAnswers[idx] === opt;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => setQuizAnswers(prev => ({ ...prev, [idx]: opt }))}
                          disabled={!!submissionResult}
                          style={{
                            padding: '10px 14px', borderRadius: 6,
                            background: isPicked ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                            border: isPicked ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                            color: isPicked ? '#fff' : 'var(--text-muted)', textAlign: 'left',
                            fontSize: 13, cursor: 'pointer'
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CODING MODE */}
          {activeAssignment.type === 'CODING' && testContent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 16, background: 'rgba(0,0,0,0.25)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: 15, color: '#fff', marginBottom: 8 }}>Problem Statement</h4>
                <p style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5 }}>{testContent.statement}</p>
              </div>

              <textarea
                className="form-textarea"
                rows={10}
                value={codeAnswer}
                onChange={e => setCodeAnswer(e.target.value)}
                disabled={!!submissionResult}
                style={{ fontFamily: 'var(--font-code)', fontSize: 13 }}
              />
            </div>
          )}

          {!submissionResult && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <Send size={15} />
                <span>{isSubmitting ? 'Grading Submission...' : 'Submit to Mentor'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assignments List View
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 950, margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Mentor Assignments & Assessments</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Complete quizzes and algorithmic challenges assigned by your connected mentor to demonstrate topic mastery.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {assignments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-faint)' }}>
            No assignments currently assigned. Once your connected mentor assigns a quiz or coding challenge, it will be listed here.
          </div>
        ) : (
          assignments.map((a) => {
            const isCompleted = a.submission_status === 'SUBMITTED';
            return (
              <div key={a.id} className="card" style={{
                borderLeft: isCompleted ? '4px solid var(--accent-emerald)' : '4px solid var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)'
                    }}>
                      {a.type}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                      Assigned by {a.mentor_name} • Due {a.due_date}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 18, color: '#fff', marginBottom: 2 }}>{a.title}</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Course: {a.course_name}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {isCompleted ? (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        Score: {a.score}%
                      </span>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Completed</div>
                    </div>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => handleOpenAssignment(a)}>
                      <Play size={14} />
                      <span>{a.submission_status === 'IN_PROGRESS' ? 'Resume Test' : 'Start Assessment'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
