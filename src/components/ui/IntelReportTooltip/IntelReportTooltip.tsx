// IntelReportTooltip.tsx
// Enhanced lightweight tooltip component for Intel Report 3D model hover states

import React, { useMemo, useCallback } from 'react';
import { IntelReportOverlayMarker } from '../../../interfaces/IntelReportOverlay';
import { IntelReport3DPreview } from '../IntelReport3DPreview/IntelReport3DPreview';
import styles from './IntelReportTooltip.module.css';

interface IntelReportTooltipProps {
  report: IntelReportOverlayMarker | null;
  position: { x: number; y: number };
  visible: boolean;
  onClose?: () => void;
  boundaryElement?: HTMLElement | null; // For smart positioning
}

export const IntelReportTooltip: React.FC<IntelReportTooltipProps> = ({
  report,
  position,
  visible,
  onClose,
  boundaryElement
}) => {
  // Memoized timestamp formatting for performance
  const formattedTimestamp = useMemo(() => {
    if (!report?.timestamp) return 'Unknown time';
    
    try {
      const date = new Date(report.timestamp * 1000);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      console.warn('Invalid timestamp in Intel Report:', report.timestamp);
      return 'Invalid date';
    }
  }, [report?.timestamp]);

  // Memoized priority classification
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

  // Smart positioning to keep tooltip within viewport
  const tooltipStyle = useMemo(() => {
    const { x, y } = position;
    let finalX = x;
    let transform = 'translate(-50%, -100%)';
    
    if (boundaryElement || typeof window !== 'undefined') {
      const boundary = boundaryElement || document.documentElement;
      const tooltipWidth = 320; // Max width from CSS
      const tooltipHeight = 150; // Estimated height
      const padding = 20; // Safety padding
      
      // Horizontal positioning
      if (x - tooltipWidth / 2 < padding) {
        // Too close to left edge
        transform = 'translate(0%, -100%)';
        finalX = padding;
      } else if (x + tooltipWidth / 2 > boundary.clientWidth - padding) {
        // Too close to right edge
        transform = 'translate(-100%, -100%)';
        finalX = boundary.clientWidth - padding;
      }
      
      // Vertical positioning
      if (y - tooltipHeight < padding) {
        // Too close to top, show below cursor
        transform = transform.replace('-100%', '20px');
      }
    }
    
    return {
      left: finalX,
      top: y,
      transform
    };
  }, [position, boundaryElement]);

  // Memoized coordinate display
  const coordinateDisplay = useMemo(() => {
    try {
      const lat = typeof report?.latitude === 'number' ? report.latitude.toFixed(2) : '??';
      const lng = typeof report?.longitude === 'number' ? report.longitude.toFixed(2) : '??';
      return `${lat}°, ${lng}°`;
    } catch {
      console.warn('Invalid coordinates in Intel Report:', { lat: report?.latitude, lng: report?.longitude });
      return 'Invalid coordinates';
    }
  }, [report?.latitude, report?.longitude]);

  // Enhanced keyboard handling
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && onClose) {
      event.stopPropagation();
      onClose();
    }
  }, [onClose]);

  // Enhanced mouse leave handling
  const handleMouseLeave = useCallback((event: React.MouseEvent) => {
    // Only close if actually leaving the tooltip area
    const relatedTarget = event.relatedTarget as Element;
    const currentTarget = event.currentTarget as Element;
    
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      onClose?.();
    }
  }, [onClose]);

  // Early return after hooks
  if (!visible || !report) return null;

  return (
    <div
      className={`${styles.tooltip} ${visible ? styles.visible : ''}`}
      style={tooltipStyle}
      role="tooltip"
      aria-live="polite"
      aria-label={`Intel Report: ${report.title}`}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={-1} // Allow focus for keyboard users
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.modelPreview}>
            <IntelReport3DPreview 
              report={report}
              size={48}
              animated={true}
              className={styles.tooltipModel}
            />
          </div>
          <div className={styles.headerInfo}>
            <h4 className={styles.title}>{report.title || 'Untitled Report'}</h4>
            <div className={`${styles.priority} ${priorityInfo.class}`}>
              {priorityInfo.label}
            </div>
          </div>
        </div>
        
        <div className={styles.details}>
          <div className={styles.timestamp} title={`Report timestamp: ${formattedTimestamp}`}>
            📅 {formattedTimestamp}
          </div>
          
          <div className={styles.location} title={`Report location: ${coordinateDisplay}`}>
            🌍 {coordinateDisplay}
          </div>
          
          {report.tags && report.tags.length > 0 && (
            <div className={styles.tags}>
              {report.tags.slice(0, 3).map((tag, index) => (
                <span key={`${tag}-${index}`} className={styles.tag} title={`Tag: ${tag}`}>
                  {tag}
                </span>
              ))}
              {report.tags.length > 3 && (
                <span className={styles.tagMore} title={`${report.tags.length - 3} more tags`}>
                  +{report.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className={styles.footer}>
          <span className={styles.hint}>Click for details</span>
        </div>
      </div>
      
      <div className={styles.arrow} aria-hidden="true" />
    </div>
  );
};

export default IntelReportTooltip;
