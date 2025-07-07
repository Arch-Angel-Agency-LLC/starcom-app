/**
 * IntelDataCore - In-Memory Store with Enhanced Events
 * 
 * This file implements a basic in-memory store for intelligence data
 * with CRUD operations, querying capabilities, and enhanced event system.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  BaseEntity,
  Relationship,
  IntelEntity,
  NodeEntity,
  TimelineEvent,
  CaseRecord,
  IntelQueryOptions,
  DataEvent,
  EventSubscription
} from '../types/intelDataModels';
import { enhancedEventEmitter, EventSubscriptionOptions } from '../events/enhancedEventEmitter';

/**
 * Storage result interface
 */
interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * In-memory data store for IntelDataCore with enhanced event system
 */
export class IntelDataStore {
  private entities: Map<string, BaseEntity> = new Map();
  private relationships: Map<string, Relationship> = new Map();
  
  /**
   * Create a new entity in the store
   */
  async createEntity<T extends BaseEntity>(entity: Partial<T>): Promise<StorageResult<T>> {
    try {
      if (!entity.id) {
        entity.id = uuidv4();
      }
      
      const now = new Date().toISOString();
      const newEntity = {
        ...entity,
        createdAt: entity.createdAt || now,
        updatedAt: now,
        metadata: entity.metadata || {},
        tags: entity.tags || []
      } as T;
      
      this.entities.set(newEntity.id, newEntity);
      
      // Emit create event
      this.emitDataEvent({
        id: uuidv4(),
        type: 'create',
        topic: `entity.${newEntity.type}`,
        timestamp: now,
        entityId: newEntity.id,
        entityType: newEntity.type,
        data: newEntity,
        source: 'intelDataStore'
      });
      
      return { success: true, data: newEntity };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error creating entity' 
      };
    }
  }
  
  /**
   * Get an entity by ID
   */
  async getEntity<T extends BaseEntity>(id: string): Promise<StorageResult<T>> {
    try {
      const entity = this.entities.get(id) as T;
      if (!entity) {
        return { success: false, error: `Entity with ID ${id} not found` };
      }
      return { success: true, data: entity };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error getting entity' 
      };
    }
  }
  
  /**
   * Update an existing entity
   */
  async updateEntity<T extends BaseEntity>(id: string, updates: Partial<T>): Promise<StorageResult<T>> {
    try {
      const existing = this.entities.get(id);
      if (!existing) {
        return { success: false, error: `Entity with ID ${id} not found` };
      }
      
      const now = new Date().toISOString();
      const updatedEntity = {
        ...existing,
        ...updates,
        id, // Ensure ID can't be changed
        updatedAt: now
      } as T;
      
      this.entities.set(id, updatedEntity);
      
      // Emit update event
      this.emitDataEvent({
        id: uuidv4(),
        type: 'update',
        topic: `entity.${updatedEntity.type}`,
        timestamp: now,
        entityId: updatedEntity.id,
        entityType: updatedEntity.type,
        data: updatedEntity,
        source: 'intelDataStore'
      });
      
      return { success: true, data: updatedEntity };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error updating entity' 
      };
    }
  }
  
  /**
   * Delete an entity by ID
   */
  async deleteEntity(id: string): Promise<StorageResult<void>> {
    try {
      const entity = this.entities.get(id);
      if (!entity) {
        return { success: false, error: `Entity with ID ${id} not found` };
      }
      
      // Find and delete all relationships involving this entity
      const relationsToDelete: string[] = [];
      for (const [relId, relation] of this.relationships.entries()) {
        if (relation.sourceId === id || relation.targetId === id) {
          relationsToDelete.push(relId);
        }
      }
      
      relationsToDelete.forEach(relId => {
        this.relationships.delete(relId);
      });
      
      // Delete the entity
      this.entities.delete(id);
      
      // Emit delete event
      this.emitDataEvent({
        id: uuidv4(),
        type: 'delete',
        topic: `entity.${entity.type}`,
        timestamp: new Date().toISOString(),
        entityId: id,
        entityType: entity.type,
        data: { id },
        source: 'intelDataStore'
      });
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error deleting entity' 
      };
    }
  }
  
  /**
   * Create a new relationship between entities
   */
  async createRelationship(relationship: Partial<Relationship>): Promise<StorageResult<Relationship>> {
    try {
      // Validate source and target exist
      if (relationship.sourceId && !this.entities.has(relationship.sourceId)) {
        return { success: false, error: `Source entity with ID ${relationship.sourceId} not found` };
      }
      
      if (relationship.targetId && !this.entities.has(relationship.targetId)) {
        return { success: false, error: `Target entity with ID ${relationship.targetId} not found` };
      }
      
      if (!relationship.id) {
        relationship.id = uuidv4();
      }
      
      const now = new Date().toISOString();
      const newRelationship = {
        ...relationship,
        createdAt: relationship.createdAt || now,
        updatedAt: now,
        metadata: relationship.metadata || {},
        tags: relationship.tags || []
      } as Relationship;
      
      this.relationships.set(newRelationship.id, newRelationship);
      
      // Emit relation event
      this.emitDataEvent({
        id: uuidv4(),
        type: 'relation',
        topic: `relation.${newRelationship.type}`,
        timestamp: now,
        entityId: newRelationship.id,
        entityType: 'relationship',
        data: newRelationship,
        source: 'intelDataStore'
      });
      
      return { success: true, data: newRelationship };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error creating relationship' 
      };
    }
  }
  
  /**
   * Get relationships for an entity
   */
  async getRelationships(entityId: string): Promise<StorageResult<Relationship[]>> {
    try {
      const relations: Relationship[] = [];
      
      for (const relation of this.relationships.values()) {
        if (relation.sourceId === entityId || relation.targetId === entityId) {
          relations.push(relation);
        }
      }
      
      return { success: true, data: relations };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error getting relationships' 
      };
    }
  }
  
  /**
   * Query entities with filtering options
   */
  async queryEntities<T extends BaseEntity>(options: IntelQueryOptions = {}): Promise<StorageResult<T[]>> {
    try {
      let results = Array.from(this.entities.values()) as T[];
      
      // Filter by type
      if (options.types && options.types.length > 0) {
        results = results.filter(entity => 
          options.types!.includes(entity.type)
        );
      }
      
      // Filter by tags (any of the provided tags)
      if (options.tags && options.tags.length > 0) {
        results = results.filter(entity => 
          entity.tags.some(tag => options.tags!.includes(tag))
        );
      }
      
      // Filter by date range (if entity has createdAt property)
      if (options.startDate) {
        results = results.filter(entity => 
          new Date(entity.createdAt) >= new Date(options.startDate!)
        );
      }
      
      if (options.endDate) {
        results = results.filter(entity => 
          new Date(entity.createdAt) <= new Date(options.endDate!)
        );
      }
      
      // Apply custom filters
      if (options.filters) {
        results = results.filter(entity => {
          for (const [key, value] of Object.entries(options.filters!)) {
            // Handle nested properties with dot notation
            const props = key.split('.');
            let current: any = entity;
            
            // Navigate to the nested property
            for (let i = 0; i < props.length; i++) {
              if (current === undefined || current === null) return false;
              current = current[props[i]];
            }
            
            if (current !== value) return false;
          }
          return true;
        });
      }
      
      // Sort results
      if (options.sortBy) {
        const direction = options.sortDirection === 'desc' ? -1 : 1;
        
        results.sort((a: any, b: any) => {
          const props = options.sortBy!.split('.');
          let aVal: any = a;
          let bVal: any = b;
          
          // Navigate to the nested property
          for (const prop of props) {
            aVal = aVal?.[prop];
            bVal = bVal?.[prop];
          }
          
          if (aVal === undefined && bVal === undefined) return 0;
          if (aVal === undefined) return -1 * direction;
          if (bVal === undefined) return 1 * direction;
          
          if (typeof aVal === 'string') {
            return aVal.localeCompare(bVal) * direction;
          }
          
          return (aVal - bVal) * direction;
        });
      }
      
      // Apply pagination
      if (options.offset !== undefined || options.limit !== undefined) {
        const offset = options.offset || 0;
        const end = options.limit !== undefined ? offset + options.limit : undefined;
        results = results.slice(offset, end);
      }
      
      // Include relationships if requested
      if (options.includeRelationships) {
        // Implement relationship expansion here
        // This would involve looking up relationships for each entity
        // and potentially traversing the graph to the specified depth
      }
      
      return { success: true, data: results };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error querying entities' 
      };
    }
  }
  
  /**
   * Subscribe to data events with advanced filtering
   */
  subscribe(options: EventSubscriptionOptions): string {
    return enhancedEventEmitter.subscribe(options);
  }
  
  /**
   * Unsubscribe from data events
   */
  unsubscribe(subscriptionId: string): void {
    enhancedEventEmitter.unsubscribe(subscriptionId);
  }
  
  /**
   * Get event history
   */
  getEventHistory(): DataEvent[] {
    return enhancedEventEmitter.getHistory();
  }
  
  /**
   * Clear event history
   */
  clearEventHistory(): void {
    enhancedEventEmitter.clearHistory();
  }
  
  /**
   * Emit a data event
   */
  private emitDataEvent(event: DataEvent): void {
    enhancedEventEmitter.emit(event);
  }
}

// Create and export a singleton instance
export const intelDataStore = new IntelDataStore();
