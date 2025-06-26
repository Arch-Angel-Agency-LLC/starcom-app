import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import CommunicationPanel from './CommunicationPanel';
import NostrService, { NostrTeamChannel } from '../../services/nostrService';
import { AgencyType, ClearanceLevel } from '../../types';
import styles from './CollaborationPanel.module.css';

interface CollaborationPanelProps {
  className?: string;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  className
}) => {
  const { connected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<'sessions' | 'communication' | 'teams' | 'security'>('communication');
  const [userDID, setUserDID] = useState<string>('');
  const [userAgency] = useState<AgencyType>('CYBER_COMMAND');
  const [clearanceLevel] = useState<ClearanceLevel>('CONFIDENTIAL');
  const [, setTeamChannels] = useState<NostrTeamChannel[]>([]);
  const [isNostrReady, setIsNostrReady] = useState(false);
  const nostrService = NostrService.getInstance();

  // Initialize user DID and Nostr service
  useEffect(() => {
    if (connected && publicKey) {
      const did = `did:socom:starcom:${publicKey.toString().slice(0, 16)}`;
      setUserDID(did);
      nostrService.setUserDID(did);
      
      // Check if Nostr service is ready
      const checkNostrReady = () => {
        if (nostrService.isReady()) {
          setIsNostrReady(true);
          setTeamChannels(nostrService.getTeamChannels());
        } else {
          setTimeout(checkNostrReady, 500);
        }
      };
      checkNostrReady();
    }
  }, [connected, publicKey]);

  // Tab configuration
  const tabs = [
    { id: 'sessions', label: '🏢 Sessions', icon: '🏢' },
    { id: 'communication', label: '💬 Communications', icon: '💬' },
    { id: 'teams', label: '👥 Teams', icon: '👥' },
    { id: 'security', label: '🔒 Security', icon: '🔒' }
  ] as const;

  // Get security status
  const getSecurityStatus = () => {
    if (!connected) return { level: 'Disconnected', color: '#ff4444' };
    if (!isNostrReady) return { level: 'Initializing', color: '#ffaa00' };
    return { level: 'Quantum-Safe', color: '#00ff41' };
  };

  const securityStatus = getSecurityStatus();

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'communication':
        return (
          <CommunicationPanel
            teamId="starcom-main"
            userDID={userDID}
            userAgency={userAgency}
            clearanceLevel={clearanceLevel}
          />
        );
      
      case 'sessions':
        return (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h3>🏢 Collaboration Sessions</h3>
              <button className={styles.actionBtn}>New Session</button>
            </div>
            <div className={styles.sessionsList}>
              <div className={styles.sessionCard}>
                <div className={styles.sessionHeader}>
                  <span className={styles.sessionName}>Global Threat Analysis</span>
                  <span className={styles.sessionStatus}>Active</span>
                </div>
                <div className={styles.sessionMeta}>
                  <span>🏢 Multi-Agency</span>
                  <span>👥 4 participants</span>
                  <span>🔒 SECRET</span>
                </div>
                <div className={styles.sessionActions}>
                  <button className={styles.joinBtn}>Join Session</button>
                </div>
              </div>
              
              <div className={styles.sessionCard}>
                <div className={styles.sessionHeader}>
                  <span className={styles.sessionName}>Cyber Defense Coordination</span>
                  <span className={styles.sessionStatus}>Standby</span>
                </div>
                <div className={styles.sessionMeta}>
                  <span>🛡️ CYBER_COMMAND</span>
                  <span>👥 7 participants</span>
                  <span>🔒 TOP_SECRET</span>
                </div>
                <div className={styles.sessionActions}>
                  <button className={styles.joinBtn} disabled>Insufficient Clearance</button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'teams':
        return (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h3>👥 Active Teams</h3>
              <button className={styles.actionBtn}>Create Team</button>
            </div>
            <div className={styles.teamsList}>
              <div className={styles.teamCard}>
                <div className={styles.teamHeader}>
                  <span className={styles.teamName}>Alpha Response Team</span>
                  <span className={styles.teamStatus}>Deployed</span>
                </div>
                <div className={styles.teamMeta}>
                  <span>🛡️ CYBER_COMMAND</span>
                  <span>👥 5 members</span>
                  <span>📍 Sector 7</span>
                </div>
                <div className={styles.teamActions}>
                  <button className={styles.connectBtn}>Connect</button>
                </div>
              </div>

              <div className={styles.teamCard}>
                <div className={styles.teamHeader}>
                  <span className={styles.teamName}>Bravo Intelligence Unit</span>
                  <span className={styles.teamStatus}>Standby</span>
                </div>
                <div className={styles.teamMeta}>
                  <span>🔍 NSA</span>
                  <span>👥 3 members</span>
                  <span>📍 Remote</span>
                </div>
                <div className={styles.teamActions}>
                  <button className={styles.connectBtn}>Connect</button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'security':
        return (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
              <h3>🔒 Security Status</h3>
            </div>
            <div className={styles.securityDashboard}>
              <div className={styles.securityCard}>
                <h4>🔐 Encryption Status</h4>
                <div className={styles.securityItems}>
                  <div className={styles.securityItem}>
                    <span>Post-Quantum Cryptography</span>
                    <span className={styles.statusActive}>Active</span>
                  </div>
                  <div className={styles.securityItem}>
                    <span>End-to-End Encryption</span>
                    <span className={styles.statusActive}>Active</span>
                  </div>
                  <div className={styles.securityItem}>
                    <span>Message Signing</span>
                    <span className={styles.statusActive}>Active</span>
                  </div>
                </div>
              </div>

              <div className={styles.securityCard}>
                <h4>🏛️ Compliance</h4>
                <div className={styles.securityItems}>
                  <div className={styles.securityItem}>
                    <span>NIST Cybersecurity Framework</span>
                    <span className={styles.statusActive}>Compliant</span>
                  </div>
                  <div className={styles.securityItem}>
                    <span>SOCOM Standards</span>
                    <span className={styles.statusActive}>Compliant</span>
                  </div>
                  <div className={styles.securityItem}>
                    <span>Audit Logging</span>
                    <span className={styles.statusActive}>Enabled</span>
                  </div>
                </div>
              </div>

              <div className={styles.securityCard}>
                <h4>📊 Network Status</h4>
                <div className={styles.securityItems}>
                  <div className={styles.securityItem}>
                    <span>Nostr Relays</span>
                    <span className={styles.statusActive}>5 Connected</span>
                  </div>
                  <div className={styles.securityItem}>
                    <span>Latency</span>
                    <span className={styles.statusActive}>&lt; 100ms</span>
                  </div>
                  <div className={styles.securityItem}>
                    <span>Uptime</span>
                    <span className={styles.statusActive}>99.9%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div className={styles.tabContent}>Content coming soon...</div>;
    }
  };

  if (!connected) {
    return (
      <div className={`${styles.collaborationPanel} ${className || ''}`}>
        <div className={styles.connectPrompt}>
          <div className={styles.connectIcon}>🔗</div>
          <h3>Connect Wallet</h3>
          <p>Connect your wallet to access secure collaboration features</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.collaborationPanel} ${className || ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <h3>🤝 Collaboration Hub</h3>
            <div className={styles.userInfo}>
              <span className={styles.userDID}>{userDID.slice(0, 25)}...</span>
              <span className={styles.userAgency}>{userAgency.replace('_', ' ')}</span>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.securityStatus}>
              <div 
                className={styles.securityIndicator}
                style={{ backgroundColor: securityStatus.color }}
              ></div>
              <span>{securityStatus.level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default CollaborationPanel;
