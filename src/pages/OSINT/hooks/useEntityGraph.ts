/**
 * useEntityGraph Hook
 * 
 * Custom hook for entity graph visualization. Provides graph data management,
 * node expansion, and path finding functionality.
 */

import { useState, useCallback, useEffect } from 'react';
import { graphService, GraphData, ExpansionOptions } from '../services/graph/graphService';
import { ErrorDetail, createErrorDetail } from '../types/errors';

interface UseEntityGraphOptions {
  investigationId?: string;
  autoLoad?: boolean;
}

interface UseEntityGraphResult {
  graphData: GraphData;
  loading: boolean;
  error: ErrorDetail | null;
  expandNode: (nodeId: string) => Promise<void>;
  findPath: (sourceId: string, targetId: string) => Promise<void>;
  refreshGraph: () => Promise<void>;
  selectedNode: string | null;
  setSelectedNode: (nodeId: string | null) => void;
  isExpanding: boolean;
  isFindingPath: boolean;
  loadingOperations: Record<string, boolean>;
}

// Operation types for tracking loading state
type OperationType = 'loadGraph' | 'expandNode' | 'findPath';

/**
 * Custom hook for entity graph visualization
 */
export function useEntityGraph({
  investigationId,
  autoLoad = true
}: UseEntityGraphOptions = {}): UseEntityGraphResult {
  // State management
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loadingOperations, setLoadingOperations] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<ErrorDetail | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  // Helper to determine if any operation is loading
  const isLoading = Object.values(loadingOperations).some(Boolean);
  // Specific loading states
  const isExpanding = loadingOperations['expandNode'] || false;
  const isFindingPath = loadingOperations['findPath'] || false;
  
  // Set loading state for a specific operation
  const setOperationLoading = useCallback((operation: OperationType, isLoading: boolean) => {
    setLoadingOperations(prev => ({
      ...prev,
      [operation]: isLoading
    }));
  }, []);
  
  // Load graph data on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad) {
      refreshGraph();
    }
  }, [autoLoad, investigationId]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Refresh graph data
  const refreshGraph = useCallback(async () => {
    setOperationLoading('loadGraph', true);
    setError(null);
    
    try {
      const result = await graphService.getGraphData(investigationId);
      
      if ('nodes' in result) {
        setGraphData(result);
      } else {
        setError(result);
      }
    } catch (err) {
      setError(createErrorDetail(
        'Unexpected error loading graph data',
        {
          operation: 'refreshGraph',
          component: 'useEntityGraph',
          originalError: err instanceof Error ? err : undefined,
          recoverable: true,
          retryable: true,
          userActions: ['Try refreshing the graph', 'Check your network connection']
        }
      ));
    } finally {
      setOperationLoading('loadGraph', false);
    }
  }, [investigationId, setOperationLoading]);
  
  // Expand a node to show related entities
  const expandNode = useCallback(async (nodeId: string) => {
    setOperationLoading('expandNode', true);
    setError(null);
    
    try {
      const options: ExpansionOptions = {
        nodeId,
        depth: 1,
        maxNodes: 10
      };
      
      const expansionResult = await graphService.expandNode(options);
      
      if ('nodes' in expansionResult) {
        // Merge expansion data with existing graph data
        setGraphData(prev => {
          // Create new arrays to avoid mutation
          const nodes = [...prev.nodes];
          const links = [...prev.links];
          
          // Add new nodes if they don't already exist
          expansionResult.nodes.forEach(newNode => {
            if (!nodes.some(node => node.id === newNode.id)) {
              nodes.push(newNode);
            }
          });
          
          // Add new links if they don't already exist
          expansionResult.links.forEach(newLink => {
            if (!links.some(link => link.id === newLink.id)) {
              links.push(newLink);
            }
          });
          
          return { nodes, links };
        });
        
        // Mark the expanded node
        setGraphData(prev => ({
          nodes: prev.nodes.map(node => 
            node.id === nodeId 
              ? { ...node, metadata: { ...node.metadata, expanded: true } }
              : node
          ),
          links: prev.links
        }));
      } else {
        setError(expansionResult);
      }
    } catch (err) {
      setError(createErrorDetail(
        'Error expanding node',
        {
          operation: 'expandNode',
          component: 'useEntityGraph',
          originalError: err instanceof Error ? err : undefined,
          recoverable: true,
          retryable: true,
          context: { nodeId },
          userActions: ['Try expanding a different node', 'Refresh the graph data']
        }
      ));
    } finally {
      setOperationLoading('expandNode', false);
    }
  }, [setOperationLoading]);
  
  // Find paths between two nodes
  const findPath = useCallback(async (sourceId: string, targetId: string) => {
    setOperationLoading('findPath', true);
    setError(null);
    
    try {
      const pathResult = await graphService.findPaths(sourceId, targetId);
      
      if ('nodes' in pathResult) {
        // Merge path data with existing graph data
        setGraphData(prev => {
          // Create new arrays to avoid mutation
          const nodes = [...prev.nodes];
          const links = [...prev.links];
          
          // Add new nodes if they don't already exist
          pathResult.nodes.forEach(newNode => {
            if (!nodes.some(node => node.id === newNode.id)) {
              nodes.push(newNode);
            }
          });
          
          // Add new links if they don't already exist
          pathResult.links.forEach(newLink => {
            if (!links.some(link => link.id === newLink.id)) {
              links.push(newLink);
            }
          });
          
          return { nodes, links };
        });
        
        // Highlight the path
        setGraphData(prev => ({
          nodes: prev.nodes.map(node => {
            const isInPath = node.id === sourceId || node.id === targetId || 
                          pathResult.nodes.some(pathNode => pathNode.id === node.id);
            
            return {
              ...node,
              color: isInPath ? '#f39c12' : node.color // Highlight nodes in path
            };
          }),
          links: prev.links.map(link => {
            const isInPath = pathResult.links.some(pathLink => pathLink.id === link.id);
            
            return {
              ...link,
              color: isInPath ? '#f39c12' : link.color // Highlight links in path
            };
          })
        }));
      } else {
        setError(pathResult);
      }
    } catch (err) {
      setError(createErrorDetail(
        'Error finding path between nodes',
        {
          operation: 'findPath',
          component: 'useEntityGraph',
          originalError: err instanceof Error ? err : undefined,
          recoverable: true,
          retryable: true,
          context: { sourceId, targetId },
          userActions: ['Try with different nodes', 'Refresh the graph data']
        }
      ));
    } finally {
      setOperationLoading('findPath', false);
    }
  }, [setOperationLoading]);
  
  return {
    graphData,
    loading: isLoading,
    error,
    expandNode,
    findPath,
    refreshGraph,
    selectedNode,
    setSelectedNode,
    isExpanding,
    isFindingPath,
    loadingOperations
  };
}
