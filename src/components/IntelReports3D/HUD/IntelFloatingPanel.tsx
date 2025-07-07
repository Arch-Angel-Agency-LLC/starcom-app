/**
 * IntelFloatingPanel - Floating Intel Reports 3D panel
 * Provides a draggable, resizable floating panel for Intel Reports
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useIntelReports3D } from '../../../hooks/intelligence/useIntelReports3D';
import { useIntelGlobeSync } from '../../../hooks/intelligence/useIntelGlobeSync';
import styles from './IntelFloatingPanel.module.css';

interface IntelFloatingPanelProps {
  /** Whether the panel is visible */
  isVisible?: boolean;
  /** Initial position */
  initialPosition?: { x: number; y: number };
  /** Initial size */
  initialSize?: { width: number; height: number };
  /** Callback when panel is closed */
  onClose?: () => void;
  /** Callback when panel is minimized */
  onMinimize?: () => void;
  /** Selected report ID */
  selectedReportId?: string;
  /** Custom CSS class */
  className?: string;
}

/**
 * IntelFloatingPanel - Floating panel for Intel Reports 3D
 * Provides a flexible, moveable interface for Intel Reports
 */
export const IntelFloatingPanel: React.FC<IntelFloatingPanelProps> = ({
  isVisible = true,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 400, height: 500 },
  onClose,
  onMinimize,
  selectedReportId,
  className = ''
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size] = useState(initialSize);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'details' | 'map'>('reports');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const panelRef = useRef<HTMLDivElement>(null);

  // Hook integrations
  const {
    intelReports,
    loading,
    error,
    getIntelById,
    selectIntelReport,
    clearSelection
  } = useIntelReports3D();

  const {
    initialized: globeReady,
    focusOnMarker: focusOnReport
  } = useIntelGlobeSync();

  // Get selected report
  const selectedReport = selectedReportId ? getIntelById(selectedReportId) : null;

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    
    setIsDragging(true);
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, []);

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Handle minimize toggle
  const handleMinimizeToggle = useCallback(() => {
    setIsMinimized(!isMinimized);
    onMinimize?.();
  }, [isMinimized, onMinimize]);

  // Handle report selection
  const handleReportSelect = useCallback((reportId: string) => {
    selectIntelReport(reportId);
    if (globeReady) {
      focusOnReport(reportId);
    }
  }, [selectIntelReport, globeReady, focusOnReport]);

  // Handle panel close
  const handleClose = useCallback(() => {
    clearSelection();
    onClose?.();
  }, [clearSelection, onClose]);

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

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: Date): string => {
    return new Date(timestamp).toLocaleString();
  }, []);

  // Render reports tab
  const renderReportsTab = () => (
    <div className={styles.tabContent}>
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Loading reports...</span>
        </div>
      ) : error ? (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>Error loading reports</span>
        </div>
      ) : (
        <div className={styles.reportsList}>
          {intelReports?.slice(0, 10).map(report => (
            <div
              key={report.id}
              className={`${styles.reportItem} ${selectedReportId === report.id ? styles.selected : ''}`}
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
              <p className={styles.reportSummary}>{report.content.summary}</p>
            </div>
          )) || (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📋</span>
              <span>No reports available</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render details tab
  const renderDetailsTab = () => (
    <div className={styles.tabContent}>
      {selectedReport ? (
        <div className={styles.reportDetails}>
          <div className={styles.detailHeader}>
            <div className={styles.detailTitle}>
              <span className={styles.detailIcon}>{getCategoryIcon(selectedReport.metadata.category)}</span>
              <h3>{selectedReport.title}</h3>
            </div>
            <div className={styles.detailMeta}>
              <span className={styles.metaItem}>
                <strong>Priority:</strong> 
                <span style={{ color: getPriorityColor(selectedReport.visualization.priority) }}>
                  {selectedReport.visualization.priority}
                </span>
              </span>
              <span className={styles.metaItem}>
                <strong>Source:</strong> {selectedReport.source}
              </span>
              <span className={styles.metaItem}>
                <strong>Classification:</strong> {selectedReport.classification}
              </span>
            </div>
          </div>
          <div className={styles.detailContent}>
            <h4>Summary</h4>
            <p>{selectedReport.content.summary}</p>
            {selectedReport.content.details && (
              <>
                <h4>Details</h4>
                <p>{selectedReport.content.details}</p>
              </>
            )}
            <h4>Location</h4>
            <p>
              Lat: {selectedReport.location.lat.toFixed(4)}, 
              Lng: {selectedReport.location.lng.toFixed(4)}
            </p>
            <h4>Tags</h4>
            <div className={styles.tagList}>
              {selectedReport.metadata.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.noSelection}>
          <span className={styles.noSelectionIcon}>📋</span>
          <span>Select a report to view details</span>
        </div>
      )}
    </div>
  );

  // Render map tab
  const renderMapTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.mapPlaceholder}>
        <span className={styles.mapIcon}>🗺️</span>
        <span>Map integration coming soon</span>
        <p>This will show intel reports on an interactive map</p>
      </div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <div
      ref={panelRef}
      className={`${styles.panel} ${isMinimized ? styles.minimized : ''} ${className}`}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? 'auto' : size.width,
        height: isMinimized ? 'auto' : size.height
      }}
    >
      {/* Title Bar */}
      <div 
        className={styles.titleBar}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.titleLeft}>
          <span className={styles.titleIcon}>📊</span>
          <span className={styles.titleText}>Intel Reports 3D</span>
          <div className={styles.statusIndicator}>
            <div className={`${styles.statusDot} ${globeReady ? styles.active : styles.inactive}`}></div>
          </div>
        </div>
        <div className={styles.titleRight}>
          <button
            className={styles.controlBtn}
            onClick={handleMinimizeToggle}
            title={isMinimized ? 'Restore' : 'Minimize'}
          >
            {isMinimized ? '🔺' : '🔻'}
          </button>
          <button
            className={styles.controlBtn}
            onClick={handleClose}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <>
          {/* Tab Navigation */}
          <div className={styles.tabNav}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'reports' ? styles.active : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Reports
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'details' ? styles.active : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'map' ? styles.active : ''}`}
              onClick={() => setActiveTab('map')}
            >
              Map
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles.content}>
            {activeTab === 'reports' && renderReportsTab()}
            {activeTab === 'details' && renderDetailsTab()}
            {activeTab === 'map' && renderMapTab()}
          </div>

          {/* Resize Handle */}
          <div 
            className={styles.resizeHandle}
            onMouseDown={(e) => {
              e.preventDefault();
              // Resize functionality can be implemented later
            }}
          />
        </>
      )}
    </div>
  );
};

export default IntelFloatingPanel;
