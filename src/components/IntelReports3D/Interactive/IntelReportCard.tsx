/**
 * IntelReportCard - Individual Intel Report display component
 * Provides a card-based interface for displaying intel report data
 */

import React, { useState, useCallback, useMemo } from 'react';
import { IntelReport3DData, IntelPriority, IntelClassification } from '../../../types/intelligence/IntelReportTypes';
import styles from './IntelReportCard.module.css';

interface IntelReportCardProps {
  /** Intel report data to display */
  report: IntelReport3DData;
  /** Whether the card is selected */
  isSelected?: boolean;
  /** Whether to show detailed view */
  showDetails?: boolean;
  /** Whether the card is interactive */
  interactive?: boolean;
  /** Callback when card is clicked */
  onClick?: (report: IntelReport3DData) => void;
  /** Callback when card is selected */
  onSelect?: (report: IntelReport3DData) => void;
  /** Callback when report actions are triggered */
  onAction?: (action: string, report: IntelReport3DData) => void;
  /** Custom CSS class */
  className?: string;
  /** Compact display mode */
  compact?: boolean;
}

/**
 * Get priority color class
 */
const getPriorityColor = (priority: IntelPriority): string => {
  switch (priority) {
    case 'critical': return styles.priorityCritical;
    case 'high': return styles.priorityHigh;
    case 'medium': return styles.priorityMedium;
    case 'low': return styles.priorityLow;
    case 'background': return styles.priorityBackground;
    default: return styles.priorityMedium;
  }
};

/**
 * Get classification color class
 */
const getClassificationColor = (classification: IntelClassification): string => {
  switch (classification) {
    case 'TOP_SECRET': return styles.classificationTopSecret;
    case 'SECRET': return styles.classificationSecret;
    case 'CONFIDENTIAL': return styles.classificationConfidential;
    case 'COMPARTMENTED': return styles.classificationCompartmented;
    case 'UNCLASSIFIED': return styles.classificationUnclassified;
    default: return styles.classificationUnclassified;
  }
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m ago`;
  }
};

/**
 * IntelReportCard - Individual report display component
 */
export const IntelReportCard: React.FC<IntelReportCardProps> = ({
  report,
  isSelected = false,
  showDetails = false,
  interactive = true,
  onClick,
  onSelect,
  onAction,
  className = '',
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [isHovered, setIsHovered] = useState(false);

  // Handle card click
  const handleClick = useCallback(() => {
    if (!interactive) return;
    onClick?.(report);
  }, [interactive, onClick, report]);

  // Handle card selection
  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(report);
  }, [onSelect, report]);

  // Handle action triggers
  const handleAction = useCallback((action: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction?.(action, report);
  }, [onAction, report]);

  // Toggle expanded state
  const toggleExpanded = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // Compute derived properties
  const priorityClass = useMemo(() => getPriorityColor(report.visualization.priority), [report.visualization.priority]);
  const classificationClass = useMemo(() => getClassificationColor(report.classification), [report.classification]);
  const timeAgo = useMemo(() => formatTimestamp(report.timestamp), [report.timestamp]);
  const isExpired = useMemo(() => {
    return report.expiresAt ? new Date() > report.expiresAt : false;
  }, [report.expiresAt]);

  // Compute card classes
  const cardClasses = useMemo(() => [
    styles.card,
    priorityClass,
    isSelected && styles.selected,
    isHovered && styles.hovered,
    isExpired && styles.expired,
    compact && styles.compact,
    !interactive && styles.nonInteractive,
    className
  ].filter(Boolean).join(' '), [
    priorityClass,
    isSelected,
    isHovered,
    isExpired,
    compact,
    interactive,
    className
  ]);

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={interactive ? "button" : "article"}
      tabIndex={interactive ? 0 : -1}
      aria-selected={isSelected}
      aria-expanded={isExpanded}
    >
      {/* Card Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {/* Selection checkbox */}
          {interactive && (
            <button
              className={styles.selectButton}
              onClick={handleSelect}
              aria-label={`Select report ${report.title}`}
            >
              <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                {isSelected && <span className={styles.checkmark}>✓</span>}
              </div>
            </button>
          )}

          {/* Priority indicator */}
          <div
            className={`${styles.priorityIndicator} ${priorityClass}`}
            title={`Priority: ${report.visualization.priority}`}
          />

          {/* Classification badge */}
          <span className={`${styles.classification} ${classificationClass}`}>
            {report.classification}
          </span>
        </div>

        <div className={styles.headerRight}>
          {/* Timestamp */}
          <span className={styles.timestamp} title={report.timestamp.toLocaleString()}>
            {timeAgo}
          </span>

          {/* Expand/collapse button */}
          {!compact && (
            <button
              className={styles.expandButton}
              onClick={toggleExpanded}
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
            >
              <span className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                ▼
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Card Title */}
      <div className={styles.title}>
        <h3 className={styles.titleText}>{report.title}</h3>
        {report.location.region && (
          <span className={styles.region}>{report.location.region}</span>
        )}
      </div>

      {/* Card Summary */}
      <div className={styles.summary}>
        {report.content.summary}
      </div>

      {/* Tags */}
      {report.metadata.tags.length > 0 && (
        <div className={styles.tags}>
          {report.metadata.tags.slice(0, compact ? 2 : 4).map((tag, index) => (
            <span key={index} className={styles.tag}>
              {tag}
            </span>
          ))}
          {report.metadata.tags.length > (compact ? 2 : 4) && (
            <span className={styles.tagMore}>
              +{report.metadata.tags.length - (compact ? 2 : 4)}
            </span>
          )}
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && !compact && (
        <div className={styles.expandedContent}>
          {/* Metadata */}
          <div className={styles.metadata}>
            <div className={styles.metadataRow}>
              <span className={styles.metadataLabel}>Source:</span>
              <span className={styles.metadataValue}>{report.source}</span>
            </div>
            <div className={styles.metadataRow}>
              <span className={styles.metadataLabel}>Category:</span>
              <span className={styles.metadataValue}>{report.metadata.category}</span>
            </div>
            <div className={styles.metadataRow}>
              <span className={styles.metadataLabel}>Confidence:</span>
              <span className={styles.metadataValue}>
                {Math.round(report.metadata.confidence * 100)}%
              </span>
            </div>
            {report.metadata.threat_level && (
              <div className={styles.metadataRow}>
                <span className={styles.metadataLabel}>Threat:</span>
                <span className={`${styles.metadataValue} ${styles.threatLevel} ${styles[`threat${report.metadata.threat_level.charAt(0).toUpperCase() + report.metadata.threat_level.slice(1)}`]}`}>
                  {report.metadata.threat_level}
                </span>
              </div>
            )}
          </div>

          {/* Location */}
          <div className={styles.location}>
            <span className={styles.locationIcon}>📍</span>
            <span className={styles.locationText}>
              {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
              {report.location.altitude && ` (${report.location.altitude}m)`}
            </span>
          </div>

          {/* Action buttons */}
          {interactive && (
            <div className={styles.actions}>
              <button
                className={styles.actionButton}
                onClick={handleAction('view')}
                title="View details"
              >
                View
              </button>
              <button
                className={styles.actionButton}
                onClick={handleAction('locate')}
                title="Show on map"
              >
                Locate
              </button>
              <button
                className={styles.actionButton}
                onClick={handleAction('share')}
                title="Share report"
              >
                Share
              </button>
            </div>
          )}
        </div>
      )}

      {/* Expiration warning */}
      {isExpired && (
        <div className={styles.expirationWarning}>
          ⚠️ This report has expired
        </div>
      )}
    </div>
  );
};

export default IntelReportCard;
