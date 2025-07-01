import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import NostrService, { NostrMessage, NostrTeamChannel } from '../../services/nostrService';
import { AgencyType, ClearanceLevel } from '../../types';
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
  const [messages, setMessages] = useState<NostrMessage[]>([]);
  const [activeChannel, setActiveChannel] = useState<NostrTeamChannel | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userDID, setUserDID] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nostrService = NostrService.getInstance();

  // Initialize user and channel
  // Initialize user and channel
  const initializeGroupChat = useCallback(async (userDid: string) => {
    try {
      if (nostrService.isReady()) {
        setIsConnected(true);
        nostrService.setUserDID(userDid);

        // Create or join group chat channel
        const channel = await nostrService.createTeamChannel(
          teamId,
          channelName,
          'CONFIDENTIAL' as ClearanceLevel,
          'CYBER_COMMAND' as AgencyType,
          'Secure group chat for team coordination'
        );

        await nostrService.joinTeamChannel(channel.id, userDid, 'CONFIDENTIAL');
        setActiveChannel(channel);
        setMessages(nostrService.getChannelMessages(channel.id));
      } else {
        setTimeout(() => initializeGroupChat(userDid), 1000);
      }
    } catch (error) {
      console.error('Failed to initialize group chat:', error);
    }
  }, [teamId, channelName, nostrService]);

  useEffect(() => {
    if (connected && publicKey) {
      const did = `did:socom:starcom:${publicKey.toString().slice(0, 16)}`;
      setUserDID(did);
      initializeGroupChat(did);
    }
  }, [connected, publicKey, initializeGroupChat]);

  // Listen for new messages
  useEffect(() => {
    const handleMessageReceived = (event: CustomEvent) => {
      const message = event.detail as NostrMessage;
      if (activeChannel && message.channelId === activeChannel.id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    };

    const handleMessageSent = (event: CustomEvent) => {
      const message = event.detail as NostrMessage;
      if (activeChannel && message.channelId === activeChannel.id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    };

    window.addEventListener('nostr-message-received', handleMessageReceived as EventListener);
    window.addEventListener('nostr-message-sent', handleMessageSent as EventListener);

    return () => {
      window.removeEventListener('nostr-message-received', handleMessageReceived as EventListener);
      window.removeEventListener('nostr-message-sent', handleMessageSent as EventListener);
    };
  }, [activeChannel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChannel || !isConnected) return;

    try {
      await nostrService.sendMessage(
        activeChannel.id,
        newMessage,
        'text'
      );
      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const formatMessageTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!connected) {
    return (
      <div className={`${styles.groupChatPanel} ${className}`}>
        <div className={styles.connectPrompt}>
          <div className={styles.connectIcon}>🔐</div>
          <h3>Connect Wallet for Group Chat</h3>  
          <p>Connect your wallet to join secure team communications</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.groupChatPanel} ${className}`}>
      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <div className={styles.channelInfo}>
          <span className={styles.channelIcon}>💬</span>
          <div>
            <h3>{channelName}</h3>
            <div className={styles.connectionStatus}>
              <span className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`}></span>
              <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.chatActions}>
          <button className={styles.actionBtn} title="Channel Settings">⚙️</button>
          <button className={styles.actionBtn} title="Member List">👥</button>
        </div>
      </div>

      {/* Messages Area */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💬</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((message, index) => (
              <div 
                key={`${message.id}-${index}`}
                className={`${styles.message} ${message.senderId === userDID ? styles.own : styles.other}`}
              >
                <div className={styles.messageHeader}>
                  <span className={styles.sender}>
                    {message.senderId === userDID ? 'You' : (message.senderId?.slice(-8) || 'Unknown')}
                  </span>
                  <span className={styles.timestamp}>
                    {formatMessageTime(message.timestamp)}
                  </span>
                </div>
                <div className={styles.messageContent}>
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className={styles.messageInput}>
        <div className={styles.inputContainer}>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
            className={styles.textInput}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!isConnected || !newMessage.trim()}
            className={styles.sendButton}
            title="Send message"
          >
            📤
          </button>
        </div>
        
        {isTyping && (
          <div className={styles.typingIndicator}>
            <span className={styles.typingDots}>...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupChatPanel;
