import React, { useState, useEffect } from 'react';
import { AgencyType, ClearanceLevel } from '../../types';
import { useChat } from '../../context/ChatContext';
import ChatWindow from '../Chat/ChatWindow';
import styles from './CommunicationPanel.module.css';

interface CommunicationPanelProps {
  teamId?: string;
  userDID?: string;
  userAgency?: AgencyType;
  clearanceLevel?: ClearanceLevel;
}

const CommunicationPanel: React.FC<CommunicationPanelProps> = ({
  teamId = 'demo-team',
  userDID = 'did:socom:demo:user',
  userAgency = 'CYBER_COMMAND',
  clearanceLevel = 'CONFIDENTIAL'
}) => {
  // Use the unified chat context instead of direct NostrService
  const chat = useChat();
  const [channelLoaded, setChannelLoaded] = useState(false);

  // Initialize chat service and create/join channel for team
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Wait for chat to be connected
        if (chat.isConnected) {
          // Determine channel ID based on teamId
          const channelId = teamId ? `team-${teamId}` : 'global';
          
          // Check if we need to create the channel
          const existingChannel = chat.channels.find(c => c.id === channelId);
          
          if (!existingChannel) {
            // Create channel if it doesn't exist
            await chat.createChannel(
              teamId ? `${userAgency} Secure Channel` : 'Global Channel',
              teamId ? 'team' : 'global',
              [] // Will be populated as users join
            );
          }
          
          // Join the channel
          await chat.joinChannel(channelId);
          
          // Set as current channel
          chat.setCurrentChannel(channelId);
          
          setChannelLoaded(true);
        } else {
          // Connect if not already connected
          if (!chat.isConnected) {
            chat.connect({
              type: 'nostr', // Default provider for secure communications
              options: {
                userId: userDID,
                userName: userDID.split(':').pop() || 'Anonymous',
                encryption: true,
                metadata: {
                  agency: userAgency,
                  clearanceLevel,
                  did: userDID
                }
              }
            });
          }
          
          // Retry after a short delay
          setTimeout(initializeChat, 1000);
        }
      } catch (error) {
        console.error('Failed to initialize chat communication:', error);
      }
    };

    initializeChat();
  }, [teamId, userDID, userAgency, clearanceLevel, chat]);

  // Render loading state while connecting
  if (!chat.isConnected || !channelLoaded) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loader}></div>
          <p>Establishing secure communication channel...</p>
          <div className={styles.securityNotice}>
            <span className={styles.encryptionIcon}>🔒</span>
            <span>
              PQC-secured channel ({chat.isEncryptionEnabled ? 'Encrypted' : 'Unencrypted'})
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.channelInfo}>
          <h2>{teamId ? 'Team Secure Channel' : 'Global Communication'}</h2>
          <div className={styles.securityBadge}>
            <span className={styles.securityIcon}>
              {clearanceLevel === 'TOP_SECRET' ? '🔴' :
              clearanceLevel === 'SECRET' ? '🟠' :
              clearanceLevel === 'CONFIDENTIAL' ? '🟡' : '🟢'}
            </span>
            <span className={styles.clearanceText}>{clearanceLevel}</span>
          </div>
        </div>
        <div className={styles.controls}>
          <button 
            className={styles.encryptionToggle}
            onClick={() => chat.setEncryptionEnabled(!chat.isEncryptionEnabled)}
          >
            {chat.isEncryptionEnabled ? '🔒 Encryption On' : '🔓 Encryption Off'}
          </button>
        </div>
      </div>

      {/* Use the unified ChatWindow component */}
      <ChatWindow 
        showHeader={false}
        showChannelSelector={false}
        maxHeight="calc(100vh - 240px)"
        className={styles.chatWindow}
      />

      <div className={styles.footer}>
        <div className={styles.securityInfo}>
          <div className={styles.securityLabel}>
            Security Protocol: {chat.providerType === 'nostr' ? 'Nostr+PQC' : 
                              chat.providerType === 'secure' ? 'SecureChat Protocol' : 'Gun.js+WebRTC'}
          </div>
          <div className={styles.agencyInfo}>
            {userAgency} • {userDID.slice(0, 16)}...
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationPanel;
