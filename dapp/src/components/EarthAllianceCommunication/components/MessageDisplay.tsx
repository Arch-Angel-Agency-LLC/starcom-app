import React, { useRef, useEffect } from 'react';
import { useCommunication } from '../hooks/useCommunication';
import styles from './MessageDisplay.module.css';

interface MessageItemProps {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  isEmergency: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ 
  senderId, 
  content, 
  timestamp, 
  isEmergency 
}) => {
  const date = new Date(timestamp);
  const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  
  return (
    <div className={`${styles.messageItem} ${isEmergency ? styles.emergency : ''}`}>
      <div className={styles.messageSender}>{senderId}</div>
      <div className={styles.messageContent}>{content}</div>
      <div className={styles.messageTimestamp}>{formattedTime}</div>
    </div>
  );
};

interface MessageDisplayProps {
  className?: string;
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({ className = '' }) => {
  const { 
    messages, 
    currentChannel, 
    isEmergencyMode,
    resetUnreadCount
  } = useCommunication();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Filter messages for current channel
  const channelMessages = currentChannel 
    ? messages.filter(message => message.channelId === currentChannel.id)
    : [];
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [channelMessages.length]);
  
  // Reset unread count when viewing messages
  useEffect(() => {
    if (currentChannel) {
      resetUnreadCount(currentChannel.id);
    }
  }, [currentChannel, resetUnreadCount]);
  
  // Handle empty state
  if (!currentChannel) {
    return (
      <div className={`${styles.messageDisplay} ${className}`}>
        <div className={styles.emptyState}>
          <p>Select a channel to view messages</p>
        </div>
      </div>
    );
  }
  
  if (channelMessages.length === 0) {
    return (
      <div className={`${styles.messageDisplay} ${className}`}>
        <div className={styles.emptyState}>
          <p>No messages in this channel yet</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${styles.messageDisplay} ${isEmergencyMode ? styles.emergencyMode : ''} ${className}`}>
      <div className={styles.channelHeader}>
        <h3>{currentChannel.name}</h3>
        {isEmergencyMode && <div className={styles.emergencyIndicator}>EMERGENCY MODE ACTIVE</div>}
      </div>
      
      <div className={styles.messageList}>
        {channelMessages.map(message => (
          <MessageItem
            key={message.id}
            id={message.id}
            senderId={message.senderId}
            content={message.content}
            timestamp={message.timestamp}
            isEmergency={isEmergencyMode}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
