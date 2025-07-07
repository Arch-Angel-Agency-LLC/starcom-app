/**
 * useTimelineData - Hook for Timeline data with IntelDataCore
 * 
 * This hook provides access to Timeline data from IntelDataCore
 * for use in React components.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  timelineAdapter, 
  TimelineData, 
  TimelineStats,
  TimelineFilter
} from '../adapters/timelineAdapter';
import { TimelineEvent } from '../types/intelDataModels';

export interface UseTimelineDataResult {
  // Timeline data
  timelineData: TimelineData;
  stats: TimelineStats;
  loading: boolean;
  error: string | null;
  
  // Actions
  applyFilters: (filters: TimelineFilter[]) => Promise<void>;
  refreshData: () => Promise<void>;
  addEvent: (event: Partial<TimelineEvent>) => Promise<string | null>;
  updateEvent: (id: string, updates: Partial<TimelineEvent>) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
}

/**
 * Hook for accessing and manipulating Timeline data
 */
export function useTimelineData(initialFilters: TimelineFilter[] = []): UseTimelineDataResult {
  const [timelineData, setTimelineData] = useState<TimelineData>({ items: [], groups: [] });
  const [stats, setStats] = useState<TimelineStats>({
    totalEvents: 0,
    eventsByType: {},
    eventsByMonth: {},
    eventsImportance: {
      high: 0,
      medium: 0,
      low: 0
    }
  });
  const [filters, setFilters] = useState<TimelineFilter[]>(initialFilters);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Load timeline data based on current filters
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch timeline data
      const data = await timelineAdapter.getTimelineData(filters);
      setTimelineData(data);
      
      // Fetch timeline statistics
      const statsData = await timelineAdapter.getTimelineStats(filters);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred loading timeline data');
      console.error('Error loading Timeline data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  /**
   * Apply new filters and reload data
   */
  const applyFilters = useCallback(async (newFilters: TimelineFilter[]) => {
    setFilters(newFilters);
  }, []);
  
  /**
   * Add a new event to the timeline
   */
  const addEvent = useCallback(async (event: Partial<TimelineEvent>) => {
    try {
      const eventId = await timelineAdapter.addEvent(event);
      if (eventId) {
        // Refresh data after adding the event
        await loadData();
      }
      return eventId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred adding an event');
      console.error('Error adding event:', err);
      return null;
    }
  }, [loadData]);
  
  /**
   * Update an existing event
   */
  const updateEvent = useCallback(async (id: string, updates: Partial<TimelineEvent>) => {
    try {
      const success = await timelineAdapter.updateEvent(id, updates);
      if (success) {
        // Refresh data after updating the event
        await loadData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred updating an event');
      console.error('Error updating event:', err);
      return false;
    }
  }, [loadData]);
  
  /**
   * Delete an event from the timeline
   */
  const deleteEvent = useCallback(async (id: string) => {
    try {
      const success = await timelineAdapter.deleteEvent(id);
      if (success) {
        // Refresh data after deleting the event
        await loadData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred deleting an event');
      console.error('Error deleting event:', err);
      return false;
    }
  }, [loadData]);
  
  /**
   * Load data when component mounts or filters change
   */
  useEffect(() => {
    loadData();
  }, [loadData, filters]);
  
  return {
    timelineData,
    stats,
    loading,
    error,
    applyFilters,
    refreshData: loadData,
    addEvent,
    updateEvent,
    deleteEvent
  };
}

export default useTimelineData;
