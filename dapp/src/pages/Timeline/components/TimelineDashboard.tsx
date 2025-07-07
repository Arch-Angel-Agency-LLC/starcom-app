/**
 * Timeline Dashboard Component
 * 
 * Main component for the Timeline functionality, reclaimed from OSINT module.
 * Provides a comprehensive timeline visualization and analysis interface.
 */

import React, { useState } from 'react';
import { RefreshCw, Calendar, List, BarChart, Info } from 'lucide-react';
import { useTimeline } from '../hooks/useTimeline';
import TimelineFilter from './TimelineFilter';
import TimelineEventItem from './TimelineEventItem';
import TimelineEventDetails from './TimelineEventDetails';
import styles from './TimelineDashboard.module.css';

const TimelineDashboard: React.FC = () => {
  // Timeline view mode
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'chart'>('list');
  
  // Use the timeline hook to manage data and state
  const {
    timelineData,
    loading,
    error,
    filter,
    setFilter,
    applyFilter,
    refreshTimeline,
    selectedEvent,
    setSelectedEvent,
    selectedEventId,
    setSelectedEventId
  } = useTimeline({ autoLoad: true });
  
  // Handle event selection
  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
  };
  
  // Handle closing the event details panel
  const handleCloseDetails = () => {
    setSelectedEvent(null);
    setSelectedEventId(null);
  };
  
  // Get view component based on current mode
  const renderTimelineView = () => {
    switch (viewMode) {
      case 'calendar':
        return (
          <div className={styles.calendarView}>
            <div className={styles.placeholderMessage}>
              <Calendar size={32} />
              <span>Calendar view in development</span>
            </div>
          </div>
        );
      case 'chart':
        return (
          <div className={styles.chartView}>
            <div className={styles.placeholderMessage}>
              <BarChart size={32} />
              <span>Chart view in development</span>
            </div>
          </div>
        );
      case 'list':
      default:
        return (
          <div className={styles.listView}>
            {timelineData.events.length === 0 ? (
              <div className={styles.emptyState}>
                <Info size={32} />
                <span>No timeline events match your criteria</span>
              </div>
            ) : (
              timelineData.events.map(event => (
                <TimelineEventItem
                  key={event.id}
                  event={event}
                  isSelected={event.id === selectedEventId}
                  onClick={() => handleEventSelect(event.id)}
                />
              ))
            )}
          </div>
        );
    }
  };
  
  return (
    <div className={styles.timelineDashboard}>
      {/* Header with controls */}
      <div className={styles.dashboardHeader}>
        <h2 className={styles.dashboardTitle}>Timeline Analysis</h2>
        <div className={styles.viewControls}>
          <button 
            className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <List size={18} />
          </button>
          <button 
            className={`${styles.viewButton} ${viewMode === 'calendar' ? styles.active : ''}`}
            onClick={() => setViewMode('calendar')}
            title="Calendar View"
          >
            <Calendar size={18} />
          </button>
          <button 
            className={`${styles.viewButton} ${viewMode === 'chart' ? styles.active : ''}`}
            onClick={() => setViewMode('chart')}
            title="Chart View"
          >
            <BarChart size={18} />
          </button>
          <button 
            className={styles.refreshButton}
            onClick={refreshTimeline}
            disabled={loading}
            title="Refresh Timeline"
          >
            <RefreshCw size={18} className={loading ? styles.spinning : ''} />
          </button>
        </div>
      </div>
      
      {/* Timeline filter */}
      <TimelineFilter
        filter={filter}
        onFilterChange={setFilter}
        onApplyFilter={applyFilter}
        availableCategories={timelineData.categories}
        availableTags={timelineData.tags}
      />
      
      {/* Main content area */}
      <div className={styles.dashboardContent}>
        {/* Timeline events panel */}
        <div className={styles.eventsPanel}>
          {loading && !selectedEvent ? (
            <div className={styles.loadingState}>
              <RefreshCw size={32} className={styles.spinner} />
              <span>Loading timeline data...</span>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <span className={styles.errorMessage}>
                Error loading timeline data: {error.message}
              </span>
              <button 
                className={styles.retryButton}
                onClick={refreshTimeline}
              >
                Retry
              </button>
            </div>
          ) : (
            renderTimelineView()
          )}
        </div>
        
        {/* Event details panel */}
        {selectedEvent && (
          <div className={styles.detailsPanel}>
            <TimelineEventDetails
              event={selectedEvent}
              onClose={handleCloseDetails}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineDashboard;
