/**
 * Timeline Event Item Component
 * 
 * Displays a single timeline event in the list view.
 */

import React from 'react';
import { format, parseISO } from 'date-fns';
import { TimelineEvent, TimelineEventSeverity } from '../types/timeline';
import styles from './TimelineEventItem.module.css';

// Severity color mapping
const severityColorMap: Record<TimelineEventSeverity, string> = {
  'low': '#41c7e4',
  'medium': '#e4c641',
  'high': '#e49a41',
  'critical': '#e44141'
};

// Category icon mapping
const getCategoryIcon = (category?: string) => {
  if (!category) return '📋';
  
  switch (category.toLowerCase()) {
    case 'financial': return '💰';
    case 'social': return '🗣️';
    case 'communication': return '✉️';
    case 'digital': return '💻';
    case 'threat': return '⚠️';
    case 'defense': return '🛡️';
    case 'intelligence': return '🔍';
    case 'logistics': return '📦';
    case 'technology': return '🔧';
    case 'security': return '🔒';
    case 'diplomacy': return '🤝';
    default: return '📋';
  }
};

interface TimelineEventItemProps {
  event: TimelineEvent;
  isSelected: boolean;
  onClick: () => void;
}

const TimelineEventItem: React.FC<TimelineEventItemProps> = ({ 
  event, 
  isSelected, 
  onClick 
}) => {
  const formattedDate = format(parseISO(event.timestamp), 'MMM d, yyyy HH:mm');
  const severityColor = severityColorMap[event.severity];
  const categoryIcon = getCategoryIcon(event.category);
  
  return (
    <div 
      className={`${styles.eventItem} ${isSelected ? styles.selected : ''}`} 
      onClick={onClick}
      style={{ borderLeftColor: severityColor }}
    >
      <div className={styles.timestamp}>{formattedDate}</div>
      <div className={styles.content}>
        <div className={styles.title}>
          <span className={styles.categoryIcon}>{categoryIcon}</span>
          {event.title}
        </div>
        <div className={styles.description}>{event.description}</div>
        <div className={styles.meta}>
          <span className={styles.type}>{event.type}</span>
          <span className={styles.source}>{event.source}</span>
          <span 
            className={styles.severity} 
            style={{ backgroundColor: severityColor }}
          >
            {event.severity}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimelineEventItem;
