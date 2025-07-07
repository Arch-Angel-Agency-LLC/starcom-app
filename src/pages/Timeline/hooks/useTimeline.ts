/**
 * useTimeline Hook
 * 
 * Custom hook for timeline analysis. Provides timeline data management,
 * event filtering, correlation functionality, and error handling.
 * Refactored from the OSINT module for use in the new Timeline screen.
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  TimelineData, 
  TimelineFilter, 
  EventCorrelation,
  TimelineEvent
} from '../types/timeline';
import { timelineService } from '../services/timelineService';

interface UseTimelineOptions {
  initialFilter?: TimelineFilter;
  autoLoad?: boolean;
}

interface UseTimelineResult {
  timelineData: TimelineData;
  loading: boolean;
  loadingOperation: string | null;
  error: Error | null;
  filter: TimelineFilter;
  setFilter: (filter: TimelineFilter) => void;
  applyFilter: () => Promise<void>;
  correlateEvent: (eventId: string) => Promise<EventCorrelation | null>;
  refreshTimeline: () => Promise<void>;
  clearError: () => void;
  selectedEvent: TimelineEvent | null;
  setSelectedEvent: (event: TimelineEvent | null) => void;
  selectedEventId: string | null;
  setSelectedEventId: (eventId: string | null) => void;
}

/**
 * Custom hook for timeline analysis
 */
export function useTimeline({
  initialFilter = {},
  autoLoad = true
}: UseTimelineOptions = {}): UseTimelineResult {
  // State management
  const [timelineData, setTimelineData] = useState<TimelineData>({
    events: [],
    timeRange: {
      start: new Date().toISOString(),
      end: new Date().toISOString()
    },
    categories: []
  });
  const [filter, setFilter] = useState<TimelineFilter>(initialFilter);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingOperation, setLoadingOperation] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch timeline data with current filter
  const fetchTimelineData = useCallback(async () => {
    setLoading(true);
    setLoadingOperation('fetchData');
    setError(null);
    
    try {
      const data = await timelineService.getTimelineData(filter);
      setTimelineData(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching timeline data:', err);
    } finally {
      setLoading(false);
      setLoadingOperation(null);
    }
  }, [filter]);

  // Apply filter and fetch data
  const applyFilter = useCallback(async () => {
    await fetchTimelineData();
  }, [fetchTimelineData]);

  // Refresh timeline data
  const refreshTimeline = useCallback(async () => {
    await fetchTimelineData();
  }, [fetchTimelineData]);

  // Correlate event with others
  const correlateEvent = useCallback(async (eventId: string): Promise<EventCorrelation | null> => {
    setLoadingOperation('correlate');
    setError(null);
    
    try {
      return await timelineService.correlateEvent(eventId);
    } catch (err) {
      setError(err as Error);
      console.error('Error correlating event:', err);
      return null;
    } finally {
      setLoadingOperation(null);
    }
  }, []);

  // Load event details when selectedEventId changes
  useEffect(() => {
    if (selectedEventId) {
      const loadEventDetails = async () => {
        setLoadingOperation('loadEvent');
        setError(null);
        
        try {
          const eventDetails = await timelineService.getEventDetails(selectedEventId);
          setSelectedEvent(eventDetails);
        } catch (err) {
          setError(err as Error);
          console.error('Error loading event details:', err);
        } finally {
          setLoadingOperation(null);
        }
      };
      
      loadEventDetails();
    } else {
      setSelectedEvent(null);
    }
  }, [selectedEventId]);

  // Initial data load
  useEffect(() => {
    if (autoLoad) {
      fetchTimelineData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    timelineData,
    loading,
    loadingOperation,
    error,
    filter,
    setFilter,
    applyFilter,
    correlateEvent,
    refreshTimeline,
    clearError,
    selectedEvent,
    setSelectedEvent,
    selectedEventId,
    setSelectedEventId
  };
}
