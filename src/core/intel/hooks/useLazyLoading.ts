/**
 * useLazyLoading - A React hook for lazy loading entity fields
 * 
 * This hook provides a React-idiomatic approach to lazy loading entity fields.
 * It replaces the lazy loading functionality from the PerformanceOptimizationManager
 * with a React-specific implementation that integrates with the component lifecycle.
 */

import { useState, useEffect, useCallback } from 'react';
import { BaseEntity } from '../types/intelDataModels';

// Types for lazy loading configuration
interface LazyLoadConfig {
  priorityFields?: string[];     // Fields to load immediately
  secondaryFields?: string[];    // Fields to load in second batch
  deferredFields?: string[];     // Fields to load last
  batchSize?: number;            // Number of fields to load at once
  delayBetweenBatches?: number;  // Milliseconds between batches
  maxConcurrentLoads?: number;   // Maximum concurrent loading operations
}

// Type for the load function
type LoadFieldsFunction = (
  entityId: string,
  fields: string[]
) => Promise<Partial<BaseEntity>>;

// Type for the hook result
interface LazyLoadResult<T extends BaseEntity> {
  entity: T;                      // The entity with loaded fields
  isLoading: boolean;             // Whether any fields are still loading
  loadedFields: string[];         // List of fields that have been loaded
  pendingFields: string[];        // List of fields that are still pending
  progress: number;               // Loading progress from 0 to 1
  error: Error | null;            // Any error that occurred during loading
  loadField: (field: string) => Promise<void>; // Function to manually load a specific field
}

/**
 * React hook for lazy loading entity fields
 * 
 * @param initialEntity - The entity with basic fields already loaded
 * @param loadFieldsFn - Function to load additional fields
 * @param config - Configuration for lazy loading
 * @returns The entity with loaded fields and loading state
 */
export function useLazyLoading<T extends BaseEntity>(
  initialEntity: T,
  loadFieldsFn: LoadFieldsFunction,
  config: LazyLoadConfig = {}
): LazyLoadResult<T> {
  // Default configuration
  const {
    priorityFields = ['id', 'type', 'name', 'title', 'createdAt'],
    secondaryFields = ['description', 'metadata', 'tags'],
    deferredFields = ['fullContent', 'comments', 'attachments', 'history'],
    batchSize = 5,
    delayBetweenBatches = 200,
    maxConcurrentLoads = 2
  } = config;
  
  // State for the entity and loading status
  const [entity, setEntity] = useState<T>(initialEntity);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedFields, setLoadedFields] = useState<string[]>([]);
  const [pendingFields, setPendingFields] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [activeLoads, setActiveLoads] = useState(0);
  
  // Calculate fields that need to be loaded
  const calculateFieldsToLoad = useCallback(() => {
    // Get all requested fields
    const allRequestedFields = [
      ...priorityFields,
      ...secondaryFields,
      ...deferredFields
    ];
    
    // Filter out fields that are already in the entity or loaded
    const fieldsToLoad = allRequestedFields.filter(field => {
      // Skip if field is already loaded
      if (loadedFields.includes(field)) return false;
      
      // Skip if field is already in the entity
      return !(field in initialEntity);
    });
    
    return fieldsToLoad;
  }, [deferredFields, initialEntity, loadedFields, priorityFields, secondaryFields]);
  
  // Function to load a batch of fields
  const loadFieldBatch = useCallback(async (fields: string[]) => {
    if (fields.length === 0 || !initialEntity.id) return;
    
    try {
      // Increment active loads counter
      setActiveLoads(prev => prev + 1);
      
      // Load the fields
      const partialEntity = await loadFieldsFn(initialEntity.id, fields);
      
      // Update the entity with new fields
      setEntity(prevEntity => ({
        ...prevEntity,
        ...partialEntity
      }));
      
      // Update loaded fields
      setLoadedFields(prev => [...prev, ...fields]);
      
      // Remove from pending fields
      setPendingFields(prev => prev.filter(field => !fields.includes(field)));
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      // Decrement active loads counter
      setActiveLoads(prev => prev - 1);
    }
  }, [initialEntity.id, loadFieldsFn]);
  
  // Function to manually load a specific field
  const loadField = useCallback(async (field: string) => {
    // Skip if already loaded or loading
    if (loadedFields.includes(field) || pendingFields.includes(field)) {
      return;
    }
    
    // Add to pending fields
    setPendingFields(prev => [...prev, field]);
    
    // Load the field
    await loadFieldBatch([field]);
  }, [loadFieldBatch, loadedFields, pendingFields]);
  
  // Initial setup for lazy loading
  useEffect(() => {
    const fieldsToLoad = calculateFieldsToLoad();
    
    if (fieldsToLoad.length === 0) {
      return; // Nothing to load
    }
    
    // Mark all fields as pending
    setPendingFields(fieldsToLoad);
    
    // Set loading state
    setIsLoading(true);
    
    // Schedule loading for different priority levels
    const loadPriorityFields = async () => {
      // Get priority fields that need loading
      const priorityToLoad = fieldsToLoad.filter(field => 
        priorityFields.includes(field)
      );
      
      // Load priority fields immediately
      if (priorityToLoad.length > 0) {
        // Split into batches
        for (let i = 0; i < priorityToLoad.length; i += batchSize) {
          const batch = priorityToLoad.slice(i, i + batchSize);
          await loadFieldBatch(batch);
        }
      }
    };
    
    const loadSecondaryFields = async () => {
      // Get secondary fields that need loading
      const secondaryToLoad = fieldsToLoad.filter(field => 
        secondaryFields.includes(field)
      );
      
      // Load secondary fields after a delay
      if (secondaryToLoad.length > 0) {
        // Split into batches
        for (let i = 0; i < secondaryToLoad.length; i += batchSize) {
          const batch = secondaryToLoad.slice(i, i + batchSize);
          await loadFieldBatch(batch);
          
          // Add delay between batches
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }
    };
    
    const loadDeferredFields = async () => {
      // Get deferred fields that need loading
      const deferredToLoad = fieldsToLoad.filter(field => 
        deferredFields.includes(field)
      );
      
      // Load deferred fields last
      if (deferredToLoad.length > 0) {
        // Split into batches
        for (let i = 0; i < deferredToLoad.length; i += batchSize) {
          const batch = deferredToLoad.slice(i, i + batchSize);
          await loadFieldBatch(batch);
          
          // Add delay between batches
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }
    };
    
    // Start loading in order of priority
    const loadAll = async () => {
      try {
        await loadPriorityFields();
        await loadSecondaryFields();
        await loadDeferredFields();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAll();
    
    // Clean up if component unmounts during loading
    return () => {
      // Cannot cancel promises, but we can mark as not loading
      setIsLoading(false);
    };
  }, [
    calculateFieldsToLoad, 
    loadFieldBatch, 
    priorityFields, 
    secondaryFields, 
    deferredFields,
    batchSize,
    delayBetweenBatches
  ]);
  
  // Calculate progress
  const progress = loadedFields.length === 0 && pendingFields.length === 0
    ? 1 // Nothing to load
    : loadedFields.length / (loadedFields.length + pendingFields.length);
  
  return {
    entity,
    isLoading,
    loadedFields,
    pendingFields,
    progress,
    error,
    loadField
  };
}

/**
 * Example usage:
 * 
 * function EntityViewer({ entityId }) {
 *   const [basicEntity, setBasicEntity] = useState(null);
 *   
 *   // First load the basic entity
 *   useEffect(() => {
 *     async function loadBasicEntity() {
 *       const entity = await storageOrchestrator.getEntityById(entityId);
 *       setBasicEntity(entity);
 *     }
 *     loadBasicEntity();
 *   }, [entityId]);
 *   
 *   // Then use lazy loading for additional fields
 *   const { entity, isLoading, progress } = useLazyLoading(
 *     basicEntity,
 *     (id, fields) => storageOrchestrator.loadEntityFields(id, fields),
 *     {
 *       priorityFields: ['title', 'summary'],
 *       secondaryFields: ['description', 'tags'],
 *       deferredFields: ['fullContent']
 *     }
 *   );
 *   
 *   if (!basicEntity) return <div>Loading...</div>;
 *   
 *   return (
 *     <div>
 *       <h1>{entity.title}</h1>
 *       <p>{entity.summary}</p>
 *       
 *       {isLoading && <ProgressBar value={progress} />}
 *       
 *       {entity.description && <p>{entity.description}</p>}
 *       
 *       {entity.fullContent && <div>{entity.fullContent}</div>}
 *     </div>
 *   );
 * }
 */
