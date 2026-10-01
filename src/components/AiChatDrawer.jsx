import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function AiChatDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ASSISTANT',
      text: "Hello! I am your AI Learning Assistant. I have real-time visibility into your learning path, accuracy, and current challenges. Ask me for conceptual explanations, debugging strategies, or personalized practice tips!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg = { id: Date.now(), sender: 'USER', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await api.ai.chat(query);
      const assistantMsg = {
        id: Date.now() + 1,
        sender: 'ASSISTANT',
        text: data.reply
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'ASSISTANT', text: "I couldn't process that query. Please make sure the server is connected." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      width: 400,
      height: 580,
      background: 'rgba(18, 24, 38, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(99, 102, 241, 0.4)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-glow)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      overflow: 'hidden'
    }}>
      {/* Drawer Header */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(99, 102, 241, 0.12)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}>
            <Bot size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: 15, color: '#fff' }}>AI Learning Assistant</h4>
            <span style={{ fontSize: 11, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-emerald)' }}></span>
              Context-Aware & Active
            </span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      {/* Suggested Prompts */}
      <div style={{ padding: '10px 16px', display: 'flex', gap: 6, overflowX: 'auto', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button
          className="btn btn-secondary btn-sm"
          style={{ fontSize: 11, whiteSpace: 'nowrap', padding: '4px 10px' }}
          onClick={() => handleSend("How is my current progress and accuracy?")}
        >
          📊 My Progress
        </button>
        <button
          className="btn btn-secondary btn-sm"
          style={{ fontSize: 11, whiteSpace: 'nowrap', padding: '4px 10px' }}
          onClick={() => handleSend("What are my weak topics?")}
        >
          🎯 Weak Areas
        </button>
        <button
          className="btn btn-secondary btn-sm"
          style={{ fontSize: 11, whiteSpace: 'nowrap', padding: '4px 10px' }}
          onClick={() => handleSend("Give me a hint on my current topic")}
        >
          💡 Need a Hint
        </button>
      </div>

      {/* Chat Messages */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: m.sender === 'USER' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: m.sender === 'USER' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
              background: m.sender === 'USER' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.06)',
              color: '#fff',
              fontSize: 13,
              lineHeight: 1.5,
              border: m.sender === 'USER' ? 'none' : '1px solid var(--border-subtle)',
              whiteSpace: 'pre-wrap'
            }}>
              {m.text}
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>
              {m.sender === 'USER' ? 'You' : 'AI Assistant'}
            </span>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12, padding: '8px 12px' }}>
            <Sparkles size={16} className="animate-spin" color="var(--primary)" />
            Thinking based on your data...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div style={{
        padding: 12,
        background: 'rgba(10, 13, 20, 0.8)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: 8
      }}>
        <input
          type="text"
          className="form-input"
          placeholder="Ask for hints, advice, or concepts..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{ padding: '8px 12px', fontSize: 13 }}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          style={{ padding: '0 14px' }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
