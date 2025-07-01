import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCollaboration } from '../../hooks/useUnifiedGlobalCommand';
import CollaborationPanel from '../Collaboration/CollaborationPanel';
import GroupChatPanel from '../Collaboration/GroupChatPanel';
import EarthAllianceCommunicationPanel from '../Collaboration/EarthAllianceCommunicationPanel';
import { TeamCollaborationHub } from '../Teams/TeamCollaborationHub';
import { useFeatureFlag } from '../../utils/featureFlags';
import styles from './TeamCollaborationView.module.css';

interface TeamCollaborationViewProps {
  className?: string;
}

const TeamCollaborationView: React.FC<TeamCollaborationViewProps> = ({ className }) => {
  const { connected, publicKey } = useWallet();
  const { currentSession, isConnected, collaborationState } = useCollaboration();
  const [activeTab, setActiveTab] = useState<'teams' | 'collaboration' | 'earth-alliance' | 'group-chat'>('teams');
  const [userDID, setUserDID] = useState<string>('');
  const collaborationEnabled = useFeatureFlag('collaborationEnabled');

  // Initialize user DID when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      const did = `did:socom:starcom:${publicKey.toString().slice(0, 16)}`;
      setUserDID(did);
    }
  }, [connected, publicKey]);

  // Tab configuration
  const tabs = [
    { id: 'teams', label: '👥 Teams', tooltip: 'Manage and join cyber teams' },
    { id: 'collaboration', label: '🏢 Collaboration', tooltip: 'Multi-agency coordination' },
    { id: 'group-chat', label: '💬 Group Chat', tooltip: 'Secure team communications' },
    { id: 'earth-alliance', label: '🌍 Earth Alliance', tooltip: 'Global resistance operations' }
  ] as const;

  // Get current operational status
  const getOperationalStatus = () => {
    if (!collaborationEnabled) {
      return { text: 'STANDARD MODE', class: 'standard', icon: '🌍' };
    }
    
    if (currentSession && isConnected) {
      return { text: 'MULTI-AGENCY ACTIVE', class: 'connected', icon: '👥' };
    }
    
    if (collaborationState.enabled && (collaborationState.sessions.length > 0 || collaborationState.participants.length > 0)) {
      return { text: 'COLLABORATION READY', class: 'ready', icon: '🔄' };
    }
    
    return { text: 'OPERATIONAL', class: 'operational', icon: '📡' };
  };

  const operationalStatus = getOperationalStatus();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'teams':
        return (
          <div className={styles.tabContent}>
            <TeamCollaborationHub />
          </div>
        );
      
      case 'collaboration':
        return (
          <div className={styles.tabContent}>
            <CollaborationPanel />
          </div>
        );
      
      case 'group-chat':
        return (
          <div className={styles.tabContent}>
            <div className={styles.chatSection}>
              <div className={styles.sectionHeader}>
                <h3>💬 Secure Group Communications</h3>
                <div className={styles.connectionStatus}>
                  <span className={`${styles.statusDot} ${styles[operationalStatus.class]}`}></span>
                  <span>{operationalStatus.text}</span>
                </div>
              </div>
              <GroupChatPanel teamId="starcom-main" channelName="Team Alpha Chat" />
            </div>
          </div>
        );
      
      case 'earth-alliance':
        return (
          <div className={styles.tabContent}>
            <EarthAllianceCommunicationPanel
              userDID={userDID}
              operativeLevel="civilian"
              securityLevel="enhanced"
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.teamCollaborationView} ${className || ''}`}>
      {/* Header with status */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2>🎯 Team Collaboration & Communications</h2>
          <div className={styles.statusIndicator}>
            <span className={styles.statusIcon}>{operationalStatus.icon}</span>
            <span className={styles.statusText}>{operationalStatus.text}</span>
          </div>
        </div>
        
        {/* Connection status */}
        <div className={styles.connectionInfo}>
          {connected ? (
            <div className={styles.connectedBadge}>
              <span className={styles.walletIcon}>🔐</span>
              <span>Wallet Connected</span>
            </div>
          ) : (
            <div className={styles.disconnectedBadge}>
              <span className={styles.walletIcon}>🔓</span>
              <span>Connect Wallet for Full Features</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.tooltip}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.contentArea}>
        {renderTabContent()}
      </div>

      {/* Footer with quick actions */}
      <div className={styles.footer}>
        <div className={styles.quickActions}>
          <button className={styles.quickAction} title="Emergency Communications">
            🚨 Emergency
          </button>
          <button className={styles.quickAction} title="Secure File Transfer">
            📁 Transfer
          </button>
          <button className={styles.quickAction} title="Voice Channel">
            🎤 Voice
          </button>
        </div>
        
        <div className={styles.helpText}>
          Use <kbd>Ctrl+Shift+T</kbd> for quick team access
        </div>
      </div>
    </div>
  );
};

export default TeamCollaborationView;
