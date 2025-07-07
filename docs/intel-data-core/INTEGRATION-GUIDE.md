# IntelDataCore Integration Guide

## Overview

This document provides comprehensive guidance for integrating STARCOM modules with the IntelDataCore system. It outlines patterns, best practices, and code examples to help developers effectively leverage the centralized intelligence data system while maintaining module independence.

## Key Integration Principles

1. **Progressive Adoption**: Modules can integrate incrementally
2. **Module Independence**: Modules retain functional autonomy
3. **Consistent Patterns**: Standardized integration approaches
4. **Type Safety**: Fully typed interfaces for reliable integration
5. **Reactive Updates**: Event-driven updates for real-time responsiveness
6. **Clean Separation**: Clear boundaries between core and module logic

## Integration Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                     Module Implementation                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐   │
│  │ UI Components  │  │ Module Logic   │  │ Local State        │   │
│  └────────┬───────┘  └───────┬────────┘  └──────────┬─────────┘   │
└──────────┬────────────────────┬───────────────────────┬───────────┘
           │                    │                       │
           ▼                    ▼                       ▼
┌───────────────────────────────────────────────────────────────────┐
│                     Integration Layer                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐   │
│  │ Custom Hooks   │  │ Module Adapter │  │ Event Handlers     │   │
│  └────────┬───────┘  └───────┬────────┘  └──────────┬─────────┘   │
└──────────┬────────────────────┬───────────────────────┬───────────┘
           │                    │                       │
           ▼                    ▼                       ▼
┌───────────────────────────────────────────────────────────────────┐
│                     IntelDataCore API                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐   │
│  │ Entity Access  │  │ Query Services │  │ Event System       │   │
│  └────────────────┘  └────────────────┘  └────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

## Integration Patterns

### 1. React Hook Integration

The primary integration pattern for React components using custom hooks:

```typescript
// src/hooks/useIntelDataCore.ts
import { useState, useEffect, useCallback } from 'react';
import { IntelDataCore } from '@core/intel-data-core';
import type { IntelEntity, Query, QueryResult } from '@core/types';

/**
 * Hook for accessing IntelDataCore functionality
 */
export function useIntelDataCore<T extends IntelEntity>() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [entities, setEntities] = useState<T[]>([]);
  
  // Query entities with type safety
  const queryEntities = useCallback(async (query: Query<T>): Promise<T[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await IntelDataCore.queryEntities<T>(query);
      setEntities(result);
      return result;
    } catch (err) {
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Create new entity
  const createEntity = useCallback(async (entity: Omit<T, 'id'>): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await IntelDataCore.createEntity<T>(entity as T);
      setEntities(prev => [...prev, result]);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Update existing entity
  const updateEntity = useCallback(async (entity: T): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await IntelDataCore.updateEntity<T>(entity);
      setEntities(prev => prev.map(e => e.id === entity.id ? result : e));
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Delete entity
  const deleteEntity = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await IntelDataCore.deleteEntity(id);
      if (success) {
        setEntities(prev => prev.filter(e => e.id !== id));
      }
      return success;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    entities,
    loading,
    error,
    queryEntities,
    createEntity,
    updateEntity,
    deleteEntity,
  };
}
```

### 2. Module-Specific Adapters

Specialized adapters for module-specific intelligence operations:

```typescript
// src/modules/NodeWeb/adapters/nodeWebAdapter.ts
import { IntelDataCore } from '@core/intel-data-core';
import type { 
  NodeEntity, 
  EdgeEntity,
  NodeCategory,
  FilterCondition 
} from '@core/types';

/**
 * Specialized adapter for NodeWeb module
 */
export class NodeWebAdapter {
  /**
   * Get nodes by category with filtering
   */
  async getNodesByCategory(
    categories: NodeCategory[], 
    filter?: FilterCondition
  ): Promise<NodeEntity[]> {
    const query = {
      type: 'node',
      filter: [
        { property: 'category', operator: 'in', value: categories },
        ...(filter ? [filter] : [])
      ]
    };
    
    return IntelDataCore.queryEntities<NodeEntity>(query);
  }
  
  /**
   * Get edges connected to a node
   */
  async getConnectedEdges(nodeId: string): Promise<EdgeEntity[]> {
    const query = {
      type: 'edge',
      filter: {
        operator: 'or',
        conditions: [
          { property: 'sourceId', operator: 'eq', value: nodeId },
          { property: 'targetId', operator: 'eq', value: nodeId }
        ]
      }
    };
    
    return IntelDataCore.queryEntities<EdgeEntity>(query);
  }
  
  /**
   * Calculate network statistics
   */
  async getNetworkStats(nodeIds: string[]): Promise<NodeWebStats> {
    // Implementation leveraging core queries for stats calculation
    // ...
    
    return {
      nodeCount: 0,
      edgeCount: 0,
      density: 0,
      categories: {}
    };
  }
  
  /**
   * Add node with connected edges
   */
  async addNodeWithRelationships(
    node: Omit<NodeEntity, 'id'>,
    relationships: Array<Omit<EdgeEntity, 'id' | 'sourceId'>>
  ): Promise<{ node: NodeEntity; edges: EdgeEntity[] }> {
    // Implementation using transactions
    // ...
    
    return { node: {} as NodeEntity, edges: [] };
  }
}

/**
 * Network statistics interface
 */
interface NodeWebStats {
  nodeCount: number;
  edgeCount: number;
  density: number;
  categories: Record<string, number>;
}
```

### 3. Event-Based Integration

React to intelligence data changes through the event system:

```typescript
// src/modules/Timeline/services/timelineEventService.ts
import { IntelDataCore } from '@core/intel-data-core';
import type { TimelineEvent, EventSubscription } from '@core/types';

/**
 * Service for Timeline event management
 */
export class TimelineEventService {
  private subscriptions: EventSubscription[] = [];
  
  constructor() {
    this.initialize();
  }
  
  /**
   * Initialize event subscriptions
   */
  private initialize(): void {
    // Subscribe to timeline event creation
    const createSub = IntelDataCore.events.subscribe(
      'entity.created', 
      (entity) => {
        if (entity.type === 'timeline_event') {
          this.onTimelineEventCreated(entity as TimelineEvent);
        }
      }
    );
    
    // Subscribe to timeline event updates
    const updateSub = IntelDataCore.events.subscribe(
      'entity.updated', 
      (entity) => {
        if (entity.type === 'timeline_event') {
          this.onTimelineEventUpdated(entity as TimelineEvent);
        }
      }
    );
    
    this.subscriptions.push(createSub, updateSub);
  }
  
  /**
   * Handle timeline event creation
   */
  private onTimelineEventCreated(event: TimelineEvent): void {
    console.log('Timeline event created:', event);
    // Module-specific handling
  }
  
  /**
   * Handle timeline event updates
   */
  private onTimelineEventUpdated(event: TimelineEvent): void {
    console.log('Timeline event updated:', event);
    // Module-specific handling
  }
  
  /**
   * Clean up subscriptions
   */
  dispose(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}
```

### 4. Component-Level Integration

Direct integration at the React component level:

```tsx
// src/pages/NodeWeb/components/NodeWebVisualizer.tsx
import React, { useEffect, useState } from 'react';
import { useIntelDataCore } from '@core/hooks';
import type { NodeEntity, EdgeEntity } from '@core/types';
import { ForceGraph2D } from 'react-force-graph';
import styles from './NodeWebVisualizer.module.css';

export const NodeWebVisualizer: React.FC = () => {
  // Use core hook for data access
  const { 
    entities: nodes,
    loading,
    error,
    queryEntities
  } = useIntelDataCore<NodeEntity>();
  
  const [edges, setEdges] = useState<EdgeEntity[]>([]);
  const [filteredData, setFilteredData] = useState({ nodes: [], links: [] });
  
  // Load nodes on component mount
  useEffect(() => {
    const loadData = async () => {
      await queryEntities({ type: 'node' });
      
      // Once nodes are loaded, get related edges
      const edgeQuery = { type: 'edge' };
      const edgeResults = await IntelDataCore.queryEntities<EdgeEntity>(edgeQuery);
      setEdges(edgeResults);
    };
    
    loadData();
  }, [queryEntities]);
  
  // Transform data for visualization
  useEffect(() => {
    if (nodes.length && edges.length) {
      setFilteredData({
        nodes: nodes.map(node => ({
          id: node.id,
          name: node.name,
          category: node.category,
          // Additional visualization properties
        })),
        links: edges.map(edge => ({
          source: edge.sourceId,
          target: edge.targetId,
          type: edge.relationship,
          strength: edge.strength,
          // Additional visualization properties
        }))
      });
    }
  }, [nodes, edges]);
  
  if (loading) return <div>Loading network data...</div>;
  if (error) return <div>Error loading network: {error.message}</div>;
  
  return (
    <div className={styles.visualizerContainer}>
      <ForceGraph2D
        graphData={filteredData}
        nodeLabel="name"
        nodeAutoColorBy="category"
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        // Additional visualization configuration
      />
    </div>
  );
};
```

## Module-Specific Integration Guides

### NetRunner Integration

```typescript
// NetRunner module integration with IntelDataCore

// 1. Core data access hook
import { useNetRunnerData } from '../hooks/useNetRunnerData';

// 2. Custom NetRunner adapter
import { createNetRunnerAdapter } from '../adapters/netRunnerAdapter';

// 3. Component example
const NetRunnerDashboard: React.FC = () => {
  const adapter = createNetRunnerAdapter();
  const { scanResults, isScanning, startScan } = adapter;
  
  // Implementation leveraging IntelDataCore
  
  return (
    <div>
      {/* NetRunner UI implementation */}
    </div>
  );
};
```

### Analyzer Integration

```typescript
// Analyzer module integration with IntelDataCore

// 1. Core data access hook
import { useAnalyzerData } from '../hooks/useAnalyzerData';

// 2. Custom Analyzer adapter
import { createAnalyzerAdapter } from '../adapters/analyzerAdapter';

// 3. Component example
const AnalyzerDashboard: React.FC = () => {
  const adapter = createAnalyzerAdapter();
  const { analyzeEntities, analysisResults, isAnalyzing } = adapter;
  
  // Implementation leveraging IntelDataCore
  
  return (
    <div>
      {/* Analyzer UI implementation */}
    </div>
  );
};
```

### Timeline Integration

```typescript
// Timeline module integration with IntelDataCore

// 1. Core data access hook
import { useTimelineData } from '../hooks/useTimelineData';

// 2. Custom Timeline adapter
import { createTimelineAdapter } from '../adapters/timelineAdapter';

// 3. Component example
const TimelineDashboard: React.FC = () => {
  const adapter = createTimelineAdapter();
  const { events, filterEvents, addEvent } = adapter;
  
  // Implementation leveraging IntelDataCore
  
  return (
    <div>
      {/* Timeline UI implementation */}
    </div>
  );
};
```

### Case Manager Integration

```typescript
// Case Manager module integration with IntelDataCore

// 1. Core data access hook
import { useCaseManagerData } from '../hooks/useCaseManagerData';

// 2. Custom Case Manager adapter
import { createCaseManagerAdapter } from '../adapters/caseManagerAdapter';

// 3. Component example
const CaseManagerDashboard: React.FC = () => {
  const adapter = createCaseManagerAdapter();
  const { cases, createCase, updateCase, linkEntityToCase } = adapter;
  
  // Implementation leveraging IntelDataCore
  
  return (
    <div>
      {/* Case Manager UI implementation */}
    </div>
  );
};
```

## Advanced Integration Patterns

### 1. Composite Queries

Combine data from multiple entity types for complex visualizations:

```typescript
/**
 * Advanced hook for composite intelligence queries
 */
export function useCompositeIntelligence(caseId: string) {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<CompositeIntelData | null>(null);
  
  const loadCompositeData = useCallback(async () => {
    setLoading(true);
    
    try {
      // Get case details
      const caseRecord = await IntelDataCore.getEntity<CaseRecord>(caseId);
      
      // Get related timeline events
      const events = await IntelDataCore.queryEntities<TimelineEvent>({
        type: 'timeline_event',
        filter: {
          property: 'metadata.caseId',
          operator: 'eq',
          value: caseId
        }
      });
      
      // Get related intelligence reports
      const reports = await IntelDataCore.queryEntities<IntelReport>({
        type: 'report',
        filter: {
          property: 'metadata.caseId',
          operator: 'eq',
          value: caseId
        }
      });
      
      // Get all nodes and edges referenced in this case
      const nodeIds = new Set<string>();
      const nodes: NodeEntity[] = [];
      const edges: EdgeEntity[] = [];
      
      // Extract node IDs from case references
      caseRecord.linkedEntities.forEach(ref => {
        if (ref.type === 'node') {
          nodeIds.add(ref.id);
        }
      });
      
      // Get all referenced nodes
      if (nodeIds.size > 0) {
        const nodeResults = await IntelDataCore.queryEntities<NodeEntity>({
          type: 'node',
          filter: {
            property: 'id',
            operator: 'in',
            value: Array.from(nodeIds)
          }
        });
        
        nodes.push(...nodeResults);
        
        // Get edges between these nodes
        if (nodes.length > 0) {
          const edgeResults = await IntelDataCore.queryEntities<EdgeEntity>({
            type: 'edge',
            filter: {
              operator: 'or',
              conditions: [
                {
                  property: 'sourceId',
                  operator: 'in',
                  value: nodes.map(n => n.id)
                },
                {
                  property: 'targetId',
                  operator: 'in',
                  value: nodes.map(n => n.id)
                }
              ]
            }
          });
          
          edges.push(...edgeResults);
        }
      }
      
      // Compose the full intelligence picture
      setData({
        caseRecord,
        events,
        reports,
        nodes,
        edges
      });
    } catch (err) {
      console.error('Failed to load composite intelligence data:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);
  
  useEffect(() => {
    loadCompositeData();
  }, [loadCompositeData]);
  
  return {
    data,
    loading,
    refresh: loadCompositeData
  };
}

/**
 * Composite intelligence data structure
 */
interface CompositeIntelData {
  caseRecord: CaseRecord;
  events: TimelineEvent[];
  reports: IntelReport[];
  nodes: NodeEntity[];
  edges: EdgeEntity[];
}
```

### 2. Live Collaboration Integration

Enable real-time collaborative intelligence analysis:

```typescript
/**
 * Hook for collaborative intelligence work
 */
export function useCollaborativeIntelligence() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activeChanges, setActiveChanges] = useState<CollaborativeChange[]>([]);
  
  // Setup collaboration when component mounts
  useEffect(() => {
    // Subscribe to collaboration events
    const collabSub = IntelDataCore.events.subscribe(
      'collaboration.update',
      (update: CollaborationUpdate) => {
        if (update.type === 'user_joined') {
          setCollaborators(prev => [...prev, update.user]);
        } else if (update.type === 'user_left') {
          setCollaborators(prev => 
            prev.filter(c => c.id !== update.user.id)
          );
        } else if (update.type === 'entity_changed') {
          setActiveChanges(prev => [...prev, update.change]);
        }
      }
    );
    
    // Announce user joining collaboration
    IntelDataCore.collaboration.join();
    
    // Cleanup when component unmounts
    return () => {
      collabSub.unsubscribe();
      IntelDataCore.collaboration.leave();
    };
  }, []);
  
  /**
   * Start collaborative editing of an entity
   */
  const startEditing = useCallback((entityId: string) => {
    IntelDataCore.collaboration.lockEntity(entityId);
  }, []);
  
  /**
   * Complete collaborative editing
   */
  const finishEditing = useCallback((
    entityId: string, 
    changes: Record<string, any>
  ) => {
    IntelDataCore.collaboration.updateEntity(entityId, changes);
    IntelDataCore.collaboration.unlockEntity(entityId);
  }, []);
  
  return {
    collaborators,
    activeChanges,
    startEditing,
    finishEditing
  };
}

/**
 * Collaborator information
 */
interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  activeEntityId?: string;
}

/**
 * Collaboration change record
 */
interface CollaborativeChange {
  entityId: string;
  userId: string;
  userName: string;
  timestamp: string;
  changes: Record<string, any>;
}
```

### 3. Integration with External Systems

Connect IntelDataCore with external intelligence sources:

```typescript
/**
 * Service for integrating external intelligence sources
 */
export class ExternalIntelligenceService {
  /**
   * Import intelligence from external system
   */
  async importFromExternal(
    source: ExternalSource,
    options: ImportOptions
  ): Promise<ImportResult> {
    // Fetch data from external source
    const externalData = await this.fetchExternalData(source, options);
    
    // Transform to IntelDataCore format
    const transformedData = this.transformData(externalData, source);
    
    // Import into IntelDataCore
    const importedEntities = await this.importEntities(transformedData);
    
    return {
      totalImported: importedEntities.length,
      entities: importedEntities,
      source
    };
  }
  
  /**
   * Fetch data from external source
   */
  private async fetchExternalData(
    source: ExternalSource,
    options: ImportOptions
  ): Promise<any> {
    // Implementation depends on source
    switch (source) {
      case 'osint_db':
        return this.fetchFromOsintDB(options);
      case 'mitre_attack':
        return this.fetchFromMitreAttack(options);
      case 'threat_intel':
        return this.fetchFromThreatIntel(options);
      default:
        throw new Error(`Unsupported external source: ${source}`);
    }
  }
  
  /**
   * Transform external data to IntelDataCore format
   */
  private transformData(
    data: any,
    source: ExternalSource
  ): TransformedEntity[] {
    // Implementation depends on source
    switch (source) {
      case 'osint_db':
        return this.transformOsintData(data);
      case 'mitre_attack':
        return this.transformMitreData(data);
      case 'threat_intel':
        return this.transformThreatIntelData(data);
      default:
        throw new Error(`Unsupported external source: ${source}`);
    }
  }
  
  /**
   * Import transformed entities into IntelDataCore
   */
  private async importEntities(
    entities: TransformedEntity[]
  ): Promise<IntelEntity[]> {
    const importedEntities: IntelEntity[] = [];
    
    // Use transaction for all-or-nothing import
    const transaction = IntelDataCore.storage.beginTransaction();
    
    try {
      for (const entity of entities) {
        const importedEntity = await IntelDataCore.createEntity(
          entity.data,
          { transaction }
        );
        
        importedEntities.push(importedEntity);
      }
      
      // Commit all changes
      await transaction.commit();
      
      return importedEntities;
    } catch (error) {
      // Rollback on any error
      await transaction.rollback();
      throw error;
    }
  }
}

/**
 * External intelligence source types
 */
type ExternalSource = 'osint_db' | 'mitre_attack' | 'threat_intel' | 'custom';

/**
 * Import options
 */
interface ImportOptions {
  filters?: Record<string, any>;
  limit?: number;
  transformOptions?: Record<string, any>;
}

/**
 * Transformed entity for import
 */
interface TransformedEntity {
  originalId: string;
  source: ExternalSource;
  data: Omit<IntelEntity, 'id'>;
}

/**
 * Import result
 */
interface ImportResult {
  totalImported: number;
  entities: IntelEntity[];
  source: ExternalSource;
}
```

## Migration Strategy

For modules already implemented before IntelDataCore adoption:

### 1. Parallel Operation Phase

Run existing data system alongside IntelDataCore:

```typescript
/**
 * Adapter for backward compatibility
 */
export class LegacySystemAdapter {
  /**
   * Constructor with dependency injection
   */
  constructor(
    private readonly legacyService: any,
    private readonly intelDataCore: typeof IntelDataCore
  ) {}
  
  /**
   * Forward operations to both systems
   */
  async createEntity(entity: any): Promise<any> {
    // Create in legacy system
    const legacyResult = await this.legacyService.create(entity);
    
    // Transform to new format
    const transformedEntity = this.transformToNewFormat(entity);
    
    // Create in new system
    const newResult = await this.intelDataCore.createEntity(transformedEntity);
    
    // Return legacy format for backward compatibility
    return legacyResult;
  }
  
  // Additional methods for other operations
}
```

### 2. Data Migration Utilities

Tools for migrating from legacy data formats:

```typescript
/**
 * Utility for migrating legacy data
 */
export class DataMigrationUtility {
  /**
   * Migrate all data from legacy to new system
   */
  async migrateAllData(): Promise<MigrationResult> {
    const stats: MigrationStats = {
      total: 0,
      successful: 0,
      failed: 0,
      entities: {}
    };
    
    try {
      // Migrate nodes
      const nodeStats = await this.migrateNodes();
      stats.entities.nodes = nodeStats;
      
      // Migrate edges
      const edgeStats = await this.migrateEdges();
      stats.entities.edges = edgeStats;
      
      // Migrate reports
      const reportStats = await this.migrateReports();
      stats.entities.reports = reportStats;
      
      // Migrate cases
      const caseStats = await this.migrateCases();
      stats.entities.cases = caseStats;
      
      // Update statistics
      stats.total = Object.values(stats.entities)
        .reduce((sum, stat) => sum + stat.total, 0);
      
      stats.successful = Object.values(stats.entities)
        .reduce((sum, stat) => sum + stat.successful, 0);
      
      stats.failed = Object.values(stats.entities)
        .reduce((sum, stat) => sum + stat.failed, 0);
      
      return {
        success: true,
        stats
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stats
      };
    }
  }
  
  // Implementation of specific migration methods
}

/**
 * Migration result
 */
interface MigrationResult {
  success: boolean;
  error?: string;
  stats: MigrationStats;
}

/**
 * Migration statistics
 */
interface MigrationStats {
  total: number;
  successful: number;
  failed: number;
  entities: Record<string, EntityMigrationStats>;
}

/**
 * Per-entity migration statistics
 */
interface EntityMigrationStats {
  total: number;
  successful: number;
  failed: number;
  errors?: any[];
}
```

## Testing Integration

### 1. Component Integration Testing

```tsx
// Integration test for component with IntelDataCore
import { render, screen, waitFor } from '@testing-library/react';
import { NodeWebVisualizer } from './NodeWebVisualizer';
import { IntelDataCore } from '@core/intel-data-core';

// Mock IntelDataCore
jest.mock('@core/intel-data-core', () => ({
  queryEntities: jest.fn(),
  events: {
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() })
  }
}));

describe('NodeWebVisualizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should load and display network data', async () => {
    // Setup mock data
    const mockNodes = [
      { id: 'node1', name: 'Node 1', type: 'node', category: 'person' },
      { id: 'node2', name: 'Node 2', type: 'node', category: 'organization' }
    ];
    
    const mockEdges = [
      { 
        id: 'edge1', 
        type: 'edge',
        sourceId: 'node1', 
        targetId: 'node2', 
        relationship: 'member_of' 
      }
    ];
    
    // Mock query responses
    IntelDataCore.queryEntities
      .mockImplementationOnce(() => Promise.resolve(mockNodes))
      .mockImplementationOnce(() => Promise.resolve(mockEdges));
    
    // Render component
    render(<NodeWebVisualizer />);
    
    // Check loading state
    expect(screen.getByText('Loading network data...')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(IntelDataCore.queryEntities).toHaveBeenCalledTimes(2);
    });
    
    // Verify the component rendered with data
    // (This would depend on your actual component implementation)
  });
});
```

### 2. Hook Integration Testing

```typescript
// Integration test for custom hook with IntelDataCore
import { renderHook, act } from '@testing-library/react-hooks';
import { useIntelDataCore } from './useIntelDataCore';
import { IntelDataCore } from '@core/intel-data-core';

// Mock IntelDataCore
jest.mock('@core/intel-data-core', () => ({
  queryEntities: jest.fn(),
  createEntity: jest.fn(),
  updateEntity: jest.fn(),
  deleteEntity: jest.fn()
}));

describe('useIntelDataCore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should query entities', async () => {
    // Setup mock data
    const mockEntities = [
      { id: 'entity1', type: 'node' },
      { id: 'entity2', type: 'node' }
    ];
    
    IntelDataCore.queryEntities.mockResolvedValue(mockEntities);
    
    // Render hook
    const { result, waitForNextUpdate } = renderHook(() => useIntelDataCore());
    
    // Verify initial state
    expect(result.current.loading).toBe(false);
    expect(result.current.entities).toEqual([]);
    
    // Execute query
    let queryResult;
    await act(async () => {
      queryResult = await result.current.queryEntities({ type: 'node' });
      await waitForNextUpdate();
    });
    
    // Verify result
    expect(IntelDataCore.queryEntities).toHaveBeenCalledWith({ type: 'node' });
    expect(result.current.entities).toEqual(mockEntities);
    expect(queryResult).toEqual(mockEntities);
    expect(result.current.loading).toBe(false);
  });
  
  // Additional tests for other operations
});
```

## Troubleshooting Integration

Common integration issues and solutions:

### 1. Entity Type Mismatch

**Problem**: Component receives entities of unexpected type

**Solution**:
- Use TypeScript generics properly
- Add runtime type checking
- Verify query parameters

```typescript
// Add runtime type checking
function isNodeEntity(entity: any): entity is NodeEntity {
  return entity && entity.type === 'node';
}

// Use in component
const nodes = entities.filter(isNodeEntity);
```

### 2. Stale Data Issues

**Problem**: Component displays outdated data after updates

**Solution**:
- Subscribe to entity update events
- Implement proper cache invalidation
- Use optimistic updates

```typescript
// Subscribe to updates
useEffect(() => {
  const subscription = IntelDataCore.events.subscribe(
    'entity.updated',
    (updatedEntity) => {
      if (updatedEntity.type === 'node') {
        // Update local state
        setNodes(prev => prev.map(node => 
          node.id === updatedEntity.id ? updatedEntity : node
        ));
      }
    }
  );
  
  return () => subscription.unsubscribe();
}, []);
```

### 3. Performance Issues

**Problem**: Slow component rendering with large datasets

**Solution**:
- Implement pagination and infinite scrolling
- Use windowing for large lists
- Optimize queries with specific filters

```typescript
// Paginated query example
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(50);

useEffect(() => {
  const loadPage = async () => {
    const query = {
      type: 'node',
      pagination: {
        offset: (page - 1) * pageSize,
        limit: pageSize
      }
    };
    
    await queryEntities(query);
  };
  
  loadPage();
}, [page, pageSize, queryEntities]);
```

## Conclusion

This integration guide provides comprehensive patterns and examples for connecting STARCOM modules with the IntelDataCore system. By following these patterns, developers can create consistent, maintainable integrations that leverage the power of the centralized intelligence data system while preserving module independence.

For module-specific implementation details, refer to the individual module documentation. For IntelDataCore API reference, see the API documentation.

---

*See related documentation for data models, storage system, and architecture overview.*
