import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useChat } from '../../context/ChatContext';
import { format } from 'date-fns';
import styles from './GroupChatPanel.module.css';

interface GroupChatPanelProps {
  teamId?: string;
  channelName?: string;
  className?: string;
}

const GroupChatPanel: React.FC<GroupChatPanelProps> = ({
  teamId = 'starcom-main-chat',
  channelName = 'Main Team Chat',
  className = ''
}) => {
  const { connected, publicKey } = useWallet();
  const { 
    messages, 
    channels, 
    isConnected, 
    isLoading, 
    error,
    sendMessage, 
    connect, 
    setCurrentChannel,
    createChannel,
    provider
  } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [userDID, setUserDID] = useState<string>('');
  const [teamChannel, setTeamChannel] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Initialize team chat channel and connect to chat provider
  const initializeGroupChat = useCallback(async (userDid: string) => {
    try {
      // Connect to chat provider if not already connected
      if (!isConnected && !isLoading) {
        console.log('Connecting to chat provider...');
        await connect();
      }
      
      // Look for existing team channel
      const existingChannel = channels.find(c => 
        c.name === channelName || 
        c.id === teamId ||
        (c.type === 'team' && c.name.includes('Team'))
      );
      
      if (existingChannel) {
        console.log('Found existing team channel:', existingChannel.name);
        setTeamChannel(existingChannel.id);
        setCurrentChannel(existingChannel.id);
      } else {
        // Create new team channel
        console.log('Creating new team channel:', channelName);
        await createChannel(channelName, 'team', [userDid]);
        
        // The new channel should appear in channels after creation
        // We'll set it as current in the next useEffect when channels update
      }
      
    } catch (err) {
      console.error('Failed to initialize group chat:', err);
      // Error handling is managed by ChatContext
    }
  }, [teamId, channelName, isConnected, isLoading, connect, channels, createChannel, setCurrentChannel]);

  // Handle user authentication and setup
  useEffect(() => {
    if (connected && publicKey) {
      const did = `did:sol:${publicKey.toString()}`;
      setUserDID(did);
      initializeGroupChat(did).catch(err => {
        console.error('Error in chat initialization:', err);
      });
    }
  }, [connected, publicKey, initializeGroupChat]);

  // Update team channel when channels change
  useEffect(() => {
    if (channels.length > 0 && !teamChannel) {
      const newTeamChannel = channels.find(c => 
        c.name === channelName || 
        c.id === teamId ||
        (c.type === 'team' && c.name.includes('Team'))
      );
      
      if (newTeamChannel) {
        setTeamChannel(newTeamChannel.id);
        setCurrentChannel(newTeamChannel.id);
      }
    }
  }, [channels, teamChannel, channelName, teamId, setCurrentChannel]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isConnected || !teamChannel) return;
    
    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get current channel messages and info
  const currentMessages = teamChannel && messages[teamChannel] ? messages[teamChannel] : [];
  const currentChannelInfo = channels.find(c => c.id === teamChannel);
  
  // Get current user ID for message styling
  const currentUserId = React.useMemo(() => {
    // Try multiple approaches to get the current user ID
    const providerWithUserId = provider as { userId?: string };
    if (providerWithUserId?.userId) return providerWithUserId.userId;
    
    const providerWithOptions = provider as { options?: { userId?: string } };
    if (providerWithOptions?.options?.userId) return providerWithOptions.options.userId;
    
    return userDID;
  }, [provider, userDID]);

  // Format timestamp
  const formatTime = (timestamp: number) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch (err) {
      console.error('Error formatting timestamp:', timestamp, err);
      return 'Invalid time';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`${styles.groupChatPanel} ${className}`}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <div>Loading secure communication channel...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${styles.groupChatPanel} ${className}`}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorTitle}>Communication Channel Error</div>
          <div className={styles.errorMessage}>{error.message}</div>
          <div className={styles.errorHint}>
            This may be due to a temporary network issue or maintenance on the communication network.
          </div>
          <button 
            className={styles.retryButton}
            onClick={() => {
              if (userDID) {
                initializeGroupChat(userDID);
              }
            }}
          >
            Retry Connection
          </button>
          <button 
            className={styles.fallbackButton}
            onClick={() => {
              // TODO: In Phase 3, this would switch to an alternative protocol
              window.location.reload();
            }}
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className={`${styles.groupChatPanel} ${className}`}>
        <div className={styles.disconnectedContainer}>
          <div className={styles.disconnectedIcon}>📡</div>
          <div className={styles.disconnectedTitle}>Communication Service Unavailable</div>
          <div className={styles.disconnectedMessage}>
            The Earth Alliance communication system is currently unavailable. Our technical team has been notified.
          </div>
          <div className={styles.troubleshootingHints}>
            <h4>Troubleshooting Steps:</h4>
            <ul>
              <li>Check your internet connection</li>
              <li>Verify your wallet is connected</li>
              <li>Try again in a few minutes</li>
            </ul>
          </div>
          <button 
            className={styles.reconnectButton}
            onClick={() => {
              if (userDID) {
                initializeGroupChat(userDID);
              }
            }}
          >
            Attempt Reconnection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.groupChatPanel} ${className}`}>
      {/* Channel header */}
      <div className={styles.channelHeader}>
        <div className={styles.channelInfo}>
          <div className={styles.channelName}>{currentChannelInfo?.name || channelName}</div>
          <div className={styles.channelDescription}>
            {currentChannelInfo?.metadata?.description || 'Secure team communication'}
          </div>
        </div>
        <div className={styles.channelStatus}>
          <div className={styles.statusIndicator}></div>
          <div className={styles.statusText}>SECURE</div>
        </div>
      </div>

      {/* Messages area */}
      <div className={styles.messagesContainer}>
        {currentMessages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💬</div>
            <div className={styles.emptyText}>No messages yet. Start the conversation!</div>
          </div>
        ) : (
          currentMessages.map((msg) => (
            <div 
              key={msg.id} 
              className={`${styles.messageItem} ${
                msg.senderId === currentUserId ? styles.outgoingMessage : styles.incomingMessage
              }`}
            >
              <div className={styles.messageSender}>
                {msg.senderId === currentUserId ? 'You' : (msg.senderName || msg.senderId)}
              </div>
              <div className={styles.messageContent}>{msg.content}</div>
              <div className={styles.messageTime}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          className={styles.messageInput}
          placeholder="Type your message here..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button 
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || !isConnected}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default GroupChatPanel;
