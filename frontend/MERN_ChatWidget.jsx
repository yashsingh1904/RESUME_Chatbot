import React, { useState, useEffect, useRef } from 'react';

/**
 * MERN_ChatWidget.jsx
 * 
 * Drop this component anywhere in your React MERN portfolio (e.g. in App.jsx or Layout.jsx).
 * It creates a floating AI Recruiter Chatbot button at the bottom-right of your screen.
 * 
 * Replace BACKEND_URL with your deployed FastAPI backend URL:
 * e.g., 'https://yash-resume-bot.onrender.com' (or 'http://localhost:8000' during local dev)
 */

const BACKEND_URL = process.env.REACT_APP_CHATBOT_URL || 'http://localhost:8000';

export default function ResumeChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hi! 👋 I'm Yash's AI recruiter assistant. Ask me anything about his projects, skills, DTU education, or work experience!"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
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
    const query = textToSend || inputValue.trim();
    if (!query || isLoading) return;

    // Add user message
    const newMessages = [...messages, { sender: 'user', text: query }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });

      if (!response.ok) throw new Error('Network error');

      const data = await response.json();
      setMessages([...newMessages, { sender: 'bot', text: data.answer }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: "⚠️ Couldn't reach the AI server right now. Feel free to contact Yash directly at singhyash9990@gmail.com!"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "What are your top technical skills?",
    "Tell me about your Computer Vision project",
    "What's your experience in Rocketry DTU & ISRO?",
    "What is your LeetCode rating?"
  ];

  return (
    <div style={styles.widgetWrapper}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          style={styles.floatingButton}
          title="Chat with Yash's AI Assistant"
        >
          <span style={styles.buttonPulse}></span>
          <span style={{ fontSize: '1.4rem' }}>💬</span>
          <span style={styles.buttonText}>Chat with Yash's AI</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div style={styles.chatBox}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.avatar}>YS</div>
              <div>
                <h4 style={styles.headerTitle}>Yash's AI Portfolio Agent</h4>
                <div style={styles.onlineStatus}>
                  <span style={styles.greenDot}></span>
                  <span style={{ fontSize: '0.74rem', color: '#a7f3d0' }}>Live • Verified Resume</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              style={styles.closeBtn}
              title="Close Chat"
            >
              ✕
            </button>
          </div>

          {/* Messages Feed */}
          <div style={styles.messagesContainer}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  ...styles.messageRow,
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                {msg.sender === 'bot' && <div style={styles.botAvatar}>🤖</div>}
                <div
                  style={{
                    ...styles.messageBubble,
                    ...(msg.sender === 'user' ? styles.userBubble : styles.botBubble)
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
                <div style={styles.botAvatar}>🤖</div>
                <div style={{ ...styles.messageBubble, ...styles.botBubble }}>
                  <span style={styles.typingDot}>●</span>
                  <span style={{ ...styles.typingDot, animationDelay: '0.2s' }}>●</span>
                  <span style={{ ...styles.typingDot, animationDelay: '0.4s' }}>●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div style={styles.quickPrompts}>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                style={styles.promptChip}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Dock */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
            style={styles.inputContainer}
          >
            <input
              type="text"
              placeholder="Ask me a question about Yash..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={styles.inputField}
            />
            <button 
              type="submit" 
              disabled={isLoading || !inputValue.trim()} 
              style={styles.sendButton}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// Inline styles so it works in ANY React setup without extra CSS files
const styles = {
  widgetWrapper: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 999999,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  floatingButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 22px',
    borderRadius: '9999px',
    background: 'linear-gradient(135deg, #00f0ff, #8a2be2)',
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 8px 25px rgba(0, 240, 255, 0.4)',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.92rem',
    position: 'relative',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  buttonPulse: {
    position: 'absolute',
    top: '-3px', right: '-3px',
    width: '12px', height: '12px',
    borderRadius: '50%',
    backgroundColor: '#00f5a0',
    border: '2px solid #060813',
  },
  buttonText: {
    letterSpacing: '0.02em',
  },
  chatBox: {
    width: '380px',
    maxWidth: 'calc(100vw - 32px)',
    height: '560px',
    maxHeight: 'calc(100vh - 100px)',
    background: '#0a0f1d',
    borderRadius: '20px',
    border: '1px solid rgba(0, 240, 255, 0.25)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(0, 240, 255, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #00f0ff, #8a2be2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '800',
    fontSize: '0.9rem',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: '700',
    margin: 0,
  },
  onlineStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '2px',
  },
  greenDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#00f5a0',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.1rem',
    cursor: 'pointer',
    padding: '4px',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  messageRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
  },
  botAvatar: {
    fontSize: '1rem',
    marginBottom: '4px',
  },
  messageBubble: {
    padding: '12px 16px',
    borderRadius: '16px',
    fontSize: '0.88rem',
    lineHeight: '1.5',
    maxWidth: '82%',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  botBubble: {
    background: '#151c33',
    color: '#f1f5f9',
    border: '1px solid rgba(0, 240, 255, 0.15)',
    borderBottomLeftRadius: '4px',
  },
  userBubble: {
    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
    color: '#ffffff',
    borderBottomRightRadius: '4px',
  },
  typingDot: {
    display: 'inline-block',
    margin: '0 2px',
    color: '#00f0ff',
  },
  quickPrompts: {
    padding: '8px 12px',
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    background: '#0d1326',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  promptChip: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(0, 240, 255, 0.2)',
    color: '#70e2ff',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.74rem',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  inputContainer: {
    padding: '12px',
    background: '#070b16',
    display: 'flex',
    gap: '8px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  inputField: {
    flex: 1,
    background: '#131b31',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '0.86rem',
    outline: 'none',
  },
  sendButton: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #00f0ff, #8a2be2)',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
  },
};

