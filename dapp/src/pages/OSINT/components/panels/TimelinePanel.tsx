import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, Play, Pause, ChevronLeft, ChevronRight, SkipBack, SkipForward, RefreshCw } from 'lucide-react';
import { format, parseISO, addDays, subDays } from 'date-fns';
import styles from './TimelinePanel.module.css';
import { useTimelineAnalysis } from '../../hooks/useTimelineAnalysis';
import { TimelineEvent } from '../../types/osint';
import ErrorDisplay from '../../components/common/ErrorDisplay';

interface TimelinePanelProps {
  data: Record<string, unknown>;
  panelId: string;
}

// Severity color mapping
const severityMap: Record<number, { color: string, label: string }> = {
  0.25: { color: '#41c7e4', label: 'low' },
  0.5: { color: '#e4c641', label: 'medium' },
  0.75: { color: '#e49a41', label: 'high' },
  1: { color: '#e44141', label: 'critical' }
};

// Get severity info based on confidence score
const getSeverityInfo = (confidence: number) => {
  const thresholds = Object.keys(severityMap).map(Number).sort();
  const threshold = thresholds.find(t => confidence <= t) || thresholds[thresholds.length - 1];
  return severityMap[threshold];
};

// Category icon mapping
const getCategoryIcon = (category: string) => {
  switch (category?.toLowerCase()) {
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

/**
 * Timeline Analysis Panel
 * 
 * Displays chronological events for investigation analysis
 */
const TimelinePanel: React.FC<TimelinePanelProps> = () => {
  // Use the timeline analysis hook
  const {
    timelineData,
    loading,
    isLoading,
    error,
    filter,
    setFilter,
    applyFilter,
    refreshTimeline,
    clearError,
    selectedEvent: selectedEventId,
    setSelectedEvent
  } = useTimelineAnalysis({ autoLoad: true });
  
  const [playbackActive, setPlaybackActive] = useState(false);
  const [focusDate, setFocusDate] = useState<Date>(new Date());
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const playbackInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Set initial focus date when timeline data loads
  useEffect(() => {
    if (timelineData.events.length > 0) {
      // Set focus to middle of time range by default
      const timestamps = timelineData.events.map(event => new Date(event.timestamp).getTime());
      const averageTime = timestamps.reduce((a, b) => a + b, 0) / timestamps.length;
      setFocusDate(new Date(averageTime));
    }
  }, [timelineData.events]);

  // Find the selected event object
  const selectedEvent = selectedEventId 
    ? timelineData.events.find(event => event.id === selectedEventId) 
    : null;
  
  // Toggle category filter
  const toggleFilter = (category: string) => {
    const currentCategories = filter.categories || [];
    
    if (currentCategories.includes(category)) {
      // Remove category from filter
      setFilter({
        ...filter,
        categories: currentCategories.filter(c => c !== category)
      });
    } else {
      // Add category to filter
      setFilter({
        ...filter,
        categories: [...currentCategories, category]
      });
    }
  };
  
  // Timeline playback controls
  const togglePlayback = () => {
    if (playbackActive) {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
        playbackInterval.current = null;
      }
    } else {
      playbackInterval.current = setInterval(() => {
        setFocusDate(prev => addDays(prev, 1));
      }, 2000);
    }
    setPlaybackActive(!playbackActive);
  };
  
  // Navigate timeline
  const navigateBack = () => {
    setFocusDate(prev => subDays(prev, 1));
  };
  
  const navigateForward = () => {
    setFocusDate(prev => addDays(prev, 1));
  };
  
  const jumpToStart = () => {
    if (timelineData.timeRange.start) {
      setFocusDate(new Date(timelineData.timeRange.start));
    }
  };
  
  const jumpToEnd = () => {
    if (timelineData.timeRange.end) {
      setFocusDate(new Date(timelineData.timeRange.end));
    }
  };
  
  // Apply filters when they change
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilter();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filter, applyFilter]);
  
  // Stop playback when component unmounts
  useEffect(() => {
    return () => {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
      }
    };
  }, []);
  
  // Scroll to selected event
  useEffect(() => {
    if (selectedEvent && timelineRef.current) {
      const eventElement = document.getElementById(`event-${selectedEvent.id}`);
      if (eventElement) {
        timelineRef.current.scrollTo({
          top: eventElement.offsetTop - 100,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedEvent]);
  
  // Group events by date for the timeline view
  const eventsByDate = timelineData.events.reduce((acc, event) => {
    const date = format(parseISO(event.timestamp), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);
  
  // Sort events by timestamp
  Object.keys(eventsByDate).forEach(date => {
    eventsByDate[date].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  });
  
  // Get all available categories
  const allCategories = timelineData.categories || [];
  
  // Check if category is active in filter
  const isCategoryActive = (category: string) => {
    if (!filter.categories || filter.categories.length === 0) {
      return true; // If no categories are specified, all are active
    }
    return filter.categories.includes(category);
  };
  
  return (
    <div className={styles.timelinePanel}>
      <div className={styles.controlBar}>
        <div className={styles.dateNavigation}>
          <button 
            className={styles.navButton} 
            onClick={jumpToStart}
            title="Jump to start"
          >
            <SkipBack size={14} />
          </button>
          <button 
            className={styles.navButton} 
            onClick={navigateBack}
            title="Previous day"
          >
            <ChevronLeft size={14} />
          </button>
          <div className={styles.currentDate}>
            <Calendar size={14} />
            <span>{format(focusDate, 'MMM d, yyyy')}</span>
          </div>
          <button 
            className={styles.navButton} 
            onClick={navigateForward}
            title="Next day"
          >
            <ChevronRight size={14} />
          </button>
          <button 
            className={styles.navButton} 
            onClick={jumpToEnd}
            title="Jump to end"
          >
            <SkipForward size={14} />
          </button>
        </div>
        
        <div className={styles.playbackControls}>
          <button 
            className={`${styles.playButton} ${playbackActive ? styles.active : ''}`} 
            onClick={togglePlayback}
            title={playbackActive ? "Pause playback" : "Start playback"}
          >
            {playbackActive ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            className={styles.refreshButton}
            onClick={() => refreshTimeline()}
            title="Refresh timeline data"
            disabled={isLoading('loadTimeline')}
          >
            <RefreshCw size={14} className={isLoading('loadTimeline') ? styles.spinning : ''} />
          </button>
        </div>
        
        <div className={styles.categoryFilters}>
          {allCategories.map(category => (
            <button
              key={category}
              className={`${styles.filterButton} ${isCategoryActive(category) ? styles.activeFilter : ''}`}
              onClick={() => toggleFilter(category)}
              title={`Toggle ${category} events`}
            >
              <span className={styles.filterIcon}>{getCategoryIcon(category)}</span>
              <span className={styles.filterLabel}>{category}</span>
            </button>
          ))}
        </div>
      </div>
      
      {error && (
        <ErrorDisplay 
          error={error}
          onRetry={() => {
            if (error.operation === 'applyFilter') {
              applyFilter();
            } else {
              refreshTimeline();
            }
          }}
          onDismiss={clearError}
          className={styles.timelineError}
        />
      )}
      
      <div className={styles.timelineContainer} ref={timelineRef}>
        {Object.keys(eventsByDate).length > 0 ? (
          Object.entries(eventsByDate)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, dayEvents]) => (
              <div 
                key={date} 
                className={`${styles.timelineDay} ${format(parseISO(date), 'yyyy-MM-dd') === format(focusDate, 'yyyy-MM-dd') ? styles.focusDay : ''}`}
              >
                <div className={styles.dayHeader}>
                  <Calendar size={14} />
                  <span>{format(parseISO(date), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                
                <div className={styles.eventsContainer}>
                  {dayEvents.map(event => {
                    const severityInfo = getSeverityInfo(event.confidence);
                    return (
                      <div 
                        id={`event-${event.id}`}
                        key={event.id} 
                        className={`${styles.eventItem} ${selectedEventId === event.id ? styles.selectedEvent : ''}`}
                        onClick={() => setSelectedEvent(event.id)}
                      >
                        <div 
                          className={styles.eventSeverity} 
                          style={{ backgroundColor: severityInfo.color }}
                        />
                        <div className={styles.eventTime}>
                          <Clock size={12} />
                          <span>{format(parseISO(event.timestamp), 'HH:mm')}</span>
                        </div>
                        <div className={styles.eventContent}>
                          <div className={styles.eventHeader}>
                            <span className={styles.eventCategory}>{getCategoryIcon(event.category || '')}</span>
                            <h4 className={styles.eventTitle}>{event.title}</h4>
                          </div>
                          <p className={styles.eventDescription}>{event.description}</p>
                          <div className={styles.eventEntities}>
                            {event.entities.map(entity => (
                              <span key={entity} className={styles.entityBadge}>{entity}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
        ) : (
          <div className={styles.noEvents}>
            <p>{loading ? 'Loading timeline data...' : 'No events match the current filters.'}</p>
          </div>
        )}
      </div>
      
      {selectedEvent && (
        <div className={styles.eventDetails}>
          <h3 className={styles.detailsTitle}>
            <span className={styles.eventCategory}>{getCategoryIcon(selectedEvent.category || '')}</span>
            {selectedEvent.title}
          </h3>
          <div className={styles.detailsTime}>
            <Clock size={14} />
            <span>{format(parseISO(selectedEvent.timestamp), 'EEEE, MMMM d, yyyy HH:mm')}</span>
          </div>
          <p className={styles.detailsDescription}>{selectedEvent.description}</p>
          <div className={styles.detailsMeta}>
            <div className={styles.detailsProperty}>
              <span className={styles.propertyLabel}>Category</span>
              <span className={styles.propertyValue}>{selectedEvent.category || 'Unknown'}</span>
            </div>
            <div className={styles.detailsProperty}>
              <span className={styles.propertyLabel}>Confidence</span>
              <span 
                className={styles.severityBadge}
                style={{ backgroundColor: getSeverityInfo(selectedEvent.confidence).color }}
              >
                {getSeverityInfo(selectedEvent.confidence).label} ({Math.round(selectedEvent.confidence * 100)}%)
              </span>
            </div>
            <div className={styles.detailsProperty}>
              <span className={styles.propertyLabel}>Linked Entities</span>
              <div className={styles.entitiesList}>
                {selectedEvent.entities.map(entity => (
                  <span key={entity} className={styles.entityBadge}>{entity}</span>
                ))}
              </div>
            </div>
            {selectedEvent.tags && selectedEvent.tags.length > 0 && (
              <div className={styles.detailsProperty}>
                <span className={styles.propertyLabel}>Tags</span>
                <div className={styles.tagsList}>
                  {selectedEvent.tags.map(tag => (
                    <span key={tag} className={styles.tagBadge}>{tag}</span>
                  ))}
                </div>
              </div>
            )}
            {selectedEvent.sources && selectedEvent.sources.length > 0 && (
              <div className={styles.detailsProperty}>
                <span className={styles.propertyLabel}>Sources</span>
                <div className={styles.sourcesList}>
                  {selectedEvent.sources.map(source => (
                    <div key={source.id} className={styles.sourceItem}>
                      <span className={styles.sourceName}>{source.name}</span>
                      <span className={styles.sourceType}>({source.type})</span>
                      <span className={styles.sourceCredibility}>
                        Credibility: {Math.round(source.credibility * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelinePanel;
