/**
 * ChatWindow.tsx
 * 
 * A unified chat window component that uses the ChatContext.
 * This component replaces the various chat implementations with a single, consistent UI.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import styles from './ChatWindow.module.css';

interface ChatWindowProps {
  className?: string;
  showHeader?: boolean;
  showChannelSelector?: boolean;
  showUserList?: boolean;
  maxHeight?: string | number;
}

export default function ChatWindow({
  className = '',
  showHeader = true,
  showChannelSelector = true,
  showUserList = true,
  maxHeight = '100%'
}: ChatWindowProps) {
  const { 
    messages, 
    users, 
    channels, 
    currentChannel, 
    sendMessage, 
    setCurrentChannel,
    isLoading,
    error,
    loadMoreMessages,
    providerType
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Current channel messages and users
  const currentMessages = currentChannel ? messages[currentChannel] || [] : [];
  const currentUsers = currentChannel ? users[currentChannel] || [] : [];
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Load more messages when scrolling to top
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      
      // If scrolled to the top, load more messages
      if (scrollTop === 0 && currentMessages.length > 0) {
        loadMoreMessages(20).catch(err => {
          console.error('Failed to load more messages:', err);
        });
      }
    }
  };

  // Handle sending a message
  const handleSend = async () => {
    if ((!messageText.trim() && attachments.length === 0) || isSending || !currentChannel) {
      return;
    }

    try {
      setIsSending(true);
      await sendMessage(messageText, attachments);
      setMessageText('');
      setAttachments([]);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle pressing Enter to send
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files].slice(0, 5)); // Limit to 5 files
  };

  // Remove an attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if a user is online
  const isUserOnline = (userId: string) => {
    return currentUsers.some(user => user.id === userId && user.status === 'online');
  };

  if (isLoading && currentMessages.length === 0) {
    return (
      <div className={`${styles.container} ${className}`} style={{ maxHeight }}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Connecting to chat network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`} style={{ maxHeight }}>
      {/* Header */}
      {showHeader && (
        <div className={styles.header}>
          <div className={styles.channelInfo}>
            <h3>{currentChannel ? channels.find(c => c.id === currentChannel)?.name || 'Chat' : 'Chat'}</h3>
            <span className={styles.providerBadge}>
              {providerType === 'gun' && 'P2P (Gun.js)'}
              {providerType === 'nostr' && 'Nostr'}
              {providerType === 'secure' && 'Secure (PQC)'}
              {providerType === 'unified' && 'Unified'}
            </span>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              <span className={styles.errorIcon}>⚠️</span>
              {error.message}
            </div>
          )}
        </div>
      )}

      <div className={styles.chatLayout}>
        {/* Channel Selector */}
        {showChannelSelector && channels.length > 0 && (
          <div className={styles.channelList}>
            <h4>Channels</h4>
            <ul>
              {channels.map(channel => (
                <li 
                  key={channel.id}
                  className={`${styles.channelItem} ${currentChannel === channel.id ? styles.activeChannel : ''}`}
                  onClick={() => setCurrentChannel(channel.id)}
                >
                  <div className={styles.channelName}>
                    {channel.type === 'direct' && '👤 '}
                    {channel.type === 'team' && '👥 '}
                    {channel.type === 'global' && '🌐 '}
                    {channel.name}
                  </div>
                  {channel.unreadCount && channel.unreadCount > 0 && (
                    <span className={styles.unreadBadge}>{channel.unreadCount}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Messages Area */}
        <div className={styles.messagesContainer}>
          <div 
            className={styles.messages} 
            ref={messagesContainerRef} 
            onScroll={handleScroll}
          >
            {currentChannel && currentMessages.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>💬</div>
                <h3>No messages yet</h3>
                <p>Start the conversation!</p>
              </div>
            ) : (
              currentMessages.map((msg) => {
                const isOwn = msg.senderId === users.flatMap(u => u)[0]?.id; // Simplified - assumes current user is first in list
                const isOnline = isUserOnline(msg.senderId);

                return (
                  <div
                    key={msg.id}
                    className={`${styles.message} ${isOwn ? styles.messageOwn : styles.messageOther} ${msg.type === 'system' ? styles.messageSystem : ''}`}
                  >
                    <div className={styles.messageContent}>
                      {!isOwn && (
                        <div className={styles.messageSender}>
                          <span className={styles.senderName}>
                            {msg.senderName}
                          </span>
                          {isOnline && (
                            <div className={styles.onlineIndicator} />
                          )}
                        </div>
                      )}
                      
                      <div className={styles.messageBody}>
                        <p className={styles.messageText}>{msg.content}</p>
                        
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className={styles.attachments}>
                            {msg.attachments.map((att, idx) => (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.attachment}
                              >
                                <span className={styles.attachmentIcon}>📎</span>
                                <span className={styles.attachmentName}>{att.name}</span>
                                <span className={styles.attachmentSize}>
                                  ({(att.size / 1024).toFixed(1)}KB)
                                </span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className={styles.messageTime}>
                        {formatTime(msg.timestamp)}
                        {msg.status === 'sending' && (
                          <span className={styles.statusIcon}>⏳</span>
                        )}
                        {msg.status === 'sent' && (
                          <span className={styles.statusIcon}>✓</span>
                        )}
                        {msg.status === 'delivered' && (
                          <span className={styles.statusIcon}>✓✓</span>
                        )}
                        {msg.status === 'read' && (
                          <span className={styles.statusIcon}>✓✓</span>
                        )}
                        {msg.status === 'failed' && (
                          <span className={styles.statusIcon}>❌</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className={styles.inputContainer}>
            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className={styles.attachmentsPreview}>
                {attachments.map((file, idx) => (
                  <div key={idx} className={styles.attachmentPreview}>
                    <span className={styles.attachmentPreviewName}>{file.name}</span>
                    <span className={styles.attachmentPreviewSize}>
                      ({(file.size / 1024).toFixed(1)}KB)
                    </span>
                    <button
                      className={styles.removeAttachment}
                      onClick={() => removeAttachment(idx)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.inputControls}>
              <button
                className={styles.attachButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={!currentChannel}
              >
                📎
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                multiple
              />
              
              <textarea
                className={styles.messageInput}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                disabled={!currentChannel || isSending}
              />
              
              <button
                className={styles.sendButton}
                onClick={handleSend}
                disabled={(!messageText.trim() && attachments.length === 0) || !currentChannel || isSending}
              >
                {isSending ? '⏳' : '↑'}
              </button>
            </div>
          </div>
        </div>

        {/* User List */}
        {showUserList && currentUsers.length > 0 && (
          <div className={styles.userList}>
            <h4>Users ({currentUsers.length})</h4>
            <ul>
              {currentUsers.map(user => (
                <li key={user.id} className={styles.userItem}>
                  <div className={styles.userInfo}>
                    <span className={`${styles.userStatus} ${styles[user.status]}`} />
                    <span className={styles.userName}>{user.name}</span>
                  </div>
                  {user.agency && (
                    <span className={styles.userAgency}>{user.agency}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
