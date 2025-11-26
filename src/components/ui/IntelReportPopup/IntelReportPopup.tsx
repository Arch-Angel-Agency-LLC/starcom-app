// IntelReportPopup.tsx
// Enhanced detailed popup component for Intel Report 3D model click interactions

import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { IntelReportOverlayMarker } from '../../../interfaces/IntelReportOverlay';
import { IntelReport3DPreview } from '../IntelReport3DPreview/IntelReport3DPreview';
import styles from './IntelReportPopup.module.css';

interface IntelReportPopupProps {
  report: IntelReportOverlayMarker | null;
  visible: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  loading?: boolean;
  error?: string | null;
}

export const IntelReportPopup: React.FC<IntelReportPopupProps> = ({
  report,
  visible,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  loading = false,
  error = null
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Enhanced keyboard navigation with focus management
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!visible) return;
    
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
      case 'ArrowLeft':
        if (hasPrevious && onPrevious) {
          event.preventDefault();
          onPrevious();
        }
        break;
      case 'ArrowRight':
        if (hasNext && onNext) {
          event.preventDefault();
          onNext();
        }
        break;
      case 'Tab':
        // Trap focus within popup
        if (popupRef.current) {
          const focusableElements = popupRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
        break;
    }
  }, [visible, onClose, onPrevious, onNext, hasPrevious, hasNext]);

  // Enhanced effect with focus management
  useEffect(() => {
    if (visible) {
      // Store previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      // Focus the popup for accessibility
      setTimeout(() => {
        popupRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
      
      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [visible, handleKeyDown]);

  // Memoized timestamp formatting with error handling
  const formattedTimestamp = useMemo(() => {
    if (!report?.timestamp) return 'Unknown time';
    
    try {
      const date = new Date(report.timestamp * 1000);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      return date.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch {
      console.warn('Invalid timestamp in Intel Report:', report.timestamp);
      return 'Invalid date';
    }
  }, [report?.timestamp]);

  // Memoized priority classification with fallbacks
  const priorityInfo = useMemo(() => {
    const tags = report?.tags || [];
    
    if (tags.includes('URGENT') || tags.includes('CRITICAL')) {
      return { class: styles.priorityCritical, label: 'CRITICAL' };
    }
    if (tags.includes('HIGH')) {
      return { class: styles.priorityHigh, label: 'HIGH' };
    }
    if (tags.includes('MEDIUM')) {
      return { class: styles.priorityMedium, label: 'MEDIUM' };
    }
    return { class: styles.priorityLow, label: 'STANDARD' };
  }, [report?.tags]);

  // Memoized classification extraction
  const classification = useMemo(() => {
    const tags = report?.tags || [];
    const classificationTags = ['CLASSIFIED', 'SECRET', 'TOP_SECRET', 'UNCLASSIFIED'];
    return tags.find(tag => classificationTags.includes(tag)) || 'UNCLASSIFIED';
  }, [report?.tags]);

  // Memoized source extraction
  const sourceInfo = useMemo(() => {
    const tags = report?.tags || [];
    const sourceTags = tags.filter(tag => 
      tag.startsWith('SOURCE_') || 
      ['SIGINT', 'HUMINT', 'OSINT', 'IMAGERY', 'TECHNICAL'].includes(tag)
    );
    return sourceTags.length > 0 ? sourceTags[0] : 'UNKNOWN';
  }, [report?.tags]);

  // Enhanced close handler with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200); // Match CSS animation duration
  }, [onClose]);

  // Enhanced overlay click handler
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  // Enhanced coordinate display with validation
  const coordinateDisplay = useMemo(() => {
    try {
      const lat = typeof report?.latitude === 'number' ? report.latitude.toFixed(4) : '??';
      const lng = typeof report?.longitude === 'number' ? report.longitude.toFixed(4) : '??';
      return `${lat}°, ${lng}°`;
    } catch {
      return 'Invalid coordinates';
    }
  }, [report?.latitude, report?.longitude]);

  if (!visible) return null;

  // Show loading state
  if (loading) {
    return (
      <div className={styles.overlay} onClick={handleOverlayClick}>
        <div className={styles.popup} role="dialog" aria-modal="true">
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} aria-label="Loading report details..." />
            <p>Loading Intel Report details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.overlay} onClick={handleOverlayClick}>
        <div className={styles.popup} role="dialog" aria-modal="true">
          <div className={styles.errorContainer}>
            <h3>Error Loading Report</h3>
            <p>{error}</p>
            <button onClick={handleClose} className={styles.actionButton}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show report not available state
  if (!report) {
    return (
      <div className={styles.overlay} onClick={handleOverlayClick}>
        <div className={styles.popup} role="dialog" aria-modal="true">
          <div className={styles.errorContainer}>
            <h3>Report Not Available</h3>
            <p>The requested Intel Report could not be found.</p>
            <button onClick={handleClose} className={styles.actionButton}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        ref={popupRef}
        className={`${styles.popup} ${visible ? styles.visible : ''} ${isClosing ? styles.closing : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
        aria-describedby="popup-content"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <div className={styles.modelPreview}>
                <IntelReport3DPreview
                  report={report}
                  size={96}
                  animated
                  className={styles.headerModel}
                />
              </div>
              <div className={styles.titleInfo}>
                <h2 id="popup-title" className={styles.title}>
                  {report.title || 'Untitled Report'}
                </h2>
                <p className={styles.subtitle}>
                  {sourceInfo} • {coordinateDisplay}
                </p>
                <div className={styles.headerTags}>
                  <span className={`${styles.priority} ${priorityInfo.class}`}>
                    {priorityInfo.label}
                  </span>
                  <span className={styles.classification}>
                    {classification}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close popup"
          >
            ×
          </button>
        </div>

        <div id="popup-content" className={styles.content}>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryIcon} aria-hidden="true">📅</span>
              <div className={styles.summaryCopy}>
                <span className={styles.summaryLabel}>Timestamp</span>
                <span className={styles.summaryValue}>{formattedTimestamp}</span>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryIcon} aria-hidden="true">🌍</span>
              <div className={styles.summaryCopy}>
                <span className={styles.summaryLabel}>Location</span>
                <span className={styles.summaryValue}>{coordinateDisplay}</span>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryIcon} aria-hidden="true">📡</span>
              <div className={styles.summaryCopy}>
                <span className={styles.summaryLabel}>Source</span>
                <span className={styles.summaryValue}>{sourceInfo}</span>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryIcon} aria-hidden="true">🛡️</span>
              <div className={styles.summaryCopy}>
                <span className={styles.summaryLabel}>Classification</span>
                <span className={styles.summaryValue}>{classification}</span>
              </div>
            </div>
          </div>

          <section className={`${styles.panel} ${styles.descriptionPanel}`}>
            <h3 className={styles.panelTitle}>Report Narrative</h3>
            <p className={styles.descriptionText}>
              {report.content || 'No detailed description available for this intelligence report.'}
            </p>
          </section>

          {report.tags && report.tags.length > 0 && (
            <section className={`${styles.panel} ${styles.tagsPanel}`}>
              <h3 className={styles.panelTitle}>Tags &amp; Classifications</h3>
              <div className={styles.tags}>
                {report.tags.map((tag, index) => (
                  <span key={`${tag}-${index}`} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className={styles.analysisGrid}>
            <div className={`${styles.analysisCard} ${styles.panel}`}>
              <div className={styles.analysisHeader}>
                <span className={styles.analysisIcon} aria-hidden="true">🛡️</span>
                <h4 className={styles.analysisTitle}>Threat Assessment</h4>
              </div>
              <div className={styles.threatLevel}>
                <span className={styles.threatLabel}>Threat Level</span>
                <span className={`${styles.threatIndicator} ${getThreatLevel(report.tags).class}`}>
                  {getThreatLevel(report.tags).level}
                </span>
              </div>
              <p className={styles.analysisText}>
                {generateThreatAssessment(report)}
              </p>
            </div>

            <div className={`${styles.analysisCard} ${styles.panel}`}>
              <div className={styles.analysisHeader}>
                <span className={styles.analysisIcon} aria-hidden="true">📊</span>
                <h4 className={styles.analysisTitle}>Intelligence Confidence</h4>
              </div>
              <div className={styles.confidenceBar}>
                <div className={styles.confidenceLabel}>Source Reliability</div>
                <div className={styles.confidenceIndicator}>
                  <div
                    className={styles.confidenceFill}
                    style={{ width: `${getConfidenceLevel(report.tags)}%` }}
                  />
                  <span className={styles.confidenceValue}>
                    {getConfidenceLevel(report.tags)}%
                  </span>
                </div>
              </div>
              <p className={styles.analysisText}>
                {generateConfidenceAssessment(report)}
              </p>
            </div>

            <div className={`${styles.analysisCard} ${styles.panel}`}>
              <div className={styles.analysisHeader}>
                <span className={styles.analysisIcon} aria-hidden="true">⚡</span>
                <h4 className={styles.analysisTitle}>Recommended Actions</h4>
              </div>
              <div className={styles.actionItems}>
                {generateRecommendedActions(report).map((action, index) => (
                  <div key={index} className={styles.actionItem}>
                    <span className={styles.actionPriority}>{action.priority}</span>
                    <span className={styles.actionText}>{action.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${styles.analysisCard} ${styles.panel}`}>
              <div className={styles.analysisHeader}>
                <span className={styles.analysisIcon} aria-hidden="true">🔗</span>
                <h4 className={styles.analysisTitle}>Related Intelligence</h4>
              </div>
              <div className={styles.relatedItems}>
                {generateRelatedIntelligence(report).map((item, index) => (
                  <div key={index} className={styles.relatedItem}>
                    <span className={styles.relatedType}>{item.type}</span>
                    <span className={styles.relatedDescription}>{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.infoPanel}`}>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Report ID</span>
                <span className={styles.infoValue}>{report.pubkey.slice(0, 8)}...</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Author</span>
                <span className={styles.infoValue}>{report.author.slice(0, 8)}...</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Collection Method</span>
                <span className={styles.infoValue}>{getCollectionMethod(report.tags)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Distribution</span>
                <span className={styles.infoValue}>{getDistributionLevel(report.tags)}</span>
              </div>
            </div>
          </section>
        </div>

        <div className={styles.footer}>
          <div className={styles.navigation}>
            <button
              className={`${styles.navButton} ${!hasPrevious ? styles.disabled : ''}`}
              onClick={onPrevious}
              disabled={!hasPrevious}
              aria-label="Previous report"
            >
              ← Previous
            </button>
            <button
              className={`${styles.navButton} ${!hasNext ? styles.disabled : ''}`}
              onClick={onNext}
              disabled={!hasNext}
              aria-label="Next report"
            >
              Next →
            </button>
          </div>
          <div className={styles.actions}>
            <button
              className={styles.actionButton}
              onClick={() => {
                const exportData = {
                  report,
                  analysis: {
                    threatLevel: getThreatLevel(report.tags),
                    confidence: getConfidenceLevel(report.tags),
                    actions: generateRecommendedActions(report),
                    relatedIntel: generateRelatedIntelligence(report)
                  }
                };
                console.log('Export detailed analysis:', exportData);
              }}
            >
              📄 Export Analysis
            </button>
            <button
              className={styles.actionButton}
              onClick={() => {
                console.log('Create investigation task from report:', report.pubkey);
              }}
            >
              📋 Create Task
            </button>
            <button
              className={styles.actionButton}
              onClick={() => {
                console.log('Flag report for follow-up:', report.pubkey);
              }}
            >
              🔄 Follow-up
            </button>
            <button
              className={styles.actionButton}
              onClick={() => {
                console.log('Share report with team:', report.pubkey);
              }}
            >
              👥 Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Utility functions for intelligence analysis

function getThreatLevel(tags: string[] = []) {
  if (tags.includes('CRITICAL') || tags.includes('URGENT')) {
    return { level: 'CRITICAL', class: 'threatCritical' };
  }
  if (tags.includes('HIGH') || tags.includes('WEAPONS')) {
    return { level: 'HIGH', class: 'threatHigh' };
  }
  if (tags.includes('MEDIUM') || tags.includes('SURVEILLANCE')) {
    return { level: 'MEDIUM', class: 'threatMedium' };
  }
  return { level: 'LOW', class: 'threatLow' };
}

function getConfidenceLevel(tags: string[] = []) {
  if (tags.includes('VERIFIED') || tags.includes('CONFIRMED')) return 95;
  if (tags.includes('PROBABLE') || tags.includes('SIGINT')) return 80;
  if (tags.includes('POSSIBLE') || tags.includes('HUMINT')) return 65;
  if (tags.includes('OSINT')) return 50;
  return 30;
}

function generateThreatAssessment(report: IntelReportOverlayMarker) {
  const tags = report.tags || [];
  
  if (tags.includes('CYBER')) {
    return 'Cybersecurity threat detected. Immediate defensive measures recommended.';
  }
  if (tags.includes('WEAPONS')) {
    return 'Weapons-related intelligence. Enhanced security protocols advised.';
  }
  if (tags.includes('SURVEILLANCE')) {
    return 'Surveillance activity identified. Counter-surveillance measures suggested.';
  }
  if (tags.includes('FINANCIAL')) {
    return 'Financial intelligence indicators. Economic impact assessment required.';
  }
  
  return 'Standard intelligence assessment. Routine monitoring recommended.';
}

function generateConfidenceAssessment(report: IntelReportOverlayMarker) {
  const tags = report.tags || [];
  
  if (tags.includes('VERIFIED')) {
    return 'High confidence - Multiple independent sources confirm this intelligence.';
  }
  if (tags.includes('SIGINT')) {
    return 'Good confidence - Technical intelligence provides reliable indicators.';
  }
  if (tags.includes('HUMINT')) {
    return 'Moderate confidence - Human source requires corroboration.';
  }
  if (tags.includes('OSINT')) {
    return 'Limited confidence - Open source information needs verification.';
  }
  
  return 'Assessment pending - Additional sources required for confirmation.';
}

function generateRecommendedActions(report: IntelReportOverlayMarker) {
  const tags = report.tags || [];
  const actions = [];
  
  if (tags.includes('CRITICAL') || tags.includes('URGENT')) {
    actions.push({ priority: 'IMMEDIATE', text: 'Alert security teams and initiate emergency protocols' });
    actions.push({ priority: 'HIGH', text: 'Coordinate with relevant agencies for threat mitigation' });
  }
  
  if (tags.includes('CYBER')) {
    actions.push({ priority: 'HIGH', text: 'Implement additional cybersecurity measures' });
    actions.push({ priority: 'MEDIUM', text: 'Review and update incident response procedures' });
  }
  
  if (tags.includes('SURVEILLANCE')) {
    actions.push({ priority: 'MEDIUM', text: 'Deploy counter-surveillance countermeasures' });
    actions.push({ priority: 'LOW', text: 'Increase awareness training for personnel' });
  }
  
  // Default actions
  if (actions.length === 0) {
    actions.push({ priority: 'MEDIUM', text: 'Continue monitoring for developments' });
    actions.push({ priority: 'LOW', text: 'Archive report for future analysis' });
  }
  
  return actions;
}

function generateRelatedIntelligence(report: IntelReportOverlayMarker) {
  const tags = report.tags || [];
  const related = [];
  
  if (tags.includes('CYBER')) {
    related.push({ type: 'TREND', description: 'Part of ongoing cyber threat campaign' });
    related.push({ type: 'TECHNIQUE', description: 'Similar attack vectors identified in recent reports' });
  }
  
  if (tags.includes('GEOGRAPHICAL')) {
    related.push({ type: 'REGIONAL', description: 'Geographic correlation with previous incidents' });
  }
  
  if (tags.includes('FINANCIAL')) {
    related.push({ type: 'ECONOMIC', description: 'Connected to broader financial intelligence patterns' });
  }
  
  // Default related intelligence
  if (related.length === 0) {
    related.push({ type: 'ARCHIVE', description: 'Historical precedents in intelligence database' });
    related.push({ type: 'PATTERN', description: 'Analysis indicates potential for follow-up activity' });
  }
  
  return related;
}

function getCollectionMethod(tags: string[] = []) {
  if (tags.includes('SIGINT')) return 'Signals Intelligence';
  if (tags.includes('HUMINT')) return 'Human Intelligence';
  if (tags.includes('IMAGERY')) return 'Imagery Intelligence';
  if (tags.includes('OSINT')) return 'Open Source Intelligence';
  if (tags.includes('TECHNICAL')) return 'Technical Intelligence';
  return 'Multi-Source';
}

function getDistributionLevel(tags: string[] = []) {
  if (tags.includes('TOP_SECRET')) return 'Top Secret';
  if (tags.includes('SECRET')) return 'Secret';
  if (tags.includes('CLASSIFIED')) return 'Classified';
  return 'Official Use Only';
}

export default IntelReportPopup;
