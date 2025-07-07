/**
 * Extended unit tests for TimelineAdapter
 * 
 * This test suite covers additional functionality of the TimelineAdapter,
 * focusing on real-time data synchronization, persistence operations,
 * and integration with the StorageOrchestrator.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timelineAdapter } from '../adapters/timelineAdapter';
import { TimelineEvent, EventType, ClassificationLevel } from '../types/intelDataModels';
import { intelDataStore } from '../store/intelDataStore';
import { storageOrchestrator } from '../storage/storageOrchestrator';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
vi.mock('../store/intelDataStore');
vi.mock('../storage/storageOrchestrator');
vi.mock('../events/enhancedEventEmitter');

describe('TimelineAdapter - Advanced Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Create a mock event for testing
  const createMockEvent = (customProps = {}): TimelineEvent => ({
    id: uuidv4(),
    type: 'timeline_event',
    title: 'Test Event',
    description: 'Test Description',
    eventType: EventType.ATTACK,
    startDate: '2025-07-01T10:00:00Z',
    endDate: '2025-07-01T11:00:00Z',
    isEstimated: false,
    relatedEntities: ['entity1', 'entity2'],
    importance: 80,
    createdAt: '2025-07-01T09:00:00Z',
    updatedAt: '2025-07-01T09:00:00Z',
    createdBy: 'test-user',
    classification: ClassificationLevel.CONFIDENTIAL,
    source: 'test-source',
    verified: true,
    confidence: 90,
    attachments: [],
    metadata: { testKey: 'testValue' },
    tags: ['attack', 'test'],
    ...customProps
  });

  describe('Real-time data synchronization', () => {
    it('should emit events when timeline data changes', async () => {
      // Arrange
      const mockEvent = createMockEvent();
      vi.mocked(intelDataStore.createEntity).mockResolvedValue({
        success: true,
        data: mockEvent
      });
      
      // Act
      await timelineAdapter.addEvent(mockEvent);
      
      // Assert
      expect(enhancedEventEmitter.emit).toHaveBeenCalledWith(
        'timeline:event:created',
        expect.objectContaining({
          id: mockEvent.id
        })
      );
    });
    
    it('should update timeline data when receiving relevant events', async () => {
      // Arrange
      const mockEvent = createMockEvent();
      const mockCallback = vi.fn();
      
      // Act
      // Simulate subscribing to timeline events
      timelineAdapter.subscribeToUpdates(mockCallback);
      
      // Simulate event emission
      const mockListener = vi.mocked(enhancedEventEmitter.on).mock.calls[0][1];
      mockListener({
        eventType: 'timeline:event:created',
        data: mockEvent
      });
      
      // Assert
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'add',
          item: expect.objectContaining({
            id: mockEvent.id
          })
        })
      );
    });
  });

  describe('Storage integration', () => {
    it('should use StorageOrchestrator for persistent operations', async () => {
      // Arrange
      const mockEvent = createMockEvent();
      vi.mocked(storageOrchestrator.storeEntity).mockResolvedValue({
        success: true,
        data: mockEvent
      });
      
      // Act
      await timelineAdapter.addEvent(mockEvent, { persistenceMode: 'immediate' });
      
      // Assert
      expect(storageOrchestrator.storeEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockEvent.id
        }),
        expect.objectContaining({
          persistenceMode: 'immediate'
        })
      );
    });
    
    it('should handle transaction operations correctly', async () => {
      // Arrange
      const mockEvents = [
        createMockEvent({ title: 'Event 1' }),
        createMockEvent({ title: 'Event 2' }),
        createMockEvent({ title: 'Event 3' })
      ];
      
      const mockTransaction = {
        addOperation: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn()
      };
      
      vi.mocked(storageOrchestrator.beginTransaction).mockReturnValue(mockTransaction);
      
      // Act
      await timelineAdapter.addEventsInTransaction(mockEvents);
      
      // Assert
      expect(storageOrchestrator.beginTransaction).toHaveBeenCalled();
      expect(mockTransaction.addOperation).toHaveBeenCalledTimes(mockEvents.length);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
    
    it('should rollback transaction on error', async () => {
      // Arrange
      const mockEvents = [
        createMockEvent({ title: 'Event 1' }),
        createMockEvent({ title: 'Event 2' })
      ];
      
      const mockTransaction = {
        addOperation: vi.fn().mockImplementation((op, rollback) => {
          if (mockTransaction.addOperation.mock.calls.length === 2) {
            throw new Error('Test error');
          }
        }),
        commit: vi.fn(),
        rollback: vi.fn()
      };
      
      vi.mocked(storageOrchestrator.beginTransaction).mockReturnValue(mockTransaction);
      
      // Act & Assert
      await expect(timelineAdapter.addEventsInTransaction(mockEvents)).rejects.toThrow('Test error');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('Query capabilities', () => {
    it('should support advanced filtering options', async () => {
      // Arrange
      const mockEvents = [
        createMockEvent({ 
          title: 'Attack Event', 
          eventType: EventType.ATTACK,
          importance: 90
        }),
        createMockEvent({ 
          title: 'Detection Event', 
          eventType: EventType.DETECTION,
          importance: 60
        })
      ];
      
      vi.mocked(intelDataStore.queryEntities).mockResolvedValue({
        success: true,
        data: mockEvents
      });
      
      // Act
      const filters = [
        { property: 'importance', operator: 'gte', value: 80 }
      ];
      const result = await timelineAdapter.getTimelineData(filters);
      
      // Assert
      expect(intelDataStore.queryEntities).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.arrayContaining([
            expect.objectContaining({
              field: 'importance',
              operator: 'gte',
              value: 80
            })
          ])
        })
      );
    });
    
    it('should support sorting and pagination', async () => {
      // Arrange
      const mockEvents = Array(10).fill(null).map((_, i) => 
        createMockEvent({ 
          title: `Event ${i}`, 
          importance: 90 - i * 5
        })
      );
      
      vi.mocked(intelDataStore.queryEntities).mockResolvedValue({
        success: true,
        data: mockEvents.slice(0, 5),
        pagination: {
          total: mockEvents.length,
          page: 1,
          pageSize: 5,
          totalPages: 2
        }
      });
      
      // Act
      const result = await timelineAdapter.getTimelineData([], {
        sort: { field: 'importance', direction: 'desc' },
        pagination: { page: 1, pageSize: 5 }
      });
      
      // Assert
      expect(intelDataStore.queryEntities).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: { field: 'importance', direction: 'desc' },
          pagination: { page: 1, pageSize: 5 }
        })
      );
      
      expect(result.pagination).toEqual({
        total: mockEvents.length,
        page: 1,
        pageSize: 5,
        totalPages: 2
      });
    });
  });
});
