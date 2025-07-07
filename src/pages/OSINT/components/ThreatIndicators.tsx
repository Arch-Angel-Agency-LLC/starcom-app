import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, ShieldAlert, Eye, Activity, AlertCircle } from 'lucide-react';
import styles from './ThreatIndicators.module.css';

interface ThreatIndicatorsProps {
  className?: string;
}

interface ThreatIndicator {
  id: string;
  type: 'opsec' | 'surveillance' | 'security' | 'activity' | 'warning';
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
}

/**
 * ThreatIndicators - Real-time operational security status display
 * 
 * Shows active threats, security concerns, and OPSEC status while
 * conducting OSINT operations. Provides warnings about potential
 * exposure or surveillance.
 */
const ThreatIndicators: React.FC<ThreatIndicatorsProps> = ({ className }) => {
  const [indicators, setIndicators] = useState<ThreatIndicator[]>([]);
  const [expanded, setExpanded] = useState(false);

  // Simulate loading threat indicators
  useEffect(() => {
    // In a real implementation, this would come from a monitoring service
    const mockIndicators: ThreatIndicator[] = [
      {
        id: 'threat-1',
        type: 'opsec',
        level: 'medium',
        message: 'VPN connection unstable, potential IP exposure',
        timestamp: new Date(Date.now() - 5 * 60000)
      },
      {
        id: 'threat-2',
        type: 'surveillance',
        level: 'low',
        message: 'Unusual access patterns detected on target domain',
        timestamp: new Date(Date.now() - 12 * 60000)
      },
      {
        id: 'threat-3',
        type: 'security',
        level: 'high',
        message: 'Browser fingerprinting detected on last 3 visited sites',
        timestamp: new Date(Date.now() - 3 * 60000)
      }
    ];
    
    setIndicators(mockIndicators);
    
    // Simulate receiving a new threat indicator after 10 seconds
    const timer = setTimeout(() => {
      setIndicators(prev => [
        ...prev,
        {
          id: 'threat-4',
          type: 'activity',
          level: 'critical',
          message: 'Possible counter-intelligence detection on target network',
          timestamp: new Date()
        }
      ]);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);

  // Get indicator icon based on type
  const getIndicatorIcon = (type: ThreatIndicator['type'], level: ThreatIndicator['level']) => {
    const size = 18;
    const className = `${styles.icon} ${styles[level]}`;
    
    switch (type) {
      case 'opsec':
        return <Shield size={size} className={className} />;
      case 'surveillance':
        return <Eye size={size} className={className} />;
      case 'security':
        return <ShieldAlert size={size} className={className} />;
      case 'activity':
        return <Activity size={size} className={className} />;
      case 'warning':
        return <AlertCircle size={size} className={className} />;
      default:
        return <AlertTriangle size={size} className={className} />;
    }
  };
  
  // Format relative time
  const formatRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return timestamp.toLocaleString();
  };

  // Get highest threat level
  const getHighestThreatLevel = (): ThreatIndicator['level'] => {
    if (indicators.some(i => i.level === 'critical')) return 'critical';
    if (indicators.some(i => i.level === 'high')) return 'high';
    if (indicators.some(i => i.level === 'medium')) return 'medium';
    return 'low';
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div 
        className={`${styles.summary} ${styles[getHighestThreatLevel()]}`}
        onClick={toggleExpanded}
      >
        <AlertTriangle size={16} />
        <span>{indicators.length} active indicators</span>
        <span className={styles.badge}>{getHighestThreatLevel()}</span>
      </div>
      
      {expanded && (
        <div className={styles.details}>
          {indicators.length > 0 ? (
            <ul className={styles.list}>
              {indicators.map(indicator => (
                <li key={indicator.id} className={`${styles.indicator} ${styles[indicator.level]}`}>
                  <div className={styles.indicatorHeader}>
                    {getIndicatorIcon(indicator.type, indicator.level)}
                    <span className={styles.type}>{indicator.type}</span>
                    <span className={styles.time}>{formatRelativeTime(indicator.timestamp)}</span>
                  </div>
                  <div className={styles.message}>{indicator.message}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              <Shield size={24} />
              <p>No active threat indicators</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { ThreatIndicators };
