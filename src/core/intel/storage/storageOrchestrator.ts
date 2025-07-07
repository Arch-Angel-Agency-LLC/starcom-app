/**
 * StorageOrchestrator - Coordinating in-memory and persistent storage
 * 
 * This orchestrator manages the interaction between in-memory storage and
 * persistent storage, handling transactions, caching, and synchronization.
 */

import { 
  BaseEntity, 
  Relationship,
  StorageResult,
  PersistenceOptions,
  IntelQueryOptions
} from '../types/intelDataModels';
import { intelDataStore } from '../store/intelDataStore';
import { indexedDBAdapter } from './indexedDBAdapter';
import { cacheManager } from './cacheManager';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';
import { FullTextSearchOptions, SearchResult, fullTextSearchManager } from './fullTextSearchManager';
import { operationTracker, QueryOptimizationSuggestion } from '../performance/operationTracker';
// @deprecated - Using operationTracker instead
// import { performanceOptimizationManager, QueryOptimizationSuggestion } from './performanceOptimizationManager';

/**
 * Storage strategy for determining persistence behavior
 */
export interface StorageStrategy {
  shouldPersist: boolean;
  storageMethod: 'indexeddb' | 'local' | 'blockchain' | 'ipfs';
  options?: PersistenceOptions;
}

/**
 * Default storage strategy
 */
const DEFAULT_STRATEGY: StorageStrategy = {
  shouldPersist: true,
  storageMethod: 'indexeddb'
};

/**
 * Transaction status enum
 */
export enum TransactionStatus {
  PENDING = 'pending',
  COMMITTED = 'committed',
  ROLLED_BACK = 'rolled_back'
}

/**
 * Simple transaction context
 */
export class Transaction {
  private status: TransactionStatus = TransactionStatus.PENDING;
  private operations: Array<() => Promise<void>> = [];
  private rollbacks: Array<() => Promise<void>> = [];
  
  /**
   * Add operation to transaction
   */
  addOperation(
    operation: () => Promise<void>,
    rollback: () => Promise<void>
  ): void {
    if (this.status !== TransactionStatus.PENDING) {
      throw new Error('Cannot add operation to non-pending transaction');
    }
    
    this.operations.push(operation);
    this.rollbacks.push(rollback);
  }
  
  /**
   * Commit the transaction
   */
  async commit(): Promise<void> {
    if (this.status !== TransactionStatus.PENDING) {
      throw new Error('Cannot commit non-pending transaction');
    }
    
    try {
      // Execute all operations
      for (const operation of this.operations) {
        await operation();
      }
      
      this.status = TransactionStatus.COMMITTED;
    } catch (error) {
      // Auto-rollback on error
      await this.rollback();
      throw error;
    }
  }
  
  /**
   * Rollback the transaction
   */
  async rollback(): Promise<void> {
    if (this.status !== TransactionStatus.PENDING) {
      throw new Error('Cannot rollback non-pending transaction');
    }
    
    // Execute all rollbacks in reverse order
    for (let i = this.rollbacks.length - 1; i >= 0; i--) {
      try {
        await this.rollbacks[i]();
      } catch (error) {
        console.error('Error during rollback:', error);
      }
    }
    
    this.status = TransactionStatus.ROLLED_BACK;
  }
  
  /**
   * Get transaction status
   */
  getStatus(): TransactionStatus {
    return this.status;
  }
}

/**
 * StorageOrchestrator implementation
 */
export class StorageOrchestrator {
  private initialized = false;
  private pendingTransactions: Map<string, Transaction> = new Map();
  
  /**
   * Constructor
   */
  constructor() {}
  
  /**
   * Initialize the storage system
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }
    
    try {
      // Initialize IndexedDB adapter
      const dbInitialized = await indexedDBAdapter.initialize();
      if (!dbInitialized) {
        console.error('Failed to initialize IndexedDB');
        return false;
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing storage:', error);
      return false;
    }
  }
  
  /**
   * Create a new transaction
   */
  createTransaction(): Transaction {
    return new Transaction();
  }
  
  /**
   * Begin a new transaction
   */
  beginTransaction(): Transaction {
    return new Transaction();
  }
  
  /**
   * Determine storage strategy for an entity
   */
  private determineStorageStrategy(entity: BaseEntity, options?: PersistenceOptions): StorageStrategy {
    // Here we can implement more complex logic to determine
    // the best storage strategy based on entity type, size, etc.
    
    // For now, just use default strategy or user-provided options
    if (options?.persistenceMode === 'none') {
      return {
        ...DEFAULT_STRATEGY,
        shouldPersist: false
      };
    }
    
    if (options?.persistenceMode === 'blockchain') {
      return {
        shouldPersist: true,
        storageMethod: 'blockchain',
        options
      };
    }
    
    return DEFAULT_STRATEGY;
  }
  
  /**
   * Store an entity
   */
  async storeEntity<T extends BaseEntity>(
    entity: Partial<T>, 
    options?: PersistenceOptions
  ): Promise<StorageResult<T>> {
    await this.initialize();
    
    try {
      // Start a transaction
      const transaction = this.beginTransaction();
      
      // Prepare result container
      let result: StorageResult<T>;
      
      // Add storage operations to transaction
      transaction.addOperation(
        // Store operation
        async () => {
          // Store in memory first
          const inMemoryResult = await intelDataStore.createEntity<T>(entity);
          if (!inMemoryResult.success) {
            throw new Error(`In-memory storage failed: ${inMemoryResult.error}`);
          }
          
          result = inMemoryResult;
          const savedEntity = inMemoryResult.data!;
          
          // Cache the entity
          cacheManager.cacheEntity(savedEntity);
          
          // Determine storage strategy
          const strategy = this.determineStorageStrategy(savedEntity, options);
          
          // Then persist if needed
          if (strategy.shouldPersist) {
            switch (strategy.storageMethod) {
              case 'indexeddb':
                const dbResult = await indexedDBAdapter.storeEntity(savedEntity);
                if (!dbResult.success) {
                  throw new Error(`IndexedDB storage failed: ${dbResult.error}`);
                }
                break;
              // Add other storage methods as needed
              default:
                throw new Error(`Unsupported storage method: ${strategy.storageMethod}`);
            }
          }
          
          // Emit entity:created event
          enhancedEventEmitter.emit('entity:created', {
            entityId: savedEntity.id,
            entityType: savedEntity.type,
            entity: savedEntity
          });
        },
        // Rollback operation
        async () => {
          // If we have created an entity, delete it
          if (result && result.data && result.data.id) {
            await intelDataStore.deleteEntity(result.data.id);
            
            // Remove from cache
            cacheManager.delete(`entity:${result.data.id}`);
            
            const strategy = this.determineStorageStrategy(result.data, options);
            if (strategy.shouldPersist) {
              switch (strategy.storageMethod) {
                case 'indexeddb':
                  await indexedDBAdapter.deleteEntity(result.data.id);
                  break;
                // Add other storage methods as needed
              }
            }
          }
        }
      );
      
      // Execute the transaction
      await transaction.commit();
      
      // Return the result
      return result!;
    } catch (error) {
      console.error('Error storing entity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error storing entity',
      };
    }
  }
  
  /**
   * Get an entity by ID with performance tracking
   */
  async getEntity<T extends BaseEntity>(id: string): Promise<StorageResult<T>> {
    await this.initialize();
    
    // Start performance tracking
    const operationId = operationTracker.startOperation('getEntity');
    
    // Track entity access for optimization
    operationTracker.trackEntityAccess(id);
    
    // Try cache first
    const cachedEntity = cacheManager.getEntity<T>(id);
    if (cachedEntity) {
      // End performance tracking with cache hit
      operationTracker.endOperation(operationId, {
        cacheHit: true,
        dataSize: JSON.stringify(cachedEntity).length
      });
      
      return { success: true, data: cachedEntity };
    }
    
    // Try memory next
    const memoryResult = await intelDataStore.getEntity<T>(id);
    if (memoryResult.success) {
      // Cache the result
      cacheManager.cacheEntity(memoryResult.data!);
      
      // End performance tracking
      operationTracker.endOperation(operationId, {
        cacheHit: false,
        dataSize: JSON.stringify(memoryResult.data!).length
      });
      
      return memoryResult;
    }
    
    // If not in memory, try persistent storage
    const persistentResult = await indexedDBAdapter.getEntity<T>(id);
    if (persistentResult.success) {
      // Store in memory for future access
      await intelDataStore.createEntity(persistentResult.data!);
      // Cache the result
      cacheManager.cacheEntity(persistentResult.data!);
      
      // End performance tracking
      operationTracker.endOperation(operationId, {
        cacheHit: false,
        dataSize: JSON.stringify(persistentResult.data!).length
      });
      
      return persistentResult;
    }
    
    // End performance tracking for failed retrieval
    operationTracker.endOperation(operationId, {
      cacheHit: false,
      dataSize: 0
    });
    
    return { success: false, error: `Entity with ID ${id} not found` };
  }
  
  /**
   * Update an entity
   */
  async updateEntity<T extends BaseEntity>(
    id: string, 
    updates: Partial<T>, 
    options?: PersistenceOptions
  ): Promise<StorageResult<T>> {
    await this.initialize();
    
    // Create a transaction
    const transaction = this.createTransaction();
    
    try {
      // Get the original entity for backup in case of rollback
      const originalEntity = await this.getEntity<T>(id);
      if (!originalEntity.success) {
        return { success: false, error: `Entity with ID ${id} not found` };
      }
      
      // Update in memory
      const memoryResult = await intelDataStore.updateEntity<T>(id, updates);
      if (!memoryResult.success) {
        throw new Error(memoryResult.error || 'Failed to update entity in memory');
      }
      
      const updatedEntity = memoryResult.data!;
      
      // Determine storage strategy
      const strategy = this.determineStorageStrategy(updatedEntity, options);
      
      // Update in persistent storage if needed
      if (strategy.shouldPersist) {
        // Add to transaction
        transaction.addOperation(
          // Store operation
          async () => {
            const persistResult = await indexedDBAdapter.storeEntity(updatedEntity, options);
            if (!persistResult.success) {
              throw new Error(persistResult.error || 'Failed to update entity in persistent storage');
            }
          },
          // Rollback operation
          async () => {
            // Restore original entity
            if (originalEntity.success && originalEntity.data) {
              await intelDataStore.updateEntity(id, originalEntity.data);
              if (strategy.shouldPersist) {
                await indexedDBAdapter.storeEntity(originalEntity.data);
              }
            }
          }
        );
      }
      
      // Update in cache
      transaction.addOperation(
        // Cache operation
        async () => {
          cacheManager.cacheEntity(updatedEntity);
        },
        // Rollback operation
        async () => {
          if (originalEntity.success && originalEntity.data) {
            cacheManager.cacheEntity(originalEntity.data);
          }
        }
      );
      
      // Commit the transaction
      await transaction.commit();
      
      // Emit entity:updated event
      enhancedEventEmitter.emit('entity:updated', {
        entityId: updatedEntity.id,
        entityType: updatedEntity.type,
        entity: updatedEntity,
        changes: updates
      });
      
      return { success: true, data: updatedEntity };
    } catch (error) {
      // Transaction will auto-rollback on error
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error updating entity' 
      };
    }
  }
  
  /**
   * Delete an entity
   */
  async deleteEntity(id: string): Promise<StorageResult<void>> {
    await this.initialize();
    
    // Create a transaction
    const transaction = this.createTransaction();
    
    try {
      // Get the entity first to see if it exists and for potential rollback
      const getResult = await this.getEntity(id);
      if (!getResult.success) {
        return { success: false, error: `Entity with ID ${id} not found` };
      }
      
      const originalEntity = getResult.data!;
      
      // Determine storage strategy
      const strategy = this.determineStorageStrategy(originalEntity, {});
      
      // Delete from persistent storage first if needed
      if (strategy.shouldPersist) {
        // Add to transaction
        transaction.addOperation(
          // Delete operation
          async () => {
            const persistResult = await indexedDBAdapter.deleteEntity(id);
            if (!persistResult.success) {
              throw new Error(persistResult.error || 'Failed to delete entity from persistent storage');
            }
          },
          // Rollback operation
          async () => {
            // Restore entity in persistent storage
            await indexedDBAdapter.storeEntity(originalEntity);
          }
        );
      }
      
      // Delete from memory
      transaction.addOperation(
        // Delete operation
        async () => {
          const memoryResult = await intelDataStore.deleteEntity(id);
          if (!memoryResult.success) {
            throw new Error(memoryResult.error || 'Failed to delete entity from memory');
          }
        },
        // Rollback operation
        async () => {
          // Restore entity in memory
          await intelDataStore.createEntity(originalEntity);
        }
      );
      
      // Delete from cache
      transaction.addOperation(
        // Delete operation
        async () => {
          cacheManager.delete(`entity:${id}`);
          cacheManager.delete(`entity:${originalEntity.type}:${id}`);
        },
        // Rollback operation
        async () => {
          // Restore entity in cache
          cacheManager.cacheEntity(originalEntity);
        }
      );
      
      // Commit the transaction
      await transaction.commit();
      
      // Emit entity:deleted event
      enhancedEventEmitter.emit('entity:deleted', {
        entityId: id,
        entityType: originalEntity.type,
        entity: originalEntity
      });
      
      return { success: true };
    } catch (error) {
      // Transaction will auto-rollback on error
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error deleting entity' 
      };
    }
  }
  
  /**
   * Create a relationship
   */
  async createRelationship(
    relationship: Partial<Relationship>, 
    options?: PersistenceOptions
  ): Promise<StorageResult<Relationship>> {
    await this.initialize();
    
    // Create a transaction
    const transaction = this.createTransaction();
    
    try {
      // Store in memory first
      const memoryResult = await intelDataStore.createRelationship(relationship);
      if (!memoryResult.success) {
        throw new Error(memoryResult.error || 'Failed to create relationship in memory');
      }
      
      const savedRelationship = memoryResult.data!;
      
      // Determine storage strategy
      const strategy = this.determineStorageStrategy(savedRelationship, options);
      
      // Store in persistent storage if needed
      if (strategy.shouldPersist) {
        // Add to transaction
        transaction.addOperation(
          // Store operation
          async () => {
            const persistResult = await indexedDBAdapter.storeRelationship(savedRelationship, options);
            if (!persistResult.success) {
              throw new Error(persistResult.error || 'Failed to store relationship in persistent storage');
            }
          },
          // Rollback operation
          async () => {
            // Nothing to do here as IndexedDB transaction will auto-rollback
          }
        );
      }
      
      // Commit the transaction
      await transaction.commit();
      
      return { success: true, data: savedRelationship };
    } catch (error) {
      // Transaction will auto-rollback on error
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
    await this.initialize();
    
    // Try memory first
    const memoryResult = await intelDataStore.getRelationships(entityId);
    if (memoryResult.success && memoryResult.data!.length > 0) {
      return memoryResult;
    }
    
    // If not in memory, try persistent storage
    const persistentResult = await indexedDBAdapter.getRelationships(entityId);
    if (persistentResult.success && persistentResult.data!.length > 0) {
      // Store relationships in memory for future access
      for (const relationship of persistentResult.data!) {
        await intelDataStore.createRelationship(relationship);
      }
      return persistentResult;
    }
    
    // If no relationships found in either storage, return empty array
    return { success: true, data: [] };
  }
  
  /**
   * Query entities with filtering and performance optimization
   */
  async queryEntities<T extends BaseEntity>(
    options: IntelQueryOptions = {}
  ): Promise<StorageResult<T[]>> {
    await this.initialize();
    
    // Start performance tracking
    const operationId = operationTracker.startOperation('query');
    
    // Check for query optimization opportunities
    const optimizationSuggestion = operationTracker.optimizeQuery(options);
    
    // Use optimized query if available and it offers significant improvement
    const queryOptions = (optimizationSuggestion && optimizationSuggestion.expectedImprovement > 0.2)
      ? optimizationSuggestion.suggestedQuery
      : options;
    
    // Check if we're forcing a refresh or cache bypass
    const skipCache = queryOptions.forceRefresh === true;
    
    // Try cache first, unless we're forced to refresh
    let cacheHit = false;
    if (!skipCache) {
      const cachedResult = cacheManager.getQueryResult<T>(queryOptions);
      if (cachedResult) {
        cacheHit = true;
        
        // End performance tracking
        operationTracker.endOperation(operationId, {
          entityCount: cachedResult.length,
          queryComplexity: this.calculateQueryComplexity(queryOptions),
          cacheHit: true,
          dataSize: this.estimateDataSize(cachedResult)
        });
        
        return { success: true, data: cachedResult };
      }
    }
    
    // Start with in-memory query for best performance
    const memoryResult = await intelDataStore.queryEntities<T>(queryOptions);
    
    // If this is a simple query and we have results, cache and return them
    if (memoryResult.success && memoryResult.data!.length > 0 && !skipCache) {
      // Cache the query result
      cacheManager.cacheQueryResult<T>(queryOptions, memoryResult.data!);
      
      // End performance tracking
      operationTracker.endOperation(operationId, {
        entityCount: memoryResult.data!.length,
        queryComplexity: this.calculateQueryComplexity(queryOptions),
        cacheHit: false,
        dataSize: this.estimateDataSize(memoryResult.data!)
      });
      
      return memoryResult;
    }
    
    // For more complex queries or when forced refresh is requested,
    // query the persistent storage
    const persistentResult = await indexedDBAdapter.queryEntities<T>(queryOptions);
    if (persistentResult.success) {
      // Store results in memory and cache for future access
      for (const entity of persistentResult.data!) {
        // Track entity access for optimization
        operationTracker.trackEntityAccess(entity.id);
        
        // Only store if not already in memory to avoid overwriting newer data
        const existing = await intelDataStore.getEntity(entity.id);
        if (!existing.success) {
          await intelDataStore.createEntity(entity);
        }
        
        // Cache individual entities
        cacheManager.cacheEntity(entity);
      }
      
      // Cache the entire query result
      cacheManager.cacheQueryResult<T>(queryOptions, persistentResult.data!);
      
      // End performance tracking
      operationTracker.endOperation(operationId, {
        entityCount: persistentResult.data!.length,
        queryComplexity: this.calculateQueryComplexity(queryOptions),
        cacheHit: false,
        dataSize: this.estimateDataSize(persistentResult.data!)
      });
      
      return persistentResult;
    }
    
    // If persistent query failed but memory query succeeded, return memory results
    if (memoryResult.success) {
      // End performance tracking
      operationTracker.endOperation(operationId, {
        entityCount: memoryResult.data!.length,
        queryComplexity: this.calculateQueryComplexity(queryOptions),
        cacheHit: false,
        dataSize: this.estimateDataSize(memoryResult.data!)
      });
      
      return memoryResult;
    }
    
    // Both queries failed
    // End performance tracking
    operationTracker.endOperation(operationId, {
      entityCount: 0,
      queryComplexity: this.calculateQueryComplexity(queryOptions),
      cacheHit: false,
      dataSize: 0
    });
    
    return { 
      success: false, 
      error: persistentResult.error || memoryResult.error || 'Unknown error querying entities' 
    };
  }
  
  /**
   * Calculate query complexity for performance metrics
   */
  private calculateQueryComplexity(options: IntelQueryOptions): number {
    let complexity = 1; // Base complexity
    
    // Add complexity based on filters
    if (options.types && options.types.length > 0) complexity += 0.5;
    if (options.tags && options.tags.length > 0) complexity += options.tags.length * 0.3;
    if (options.classification && options.classification.length > 0) complexity += 0.5;
    if (options.startDate) complexity += 0.5;
    if (options.endDate) complexity += 0.5;
    if (options.confidence) complexity += 1;
    if (options.sortBy) complexity += 1;
    
    // Higher complexity for large result sets
    if (options.limit && options.limit > 100) complexity += 1;
    if (options.offset && options.offset > 0) complexity += 0.5;
    
    return complexity;
  }
  
  /**
   * Estimate data size in bytes for performance metrics
   */
  private estimateDataSize(data: any[]): number {
    if (!data || data.length === 0) return 0;
    
    try {
      // Sample up to 10 items to get an average size
      const sampleSize = Math.min(10, data.length);
      let totalSize = 0;
      
      for (let i = 0; i < sampleSize; i++) {
        const jsonSize = JSON.stringify(data[i]).length;
        totalSize += jsonSize;
      }
      
      const averageSize = totalSize / sampleSize;
      return Math.round(averageSize * data.length);
    } catch (error) {
      console.warn('Error estimating data size:', error);
      return 0;
    }
  }
}

/**
 * Create and export a singleton instance
 */
export const storageOrchestrator = new StorageOrchestrator();
