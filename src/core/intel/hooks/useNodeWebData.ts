/**
 * useNodeWebData - Hook for NodeWeb visualization with IntelDataCore
 * 
 * This hook provides access to the NodeWeb data from IntelDataCore
 * for use in React components.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  nodeWebAdapter, 
  NodeWebGraph, 
  NodeWebStats,
  NodeWebFilter
} from '../adapters/nodeWebAdapter';
import { NodeEntity, EdgeRelationship } from '../types/intelDataModels';

export interface UseNodeWebDataResult {
  // Graph data
  graph: NodeWebGraph;
  stats: NodeWebStats;
  loading: boolean;
  error: string | null;
  
  // Actions
  applyFilters: (filters: NodeWebFilter[]) => Promise<void>;
  refreshData: () => Promise<void>;
  addNode: (node: Partial<NodeEntity>) => Promise<string | null>;
  updateNode: (id: string, updates: Partial<NodeEntity>) => Promise<boolean>;
  deleteNode: (id: string) => Promise<boolean>;
  addEdge: (edge: Partial<EdgeRelationship>) => Promise<string | null>;
}

/**
 * Hook for accessing and manipulating NodeWeb data
 */
export function useNodeWebData(initialFilters: NodeWebFilter[] = []): UseNodeWebDataResult {
  const [graph, setGraph] = useState<NodeWebGraph>({ nodes: [], edges: [] });
  const [stats, setStats] = useState<NodeWebStats>({
    totalNodes: 0,
    totalEdges: 0,
    nodeTypes: {},
    edgeTypes: {}
  });
  const [filters, setFilters] = useState<NodeWebFilter[]>(initialFilters);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Load graph data based on current filters
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch graph data
      const graphData = await nodeWebAdapter.getGraphData(filters);
      setGraph(graphData);
      
      // Fetch graph statistics
      const statsData = await nodeWebAdapter.getGraphStats(filters);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred loading graph data');
      console.error('Error loading NodeWeb data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  /**
   * Apply new filters and reload data
   */
  const applyFilters = useCallback(async (newFilters: NodeWebFilter[]) => {
    setFilters(newFilters);
  }, []);
  
  /**
   * Add a new node to the graph
   */
  const addNode = useCallback(async (node: Partial<NodeEntity>) => {
    try {
      const nodeId = await nodeWebAdapter.addNode(node);
      if (nodeId) {
        // Refresh data after adding the node
        await loadData();
      }
      return nodeId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred adding a node');
      console.error('Error adding node:', err);
      return null;
    }
  }, [loadData]);
  
  /**
   * Update an existing node
   */
  const updateNode = useCallback(async (id: string, updates: Partial<NodeEntity>) => {
    try {
      const success = await nodeWebAdapter.updateNode(id, updates);
      if (success) {
        // Refresh data after updating the node
        await loadData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred updating a node');
      console.error('Error updating node:', err);
      return false;
    }
  }, [loadData]);
  
  /**
   * Delete a node from the graph
   */
  const deleteNode = useCallback(async (id: string) => {
    try {
      const success = await nodeWebAdapter.deleteNode(id);
      if (success) {
        // Refresh data after deleting the node
        await loadData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred deleting a node');
      console.error('Error deleting node:', err);
      return false;
    }
  }, [loadData]);
  
  /**
   * Add a new edge to the graph
   */
  const addEdge = useCallback(async (edge: Partial<EdgeRelationship>) => {
    try {
      const edgeId = await nodeWebAdapter.addEdge(edge);
      if (edgeId) {
        // Refresh data after adding the edge
        await loadData();
      }
      return edgeId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred adding an edge');
      console.error('Error adding edge:', err);
      return null;
    }
  }, [loadData]);
  
  /**
   * Load data when component mounts or filters change
   */
  useEffect(() => {
    loadData();
  }, [loadData, filters]);
  
  return {
    graph,
    stats,
    loading,
    error,
    applyFilters,
    refreshData: loadData,
    addNode,
    updateNode,
    deleteNode,
    addEdge
  };
}

export default useNodeWebData;
