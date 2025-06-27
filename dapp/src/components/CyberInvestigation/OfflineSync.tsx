import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import styles from './OfflineSync.module.css';

// AI-NOTE: Offline sync management for cyber investigation teams
// Handles data synchronization when switching between online/offline modes

interface OfflineSyncProps {
  teamId: string;
  syncStatus: 'synced' | 'pending' | 'offline';
  setSyncStatus: (status: 'synced' | 'pending' | 'offline') => void;
}

interface SyncData {
  reports: number;
  messages: number;
  lastSync: number;
  dataSize: number; // in KB
}

const OfflineSync: React.FC<OfflineSyncProps> = ({
  teamId,
  syncStatus,
  setSyncStatus
}) => {
  const { connected } = useWallet();
  const [localData, setLocalData] = useState<SyncData>({
    reports: 0,
    messages: 0,
    lastSync: 0,
    dataSize: 0
  });
  const [isClearing, setIsClearing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  // Callback functions defined before useEffect hooks
  const calculateLocalData = useCallback(() => {
    try {
      const offlineReports = localStorage.getItem(`offline-reports-${teamId}`);
      const offlineMessages = localStorage.getItem(`offline-messages-${teamId}`);
      const reportCache = localStorage.getItem(`reports-cache-${teamId}`);
      const messageHistory = localStorage.getItem(`message-history-${teamId}`);
      const draft = localStorage.getItem(`draft-report-${teamId}`);

      let totalSize = 0;
      let reportCount = 0;
      let messageCount = 0;

      if (offlineReports) {
        const reports = JSON.parse(offlineReports);
        reportCount += reports.length;
        totalSize += new Blob([offlineReports]).size;
      }

      if (offlineMessages) {
        const messages = JSON.parse(offlineMessages);
        messageCount += messages.length;
        totalSize += new Blob([offlineMessages]).size;
      }

      if (reportCache) {
        totalSize += new Blob([reportCache]).size;
      }

      if (messageHistory) {
        totalSize += new Blob([messageHistory]).size;
      }

      if (draft) {
        totalSize += new Blob([draft]).size;
      }

      const lastSync = localStorage.getItem(`last-sync-${teamId}`);

      setLocalData({
        reports: reportCount,
        messages: messageCount,
        lastSync: lastSync ? parseInt(lastSync) : 0,
        dataSize: Math.round(totalSize / 1024) // Convert to KB
      });
    } catch (error) {
      console.error('Error calculating local data:', error);
    }
  }, [teamId]);

  const handleSync = useCallback(async () => {
    if (!navigator.onLine || !connected) {
      alert('Cannot sync while offline or wallet disconnected');
      return;
    }

    setSyncStatus('pending');
    
    try {
      // Simulate sync process
      // In real implementation, this would:
      // 1. Upload offline reports to blockchain
      // 2. Send pending messages via Nostr
      // 3. Download latest reports and messages
      // 4. Update local cache
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate sync delay

      // Update last sync time
      localStorage.setItem(`last-sync-${teamId}`, Date.now().toString());
      
      setSyncStatus('synced');
      calculateLocalData();
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('offline');
    }
  }, [connected, teamId, calculateLocalData, setSyncStatus]);

  useEffect(() => {
    calculateLocalData();
  }, [calculateLocalData]);

  // Auto-sync when coming online
  useEffect(() => {
    const handleAutoSync = () => {
      if (connected && autoSync && syncStatus === 'pending') {
        handleSync();
      }
    };

    if (navigator.onLine) {
      handleAutoSync();
    }
  }, [connected, autoSync, syncStatus, handleSync]);

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      return;
    }

    setIsClearing(true);

    try {
      // Clear all local storage for this team
      localStorage.removeItem(`offline-reports-${teamId}`);
      localStorage.removeItem(`offline-messages-${teamId}`);
      localStorage.removeItem(`reports-cache-${teamId}`);
      localStorage.removeItem(`message-history-${teamId}`);
      localStorage.removeItem(`draft-report-${teamId}`);
      localStorage.removeItem(`last-sync-${teamId}`);

      calculateLocalData();
      setSyncStatus('synced');
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    if (bytes < 1024) return `${bytes} KB`;
    return `${(bytes / 1024).toFixed(1)} MB`;
  };

  const formatLastSync = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Offline Sync & Data Management</h2>
        <div className={styles.metadata}>
          <span>Team: {teamId}</span>
        </div>
      </div>

      <div className={styles.syncSection}>
        <div className={styles.syncStatus}>
          <h3>Sync Status</h3>
          <div className={`${styles.statusIndicator} ${styles[syncStatus]}`}>
            {syncStatus === 'synced' && '✅ All data synced'}
            {syncStatus === 'pending' && '🔄 Syncing in progress...'}
            {syncStatus === 'offline' && '❌ Offline - data not synced'}
          </div>
          
          <div className={styles.lastSync}>
            Last sync: {formatLastSync(localData.lastSync)}
          </div>
        </div>

        <div className={styles.syncControls}>
          <button 
            onClick={handleSync}
            disabled={!navigator.onLine || !connected || syncStatus === 'pending'}
            className={styles.syncButton}
          >
            {syncStatus === 'pending' ? 'Syncing...' : 'Sync Now'}
          </button>

          <label className={styles.autoSyncToggle}>
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
            />
            Auto-sync when online
          </label>
        </div>
      </div>

      <div className={styles.dataSection}>
        <h3>Local Data</h3>
        
        <div className={styles.dataStats}>
          <div className={styles.dataStat}>
            <span className={styles.statValue}>{localData.reports}</span>
            <span className={styles.statLabel}>Offline Reports</span>
          </div>
          
          <div className={styles.dataStat}>
            <span className={styles.statValue}>{localData.messages}</span>
            <span className={styles.statLabel}>Pending Messages</span>
          </div>
          
          <div className={styles.dataStat}>
            <span className={styles.statValue}>{formatBytes(localData.dataSize)}</span>
            <span className={styles.statLabel}>Cache Size</span>
          </div>
        </div>

        <div className={styles.dataActions}>
          <button 
            onClick={handleClearCache}
            disabled={isClearing}
            className={styles.clearButton}
          >
            {isClearing ? 'Clearing...' : 'Clear All Local Data'}
          </button>
        </div>
      </div>

      <div className={styles.settingsSection}>
        <h3>Offline Settings</h3>
        
        <div className={styles.setting}>
          <label>Cache Management</label>
          <div className={styles.settingDescription}>
            Data is automatically cached for offline access. Reports and messages 
            are stored locally until they can be synced to the blockchain.
          </div>
        </div>

        <div className={styles.setting}>
          <label>Data Limits</label>
          <div className={styles.settingDescription}>
            Local storage is limited. Large amounts of data may be automatically 
            cleaned up to maintain app performance.
          </div>
        </div>

        <div className={styles.setting}>
          <label>Sync Frequency</label>
          <div className={styles.settingDescription}>
            Data syncs automatically when online. Manual sync can be triggered 
            at any time when connected to the internet.
          </div>
        </div>
      </div>

      <div className={styles.helpSection}>
        <h3>How Offline Mode Works</h3>
        <ul className={styles.helpList}>
          <li>📝 <strong>Reports:</strong> Submit reports offline - they'll sync when online</li>
          <li>💬 <strong>Messages:</strong> Send messages offline - they'll be sent when online</li>
          <li>📊 <strong>Viewing:</strong> View cached reports and messages even when offline</li>
          <li>🔄 <strong>Auto-sync:</strong> Everything syncs automatically when you come back online</li>
          <li>⚠️ <strong>Data Safety:</strong> Always sync before clearing browser data</li>
        </ul>
      </div>
    </div>
  );
};

export default OfflineSync;
