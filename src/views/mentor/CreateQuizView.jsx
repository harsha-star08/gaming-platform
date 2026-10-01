import React, { useState } from 'react';
import { PlusCircle, Trash2, Check, ArrowRight, HelpCircle } from 'lucide-react';
import { api } from '../../api';

export default function CreateQuizView({ onQuizCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseName, setCourseName] = useState('Python Mastery');
  const [topicName, setTopicName] = useState('Data Structures');
  const [timeLimit, setTimeLimit] = useState(15);
  const [questions, setQuestions] = useState([
    {
      prompt: 'What is the output of print(type([])) in Python?',
      options: ["<class 'list'>", "<class 'tuple'>", "<class 'dict'>", "<class 'array'>"],
      correct_answer: "<class 'list'>",
      explanation: 'Square brackets create a Python list object.'
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        prompt: '',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: ''
      }
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx, field, value) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleOptionChange = (qIdx, oIdx, value) => {
    setQuestions(prev => {
      const copy = [...prev];
      const opts = [...copy[qIdx].options];
      opts[oIdx] = value;
      copy[qIdx].options = opts;
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || questions.length === 0) {
      alert('Please enter a quiz title and at least one question.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.mentor.createQuiz({
        title,
        description,
        courseName,
        topicName,
        timeLimitMinutes: parseInt(timeLimit, 10),
        questions
      });
      setSuccess(true);
      setTimeout(() => {
        if (onQuizCreated) onQuizCreated();
      }, 1500);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900, margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Create Custom Quiz Assessment</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Design multiple choice assessments to test student conceptual understanding.
        </p>
      </div>

      {success && (
        <div style={{ padding: '16px 20px', borderRadius: 8, background: 'rgba(16,185,129,0.15)', border: '1px solid var(--accent-emerald)', color: 'var(--accent-emerald)', fontSize: 15, fontWeight: 700, textAlign: 'center' }}>
          ✓ Quiz created successfully! Redirecting to Assignments...
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Basic Details Card */}
        <div className="card">
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Quiz Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Quiz Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Python Dictionaries & Loops Mastery"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Course</label>
              <input
                type="text"
                className="form-input"
                value={courseName}
                onChange={e => setCourseName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Focus Topic</label>
              <input
                type="text"
                className="form-input"
                value={topicName}
                onChange={e => setTopicName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Time Limit (Minutes)</label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="120"
                value={timeLimit}
                onChange={e => setTimeLimit(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="Brief assessment instructions..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Questions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 18 }}>Questions ({questions.length})</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddQuestion}>
              <PlusCircle size={15} />
              <span>Add Another Question</span>
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                  Question #{qIdx + 1}
                </span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Question Prompt</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter the question text..."
                  value={q.prompt}
                  onChange={e => handleQuestionChange(qIdx, 'prompt', e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Answer Options</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {q.options.map((opt, oIdx) => (
                    <input
                      key={oIdx}
                      type="text"
                      className="form-input"
                      placeholder={`Option ${oIdx + 1}`}
                      value={opt}
                      onChange={e => handleOptionChange(qIdx, oIdx, e.target.value)}
                      required
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Correct Answer (Must match option exactly)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Exact correct option string"
                    value={q.correct_answer}
                    onChange={e => handleQuestionChange(qIdx, 'correct_answer', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Explanation</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Why this answer is correct..."
                    value={q.explanation}
                    onChange={e => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
            <span>{isSubmitting ? 'Saving Quiz...' : 'Save & Publish Quiz'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
