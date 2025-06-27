/**
 * Threat Horizon Feed Component
 * Bottom bar component for real-time threat monitoring and AI insights
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useGlobalCommand } from '../../hooks/useUnifiedGlobalCommand';
import { useFeatureFlag } from '../../utils/featureFlags';
import { generateMockThreatIndicators } from '../../services/aiService';
import type { ThreatSeverity } from '../../types/ai';
import styles from './ThreatHorizonFeed.module.css';

export interface ThreatHorizonFeedProps {
  className?: string;
  expanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
}

export const ThreatHorizonFeed: React.FC<ThreatHorizonFeedProps> = ({
  className = '',
  expanded = false,
  onToggleExpanded
}) => {
  const { state, addThreatIndicator } = useGlobalCommand();
  const threatHorizonEnabled = useFeatureFlag('threatHorizonEnabled');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<string | null>(null);

  // Initialize with mock data when feature is enabled
  useEffect(() => {
    if (!threatHorizonEnabled) return;

    const initializeThreatData = async () => {
      setIsLoading(true);
      try {
        const mockThreats = generateMockThreatIndicators();
        mockThreats.forEach(threat => addThreatIndicator(threat));
      } catch (error) {
        console.error('Failed to initialize threat data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only initialize if we don't have threat data yet
    if (state.ai?.threatIndicators?.length === 0) {
      initializeThreatData();
    }
  }, [threatHorizonEnabled, state.ai?.threatIndicators?.length, addThreatIndicator]);

  // Sort threats by priority (severity + confidence + timeline)
  const prioritizedThreats = useMemo(() => {
    return [...(state.ai?.threatIndicators || [])]
      .sort((a: any, b: any) => {
        const severityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const aScore = severityWeight[a.severity as keyof typeof severityWeight] * a.confidence * (1 / Math.max(1, a.estimatedImpact.timelineToImpact));
        const bScore = severityWeight[b.severity as keyof typeof severityWeight] * b.confidence * (1 / Math.max(1, b.estimatedImpact.timelineToImpact));
        return bScore - aScore;
      })
      .slice(0, expanded ? 20 : 8); // Show more when expanded
  }, [state.ai?.threatIndicators, expanded]);

  // Get severity distribution for overview
  const severityStats = useMemo(() => {
    return state.ai?.state?.severityDistribution || {};
  }, [state.ai?.state]);

  const handleToggleExpanded = () => {
    const newExpanded = !expanded;
    onToggleExpanded?.(newExpanded);
  };

  const handleThreatClick = (threatId: string) => {
    setSelectedThreat(selectedThreat === threatId ? null : threatId);
  };

  const getSeverityColor = (severity: ThreatSeverity): string => {
    switch (severity) {
      case 'CRITICAL': return '#ff4444';
      case 'HIGH': return '#ff8800';
      case 'MEDIUM': return '#ffbb00';
      case 'LOW': return '#44ff44';
      default: return '#666';
    }
  };

  const formatTimeToImpact = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  if (!threatHorizonEnabled) {
    return null;
  }

  return (
    <div className={`${styles.threatHorizonFeed} ${className} ${expanded ? styles.expanded : ''}`}>
      {/* Header with controls and stats */}
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon}>⚠️</span>
          <span>THREAT HORIZON</span>
          {isLoading && <span className={styles.loadingSpinner}>⟳</span>}
        </div>
        
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{state.ai?.threatIndicators?.length || 0}</span>
            <span className={styles.statLabel}>ACTIVE</span>
          </div>
          
          <div className={styles.severityIndicators}>
            {Object.entries(severityStats).map(([severity, count]) => (
              <div 
                key={severity}
                className={styles.severityIndicator}
                style={{ '--severity-color': getSeverityColor(severity as ThreatSeverity) } as React.CSSProperties}
                title={`${severity}: ${count}`}
              >
                <span className={styles.severityCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <button 
          className={styles.expandButton}
          onClick={handleToggleExpanded}
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▼' : '▲'}
        </button>
      </div>

      {/* Threat indicators list */}
      <div className={styles.threatList}>
        {prioritizedThreats.map((threat) => (
          <div
            key={threat.id}
            className={`${styles.threatItem} ${selectedThreat === threat.id ? styles.selected : ''}`}
            onClick={() => handleThreatClick(threat.id)}
            style={{ '--severity-color': getSeverityColor(threat.severity) } as React.CSSProperties}
          >
            <div className={styles.threatHeader}>
              <div className={styles.threatSeverity}>
                <span className={styles.severityBadge}>{threat.severity}</span>
                <span className={styles.confidence}>{Math.round(threat.confidence * 100)}%</span>
              </div>
              
              <div className={styles.threatTitle}>{threat.title}</div>
              
              <div className={styles.threatTiming}>
                <span className={styles.timeToImpact}>
                  T-{formatTimeToImpact(threat.estimatedImpact.timelineToImpact)}
                </span>
                <span className={styles.threatType}>{threat.threatType}</span>
              </div>
            </div>

            {selectedThreat === threat.id && (
              <div className={styles.threatDetails}>
                <div className={styles.description}>{threat.description}</div>
                
                <div className={styles.impactInfo}>
                  <div className={styles.scope}>
                    <strong>Scope:</strong> {threat.estimatedImpact.scope}
                  </div>
                  <div className={styles.damage}>
                    <strong>Impact:</strong> {threat.estimatedImpact.estimatedDamage}
                  </div>
                </div>

                {threat.recommendedResponse.length > 0 && (
                  <div className={styles.recommendations}>
                    <strong>Recommended Actions:</strong>
                    <ul>
                      {threat.recommendedResponse.slice(0, 3).map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {threat.geolocation && (
                  <div className={styles.location}>
                    <strong>Location:</strong> {threat.geolocation.region || `${threat.geolocation.latitude.toFixed(2)}, ${threat.geolocation.longitude.toFixed(2)}`}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {prioritizedThreats.length === 0 && !isLoading && (
          <div className={styles.noThreats}>
            <span className={styles.allClearIcon}>✓</span>
            <span>No active threats detected</span>
          </div>
        )}
      </div>

      {/* Footer with last update info */}
      <div className={styles.footer}>
        <span className={styles.lastUpdate}>
          Last updated: {new Date().toLocaleTimeString()}
        </span>
        <span className={styles.status}>
          Status: Active
        </span>
      </div>
    </div>
  );
};

export default ThreatHorizonFeed;
