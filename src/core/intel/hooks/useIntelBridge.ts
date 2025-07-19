/**
 * useIntelBridge Hook
 * 
 * React hook for bridging between Intel and IntelEntity systems
 * Provides seamless transformation and synchronization capabilities
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { IntelBridgeAdapter, EnhancedIntelEntity } from '../adapters/intelBridgeAdapter';
import { Intel, Intelligence } from '../../../models/Intel/Intel';
import { NodeEntity } from '../types/intelDataModels';

interface UseIntelBridgeOptions {
  autoTransform?: boolean; // Automatically transform Intel to IntelEntity
  confidenceThreshold?: number; // Minimum confidence for entities
  enableNodeGeneration?: boolean; // Generate NodeEntity objects for visualization
  trackLineage?: boolean; // Track data lineage and transformations
}

interface UseIntelBridgeResult {
  // Transformation functions
  transformIntelToEntity: (intel: Intel) => EnhancedIntelEntity;
  transformIntelligenceToEntity: (intelligence: Intelligence) => EnhancedIntelEntity;
  transformIntelligenceToNode: (intelligence: Intelligence) => NodeEntity;
  
  // Batch operations
  batchTransformIntel: (intelArray: Intel[]) => EnhancedIntelEntity[];
  batchTransformIntelligence: (intelligenceArray: Intelligence[]) => EnhancedIntelEntity[];
  batchGenerateNodes: (intelligenceArray: Intelligence[]) => NodeEntity[];
  
  // State management
  entities: EnhancedIntelEntity[];
  nodes: NodeEntity[];
  isTransforming: boolean;
  transformationErrors: Error[];
  
  // Actions
  addIntel: (intel: Intel) => void;
  addIntelligence: (intelligence: Intelligence) => void;
  clearAll: () => void;
  filterByConfidence: (minConfidence: number) => EnhancedIntelEntity[];
  
  // Statistics
  stats: {
    totalEntities: number;
    averageConfidence: number;
    reliabilityDistribution: Record<string, number>;
    transformationCount: number;
  };
}

/**
 * Main hook for Intel-IntelEntity bridge functionality
 */
export function useIntelBridge(options: UseIntelBridgeOptions = {}): UseIntelBridgeResult {
  const {
    autoTransform = true,
    confidenceThreshold = 0,
    enableNodeGeneration = false,
    trackLineage = true
  } = options;
  
  // State
  const [entities, setEntities] = useState<EnhancedIntelEntity[]>([]);
  const [nodes, setNodes] = useState<NodeEntity[]>([]);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformationErrors, setTransformationErrors] = useState<Error[]>([]);
  const [transformationCount, setTransformationCount] = useState(0);
  
  // Transformation functions
  const transformIntelToEntity = useCallback((intel: Intel): EnhancedIntelEntity => {
    try {
      setIsTransforming(true);
      const entity = IntelBridgeAdapter.transformIntelToEntity(intel);
      
      if (autoTransform) {
        setEntities(prev => [...prev, entity]);
        setTransformationCount(prev => prev + 1);
        
        // Update intel object with bridge metadata
        if (trackLineage) {
          intel.bridgeMetadata = {
            entityId: entity.id,
            processingStage: 'processed',
            transformedAt: Date.now(),
            transformedBy: 'intel-bridge-hook'
          };
        }
      }
      
      return entity;
    } catch (error) {
      setTransformationErrors(prev => [...prev, error as Error]);
      throw error;
    } finally {
      setIsTransforming(false);
    }
  }, [autoTransform, trackLineage]);
  
  const transformIntelligenceToEntity = useCallback((intelligence: Intelligence): EnhancedIntelEntity => {
    try {
      setIsTransforming(true);
      const entity = IntelBridgeAdapter.transformIntelligenceToEntity(intelligence);
      
      if (autoTransform) {
        setEntities(prev => [...prev, entity]);
        setTransformationCount(prev => prev + 1);
        
        // Update intelligence object with bridge metadata
        if (trackLineage) {
          intelligence.bridgeMetadata = {
            entityId: entity.id,
            processingStage: 'analyzed',
            transformedAt: Date.now(),
            transformedBy: 'intel-bridge-hook'
          };
        }
      }
      
      return entity;
    } catch (error) {
      setTransformationErrors(prev => [...prev, error as Error]);
      throw error;
    } finally {
      setIsTransforming(false);
    }
  }, [autoTransform, trackLineage]);
  
  const transformIntelligenceToNode = useCallback((intelligence: Intelligence): NodeEntity => {
    try {
      setIsTransforming(true);
      const node = IntelBridgeAdapter.transformIntelligenceToNodeEntity(intelligence);
      
      if (enableNodeGeneration && autoTransform) {
        setNodes(prev => [...prev, node]);
      }
      
      return node;
    } catch (error) {
      setTransformationErrors(prev => [...prev, error as Error]);
      throw error;
    } finally {
      setIsTransforming(false);
    }
  }, [enableNodeGeneration, autoTransform]);
  
  // Batch operations
  const batchTransformIntel = useCallback((intelArray: Intel[]): EnhancedIntelEntity[] => {
    try {
      setIsTransforming(true);
      const transformedEntities = intelArray.map(intel => {
        const entity = IntelBridgeAdapter.transformIntelToEntity(intel);
        
        // Update bridge metadata for tracking
        if (trackLineage) {
          intel.bridgeMetadata = {
            entityId: entity.id,
            processingStage: 'processed',
            transformedAt: Date.now(),
            transformedBy: 'intel-bridge-hook-batch'
          };
        }
        
        return entity;
      });
      
      if (autoTransform) {
        setEntities(prev => [...prev, ...transformedEntities]);
        setTransformationCount(prev => prev + transformedEntities.length);
      }
      
      return transformedEntities;
    } catch (error) {
      setTransformationErrors(prev => [...prev, error as Error]);
      throw error;
    } finally {
      setIsTransforming(false);
    }
  }, [autoTransform, trackLineage]);
  
  const batchTransformIntelligence = useCallback((intelligenceArray: Intelligence[]): EnhancedIntelEntity[] => {
    try {
      setIsTransforming(true);
      const transformedEntities = intelligenceArray.map(intelligence => {
        const entity = IntelBridgeAdapter.transformIntelligenceToEntity(intelligence);
        
        if (trackLineage) {
          intelligence.bridgeMetadata = {
            entityId: entity.id,
            processingStage: 'analyzed',
            transformedAt: Date.now(),
            transformedBy: 'intel-bridge-hook-batch'
          };
        }
        
        return entity;
      });
      
      if (autoTransform) {
        setEntities(prev => [...prev, ...transformedEntities]);
        setTransformationCount(prev => prev + transformedEntities.length);
      }
      
      return transformedEntities;
    } catch (error) {
      setTransformationErrors(prev => [...prev, error as Error]);
      throw error;
    } finally {
      setIsTransforming(false);
    }
  }, [autoTransform, trackLineage]);
  
  const batchGenerateNodes = useCallback((intelligenceArray: Intelligence[]): NodeEntity[] => {
    try {
      setIsTransforming(true);
      const nodes = intelligenceArray.map(intelligence => 
        IntelBridgeAdapter.transformIntelligenceToNodeEntity(intelligence)
      );
      
      if (enableNodeGeneration && autoTransform) {
        setNodes(prev => [...prev, ...nodes]);
      }
      
      return nodes;
    } catch (error) {
      setTransformationErrors(prev => [...prev, error as Error]);
      throw error;
    } finally {
      setIsTransforming(false);
    }
  }, [enableNodeGeneration, autoTransform]);
  
  // Actions
  const addIntel = useCallback((intel: Intel) => {
    transformIntelToEntity(intel);
  }, [transformIntelToEntity]);
  
  const addIntelligence = useCallback((intelligence: Intelligence) => {
    const entity = transformIntelligenceToEntity(intelligence);
    
    if (enableNodeGeneration) {
      transformIntelligenceToNode(intelligence);
    }
  }, [transformIntelligenceToEntity, transformIntelligenceToNode, enableNodeGeneration]);
  
  const clearAll = useCallback(() => {
    setEntities([]);
    setNodes([]);
    setTransformationErrors([]);
    setTransformationCount(0);
  }, []);
  
  const filterByConfidence = useCallback((minConfidence: number): EnhancedIntelEntity[] => {
    return entities.filter(entity => entity.confidence >= minConfidence);
  }, [entities]);
  
  // Statistics
  const stats = useMemo(() => {
    const totalEntities = entities.length;
    const averageConfidence = totalEntities > 0 
      ? entities.reduce((sum, entity) => sum + entity.confidence, 0) / totalEntities 
      : 0;
    
    const reliabilityDistribution = entities.reduce((acc, entity) => {
      const reliability = entity.reliability || 'F';
      acc[reliability] = (acc[reliability] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalEntities,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      reliabilityDistribution,
      transformationCount
    };
  }, [entities, transformationCount]);
  
  // Filter entities by confidence threshold
  const filteredEntities = useMemo(() => {
    return entities.filter(entity => entity.confidence >= confidenceThreshold);
  }, [entities, confidenceThreshold]);
  
  return {
    // Transformation functions
    transformIntelToEntity,
    transformIntelligenceToEntity,
    transformIntelligenceToNode,
    
    // Batch operations
    batchTransformIntel,
    batchTransformIntelligence,
    batchGenerateNodes,
    
    // State management
    entities: filteredEntities,
    nodes,
    isTransforming,
    transformationErrors,
    
    // Actions
    addIntel,
    addIntelligence,
    clearAll,
    filterByConfidence,
    
    // Statistics
    stats
  };
}

/**
 * Specialized hook for NetRunner integration
 */
export function useNetRunnerBridge(options: UseIntelBridgeOptions = {}) {
  const bridge = useIntelBridge({
    ...options,
    enableNodeGeneration: true, // NetRunner benefits from node visualization
    trackLineage: true // Track OSINT data lineage
  });
  
  // NetRunner-specific functionality
  const processNetRunnerIntel = useCallback((intelArray: Intel[]) => {
    // Filter for OSINT sources
    const osintIntel = intelArray.filter(intel => intel.source === 'OSINT');
    
    // Transform to entities
    const entities = bridge.batchTransformIntel(osintIntel);
    
    // Generate nodes for network visualization
    const intelligenceObjects: Intelligence[] = osintIntel.map(intel => ({
      ...intel,
      derivedFrom: { rawData: [intel.id] },
      confidence: bridge.stats.averageConfidence,
      implications: [`Data collected from ${intel.source}`]
    }));
    
    const nodes = bridge.batchGenerateNodes(intelligenceObjects);
    
    return { entities, nodes };
  }, [bridge]);
  
  return {
    ...bridge,
    processNetRunnerIntel
  };
}
