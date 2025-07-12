import React, { useState, useEffect } from 'react';
import { TrendingUp, Shield, AlertTriangle, Users, Globe, Clock, Target, Eye } from 'lucide-react';
import styles from './IntelligenceSummaryPanel.module.css';

interface IntelligenceSummaryPanelProps {
  data: {
    query?: string;
    results?: Record<string, unknown>[];
    investigation?: Record<string, unknown>;
  };
  panelId: string;
}

interface ThreatIndicator {
  id: string;
  type: 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  confidence: number;
  timestamp: string;
  source: string;
}

interface KeyFinding {
  id: string;
  category: 'entity' | 'relationship' | 'threat' | 'location' | 'communication';
  title: string;
  detail: string;
  relevance: number;
  verified: boolean;
}

/**
 * Intelligence Summary Panel
 * 
 * Provides real-time analysis and key findings from OSINT operations
 * Displays threat indicators, entity summaries, and investigation insights
 */
const IntelligenceSummaryPanel: React.FC<IntelligenceSummaryPanelProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'threats' | 'entities' | 'timeline'>('overview');
  const [threatIndicators, setThreatIndicators] = useState<ThreatIndicator[]>([]);
  const [keyFindings, setKeyFindings] = useState<KeyFinding[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalEntities: 0,
    relationships: 0,
    threats: 0,
    geolocations: 0,
    lastUpdated: new Date().toISOString()
  });

  // Simulate real-time intelligence updates
  useEffect(() => {
    const updateInterval = setInterval(() => {
      // Generate mock threat indicators based on search activity
      if (data.query && data.results) {
        const newIndicator: ThreatIndicator = {
          id: `threat-${Date.now()}`,
          type: (['high', 'medium', 'low', 'info'] as const)[Math.floor(Math.random() * 4)],
          title: `New ${['Suspicious Activity', 'Data Exposure', 'Network Anomaly', 'Identity Correlation'][Math.floor(Math.random() * 4)]} Detected`,
          description: `Analysis of "${data.query}" has revealed potential intelligence value`,
          confidence: Math.floor(Math.random() * 40) + 60,
          timestamp: new Date().toISOString(),
          source: ['HUMINT', 'SIGINT', 'OSINT', 'GEOINT'][Math.floor(Math.random() * 4)]
        };

        setThreatIndicators(prev => [newIndicator, ...prev.slice(0, 4)]);
      }

      // Update summary stats
      setSummaryStats(prev => ({
        ...prev,
        totalEntities: prev.totalEntities + Math.floor(Math.random() * 3),
        relationships: prev.relationships + Math.floor(Math.random() * 2),
        threats: prev.threats + (Math.random() > 0.8 ? 1 : 0),
        geolocations: prev.geolocations + (Math.random() > 0.9 ? 1 : 0),
        lastUpdated: new Date().toISOString()
      }));
    }, 5000);

    return () => clearInterval(updateInterval);
  }, [data.query, data.results]);

  // Generate key findings from search results
  useEffect(() => {
    if (data.results && data.results.length > 0) {
      const findings: KeyFinding[] = data.results.slice(0, 5).map((result, index) => ({
        id: `finding-${index}`,
        category: (['entity', 'relationship', 'threat', 'location', 'communication'] as const)[Math.floor(Math.random() * 5)],
        title: `Key Finding ${index + 1}`,
        detail: `Analysis revealed significant intelligence value in ${result.title || 'search result'}`,
        relevance: Math.floor(Math.random() * 30) + 70,
        verified: Math.random() > 0.5
      }));
      setKeyFindings(findings);
    }
  }, [data.results]);

  const getThreatColor = (type: string) => {
    switch (type) {
      case 'high': return 'var(--danger-color)';
      case 'medium': return 'var(--warning-color)';
      case 'low': return 'var(--info-color)';
      default: return 'var(--accent-color)';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'entity': return <Users size={16} />;
      case 'relationship': return <Target size={16} />;
      case 'threat': return <AlertTriangle size={16} />;
      case 'location': return <Globe size={16} />;
      case 'communication': return <Eye size={16} />;
      default: return <Shield size={16} />;
    }
  };

  return (
    <div className={styles.intelligenceSummaryPanel}>
      <div className={styles.header}>
        <div className={styles.title}>
          <TrendingUp className={styles.titleIcon} />
          <span>Intelligence Summary</span>
        </div>
        <div className={styles.lastUpdated}>
          <Clock size={12} />
          <span>Updated {new Date(summaryStats.lastUpdated).toLocaleTimeString()}</span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'threats' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('threats')}
        >
          Threats
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'entities' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('entities')}
        >
          Entities
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'timeline' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'overview' && (
          <div className={styles.overviewTab}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <Users className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <span className={styles.statNumber}>{summaryStats.totalEntities}</span>
                  <span className={styles.statLabel}>Entities</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <Target className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <span className={styles.statNumber}>{summaryStats.relationships}</span>
                  <span className={styles.statLabel}>Relationships</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <AlertTriangle className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <span className={styles.statNumber}>{summaryStats.threats}</span>
                  <span className={styles.statLabel}>Threats</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <Globe className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <span className={styles.statNumber}>{summaryStats.geolocations}</span>
                  <span className={styles.statLabel}>Locations</span>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Key Findings</h3>
              <div className={styles.findingsList}>
                {keyFindings.map((finding) => (
                  <div key={finding.id} className={styles.findingItem}>
                    <div className={styles.findingHeader}>
                      {getCategoryIcon(finding.category)}
                      <span className={styles.findingTitle}>{finding.title}</span>
                      <span className={`${styles.relevanceScore} ${finding.verified ? styles.verified : ''}`}>
                        {finding.relevance}%
                      </span>
                    </div>
                    <p className={styles.findingDetail}>{finding.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'threats' && (
          <div className={styles.threatsTab}>
            <div className={styles.threatsList}>
              {threatIndicators.map((threat) => (
                <div key={threat.id} className={styles.threatItem}>
                  <div 
                    className={styles.threatIndicator}
                    style={{ backgroundColor: getThreatColor(threat.type) }}
                  />
                  <div className={styles.threatContent}>
                    <div className={styles.threatHeader}>
                      <span className={styles.threatTitle}>{threat.title}</span>
                      <span className={styles.threatSource}>{threat.source}</span>
                    </div>
                    <p className={styles.threatDescription}>{threat.description}</p>
                    <div className={styles.threatFooter}>
                      <span className={styles.threatConfidence}>
                        Confidence: {threat.confidence}%
                      </span>
                      <span className={styles.threatTime}>
                        {new Date(threat.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'entities' && (
          <div className={styles.entitiesTab}>
            <div className={styles.placeholder}>
              <Users size={48} />
              <p>Entity analysis will appear here</p>
              <p className={styles.subtext}>Start a search to see entity relationships and profiles</p>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className={styles.timelineTab}>
            <div className={styles.placeholder}>
              <Clock size={48} />
              <p>Timeline analysis will appear here</p>
              <p className={styles.subtext}>Chronological events and correlations from your investigation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligenceSummaryPanel;
