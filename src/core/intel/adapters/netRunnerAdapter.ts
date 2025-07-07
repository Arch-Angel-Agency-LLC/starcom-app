/**
 * NetRunnerAdapter - Adapter for NetRunner integration with IntelDataCore
 * 
 * This adapter connects the NetRunner module to the IntelDataCore system
 * by providing data transformation, query functions, and event synchronization.
 */

import { 
  BaseEntity,
  IntelQueryOptions,
  Relationship,
  NodeEntity,
  EdgeRelationship,
  ClassificationLevel
} from '../types/intelDataModels';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';
import { storageOrchestrator } from '../storage/storageOrchestrator';

// Types for NetRunner module
export interface NetworkNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
  category?: string;
  importance: number;
  confidence: number;
  notes?: string;
  tags: string[];
  sourceReferences: string[];
  classification: ClassificationLevel;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  metadata: Record<string, any>;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  properties: Record<string, any>;
  weight: number;
  directed: boolean;
  confidence: number;
  notes?: string;
  tags: string[];
  sourceReferences: string[];
  classification: ClassificationLevel;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  metadata: Record<string, any>;
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface NetworkFilter {
  property: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between';
  value: any;
}

export interface NetworkStats {
  totalNodes: number;
  totalEdges: number;
  nodeTypeDistribution: Record<string, number>;
  edgeTypeDistribution: Record<string, number>;
  connectivityMetrics: {
    averageDegree: number;
    density: number;
    componentCount: number;
  };
  recentActivity: {
    nodesCreated: number;
    edgesCreated: number;
    nodesUpdated: number;
    edgesUpdated: number;
  };
}

export interface PatternMatchResult {
  patternId: string;
  matches: {
    nodes: NetworkNode[];
    edges: NetworkEdge[];
    confidence: number;
    score: number;
  }[];
}

/**
 * NetRunner adapter class for IntelDataCore
 */
export class NetRunnerAdapter {
  private listeners: Array<{ unsubscribe: () => void }> = [];
  
  constructor() {
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for real-time updates
   */
  private setupEventListeners(): void {
    // Listen for node entity events
    const nodeCreatedListener = enhancedEventEmitter.on('entity:created', (event) => {
      if (event.entityType === 'node_entity') {
        enhancedEventEmitter.emit('network:node:created', {
          nodeId: event.entityId,
          node: this.transformNodeEntityToNetworkNode(event.entity as NodeEntity)
        });
      }
    });
    
    const nodeUpdatedListener = enhancedEventEmitter.on('entity:updated', (event) => {
      if (event.entityType === 'node_entity') {
        enhancedEventEmitter.emit('network:node:updated', {
          nodeId: event.entityId,
          node: this.transformNodeEntityToNetworkNode(event.entity as NodeEntity),
          changes: event.changes
        });
      }
    });
    
    const nodeDeletedListener = enhancedEventEmitter.on('entity:deleted', (event) => {
      if (event.entityType === 'node_entity') {
        enhancedEventEmitter.emit('network:node:deleted', {
          nodeId: event.entityId
        });
      }
    });
    
    // Listen for edge relationship events
    const edgeCreatedListener = enhancedEventEmitter.on('relationship:created', (event) => {
      if (event.relationshipType.startsWith('edge_')) {
        enhancedEventEmitter.emit('network:edge:created', {
          edgeId: event.relationshipId,
          edge: this.transformEdgeRelationshipToNetworkEdge(event.relationship as EdgeRelationship)
        });
      }
    });
    
    const edgeUpdatedListener = enhancedEventEmitter.on('relationship:updated', (event) => {
      if (event.relationshipType.startsWith('edge_')) {
        enhancedEventEmitter.emit('network:edge:updated', {
          edgeId: event.relationshipId,
          edge: this.transformEdgeRelationshipToNetworkEdge(event.relationship as EdgeRelationship),
          changes: event.changes
        });
      }
    });
    
    const edgeDeletedListener = enhancedEventEmitter.on('relationship:deleted', (event) => {
      if (event.relationshipType.startsWith('edge_')) {
        enhancedEventEmitter.emit('network:edge:deleted', {
          edgeId: event.relationshipId
        });
      }
    });
    
    // Store all listeners for cleanup
    this.listeners = [
      nodeCreatedListener,
      nodeUpdatedListener,
      nodeDeletedListener,
      edgeCreatedListener,
      edgeUpdatedListener,
      edgeDeletedListener
    ];
  }
  
  /**
   * Clean up event listeners when adapter is no longer needed
   */
  public dispose(): void {
    this.listeners.forEach(listener => listener.unsubscribe());
    this.listeners = [];
  }
  
  /**
   * Transform a NodeEntity to a NetworkNode
   */
  private transformNodeEntityToNetworkNode(nodeEntity: NodeEntity): NetworkNode {
    return {
      id: nodeEntity.id,
      label: nodeEntity.label || nodeEntity.title,
      type: nodeEntity.nodeType,
      properties: nodeEntity.properties || {},
      category: nodeEntity.category,
      importance: nodeEntity.importance || 1,
      confidence: nodeEntity.metadata.confidence || 50,
      notes: nodeEntity.description,
      tags: nodeEntity.tags || [],
      sourceReferences: nodeEntity.sourceReferences || [],
      classification: nodeEntity.classification,
      createdAt: nodeEntity.createdAt,
      updatedAt: nodeEntity.updatedAt,
      createdBy: nodeEntity.createdBy,
      metadata: nodeEntity.metadata || {}
    };
  }
  
  /**
   * Transform an EdgeRelationship to a NetworkEdge
   */
  private transformEdgeRelationshipToNetworkEdge(edgeRelationship: EdgeRelationship): NetworkEdge {
    return {
      id: edgeRelationship.id,
      source: edgeRelationship.sourceId,
      target: edgeRelationship.targetId,
      label: edgeRelationship.label || edgeRelationship.type.replace('edge_', ''),
      properties: edgeRelationship.properties || {},
      weight: edgeRelationship.weight || 1,
      directed: edgeRelationship.directed !== false, // Default to true if not specified
      confidence: edgeRelationship.confidence || 50,
      notes: edgeRelationship.description,
      tags: edgeRelationship.tags || [],
      sourceReferences: edgeRelationship.sourceReferences || [],
      classification: edgeRelationship.classification,
      createdAt: edgeRelationship.createdAt,
      updatedAt: edgeRelationship.updatedAt,
      createdBy: edgeRelationship.createdBy,
      metadata: edgeRelationship.metadata || {}
    };
  }
  
  /**
   * Transform a NetworkNode to a NodeEntity
   */
  private transformNetworkNodeToNodeEntity(networkNode: NetworkNode): NodeEntity {
    return {
      id: networkNode.id,
      type: 'node_entity',
      nodeType: networkNode.type,
      label: networkNode.label,
      title: networkNode.label,
      description: networkNode.notes || '',
      category: networkNode.category,
      importance: networkNode.importance,
      properties: networkNode.properties,
      classification: networkNode.classification,
      sourceReferences: networkNode.sourceReferences,
      tags: networkNode.tags,
      createdAt: networkNode.createdAt,
      updatedAt: networkNode.updatedAt,
      createdBy: networkNode.createdBy,
      metadata: {
        ...networkNode.metadata,
        confidence: networkNode.confidence
      }
    };
  }
  
  /**
   * Transform a NetworkEdge to an EdgeRelationship
   */
  private transformNetworkEdgeToEdgeRelationship(networkEdge: NetworkEdge): EdgeRelationship {
    return {
      id: networkEdge.id,
      type: `edge_${networkEdge.label.toLowerCase().replace(/\s+/g, '_')}`,
      sourceId: networkEdge.source,
      targetId: networkEdge.target,
      label: networkEdge.label,
      description: networkEdge.notes || '',
      weight: networkEdge.weight,
      directed: networkEdge.directed,
      properties: networkEdge.properties,
      classification: networkEdge.classification,
      sourceReferences: networkEdge.sourceReferences,
      confidence: networkEdge.confidence,
      tags: networkEdge.tags,
      createdAt: networkEdge.createdAt,
      updatedAt: networkEdge.updatedAt,
      createdBy: networkEdge.createdBy,
      metadata: networkEdge.metadata
    };
  }
  
  /**
   * Get a specific network node by ID
   */
  async getNode(id: string): Promise<NetworkNode | null> {
    try {
      const nodeEntity = await storageOrchestrator.getEntity<NodeEntity>(id);
      
      if (!nodeEntity || nodeEntity.type !== 'node_entity') {
        return null;
      }
      
      return this.transformNodeEntityToNetworkNode(nodeEntity);
    } catch (error) {
      console.error('Error fetching network node:', error);
      return null;
    }
  }
  
  /**
   * Get a specific network edge by ID
   */
  async getEdge(id: string): Promise<NetworkEdge | null> {
    try {
      const edgeRelationship = await storageOrchestrator.getRelationship<EdgeRelationship>(id);
      
      if (!edgeRelationship || !edgeRelationship.type.startsWith('edge_')) {
        return null;
      }
      
      return this.transformEdgeRelationshipToNetworkEdge(edgeRelationship);
    } catch (error) {
      console.error('Error fetching network edge:', error);
      return null;
    }
  }
  
  /**
   * Query network nodes using filters
   */
  async queryNodes(filters: NetworkFilter[] = [], options: IntelQueryOptions = {}): Promise<NetworkNode[]> {
    try {
      // Convert network filters to intel query filters
      const queryFilters = filters.map(filter => ({
        field: filter.property,
        operator: filter.operator,
        value: filter.value
      }));
      
      // Add type filter to ensure we only get node entities
      queryFilters.push({
        field: 'type',
        operator: 'equals',
        value: 'node_entity'
      });
      
      const nodeEntities = await storageOrchestrator.queryEntities<NodeEntity>({
        ...options,
        filters: queryFilters
      });
      
      return nodeEntities.map(node => this.transformNodeEntityToNetworkNode(node));
    } catch (error) {
      console.error('Error querying network nodes:', error);
      return [];
    }
  }
  
  /**
   * Query network edges using filters
   */
  async queryEdges(filters: NetworkFilter[] = [], options: IntelQueryOptions = {}): Promise<NetworkEdge[]> {
    try {
      // Convert network filters to intel query filters
      const queryFilters = filters.map(filter => ({
        field: filter.property,
        operator: filter.operator,
        value: filter.value
      }));
      
      // Add type filter to ensure we only get edge relationships
      queryFilters.push({
        field: 'type',
        operator: 'startsWith',
        value: 'edge_'
      });
      
      const edgeRelationships = await storageOrchestrator.queryRelationships<EdgeRelationship>({
        ...options,
        filters: queryFilters
      });
      
      return edgeRelationships.map(edge => this.transformEdgeRelationshipToNetworkEdge(edge));
    } catch (error) {
      console.error('Error querying network edges:', error);
      return [];
    }
  }
  
  /**
   * Get the complete network (nodes and edges) with optional filters
   */
  async getNetwork(nodeFilters: NetworkFilter[] = [], edgeFilters: NetworkFilter[] = [], options: IntelQueryOptions = {}): Promise<NetworkData> {
    try {
      const nodes = await this.queryNodes(nodeFilters, options);
      
      // If there are nodes, get all edges connecting those nodes
      let edges: NetworkEdge[] = [];
      if (nodes.length > 0) {
        const nodeIds = nodes.map(node => node.id);
        
        // Add node ID constraints to edge filters
        const expandedEdgeFilters = [
          ...edgeFilters,
          {
            property: 'sourceId',
            operator: 'in',
            value: nodeIds
          } as NetworkFilter,
          {
            property: 'targetId',
            operator: 'in',
            value: nodeIds
          } as NetworkFilter
        ];
        
        edges = await this.queryEdges(expandedEdgeFilters, options);
      }
      
      return { nodes, edges };
    } catch (error) {
      console.error('Error fetching network data:', error);
      return { nodes: [], edges: [] };
    }
  }
  
  /**
   * Create a new network node
   */
  async createNode(node: Omit<NetworkNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<NetworkNode> {
    try {
      const nodeEntity = this.transformNetworkNodeToNodeEntity({
        ...node,
        id: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as NetworkNode);
      
      const createdEntity = await storageOrchestrator.createEntity<NodeEntity>(nodeEntity);
      return this.transformNodeEntityToNetworkNode(createdEntity);
    } catch (error) {
      console.error('Error creating network node:', error);
      throw error;
    }
  }
  
  /**
   * Create a new network edge
   */
  async createEdge(edge: Omit<NetworkEdge, 'id' | 'createdAt' | 'updatedAt'>): Promise<NetworkEdge> {
    try {
      const edgeRelationship = this.transformNetworkEdgeToEdgeRelationship({
        ...edge,
        id: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as NetworkEdge);
      
      const createdRelationship = await storageOrchestrator.createRelationship<EdgeRelationship>(edgeRelationship);
      return this.transformEdgeRelationshipToNetworkEdge(createdRelationship);
    } catch (error) {
      console.error('Error creating network edge:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing network node
   */
  async updateNode(id: string, updates: Partial<NetworkNode>): Promise<NetworkNode> {
    try {
      // First get the current node to ensure it exists
      const currentNode = await this.getNode(id);
      if (!currentNode) {
        throw new Error(`Node with ID ${id} not found`);
      }
      
      // Transform updates to entity updates
      const nodeUpdates: Partial<NodeEntity> = {};
      
      if (updates.label) {
        nodeUpdates.label = updates.label;
        nodeUpdates.title = updates.label;
      }
      
      if (updates.type) nodeUpdates.nodeType = updates.type;
      if (updates.properties) nodeUpdates.properties = updates.properties;
      if (updates.category) nodeUpdates.category = updates.category;
      if (updates.importance) nodeUpdates.importance = updates.importance;
      if (updates.notes) nodeUpdates.description = updates.notes;
      if (updates.tags) nodeUpdates.tags = updates.tags;
      if (updates.sourceReferences) nodeUpdates.sourceReferences = updates.sourceReferences;
      if (updates.classification) nodeUpdates.classification = updates.classification;
      if (updates.metadata) nodeUpdates.metadata = updates.metadata;
      
      if (updates.confidence) {
        nodeUpdates.metadata = {
          ...(nodeUpdates.metadata || {}),
          confidence: updates.confidence
        };
      }
      
      // Update the entity
      const updatedEntity = await storageOrchestrator.updateEntity<NodeEntity>(id, nodeUpdates);
      return this.transformNodeEntityToNetworkNode(updatedEntity);
    } catch (error) {
      console.error('Error updating network node:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing network edge
   */
  async updateEdge(id: string, updates: Partial<NetworkEdge>): Promise<NetworkEdge> {
    try {
      // First get the current edge to ensure it exists
      const currentEdge = await this.getEdge(id);
      if (!currentEdge) {
        throw new Error(`Edge with ID ${id} not found`);
      }
      
      // Transform updates to relationship updates
      const edgeUpdates: Partial<EdgeRelationship> = {};
      
      if (updates.label) {
        edgeUpdates.label = updates.label;
        edgeUpdates.type = `edge_${updates.label.toLowerCase().replace(/\s+/g, '_')}`;
      }
      
      if (updates.source) edgeUpdates.sourceId = updates.source;
      if (updates.target) edgeUpdates.targetId = updates.target;
      if (updates.properties) edgeUpdates.properties = updates.properties;
      if (updates.weight) edgeUpdates.weight = updates.weight;
      if (updates.directed !== undefined) edgeUpdates.directed = updates.directed;
      if (updates.confidence) edgeUpdates.confidence = updates.confidence;
      if (updates.notes) edgeUpdates.description = updates.notes;
      if (updates.tags) edgeUpdates.tags = updates.tags;
      if (updates.sourceReferences) edgeUpdates.sourceReferences = updates.sourceReferences;
      if (updates.classification) edgeUpdates.classification = updates.classification;
      if (updates.metadata) edgeUpdates.metadata = updates.metadata;
      
      // Update the relationship
      const updatedRelationship = await storageOrchestrator.updateRelationship<EdgeRelationship>(id, edgeUpdates);
      return this.transformEdgeRelationshipToNetworkEdge(updatedRelationship);
    } catch (error) {
      console.error('Error updating network edge:', error);
      throw error;
    }
  }
  
  /**
   * Delete a network node
   */
  async deleteNode(id: string): Promise<boolean> {
    try {
      // Delete the node entity
      const success = await storageOrchestrator.deleteEntity(id);
      
      // If successful, also delete all connected edges
      if (success) {
        const connectedEdges = await this.queryEdges([
          { property: 'sourceId', operator: 'equals', value: id },
          { property: 'targetId', operator: 'equals', value: id }
        ]);
        
        // Delete each connected edge
        const deletePromises = connectedEdges.map(edge => 
          storageOrchestrator.deleteRelationship(edge.id)
        );
        
        await Promise.all(deletePromises);
      }
      
      return success;
    } catch (error) {
      console.error('Error deleting network node:', error);
      return false;
    }
  }
  
  /**
   * Delete a network edge
   */
  async deleteEdge(id: string): Promise<boolean> {
    try {
      return await storageOrchestrator.deleteRelationship(id);
    } catch (error) {
      console.error('Error deleting network edge:', error);
      return false;
    }
  }
  
  /**
   * Get network statistics
   */
  async getNetworkStats(): Promise<NetworkStats> {
    try {
      // Get all nodes and edges
      const { nodes, edges } = await this.getNetwork();
      
      // Calculate node type distribution
      const nodeTypeDistribution: Record<string, number> = {};
      nodes.forEach(node => {
        nodeTypeDistribution[node.type] = (nodeTypeDistribution[node.type] || 0) + 1;
      });
      
      // Calculate edge type distribution
      const edgeTypeDistribution: Record<string, number> = {};
      edges.forEach(edge => {
        edgeTypeDistribution[edge.label] = (edgeTypeDistribution[edge.label] || 0) + 1;
      });
      
      // Calculate connectivity metrics
      const nodeDegrees = new Map<string, number>();
      nodes.forEach(node => nodeDegrees.set(node.id, 0));
      
      edges.forEach(edge => {
        nodeDegrees.set(edge.source, (nodeDegrees.get(edge.source) || 0) + 1);
        nodeDegrees.set(edge.target, (nodeDegrees.get(edge.target) || 0) + 1);
      });
      
      const degreeValues = Array.from(nodeDegrees.values());
      const averageDegree = degreeValues.reduce((sum, degree) => sum + degree, 0) / Math.max(1, degreeValues.length);
      
      // Calculate network density
      const possibleEdges = nodes.length * (nodes.length - 1);
      const density = possibleEdges > 0 ? edges.length / possibleEdges : 0;
      
      // For component count, we'd need to run a connected components algorithm
      // This is a simple approximation
      const componentCount = nodes.length - edges.length;
      
      // Get recent activity (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoStr = oneWeekAgo.toISOString();
      
      const recentNodes = nodes.filter(node => node.createdAt >= oneWeekAgoStr);
      const updatedNodes = nodes.filter(node => node.updatedAt >= oneWeekAgoStr && node.createdAt < oneWeekAgoStr);
      const recentEdges = edges.filter(edge => edge.createdAt >= oneWeekAgoStr);
      const updatedEdges = edges.filter(edge => edge.updatedAt >= oneWeekAgoStr && edge.createdAt < oneWeekAgoStr);
      
      return {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        nodeTypeDistribution,
        edgeTypeDistribution,
        connectivityMetrics: {
          averageDegree,
          density,
          componentCount: Math.max(1, componentCount)
        },
        recentActivity: {
          nodesCreated: recentNodes.length,
          edgesCreated: recentEdges.length,
          nodesUpdated: updatedNodes.length,
          edgesUpdated: updatedEdges.length
        }
      };
    } catch (error) {
      console.error('Error calculating network stats:', error);
      return {
        totalNodes: 0,
        totalEdges: 0,
        nodeTypeDistribution: {},
        edgeTypeDistribution: {},
        connectivityMetrics: {
          averageDegree: 0,
          density: 0,
          componentCount: 0
        },
        recentActivity: {
          nodesCreated: 0,
          edgesCreated: 0,
          nodesUpdated: 0,
          edgesUpdated: 0
        }
      };
    }
  }
  
  /**
   * Find paths between two nodes
   */
  async findPaths(sourceId: string, targetId: string, maxDepth: number = 3): Promise<NetworkData[]> {
    try {
      // Get the full network data
      const { nodes, edges } = await this.getNetwork();
      
      // Build an adjacency list for path finding
      const adjacencyList = new Map<string, string[]>();
      edges.forEach(edge => {
        if (!adjacencyList.has(edge.source)) {
          adjacencyList.set(edge.source, []);
        }
        adjacencyList.get(edge.source)!.push(edge.target);
        
        // If the edge is undirected, add the reverse connection
        if (!edge.directed) {
          if (!adjacencyList.has(edge.target)) {
            adjacencyList.set(edge.target, []);
          }
          adjacencyList.get(edge.target)!.push(edge.source);
        }
      });
      
      // Find all paths using BFS
      const paths: NetworkData[] = [];
      const queue: { path: string[]; depth: number }[] = [{ path: [sourceId], depth: 0 }];
      const visited = new Set<string>();
      
      while (queue.length > 0) {
        const { path, depth } = queue.shift()!;
        const currentNode = path[path.length - 1];
        
        // If we've reached the target, add this path to results
        if (currentNode === targetId) {
          // Create a network data object for this path
          const pathNodeIds = new Set(path);
          const pathNodes = nodes.filter(node => pathNodeIds.has(node.id));
          
          const pathEdges = edges.filter(edge => {
            // Only include edges that connect nodes in this path
            if (!pathNodeIds.has(edge.source) || !pathNodeIds.has(edge.target)) {
              return false;
            }
            
            // Check if the edge connects consecutive nodes in the path
            for (let i = 0; i < path.length - 1; i++) {
              if (
                (edge.source === path[i] && edge.target === path[i + 1]) ||
                (!edge.directed && edge.source === path[i + 1] && edge.target === path[i])
              ) {
                return true;
              }
            }
            
            return false;
          });
          
          paths.push({ nodes: pathNodes, edges: pathEdges });
          continue;
        }
        
        // Don't explore further if we've reached max depth
        if (depth >= maxDepth) {
          continue;
        }
        
        // Mark this node as visited
        visited.add(currentNode);
        
        // Get neighbors of the current node
        const neighbors = adjacencyList.get(currentNode) || [];
        
        // Explore each neighbor
        for (const neighbor of neighbors) {
          // Skip if we've already visited this neighbor or it's already in the current path
          if (visited.has(neighbor) || path.includes(neighbor)) {
            continue;
          }
          
          // Add this neighbor to the path and queue
          queue.push({
            path: [...path, neighbor],
            depth: depth + 1
          });
        }
      }
      
      return paths;
    } catch (error) {
      console.error('Error finding paths between nodes:', error);
      return [];
    }
  }
  
  /**
   * Find patterns in the network that match a given pattern
   */
  async findPatterns(patternId: string): Promise<PatternMatchResult> {
    // This is a placeholder implementation that would need to be expanded
    // with actual pattern matching algorithms
    try {
      return {
        patternId,
        matches: [] // Would contain actual pattern matches in a real implementation
      };
    } catch (error) {
      console.error('Error finding patterns:', error);
      return {
        patternId,
        matches: []
      };
    }
  }
}

// Export a singleton instance
export const netRunnerAdapter = new NetRunnerAdapter();
