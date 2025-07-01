import React, { useState, useRef, useEffect } from 'react';
import { useSecureChat } from '../../communication/context/useSecureChat';
import { SecureChatWindow as ChatWindow, ThreatLevel } from '../../types/SecureChat';
import styles from './SecureChatWindow.module.css';

interface SecureChatWindowProps {
  chatWindow: ChatWindow;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}

const SecureChatWindow: React.FC<SecureChatWindowProps> = ({
  chatWindow,
  onClose,
  onMinimize,
  onMaximize
}) => {
  const { state } = useSecureChat();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatWindow.messages]);

  // Focus input when window opens
  useEffect(() => {
    if (chatWindow.isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatWindow.isActive]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // TODO: Implement secure message sending through SecureChatContext
    // This would involve PQC encryption, Nostr publishing, and IPFS storage
    
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getThreatLevelColor = (level: ThreatLevel) => {
    switch (level) {
      case 'normal': return '#4ade80'; // green
      case 'elevated': return '#facc15'; // yellow
      case 'high': return '#f97316'; // orange
      case 'critical': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getSecurityIcon = () => {
    if (state.emergencyMode) return '🚨';
    if (state.stealthMode) return '👁️';
    return '🛡️';
  };

  return (
    <div 
      className={`${styles.chatWindow} ${chatWindow.isMinimized ? styles.minimized : ''} ${chatWindow.isMaximized ? styles.maximized : ''}`}
      style={{ 
        zIndex: chatWindow.zIndex,
        left: chatWindow.position.x,
        top: chatWindow.position.y,
        width: chatWindow.size.width,
        height: chatWindow.size.height
      }}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.contactInfo}>
          <div className={styles.avatar}>
            {chatWindow.contact.avatar ? (
              <img src={chatWindow.contact.avatar} alt={chatWindow.contact.displayName} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {chatWindow.contact.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className={styles.contactDetails}>
            <span className={styles.contactName}>{chatWindow.contact.displayName}</span>
            <div className={styles.statusIndicators}>
              <span 
                className={styles.onlineStatus}
                style={{ color: chatWindow.contact.isOnline ? '#4ade80' : '#6b7280' }}
              >
                {chatWindow.contact.isOnline ? '● Online' : '○ Offline'}
              </span>
              <span 
                className={styles.threatLevel}
                style={{ color: getThreatLevelColor(state.globalThreatLevel) }}
              >
                {getSecurityIcon()} {state.globalThreatLevel.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        <div className={styles.headerControls}>
          <div className={styles.trustScore}>
            <span className={styles.trustLabel}>Trust:</span>
            <span 
              className={styles.trustValue}
              style={{ 
                color: chatWindow.contact.trustScore > 0.8 ? '#4ade80' : 
                       chatWindow.contact.trustScore > 0.6 ? '#facc15' : '#ef4444'
              }}
            >
              {Math.round(chatWindow.contact.trustScore * 100)}%
            </span>
          </div>
          
          <button 
            className={styles.headerButton}
            onClick={onMinimize}
            title="Minimize"
          >
            ─
          </button>
          <button 
            className={styles.headerButton}
            onClick={onMaximize}
            title={chatWindow.isMaximized ? "Restore" : "Maximize"}
          >
            {chatWindow.isMaximized ? '❐' : '□'}
          </button>
          <button 
            className={styles.headerButton}
            onClick={onClose}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Messages Area */}
      {!chatWindow.isMinimized && (
        <>
          <div className={styles.messagesContainer}>
            <div className={styles.messages}>
              {chatWindow.messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`${styles.message} ${msg.isOutgoing ? styles.outgoing : styles.incoming}`}
                >
                  <div className={styles.messageContent}>
                    <div className={styles.messageText}>{msg.content}</div>
                    <div className={styles.messageMetadata}>
                      <span className={styles.timestamp}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      {msg.isOutgoing && (
                        <span className={styles.deliveryStatus}>
                          {msg.deliveryStatus === 'delivered' ? '✓✓' : 
                           msg.deliveryStatus === 'sent' ? '✓' : '⏳'}
                        </span>
                      )}
                      {msg.isEncrypted && (
                        <span className={styles.encryptionIndicator} title="PQC Encrypted">
                          🔒
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className={styles.inputContainer}>
            <div className={styles.inputArea}>
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a secure message..."
                className={styles.messageInput}
                disabled={state.emergencyMode}
              />
              <button 
                onClick={handleSendMessage}
                className={styles.sendButton}
                disabled={!message.trim() || state.emergencyMode}
              >
                Send
              </button>
            </div>
            
            {/* Security Status Bar */}
            <div className={styles.securityStatus}>
              <div className={styles.securityIndicators}>
                <span className={styles.pqcStatus} title="Post-Quantum Cryptography">
                  🔐 PQC-{chatWindow.contact.pqcPublicKey.securityLevel}
                </span>
                <span className={styles.nostrStatus} title="Nostr Network">
                  📡 {state.networkStatus.relayNodes} relays
                </span>
                <span className={styles.ipfsStatus} title="IPFS Network">
                  🌐 {state.networkStatus.ipfsNodes} peers
                </span>
              </div>
              
              {state.emergencyMode && (
                <div className={styles.emergencyNotice}>
                  🚨 EMERGENCY MODE - Communications restricted
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SecureChatWindow;
