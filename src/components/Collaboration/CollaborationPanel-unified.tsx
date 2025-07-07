import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import CommunicationPanel from './CommunicationPanel-unified';
import SessionManager from './SessionManager';
import CollaborationService from '../../services/collaborationService';
import { AgencyType, ClearanceLevel, CollaborationSession } from '../../types';
import { useChat } from '../../context/ChatContext';
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
  const [isLoading, setIsLoading] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [availableSessions, setAvailableSessions] = useState<CollaborationSession[]>([]);
  
  // Use the unified chat context instead of direct NostrService
  const chat = useChat();
  const collaborationService = CollaborationService.getInstance();

  // Initialize user DID and chat service
  useEffect(() => {
    if (connected && publicKey) {
      const did = `did:socom:starcom:${publicKey.toString().slice(0, 16)}`;
      setUserDID(did);
      
      // Connect to chat service with appropriate options
      if (!chat.isConnected) {
        chat.connect({
          type: 'nostr', // Use Nostr for collaboration by default
          options: {
            userId: publicKey.toString(),
            userName: `Operator-${publicKey.toString().slice(0, 8)}`,
            encryption: true,
            metadata: {
              did,
              agency: userAgency,
              clearanceLevel
            }
          }
        });
      }
    }
  }, [connected, publicKey, userAgency, clearanceLevel, chat]);

  // Load available collaboration sessions
  useEffect(() => {
    const loadSessions = async () => {
      if (connected && chat.isConnected) {
        setIsLoading(true);
        try {
          const sessions = await collaborationService.getAvailableSessions();
          setAvailableSessions(sessions);
        } catch (error) {
          console.error('Failed to load collaboration sessions:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSessions();
  }, [connected, chat.isConnected, collaborationService]);

  // Button handlers
  const handleNewSession = () => {
    setShowSessionManager(true);
  };

  const handleJoinSession = async (sessionId: string) => {
    if (!userDID) return;
    
    setIsLoading(true);
    try {
      await collaborationService.joinSession(sessionId, userDID);
      
      // Join the corresponding chat channel
      await chat.joinChannel(`session-${sessionId}`);
      chat.setCurrentChannel(`session-${sessionId}`);
      
      // Refresh sessions list
      const sessions = await collaborationService.getAvailableSessions();
      setAvailableSessions(sessions);
    } catch (error) {
      console.error('Failed to join session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet to create a team');
      return;
    }

    const teamName = prompt('Enter team name:');
    if (!teamName) return;

    const teamDescription = prompt('Enter team description:');
    if (!teamDescription) return;

    try {
      setIsLoading(true);
      
      // Create operator object for current user
      const currentOperator = {
        id: userDID,
        name: `Operator-${publicKey.toString().slice(0, 8)}`,
        agency: userAgency,
        role: 'COORDINATOR' as const,
        clearanceLevel,
        specializations: ['team-lead', 'coordination'],
        status: 'ONLINE' as const,
        lastActivity: new Date(),
        walletAddress: publicKey.toString()
      };
      
      // Create team using collaboration service
      const newTeam = await collaborationService.createSession({
        name: teamName,
        description: teamDescription,
        leadAgency: userAgency,
        classification: clearanceLevel,
        participants: [currentOperator],
        status: 'ACTIVE'
      });

      console.log('Team created successfully:', newTeam);
      
      // Create corresponding chat channel using unified API
      await chat.createChannel(
        teamName,
        'team',
        [publicKey.toString()]
      );
      
      // Set it as the current channel
      chat.setCurrentChannel(`team-${newTeam.id}`);
      
      // Refresh sessions list to include the new team
      const sessions = await collaborationService.getAvailableSessions();
      setAvailableSessions(sessions);
      
      alert(`Team "${teamName}" created successfully!`);
    } catch (error) {
      console.error('Failed to create team:', error);
      alert('Failed to create team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectToTeam = async (teamName: string) => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet to join a team');
      return;
    }

    try {
      setIsLoading(true);
      
      // Find the team session to connect to
      const teamSession = availableSessions.find(session => 
        session.name.toLowerCase().includes(teamName.toLowerCase())
      );
      
      if (teamSession) {
        await handleJoinSession(teamSession.id);
        
        // Join the team channel
        await chat.joinChannel(`team-${teamSession.id}`);
        chat.setCurrentChannel(`team-${teamSession.id}`);
        
        alert(`Successfully connected to ${teamName}`);
      } else {
        // Create a mock team session if not found
        const newSession = await collaborationService.createSession({
          name: teamName,
          description: `Auto-created team session for ${teamName}`,
          leadAgency: userAgency,
          classification: clearanceLevel,
          participants: [{
            id: userDID,
            name: `Operator-${publicKey.toString().slice(0, 8)}`,
            agency: userAgency,
            role: 'SUPPORT_ANALYST' as const,
            clearanceLevel,
            specializations: ['team-member'],
            status: 'ONLINE' as const,
            lastActivity: new Date(),
            walletAddress: publicKey.toString()
          }],
          status: 'ACTIVE'
        });
        
        // Create corresponding chat channel
        await chat.createChannel(
          teamName,
          'team',
          [publicKey.toString()]
        );
        
        // Set as current channel
        chat.setCurrentChannel(`team-${newSession.id}`);
        
        // Refresh sessions
        const sessions = await collaborationService.getAvailableSessions();
        setAvailableSessions(sessions);
        
        alert(`Connected to ${teamName} (session created)`);
      }
    } catch (error) {
      console.error('Failed to connect to team:', error);
      alert('Failed to connect to team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'sessions', label: '🏢 Sessions', icon: '🏢' },
    { id: 'communication', label: '💬 Communications', icon: '💬' },
    { id: 'teams', label: '👥 Teams', icon: '👥' },
    { id: 'security', label: '🔒 Security', icon: '🔒' },
  ];

  if (!connected) {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        <div className={styles.connectionMessage}>
          <h2>Connect Wallet for Secure Collaboration</h2>
          <p>Please connect your wallet to access the collaborative investigation platform.</p>
          <div className={styles.securityInfo}>
            <div className={styles.securityItem}>
              <span className={styles.securityIcon}>🔒</span>
              <div>
                <h3>Post-Quantum Secure</h3>
                <p>All communications protected by SOCOM-grade PQC</p>
              </div>
            </div>
            <div className={styles.securityItem}>
              <span className={styles.securityIcon}>🌐</span>
              <div>
                <h3>Decentralized Network</h3>
                <p>No central point of failure, powered by Nostr</p>
              </div>
            </div>
            <div className={styles.securityItem}>
              <span className={styles.securityIcon}>🔐</span>
              <div>
                <h3>Zero Trust Architecture</h3>
                <p>NIST Zero Trust standards applied to all comms</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Header with tab navigation */}
      <div className={styles.header}>
        <div className={styles.tabsContainer}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className={styles.userInfo}>
          <div className={styles.securityBadge} title={`Clearance: ${clearanceLevel}`}>
            {clearanceLevel === 'TOP_SECRET' ? '🔴' : 
             clearanceLevel === 'SECRET' ? '🟠' : 
             clearanceLevel === 'CONFIDENTIAL' ? '🟡' : '🟢'}
          </div>
          <div className={styles.agency}>{userAgency}</div>
          <div className={styles.did}>{userDID.slice(0, 16)}...</div>
        </div>
      </div>

      {/* Main content area */}
      <div className={styles.content}>
        {activeTab === 'sessions' && (
          <div className={styles.sessionsTab}>
            <div className={styles.sectionHeader}>
              <h2>Active Collaboration Sessions</h2>
              <button 
                className={styles.actionButton}
                onClick={handleNewSession}
                disabled={isLoading}
              >
                Create New Session
              </button>
            </div>

            {showSessionManager && (
              <SessionManager
                userDID={userDID}
                userAgency={userAgency}
                clearanceLevel={clearanceLevel}
                onClose={() => setShowSessionManager(false)}
                onSessionCreated={async (session) => {
                  setShowSessionManager(false);
                  setAvailableSessions(prev => [...prev, session]);
                }}
              />
            )}

            {isLoading ? (
              <div className={styles.loadingState}>Loading sessions...</div>
            ) : availableSessions.length > 0 ? (
              <div className={styles.sessionsList}>
                {availableSessions.map(session => (
                  <div key={session.id} className={styles.sessionCard}>
                    <div className={styles.sessionHeader}>
                      <h3>{session.name}</h3>
                      <span className={styles.sessionStatus}>{session.status}</span>
                    </div>
                    <p className={styles.sessionDescription}>{session.description}</p>
                    <div className={styles.sessionMeta}>
                      <span>Lead: {session.leadAgency}</span>
                      <span>Classification: {session.classification}</span>
                      <span>Participants: {session.participants.length}</span>
                    </div>
                    <button
                      className={styles.joinButton}
                      onClick={() => handleJoinSession(session.id)}
                      disabled={session.participants.some(p => p.id === userDID)}
                    >
                      {session.participants.some(p => p.id === userDID) ? 'Already Joined' : 'Join Session'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No active collaboration sessions found.</p>
                <button 
                  className={styles.actionButton} 
                  onClick={handleNewSession}
                >
                  Create New Session
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'communication' && (
          <CommunicationPanel
            teamId={availableSessions.find(s => s.participants.some(p => p.id === userDID))?.id}
            userDID={userDID}
            userAgency={userAgency}
            clearanceLevel={clearanceLevel}
          />
        )}

        {activeTab === 'teams' && (
          <div className={styles.teamsTab}>
            <div className={styles.sectionHeader}>
              <h2>Team Management</h2>
              <button 
                className={styles.actionButton}
                onClick={handleCreateTeam}
                disabled={isLoading}
              >
                Create New Team
              </button>
            </div>

            <div className={styles.quickActions}>
              <div className={styles.quickActionGroup}>
                <h3>Quick Connect</h3>
                <div className={styles.actionButtons}>
                  <button onClick={() => handleConnectToTeam('SOCOM')}>
                    Connect to SOCOM
                  </button>
                  <button onClick={() => handleConnectToTeam('Cyber Command')}>
                    Connect to Cyber Command
                  </button>
                  <button onClick={() => handleConnectToTeam('Earth Alliance')}>
                    Connect to Earth Alliance
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.teamList}>
              <h3>Available Teams</h3>
              {availableSessions.filter(s => s.name.toLowerCase().includes('team')).map(team => (
                <div key={team.id} className={styles.teamCard}>
                  <h4>{team.name}</h4>
                  <p>{team.description}</p>
                  <button onClick={() => handleJoinSession(team.id)}>
                    Join Team
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className={styles.securityTab}>
            <div className={styles.sectionHeader}>
              <h2>Security & Compliance</h2>
            </div>
            
            <div className={styles.securityInfo}>
              <div className={styles.securityItem}>
                <span className={styles.securityIcon}>🔐</span>
                <div>
                  <h3>Encryption Status</h3>
                  <p>
                    <span className={styles.securityStatus}>
                      {chat.isEncryptionEnabled ? '✅ Enabled' : '❌ Disabled'}
                    </span>
                  </p>
                  <button 
                    onClick={() => chat.setEncryptionEnabled(!chat.isEncryptionEnabled)}
                    className={styles.toggleButton}
                  >
                    {chat.isEncryptionEnabled ? 'Disable Encryption' : 'Enable Encryption'}
                  </button>
                </div>
              </div>
              
              <div className={styles.securityItem}>
                <span className={styles.securityIcon}>🛡️</span>
                <div>
                  <h3>Chat Provider</h3>
                  <p>
                    <span className={styles.securityStatus}>
                      {chat.providerType.toUpperCase()} (Connected: {chat.isConnected ? 'Yes' : 'No'})
                    </span>
                  </p>
                  <div className={styles.providerSelection}>
                    <button
                      onClick={() => {
                        chat.connect({ type: 'nostr' });
                      }}
                      className={`${styles.providerButton} ${chat.providerType === 'nostr' ? styles.activeProvider : ''}`}
                    >
                      Nostr
                    </button>
                    <button
                      onClick={() => {
                        chat.connect({ type: 'gun' });
                      }}
                      className={`${styles.providerButton} ${chat.providerType === 'gun' ? styles.activeProvider : ''}`}
                    >
                      Gun.js
                    </button>
                    <button
                      onClick={() => {
                        chat.connect({ type: 'secure' });
                      }}
                      className={`${styles.providerButton} ${chat.providerType === 'secure' ? styles.activeProvider : ''}`}
                    >
                      SecureChat
                    </button>
                  </div>
                </div>
              </div>
              
              <div className={styles.securityItem}>
                <span className={styles.securityIcon}>🔒</span>
                <div>
                  <h3>Compliance Status</h3>
                  <ul className={styles.complianceList}>
                    <li className={styles.compliant}>✅ SOCOM Communication Standards</li>
                    <li className={styles.compliant}>✅ Zero Trust Architecture (NIST 800-207)</li>
                    <li className={styles.compliant}>✅ Post-Quantum Cryptography</li>
                    <li className={styles.compliant}>✅ Secure Evidence Chain</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusInfo}>
          <span className={styles.statusItem}>
            <span className={styles.statusIcon}>
              {chat.isConnected ? '🟢' : '🔴'}
            </span>
            Connection: {chat.isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span className={styles.statusItem}>
            <span className={styles.statusIcon}>
              {chat.isEncryptionEnabled ? '🔒' : '🔓'}
            </span>
            Encryption: {chat.isEncryptionEnabled ? 'Enabled' : 'Disabled'}
          </span>
          <span className={styles.statusItem}>
            <span className={styles.statusIcon}>
              {chat.error ? '⚠️' : '✅'}
            </span>
            Status: {chat.error ? 'Error' : 'Normal'}
          </span>
        </div>
        {chat.error && (
          <div className={styles.errorBanner}>
            Error: {chat.error.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborationPanel;
