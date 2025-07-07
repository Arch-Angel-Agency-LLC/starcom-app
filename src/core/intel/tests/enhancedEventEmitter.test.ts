/**
 * Unit tests for the Enhanced Event Emitter
 */

import { v4 as uuidv4 } from 'uuid';
import { enhancedEventEmitter, EventHandler } from '../events/enhancedEventEmitter';
import { DataEvent } from '../types/intelDataModels';

describe('EnhancedEventEmitter', () => {
  beforeEach(() => {
    // Clear event history before each test
    enhancedEventEmitter.clearHistory();
  });

  it('should subscribe to events and receive them', () => {
    // Create a mock callback
    const mockCallback = jest.fn();
    
    // Subscribe to events
    const subscriptionId = enhancedEventEmitter.subscribe({
      topics: ['test.event'],
      callback: mockCallback
    });
    
    // Emit an event
    const testEvent: DataEvent = {
      id: uuidv4(),
      type: 'create',
      topic: 'test.event',
      timestamp: new Date().toISOString(),
      entityId: 'test-entity',
      entityType: 'test',
      data: { test: true },
      source: 'test'
    };
    
    enhancedEventEmitter.emit(testEvent);
    
    // Assert the callback was called with the event
    expect(mockCallback).toHaveBeenCalledWith(testEvent);
    
    // Unsubscribe
    enhancedEventEmitter.unsubscribe(subscriptionId);
    
    // Emit another event
    const anotherEvent: DataEvent = {
      ...testEvent,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    };
    
    enhancedEventEmitter.emit(anotherEvent);
    
    // Assert the callback was not called again
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
  
  it('should support wildcard subscriptions', () => {
    // Create a mock callback
    const mockCallback = jest.fn();
    
    // Subscribe to wildcard events
    const subscriptionId = enhancedEventEmitter.subscribe({
      topics: ['test.*'],
      callback: mockCallback
    });
    
    // Emit events with matching and non-matching topics
    const matchingEvent: DataEvent = {
      id: uuidv4(),
      type: 'create',
      topic: 'test.match',
      timestamp: new Date().toISOString(),
      entityId: 'test-entity-1',
      entityType: 'test',
      data: { test: true },
      source: 'test'
    };
    
    const nonMatchingEvent: DataEvent = {
      id: uuidv4(),
      type: 'create',
      topic: 'other.event',
      timestamp: new Date().toISOString(),
      entityId: 'test-entity-2',
      entityType: 'test',
      data: { test: true },
      source: 'test'
    };
    
    enhancedEventEmitter.emit(matchingEvent);
    enhancedEventEmitter.emit(nonMatchingEvent);
    
    // Assert the callback was called only for the matching event
    expect(mockCallback).toHaveBeenCalledWith(matchingEvent);
    expect(mockCallback).toHaveBeenCalledTimes(1);
    
    // Unsubscribe
    enhancedEventEmitter.unsubscribe(subscriptionId);
  });
  
  it('should filter events based on custom filter function', () => {
    // Create a mock callback
    const mockCallback = jest.fn();
    
    // Subscribe with a custom filter
    const subscriptionId = enhancedEventEmitter.subscribe({
      topics: ['test.event'],
      callback: mockCallback,
      filter: (event: DataEvent) => event.data.value > 10
    });
    
    // Emit events that pass and fail the filter
    const passingEvent: DataEvent = {
      id: uuidv4(),
      type: 'create',
      topic: 'test.event',
      timestamp: new Date().toISOString(),
      entityId: 'test-entity-1',
      entityType: 'test',
      data: { value: 20 },
      source: 'test'
    };
    
    const failingEvent: DataEvent = {
      id: uuidv4(),
      type: 'create',
      topic: 'test.event',
      timestamp: new Date().toISOString(),
      entityId: 'test-entity-2',
      entityType: 'test',
      data: { value: 5 },
      source: 'test'
    };
    
    enhancedEventEmitter.emit(passingEvent);
    enhancedEventEmitter.emit(failingEvent);
    
    // Assert the callback was called only for the passing event
    expect(mockCallback).toHaveBeenCalledWith(passingEvent);
    expect(mockCallback).toHaveBeenCalledTimes(1);
    
    // Unsubscribe
    enhancedEventEmitter.unsubscribe(subscriptionId);
  });
  
  it('should support pattern matching on events', () => {
    // Create a mock callback
    const mockCallback = jest.fn();
    
    // Subscribe with a string pattern
    const subscriptionId = enhancedEventEmitter.subscribe({
      topics: ['test.event'],
      callback: mockCallback,
      pattern: 'important'
    });
    
    // Emit events that match and don't match the pattern
    const matchingEvent: DataEvent = {
      id: uuidv4(),
      type: 'create',
      topic: 'test.event',
      timestamp: new Date().toISOString(),
      entityId: 'test-entity-1',
      entityType: 'test',
      data: { message: 'This is an important event' },
      source: 'test'
    };
    
    const nonMatchingEvent: DataEvent = {
      id: uuidv4(),
      type: 'create',
      topic: 'test.event',
      timestamp: new Date().toISOString(),
      entityId: 'test-entity-2',
      entityType: 'test',
      data: { message: 'This is a regular event' },
      source: 'test'
    };
    
    enhancedEventEmitter.emit(matchingEvent);
    enhancedEventEmitter.emit(nonMatchingEvent);
    
    // Assert the callback was called only for the matching event
    expect(mockCallback).toHaveBeenCalledWith(matchingEvent);
    expect(mockCallback).toHaveBeenCalledTimes(1);
    
    // Unsubscribe
    enhancedEventEmitter.unsubscribe(subscriptionId);
  });
  
  it('should maintain event history and support history retrieval', () => {
    // Emit several events
    const events: DataEvent[] = [];
    
    for (let i = 0; i < 5; i++) {
      const event: DataEvent = {
        id: uuidv4(),
        type: 'create',
        topic: 'test.history',
        timestamp: new Date().toISOString(),
        entityId: `test-entity-${i}`,
        entityType: 'test',
        data: { index: i },
        source: 'test'
      };
      
      events.push(event);
      enhancedEventEmitter.emit(event);
    }
    
    // Get history
    const history = enhancedEventEmitter.getHistory();
    
    // Assert all events are in the history
    expect(history).toHaveLength(events.length);
    
    // Check if events are in the correct order
    for (let i = 0; i < events.length; i++) {
      expect(history[i].id).toBe(events[i].id);
    }
    
    // Subscribe with includeHistory=true
    const mockCallback = jest.fn();
    const subscriptionId = enhancedEventEmitter.subscribe({
      topics: ['test.history'],
      callback: mockCallback,
      includeHistory: true
    });
    
    // Assert the callback was called for all historical events
    expect(mockCallback).toHaveBeenCalledTimes(events.length);
    
    // Unsubscribe
    enhancedEventEmitter.unsubscribe(subscriptionId);
  });
});
