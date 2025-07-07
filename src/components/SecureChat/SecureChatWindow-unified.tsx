/**
 * SecureChatWindow-unified.tsx
 * 
 * A secure chat window component that uses the unified chat context instead of 
 * the legacy SecureChatContext. This component provides a secure messaging interface
 * with encryption indicators, security features, and the same visual styling.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useChat } from '../../context/ChatContext';
import { ThreatLevel } from '../../types/SecureChat';
import { ChatMessage } from '../../lib/chat/ChatInterface';
import styles from './SecureChatWindow.module.css';

interface SecureChatWindowProps {
  chatId: string;
  contactName: string;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isActive?: boolean;
  isMaximized?: boolean;
  isMinimized?: boolean;
  threatLevel?: ThreatLevel;
}

const SecureChatWindow: React.FC<SecureChatWindowProps> = ({
  chatId,
  contactName,
  onClose,
  onMinimize,
  onMaximize,
  isActive = true,
  isMaximized = false,
  isMinimized = false,
  threatLevel = 'normal'
}) => {
  const chat = useChat();
  const { 
    messages: allMessages, 
    sendMessage, 
    currentChannel,
    setCurrentChannel,
    joinChannel,
    markAsRead,
    isConnected,
    providerType,
    setProviderType
  } = chat;
  
  const [message, setMessage] = useState('');
  const [fileAttachments, setFileAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Current channel messages
  const messages = useMemo(() => {
    return currentChannel ? allMessages[currentChannel] || [] : [];
  }, [currentChannel, allMessages]);

  // Set channel and initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // If not connected to secure provider, switch to it
        if (isConnected && providerType !== 'secure') {
          if (typeof setProviderType === 'function') {
            setProviderType('secure');
          } else {
            console.warn('Provider type switching not available');
          }
        }
        
        // Join the channel
        if (typeof joinChannel === 'function') {
          await joinChannel(chatId);
        } else {
          console.warn('Join channel function not available');
        }
        
        // Set as current channel
        if (typeof setCurrentChannel === 'function') {
          setCurrentChannel(chatId);
        } else {
          console.warn('Set current channel function not available');
        }
        
        // Mark messages as read
        if (messages.length > 0 && typeof markAsRead === 'function') {
          const unreadMessageIds = messages
            .filter(msg => msg.status !== 'read')
            .map(msg => msg.id);
          
          if (unreadMessageIds.length > 0) {
            markAsRead(unreadMessageIds);
          }
        }
      } catch (error) {
        console.error('Failed to initialize secure chat:', error);
      }
    };
    
    if (isActive && chatId) {
      initializeChat();
    }
  }, [chatId, isActive, isConnected, joinChannel, markAsRead, messages, providerType, setCurrentChannel, setProviderType]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when window becomes active
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const handleSendMessage = async () => {
    if (!message.trim() && fileAttachments.length === 0) return;

    try {
      // Send message via chat context if available
      if (typeof sendMessage === 'function') {
        await sendMessage(message.trim(), fileAttachments);
        
        // Clear input and attachments
        setMessage('');
        setFileAttachments([]);
        
        console.log('Secure message sent:', {
          to: contactName,
          encryption: 'PQC-enabled',
          protocol: 'Earth Alliance Secure Protocol'
        });
      } else {
        console.warn('Send message function not available');
      }
    } catch (error) {
      console.error('Failed to send secure message:', error);
      // TODO: Show user-friendly error notification
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileAttachments(Array.from(e.target.files));
    }
  };

  const getThreatLevelColor = (level: ThreatLevel) => {
    switch (level) {
      case 'normal': return '#4ade80'; // green
      case 'elevated': return '#facc15'; // yellow
      case 'high': return '#f97316'; // orange
      case 'critical': return '#ef4444'; // red
      default: return '#4ade80'; // default to green
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderSecurityBadge = (msg: ChatMessage) => {
    const isEncrypted = msg.metadata?.encrypted;
    const isPQCEncrypted = msg.metadata?.pqcEncrypted;
    
    if (isPQCEncrypted) {
      return <span className={styles.securityBadge} title="Post-Quantum Encryption">PQC</span>;
    } else if (isEncrypted) {
      return <span className={styles.securityBadge} title="Standard Encryption">ENC</span>;
    }
    
    return null;
  };

  return (
    <div className={`${styles.chatWindow} ${isMaximized ? styles.maximized : ''} ${isMinimized ? styles.minimized : ''} ${isActive ? styles.active : ''}`}>
      <div className={styles.chatHeader} style={{ backgroundColor: getThreatLevelColor(threatLevel) }}>
        <div className={styles.chatInfo}>
          <span className={styles.contactName}>{contactName}</span>
          <span className={styles.securityStatus}>
            {threatLevel !== 'normal' && 
              <span className={styles.threatBadge}>{threatLevel.toUpperCase()}</span>
            }
            {providerType === 'secure' && 
              <span className={styles.securityBadge} title="Secure Chat Protocol">SECURE</span>
            }
          </span>
        </div>
        <div className={styles.chatControls}>
          <button onClick={onMinimize} className={styles.controlButton} aria-label="Minimize">―</button>
          <button onClick={onMaximize} className={styles.controlButton} aria-label="Maximize">□</button>
          <button onClick={onClose} className={styles.controlButton} aria-label="Close">×</button>
        </div>
      </div>
      <div className={styles.chatBody}>
        <div className={styles.messagesContainer}>
          {messages.map((msg) => (
            <div key={msg.id} className={`${styles.message} ${msg.senderId === currentChannel ? styles.outgoing : styles.incoming}`}>
              <div className={styles.messageHeader}>
                <span className={styles.senderName}>{msg.senderName}</span>
                <span className={styles.timestamp}>{formatTimestamp(msg.timestamp)}</span>
                {renderSecurityBadge(msg)}
              </div>
              <div className={styles.messageContent}>
                {msg.content}
              </div>
              {msg.attachments && msg.attachments.length > 0 && (
                <div className={styles.attachmentsContainer}>
                  {msg.attachments.map(attachment => (
                    <div key={attachment.id} className={styles.attachment}>
                      {attachment.type.startsWith('image/') ? (
                        <img src={attachment.url} alt={attachment.name} className={styles.attachmentImage} />
                      ) : (
                        <a href={attachment.url} download={attachment.name} className={styles.attachmentLink}>
                          {attachment.name} ({Math.round(attachment.size / 1024)} KB)
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.messageStatus}>
                {msg.status === 'sending' && <span>Sending...</span>}
                {msg.status === 'sent' && <span>Sent</span>}
                {msg.status === 'delivered' && <span>Delivered</span>}
                {msg.status === 'read' && <span>Read</span>}
                {msg.status === 'failed' && <span className={styles.errorText}>Failed</span>}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className={styles.inputArea}>
          {fileAttachments.length > 0 && (
            <div className={styles.attachmentPreview}>
              {fileAttachments.map((file, index) => (
                <div key={index} className={styles.attachmentPreviewItem}>
                  <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
                  <button
                    onClick={() => setFileAttachments(prev => prev.filter((_, i) => i !== index))}
                    className={styles.removeAttachment}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className={styles.inputContainer}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a secure message..."
              className={styles.messageInput}
              ref={inputRef}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              multiple
            />
            <button onClick={handleFileAttachment} className={styles.attachButton}>
              <span role="img" aria-label="Attach file">📎</span>
            </button>
            <button onClick={handleSendMessage} className={styles.sendButton}>
              <span role="img" aria-label="Send message">📤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureChatWindow;
