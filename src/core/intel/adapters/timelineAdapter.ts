/**
 * TimelineAdapter - Adapter for Timeline integration with IntelDataCore
 * 
 * This adapter connects the Timeline components to the IntelDataCore
 * by providing transformation and query functions for timeline events.
 */

import { 
  TimelineEvent,
  EventType,
  IntelQueryOptions,
  PersistenceOptions
} from '../types/intelDataModels';
import { intelDataStore } from '../store/intelDataStore';
import { storageOrchestrator, Transaction } from '../storage/storageOrchestrator';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';

// Types for Timeline visualization
export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  group?: string;
  type: string;
  importance: number;
  isEstimated: boolean;
  relatedIds: string[];
  color?: string;
  icon?: string;
  location?: {
    description?: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  metadata: Record<string, any>;
  tags: string[];
}

export interface TimelineGroup {
  id: string;
  title: string;
  color?: string;
}

export interface TimelineData {
  items: TimelineItem[];
  groups: TimelineGroup[];
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface TimelineFilter {
  property: string;
  operator: 'equals' | 'contains' | 'before' | 'after' | 'between' | 'gte' | 'lte';
  value: any;
}

export interface TimelineStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByMonth: Record<string, number>;
  eventsImportance: {
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Timeline adapter class for IntelDataCore
 */
export class TimelineAdapter {
  /**
   * Fetch timeline data based on filters
   */
  async getTimelineData(
    filters?: TimelineFilter[], 
    options?: { 
      sort?: { field: string; direction: 'asc' | 'desc' }; 
      pagination?: { page: number; pageSize: number } 
    }
  ): Promise<TimelineData> {
    try {
      // Convert Timeline filters to Intel query options
      const queryOptions = this.createQueryOptions(filters);
      
      // Add sorting and pagination if provided
      if (options?.sort) {
        queryOptions.sortBy = options.sort.field;
        queryOptions.sortDirection = options.sort.direction;
      }
      
      if (options?.pagination) {
        queryOptions.pagination = options.pagination;
      }
      
      // Get timeline events
      const result = await intelDataStore.queryEntities<TimelineEvent>(queryOptions);
      if (!result.success) {
        console.error('Error fetching timeline events:', result.error);
        return { items: [], groups: [] };
      }
      
      const events = result.data || [];
      
      // Transform events to timeline items
      const timelineItems = events.map(event => this.transformEventToTimelineItem(event));
      
      // Extract unique groups from events
      const groupMap = new Map<string, TimelineGroup>();
      events.forEach(event => {
        if (event.eventType && !groupMap.has(event.eventType)) {
          groupMap.set(event.eventType, {
            id: event.eventType,
            title: this.formatEventType(event.eventType),
            color: this.getEventTypeColor(event.eventType)
          });
        }
      });
      
      // Include pagination info if available
      const response: TimelineData = {
        items: timelineItems,
        groups: Array.from(groupMap.values())
      };
      
      if (result.pagination) {
        response.pagination = result.pagination;
      }
      
      return response;
    } catch (error) {
      console.error('Error in getTimelineData:', error);
      return { items: [], groups: [] };
    }
  }
  
  /**
   * Get statistics about the timeline events
   */
  async getTimelineStats(filters?: TimelineFilter[]): Promise<TimelineStats> {
    try {
      const timelineData = await this.getTimelineData(filters);
      
      // Calculate stats
      const eventsByType: Record<string, number> = {};
      const eventsByMonth: Record<string, number> = {};
      let highImportance = 0;
      let mediumImportance = 0;
      let lowImportance = 0;
      
      timelineData.items.forEach(item => {
        // Count by type
        eventsByType[item.type] = (eventsByType[item.type] || 0) + 1;
        
        // Count by month
        const month = item.startTime.toISOString().slice(0, 7); // Format: YYYY-MM
        eventsByMonth[month] = (eventsByMonth[month] || 0) + 1;
        
        // Count by importance
        if (item.importance >= 70) {
          highImportance++;
        } else if (item.importance >= 30) {
          mediumImportance++;
        } else {
          lowImportance++;
        }
      });
      
      return {
        totalEvents: timelineData.items.length,
        eventsByType,
        eventsByMonth,
        eventsImportance: {
          high: highImportance,
          medium: mediumImportance,
          low: lowImportance
        }
      };
    } catch (error) {
      console.error('Error in getTimelineStats:', error);
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsByMonth: {},
        eventsImportance: {
          high: 0,
          medium: 0,
          low: 0
        }
      };
    }
  }
  
  /**
   * Add an event to the timeline
   */
  async addEvent(eventData: Partial<TimelineEvent>, options?: PersistenceOptions): Promise<string | null> {
    try {
      // Use storage orchestrator if persistence options are provided
      if (options) {
        const result = await storageOrchestrator.storeEntity<TimelineEvent>({
          ...eventData,
          type: 'timeline_event'
        } as TimelineEvent, options);
        
        if (result.success) {
          // Emit event for real-time updates
          enhancedEventEmitter.emit('timeline:event:created', result.data);
          return result.data!.id;
        }
        return null;
      }
      
      // Otherwise use the standard store
      const result = await intelDataStore.createEntity<TimelineEvent>({
        ...eventData,
        type: 'timeline_event'
      } as TimelineEvent);
      
      if (result.success) {
        // Emit event for real-time updates
        enhancedEventEmitter.emit('timeline:event:created', result.data);
        return result.data!.id;
      }
      return null;
    } catch (error) {
      console.error('Error adding timeline event:', error);
      return null;
    }
  }
  
  /**
   * Update an event in the timeline
   */
  async updateEvent(id: string, updates: Partial<TimelineEvent>, options?: PersistenceOptions): Promise<boolean> {
    try {
      // Use storage orchestrator if persistence options are provided
      if (options) {
        const result = await storageOrchestrator.updateEntity<TimelineEvent>(id, updates, options);
        
        if (result.success) {
          // Emit event for real-time updates
          enhancedEventEmitter.emit('timeline:event:updated', result.data);
        }
        return result.success;
      }
      
      // Otherwise use the standard store
      const result = await intelDataStore.updateEntity<TimelineEvent>(id, updates);
      
      if (result.success) {
        // Emit event for real-time updates
        enhancedEventEmitter.emit('timeline:event:updated', result.data);
      }
      return result.success;
    } catch (error) {
      console.error('Error updating timeline event:', error);
      return false;
    }
  }
  
  /**
   * Delete an event from the timeline
   */
  async deleteEvent(id: string, options?: PersistenceOptions): Promise<boolean> {
    try {
      // Use storage orchestrator if persistence options are provided
      if (options) {
        const result = await storageOrchestrator.deleteEntity(id, options);
        
        if (result.success) {
          // Emit event for real-time updates
          enhancedEventEmitter.emit('timeline:event:deleted', { id });
        }
        return result.success;
      }
      
      // Otherwise use the standard store
      const result = await intelDataStore.deleteEntity(id);
      
      if (result.success) {
        // Emit event for real-time updates
        enhancedEventEmitter.emit('timeline:event:deleted', { id });
      }
      return result.success;
    } catch (error) {
      console.error('Error deleting timeline event:', error);
      return false;
    }
  }
  
  /**
   * Transform a TimelineEvent to TimelineItem format
   */
  private transformEventToTimelineItem(event: TimelineEvent): TimelineItem {
    return {
      id: event.id,
      title: event.title || '',
      description: event.description,
      startTime: new Date(event.startDate),
      endTime: event.endDate ? new Date(event.endDate) : undefined,
      group: event.eventType,
      type: event.eventType,
      importance: event.importance,
      isEstimated: event.isEstimated,
      relatedIds: event.relatedEntities || [],
      color: this.getEventTypeColor(event.eventType),
      icon: this.getEventTypeIcon(event.eventType),
      location: event.location ? {
        description: event.location.description,
        coordinates: event.location.longitude && event.location.latitude ? 
          [event.location.longitude, event.location.latitude] : undefined
      } : undefined,
      metadata: event.metadata || {},
      tags: event.tags || []
    };
  }
  
  /**
   * Convert Timeline filters to IntelDataCore query options
   */
  private createQueryOptions(filters?: TimelineFilter[]): IntelQueryOptions {
    const options: IntelQueryOptions = {
      types: ['timeline_event'], // Only get timeline events
      sortBy: 'startDate',
      sortDirection: 'asc'
    };
    
    if (!filters || filters.length === 0) {
      return options;
    }
    
    // Convert filters to query filters
    const queryFilters: any[] = [];
    
    filters.forEach(filter => {
      switch (filter.operator) {
        case 'equals':
          queryFilters.push({
            field: filter.property,
            operator: 'eq',
            value: filter.value
          });
          break;
        case 'contains':
          queryFilters.push({
            field: filter.property,
            operator: 'contains',
            value: filter.value
          });
          break;
        case 'before':
          queryFilters.push({
            field: filter.property,
            operator: 'lt',
            value: filter.value
          });
          break;
        case 'after':
          queryFilters.push({
            field: filter.property,
            operator: 'gt',
            value: filter.value
          });
          break;
        case 'between':
          if (Array.isArray(filter.value) && filter.value.length >= 2) {
            queryFilters.push({
              field: filter.property,
              operator: 'between',
              value: filter.value
            });
          }
          break;
        case 'gte':
          queryFilters.push({
            field: filter.property,
            operator: 'gte',
            value: filter.value
          });
          break;
        case 'lte':
          queryFilters.push({
            field: filter.property,
            operator: 'lte',
            value: filter.value
          });
          break;
      }
    });
    
    options.filters = queryFilters;
    return options;
  }
  
  /**
   * Format event type for display
   */
  private formatEventType(type: string): string {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  /**
   * Get color for event type
   */
  private getEventTypeColor(type: string): string {
    const colorMap: Record<string, string> = {
      [EventType.INCIDENT]: '#e74c3c',
      [EventType.ATTACK]: '#c0392b',
      [EventType.DETECTION]: '#3498db',
      [EventType.COMMUNICATION]: '#2980b9',
      [EventType.ACCESS]: '#9b59b6',
      [EventType.MODIFICATION]: '#8e44ad',
      [EventType.CREATION]: '#2ecc71',
      [EventType.DELETION]: '#e67e22',
      [EventType.RECONNAISSANCE]: '#f1c40f',
      [EventType.EXFILTRATION]: '#d35400',
      [EventType.MITIGATION]: '#27ae60',
      [EventType.CUSTOM]: '#7f8c8d'
    };
    
    return colorMap[type] || '#7f8c8d';
  }
  
  /**
   * Get icon for event type
   */
  private getEventTypeIcon(type: string): string {
    const iconMap: Record<string, string> = {
      [EventType.INCIDENT]: 'error',
      [EventType.ATTACK]: 'warning',
      [EventType.DETECTION]: 'search',
      [EventType.COMMUNICATION]: 'message',
      [EventType.ACCESS]: 'login',
      [EventType.MODIFICATION]: 'edit',
      [EventType.CREATION]: 'add_circle',
      [EventType.DELETION]: 'delete',
      [EventType.RECONNAISSANCE]: 'visibility',
      [EventType.EXFILTRATION]: 'cloud_download',
      [EventType.MITIGATION]: 'security',
      [EventType.CUSTOM]: 'more_horiz'
    };
    
    return iconMap[type] || 'event';
  }
  
  /**
   * Subscribe to timeline event updates
   */
  subscribeToUpdates(callback: (update: { type: 'add' | 'update' | 'delete'; item?: TimelineItem; id?: string }) => void): () => void {
    // Create subscription handlers for each event type
    const createdHandler = (event: TimelineEvent) => {
      callback({
        type: 'add',
        item: this.transformEventToTimelineItem(event)
      });
    };
    
    const updatedHandler = (event: TimelineEvent) => {
      callback({
        type: 'update',
        item: this.transformEventToTimelineItem(event)
      });
    };
    
    const deletedHandler = (data: { id: string }) => {
      callback({
        type: 'delete',
        id: data.id
      });
    };
    
    // Subscribe to events
    const createdSubscription = enhancedEventEmitter.on('timeline:event:created', createdHandler);
    const updatedSubscription = enhancedEventEmitter.on('timeline:event:updated', updatedHandler);
    const deletedSubscription = enhancedEventEmitter.on('timeline:event:deleted', deletedHandler);
    
    // Return unsubscribe function
    return () => {
      createdSubscription.unsubscribe();
      updatedSubscription.unsubscribe();
      deletedSubscription.unsubscribe();
    };
  }
  
  /**
   * Add multiple events in a single transaction
   */
  async addEventsInTransaction(events: Partial<TimelineEvent>[]): Promise<string[]> {
    // Begin a transaction
    const transaction = storageOrchestrator.beginTransaction();
    const eventIds: string[] = [];
    
    try {
      for (const eventData of events) {
        const finalEvent = {
          ...eventData,
          type: 'timeline_event'
        } as TimelineEvent;
        
        // Add operation to transaction
        transaction.addOperation(
          // Store operation
          async () => {
            const result = await intelDataStore.createEntity(finalEvent);
            if (result.success && result.data) {
              eventIds.push(result.data.id);
              enhancedEventEmitter.emit('timeline:event:created', result.data);
            } else {
              throw new Error(`Failed to create event: ${result.error}`);
            }
          },
          // Rollback operation
          async () => {
            // If we have an ID, delete the entity (rollback)
            if (finalEvent.id) {
              await intelDataStore.deleteEntity(finalEvent.id);
            }
          }
        );
      }
      
      // Commit the transaction
      await transaction.commit();
      return eventIds;
    } catch (error) {
      // Rollback on error
      await transaction.rollback();
      console.error('Error in batch event creation:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const timelineAdapter = new TimelineAdapter();
