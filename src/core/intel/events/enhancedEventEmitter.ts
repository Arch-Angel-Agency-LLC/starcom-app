/**
 * IntelDataCore - Enhanced Event System
 * 
 * This file implements an advanced event system for IntelDataCore
 * with filtering, throttling, and pattern matching capabilities.
 */

import { v4 as uuidv4 } from 'uuid';
import { DataEvent, EventSubscription } from '../types/intelDataModels';

/**
 * Event subscription handler type
 */
export type EventHandler = (event: DataEvent) => void;

/**
 * Event filter function type
 */
export type EventFilterFunction = (event: DataEvent) => boolean;

/**
 * Enhanced event subscription options
 */
export interface EventSubscriptionOptions {
  id?: string;
  topics: string[];
  callback: EventHandler;
  filter?: EventFilterFunction;
  throttleMs?: number;
  maxEvents?: number;
  includeHistory?: boolean;
  pattern?: string | RegExp;
}

/**
 * Enhanced event emitter implementation
 */
export class EnhancedEventEmitter {
  private listeners: Record<string, Map<string, EventSubscription>> = {};
  private eventHistory: DataEvent[] = [];
  private historyLimit: number = 100;
  private throttleTimers: Map<string, number> = new Map();
  private eventCounts: Map<string, number> = new Map();

  /**
   * Constructor
   */
  constructor(historyLimit: number = 100) {
    this.historyLimit = historyLimit;
  }

  /**
   * Subscribe to events
   */
  subscribe(options: EventSubscriptionOptions): string {
    const id = options.id || uuidv4();
    
    const subscription: EventSubscription = {
      id,
      topics: options.topics,
      callback: options.callback,
      filters: {
        customFilter: options.filter,
        pattern: options.pattern,
        throttleMs: options.throttleMs,
        maxEvents: options.maxEvents
      }
    };
    
    // Register subscription for each topic
    options.topics.forEach(topic => {
      if (!this.listeners[topic]) {
        this.listeners[topic] = new Map();
      }
      this.listeners[topic].set(id, subscription);
    });
    
    // Send history events if requested
    if (options.includeHistory) {
      this.sendHistoryEvents(subscription);
    }
    
    return id;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(id: string): void {
    // Find and remove all subscriptions with this ID
    Object.keys(this.listeners).forEach(topic => {
      if (this.listeners[topic]?.has(id)) {
        this.listeners[topic].delete(id);
      }
    });
    
    // Clean up throttle timers
    if (this.throttleTimers.has(id)) {
      clearTimeout(this.throttleTimers.get(id) as number);
      this.throttleTimers.delete(id);
    }
    
    // Clean up event counts
    this.eventCounts.delete(id);
  }

  /**
   * Emit an event
   */
  emit(event: DataEvent): void {
    // Add to history
    this.addToHistory(event);
    
    // Emit on the specific topic
    this.emitToTopic(event.topic, event);
    
    // Also emit on wildcard topics
    const parts = event.topic.split('.');
    for (let i = parts.length; i > 0; i--) {
      const wildcardTopic = [...parts.slice(0, i), '*'].join('.');
      this.emitToTopic(wildcardTopic, event);
    }
    
    // Emit on global wildcard
    this.emitToTopic('*', event);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get event history
   */
  getHistory(): DataEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Add an event to history
   */
  private addToHistory(event: DataEvent): void {
    this.eventHistory.push(event);
    
    // Trim history if needed
    if (this.eventHistory.length > this.historyLimit) {
      this.eventHistory = this.eventHistory.slice(
        this.eventHistory.length - this.historyLimit
      );
    }
  }

  /**
   * Emit an event to a specific topic
   */
  private emitToTopic(topic: string, event: DataEvent): void {
    const listeners = this.listeners[topic];
    if (!listeners) return;
    
    listeners.forEach((subscription, id) => {
      // Apply filtering logic
      if (this.shouldDeliverEvent(id, subscription, event)) {
        this.deliverEvent(id, subscription, event);
      }
    });
  }

  /**
   * Determine if an event should be delivered to a subscription
   */
  private shouldDeliverEvent(
    id: string, 
    subscription: EventSubscription, 
    event: DataEvent
  ): boolean {
    const filters = subscription.filters || {};
    
    // Check max events filter
    if (typeof filters.maxEvents === 'number') {
      const count = this.eventCounts.get(id) || 0;
      if (count >= filters.maxEvents) {
        return false;
      }
    }
    
    // Check custom filter function
    if (filters.customFilter && typeof filters.customFilter === 'function') {
      if (!(filters.customFilter as EventFilterFunction)(event)) {
        return false;
      }
    }
    
    // Check pattern matching
    if (filters.pattern) {
      const pattern = filters.pattern;
      const text = JSON.stringify(event);
      
      if (pattern instanceof RegExp) {
        if (!pattern.test(text)) {
          return false;
        }
      } else if (typeof pattern === 'string') {
        if (!text.includes(pattern)) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Deliver an event to a subscription
   */
  private deliverEvent(
    id: string, 
    subscription: EventSubscription, 
    event: DataEvent
  ): void {
    const filters = subscription.filters || {};
    
    // Update event count
    if (typeof filters.maxEvents === 'number') {
      const count = this.eventCounts.get(id) || 0;
      this.eventCounts.set(id, count + 1);
    }
    
    // Handle throttling
    if (typeof filters.throttleMs === 'number' && filters.throttleMs > 0) {
      // If already throttled, ignore this event
      if (this.throttleTimers.has(id)) {
        return;
      }
      
      // Set throttle timer
      const timer = setTimeout(() => {
        this.throttleTimers.delete(id);
      }, filters.throttleMs);
      
      this.throttleTimers.set(id, timer);
    }
    
    // Deliver the event
    try {
      subscription.callback(event);
    } catch (error) {
      console.error(`Error in event handler for ${event.topic}:`, error);
    }
  }

  /**
   * Send history events to a new subscription
   */
  private sendHistoryEvents(subscription: EventSubscription): void {
    const relevantEvents = this.eventHistory.filter(event => {
      // Check if event topic matches any subscription topics
      return subscription.topics.some(topic => {
        // Exact match
        if (topic === event.topic) return true;
        
        // Wildcard match
        if (topic.includes('*')) {
          const pattern = topic.replace(/\*/g, '.*');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(event.topic);
        }
        
        return false;
      });
    });
    
    // Deliver relevant events
    relevantEvents.forEach(event => {
      if (this.shouldDeliverEvent(subscription.id, subscription, event)) {
        subscription.callback(event);
      }
    });
  }

  /**
   * Subscribe to events with a simpler interface
   * 
   * Returns a subscription object with an unsubscribe method
   */
  on(eventName: string, handler: (data: any) => void): { unsubscribe: () => void } {
    const subscriptionId = this.subscribe({
      topics: [eventName],
      callback: (event) => handler(event.data)
    });
    
    return {
      unsubscribe: () => this.unsubscribe(subscriptionId)
    };
  }

  /**
   * Emit an event with data
   */
  emit(eventName: string, data?: any): void {
    const event: DataEvent = {
      id: uuidv4(),
      type: 'update', // Default type
      topic: eventName,
      timestamp: new Date().toISOString(),
      entityId: data?.id || uuidv4(),
      entityType: data?.type || 'unknown',
      data: data || {},
      source: 'intel-data-core'
    };
    
    // Add to history
    this.addToHistory(event);
    
    // Emit on the specific topic
    this.emitToTopic(event.topic, event);
    
    // Also emit on wildcard topics
    const topicParts = event.topic.split(':');
    for (let i = 1; i < topicParts.length; i++) {
      const wildcardTopic = [...topicParts.slice(0, i), '*'].join(':');
      this.emitToTopic(wildcardTopic, event);
    }
    
    // Emit on global wildcard
    this.emitToTopic('*', event);
  }
}

// Create and export a singleton instance
export const enhancedEventEmitter = new EnhancedEventEmitter();
