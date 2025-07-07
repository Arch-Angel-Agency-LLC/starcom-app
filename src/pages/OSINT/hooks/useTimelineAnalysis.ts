/**
 * useTimelineAnalysis Hook
 * 
 * Custom hook for timeline analysis. Provides timeline data management,
 * event filtering, correlation functionality, and robust error handling.
 */

import { useState, useCallback, useEffect } from 'react';
import { timelineService, TimelineData, TimelineFilter, EventCorrelation } from '../services/timeline/timelineService';
import { ErrorDetail, createErrorDetail } from '../types/errors';

interface UseTimelineAnalysisOptions {
  initialFilter?: TimelineFilter;
  autoLoad?: boolean;
}

interface UseTimelineAnalysisResult {
  timelineData: TimelineData;
  loading: Record<string, boolean>;
  isLoading: (operation?: string) => boolean;
  error: ErrorDetail | null;
  filter: TimelineFilter;
  setFilter: (filter: TimelineFilter) => void;
  applyFilter: () => Promise<void>;
  correlateEvent: (eventId: string) => Promise<EventCorrelation | null>;
  refreshTimeline: () => Promise<void>;
  clearError: () => void;
  selectedEvent: string | null;
  setSelectedEvent: (eventId: string | null) => void;
}

/**
 * Custom hook for timeline analysis
 */
export function useTimelineAnalysis({
  initialFilter = {},
  autoLoad = true
}: UseTimelineAnalysisOptions = {}): UseTimelineAnalysisResult {
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
  
  // Loading state with operation tracking
  const [loading, setLoading] = useState<Record<string, boolean>>({
    loadTimeline: false,
    applyFilter: false,
    correlateEvent: false
  });
  
  // Consolidated loading state getter
  const isLoading = useCallback((operation?: string): boolean => {
    if (operation) {
      return loading[operation] || false;
    }
    return Object.values(loading).some(value => value);
  }, [loading]);
  
  // Enhanced error state
  const [error, setError] = useState<ErrorDetail | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  
  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Load timeline data on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad) {
      refreshTimeline();
    }
  }, [autoLoad]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Refresh timeline data with retry capability
  const refreshTimeline = useCallback(async (retryCount = 0) => {
    setLoading(prev => ({ ...prev, loadTimeline: true }));
    setError(null);
    
    try {
      const response = await timelineService.getTimelineEvents(filter);
      
      if (response.error) {
        // Handle retryable errors
        if (response.error.retryable && retryCount < 3) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          console.log(`Retrying timeline load after ${delay}ms (attempt ${retryCount + 1}/3)`);
          
          // Wait for the backoff delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Recursive retry with incremented counter
          setLoading(prev => ({ ...prev, loadTimeline: false }));
          return refreshTimeline(retryCount + 1);
        }
        
        setError(response.error);
      } else if (response.data) {
        setTimelineData(response.data);
      }
    } catch (err) {
      setError(createErrorDetail('Failed to load timeline data', {
        code: 'UNEXPECTED_ERROR',
        category: 'network',
        severity: 'error',
        operation: 'refreshTimeline',
        originalError: err instanceof Error ? err : undefined,
        retryable: true,
        userActions: [
          'Check your internet connection',
          'Try again later',
          'Contact support if the problem persists'
        ]
      }));
      console.error('Timeline data error:', err);
    } finally {
      setLoading(prev => ({ ...prev, loadTimeline: false }));
    }
  }, [filter]);
  
  // Apply filter to timeline data with retry capability
  const applyFilter = useCallback(async (retryCount = 0) => {
    setLoading(prev => ({ ...prev, applyFilter: true }));
    setError(null);
    
    try {
      const response = await timelineService.getTimelineEvents(filter);
      
      if (response.error) {
        // Handle retryable errors
        if (response.error.retryable && retryCount < 3) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          console.log(`Retrying filter application after ${delay}ms (attempt ${retryCount + 1}/3)`);
          
          // Wait for the backoff delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Recursive retry with incremented counter
          setLoading(prev => ({ ...prev, applyFilter: false }));
          return applyFilter(retryCount + 1);
        }
        
        setError(response.error);
      } else if (response.data) {
        setTimelineData(response.data);
      }
    } catch (err) {
      setError(createErrorDetail('Failed to apply timeline filter', {
        code: 'UNEXPECTED_ERROR',
        category: 'data',
        severity: 'error',
        operation: 'applyFilter',
        originalError: err instanceof Error ? err : undefined,
        retryable: true,
        context: { filter },
        userActions: [
          'Check your filter settings',
          'Try a different filter',
          'Try again later'
        ]
      }));
      console.error('Filter error:', err);
    } finally {
      setLoading(prev => ({ ...prev, applyFilter: false }));
    }
  }, [filter]);
  
  // Correlate an event with others with retry capability
  const correlateEvent = useCallback(async (eventId: string, retryCount = 0): Promise<EventCorrelation | null> => {
    setLoading(prev => ({ ...prev, correlateEvent: true }));
    setError(null);
    
    try {
      const response = await timelineService.correlateEvents(eventId);
      
      if (response.error) {
        // Handle retryable errors
        if (response.error.retryable && retryCount < 3) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          console.log(`Retrying event correlation after ${delay}ms (attempt ${retryCount + 1}/3)`);
          
          // Wait for the backoff delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Recursive retry with incremented counter
          setLoading(prev => ({ ...prev, correlateEvent: false }));
          return correlateEvent(eventId, retryCount + 1);
        }
        
        setError(response.error);
        return null;
      }
      
      return response.data || null;
    } catch (err) {
      setError(createErrorDetail('Failed to correlate events', {
        code: 'UNEXPECTED_ERROR',
        category: 'data',
        severity: 'error',
        operation: 'correlateEvent',
        originalError: err instanceof Error ? err : undefined,
        retryable: true,
        context: { eventId },
        userActions: [
          'Check the event ID',
          'Try with a different event',
          'Try again later'
        ]
      }));
      console.error('Correlation error:', err);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, correlateEvent: false }));
    }
  }, []);
  
  return {
    timelineData,
    loading,
    isLoading,
    error,
    filter,
    setFilter,
    applyFilter,
    correlateEvent,
    refreshTimeline,
    clearError,
    selectedEvent,
    setSelectedEvent
  };
}
