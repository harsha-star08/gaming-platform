import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Play,
  Send,
  RotateCcw,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  Code,
  Check,
  Terminal,
  FileText,
  History
} from 'lucide-react';
import { api } from '../../api';

export default function CodingArenaView({ problemSlug, onBack, onRefreshStats }) {
  const [data, setData] = useState(null);
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'custom' | 'history'
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProblem();
  }, [problemSlug]);

  const loadProblem = async () => {
    setIsLoading(true);
    try {
      const res = await api.coding.getProblem(problemSlug);
      setData(res);
      setCode(res.problem.starter_code);
    } catch (err) {
      console.error('Failed to load problem:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setRunResult(null);
    setSubmitResult(null);
    try {
      const res = await api.coding.runCode(problemSlug, code, activeTab === 'custom' ? customInput : '');
      setRunResult(res);
      setActiveTab('tests');
    } catch (err) {
      setRunResult({ status: 'RUNTIME_ERROR', error: err.message, results: [] });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setRunResult(null);
    setSubmitResult(null);
    try {
      const res = await api.coding.submitCode(problemSlug, code, 'python');
      setSubmitResult(res);
      setActiveTab('tests');

      if (res.status === 'ACCEPTED') {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
        if (onRefreshStats) onRefreshStats();
      }
      // Reload problem submission history
      loadProblem();
    } catch (err) {
      setSubmitResult({ status: 'RUNTIME_ERROR', error: err.message, results: [] });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (data?.problem) {
      setCode(data.problem.starter_code);
      setRunResult(null);
      setSubmitResult(null);
    }
  };

  if (isLoading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-faint)' }}>
        Setting up coding sandbox environment...
      </div>
    );
  }

  const { problem, submissions } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top Breadcrumb & Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={onBack}>
            <ArrowLeft size={15} />
            <span>Back</span>
          </button>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{problem.title}</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
          >
            <Play size={14} color="#10b981" />
            <span>{isRunning ? 'Running Public Tests...' : 'Run Code'}</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
          >
            <Send size={14} />
            <span>{isSubmitting ? 'Evaluating Sandbox...' : 'Submit Solution'}</span>
          </button>
        </div>
      </div>

      {/* Split IDE Layout */}
      <div className="ide-container">
        {/* Left Pane: Problem Description, Constraints, & Public Test Cases */}
        <div className="ide-left-pane">
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} color="var(--primary)" />
              <span style={{ fontSize: 14, fontWeight: 700 }}>Description</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                background: problem.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: problem.difficulty === 'Easy' ? 'var(--accent-emerald)' : '#f59e0b'
              }}>
                {problem.difficulty}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)'
              }}>
                +{problem.xp_reward} XP
              </span>
            </div>
          </div>

          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {problem.statement}
              </p>
            </div>

            {problem.input_format && (
              <div>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Input Format
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>{problem.input_format}</p>
              </div>
            )}

            {problem.output_format && (
              <div>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Output Format
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>{problem.output_format}</p>
              </div>
            )}

            {problem.constraints && (
              <div>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Constraints
                </h4>
                <pre style={{
                  background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6,
                  fontSize: 12, color: '#cbd5e1'
                }}>
                  <code>{problem.constraints}</code>
                </pre>
              </div>
            )}

            {/* Public Test Cases Showcase */}
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                Sample Test Cases
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {problem.publicTestCases.map((tc, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: 12
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: 6 }}>
                      Sample {idx + 1}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Input:</div>
                        <pre style={{ background: '#080c14', padding: 6, borderRadius: 4, fontSize: 12, color: '#e2e8f0' }}>
                          <code>{tc.input}</code>
                        </pre>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Expected Output:</div>
                        <pre style={{ background: '#080c14', padding: 6, borderRadius: 4, fontSize: 12, color: 'var(--accent-emerald)' }}>
                          <code>{tc.expected_output}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submission History */}
            {submissions.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <History size={14} />
                  <span>Recent Submissions</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {submissions.map((s) => (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: 12
                    }}>
                      <span style={{
                        fontWeight: 700,
                        color: s.status === 'ACCEPTED' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                      }}>
                        {s.status} ({s.passed_count}/{s.total_count})
                      </span>
                      <span style={{ color: 'var(--text-faint)' }}>{s.execution_time_ms}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Code Editor & Execution Results */}
        <div className="ide-right-pane">
          {/* Editor Header Bar */}
          <div className="ide-editor-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 4,
                background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)'
              }}>
                Python 3.14 (Isolated Sandbox)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleReset}
                title="Reset to starter code"
                style={{ padding: '4px 8px' }}
              >
                <RotateCcw size={14} />
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setCode('')}
                title="Clear editor"
                style={{ padding: '4px 8px' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Editable Code Area */}
          <textarea
            className="ide-editor-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck="false"
            placeholder="# Write your Python 3 solution here..."
          />

          {/* Bottom Tabs & Output Panel */}
          <div className="ide-results-panel">
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: 12, gap: 16 }}>
              <button
                type="button"
                onClick={() => setActiveTab('tests')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'tests' ? '2px solid var(--primary)' : '2px solid transparent',
                  padding: '6px 0',
                  color: activeTab === 'tests' ? '#fff' : 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Test Results
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'custom' ? '2px solid var(--primary)' : '2px solid transparent',
                  padding: '6px 0',
                  color: activeTab === 'custom' ? '#fff' : 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Custom Stdin
              </button>
            </div>

            {/* Custom Input Tab */}
            {activeTab === 'custom' ? (
              <div>
                <textarea
                  className="form-textarea"
                  placeholder="Enter custom input to feed into standard input..."
                  rows={4}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  style={{ fontSize: 13, fontFamily: 'var(--font-code)' }}
                />
              </div>
            ) : (
              /* Test Results View */
              <div>
                {/* Submit Verdict Banner */}
                {submitResult && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    marginBottom: 14,
                    background: submitResult.status === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    border: submitResult.status === 'ACCEPTED' ? '1px solid var(--accent-emerald)' : '1px solid var(--accent-rose)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{
                        fontSize: 16, fontWeight: 800,
                        color: submitResult.status === 'ACCEPTED' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                      }}>
                        {submitResult.status === 'ACCEPTED' ? '✓ Accepted' : `✗ ${submitResult.status}`}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Passed {submitResult.passedCount} / {submitResult.totalCount} test cases ({submitResult.score}%)
                      </div>
                    </div>

                    {submitResult.xpAwarded > 0 && (
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        +{submitResult.xpAwarded} XP Earned!
                      </span>
                    )}
                  </div>
                )}

                {/* Run Result Output */}
                {runResult && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: runResult.status === 'ACCEPTED' ? 'var(--accent-emerald)' : '#f59e0b', marginBottom: 8 }}>
                      Public Test Cases ({runResult.passedCount || 0}/{runResult.totalCount || 0} passed)
                    </div>
                  </div>
                )}

                {/* Individual Test Results List */}
                {(submitResult?.results || runResult?.results || []).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(submitResult?.results || runResult?.results || []).map((r, i) => (
                      <div key={i} style={{
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 6,
                        padding: '10px 14px',
                        border: r.passed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: r.passed ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                            Test Case #{r.testCaseIndex} {r.isHidden ? '(Hidden)' : '(Public)'} : {r.passed ? 'PASSED' : 'FAILED'}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{r.executionTimeMs}ms</span>
                        </div>

                        {!r.isHidden && !r.passed && (
                          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                            <div>Expected: <code style={{ color: 'var(--accent-emerald)' }}>{r.expectedOutput}</code></div>
                            <div>Actual: <code style={{ color: 'var(--accent-rose)' }}>{r.actualOutput || 'No output / Error'}</code></div>
                          </div>
                        )}

                        {r.error && (
                          <pre style={{ color: 'var(--accent-rose)', fontSize: 11, marginTop: 4, overflowX: 'auto' }}>
                            {r.error}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-faint)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
                    Click "Run Code" to test against public test cases or "Submit Solution" to evaluate against hidden test cases.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
