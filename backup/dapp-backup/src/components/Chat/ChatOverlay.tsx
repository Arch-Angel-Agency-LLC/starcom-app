import React, { useState, useEffect } from 'react';
import styles from './ChatOverlay.module.css';

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  type: 'global' | 'group' | 'dm';
}

// TODO: Add support for investigation branching and alternative hypothesis tracking - PRIORITY: MEDIUM
const ChatOverlay: React.FC<ChatOverlayProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'global' | 'group' | 'dm'>('global');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      user: 'Sentinel-Alpha',
      message: 'Global threat assessment complete. All systems operational.',
      timestamp: new Date(Date.now() - 300000),
      type: 'global'
    },
    {
      id: '2',
      user: 'Cyber-Delta',
      message: 'Detecting anomalous network activity in sector 7.',
      timestamp: new Date(Date.now() - 120000),
      type: 'global'
    },
    {
      id: '3',
      user: 'Command-Zero',
      message: 'Initiating protocol Omega. All units standby.',
      timestamp: new Date(Date.now() - 60000),
      type: 'global'
    }
  ]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        user: 'You',
        message: message.trim(),
        timestamp: new Date(),
        type: activeTab
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredMessages = messages.filter(msg => msg.type === activeTab);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.chatContainer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>
            <span className={styles.icon}>💬</span>
            <span>Quantum Communications Hub</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'global' ? styles.active : ''}`}
            onClick={() => setActiveTab('global')}
          >
            <span className={styles.tabIcon}>🌐</span>
            <span>Global Chat</span>
            <span className={styles.badge}>12</span>
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'group' ? styles.active : ''}`}
            onClick={() => setActiveTab('group')}
          >
            <span className={styles.tabIcon}>👥</span>
            <span>Group Chat</span>
            <span className={styles.badge}>5</span>
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'dm' ? styles.active : ''}`}
            onClick={() => setActiveTab('dm')}
          >
            <span className={styles.tabIcon}>💼</span>
            <span>Direct Messages</span>
            <span className={styles.badge}>3</span>
          </button>
        </div>

        {/* Messages Area */}
        <div className={styles.messagesArea}>
          <div className={styles.messagesList}>
            {filteredMessages.map((msg) => (
              <div key={msg.id} className={`${styles.message} ${msg.user === 'You' ? styles.own : ''}`}>
                <div className={styles.messageHeader}>
                  <span className={styles.username}>{msg.user}</span>
                  <span className={styles.timestamp}>{formatTime(msg.timestamp)}</span>
                </div>
                <div className={styles.messageContent}>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className={styles.inputArea}>
          <div className={styles.inputContainer}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Send to ${activeTab === 'global' ? 'Global Chat' : activeTab === 'group' ? 'Group Chat' : 'Direct Messages'}...`}
              className={styles.messageInput}
            />
            <button 
              onClick={handleSendMessage}
              className={styles.sendBtn}
              disabled={!message.trim()}
            >
              📡
            </button>
          </div>
          <div className={styles.inputHint}>
            <span>🔐 Quantum-encrypted • Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatOverlay;
