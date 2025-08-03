/**
 * IntelBottomBarPanel - Bottom bar Intel Reports 3D panel
 * Integrates with the BottomBar to provide quick Intel Reports access
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useIntelReports3D } from '../../../hooks/intelligence/useIntelReports3D';
import { useIntelContextAdapter } from '../../../hooks/intelligence/useIntelContextAdapter';
import { IntelCategory, IntelPriority } from '../../../models/Intel/IntelEnums';
import styles from './IntelBottomBarPanel.module.css';

interface IntelBottomBarPanelProps {
  /** Whether the panel is expanded */
  isExpanded?: boolean;
  /** Callback when expansion state changes */
  onToggleExpanded?: () => void;
  /** Callback when a report is selected */
  onReportSelect?: (reportId: string) => void;
  /** Custom CSS class */
  className?: string;
}

/**
 * IntelBottomBarPanel - Bottom bar panel for Intel Reports 3D
 * Provides quick access to Intel Reports and filtering
 */
export const IntelBottomBarPanel: React.FC<IntelBottomBarPanelProps> = ({
  isExpanded = false,
  onToggleExpanded,
  onReportSelect,
  className = ''
}) => {
  const [quickFilter, setQuickFilter] = useState<'all' | 'critical' | 'high' | 'recent'>('all');

  // Hook integrations
  const {
    intelReports,
    loading,
    error,
    metrics
  } = useIntelReports3D();

  const {
    context,
    isAdapting
  } = useIntelContextAdapter();

  // Filter reports based on quick filter
  const filteredReports = useMemo(() => {
    if (!intelReports) return [];

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    switch (quickFilter) {
      case 'critical':
        return intelReports.filter(report => report.visualization.priority === 'critical');
      case 'high':
        return intelReports.filter(report => 
          report.visualization.priority === 'critical' || report.visualization.priority === 'high'
        );
      case 'recent':
        return intelReports.filter(report => new Date(report.timestamp) > oneHourAgo);
      default:
        return intelReports;
    }
  }, [intelReports, quickFilter]);

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
      case 'personnel': return '👤';
      case 'operational': return '⚙️';
      case 'strategic': return '🎯';
      case 'tactical': return '📊';
      default: return '📋';
    }
  }, []);

  // Handle report selection
  const handleReportClick = useCallback((reportId: string) => {
    onReportSelect?.(reportId);
  }, [onReportSelect]);

  // Handle filter change
  const handleFilterChange = useCallback((filter: typeof quickFilter) => {
    setQuickFilter(filter);
  }, []);

  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString();
  }, []);

  // Error state
  if (error) {
    return (
      <div className={`${styles.panel} ${className}`}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>Intel Reports Error</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.panel} ${isExpanded ? styles.expanded : ''} ${className}`}>
      {/* Compact Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>📊</span>
          <span className={styles.headerTitle}>Intel Reports</span>
          <div className={styles.statusIndicator}>
            <div className={`${styles.statusDot} ${!isAdapting ? styles.active : styles.inactive}`}></div>
            <span className={styles.statusText}>
              {loading ? 'Loading...' : `${filteredReports.length} reports`}
            </span>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Quick Stats */}
          <div className={styles.quickStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{metrics?.totalIntelReports || 0}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
            <div className={styles.statItem}>
              <span 
                className={styles.statValue}
                style={{ color: getPriorityColor('critical') }}
              >
                {intelReports?.filter(r => r.visualization.priority === 'critical').length || 0}
              </span>
              <span className={styles.statLabel}>Critical</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{metrics?.visibleIntelReports || 0}</span>
              <span className={styles.statLabel}>Visible</span>
            </div>
          </div>

          {/* Quick Filters */}
          <div className={styles.quickFilters}>
            <button
              className={`${styles.filterBtn} ${quickFilter === 'all' ? styles.active : ''}`}
              onClick={() => handleFilterChange('all')}
              title="Show all reports"
            >
              All
            </button>
            <button
              className={`${styles.filterBtn} ${quickFilter === 'critical' ? styles.active : ''}`}
              onClick={() => handleFilterChange('critical')}
              title="Show critical reports only"
            >
              Critical
            </button>
            <button
              className={`${styles.filterBtn} ${quickFilter === 'high' ? styles.active : ''}`}
              onClick={() => handleFilterChange('high')}
              title="Show high priority reports"
            >
              High+
            </button>
            <button
              className={`${styles.filterBtn} ${quickFilter === 'recent' ? styles.active : ''}`}
              onClick={() => handleFilterChange('recent')}
              title="Show recent reports (last hour)"
            >
              Recent
            </button>
          </div>

          {/* Expand Toggle */}
          <button
            className={styles.expandBtn}
            onClick={onToggleExpanded}
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={styles.expandedContent}>
          <div className={styles.reportList}>
            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <span>Loading reports...</span>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📋</span>
                <span>No reports match the current filter</span>
              </div>
            ) : (
              <div className={styles.reportGrid}>
                {filteredReports.slice(0, 12).map(report => (
                  <div
                    key={report.id}
                    className={styles.reportCard}
                    onClick={() => handleReportClick(report.id)}
                    title={report.title}
                  >
                    <div className={styles.cardHeader}>
                      <span className={styles.cardIcon}>{getCategoryIcon(report.metadata.category)}</span>
                      <div
                        className={styles.cardPriorityDot}
                        style={{ backgroundColor: getPriorityColor(report.visualization.priority) }}
                      />
                      <span className={styles.cardTime}>{formatTimestamp(report.timestamp)}</span>
                    </div>
                    <div className={styles.cardContent}>
                      <h4 className={styles.cardTitle}>{report.title}</h4>
                      <p className={styles.cardSummary}>{report.content.summary}</p>
                      <div className={styles.cardMeta}>
                        <span className={styles.cardCategory}>
                          {report.metadata.category.replace('_', ' ')}
                        </span>
                        <span className={styles.cardPriority}>
                          {report.visualization.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Context Info */}
          {context && (
            <div className={styles.contextInfo}>
              <span className={styles.contextLabel}>Context:</span>
              <span className={styles.contextValue}>
                {context ? 'Active' : 'Default'}
              </span>
              <span className={styles.contextSeparator}>•</span>
              <span className={styles.contextLabel}>Memory:</span>
              <span className={styles.contextValue}>
                {Math.round((metrics?.memoryUsage || 0) / 1024)}KB
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntelBottomBarPanel;
