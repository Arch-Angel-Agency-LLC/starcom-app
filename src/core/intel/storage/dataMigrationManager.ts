/**
 * Data Migration Utilities for IntelDataCore
 * 
 * This module provides utilities for data schema migration and evolution,
 * allowing for seamless updates to data models while preserving existing data.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  BaseEntity, 
  NodeEntity, 
  EdgeRelationship, 
  IntelReport,
  TimelineEvent,
  StorageResult
} from '../types/intelDataModels';
import { intelDataStore } from '../store/intelDataStore';
import { indexedDBAdapter } from './indexedDBAdapter';
import { storageOrchestrator } from './storageOrchestrator';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';

/**
 * Migration operation types
 */
export enum MigrationOpType {
  ADD_FIELD = 'add_field',
  RENAME_FIELD = 'rename_field',
  REMOVE_FIELD = 'remove_field',
  TRANSFORM_FIELD = 'transform_field',
  SPLIT_FIELD = 'split_field',
  MERGE_FIELDS = 'merge_fields',
  TYPE_CONVERSION = 'type_conversion',
  ENTITY_TYPE_CHANGE = 'entity_type_change'
}

/**
 * Migration operation interface
 */
export interface MigrationOperation {
  type: MigrationOpType;
  entityTypes?: string[];
  sourceField?: string;
  targetField?: string;
  defaultValue?: any;
  transformFn?: (value: any, entity: BaseEntity) => any;
}

/**
 * Migration plan interface
 */
export interface MigrationPlan {
  id: string;
  name: string;
  description: string;
  version: string;
  previousVersion: string;
  operations: MigrationOperation[];
  entityTypes: string[];
  createdAt: string;
  createdBy: string;
}

/**
 * Migration execution status
 */
export enum MigrationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back'
}

/**
 * Migration execution result
 */
export interface MigrationResult {
  planId: string;
  status: MigrationStatus;
  startedAt: string;
  completedAt?: string;
  processedEntities: number;
  failedEntities: number;
  errorMessages: string[];
}

/**
 * Migration log entry
 */
export interface MigrationLogEntry {
  id: string;
  planId: string;
  timestamp: string;
  operation: MigrationOperation;
  entityId?: string;
  entityType?: string;
  message: string;
  success: boolean;
  error?: string;
}

/**
 * Data migration manager
 */
export class DataMigrationManager {
  private activeMigration: MigrationResult | null = null;
  private migrationLog: MigrationLogEntry[] = [];
  
  /**
   * Create a new migration plan
   */
  createMigrationPlan(
    name: string,
    description: string,
    version: string,
    previousVersion: string,
    operations: MigrationOperation[],
    entityTypes: string[]
  ): MigrationPlan {
    return {
      id: uuidv4(),
      name,
      description,
      version,
      previousVersion,
      operations,
      entityTypes,
      createdAt: new Date().toISOString(),
      createdBy: 'system'
    };
  }
  
  /**
   * Execute a migration plan
   */
  async executeMigration(plan: MigrationPlan): Promise<MigrationResult> {
    // Check if another migration is in progress
    if (this.activeMigration && this.activeMigration.status === MigrationStatus.IN_PROGRESS) {
      throw new Error('Another migration is already in progress');
    }
    
    // Create migration result
    const result: MigrationResult = {
      planId: plan.id,
      status: MigrationStatus.IN_PROGRESS,
      startedAt: new Date().toISOString(),
      processedEntities: 0,
      failedEntities: 0,
      errorMessages: []
    };
    
    this.activeMigration = result;
    
    try {
      // Emit migration start event
      enhancedEventEmitter.emit('migration:start', {
        planId: plan.id,
        version: plan.version,
        previousVersion: plan.previousVersion
      });
      
      // Fetch entities by type
      const entities: BaseEntity[] = [];
      
      for (const entityType of plan.entityTypes) {
        const result = await intelDataStore.queryEntities<BaseEntity>({
          types: [entityType]
        });
        
        if (result.success && result.data) {
          entities.push(...result.data);
        }
      }
      
      // Begin transaction
      const transaction = storageOrchestrator.beginTransaction();
      const backups: Record<string, BaseEntity> = {};
      
      // Process each entity
      for (const entity of entities) {
        try {
          // Backup entity
          backups[entity.id] = { ...entity };
          
          // Apply each operation
          for (const operation of plan.operations) {
            // Skip if operation doesn't apply to this entity type
            if (operation.entityTypes && !operation.entityTypes.includes(entity.type)) {
              continue;
            }
            
            // Apply the operation
            const updatedEntity = this.applyOperation(entity, operation);
            
            // Log the operation
            this.logMigration({
              id: uuidv4(),
              planId: plan.id,
              timestamp: new Date().toISOString(),
              operation,
              entityId: entity.id,
              entityType: entity.type,
              message: `Applied ${operation.type} operation`,
              success: true
            });
            
            // Update entity reference
            Object.assign(entity, updatedEntity);
          }
          
          // Add update operation to transaction
          transaction.addOperation(
            // Update operation
            async () => {
              const updateResult = await intelDataStore.updateEntity(entity.id, entity);
              if (!updateResult.success) {
                throw new Error(`Failed to update entity ${entity.id}: ${updateResult.error}`);
              }
              
              // Also update in persistent storage
              await indexedDBAdapter.storeEntity(entity);
            },
            // Rollback operation
            async () => {
              const backup = backups[entity.id];
              if (backup) {
                await intelDataStore.updateEntity(entity.id, backup);
                await indexedDBAdapter.storeEntity(backup);
              }
            }
          );
          
          result.processedEntities++;
        } catch (error) {
          result.failedEntities++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.errorMessages.push(`Error processing entity ${entity.id}: ${errorMessage}`);
          
          // Log the error
          this.logMigration({
            id: uuidv4(),
            planId: plan.id,
            timestamp: new Date().toISOString(),
            operation: plan.operations[0], // Use first operation as placeholder
            entityId: entity.id,
            entityType: entity.type,
            message: `Failed to process entity`,
            success: false,
            error: errorMessage
          });
        }
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Update migration result
      result.status = MigrationStatus.COMPLETED;
      result.completedAt = new Date().toISOString();
      
      // Emit migration complete event
      enhancedEventEmitter.emit('migration:complete', {
        planId: plan.id,
        version: plan.version,
        processedEntities: result.processedEntities,
        failedEntities: result.failedEntities
      });
      
      return result;
    } catch (error) {
      // Update migration result
      result.status = MigrationStatus.FAILED;
      result.completedAt = new Date().toISOString();
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errorMessages.push(`Migration failed: ${errorMessage}`);
      
      // Emit migration failed event
      enhancedEventEmitter.emit('migration:failed', {
        planId: plan.id,
        version: plan.version,
        error: errorMessage
      });
      
      return result;
    } finally {
      this.activeMigration = null;
    }
  }
  
  /**
   * Apply a migration operation to an entity
   */
  private applyOperation(entity: BaseEntity, operation: MigrationOperation): BaseEntity {
    const updatedEntity = { ...entity };
    
    switch (operation.type) {
      case MigrationOpType.ADD_FIELD:
        if (operation.targetField && operation.defaultValue !== undefined) {
          (updatedEntity as any)[operation.targetField] = operation.defaultValue;
        }
        break;
        
      case MigrationOpType.RENAME_FIELD:
        if (operation.sourceField && operation.targetField) {
          if ((updatedEntity as any)[operation.sourceField] !== undefined) {
            (updatedEntity as any)[operation.targetField] = (updatedEntity as any)[operation.sourceField];
            delete (updatedEntity as any)[operation.sourceField];
          }
        }
        break;
        
      case MigrationOpType.REMOVE_FIELD:
        if (operation.sourceField) {
          delete (updatedEntity as any)[operation.sourceField];
        }
        break;
        
      case MigrationOpType.TRANSFORM_FIELD:
        if (operation.sourceField && operation.transformFn) {
          if ((updatedEntity as any)[operation.sourceField] !== undefined) {
            const value = (updatedEntity as any)[operation.sourceField];
            (updatedEntity as any)[operation.sourceField] = operation.transformFn(value, entity);
          }
        }
        break;
        
      case MigrationOpType.SPLIT_FIELD:
        if (operation.sourceField && operation.transformFn) {
          if ((updatedEntity as any)[operation.sourceField] !== undefined) {
            const result = operation.transformFn((updatedEntity as any)[operation.sourceField], entity);
            Object.assign(updatedEntity, result);
          }
        }
        break;
        
      case MigrationOpType.MERGE_FIELDS:
        if (operation.targetField && operation.transformFn) {
          const result = operation.transformFn(entity, entity);
          if (result !== undefined) {
            (updatedEntity as any)[operation.targetField] = result;
          }
        }
        break;
        
      case MigrationOpType.TYPE_CONVERSION:
        if (operation.sourceField && operation.transformFn) {
          if ((updatedEntity as any)[operation.sourceField] !== undefined) {
            (updatedEntity as any)[operation.sourceField] = 
              operation.transformFn((updatedEntity as any)[operation.sourceField], entity);
          }
        }
        break;
        
      case MigrationOpType.ENTITY_TYPE_CHANGE:
        if (operation.targetField) {
          updatedEntity.type = operation.targetField;
        }
        break;
    }
    
    // Always update the updatedAt field
    updatedEntity.updatedAt = new Date().toISOString();
    
    return updatedEntity;
  }
  
  /**
   * Log a migration operation
   */
  private logMigration(entry: MigrationLogEntry): void {
    this.migrationLog.push(entry);
    
    // Emit log event
    enhancedEventEmitter.emit('migration:log', entry);
  }
  
  /**
   * Get migration log entries
   */
  getMigrationLog(planId?: string): MigrationLogEntry[] {
    if (planId) {
      return this.migrationLog.filter(entry => entry.planId === planId);
    }
    return [...this.migrationLog];
  }
  
  /**
   * Clear migration logs
   */
  clearMigrationLog(): void {
    this.migrationLog = [];
  }
}

// Export a singleton instance
export const dataMigrationManager = new DataMigrationManager();

/**
 * Migration builder helper for creating migration plans
 */
export class MigrationBuilder {
  private operations: MigrationOperation[] = [];
  private entityTypeList: string[] = [];
  
  /**
   * Set entity types for operations
   */
  forEntityTypes(...types: string[]): MigrationBuilder {
    this.entityTypeList = types;
    return this;
  }
  
  /**
   * Add a new field to entities
   */
  addField(fieldName: string, defaultValue: any): MigrationBuilder {
    this.operations.push({
      type: MigrationOpType.ADD_FIELD,
      entityTypes: [...this.entityTypeList],
      targetField: fieldName,
      defaultValue
    });
    return this;
  }
  
  /**
   * Rename a field
   */
  renameField(oldName: string, newName: string): MigrationBuilder {
    this.operations.push({
      type: MigrationOpType.RENAME_FIELD,
      entityTypes: [...this.entityTypeList],
      sourceField: oldName,
      targetField: newName
    });
    return this;
  }
  
  /**
   * Remove a field
   */
  removeField(fieldName: string): MigrationBuilder {
    this.operations.push({
      type: MigrationOpType.REMOVE_FIELD,
      entityTypes: [...this.entityTypeList],
      sourceField: fieldName
    });
    return this;
  }
  
  /**
   * Transform a field value
   */
  transformField(fieldName: string, transformFn: (value: any, entity: BaseEntity) => any): MigrationBuilder {
    this.operations.push({
      type: MigrationOpType.TRANSFORM_FIELD,
      entityTypes: [...this.entityTypeList],
      sourceField: fieldName,
      transformFn
    });
    return this;
  }
  
  /**
   * Split a field into multiple fields
   */
  splitField(fieldName: string, transformFn: (value: any, entity: BaseEntity) => Record<string, any>): MigrationBuilder {
    this.operations.push({
      type: MigrationOpType.SPLIT_FIELD,
      entityTypes: [...this.entityTypeList],
      sourceField: fieldName,
      transformFn
    });
    return this;
  }
  
  /**
   * Merge multiple fields into one
   */
  mergeFields(targetField: string, transformFn: (entity: BaseEntity, originalEntity: BaseEntity) => any): MigrationBuilder {
    this.operations.push({
      type: MigrationOpType.MERGE_FIELDS,
      entityTypes: [...this.entityTypeList],
      targetField,
      transformFn
    });
    return this;
  }
  
  /**
   * Convert a field's type
   */
  convertType(fieldName: string, transformFn: (value: any, entity: BaseEntity) => any): MigrationBuilder {
    this.operations.push({
      type: MigrationOpType.TYPE_CONVERSION,
      entityTypes: [...this.entityTypeList],
      sourceField: fieldName,
      transformFn
    });
    return this;
  }
  
  /**
   * Change entity type
   */
  changeEntityType(newType: string): MigrationBuilder {
    this.operations.push({
      type: MigrationOpType.ENTITY_TYPE_CHANGE,
      entityTypes: [...this.entityTypeList],
      targetField: newType
    });
    return this;
  }
  
  /**
   * Build the migration plan
   */
  build(
    name: string,
    description: string,
    version: string,
    previousVersion: string
  ): MigrationPlan {
    // Collect all entity types from operations
    const entityTypes = new Set<string>();
    this.operations.forEach(op => {
      if (op.entityTypes) {
        op.entityTypes.forEach(type => entityTypes.add(type));
      }
    });
    
    return dataMigrationManager.createMigrationPlan(
      name,
      description,
      version,
      previousVersion,
      [...this.operations],
      Array.from(entityTypes)
    );
  }
}
