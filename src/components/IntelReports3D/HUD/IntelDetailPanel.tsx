/**
 * IntelDetailPanel - Right sidebar Intel Reports 3D detail panel
 * Integrates with the RightSideBar to replace the existing CyberInvestigationHub
 * Shows detailed view of selected Intel Reports
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useIntelReports3D } from '../../../hooks/intelligence/useIntelReports3D';
import { useIntelGlobeSync } from '../../../hooks/intelligence/useIntelGlobeSync';
import { IntelReport3DData } from '../../../models/Intel/IntelVisualization3D';
import styles from './IntelDetailPanel.module.css';

interface IntelDetailPanelProps {
  /** Whether the panel is collapsed */
  isCollapsed?: boolean;
  /** Selected report ID */
  selectedReportId?: string;
  /** Callback when report selection changes */
  onReportSelect?: (reportId: string | null) => void;
  /** Custom CSS class */
  className?: string;
}

/**
 * IntelDetailPanel - Right sidebar detail panel for Intel Reports 3D
 * Provides detailed view of selected reports and globe integration
 */
export const IntelDetailPanel: React.FC<IntelDetailPanelProps> = ({
  isCollapsed = false,
  selectedReportId,
  onReportSelect,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'analysis' | 'relations'>('overview');
  const [showFullContent, setShowFullContent] = useState(false);

  // Hook integrations
  const {
    intelReports,
    loading,
    error,
    getIntelById,
    removeIntelReport,
    updateIntelReport
  } = useIntelReports3D();

  const {
    initialized: globeReady,
    markers: syncedReports,
    focusOnMarker: focusOnReport
  } = useIntelGlobeSync();

  // Get selected report
  const selectedReport = useMemo(() => {
    if (!selectedReportId) return null;
    return getIntelById(selectedReportId);
  }, [selectedReportId, getIntelById]);

  // Get recent reports for overview
  const recentReports = useMemo(() => {
    if (!intelReports) return [];
    return [...intelReports]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [intelReports]);

  // Priority color mapping
  const getPriorityColor = useCallback((priority: string): string => {
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
  const getCategoryIcon = useCallback((category: string): string => {
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
  const handleReportSelect = useCallback((reportId: string | null) => {
    onReportSelect?.(reportId);
    if (reportId && globeReady) {
      focusOnReport(reportId);
    }
  }, [onReportSelect, globeReady, focusOnReport]);

  // Handle report actions
  const handleReportAction = useCallback(async (action: string, report: IntelReport3DData) => {
    try {
      switch (action) {
        case 'focus':
          if (globeReady) {
            await focusOnReport(report.id);
          }
          break;
        case 'highlight':
          // For now, just focus on the report since we don't have a separate highlight function
          if (globeReady) {
            await focusOnReport(report.id);
          }
          break;
        case 'edit':
          // In a real app, this would open an edit modal
          console.log('Edit report:', report.id);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this report?')) {
            await removeIntelReport(report.id);
            if (selectedReportId === report.id) {
              handleReportSelect(null);
            }
          }
          break;
        case 'archive':
          await updateIntelReport(report.id, {
            metadata: {
              ...report.metadata,
              tags: [...report.metadata.tags, 'archived']
            }
          });
          break;
      }
    } catch (error) {
      console.error('Report action failed:', error);
    }
  }, [globeReady, focusOnReport, removeIntelReport, updateIntelReport, selectedReportId, handleReportSelect]);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }, []);

  // Render overview tab
  const renderOverview = () => (
    <div className={styles.tabContent}>
      <div className={styles.overviewStats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{intelReports?.length || 0}</span>
          <span className={styles.statLabel}>Total Reports</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{syncedReports?.length || 0}</span>
          <span className={styles.statLabel}>On Globe</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {intelReports?.filter(r => r.visualization.priority === 'critical').length || 0}
          </span>
          <span className={styles.statLabel}>Critical</span>
        </div>
      </div>

      <div className={styles.recentReports}>
        <h4 className={styles.sectionTitle}>Recent Reports</h4>
        {recentReports.map(report => (
          <div
            key={report.id}
            className={`${styles.reportCard} ${selectedReportId === report.id ? styles.selected : ''}`}
            onClick={() => handleReportSelect(report.id)}
          >
            <div className={styles.reportHeader}>
              <span className={styles.reportIcon}>{getCategoryIcon(report.metadata.category)}</span>
              <div
                className={styles.priorityDot}
                style={{ backgroundColor: getPriorityColor(report.visualization.priority) }}
              />
              <span className={styles.reportTitle}>{report.title}</span>
            </div>
            <div className={styles.reportMeta}>
              <span className={styles.reportCategory}>{report.metadata.category.replace('_', ' ')}</span>
              <span className={styles.reportTime}>{formatTimestamp(report.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render details tab for selected report
  const renderDetails = () => {
    if (!selectedReport) {
      return (
        <div className={styles.tabContent}>
          <div className={styles.noSelection}>
            <span className={styles.noSelectionIcon}>📋</span>
            <span>Select a report to view details</span>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.tabContent}>
        <div className={styles.reportDetails}>
          <div className={styles.detailHeader}>
            <div className={styles.detailTitle}>
              <span className={styles.detailIcon}>{getCategoryIcon(selectedReport.metadata.category)}</span>
              <h3>{selectedReport.title}</h3>
            </div>
            <div className={styles.detailActions}>
              <button
                className={styles.actionButton}
                onClick={() => handleReportAction('focus', selectedReport)}
                title="Focus on globe"
              >
                🌍
              </button>
              <button
                className={styles.actionButton}
                onClick={() => handleReportAction('highlight', selectedReport)}
                title="Highlight on globe"
              >
                🔍
              </button>
              <button
                className={styles.actionButton}
                onClick={() => handleReportAction('edit', selectedReport)}
                title="Edit report"
              >
                ✏️
              </button>
              <button
                className={styles.actionButton}
                onClick={() => handleReportAction('delete', selectedReport)}
                title="Delete report"
              >
                🗑️
              </button>
            </div>
          </div>

          <div className={styles.detailMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Classification:</span>
              <span className={styles.metaValue}>{selectedReport.classification}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Priority:</span>
              <span 
                className={styles.metaValue}
                style={{ color: getPriorityColor(selectedReport.visualization.priority) }}
              >
                {selectedReport.visualization.priority.toUpperCase()}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Source:</span>
              <span className={styles.metaValue}>{selectedReport.source}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Timestamp:</span>
              <span className={styles.metaValue}>{formatTimestamp(selectedReport.timestamp)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Location:</span>
              <span className={styles.metaValue}>
                {selectedReport.location.lat.toFixed(4)}, {selectedReport.location.lng.toFixed(4)}
              </span>
            </div>
          </div>

          <div className={styles.detailContent}>
            <h4 className={styles.contentTitle}>Summary</h4>
            <p className={styles.contentText}>{selectedReport.content.summary}</p>
            
            {selectedReport.content.details && (
              <>
                <h4 className={styles.contentTitle}>Details</h4>
                <p className={styles.contentText}>
                  {showFullContent ? selectedReport.content.details : 
                   `${selectedReport.content.details.substring(0, 200)}...`}
                </p>
                {selectedReport.content.details.length > 200 && (
                  <button
                    className={styles.expandButton}
                    onClick={() => setShowFullContent(!showFullContent)}
                  >
                    {showFullContent ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </>
            )}
          </div>

          <div className={styles.detailTags}>
            <h4 className={styles.contentTitle}>Tags</h4>
            <div className={styles.tagList}>
              {selectedReport.metadata.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render analysis tab
  const renderAnalysis = () => {
    if (!selectedReport) {
      return (
        <div className={styles.tabContent}>
          <div className={styles.noSelection}>
            <span className={styles.noSelectionIcon}>📊</span>
            <span>Select a report to view analysis</span>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.tabContent}>
        <div className={styles.analysisContent}>
          <h4 className={styles.contentTitle}>Reliability Analysis</h4>
          <div className={styles.analysisMetrics}>
            <div className={styles.metricBar}>
              <span className={styles.metricLabel}>Confidence</span>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${selectedReport.metadata.confidence * 100}%` }}
                />
              </div>
              <span className={styles.metricValue}>{Math.round(selectedReport.metadata.confidence * 100)}%</span>
            </div>
            <div className={styles.metricBar}>
              <span className={styles.metricLabel}>Reliability</span>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${selectedReport.metadata.reliability * 100}%` }}
                />
              </div>
              <span className={styles.metricValue}>{Math.round(selectedReport.metadata.reliability * 100)}%</span>
            </div>
            <div className={styles.metricBar}>
              <span className={styles.metricLabel}>Freshness</span>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${selectedReport.metadata.freshness * 100}%` }}
                />
              </div>
              <span className={styles.metricValue}>{Math.round(selectedReport.metadata.freshness * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render relations tab
  const renderRelations = () => {
    if (!selectedReport) {
      return (
        <div className={styles.tabContent}>
          <div className={styles.noSelection}>
            <span className={styles.noSelectionIcon}>🔗</span>
            <span>Select a report to view relations</span>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.tabContent}>
        <div className={styles.relationsContent}>
          <h4 className={styles.contentTitle}>Related Reports</h4>
          {selectedReport.relationships && selectedReport.relationships.length > 0 ? (
            <div className={styles.relationsList}>
              {selectedReport.relationships.map(relation => {
                const relatedReport = getIntelById(relation.target_intel_id);
                return (
                  <div key={relation.id} className={styles.relationItem}>
                    <div className={styles.relationHeader}>
                      <span className={styles.relationIcon}>🔗</span>
                      <span className={styles.relationType}>{relation.type}</span>
                      <span className={styles.relationStrength}>
                        {Math.round(relation.strength * 100)}%
                      </span>
                    </div>
                    {relatedReport && (
                      <div 
                        className={styles.relatedReport}
                        onClick={() => handleReportSelect(relatedReport.id)}
                      >
                        <span className={styles.relatedTitle}>{relatedReport.title}</span>
                        <span className={styles.relatedMeta}>
                          {relatedReport.metadata.category} • {formatTimestamp(relatedReport.timestamp)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.noRelations}>
              <span>No related reports found</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={`${styles.panel} ${isCollapsed ? styles.collapsed : ''} ${className}`}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          {!isCollapsed && <span>Loading Intel Details...</span>}
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
              <span>Error loading intel details</span>
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
          <span className={styles.headerIcon}>🎯</span>
          {!isCollapsed && (
            <span className={styles.headerTitle}>Intel Operations</span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      {!isCollapsed && (
        <div className={styles.tabNav}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'details' ? styles.active : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'analysis' ? styles.active : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            Analysis
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'relations' ? styles.active : ''}`}
            onClick={() => setActiveTab('relations')}
          >
            Relations
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div className={styles.content}>
        {!isCollapsed && (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'details' && renderDetails()}
            {activeTab === 'analysis' && renderAnalysis()}
            {activeTab === 'relations' && renderRelations()}
          </>
        )}
        
        {isCollapsed && (
          <div className={styles.collapsedContent}>
            <div className={styles.collapsedStats}>
              <div className={styles.collapsedStat}>
                <span className={styles.collapsedValue}>{intelReports?.length || 0}</span>
                <span className={styles.collapsedLabel}>📊</span>
              </div>
              <div className={styles.collapsedStat}>
                <span className={styles.collapsedValue}>{syncedReports?.length || 0}</span>
                <span className={styles.collapsedLabel}>🌍</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className={styles.statusFooter}>
        <div className={`${styles.statusDot} ${globeReady ? styles.active : styles.inactive}`}></div>
        {!isCollapsed && (
          <span className={styles.statusText}>
            {globeReady ? 'Globe Ready' : 'Globe Offline'}
          </span>
        )}
      </div>
    </div>
  );
};

export default IntelDetailPanel;
