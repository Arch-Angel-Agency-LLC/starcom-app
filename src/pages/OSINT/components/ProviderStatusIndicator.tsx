/**
 * Provider Status Indicator Component
 * 
 * Displays the real-time status of OSINT and NetRunner API providers.
 * Shows integration status, real vs mock API usage, and health information.
 * 
 * @author GitHub Copilot
 * @date July 11, 2025
 */

import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { providerStatusService, ProviderStatus } from '../services/providers/ProviderStatusService';
import styles from './ProviderStatusIndicator.module.css';

interface ProviderStatusIndicatorProps {
  showDetails?: boolean;
  compact?: boolean;
  onStatusClick?: (providerId: string) => void;
}

export const ProviderStatusIndicator: React.FC<ProviderStatusIndicatorProps> = ({
  showDetails = true,
  compact = false,
  onStatusClick
}) => {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Initial load
    setProviders(providerStatusService.getAllProviderStatuses());

    // Set up periodic refresh
    const refreshInterval = setInterval(() => {
      setProviders(providerStatusService.getAllProviderStatuses());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    providerStatusService.refreshProviderStatuses();
    setProviders(providerStatusService.getAllProviderStatuses());
    
    // Simulate brief loading state
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getStatusBadge = (status: ProviderStatus['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className={styles.statusIconConnected} size={16} />;
      case 'mock':
        return <Activity className={styles.statusIconMock} size={16} />;
      case 'error':
        return <XCircle className={styles.statusIconError} size={16} />;
      case 'disabled':
        return <AlertTriangle className={styles.statusIconDisabled} size={16} />;
      default:
        return <AlertTriangle className={styles.statusIconUnknown} size={16} />;
    }
  };

  const getStatusText = (provider: ProviderStatus) => {
    if (!provider.isEnabled) return 'Disabled';
    if (provider.isRealApi) return 'Live API';
    return 'Mock Data';
  };

  const summary = providerStatusService.getStatusSummary();

  if (compact) {
    return (
      <div className={styles.compactContainer}>
        <div className={styles.summaryBadge}>
          <Activity size={14} />
          <span>{summary.realApiPercentage}% Real APIs</span>
          <button 
            onClick={handleRefresh}
            className={styles.refreshButton}
            disabled={isRefreshing}
          >
            <RefreshCw 
              size={12} 
              className={isRefreshing ? styles.spinning : ''} 
            />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Activity size={18} />
          <span>API Provider Status</span>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.summary}>
            {summary.connected} live, {summary.mock} mock, {summary.error} errors
          </div>
          <button 
            onClick={handleRefresh}
            className={styles.refreshButton}
            disabled={isRefreshing}
            title="Refresh provider statuses"
          >
            <RefreshCw 
              size={16} 
              className={isRefreshing ? styles.spinning : ''} 
            />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className={styles.providerList}>
          {providers.map((provider) => (
            <div 
              key={provider.id}
              className={`${styles.providerItem} ${onStatusClick ? styles.clickable : ''}`}
              onClick={() => onStatusClick?.(provider.id)}
            >
              <div className={styles.providerInfo}>
                <div className={styles.providerHeader}>
                  <span className={styles.providerIcon}>
                    {provider.statusIcon}
                  </span>
                  <span className={styles.providerName}>
                    {provider.name}
                  </span>
                  <div className={styles.providerStatus}>
                    {getStatusBadge(provider.status)}
                    <span className={styles.statusText}>
                      {getStatusText(provider)}
                    </span>
                  </div>
                </div>
                <div className={styles.providerDescription}>
                  {provider.description}
                </div>
                {provider.errorMessage && (
                  <div className={styles.errorMessage}>
                    {provider.errorMessage}
                  </div>
                )}
              </div>
              
              <div className={styles.providerMetrics}>
                {provider.lastCheck && (
                  <div className={styles.lastCheck}>
                    Last checked: {provider.lastCheck.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.integrationStatus}>
          <span className={styles.integrationLabel}>
            NetRunner Integration:
          </span>
          <span className={styles.integrationValue}>
            {summary.realApiPercentage > 0 ? '✅ Active' : '🟡 Mock Mode'}
          </span>
        </div>
      </div>
    </div>
  );
};
