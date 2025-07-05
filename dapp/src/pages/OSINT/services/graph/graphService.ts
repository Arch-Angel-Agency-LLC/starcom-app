/**
 * OSINT Graph Service
 * 
 * Provides entity graph visualization services for the OSINT module.
 * Handles graph data management, entity-to-node mapping, and layout algorithms.
 */

import { osintApi } from '../api/osintApi';
import osintEndpoints from '../api/endpoints';
import { Entity, Relationship } from '../../types/osint';
import { createErrorDetail, ErrorDetail, ErrorUtils } from '../../types/errors';

/**
 * Graph node types for visualization
 */
export type NodeType = 'person' | 'organization' | 'wallet' | 'address' | 'domain' | 'file' | 'event' | 'device' | 'account';

/**
 * Graph node for visualization
 */
export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties: Record<string, unknown>;
  size?: number; // Node size (default: 1)
  color?: string; // Node color (default: based on type)
  x?: number; // Position X (set by layout algorithm)
  y?: number; // Position Y (set by layout algorithm)
  metadata?: {
    entity: Entity; // Original entity data
    expanded: boolean; // Whether node has been expanded
  };
}

/**
 * Graph link (edge) for visualization
 */
export interface GraphLink {
  id: string;
  source: string; // Source node ID
  target: string; // Target node ID
  type: string; // Link type
  label?: string; // Link label
  value?: number; // Link strength/value (default: 1)
  color?: string; // Link color (default: based on type)
  metadata?: {
    relationship: Relationship; // Original relationship data
  };
}

/**
 * Graph data structure for visualization
 */
export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Graph expansion options
 */
export interface ExpansionOptions {
  nodeId: string;
  depth?: number; // Depth of expansion (default: 1)
  maxNodes?: number; // Maximum nodes to return (default: 20)
  types?: string[]; // Relationship types to include (default: all)
}

/**
 * Graph service for OSINT visualization
 */
class GraphService {
  /**
   * Get graph data for visualization
   */
  async getGraphData(investigationId?: string): Promise<GraphData | ErrorDetail> {
    try {
      // If in development and no real backend, return mock data
      if (process.env.NODE_ENV === 'development') {
        return this.getMockGraphData();
      }
      
      const endpoint = investigationId 
        ? `/graph/network?investigationId=${investigationId}`
        : '/graph/network';
        
      const result = await osintApi.get<GraphData>(endpoint);
      
      if (result.success && result.data) {
        return result.data;
      }
      
      return createErrorDetail(
        result.error || 'Failed to get graph data',
        {
          code: 'API_ERROR',
          category: 'api',
          severity: 'error',
          operation: 'getGraphData',
          component: 'GraphService',
          recoverable: true,
          retryable: true,
          userActions: [
            'Check your network connection',
            'Verify the investigation ID is correct',
            'Try again later'
          ]
        }
      );
    } catch (error) {
      console.error('Error fetching graph data:', error);
      return createErrorDetail(
        ErrorUtils.createUserFriendlyMessage(error),
        {
          code: 'UNEXPECTED_ERROR',
          category: ErrorUtils.getErrorCategory(error),
          severity: 'error',
          operation: 'getGraphData',
          component: 'GraphService',
          originalError: error instanceof Error ? error : undefined,
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: true,
          retryable: true,
          userActions: [
            'Check your network connection',
            'Refresh the page and try again',
            'Contact support if the problem persists'
          ]
        }
      );
    }
  }
  
  /**
   * Expand a node to show related entities
   */
  async expandNode(options: ExpansionOptions): Promise<GraphData | ErrorDetail> {
    try {
      // If in development and no real backend, return mock expansion
      if (process.env.NODE_ENV === 'development') {
        return this.getMockExpansion(options.nodeId);
      }
      
      const endpoint = osintEndpoints.graph.expandNode(options.nodeId);
      const result = await osintApi.post<GraphData>(endpoint, options);
      
      if (result.success && result.data) {
        return result.data;
      }
      
      return createErrorDetail(
        result.error || 'Failed to expand node',
        {
          code: 'API_ERROR',
          category: 'api',
          severity: 'error',
          operation: 'expandNode',
          component: 'GraphService',
          recoverable: true,
          retryable: true,
          context: { nodeId: options.nodeId },
          userActions: [
            'Check your network connection',
            'Verify the node ID is valid',
            'Try again later'
          ]
        }
      );
    } catch (error) {
      console.error('Error expanding node:', error);
      return createErrorDetail(
        ErrorUtils.createUserFriendlyMessage(error),
        {
          code: 'UNEXPECTED_ERROR',
          category: ErrorUtils.getErrorCategory(error),
          severity: 'error',
          operation: 'expandNode',
          component: 'GraphService',
          originalError: error instanceof Error ? error : undefined,
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: true,
          retryable: true,
          context: { nodeId: options.nodeId },
          userActions: [
            'Check your network connection',
            'Refresh the page and try again',
            'Try a different node to expand'
          ]
        }
      );
    }
  }
  
  /**
   * Find paths between two nodes
   */
  async findPaths(sourceId: string, targetId: string, maxDepth: number = 3): Promise<GraphData | ErrorDetail> {
    try {
      // If in development and no real backend, return mock path
      if (process.env.NODE_ENV === 'development') {
        return this.getMockPath(sourceId, targetId);
      }
      
      const endpoint = osintEndpoints.graph.paths;
      const result = await osintApi.post<GraphData>(endpoint, {
        sourceId,
        targetId,
        maxDepth
      });
      
      if (result.success && result.data) {
        return result.data;
      }
      
      return createErrorDetail(
        result.error || 'Failed to find paths',
        {
          code: 'API_ERROR',
          category: 'api',
          severity: 'error',
          operation: 'findPaths',
          component: 'GraphService',
          recoverable: true,
          retryable: true,
          context: { sourceId, targetId, maxDepth },
          userActions: [
            'Check your network connection',
            'Verify the source and target IDs are valid',
            'Try with a lower max depth value',
            'Try again later'
          ]
        }
      );
    } catch (error) {
      console.error('Error finding paths:', error);
      return createErrorDetail(
        ErrorUtils.createUserFriendlyMessage(error),
        {
          code: 'UNEXPECTED_ERROR',
          category: ErrorUtils.getErrorCategory(error),
          severity: 'error',
          operation: 'findPaths',
          component: 'GraphService',
          originalError: error instanceof Error ? error : undefined,
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: true,
          retryable: true,
          context: { sourceId, targetId, maxDepth },
          userActions: [
            'Check your network connection',
            'Try with different nodes',
            'Try with a lower max depth value',
            'Refresh the page and try again'
          ]
        }
      );
    }
  }
  
  /**
   * Generate mock graph data for development
   */
  private getMockGraphData(): GraphData {
    // Create mock graph with Earth Alliance theme entities
    const nodes: GraphNode[] = [
      {
        id: 'person-1',
        type: 'person',
        label: 'Admiral Chen',
        properties: { role: 'Fleet Commander', station: 'Jupiter Station Alpha' },
        size: 2.5,
        color: '#3498db'
      },
      {
        id: 'person-2',
        type: 'person',
        label: 'Dr. Nakamura',
        properties: { role: 'Lead Scientist', specialty: 'Xenobiology' },
        size: 1.8,
        color: '#3498db'
      },
      {
        id: 'org-1',
        type: 'organization',
        label: 'Earth Alliance Command',
        properties: { type: 'Military', headquarters: 'Geneva' },
        size: 3,
        color: '#9b59b6'
      },
      {
        id: 'device-1',
        type: 'device',
        label: 'Quantum Comms Array',
        properties: { status: 'Active', location: 'Mars Orbit' },
        size: 1.5,
        color: '#2ecc71'
      },
      {
        id: 'address-1',
        type: 'address',
        label: 'Lunar Base Alpha',
        properties: { type: 'Military Base', population: 2500 },
        size: 2,
        color: '#e74c3c'
      },
      {
        id: 'event-1',
        type: 'event',
        label: 'First Contact Incident',
        properties: { date: '2045-06-12', classification: 'Top Secret' },
        size: 2.2,
        color: '#f39c12'
      }
    ];
    
    const links: GraphLink[] = [
      {
        id: 'link-1',
        source: 'person-1',
        target: 'org-1',
        type: 'member',
        label: 'Commands',
        value: 2
      },
      {
        id: 'link-2',
        source: 'person-2',
        target: 'org-1',
        type: 'member',
        label: 'Works for',
        value: 1.5
      },
      {
        id: 'link-3',
        source: 'person-1',
        target: 'device-1',
        type: 'access',
        label: 'Has access to',
        value: 1.2
      },
      {
        id: 'link-4',
        source: 'org-1',
        target: 'address-1',
        type: 'owner',
        label: 'Operates',
        value: 2
      },
      {
        id: 'link-5',
        source: 'person-2',
        target: 'event-1',
        type: 'temporal',
        label: 'Present at',
        value: 1
      },
      {
        id: 'link-6',
        source: 'device-1',
        target: 'address-1',
        type: 'location',
        label: 'Located at',
        value: 1.5
      }
    ];
    
    return { nodes, links };
  }
  
  /**
   * Generate mock node expansion for development
   */
  private getMockExpansion(nodeId: string): GraphData {
    // Create additional mock nodes connected to the expanded node
    const newNodes: GraphNode[] = [
      {
        id: `${nodeId}-exp1`,
        type: 'person',
        label: 'Related Person',
        properties: { relation: 'Associate' },
        size: 1.2,
        color: '#3498db'
      },
      {
        id: `${nodeId}-exp2`,
        type: 'organization',
        label: 'Related Organization',
        properties: { relation: 'Affiliation' },
        size: 1.5,
        color: '#9b59b6'
      },
      {
        id: `${nodeId}-exp3`,
        type: 'event',
        label: 'Related Event',
        properties: { date: '2045-07-21' },
        size: 1.3,
        color: '#f39c12'
      }
    ];
    
    const newLinks: GraphLink[] = [
      {
        id: `link-${nodeId}-1`,
        source: nodeId,
        target: `${nodeId}-exp1`,
        type: 'associate',
        label: 'Associated with',
        value: 1
      },
      {
        id: `link-${nodeId}-2`,
        source: nodeId,
        target: `${nodeId}-exp2`,
        type: 'member',
        label: 'Member of',
        value: 1.2
      },
      {
        id: `link-${nodeId}-3`,
        source: nodeId,
        target: `${nodeId}-exp3`,
        type: 'temporal',
        label: 'Involved in',
        value: 0.8
      }
    ];
    
    return { nodes: newNodes, links: newLinks };
  }
  
  /**
   * Generate mock path between two nodes for development
   */
  private getMockPath(sourceId: string, targetId: string): GraphData {
    // Create a path of nodes between source and target
    const intermediateNode1 = {
      id: 'intermediate-1',
      type: 'person' as NodeType,
      label: 'Intermediary 1',
      properties: { role: 'Connector' },
      size: 1,
      color: '#e67e22'
    };
    
    const intermediateNode2 = {
      id: 'intermediate-2',
      type: 'organization' as NodeType,
      label: 'Intermediary 2',
      properties: { type: 'Front Company' },
      size: 1.2,
      color: '#e67e22'
    };
    
    const pathLinks: GraphLink[] = [
      {
        id: 'path-link-1',
        source: sourceId,
        target: 'intermediate-1',
        type: 'associate',
        label: 'Associates with',
        value: 1
      },
      {
        id: 'path-link-2',
        source: 'intermediate-1',
        target: 'intermediate-2',
        type: 'member',
        label: 'Member of',
        value: 1
      },
      {
        id: 'path-link-3',
        source: 'intermediate-2',
        target: targetId,
        type: 'communication',
        label: 'Communicates with',
        value: 1
      }
    ];
    
    return {
      nodes: [intermediateNode1, intermediateNode2],
      links: pathLinks
    };
  }
}

// Create singleton instance
export const graphService = new GraphService();

// Export types
export type { GraphData, GraphNode, GraphLink, ExpansionOptions };
