/**
 * useNetRunnerData - React hook for NetRunner integration
 * 
 * This hook provides access to network data from the NetRunner module
 * via the NetRunnerAdapter. It manages state, real-time updates, and
 * network operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  netRunnerAdapter, 
  NetworkNode, 
  NetworkEdge,
  NetworkData,
  NetworkFilter,
  NetworkStats,
  PatternMatchResult
} from '../adapters/netRunnerAdapter';
import { enhancedEventEmitter } from '../events/enhancedEventEmitter';
import { IntelQueryOptions } from '../types/intelDataModels';

/**
 * Hook for using NetRunner data in React components
 */
export function useNetRunnerData(initialFilters: NetworkFilter[] = [], initialOptions: IntelQueryOptions = {}) {
  // Network data state
  const [networkData, setNetworkData] = useState<NetworkData>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<NetworkEdge | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Query parameters
  const [filters, setFilters] = useState<NetworkFilter[]>(initialFilters);
  const [options, setOptions] = useState<IntelQueryOptions>(initialOptions);
  
  /**
   * Load network data based on current filters and options
   */
  const loadNetworkData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await netRunnerAdapter.getNetwork(filters, [], options);
      setNetworkData(data);
      
      // Also update stats
      const stats = await netRunnerAdapter.getNetworkStats();
      setNetworkStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred loading network data');
      console.error('Error loading network data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, options]);
  
  /**
   * Initialize data loading and set up event listeners
   */
  useEffect(() => {
    // Load initial data
    loadNetworkData();
    
    // Set up event listeners for real-time updates
    const nodeCreatedListener = enhancedEventEmitter.on('network:node:created', (event) => {
      setNetworkData(prev => ({
        nodes: [...prev.nodes, event.node],
        edges: prev.edges
      }));
    });
    
    const nodeUpdatedListener = enhancedEventEmitter.on('network:node:updated', (event) => {
      setNetworkData(prev => ({
        nodes: prev.nodes.map(node => node.id === event.nodeId ? event.node : node),
        edges: prev.edges
      }));
      
      // Update selected node if it was the one updated
      if (selectedNode && selectedNode.id === event.nodeId) {
        setSelectedNode(event.node);
      }
    });
    
    const nodeDeletedListener = enhancedEventEmitter.on('network:node:deleted', (event) => {
      setNetworkData(prev => ({
        nodes: prev.nodes.filter(node => node.id !== event.nodeId),
        edges: prev.edges.filter(edge => 
          edge.source !== event.nodeId && edge.target !== event.nodeId
        )
      }));
      
      // Clear selected node if it was the one deleted
      if (selectedNode && selectedNode.id === event.nodeId) {
        setSelectedNode(null);
      }
    });
    
    const edgeCreatedListener = enhancedEventEmitter.on('network:edge:created', (event) => {
      setNetworkData(prev => ({
        nodes: prev.nodes,
        edges: [...prev.edges, event.edge]
      }));
    });
    
    const edgeUpdatedListener = enhancedEventEmitter.on('network:edge:updated', (event) => {
      setNetworkData(prev => ({
        nodes: prev.nodes,
        edges: prev.edges.map(edge => edge.id === event.edgeId ? event.edge : edge)
      }));
      
      // Update selected edge if it was the one updated
      if (selectedEdge && selectedEdge.id === event.edgeId) {
        setSelectedEdge(event.edge);
      }
    });
    
    const edgeDeletedListener = enhancedEventEmitter.on('network:edge:deleted', (event) => {
      setNetworkData(prev => ({
        nodes: prev.nodes,
        edges: prev.edges.filter(edge => edge.id !== event.edgeId)
      }));
      
      // Clear selected edge if it was the one deleted
      if (selectedEdge && selectedEdge.id === event.edgeId) {
        setSelectedEdge(null);
      }
    });
    
    // Clean up event listeners on unmount
    return () => {
      nodeCreatedListener.unsubscribe();
      nodeUpdatedListener.unsubscribe();
      nodeDeletedListener.unsubscribe();
      edgeCreatedListener.unsubscribe();
      edgeUpdatedListener.unsubscribe();
      edgeDeletedListener.unsubscribe();
    };
  }, [loadNetworkData, selectedNode, selectedEdge]);
  
  /**
   * Create a new network node
   */
  const createNode = useCallback(async (node: Omit<NetworkNode, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      const createdNode = await netRunnerAdapter.createNode(node);
      return createdNode;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred creating node');
      console.error('Error creating node:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Create a new network edge
   */
  const createEdge = useCallback(async (edge: Omit<NetworkEdge, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      const createdEdge = await netRunnerAdapter.createEdge(edge);
      return createdEdge;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred creating edge');
      console.error('Error creating edge:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Update an existing network node
   */
  const updateNode = useCallback(async (id: string, updates: Partial<NetworkNode>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedNode = await netRunnerAdapter.updateNode(id, updates);
      return updatedNode;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred updating node');
      console.error('Error updating node:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Update an existing network edge
   */
  const updateEdge = useCallback(async (id: string, updates: Partial<NetworkEdge>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedEdge = await netRunnerAdapter.updateEdge(id, updates);
      return updatedEdge;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred updating edge');
      console.error('Error updating edge:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Delete a network node
   */
  const deleteNode = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const success = await netRunnerAdapter.deleteNode(id);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred deleting node');
      console.error('Error deleting node:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Delete a network edge
   */
  const deleteEdge = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const success = await netRunnerAdapter.deleteEdge(id);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred deleting edge');
      console.error('Error deleting edge:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Set network filters and reload data
   */
  const setNetworkFilters = useCallback((newFilters: NetworkFilter[]) => {
    setFilters(newFilters);
  }, []);
  
  /**
   * Set query options and reload data
   */
  const setQueryOptions = useCallback((newOptions: IntelQueryOptions) => {
    setOptions(newOptions);
  }, []);
  
  /**
   * Find paths between two nodes
   */
  const findPaths = useCallback(async (sourceId: string, targetId: string, maxDepth: number = 3) => {
    try {
      setLoading(true);
      setError(null);
      const paths = await netRunnerAdapter.findPaths(sourceId, targetId, maxDepth);
      return paths;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred finding paths');
      console.error('Error finding paths:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Find patterns in the network
   */
  const findPatterns = useCallback(async (patternId: string): Promise<PatternMatchResult> => {
    try {
      setLoading(true);
      setError(null);
      const patterns = await netRunnerAdapter.findPatterns(patternId);
      return patterns;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred finding patterns');
      console.error('Error finding patterns:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Refresh network data
   */
  const refreshNetworkData = useCallback(() => {
    loadNetworkData();
  }, [loadNetworkData]);
  
  /**
   * Get network statistics
   */
  const refreshNetworkStats = useCallback(async () => {
    try {
      setLoading(true);
      const stats = await netRunnerAdapter.getNetworkStats();
      setNetworkStats(stats);
      return stats;
    } catch (err) {
      console.error('Error getting network stats:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Effect to update stats when network data changes significantly
  useEffect(() => {
    // Only refresh stats when node or edge count changes significantly
    const nodeCount = networkData.nodes.length;
    const edgeCount = networkData.edges.length;
    
    if (
      !networkStats || 
      Math.abs(networkStats.totalNodes - nodeCount) > 5 || 
      Math.abs(networkStats.totalEdges - edgeCount) > 5
    ) {
      refreshNetworkStats();
    }
  }, [networkData, networkStats, refreshNetworkStats]);
  
  return {
    // Data
    networkData,
    selectedNode,
    selectedEdge,
    networkStats,
    loading,
    error,
    filters,
    options,
    
    // Actions
    setSelectedNode,
    setSelectedEdge,
    createNode,
    createEdge,
    updateNode,
    updateEdge,
    deleteNode,
    deleteEdge,
    setNetworkFilters,
    setQueryOptions,
    findPaths,
    findPatterns,
    refreshNetworkData,
    refreshNetworkStats
  };
}

export default useNetRunnerData;
