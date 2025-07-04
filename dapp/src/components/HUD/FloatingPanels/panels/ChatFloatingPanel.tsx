import React, { useState, useEffect, useRef } from 'react';
// import { useFloatingPanel } from '../../../../hooks/useFloatingPanel';
import { useChat } from '../../../../context/ChatContext';
import { format } from 'date-fns';
import styles from './ChatFloatingPanel.module.css';

/**
 * ChatFloatingPanel is a UI component that displays a floating chat panel.
 * It uses the ChatContext to interact with the chat system.
 */
const ChatFloatingPanel: React.FC = () => {
  // const { closePanel } = useFloatingPanel(); // Keeping the hook for potential future use
  const { 
    messages, 
    channels, 
    currentChannel, 
    isConnected, 
    isLoading, 
    error,
    sendMessage, 
    connect, 
    setCurrentChannel,
    provider
  } = useChat();
  
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState<string>('global');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Connect to chat provider if not already connected
  useEffect(() => {
    if (!isConnected && !isLoading) {
      console.log('Connecting to chat provider...');
      connect().catch(err => {
        console.error('Failed to connect to chat provider:', err);
      });
    }
  }, [isConnected, isLoading, connect]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle channel change when tab changes
  useEffect(() => {
    if (channels && channels.length > 0) {
      // Find a channel that matches the current tab type
      const channelForTab = channels.find(c => {
        if (activeTab === 'global' && c.type === 'global') return true;
        if (activeTab === 'group' && (c.type === 'team')) return true;
        if (activeTab === 'dm' && c.type === 'direct') return true;
        return false;
      });
      
      if (channelForTab && channelForTab.id !== currentChannel) {
        console.log(`Switching to channel: ${channelForTab.name} (${channelForTab.id})`);
        setCurrentChannel(channelForTab.id);
      } else if (!channelForTab) {
        console.log(`No channels found for tab: ${activeTab}`);
      }
    }
  }, [activeTab, channels, currentChannel, setCurrentChannel]);

  const handleSendMessage = () => {
    if (messageInput.trim() && currentChannel) {
      console.log(`Sending message to channel ${currentChannel}: ${messageInput.trim()}`);
      sendMessage(messageInput.trim())
        .then(() => {
          console.log('Message sent successfully');
        })
        .catch(err => {
          console.error('Failed to send message:', err);
        });
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return format(date, 'h:mm a');
    } catch (err) {
      console.error('Error formatting timestamp:', timestamp, err);
      return 'Invalid time';
    }
  };

  // State for the current user ID for message styling
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Memoize the current messages to avoid dependency issues in useEffect
  const currentMessages = React.useMemo(
    () => (currentChannel ? messages[currentChannel] || [] : []),
    [currentChannel, messages]
  );

  // Sort messages by timestamp
  const sortedMessages = React.useMemo(
    () => [...currentMessages].sort((a, b) => a.timestamp - b.timestamp),
    [currentMessages]
  );
  
  // Get current user ID from context when available
  useEffect(() => {
    // In a real implementation, we'd use a consistent method across the app
    // Since the ChatProvider interface doesn't expose a standard way to get the current user,
    // we'll use heuristics based on the message metadata
    
    if (isConnected && currentMessages.length > 0) {
      // Approach 1: Look for messages marked as "outgoing" in metadata
      const outgoingMessage = currentMessages.find(msg => msg.metadata?.isOutgoing === true);
      if (outgoingMessage) {
        setCurrentUserId(outgoingMessage.senderId);
        return;
      }
      
      // Approach 2: Check if the provider exposes a userId field
      // Note: This is using type assertion which is not ideal, but works as a fallback
      // until the chat system standardizes user identification
      const providerWithUserId = provider as { userId?: string };
      if (providerWithUserId && providerWithUserId.userId) {
        setCurrentUserId(providerWithUserId.userId);
        return;
      }
      
      // Approach 3: Use the userId from the options if available
      const providerWithOptions = provider as { options?: { userId?: string } };
      if (providerWithOptions && providerWithOptions.options && providerWithOptions.options.userId) {
        setCurrentUserId(providerWithOptions.options.userId);
        return;
      }
      
      console.warn('Could not determine current user ID for message styling');
    }
  }, [provider, isConnected, currentMessages]);

  // Sort messages by timestamp if they have timestamps

  return (
    <div className={styles.chatContainer}>
      {/* Tab Navigation */}
      <div className={styles.tabBar}>
        <button 
          className={`${styles.tab} ${activeTab === 'global' ? styles.active : ''}`}
          onClick={() => setActiveTab('global')}
          title="Global communication channel"
        >
          🌐 Global
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'group' ? styles.active : ''}`}
          onClick={() => setActiveTab('group')}
          title="Team communication channels"
        >
          👥 Team
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'dm' ? styles.active : ''}`}
          onClick={() => setActiveTab('dm')}
          title="Direct messages with other users"
        >
          💬 Direct
        </button>
      </div>

      {/* Messages Area */}    <div className={styles.messagesArea}>
      {isLoading && <div className={styles.statusMessage}>Loading messages...</div>}
      {error && <div className={styles.errorMessage}>Error: {error.message}</div>}
      {!isConnected && !isLoading && <div className={styles.statusMessage}>Connecting to chat...</div>}
      
      {isConnected && currentMessages.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💬</div>
          <div className={styles.emptyText}>No messages in this channel yet.</div>
          <div className={styles.emptySubtext}>Start the conversation!</div>
        </div>
      ) : (
        sortedMessages.map((msg) => (
            <div 
              key={msg.id} 
              className={`${styles.message} ${
                msg.senderId === currentUserId ? styles.outgoing : styles.incoming
              }`}
            >
              <div className={styles.messageHeader}>
                <span className={styles.username}>{msg.senderName || msg.senderId}</span>
                <span className={styles.timestamp}>{formatTime(msg.timestamp)}</span>
              </div>
              <div className={styles.messageContent}>{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          className={styles.messageInput}
          disabled={!isConnected}
          aria-label="Message input"
        />
        <button 
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={!messageInput.trim() || !isConnected}
          title="Send message"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatFloatingPanel;
