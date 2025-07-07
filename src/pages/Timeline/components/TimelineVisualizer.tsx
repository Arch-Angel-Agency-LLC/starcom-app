/**
 * TimelineVisualizer Component
 * 
 * This component provides a visualization of timeline data using the TimelineAdapter
 * from the IntelDataCore system.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTimelineData } from '../../../core/intel/hooks/useTimelineData';
import { TimelineItem, TimelineFilter, TimelineGroup } from '../../../core/intel/adapters/timelineAdapter';
import styles from './TimelineVisualizer.module.css';

// Timeline Item component to display a single event
const TimelineEventItem: React.FC<{ item: TimelineItem, onClick: (id: string) => void }> = ({ item, onClick }) => {
  const handleClick = () => onClick(item.id);
  
  return (
    <div 
      className={`${styles.timelineItem} ${styles[`priority-${item.importance >= 70 ? 'high' : item.importance >= 40 ? 'medium' : 'low'}`]}`} 
      onClick={handleClick}
      style={{ 
        left: `${new Date(item.startTime).getTime() / 86400000}px`,
        width: item.endTime 
          ? `${(new Date(item.endTime).getTime() - new Date(item.startTime).getTime()) / 86400000}px` 
          : 'auto'
      }}
    >
      <div className={styles.itemHeader}>
        <span className={styles.eventType}>{item.type}</span>
        <span className={styles.dateRange}>
          {new Date(item.startTime).toLocaleDateString()}
          {item.endTime && ` - ${new Date(item.endTime).toLocaleDateString()}`}
        </span>
      </div>
      <h3 className={styles.itemTitle}>{item.title}</h3>
      <p className={styles.itemDescription}>{item.description || ""}</p>
      {item.relatedIds && item.relatedIds.length > 0 && (
        <div className={styles.relatedEntities}>
          <span className={styles.relatedLabel}>Related: </span>
          {item.relatedIds.map((id, idx) => (
            <span key={id} className={styles.relatedItem}>
              {id}{idx < item.relatedIds.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// TimelineVisualizer props
interface TimelineVisualizerProps {
  initialFilters?: TimelineFilter[];
}

/**
 * TimelineVisualizer Component
 */
const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({ initialFilters }) => {
  // Get timeline data using the hook
  const { 
    timelineData, 
    loading, 
    error, 
    stats,
    applyFilters
  } = useTimelineData(initialFilters);
  
  // Local state
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [currentFilters, setCurrentFilters] = useState<TimelineFilter[]>(initialFilters || []);
  
  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Handle event selection
  const handleEventClick = (id: string) => {
    setSelectedEvent(id === selectedEvent ? null : id);
  };
  
  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };
  
  const handleResetZoom = () => {
    setZoomLevel(1);
  };
  
  // Handle filter changes
  const handleFilterChange = useCallback(() => {
    const newFilters: TimelineFilter[] = [];
    
    // Add time range filters
    if (startTime) {
      newFilters.push({
        property: 'startTime',
        operator: 'after',
        value: new Date(startTime)
      });
    }
    
    if (endTime) {
      newFilters.push({
        property: 'endTime',
        operator: 'before',
        value: new Date(endTime)
      });
    }
    
    // Add type filters
    if (selectedTypes.length > 0) {
      selectedTypes.forEach(type => {
        newFilters.push({
          property: 'type',
          operator: 'equals',
          value: type
        });
      });
    }
    
    setCurrentFilters(newFilters);
    applyFilters(newFilters);
  }, [startTime, endTime, selectedTypes, applyFilters]);
  
  // Initialize filter form
  useEffect(() => {
    // Future implementation: Initialize filters from props or stored state
  }, []);
  
  // Render loading state
  if (loading) {
    return <div className={styles.loading}>Loading timeline data...</div>;
  }
  
  // Render error state
  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }
  
  return (
    <div className={styles.timelineVisualizer}>
      <div className={styles.controlPanel}>
        <div className={styles.filterSection}>
          <h3>Timeline Filters</h3>
          
          <div className={styles.filterRow}>
            <div className={styles.filterItem}>
              <label htmlFor="startTime">Start Time:</label>
              <input
                type="date"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            
            <div className={styles.filterItem}>
              <label htmlFor="endTime">End Time:</label>
              <input
                type="date"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          
          <div className={styles.filterRow}>
            <div className={styles.filterItem}>
              <label>Event Types:</label>
              <div className={styles.checkboxGroup}>
                {Object.entries(stats?.eventsByType || {}).map(([type, count]) => (
                  <label key={type} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTypes([...selectedTypes, type]);
                        } else {
                          setSelectedTypes(selectedTypes.filter(t => t !== type));
                        }
                      }}
                    />
                    {type} ({count})
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <button 
            className={styles.applyFilters}
            onClick={handleFilterChange}
          >
            Apply Filters
          </button>
        </div>
        
        <div className={styles.zoomControls}>
          <button onClick={handleZoomOut} className={styles.zoomButton}>-</button>
          <button onClick={handleResetZoom} className={styles.zoomButton}>Reset</button>
          <button onClick={handleZoomIn} className={styles.zoomButton}>+</button>
          <span className={styles.zoomLevel}>{Math.round(zoomLevel * 100)}%</span>
        </div>
      </div>
      
      <div className={styles.timelineContainer}>
        <div className={styles.timelineHeader}>
          <div className={styles.timelineStats}>
            <span>Total Events: {stats?.totalEvents || 0}</span>
            <span>Event Types: {Object.keys(stats?.eventsByType || {}).length}</span>
          </div>
        </div>
        
        <div className={styles.timelineViewport}>
          <div 
            ref={timelineRef}
            className={styles.timelineContent}
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {timelineData.items.map(item => (
              <TimelineEventItem 
                key={item.id}
                item={item}
                onClick={handleEventClick}
              />
            ))}
          </div>
        </div>
      </div>
      
      {selectedEvent && (
        <div className={styles.eventDetails}>
          <h3>Event Details</h3>
          {timelineData.items
            .filter(item => item.id === selectedEvent)
            .map(item => (
              <div key={item.id} className={styles.detailContent}>
                <h4>{item.title}</h4>
                <p><strong>Type:</strong> {item.type}</p>
                <p><strong>Date:</strong> {new Date(item.startTime).toLocaleDateString()}{item.endTime && ` - ${new Date(item.endTime).toLocaleDateString()}`}</p>
                <p><strong>Description:</strong> {item.description || 'No description'}</p>
                <p><strong>Importance:</strong> {item.importance}/100</p>
                {item.location && (
                  <p><strong>Location:</strong> {item.location.description || 'Unknown'}</p>
                )}
                {item.relatedIds && item.relatedIds.length > 0 && (
                  <div>
                    <p><strong>Related Entities:</strong></p>
                    <ul>
                      {item.relatedIds.map(id => (
                        <li key={id}>{id}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default TimelineVisualizer;
