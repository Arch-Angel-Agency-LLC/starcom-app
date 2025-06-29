/**
 * IntelStatusIndicator - Real-time status display component
 * Shows current status of Intel Reports system with live updates
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './IntelStatusIndicator.module.css';

interface IntelStatusIndicatorProps {
  /** Current connection status */
  connectionStatus?: 'connected' | 'connecting' | 'disconnected' | 'error';
  /** Data sync status */
  syncStatus?: 'synced' | 'syncing' | 'pending' | 'error';
  /** Last update timestamp */
  lastUpdate?: Date;
  /** Error message if any */
  error?: string | null;
  /** Number of pending operations */
  pendingOperations?: number;
  /** Whether to show detailed status */
  showDetails?: boolean;
  /** Whether to animate status changes */
  animated?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Position for floating display */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Whether to auto-hide when healthy */
  autoHide?: boolean;
  /** Callback when status is clicked */
  onClick?: () => void;
  /** Custom CSS class */
  className?: string;
}

interface StatusConfig {
  label: string;
  icon: string;
  color: string;
  pulse?: boolean;
}

const CONNECTION_STATUS_CONFIG: Record<string, StatusConfig> = {
  connected: {
    label: 'Connected',
    icon: '🟢',
    color: 'var(--success-color, #10b981)',
    pulse: false
  },
  connecting: {
    label: 'Connecting',
    icon: '🟡',
    color: 'var(--warning-color, #f59e0b)',
    pulse: true
  },
  disconnected: {
    label: 'Disconnected',
    icon: '🔴',
    color: 'var(--error-color, #ef4444)',
    pulse: false
  },
  error: {
    label: 'Connection Error',
    icon: '❌',
    color: 'var(--error-color, #ef4444)',
    pulse: true
  }
};

const SYNC_STATUS_CONFIG: Record<string, StatusConfig> = {
  synced: {
    label: 'Synced',
    icon: '✅',
    color: 'var(--success-color, #10b981)',
    pulse: false
  },
  syncing: {
    label: 'Syncing',
    icon: '🔄',
    color: 'var(--info-color, #3b82f6)',
    pulse: true
  },
  pending: {
    label: 'Pending',
    icon: '⏳',
    color: 'var(--warning-color, #f59e0b)',
    pulse: false
  },
  error: {
    label: 'Sync Error',
    icon: '⚠️',
    color: 'var(--error-color, #ef4444)',
    pulse: true
  }
};

/**
 * Format time ago string
 */
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) {
    return 'just now';
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
};

/**
 * IntelStatusIndicator - Real-time status display
 */
export const IntelStatusIndicator: React.FC<IntelStatusIndicatorProps> = ({
  connectionStatus = 'connected',
  syncStatus = 'synced',
  lastUpdate,
  error,
  pendingOperations = 0,
  showDetails = false,
  animated = true,
  size = 'medium',
  position,
  autoHide = false,
  onClick,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeAgo, setTimeAgo] = useState('');

  // Update time ago periodically
  useEffect(() => {
    if (!lastUpdate) return;

    const updateTimeAgo = () => {
      setTimeAgo(formatTimeAgo(lastUpdate));
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [lastUpdate]);

  // Auto-hide logic
  useEffect(() => {
    if (autoHide) {
      const isHealthy = connectionStatus === 'connected' && 
                       syncStatus === 'synced' && 
                       !error && 
                       pendingOperations === 0;
      
      if (isHealthy && isVisible) {
        const timer = setTimeout(() => setIsVisible(false), 3000);
        return () => clearTimeout(timer);
      } else if (!isHealthy && !isVisible) {
        setIsVisible(true);
      }
    }
  }, [autoHide, connectionStatus, syncStatus, error, pendingOperations, isVisible]);

  // Handle click
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else if (autoHide && !isVisible) {
      setIsVisible(true);
    }
  }, [onClick, autoHide, isVisible]);

  // Get overall status
  const overallStatus = useMemo(() => {
    if (error || connectionStatus === 'error' || syncStatus === 'error') {
      return 'error';
    } else if (connectionStatus === 'connecting' || syncStatus === 'syncing') {
      return 'working';
    } else if (connectionStatus === 'disconnected' || syncStatus === 'pending') {
      return 'warning';
    } else {
      return 'healthy';
    }
  }, [connectionStatus, syncStatus, error]);

  // Get connection config
  const connectionConfig = CONNECTION_STATUS_CONFIG[connectionStatus];
  const syncConfig = SYNC_STATUS_CONFIG[syncStatus];

  // Compute container classes
  const containerClasses = useMemo(() => [
    styles.container,
    styles[`size${size.charAt(0).toUpperCase()}${size.slice(1)}`],
    styles[`status${overallStatus.charAt(0).toUpperCase()}${overallStatus.slice(1)}`],
    position && styles[`position${position.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')}`],
    animated && styles.animated,
    !isVisible && styles.hidden,
    onClick && styles.clickable,
    className
  ].filter(Boolean).join(' '), [size, overallStatus, position, animated, isVisible, onClick, className]);

  if (autoHide && !isVisible && overallStatus === 'healthy') {
    return (
      <button 
        className={styles.hiddenIndicator}
        onClick={handleClick}
        aria-label="Show status"
      >
        <span className={styles.hiddenIcon}>📊</span>
      </button>
    );
  }

  return (
    <div 
      className={containerClasses}
      onClick={handleClick}
      role={onClick ? "button" : "status"}
      tabIndex={onClick ? 0 : -1}
      aria-label={`Status: ${overallStatus}`}
    >
      {/* Main Status Icon */}
      <div className={styles.mainStatus}>
        <span 
          className={`${styles.statusIcon} ${connectionConfig.pulse ? styles.pulse : ''}`}
          style={{ color: connectionConfig.color }}
        >
          {connectionConfig.icon}
        </span>
        
        {pendingOperations > 0 && (
          <span className={styles.pendingBadge}>
            {pendingOperations}
          </span>
        )}
      </div>

      {/* Status Details */}
      {showDetails && (
        <div className={styles.statusDetails}>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Connection:</span>
            <span 
              className={`${styles.statusValue} ${connectionConfig.pulse ? styles.pulse : ''}`}
              style={{ color: connectionConfig.color }}
            >
              {connectionConfig.label}
            </span>
          </div>
          
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Sync:</span>
            <span 
              className={`${styles.statusValue} ${syncConfig.pulse ? styles.pulse : ''}`}
              style={{ color: syncConfig.color }}
            >
              {syncConfig.label}
            </span>
          </div>
          
          {lastUpdate && (
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>Updated:</span>
              <span className={styles.statusValue}>{timeAgo}</span>
            </div>
          )}
          
          {pendingOperations > 0 && (
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>Pending:</span>
              <span className={styles.statusValue}>{pendingOperations}</span>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          <span className={styles.errorText}>{error}</span>
        </div>
      )}

      {/* Compact Status Line */}
      {!showDetails && size !== 'small' && (
        <div className={styles.compactStatus}>
          <span className={styles.compactText}>
            {connectionConfig.label}
            {syncStatus !== 'synced' && ` • ${syncConfig.label}`}
            {timeAgo && ` • ${timeAgo}`}
          </span>
        </div>
      )}
    </div>
  );
};

export default IntelStatusIndicator;
