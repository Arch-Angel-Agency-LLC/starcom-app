import React, { useState, useEffect } from 'react';
import AuthGate from '../Auth/AuthGate';
import IntelReportSubmission from './IntelReportSubmission';
import TeamCommunication from './TeamCommunication';
import IntelReportViewer from './IntelReportViewer';
import OfflineSync from './OfflineSync';
import EnhancedIPFSNostrDashboard from '../Integration/EnhancedIPFSNostrDashboard';
import styles from './CyberInvestigationMVP.module.css';

// AI-NOTE: MVP POC for small cyber investigation teams (3-9 people)
// Core features: Intel report submission, team chat, DMs, offline sync, report viewing

interface CyberInvestigationMVPProps {
  teamId?: string;
  investigationId?: string;
}

type MVPView = 'dashboard' | 'reports' | 'submit' | 'chat' | 'settings' | 'integration';

const CyberInvestigationMVP: React.FC<CyberInvestigationMVPProps> = ({
  teamId = 'mvp-team-001',
  investigationId = 'investigation-osint-001'
}) => {
  const [activeView, setActiveView] = useState<MVPView>('dashboard');
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'offline'>('synced');

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true);
      setSyncStatus('pending'); // Trigger sync when coming back online
    };
    
    const handleOffline = () => {
      setOnlineStatus(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const renderActiveView = () => {
    switch (activeView) {
      case 'submit':
        return (
          <AuthGate requirement="wallet" action="submit intel reports">
            <IntelReportSubmission 
              teamId={teamId}
              investigationId={investigationId}
              onlineStatus={onlineStatus}
            />
          </AuthGate>
        );
      
      case 'reports':
        return (
          <IntelReportViewer 
            teamId={teamId}
            investigationId={investigationId}
            onlineStatus={onlineStatus}
          />
        );
      
      case 'chat':
        return (
          <AuthGate requirement="wallet" action="access team communications">
            <TeamCommunication 
              teamId={teamId}
              onlineStatus={onlineStatus}
            />
          </AuthGate>
        );
      
      case 'settings':
        return (
          <OfflineSync 
            teamId={teamId}
            syncStatus={syncStatus}
            setSyncStatus={setSyncStatus}
          />
        );
      
      case 'integration':
        return (
          <div className={styles.integrationView}>
            <div className={styles.integrationHeader}>
              <h2>🔗 IPFS-Nostr Integration</h2>
              <p>Decentralized storage and real-time coordination for investigation data</p>
            </div>
            <EnhancedIPFSNostrDashboard 
              teamId={teamId}
              userId="current-investigator"
              className={styles.integrationDashboard}
            />
          </div>
        );
      
      default:
        return (
          <div className={styles.dashboard}>
            <div className={styles.statusCards}>
              <div className={styles.statusCard}>
                <h3>Connection Status</h3>
                <div className={`${styles.statusIndicator} ${onlineStatus ? styles.online : styles.offline}`}>
                  {onlineStatus ? '🟢 Online' : '🔴 Offline'}
                </div>
              </div>
              
              <div className={styles.statusCard}>
                <h3>Sync Status</h3>
                <div className={styles.syncStatus}>
                  {syncStatus === 'synced' && '✅ All data synced'}
                  {syncStatus === 'pending' && '🔄 Syncing...'}
                  {syncStatus === 'offline' && '📱 Working offline'}
                </div>
              </div>
              
              <div className={styles.statusCard}>
                <h3>Team Info</h3>
                <div className={styles.teamInfo}>
                  <div>Team: {teamId}</div>
                  <div>Investigation: {investigationId}</div>
                </div>
              </div>
            </div>

            <div className={styles.quickActions}>
              <button 
                className={styles.actionButton}
                onClick={() => setActiveView('submit')}
              >
                📝 Submit Intel Report
              </button>
              
              <button 
                className={styles.actionButton}
                onClick={() => setActiveView('reports')}
              >
                📊 View Reports
              </button>
              
              <button 
                className={styles.actionButton}
                onClick={() => setActiveView('chat')}
              >
                💬 Team Chat
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={styles.mvpContainer}>
      <header className={styles.header}>
        <h1>Cyber Investigation MVP</h1>
        <div className={styles.statusBar}>
          <span className={`${styles.connectionStatus} ${onlineStatus ? styles.online : styles.offline}`}>
            {onlineStatus ? 'Online' : 'Offline'}
          </span>
          <span className={styles.teamId}>Team: {teamId}</span>
        </div>
      </header>

      <nav className={styles.navigation}>
        <button 
          className={`${styles.navButton} ${activeView === 'dashboard' ? styles.active : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          🏠 Dashboard
        </button>
        
        <button 
          className={`${styles.navButton} ${activeView === 'submit' ? styles.active : ''}`}
          onClick={() => setActiveView('submit')}
        >
          📝 Submit Report
        </button>
        
        <button 
          className={`${styles.navButton} ${activeView === 'reports' ? styles.active : ''}`}
          onClick={() => setActiveView('reports')}
        >
          📊 Reports
        </button>
        
        <button 
          className={`${styles.navButton} ${activeView === 'chat' ? styles.active : ''}`}
          onClick={() => setActiveView('chat')}
        >
          💬 Chat
        </button>
        
        <button 
          className={`${styles.navButton} ${activeView === 'settings' ? styles.active : ''}`}
          onClick={() => setActiveView('settings')}
        >
          ⚙️ Sync
        </button>
        
        <button 
          className={`${styles.navButton} ${activeView === 'integration' ? styles.active : ''}`}
          onClick={() => setActiveView('integration')}
        >
          🔗 IPFS/Nostr
        </button>
      </nav>

      <main className={styles.content}>
        {renderActiveView()}
      </main>
    </div>
  );
};

export default CyberInvestigationMVP;
