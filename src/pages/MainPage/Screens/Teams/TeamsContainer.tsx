import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCollaboration } from '../../../../hooks/useUnifiedGlobalCommand';
import CollaborationPanel from '../../../../components/Collaboration/CollaborationPanel';
import GroupChatPanel from '../../../../components/Collaboration/GroupChatPanel';
import EarthAllianceCommunicationPanel from '../../../../components/Collaboration/EarthAllianceCommunicationPanel';
import { TeamCollaborationHub } from '../../../../components/Teams/TeamCollaborationHub';
import { useFeatureFlag } from '../../../../utils/featureFlags';
import styles from './TeamsContainer.module.css';

interface TeamsContainerProps {
  className?: string;
}

const TeamsContainer: React.FC<TeamsContainerProps> = ({ className = '' }) => {
  const { connected, publicKey } = useWallet();
  const { currentSession, isConnected, collaborationState } = useCollaboration();
  const [activeTab, setActiveTab] = useState<'teams' | 'collaboration' | 'earth-alliance' | 'group-chat'>('teams');
  const [userDID, setUserDID] = useState<string>('');
  const collaborationEnabled = useFeatureFlag('collaborationEnabled');

  // Initialize user DID when wallet connects
  React.useEffect(() => {
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
    <div className={`${styles.teamsContainer} ${className}`}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2>Team Collaboration Hub</h2>
          <div className={styles.statusIndicator}>
            <span className={styles.statusIcon}>{operationalStatus.icon}</span>
            <span className={`${styles.statusText} ${styles[operationalStatus.class]}`}>
              {operationalStatus.text}
            </span>
          </div>
        </div>
        <div className={styles.connectionInfo}>
          {connected ? (
            <div className={styles.walletConnected}>
              <span className={styles.walletIcon}>🔐</span>
              <span className={styles.walletAddress}>
                {publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-4)}
              </span>
            </div>
          ) : (
            <div className={styles.walletDisconnected}>
              <span>🔒 Connect wallet for full access</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.tabNavigation}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.tooltip}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default TeamsContainer;
