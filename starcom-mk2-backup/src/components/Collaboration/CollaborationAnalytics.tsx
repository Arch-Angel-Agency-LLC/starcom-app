/**
 * Collaboration Analytics Component
 * 
 * Advanced analytics dashboard for monitoring multi-agency collaboration
 * effectiveness, session performance, and intelligence sharing metrics.
 */

import React, { useState, useMemo } from 'react';
import { useCollaboration } from '../../hooks/useUnifiedGlobalCommand';
import type { 
  CollaborationSession, 
  AgencyType, 
  SharedIntelligenceAsset 
} from '../../types';
import styles from './CollaborationAnalytics.module.css';

// ============================================================================
// ANALYTICS CHARTS COMPONENTS
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  icon: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, trend, icon }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return '#4caf50';
      case 'down': return '#f44336';
      case 'stable': return '#ff9800';
      default: return '#ffffff';
    }
  };

  return (
    <div className={styles.metricCard}>
      <div className={styles.metricHeader}>
        <span className={styles.metricIcon}>{icon}</span>
        <span className={styles.metricTitle}>{title}</span>
      </div>
      
      <div className={styles.metricValue}>
        {value}
        {trend && (
          <span 
            className={styles.trendIndicator}
            style={{ color: getTrendColor() }}
          >
            {getTrendIcon()}
          </span>
        )}
      </div>
      
      {subtitle && (
        <div className={styles.metricSubtitle}>{subtitle}</div>
      )}
    </div>
  );
};

// ============================================================================
// AGENCY PARTICIPATION CHART
// ============================================================================

interface AgencyParticipationProps {
  sessions: CollaborationSession[];
}

const AgencyParticipation: React.FC<AgencyParticipationProps> = ({ sessions }) => {
  const agencyData = useMemo(() => {
    const agencies: Record<AgencyType, number> = {
      'SOCOM': 0,
      'SPACE_FORCE': 0,
      'CYBER_COMMAND': 0,
      'NSA': 0,
      'DIA': 0,
      'CIA': 0
    };

    sessions.forEach(session => {
      session.participants.forEach(participant => {
        agencies[participant.agency]++;
      });
    });

    return Object.entries(agencies)
      .map(([agency, count]) => ({ agency: agency as AgencyType, count }))
      .sort((a, b) => b.count - a.count);
  }, [sessions]);

  const maxCount = Math.max(...agencyData.map(d => d.count));
  
  const getAgencyColor = (agency: AgencyType) => {
    const colors = {
      'SOCOM': '#2E7D32',
      'SPACE_FORCE': '#1565C0',
      'CYBER_COMMAND': '#7B1FA2',
      'NSA': '#E65100',
      'DIA': '#C62828',
      'CIA': '#424242'
    };
    return colors[agency];
  };

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>
        <span className={styles.chartIcon}>🏢</span>
        Agency Participation
      </h3>
      
      <div className={styles.barChart}>
        {agencyData.map(({ agency, count }) => (
          <div key={agency} className={styles.barItem}>
            <div className={styles.barLabel}>
              {agency.replace('_', ' ')}
            </div>
            <div className={styles.barContainer}>
              <div 
                className={styles.bar}
                style={{ 
                  width: `${(count / maxCount) * 100}%`,
                  backgroundColor: getAgencyColor(agency)
                }}
              />
              <span className={styles.barValue}>{count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// SESSION TIMELINE COMPONENT
// ============================================================================

interface SessionTimelineProps {
  sessions: CollaborationSession[];
}

const SessionTimeline: React.FC<SessionTimelineProps> = ({ sessions }) => {
  const timelineData = useMemo(() => {
    return sessions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5); // Show last 5 sessions
  }, [sessions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#4caf50';
      case 'SUSPENDED': return '#ff9800';
      case 'COMPLETED': return '#2196f3';
      case 'ARCHIVED': return '#757575';
      default: return '#ffffff';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>
        <span className={styles.chartIcon}>🕐</span>
        Recent Sessions
      </h3>
      
      <div className={styles.timeline}>
        {timelineData.map((session, index) => (
          <div key={session.id} className={styles.timelineItem}>
            <div className={styles.timelineMarker}>
              <div 
                className={styles.timelineDot}
                style={{ backgroundColor: getStatusColor(session.status) }}
              />
              {index < timelineData.length - 1 && (
                <div className={styles.timelineLine} />
              )}
            </div>
            
            <div className={styles.timelineContent}>
              <div className={styles.timelineHeader}>
                <span className={styles.timelineTitle}>{session.name}</span>
                <span className={styles.timelineDate}>
                  {formatDate(session.createdAt)}
                </span>
              </div>
              
              <div className={styles.timelineMeta}>
                <span className={styles.timelineAgency}>
                  Lead: {session.leadAgency}
                </span>
                <span className={styles.timelineParticipants}>
                  {session.participants.length} participants
                </span>
                <span 
                  className={styles.timelineStatus}
                  style={{ color: getStatusColor(session.status) }}
                >
                  {session.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// INTELLIGENCE SHARING METRICS
// ============================================================================

interface IntelligenceSharingProps {
  assets: SharedIntelligenceAsset[];
}

const IntelligenceSharing: React.FC<IntelligenceSharingProps> = ({ assets }) => {
  const sharingMetrics = useMemo(() => {
    const categoryCount: Record<string, number> = {};
    const agencyCount: Record<AgencyType, number> = {
      'SOCOM': 0, 'SPACE_FORCE': 0, 'CYBER_COMMAND': 0,
      'NSA': 0, 'DIA': 0, 'CIA': 0
    };
    
    let totalDownloads = 0;
    let avgTrustScore = 0;

    assets.forEach(asset => {
      categoryCount[asset.category] = (categoryCount[asset.category] || 0) + 1;
      agencyCount[asset.sourceAgency]++;
      totalDownloads += asset.downloadCount;
      avgTrustScore += asset.trustScore;
    });

    avgTrustScore = assets.length > 0 ? avgTrustScore / assets.length : 0;

    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return {
      totalAssets: assets.length,
      totalDownloads,
      avgTrustScore: Math.round(avgTrustScore),
      topCategories,
      topAgencies: Object.entries(agencyCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
    };
  }, [assets]);

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>
        <span className={styles.chartIcon}>🎯</span>
        Intelligence Sharing
      </h3>
      
      <div className={styles.sharingGrid}>
        <div className={styles.sharingMetric}>
          <div className={styles.sharingValue}>{sharingMetrics.totalAssets}</div>
          <div className={styles.sharingLabel}>Total Assets</div>
        </div>
        
        <div className={styles.sharingMetric}>
          <div className={styles.sharingValue}>{sharingMetrics.totalDownloads}</div>
          <div className={styles.sharingLabel}>Downloads</div>
        </div>
        
        <div className={styles.sharingMetric}>
          <div className={styles.sharingValue}>{sharingMetrics.avgTrustScore}%</div>
          <div className={styles.sharingLabel}>Avg Trust</div>
        </div>
      </div>

      <div className={styles.topLists}>
        <div className={styles.topList}>
          <h4>Top Categories</h4>
          {sharingMetrics.topCategories.map(([category, count]) => (
            <div key={category} className={styles.topListItem}>
              <span className={styles.topListLabel}>
                {category.replace('_', ' ')}
              </span>
              <span className={styles.topListValue}>{count}</span>
            </div>
          ))}
        </div>
        
        <div className={styles.topList}>
          <h4>Top Providers</h4>
          {sharingMetrics.topAgencies.map(([agency, count]) => (
            <div key={agency} className={styles.topListItem}>
              <span className={styles.topListLabel}>{agency}</span>
              <span className={styles.topListValue}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COLLABORATION ANALYTICS
// ============================================================================

interface CollaborationAnalyticsProps {
  className?: string;
}

export const CollaborationAnalytics: React.FC<CollaborationAnalyticsProps> = ({ className }) => {
  const { collaborationState } = useCollaboration();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  const analyticsData = useMemo(() => {
    const sessions = collaborationState.sessions || [];
    const assets = [] as any[]; // collaborationState.intelligenceMarketplace?.availableAssets || [];
    const messages = [] as any[]; // collaborationState.recentMessages || [];
    
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter((s: any) => s.status === 'ACTIVE').length,
      totalParticipants: new Set(
        sessions.flatMap((s: any) => s.participants?.map((p: any) => p.id) || [])
      ).size,
      avgSessionDuration: '2.5h', // Mock data
      totalMessages: messages.length,
      totalAssets: assets.length,
      collaborationScore: 87, // Mock calculated score
      sessions,
      assets,
      messages
    };
  }, [collaborationState]);

  return (
    <div className={`${styles.analytics} ${className || ''}`}>
      <div className={styles.analyticsHeader}>
        <div className={styles.analyticsTitle}>
          <span className={styles.analyticsIcon}>📊</span>
          <h2>Collaboration Analytics</h2>
        </div>
        
        <div className={styles.timeRangeSelector}>
          <button
            className={`${styles.timeRangeButton} ${
              selectedTimeRange === '24h' ? styles.activeTimeRange : ''
            }`}
            onClick={() => setSelectedTimeRange('24h')}
          >
            24h
          </button>
          <button
            className={`${styles.timeRangeButton} ${
              selectedTimeRange === '7d' ? styles.activeTimeRange : ''
            }`}
            onClick={() => setSelectedTimeRange('7d')}
          >
            7d
          </button>
          <button
            className={`${styles.timeRangeButton} ${
              selectedTimeRange === '30d' ? styles.activeTimeRange : ''
            }`}
            onClick={() => setSelectedTimeRange('30d')}
          >
            30d
          </button>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <MetricCard
          title="Active Sessions"
          value={`${analyticsData.activeSessions}/${analyticsData.totalSessions}`}
          trend="up"
          icon="🏢"
        />
        
        <MetricCard
          title="Total Participants"
          value={analyticsData.totalParticipants}
          subtitle="across all sessions"
          trend="stable"
          icon="👥"
        />
        
        <MetricCard
          title="Avg Session Duration"
          value={analyticsData.avgSessionDuration}
          trend="up"
          icon="⏱️"
        />
        
        <MetricCard
          title="Collaboration Score"
          value={`${analyticsData.collaborationScore}%`}
          subtitle="overall effectiveness"
          trend="up"
          icon="🎯"
        />
      </div>

      <div className={styles.chartsGrid}>
        <AgencyParticipation sessions={analyticsData.sessions} />
        <SessionTimeline sessions={analyticsData.sessions} />
        <IntelligenceSharing assets={analyticsData.assets} />
        
        <div className={styles.chartContainer}>
          <h3 className={styles.chartTitle}>
            <span className={styles.chartIcon}>💬</span>
            Communication Activity
          </h3>
          
          <div className={styles.communicationStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{analyticsData.totalMessages}</span>
              <span className={styles.statLabel}>Total Messages</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {(collaborationState as any).communicationChannels?.length || 0}
              </span>
              <span className={styles.statLabel}>Active Channels</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {((collaborationState as any).communicationChannels?.filter((c: any) => c.isActive) || []).length}
              </span>
              <span className={styles.statLabel}>Live Channels</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationAnalytics;
