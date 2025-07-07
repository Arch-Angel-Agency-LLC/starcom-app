/**
 * Timeline Event Details Component
 * 
 * Displays detailed information about a selected timeline event.
 */

import React from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, Info, Tag, Map, Link, Activity } from 'lucide-react';
import { TimelineEvent, TimelineEventSeverity } from '../types/timeline';
import styles from './TimelineEventDetails.module.css';

// Severity color mapping
const severityColorMap: Record<TimelineEventSeverity, string> = {
  'low': '#41c7e4',
  'medium': '#e4c641',
  'high': '#e49a41',
  'critical': '#e44141'
};

interface TimelineEventDetailsProps {
  event: TimelineEvent;
  onClose: () => void;
}

const TimelineEventDetails: React.FC<TimelineEventDetailsProps> = ({ 
  event, 
  onClose 
}) => {
  if (!event) return null;
  
  const formattedDate = format(parseISO(event.timestamp), 'MMMM d, yyyy HH:mm:ss');
  const severityColor = severityColorMap[event.severity];
  
  return (
    <div className={styles.detailsContainer}>
      <div className={styles.header} style={{ borderBottomColor: severityColor }}>
        <h3 className={styles.title}>{event.title}</h3>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>
      
      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Clock size={16} />
            <h4>Timestamp</h4>
          </div>
          <div className={styles.timestamp}>{formattedDate}</div>
        </div>
        
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Info size={16} />
            <h4>Details</h4>
          </div>
          <p className={styles.description}>{event.description}</p>
        </div>
        
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Activity size={16} />
            <h4>Event Information</h4>
          </div>
          <div className={styles.metadataGrid}>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Type</span>
              <span className={styles.metadataValue}>{event.type}</span>
            </div>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Source</span>
              <span className={styles.metadataValue}>{event.source}</span>
            </div>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Category</span>
              <span className={styles.metadataValue}>{event.category}</span>
            </div>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Severity</span>
              <span 
                className={styles.severityBadge}
                style={{ backgroundColor: severityColor }}
              >
                {event.severity}
              </span>
            </div>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Confidence</span>
              <div className={styles.confidenceBar}>
                <div 
                  className={styles.confidenceLevel} 
                  style={{ width: `${event.confidence * 100}%` }}
                />
                <span className={styles.confidenceText}>
                  {Math.round(event.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {event.location && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Map size={16} />
              <h4>Location</h4>
            </div>
            <div className={styles.location}>
              {event.location.name && (
                <div className={styles.locationName}>{event.location.name}</div>
              )}
              {event.location.coordinates && (
                <div className={styles.coordinates}>
                  {event.location.coordinates[1].toFixed(6)}, {event.location.coordinates[0].toFixed(6)}
                </div>
              )}
            </div>
          </div>
        )}
        
        {event.tags && event.tags.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Tag size={16} />
              <h4>Tags</h4>
            </div>
            <div className={styles.tags}>
              {event.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </div>
        )}
        
        {event.relatedEvents && event.relatedEvents.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Link size={16} />
              <h4>Related Events</h4>
            </div>
            <div className={styles.relatedList}>
              {event.relatedEvents.map(eventId => (
                <div key={eventId} className={styles.relatedItem}>
                  <span className={styles.relatedId}>{eventId}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineEventDetails;
