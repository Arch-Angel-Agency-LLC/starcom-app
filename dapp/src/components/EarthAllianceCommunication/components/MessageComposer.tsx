import React, { useState, useRef, useEffect } from 'react';
import { useCommunication } from '../hooks/useCommunication';
import styles from './MessageComposer.module.css';

interface MessageComposerProps {
  className?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ className = '' }) => {
  const [message, setMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    currentChannel, 
    sendMessage, 
    connectionState,
    isEmergencyMode
  } = useCommunication();
  
  // Focus input when channel changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentChannel?.id]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !currentChannel) {
      return;
    }
    
    try {
      await sendMessage({
        content: message.trim(),
        priority: isUrgent ? 3 : isEmergencyMode ? 2 : 0,
      });
      setMessage('');
      setIsUrgent(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Error handling could be improved with a toast notification
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const isDisabled = 
    !currentChannel || 
    connectionState !== 'connected' || 
    message.trim() === '';
  
  return (
    <form 
      className={`${styles.composer} ${isEmergencyMode ? styles.emergencyMode : ''} ${className}`} 
      onSubmit={handleSubmit}
    >
      {connectionState !== 'connected' && (
        <div className={styles.connectionWarning}>
          {connectionState === 'connecting' 
            ? 'Connecting...' 
            : connectionState === 'error' 
              ? 'Connection error' 
              : 'Disconnected'}
        </div>
      )}
      
      <div className={styles.inputContainer}>
        <textarea
          ref={inputRef}
          className={styles.messageInput}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            !currentChannel 
              ? 'Select a channel first' 
              : connectionState !== 'connected' 
                ? 'Waiting for connection...'
                : isEmergencyMode 
                  ? 'Emergency message...' 
                  : 'Type your message...'
          }
          disabled={!currentChannel || connectionState !== 'connected'}
          rows={2}
        />
        
        {isEmergencyMode && (
          <div className={styles.urgencyToggle}>
            <label>
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                disabled={!currentChannel || connectionState !== 'connected'}
              />
              <span>URGENT</span>
            </label>
          </div>
        )}
        
        <button 
          type="submit" 
          className={styles.sendButton}
          disabled={isDisabled}
        >
          Send
        </button>
      </div>
    </form>
  );
};
