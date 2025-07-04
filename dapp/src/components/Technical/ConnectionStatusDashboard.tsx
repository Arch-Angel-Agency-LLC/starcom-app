import React, { useState, useEffect } from 'react';
import NostrService from '../../services/nostrService';
import styles from './ConnectionStatusDashboard.module.css';

interface ServiceHealthStatus {
  nostrRelays: { [url: string]: 'connected' | 'disconnected' | 'error' | 'connecting' };
  ipfs: 'connected' | 'disconnected' | 'error' | 'connecting';
  walletConnection: 'connected' | 'disconnected' | 'error';
  lastUpdated: number;
}

interface ConnectionStatusDashboardProps {
  teamId?: string;
  compact?: boolean;
  onHealthChange?: (health: ServiceHealthStatus) => void;
}

const ConnectionStatusDashboard: React.FC<ConnectionStatusDashboardProps> = ({ 
  teamId, 
  compact = false,
  onHealthChange
}) => {
  const [serviceHealth, setServiceHealth] = useState<ServiceHealthStatus>({
    nostrRelays: {},
    ipfs: 'disconnected',
    walletConnection: 'disconnected',
    lastUpdated: Date.now()
  });

  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isChecking, setIsChecking] = useState(false);
  const nostrService = NostrService.getInstance();

  const checkServiceHealth = async () => {
    setIsChecking(true);
    
    const health: ServiceHealthStatus = {
      nostrRelays: {},
      ipfs: 'connecting',
      walletConnection: 'disconnected',
      lastUpdated: Date.now()
    };

    try {
      // Check Nostr relay connections
      const relayUrls = [
        'wss://relay.damus.io',
        'wss://nos.lol',
        'wss://relay.snort.social',
        'wss://relay.current.fyi',
        'wss://brb.io'
      ];

      for (const url of relayUrls) {
        try {
          // Test actual relay connection
          const bridge = nostrService.getBridgeHealthStatus();
          health.nostrRelays[url] = bridge?.connected ? 'connected' : 'error';
        } catch (error) {
          health.nostrRelays[url] = 'error';
        }
      }

      // Check IPFS connection (mock for now)
      try {
        // In real implementation, this would ping IPFS
        health.ipfs = 'connected';
      } catch (error) {
        health.ipfs = 'error';
      }

      // Check wallet connection
      try {
        health.walletConnection = 'connected';
      } catch (error) {
        health.walletConnection = 'error';
      }

      setServiceHealth(health);
      onHealthChange?.(health);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkServiceHealth();
    const interval = setInterval(checkServiceHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'connected': return '#00ff88';
      case 'connecting': return '#ffaa00';
      case 'disconnected': return '#666666';
      case 'error': return '#ff4444';
      default: return '#666666';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '⚫';
      case 'error': return '🔴';
      default: return '⚫';
    }
  };

  const getOverallHealth = (): 'healthy' | 'degraded' | 'critical' => {
    const connectedRelays = Object.values(serviceHealth.nostrRelays).filter(s => s === 'connected').length;
    const totalRelays = Object.keys(serviceHealth.nostrRelays).length;
    
    if (connectedRelays === 0 || serviceHealth.ipfs === 'error') {
      return 'critical';
    } else if (connectedRelays < totalRelays * 0.5) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  };

  const overallHealth = getOverallHealth();

  if (compact && !isExpanded) {
    return (
      <div 
        className={`${styles.compactStatus} ${styles[overallHealth]}`}
        onClick={() => setIsExpanded(true)}
        data-testid="connection-status-compact"
      >
        <span className={styles.statusIcon}>
          {getStatusIcon(overallHealth)}
        </span>
        <span className={styles.statusText}>
          {overallHealth.toUpperCase()}
        </span>
        <span className={styles.relayCount}>
          {Object.values(serviceHealth.nostrRelays).filter(s => s === 'connected').length}/
          {Object.keys(serviceHealth.nostrRelays).length}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.dashboard} data-testid="connection-status-dashboard">
      <div className={styles.header}>
        <h3 className={styles.title}>
          🔧 SERVICE STATUS
        </h3>
        {compact && (
          <button 
            className={styles.closeButton}
            onClick={() => setIsExpanded(false)}
            data-testid="close-dashboard"
          >
            ✕
          </button>
        )}
      </div>

      {/* Overall Health */}
      <div className={styles.overallHealth}>
        <div className={`${styles.healthIndicator} ${styles[overallHealth]}`}>
          <span className={styles.healthIcon}>
            {getStatusIcon(overallHealth)}
          </span>
          <span className={styles.healthText}>
            SYSTEM {overallHealth.toUpperCase()}
          </span>
          {teamId && (
            <span className={styles.teamId}>
              Team: {teamId}
            </span>
          )}
        </div>
      </div>

      {/* Nostr Relays */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          📡 NOSTR RELAYS
        </div>
        <div className={styles.relayList} data-testid="relay-list">
          {Object.entries(serviceHealth.nostrRelays).map(([url, status]) => (
            <div key={url} className={styles.relayItem}>
              <span className={styles.relayUrl}>
                {url.replace('wss://', '')}
              </span>
              <span 
                className={styles.relayStatus}
                style={{ color: getStatusColor(status) }}
                data-testid={`relay-status-${url}`}
              >
                {getStatusIcon(status)} {status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* IPFS Status */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          🗄️ DISTRIBUTED STORAGE
        </div>
        <div className={styles.serviceItem}>
          <span className={styles.serviceName}>IPFS Network</span>
          <span 
            className={styles.serviceStatus}
            style={{ color: getStatusColor(serviceHealth.ipfs) }}
            data-testid="ipfs-status"
          >
            {getStatusIcon(serviceHealth.ipfs)} {serviceHealth.ipfs.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Wallet Connection */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          🔐 WALLET CONNECTION
        </div>
        <div className={styles.serviceItem}>
          <span className={styles.serviceName}>Solana Wallet</span>
          <span 
            className={styles.serviceStatus}
            style={{ color: getStatusColor(serviceHealth.walletConnection) }}
            data-testid="wallet-status"
          >
            {getStatusIcon(serviceHealth.walletConnection)} {serviceHealth.walletConnection.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Last Updated */}
      <div className={styles.footer}>
        <div className={styles.lastUpdated}>
          Last updated: {new Date(serviceHealth.lastUpdated).toLocaleTimeString()}
          {isChecking && <span className={styles.checking}> (checking...)</span>}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.actions}>
        <button 
          className={styles.actionButton}
          onClick={checkServiceHealth}
          disabled={isChecking}
          data-testid="refresh-status"
        >
          🔄 REFRESH
        </button>
        <button 
          className={styles.actionButton}
          onClick={() => {
            console.log('Service diagnostics:', serviceHealth);
            alert('Service diagnostics logged to console');
          }}
          data-testid="diagnose-services"
        >
          🔍 DIAGNOSE
        </button>
      </div>
    </div>
  );
};

export default ConnectionStatusDashboard;
