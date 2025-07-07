/**
 * useNodeWeb Hook
 * 
 * Custom hook for NodeWeb functionality, refactored from OSINT module.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Node,
  Edge,
  Network,
  NetworkStats,
  NodeFilter,
  NodeDetail,
  VisualizationOptions,
  ExportOptions,
  ImportOptions
} from '../types/nodeWeb';
import { nodeWebService } from '../services/nodeWebService';

interface UseNodeWebOptions {
  initialFilter?: NodeFilter;
  autoLoad?: boolean;
}

interface UseNodeWebResult {
  // Network data
  nodes: Node[];
  edges: Edge[];
  network: Network;
  stats: NetworkStats;
  
  // Loading state
  loading: boolean;
  error: Error | null;
  
  // Node selection
  selectedNodeId: string | null;
  selectedNode: NodeDetail | null;
  setSelectedNodeId: (id: string | null) => void;
  
  // Filtering
  filter: NodeFilter;
  updateFilter: (changes: Partial<NodeFilter>) => void;
  applyFilter: () => void;
  resetFilter: () => void;
  filteredNodes: Node[];
  filteredEdges: Edge[];
  
  // Visualization
  visualizationOptions: VisualizationOptions;
  updateVisualizationOptions: (changes: Partial<VisualizationOptions>) => void;
  
  // Export/Import
  exportNetwork: (options: ExportOptions) => string;
  importNetwork: (data: string, options: ImportOptions) => boolean;
  
  // Refresh data
  refreshData: () => void;
}

/**
 * Hook for NodeWeb functionality
 */
export function useNodeWeb({
  initialFilter = {},
  autoLoad = true
}: UseNodeWebOptions = {}): UseNodeWebResult {
  // Network data state
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [stats, setStats] = useState<NetworkStats>({
    nodeCount: 0,
    edgeCount: 0,
    threatNodeCount: 0,
    criticalNodeCount: 0,
    clusterCount: 0,
    density: 0,
    averageDegree: 0
  });
  
  // Loading state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Node selection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeDetail | null>(null);
  
  // Filtering
  const [filter, setFilter] = useState<NodeFilter>({
    types: [],
    tags: [],
    minConfidence: 0,
    minThreatLevel: 0,
    maxDepth: 3,
    search: '',
    showUnconfirmed: true,
    ...initialFilter
  });
  
  const [filteredNodes, setFilteredNodes] = useState<Node[]>([]);
  const [filteredEdges, setFilteredEdges] = useState<Edge[]>([]);
  
  // Visualization options
  const [visualizationOptions, setVisualizationOptions] = useState<VisualizationOptions>({
    viewType: 'threeD',
    layout: 'force',
    colorBy: 'type',
    sizeBy: 'connections',
    showLabels: true,
    showEdges: true,
    clusterNodes: false,
    highlightConnections: true
  });
  
  // Update filter with partial changes
  const updateFilter = useCallback((changes: Partial<NodeFilter>) => {
    setFilter(prev => ({ ...prev, ...changes }));
  }, []);
  
  // Apply current filter
  const applyFilter = useCallback(() => {
    try {
      const filtered = nodeWebService.filterNodes(filter);
      setFilteredNodes(filtered);
      
      if (filtered.length > 0) {
        const nodeIds = filtered.map(node => node.id);
        const relatedEdges = nodeWebService.getEdgesForNodes(nodeIds);
        setFilteredEdges(relatedEdges);
      } else {
        setFilteredEdges([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [filter]);
  
  // Reset filter to defaults
  const resetFilter = useCallback(() => {
    setFilter({
      types: [],
      tags: [],
      minConfidence: 0,
      minThreatLevel: 0,
      maxDepth: 3,
      search: '',
      showUnconfirmed: true
    });
  }, []);
  
  // Update visualization options
  const updateVisualizationOptions = useCallback((changes: Partial<VisualizationOptions>) => {
    setVisualizationOptions(prev => ({ ...prev, ...changes }));
  }, []);
  
  // Load network data
  const loadNetworkData = useCallback(() => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all network data
      const allNodes = nodeWebService.getNodes();
      const allEdges = nodeWebService.getEdges();
      const networkStats = nodeWebService.getNetworkStats();
      
      setNodes(allNodes);
      setEdges(allEdges);
      setStats(networkStats);
      
      // Apply initial filtering
      const filtered = nodeWebService.filterNodes(filter);
      setFilteredNodes(filtered);
      
      if (filtered.length > 0) {
        const nodeIds = filtered.map(node => node.id);
        const relatedEdges = nodeWebService.getEdgesForNodes(nodeIds);
        setFilteredEdges(relatedEdges);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, [filter]);
  
  // Load node details when selected node changes
  useEffect(() => {
    if (selectedNodeId) {
      try {
        const nodeDetail = nodeWebService.getNodeDetail(selectedNodeId);
        setSelectedNode(nodeDetail || null);
      } catch (err) {
        console.error('Error loading node detail:', err);
        setSelectedNode(null);
      }
    } else {
      setSelectedNode(null);
    }
  }, [selectedNodeId]);
  
  // Initial data load
  useEffect(() => {
    if (autoLoad) {
      loadNetworkData();
    }
  }, [autoLoad, loadNetworkData]);
  
  // Export network data
  const exportNetwork = useCallback((options: ExportOptions): string => {
    try {
      return nodeWebService.exportNetwork(options);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return '';
    }
  }, []);
  
  // Import network data
  const importNetwork = useCallback((data: string, options: ImportOptions): boolean => {
    try {
      const result = nodeWebService.importNetwork(data, options);
      if (result) {
        loadNetworkData();
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, [loadNetworkData]);
  
  // Computed network property
  const network: Network = {
    nodes: filteredNodes,
    edges: filteredEdges
  };
  
  return {
    // Network data
    nodes,
    edges,
    network,
    stats,
    
    // Loading state
    loading,
    error,
    
    // Node selection
    selectedNodeId,
    selectedNode,
    setSelectedNodeId,
    
    // Filtering
    filter,
    updateFilter,
    applyFilter,
    resetFilter,
    filteredNodes,
    filteredEdges,
    
    // Visualization
    visualizationOptions,
    updateVisualizationOptions,
    
    // Export/Import
    exportNetwork,
    importNetwork,
    
    // Refresh data
    refreshData: loadNetworkData
  };
}
