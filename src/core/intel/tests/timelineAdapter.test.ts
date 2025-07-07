/**
 * Unit tests for TimelineAdapter
 */

import { timelineAdapter } from '../adapters/timelineAdapter';
import { TimelineEvent, EventType, ClassificationLevel } from '../types/intelDataModels';
import { intelDataStore } from '../store/intelDataStore';
import { v4 as uuidv4 } from 'uuid';

// Manually mock the intelDataStore
const mockCreateEntity = vi.fn();
const mockQueryEntities = vi.fn();
const mockUpdateEntity = vi.fn();
const mockDeleteEntity = vi.fn();

// Override the real implementation with mocks
vi.mock('../store/intelDataStore', () => ({
  intelDataStore: {
    createEntity: mockCreateEntity,
    queryEntities: mockQueryEntities,
    updateEntity: mockUpdateEntity,
    deleteEntity: mockDeleteEntity,
    getEntity: vi.fn(),
    getRelationships: vi.fn()
  }
}));

describe('TimelineAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTimelineData', () => {
    it('should transform TimelineEvents to TimelineItems correctly', async () => {
      // Arrange
      const mockEvents: TimelineEvent[] = [
        {
          id: '1',
          type: 'timeline_event',
          title: 'Test Event 1',
          description: 'Test Description 1',
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
          tags: ['attack', 'test']
        },
        {
          id: '2',
          type: 'timeline_event',
          title: 'Test Event 2',
          description: 'Test Description 2',
          eventType: EventType.DETECTION,
          startDate: '2025-07-02T10:00:00Z',
          isEstimated: true,
          relatedEntities: ['entity3'],
          importance: 60,
          createdAt: '2025-07-02T09:00:00Z',
          updatedAt: '2025-07-02T09:00:00Z',
          createdBy: 'test-user',
          classification: ClassificationLevel.SENSITIVE,
          source: 'test-source',
          verified: false,
          confidence: 70,
          attachments: [],
          metadata: { testKey: 'testValue2' },
          tags: ['detection', 'test']
        }
      ];

      // Mock the store response
      (intelDataStore.queryEntities as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEvents
      });

      // Act
      const result = await timelineAdapter.getTimelineData();

      // Assert
      expect(intelDataStore.queryEntities).toHaveBeenCalledWith(expect.objectContaining({
        types: ['timeline_event']
      }));
      
      // Check that the data was transformed correctly
      expect(result.items.length).toBe(2);
      expect(result.groups.length).toBe(2);
      
      expect(result.items[0].id).toBe('1');
      expect(result.items[0].title).toBe('Test Event 1');
      expect(result.items[0].startTime).toEqual(new Date('2025-07-01T10:00:00Z'));
      expect(result.items[0].endTime).toEqual(new Date('2025-07-01T11:00:00Z'));
      expect(result.items[0].group).toBe(EventType.ATTACK);
      expect(result.items[0].importance).toBe(80);
      
      expect(result.items[1].id).toBe('2');
      expect(result.items[1].isEstimated).toBe(true);
      expect(result.items[1].endTime).toBeUndefined();
      
      // Check that the groups were created correctly
      expect(result.groups[0].id).toBe(EventType.ATTACK);
      expect(result.groups[1].id).toBe(EventType.DETECTION);
    });

    it('should handle filters correctly', async () => {
      // Arrange
      const filters = [
        { property: 'eventType', operator: 'equals', value: EventType.ATTACK },
        { property: 'startDate', operator: 'after', value: '2025-07-01' }
      ];

      // Mock the store response
      (intelDataStore.queryEntities as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      });

      // Act
      await timelineAdapter.getTimelineData(filters);

      // Assert
      expect(intelDataStore.queryEntities).toHaveBeenCalledWith(expect.objectContaining({
        filters: expect.objectContaining({
          'eventType': EventType.ATTACK,
          'startDate_gt': '2025-07-01'
        })
      }));
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      (intelDataStore.queryEntities as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Test error'
      });

      // Act
      const result = await timelineAdapter.getTimelineData();

      // Assert
      expect(result.items).toEqual([]);
      expect(result.groups).toEqual([]);
    });
  });

  describe('addEvent', () => {
    it('should create a timeline event', async () => {
      // Arrange
      const newEvent: Partial<TimelineEvent> = {
        title: 'New Event',
        description: 'New Description',
        eventType: EventType.INCIDENT,
        startDate: '2025-07-03T10:00:00Z',
        isEstimated: false,
        importance: 90
      };
      
      const createdEvent = {
        id: uuidv4(),
        ...newEvent
      };

      (intelDataStore.createEntity as jest.Mock).mockResolvedValue({
        success: true,
        data: createdEvent
      });

      // Act
      const result = await timelineAdapter.addEvent(newEvent);

      // Assert
      expect(intelDataStore.createEntity).toHaveBeenCalledWith(expect.objectContaining({
        ...newEvent,
        type: 'timeline_event'
      }));
      
      expect(result).toBe(createdEvent.id);
    });
  });

  describe('updateEvent', () => {
    it('should update a timeline event', async () => {
      // Arrange
      const eventId = uuidv4();
      const updates: Partial<TimelineEvent> = {
        title: 'Updated Title',
        importance: 95
      };

      (intelDataStore.updateEntity as jest.Mock).mockResolvedValue({
        success: true
      });

      // Act
      const result = await timelineAdapter.updateEvent(eventId, updates);

      // Assert
      expect(intelDataStore.updateEntity).toHaveBeenCalledWith(eventId, updates);
      expect(result).toBe(true);
    });
  });

  describe('deleteEvent', () => {
    it('should delete a timeline event', async () => {
      // Arrange
      const eventId = uuidv4();

      (intelDataStore.deleteEntity as jest.Mock).mockResolvedValue({
        success: true
      });

      // Act
      const result = await timelineAdapter.deleteEvent(eventId);

      // Assert
      expect(intelDataStore.deleteEntity).toHaveBeenCalledWith(eventId);
      expect(result).toBe(true);
    });
  });
});
