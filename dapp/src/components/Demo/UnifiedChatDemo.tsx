/**
 * UnifiedChatDemo.tsx
 * 
 * A demo component that showcases the unified chat system.
 * This demonstrates how to use the ChatContext and ChatWindow component.
 */

import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import ChatWindow from '../Chat/ChatWindow';
import { ChatProviderType } from '../../lib/chat/ChatProviderFactory';
import styles from './UnifiedChatDemo.module.css';

export default function UnifiedChatDemo() {
  const { 
    connect, 
    disconnect, 
    isConnected, 
    isLoading, 
    error, 
    providerType, 
    setProviderType,
    createChannel,
    channels
  } = useChat();
  
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [showLogin, setShowLogin] = useState<boolean>(true);
  
  // Connect to chat provider when userId and userName are provided
  useEffect(() => {
    if (userId && userName && !isConnected && !isLoading && showLogin === false) {
      connect({
        type: providerType,
        options: {
          userId,
          userName
        }
      }).catch(err => {
        console.error('Failed to connect to chat provider:', err);
      });
    }
  }, [userId, userName, isConnected, isLoading, showLogin, connect, providerType]);
  
  // Handle login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId && userName) {
      setShowLogin(false);
    }
  };
  
  // Handle provider change
  const handleProviderChange = (type: ChatProviderType) => {
    if (isConnected) {
      disconnect().then(() => {
        setProviderType(type);
      }).catch(err => {
        console.error('Failed to disconnect from chat provider:', err);
      });
    } else {
      setProviderType(type);
    }
  };
  
  // Handle creating a new channel
  const handleCreateChannel = () => {
    const channelName = prompt('Enter channel name:');
    if (channelName) {
      createChannel(channelName, 'team', [userId]).catch(err => {
        console.error('Failed to create channel:', err);
      });
    }
  };
  
  // Render login form if not connected
  if (showLogin) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <h2>Unified Chat Demo</h2>
          <p>Enter your user information to continue</p>
          
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label htmlFor="userId">User ID</label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your user ID"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="userName">Display Name</label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your display name"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="providerType">Chat Provider</label>
              <select
                id="providerType"
                value={providerType}
                onChange={(e) => setProviderType(e.target.value as ChatProviderType)}
              >
                <option value="gun">Gun.js (P2P)</option>
                <option value="nostr">Nostr (Decentralized)</option>
                <option value="secure">SecureChat (PQC)</option>
              </select>
            </div>
            
            <button type="submit" className={styles.loginButton}>
              Connect to Chat
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Unified Chat Demo</h2>
        
        <div className={styles.controls}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userId}>{userId}</span>
          </div>
          
          <div className={styles.providerSelector}>
            <label>Provider:</label>
            <div className={styles.providerButtons}>
              <button
                className={`${styles.providerButton} ${providerType === 'gun' ? styles.active : ''}`}
                onClick={() => handleProviderChange('gun')}
                disabled={providerType === 'gun'}
              >
                Gun.js
              </button>
              <button
                className={`${styles.providerButton} ${providerType === 'nostr' ? styles.active : ''}`}
                onClick={() => handleProviderChange('nostr')}
                disabled={providerType === 'nostr'}
              >
                Nostr
              </button>
              <button
                className={`${styles.providerButton} ${providerType === 'secure' ? styles.active : ''}`}
                onClick={() => handleProviderChange('secure')}
                disabled={providerType === 'secure'}
              >
                SecureChat
              </button>
            </div>
          </div>
          
          <button
            className={styles.createChannelButton}
            onClick={handleCreateChannel}
            disabled={!isConnected}
          >
            Create Channel
          </button>
          
          <button
            className={styles.logoutButton}
            onClick={() => {
              disconnect().then(() => {
                setShowLogin(true);
              });
            }}
          >
            Logout
          </button>
        </div>
      </div>
      
      {error && (
        <div className={styles.errorBanner}>
          <span className={styles.errorIcon}>⚠️</span>
          {error.message}
        </div>
      )}
      
      <div className={styles.status}>
        <div className={styles.statusIndicator}>
          <span className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`}></span>
          <span className={styles.statusText}>
            {isLoading ? 'Connecting...' : (isConnected ? 'Connected' : 'Disconnected')}
          </span>
        </div>
        
        <div className={styles.channelCount}>
          <span>{channels.length} channel(s) available</span>
        </div>
      </div>
      
      <div className={styles.chatContainer}>
        <ChatWindow />
      </div>
    </div>
  );
}
