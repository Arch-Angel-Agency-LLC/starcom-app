/**
 * NodeWebAdapter - Adapter for NodeWeb visualization with IntelDataCore
 * 
 * This adapter connects the Node Web visualization component to the IntelDataCore
 * by providing transformation and query functions.
 */

import { 
  NodeEntity, 
  EdgeRelationship,
  IntelQueryOptions 
} from '../types/intelDataModels';
import { intelDataStore } from '../store/intelDataStore';

// Types for NodeWeb visualization component
export interface NodeWebNode {
  id: string;
  label: string;
  type: string;
  group?: string;
  size?: number;
  color?: string;
  icon?: string;
  shape?: string;
  title?: string;
  x?: number;
  y?: number;
  properties: Record<string, any>;
  metadata: Record<string, any>;
  tags: string[];
}

export interface NodeWebEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  label?: string;
  width?: number;
  color?: string;
  dashes?: boolean;
  arrows?: {
    to?: boolean;
    from?: boolean;
  };
  metadata: Record<string, any>;
  tags: string[];
}

export interface NodeWebGraph {
  nodes: NodeWebNode[];
  edges: NodeWebEdge[];
}

export interface NodeWebStats {
  totalNodes: number;
  totalEdges: number;
  nodeTypes: Record<string, number>;
  edgeTypes: Record<string, number>;
}

export interface NodeWebFilter {
  property: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  value: any;
}

/**
 * NodeWeb adapter class for IntelDataCore
 */
export class NodeWebAdapter {
  /**
   * Fetch graph data based on filters
   */
  async getGraphData(filters?: NodeWebFilter[]): Promise<NodeWebGraph> {
    try {
      // Convert NodeWeb filters to Intel query options
      const queryOptions = this.createQueryOptions(filters);
      
      // Get nodes
      const nodeResult = await intelDataStore.queryEntities<NodeEntity>(queryOptions);
      if (!nodeResult.success) {
        console.error('Error fetching nodes:', nodeResult.error);
        return { nodes: [], edges: [] };
      }
      
      const nodes = nodeResult.data || [];
      const nodeIds = nodes.map(node => node.id);
      
      // Fetch relationships for these nodes
      const edgesPromises = nodeIds.map(id => intelDataStore.getRelationships(id));
      const edgeResults = await Promise.all(edgesPromises);
      
      // Collect all unique relationships
      const edgeMap = new Map<string, EdgeRelationship>();
      edgeResults.forEach(result => {
        if (result.success && result.data) {
          result.data.forEach(rel => {
            // Only include relationships where both source and target are in our node set
            if (nodeIds.includes(rel.sourceId) && nodeIds.includes(rel.targetId)) {
              edgeMap.set(rel.id, rel as EdgeRelationship);
            }
          });
        }
      });
      
      // Transform nodes and edges to NodeWeb format
      const nodeWebNodes = nodes.map(node => this.transformNodeToNodeWeb(node));
      const nodeWebEdges = Array.from(edgeMap.values()).map(edge => this.transformEdgeToNodeWeb(edge));
      
      return {
        nodes: nodeWebNodes,
        edges: nodeWebEdges
      };
    } catch (error) {
      console.error('Error in getGraphData:', error);
      return { nodes: [], edges: [] };
    }
  }
  
  /**
   * Get statistics about the current graph
   */
  async getGraphStats(filters?: NodeWebFilter[]): Promise<NodeWebStats> {
    try {
      const graph = await this.getGraphData(filters);
      
      // Calculate stats
      const nodeTypes: Record<string, number> = {};
      const edgeTypes: Record<string, number> = {};
      
      graph.nodes.forEach(node => {
        nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
      });
      
      graph.edges.forEach(edge => {
        edgeTypes[edge.type] = (edgeTypes[edge.type] || 0) + 1;
      });
      
      return {
        totalNodes: graph.nodes.length,
        totalEdges: graph.edges.length,
        nodeTypes,
        edgeTypes
      };
    } catch (error) {
      console.error('Error in getGraphStats:', error);
      return {
        totalNodes: 0,
        totalEdges: 0,
        nodeTypes: {},
        edgeTypes: {}
      };
    }
  }
  
  /**
   * Add a node to the graph
   */
  async addNode(nodeData: Partial<NodeEntity>): Promise<string | null> {
    try {
      const result = await intelDataStore.createEntity<NodeEntity>(nodeData);
      return result.success ? result.data!.id : null;
    } catch (error) {
      console.error('Error adding node:', error);
      return null;
    }
  }
  
  /**
   * Add an edge to the graph
   */
  async addEdge(edgeData: Partial<EdgeRelationship>): Promise<string | null> {
    try {
      const result = await intelDataStore.createRelationship(edgeData);
      return result.success ? result.data!.id : null;
    } catch (error) {
      console.error('Error adding edge:', error);
      return null;
    }
  }
  
  /**
   * Update a node in the graph
   */
  async updateNode(id: string, updates: Partial<NodeEntity>): Promise<boolean> {
    try {
      const result = await intelDataStore.updateEntity<NodeEntity>(id, updates);
      return result.success;
    } catch (error) {
      console.error('Error updating node:', error);
      return false;
    }
  }
  
  /**
   * Delete a node from the graph
   */
  async deleteNode(id: string): Promise<boolean> {
    try {
      const result = await intelDataStore.deleteEntity(id);
      return result.success;
    } catch (error) {
      console.error('Error deleting node:', error);
      return false;
    }
  }
  
  /**
   * Transform a NodeEntity to NodeWebNode format
   */
  private transformNodeToNodeWeb(node: NodeEntity): NodeWebNode {
    return {
      id: node.id,
      label: node.title || node.id,
      type: node.nodeType,
      group: node.nodeType,
      size: node.displayOptions?.size || 25,
      color: node.displayOptions?.color,
      icon: node.displayOptions?.icon,
      shape: node.displayOptions?.shape || 'circle',
      title: node.description,
      x: node.coordinates?.x,
      y: node.coordinates?.y,
      properties: node.properties || {},
      metadata: node.metadata || {},
      tags: node.tags || []
    };
  }
  
  /**
   * Transform an EdgeRelationship to NodeWebEdge format
   */
  private transformEdgeToNodeWeb(edge: EdgeRelationship): NodeWebEdge {
    return {
      id: edge.id,
      from: edge.sourceId,
      to: edge.targetId,
      type: edge.type,
      label: edge.displayOptions?.label || edge.type,
      width: edge.displayOptions?.width || (edge.strength ? edge.strength / 10 : 1),
      color: edge.displayOptions?.color,
      dashes: edge.displayOptions?.style === 'dashed',
      arrows: {
        to: edge.direction === 'unidirectional',
        from: edge.direction === 'bidirectional'
      },
      metadata: edge.metadata || {},
      tags: edge.tags || []
    };
  }
  
  /**
   * Convert NodeWeb filters to IntelDataCore query options
   */
  private createQueryOptions(filters?: NodeWebFilter[]): IntelQueryOptions {
    const options: IntelQueryOptions = {
      types: ['node'], // Only get node entities
      includeRelationships: false // We'll fetch relationships separately
    };
    
    if (!filters || filters.length === 0) {
      return options;
    }
    
    // Convert filters to query filters
    const queryFilters: Record<string, any> = {};
    
    filters.forEach(filter => {
      switch (filter.operator) {
        case 'equals':
          queryFilters[filter.property] = filter.value;
          break;
        case 'contains':
          // This is a simplification - the actual implementation would depend on
          // how the data store handles contains queries
          queryFilters[`${filter.property}_contains`] = filter.value;
          break;
        case 'startsWith':
          queryFilters[`${filter.property}_startsWith`] = filter.value;
          break;
        case 'endsWith':
          queryFilters[`${filter.property}_endsWith`] = filter.value;
          break;
        case 'greaterThan':
          queryFilters[`${filter.property}_gt`] = filter.value;
          break;
        case 'lessThan':
          queryFilters[`${filter.property}_lt`] = filter.value;
          break;
      }
    });
    
    options.filters = queryFilters;
    return options;
  }
}

// Export a singleton instance
export const nodeWebAdapter = new NodeWebAdapter();
