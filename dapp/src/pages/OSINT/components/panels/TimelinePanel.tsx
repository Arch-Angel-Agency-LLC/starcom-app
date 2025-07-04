import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, Filter, Play, Pause, ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-react';
import { format, parseISO, addDays, subDays } from 'date-fns';
import styles from './TimelinePanel.module.css';

interface TimelinePanelProps {
  data: Record<string, unknown>;
  panelId: string;
}

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  entities: string[];
}

// Sample timeline data
const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 'event1',
    title: 'New wallet transaction',
    description: 'Transfer of 2.5 ETH to external wallet',
    timestamp: '2025-07-01T10:15:00Z',
    category: 'financial',
    severity: 'medium',
    entities: ['n1', 'n3']
  },
  {
    id: 'event2',
    title: 'Social media post',
    description: 'Twitter mention of TechCorp project',
    timestamp: '2025-07-02T14:22:00Z',
    category: 'social',
    severity: 'low',
    entities: ['n1', 'n7']
  },
  {
    id: 'event3',
    title: 'Email communication',
    description: 'Message to CryptoFund executive',
    timestamp: '2025-07-02T18:45:00Z',
    category: 'communication',
    severity: 'medium',
    entities: ['n1', 'n5']
  },
  {
    id: 'event4',
    title: 'Website update',
    description: 'TechCorp website changed privacy policy',
    timestamp: '2025-07-03T09:30:00Z',
    category: 'digital',
    severity: 'low',
    entities: ['n2', 'n6']
  },
  {
    id: 'event5',
    title: 'Large blockchain transaction',
    description: 'Transfer of 150 ETH between wallets',
    timestamp: '2025-07-03T16:10:00Z',
    category: 'financial',
    severity: 'critical',
    entities: ['n3', 'n9']
  },
  {
    id: 'event6',
    title: 'Dark web mention',
    description: 'Reference to TechCorp in forum post',
    timestamp: '2025-07-04T02:15:00Z',
    category: 'threat',
    severity: 'high',
    entities: ['n2']
  }
];

// Severity color mapping
const severityColors = {
  low: '#41c7e4',
  medium: '#e4c641',
  high: '#e49a41',
  critical: '#e44141'
};

// Category icon mapping
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'financial': return '💰';
    case 'social': return '🗣️';
    case 'communication': return '✉️';
    case 'digital': return '💻';
    case 'threat': return '⚠️';
    default: return '📋';
  }
};

/**
 * Timeline Analysis Panel
 * 
 * Displays chronological events for investigation analysis
 */
const TimelinePanel: React.FC<TimelinePanelProps> = ({ data, panelId }) => {
  const [events, setEvents] = useState<TimelineEvent[]>(mockTimelineEvents);
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    financial: true,
    social: true,
    communication: true,
    digital: true,
    threat: true
  });
  const [playbackActive, setPlaybackActive] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [focusDate, setFocusDate] = useState<Date>(new Date('2025-07-03'));
  const [timeScale, setTimeScale] = useState<'hour' | 'day' | 'week'>('day');
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const playbackInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Filter events by category
  const filteredEvents = events.filter(event => activeFilters[event.category]);
  
  // Group events by date for the timeline view
  const eventsByDate = filteredEvents.reduce((acc, event) => {
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
  
  // Toggle category filter
  const toggleFilter = (category: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
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
    const firstDate = Object.keys(eventsByDate).sort()[0];
    if (firstDate) {
      setFocusDate(parseISO(firstDate));
    }
  };
  
  const jumpToEnd = () => {
    const lastDate = Object.keys(eventsByDate).sort().pop();
    if (lastDate) {
      setFocusDate(parseISO(lastDate));
    }
  };
  
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
        </div>
        
        <div className={styles.categoryFilters}>
          {Object.keys(activeFilters).map(category => (
            <button
              key={category}
              className={`${styles.filterButton} ${activeFilters[category] ? styles.activeFilter : ''}`}
              onClick={() => toggleFilter(category)}
              title={`Toggle ${category} events`}
            >
              <span className={styles.filterIcon}>{getCategoryIcon(category)}</span>
              <span className={styles.filterLabel}>{category}</span>
            </button>
          ))}
        </div>
      </div>
      
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
                  {dayEvents.map(event => (
                    <div 
                      id={`event-${event.id}`}
                      key={event.id} 
                      className={`${styles.eventItem} ${selectedEvent?.id === event.id ? styles.selectedEvent : ''}`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div 
                        className={styles.eventSeverity} 
                        style={{ backgroundColor: severityColors[event.severity] }}
                      />
                      <div className={styles.eventTime}>
                        <Clock size={12} />
                        <span>{format(parseISO(event.timestamp), 'HH:mm')}</span>
                      </div>
                      <div className={styles.eventContent}>
                        <div className={styles.eventHeader}>
                          <span className={styles.eventCategory}>{getCategoryIcon(event.category)}</span>
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
                  ))}
                </div>
              </div>
            ))
        ) : (
          <div className={styles.noEvents}>
            <p>No events match the current filters.</p>
          </div>
        )}
      </div>
      
      {selectedEvent && (
        <div className={styles.eventDetails}>
          <h3 className={styles.detailsTitle}>
            <span className={styles.eventCategory}>{getCategoryIcon(selectedEvent.category)}</span>
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
              <span className={styles.propertyValue}>{selectedEvent.category}</span>
            </div>
            <div className={styles.detailsProperty}>
              <span className={styles.propertyLabel}>Severity</span>
              <span 
                className={styles.severityBadge}
                style={{ backgroundColor: severityColors[selectedEvent.severity] }}
              >
                {selectedEvent.severity}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelinePanel;
