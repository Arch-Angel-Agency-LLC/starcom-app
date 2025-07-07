/**
 * IntelReportsPanel - Left sidebar Intel Reports 3D panel
 * Integrates with the LeftSideBar to provide quick access to Intel Reports 3D functionality
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useIntelReports3D } from '../../../hooks/intelligence/useIntelReports3D';
import { useIntelContextAdapter } from '../../../hooks/intelligence/useIntelContextAdapter';
import { IntelCategory, IntelPriority } from '../../../types/intelligence/IntelReportTypes';
import styles from './IntelReportsPanel.module.css';

interface IntelReportsPanelProps {
  /** Whether the panel is collapsed */
  isCollapsed?: boolean;
  /** Callback when a report is selected */
  onReportSelect?: (reportId: string) => void;
  /** Callback when panel wants to expand/collapse */
  onToggleCollapse?: () => void;
  /** Custom CSS class */
  className?: string;
}

/**
 * IntelReportsPanel - Left sidebar panel for Intel Reports 3D
 * Provides quick access to reports, filters, and actions
 */
export const IntelReportsPanel: React.FC<IntelReportsPanelProps> = ({
  isCollapsed = false,
  onReportSelect,
  onToggleCollapse,
  className = ''
}) => {
  const [activeFilter, setActiveFilter] = useState<IntelCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<IntelPriority | 'all'>('all');

  // Hook integrations
  const {
    intelReports,
    loading,
    error,
    metrics,
    refreshIntelReports,
    addIntelReport
  } = useIntelReports3D();

  const {
    context,
    isAdapting
  } = useIntelContextAdapter();

  // Filter reports based on active filters
  const filteredReports = useMemo(() => {
    if (!intelReports) return [];

    return intelReports.filter(report => {
      const categoryMatch = activeFilter === 'all' || report.metadata.category === activeFilter;
      const priorityMatch = priorityFilter === 'all' || report.visualization.priority === priorityFilter;
      return categoryMatch && priorityMatch;
    });
  }, [intelReports, activeFilter, priorityFilter]);

  // Priority color mapping
  const getPriorityColor = useCallback((priority: IntelPriority): string => {
    switch (priority) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffaa00';
      case 'low': return '#00aa00';
      case 'background': return '#888888';
      default: return '#888888';
    }
  }, []);

  // Category icon mapping
  const getCategoryIcon = useCallback((category: IntelCategory): string => {
    switch (category) {
      case 'cyber_threat': return '⚠️';
      case 'physical_security': return '🔓';
      case 'financial_crime': return '🚨';
      case 'geopolitical': return '🔍';
      case 'infrastructure': return '👁️';
      case 'personnel': return '📊';
      default: return '📋';
    }
  }, []);

  // Handle report selection
  const handleReportClick = useCallback((reportId: string) => {
    onReportSelect?.(reportId);
  }, [onReportSelect]);

  // Handle quick actions
  const handleQuickAction = useCallback(async (action: string) => {
    try {
      switch (action) {
        case 'refresh':
          await refreshIntelReports();
          break;
        case 'new-threat':
          await addIntelReport({
            id: `threat-${Date.now()}`,
            title: 'New Threat Report',
            classification: 'UNCLASSIFIED',
            source: 'Panel',
            timestamp: new Date(),
            location: { lat: 0, lng: 0 },
            content: { summary: 'Quick threat report created from panel', details: '', attachments: [] },
            visualization: { 
              markerType: 'priority',
              color: '#ff4444', 
              size: 1.0, 
              opacity: 0.8,
              priority: 'high'
            },
            metadata: {
              tags: ['threat'],
              confidence: 0.7,
              reliability: 0.8,
              freshness: 1.0,
              category: 'cyber_threat'
            }
          });
          break;
        case 'new-incident':
          await addIntelReport({
            id: `incident-${Date.now()}`,
            title: 'New Incident Report',
            classification: 'UNCLASSIFIED',
            source: 'Panel',
            timestamp: new Date(),
            location: { lat: 0, lng: 0 },
            content: { summary: 'Quick incident report created from panel', details: '', attachments: [] },
            visualization: { 
              markerType: 'alert',
              color: '#ff0000', 
              size: 1.2, 
              opacity: 0.9,
              priority: 'critical'
            },
            metadata: {
              tags: ['incident'],
              confidence: 0.9,
              reliability: 0.9,  
              freshness: 1.0,
              category: 'physical_security'
            }
          });
          break;
      }
    } catch (error) {
      console.error('Quick action failed:', error);
    }
  }, [refreshIntelReports, addIntelReport]);

  // Loading state
  if (loading) {
    return (
      <div className={`${styles.panel} ${isCollapsed ? styles.collapsed : ''} ${className}`}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          {!isCollapsed && <span>Loading Reports...</span>}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${styles.panel} ${isCollapsed ? styles.collapsed : ''} ${className}`}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          {!isCollapsed && (
            <div className={styles.errorContent}>
              <span>Error loading reports</span>
              <button onClick={() => handleQuickAction('refresh')} className={styles.retryBtn}>
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.panel} ${isCollapsed ? styles.collapsed : ''} ${className}`}>
      {/* Panel Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.headerIcon}>📊</span>
          {!isCollapsed && (
            <>
              <span className={styles.headerTitle}>Intel Reports 3D</span>
              <button
                onClick={onToggleCollapse}
                className={styles.collapseBtn}
                title="Toggle panel"
              >
                ⫸
              </button>
            </>
          )}
        </div>
      </div>

      {/* Context Selector */}
      {!isCollapsed && context && (
        <div className={styles.contextSelector}>
          <div className={styles.contextInfo}>
            Context: {context ? 'Active' : 'Default'}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {!isCollapsed && metrics && (
        <div className={styles.quickStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total:</span>
            <span className={styles.statValue}>{metrics.totalIntelReports}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Visible:</span>
            <span className={styles.statValue}>{metrics.visibleIntelReports}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Memory:</span>
            <span className={styles.statValue}>{Math.round(metrics.memoryUsage / 1024)}KB</span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className={styles.quickActions}>
          <button
            onClick={() => handleQuickAction('refresh')}
            className={styles.actionBtn}
            title="Refresh reports"
          >
            🔄
          </button>
          <button
            onClick={() => handleQuickAction('new-threat')}
            className={styles.actionBtn}
            title="New threat report"
          >
            ⚠️
          </button>
          <button
            onClick={() => handleQuickAction('new-incident')}
            className={styles.actionBtn}
            title="New incident report"
          >
            🚨
          </button>
        </div>
      )}

      {/* Filters */}
      {!isCollapsed && (
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Type:</label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as IntelCategory | 'all')}
              className={styles.filterSelect}
            >
              <option value="all">All</option>
              <option value="cyber_threat">Cyber Threats</option>
              <option value="physical_security">Physical Security</option>
              <option value="financial_crime">Financial Crime</option>
              <option value="geopolitical">Geopolitical</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="personnel">Personnel</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Priority:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as IntelPriority | 'all')}
              className={styles.filterSelect}
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="background">Background</option>
            </select>
          </div>
        </div>
      )}

      {/* Report List */}
      <div className={styles.reportList}>
        {filteredReports.length === 0 ? (
          <div className={styles.emptyState}>
            {!isCollapsed && <span>No reports found</span>}
          </div>
        ) : (
          filteredReports.slice(0, isCollapsed ? 3 : 10).map(report => (
            <div
              key={report.id}
              className={styles.reportItem}
              onClick={() => handleReportClick(report.id)}
              title={isCollapsed ? report.title : undefined}
            >
              <div className={styles.reportHeader}>
                <span className={styles.reportIcon}>{getCategoryIcon(report.metadata.category)}</span>
                <div
                  className={styles.priorityDot}
                  style={{ backgroundColor: getPriorityColor(report.visualization.priority) }}
                ></div>
                {!isCollapsed && (
                  <span className={styles.reportTitle}>{report.title}</span>
                )}
              </div>
              {!isCollapsed && (
                <div className={styles.reportMeta}>
                  <span className={styles.reportType}>{report.metadata.category}</span>
                  <span className={styles.reportTime}>
                    {new Date(report.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Status Footer */}
      <div className={styles.statusFooter}>
        <div className={`${styles.statusDot} ${!isAdapting ? styles.active : styles.inactive}`}></div>
        {!isCollapsed && (
          <span className={styles.statusText}>
            {!isAdapting ? 'Ready' : 'Adapting...'}
          </span>
        )}
      </div>
    </div>
  );
};

export default IntelReportsPanel;
