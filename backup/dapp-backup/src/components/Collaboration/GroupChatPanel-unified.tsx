import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useChat } from '../../context/ChatContext';
import { AgencyType, ClearanceLevel } from '../../types';
import ChatWindow from '../Chat/ChatWindow';
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [channelLoaded, setChannelLoaded] = useState(false);
  
  // Use the unified chat context
  const chat = useChat();

  // Initialize user and channel
  const initializeGroupChat = useCallback(async () => {
    try {
      if (chat.isConnected) {
        // Determine channel ID based on teamId
        const channelId = `team-${teamId}`;
        
        // Create the channel if it doesn't exist
        if (!chat.channels.some(c => c.id === channelId)) {
          await chat.createChannel(
            channelName,
            'team',
            [publicKey?.toString() || '']
          );
        }
        
        // Join and set as current channel
        await chat.joinChannel(channelId);
        chat.setCurrentChannel(channelId);
        
        setChannelLoaded(true);
      } else {
        // Connect if not already connected
        if (!chat.isConnected) {
          const did = publicKey ? `did:socom:starcom:${publicKey.toString().slice(0, 16)}` : '';
          
          await chat.connect({
            type: 'nostr', // Default provider for team chat
            options: {
              userId: did,
              userName: did.split(':').pop() || 'Anonymous',
              encryption: true,
              metadata: {
                agency: 'CYBER_COMMAND' as AgencyType,
                clearanceLevel: 'CONFIDENTIAL' as ClearanceLevel,
                did: did
              }
            }
          });
        }
        
        // Retry after a short delay
        setTimeout(() => initializeGroupChat(), 1000);
      }
    } catch (error) {
      console.error('Failed to initialize group chat:', error);
    }
  }, [teamId, channelName, chat, publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      initializeGroupChat();
    }
  }, [connected, publicKey, initializeGroupChat]);

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
              <span className={`${styles.statusDot} ${chat.isConnected && channelLoaded ? styles.connected : styles.disconnected}`}></span>
              <span>{chat.isConnected && channelLoaded ? 'Connected' : 'Connecting...'}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.chatActions}>
          <button 
            className={styles.actionBtn} 
            title="Toggle Encryption"
            onClick={() => chat.setEncryptionEnabled(!chat.isEncryptionEnabled)}
          >
            {chat.isEncryptionEnabled ? '🔒' : '🔓'}
          </button>
          <button className={styles.actionBtn} title="Member List">👥</button>
        </div>
      </div>

      {/* Use the unified ChatWindow component */}
      <ChatWindow 
        showHeader={false}
        showChannelSelector={false}
        maxHeight="calc(100% - 100px)"
        className={styles.chatWindow}
      />
    </div>
  );
};

export default GroupChatPanel;
