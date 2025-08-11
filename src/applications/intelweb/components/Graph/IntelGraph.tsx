/**
 * IntelGraph - Main Graph Visualization Component
 * 
 * Phase 3: D3.js force-directed graph with intelligence-specific features
 * Supports 2D/3D modes and optimized for 1000+ nodes
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { VirtualFileSystem, VirtualFile } from '../../../../types/DataPack';
import { GraphEngine2D } from './GraphEngine2D';
import { GraphControls } from './GraphControls';
import { GraphContext } from './GraphContext';

// Graph data interfaces
export interface IntelNode extends d3.SimulationNodeDatum {
  id: string;
  type: 'report' | 'entity' | 'location' | 'event' | 'source';
  confidence: number; // 0-1, affects node opacity
  title: string;
  description?: string;
  timestamp?: Date;
  location?: [number, number]; // lat, lng
  tags: string[];
  metadata: Record<string, unknown>;
  degree?: number; // computed structural degree (for sizing / label LOD)
  
  // Graph properties
  x?: number;
  y?: number;
  z?: number; // For 3D mode
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
  
  // Visualization
  color?: string;
  size?: number;
  group?: string;
  file?: VirtualFile; // Associated file
}

export interface IntelEdge {
  id: string;
  source: string | IntelNode;
  target: string | IntelNode;
  type: 'reference' | 'temporal' | 'spatial' | 'causal' | 'similar';
  weight: number; // 0-1, affects edge thickness
  confidence: number; // 0-1, affects edge opacity
  description?: string;
  metadata: Record<string, unknown>;
}

export interface GraphData {
  nodes: IntelNode[];
  edges: IntelEdge[];
}

// Alias for compatibility
export type IntelGraphData = GraphData;

export interface GraphFilters {
  confidenceRange: [number, number];
  nodeTypes: string[];
  edgeTypes: string[];
  timeRange?: [Date, Date];
  searchQuery?: string;
}

export interface PhysicsSettings {
  charge: number;
  linkDistance: number;
  linkStrength: number;
  friction: number;
  alpha: number;
  alphaDecay: number;
  gravity: number;
  theta: number;
}

export interface IntelGraphProps {
  vault: VirtualFileSystem;
  initialGraph?: GraphData; // new optional injected graph data
  selectedFile?: VirtualFile | null;
  onFileSelect?: (file: VirtualFile) => void;
  onNodeSelect?: (node: IntelNode) => void;
  width?: number;
  height?: number;
  className?: string;
}

export const IntelGraph: React.FC<IntelGraphProps> = ({
  vault,
  initialGraph,
  selectedFile: _selectedFile,
  onFileSelect,
  onNodeSelect,
  width: _width = 800,
  height: _height = 600,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphMode, setGraphMode] = useState<'2d' | '3d'>('2d'); // 3D disabled until engine implemented (Phase 4+)
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [fullGraph, setFullGraph] = useState<GraphData | null>(null); // base filtered graph prior to isolate
  const [activeGraph, setActiveGraph] = useState<GraphData | null>(null); // graph after isolate (or full)
  const [isolateState, setIsolateState] = useState<{ rootId: string | null; depth: number; active: boolean }>({ rootId: null, depth: 1, active: false });
  const [sizingMode, setSizingMode] = useState<'degree' | 'confidence'>('degree');
  const degreeCalcRef = useRef<string>('');
  const storageVersion = 'v1';
  const [filters, setFilters] = useState<GraphFilters>({
    // Removed classification filters for OSINT use
    confidenceRange: [0.3, 1.0],
    nodeTypes: ['report', 'entity', 'location', 'event', 'source'],
    edgeTypes: ['reference', 'temporal', 'spatial']
  } as any);
  const [physics, setPhysics] = useState<PhysicsSettings>({
    charge: -300,
    linkDistance: 80,
    linkStrength: 0.1,
    friction: 0.9,
    alpha: 1,
    alphaDecay: 0.0228,
    gravity: 0.1,
    theta: 0.8
  });
  const [selectedNode, setSelectedNode] = useState<IntelNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<IntelEdge | null>(null);
  const [_highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [frozen, setFrozen] = useState(false);

  // Persist/restore node positions (simple localStorage by file id)
  const POSITION_KEY = React.useMemo(() => {
    try {
      const ids = Array.from(vault.fileIndex.keys()).sort().join('|');
      let hash = 0;
      for (let i = 0; i < ids.length; i++) { hash = ((hash << 5) - hash) + ids.charCodeAt(i); hash |= 0; }
      return `intelweb:${storageVersion}:${hash}:positions`;
    } catch { return `intelweb:${storageVersion}:default:positions`; }
  }, [vault]);

  // migrate legacy key once
  useEffect(() => {
    try {
      const migrated = localStorage.getItem(`${POSITION_KEY}:migrated`);
      if (!migrated) {
        const legacyKey = POSITION_KEY.replace(`intelweb:${storageVersion}:`, 'intelweb.');
        const legacy = localStorage.getItem(legacyKey);
        if (legacy) {
          const existing = localStorage.getItem(POSITION_KEY);
          if (!existing) localStorage.setItem(POSITION_KEY, legacy);
          console.log('[IntelWeb] Migrated node positions to namespaced key');
        }
        localStorage.setItem(`${POSITION_KEY}:migrated`, '1');
      }
    } catch {}
  }, [POSITION_KEY]);

  const savePositions = useCallback((data: GraphData) => {
    const positions: Record<string, { x: number; y: number }> = {};
    data.nodes.forEach(n => {
      if (typeof n.x === 'number' && typeof n.y === 'number') positions[n.id] = { x: n.x, y: n.y };
    });
    try { localStorage.setItem(POSITION_KEY, JSON.stringify(positions)); } catch {}
  }, [POSITION_KEY]);

  const resetPositions = useCallback(() => {
    try { localStorage.removeItem(POSITION_KEY); } catch {}
    setFrozen(false);
    setGraphData(prev => ({ ...prev, nodes: prev.nodes.map(n => ({ ...n, fx: null, fy: null })) }));
  }, [POSITION_KEY]);

  const loadPositions = useCallback((): Record<string, { x: number; y: number }> => {
    try {
      const raw = localStorage.getItem(POSITION_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, [POSITION_KEY]);

  // Graph size limits for performance
  const MAX_NODES = 5000;
  const _MAX_EDGES = 10000;
  const _WARNING_THRESHOLD = 1000;

  // Convert VirtualFileSystem to graph data with size limits
  const convertVaultToGraph = useCallback((vault: VirtualFileSystem): GraphData => {
    const nodes: IntelNode[] = [];
    const edges: IntelEdge[] = [];
    const nodeMap = new Map<string, IntelNode>();
    const edgeSet = new Set<string>();

    const filesArray = Array.from(vault.fileIndex.values());
    if (filesArray.length > MAX_NODES) {
      console.warn(`Graph too large: ${filesArray.length} nodes exceeds limit of ${MAX_NODES}. Truncating...`);
    }
    const limitedFiles = filesArray.slice(0, MAX_NODES);

    // Create nodes from files
    limitedFiles.forEach((file) => {
      const nodeId = file.path;
      let nodeType: IntelNode['type'] = 'report';
      if (file.frontmatter?.type === 'entity') nodeType = 'entity';
      else if (file.frontmatter?.type === 'location') nodeType = 'location';
      else if (file.frontmatter?.type === 'event') nodeType = 'event';
      else if (file.frontmatter?.type === 'source') nodeType = 'source';

      // Removed classification handling

      const rawConfidence = file.frontmatter?.confidence;
      const confidence = typeof rawConfidence === 'number' && rawConfidence >= 0 && rawConfidence <= 1
        ? rawConfidence
        : (file.modifiedAt ? 0.8 : 0.5);

      const node: IntelNode = {
        id: nodeId,
        type: nodeType,
        // classification removed
        confidence,
        title: file.name,
        description: file.frontmatter?.description || '',
        timestamp: file.modifiedAt ? new Date(file.modifiedAt) : undefined,
        location: file.frontmatter?.coordinates,
        tags: file.hashtags || [],
        metadata: file.frontmatter || {},
        file,
        color: getNodeColor(nodeType),
        size: Math.max(8, Math.min(20, (confidence * 15) + 5)),
        group: nodeType
      };

      nodes.push(node);
      nodeMap.set(nodeId, node);
    });

    // Prefer explicit relationshipGraph edges
    if (vault.relationshipGraph && vault.relationshipGraph.length > 0) {
      vault.relationshipGraph.forEach(relationship => {
        const sourceId = relationship.source;
        const targetId = relationship.target;
        const sourceNode = nodeMap.get(sourceId);
        const targetNode = nodeMap.get(targetId);
        if (!sourceNode || !targetNode) return;

        const predicate = (relationship.metadata && (relationship.metadata as any).predicate) as string | undefined;
        let edgeType: IntelEdge['type'] = 'reference';
        if (predicate === 'located_at' || predicate === 'observed_at') edgeType = 'spatial';
        else if (predicate === 'temporal' || predicate === 'occurred_at') edgeType = 'temporal';

        const edgeId = `${sourceId}-${targetId}-${predicate || relationship.type}`;
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          edges.push({
            id: edgeId,
            source: sourceId,
            target: targetId,
            type: edgeType,
            weight: relationship.strength || 0.5,
            confidence: Math.min(sourceNode.confidence, targetNode.confidence),
            metadata: relationship.metadata || {}
          });
        }
      });
    }

    // Add wikilink-derived edges only if not already present
    nodes.forEach(node => {
      const file = node.file!;
      if (typeof file.content !== 'string') return;
      const references = extractFileReferences(file.content, vault);
      references.forEach(refPath => {
        const targetNode = nodeMap.get(refPath);
        if (!targetNode || targetNode.id === node.id) return;
        const edgeId = `${node.id}->${targetNode.id}`;
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          edges.push({
            id: edgeId,
            source: node.id,
            target: targetNode.id,
            type: 'reference',
            weight: 0.5,
            confidence: Math.min(node.confidence, targetNode.confidence),
            metadata: { derivedFrom: 'wikilink' }
          });
        }
      });
    });

    console.log(`🔗 Graph created: ${nodes.length} nodes, ${edges.length} edges`);
    return { nodes, edges };
  }, []);

  // Filter graph data based on current filters
  const filterGraphData = useCallback((data: GraphData, filters: GraphFilters): GraphData => {
    const filteredNodes = data.nodes.filter(node => {
      if (node.confidence < filters.confidenceRange[0] || node.confidence > filters.confidenceRange[1]) return false;
      if (!filters.nodeTypes.includes(node.type)) return false;
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!node.title.toLowerCase().includes(query) &&
            !node.description?.toLowerCase().includes(query) &&
            !node.tags.some(tag => tag.toLowerCase().includes(query))) {
          return false;
        }
      }
      // NOTE: Do NOT exclude nodes outside timeRange; they will be visually dimmed in engine (temporal context) instead of removed.
      // if (filters.timeRange && node.timestamp) {
      //   if (node.timestamp < filters.timeRange[0] || node.timestamp > filters.timeRange[1]) return false;
      // }
      return true;
    });

    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = data.edges.filter(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) return false;
      if (!filters.edgeTypes.includes(edge.type)) return false;
      if (edge.confidence < filters.confidenceRange[0] || edge.confidence > filters.confidenceRange[1]) return false;
      return true;
    });

    return { nodes: filteredNodes, edges: filteredEdges };
  }, []);

  // Compute graph when vault/filters change
  useEffect(() => {
    if (initialGraph) {
      console.log('[IntelWeb] Using injected initialGraph (bypassing vault conversion)');
      const filtered = filterGraphData(initialGraph, filters);
      setGraphData(filtered);
      setFullGraph(filtered);
      setActiveGraph(filtered); // initially same
      return;
    }
    const rawData = convertVaultToGraph(vault);
    const filteredData = filterGraphData(rawData, filters);
    setGraphData(filteredData);
    setFullGraph(filteredData);
    setActiveGraph(prev => (isolateState.active ? prev : filteredData)); // if isolate active, keep until recompute
  }, [vault, filters, convertVaultToGraph, filterGraphData, initialGraph, isolateState.active]);

  // Degree computation + sizing + metrics dispatch (after filtering)
  useEffect(() => {
    if (!graphData.nodes.length) return;
    const key = `${graphData.nodes.length}|${graphData.edges.length}|${filters.searchQuery || ''}|${filters.nodeTypes.join(',')}|${filters.edgeTypes.join(',')}`;
    if (degreeCalcRef.current === key) return; // avoid repeat on same dataset
    degreeCalcRef.current = key;

    const degreeMap = new Map<string, number>();
    graphData.edges.forEach(e => {
      const s = typeof e.source === 'string' ? e.source : e.source.id;
      const t = typeof e.target === 'string' ? e.target : e.target.id;
      degreeMap.set(s, (degreeMap.get(s) || 0) + 1);
      degreeMap.set(t, (degreeMap.get(t) || 0) + 1);
    });

    const updatedNodes = graphData.nodes.map(n => {
      const d = degreeMap.get(n.id) || 0;
      const base = 8;
      const k = 6;
      let size = base + Math.log2(d + 1) * k;
      size = Math.max(8, Math.min(34, size));
      const derivedSize = sizingMode === 'degree' ? size : Math.max(8, Math.min(34, 8 + (n.confidence * 26)));
      return { ...n, size: derivedSize, degree: d };
    });

    const degrees = Array.from(degreeMap.values());
    const minDegree = degrees.length ? Math.min(...degrees) : 0;
    const maxDegree = degrees.length ? Math.max(...degrees) : 0;
    const avgDegree = degrees.length ? degrees.reduce((a,b)=>a+b,0) / degrees.length : 0;
    const topNodes = [...graphData.nodes]
      .map(n => ({ id: n.id, title: n.title, degree: degreeMap.get(n.id) || 0 }))
      .sort((a,b) => b.degree - a.degree)
      .slice(0,5);

    setGraphData(prev => ({ ...prev, nodes: updatedNodes }));

    try {
      window.dispatchEvent(new CustomEvent('intelweb:graphMetrics', { detail: {
        minDegree, maxDegree, avgDegree, topNodes,
        nodeCount: graphData.nodes.length,
        edgeCount: graphData.edges.length
      }}));
    } catch {}
  }, [graphData, filters, sizingMode]);

  // Apply saved positions once nodes exist
  useEffect(() => {
    if (!graphData.nodes.length) return;
    const saved = loadPositions();
    if (!saved) return;
    setGraphData(prev => {
      const nodes = prev.nodes.map(n => {
        const p = saved[n.id];
        if (p) {
          return { ...n, x: p.x, y: p.y, fx: frozen ? p.x : n.fx, fy: frozen ? p.y : n.fy };
        }
        return n;
      });
      return { ...prev, nodes };
    });
  }, [graphData.nodes.length, frozen, loadPositions]);

  // When toggling frozen, persist or release positions
  useEffect(() => {
    if (frozen) {
      savePositions(graphData);
      setGraphData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => ({ ...n, fx: n.x, fy: n.y }))
      }));
    } else {
      setGraphData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => ({ ...n, fx: null, fy: null }))
      }));
    }
  }, [frozen, savePositions, graphData]);

  const applyIsolate = useCallback((rootId: string, depth: number) => {
    if (!fullGraph) return;
    const t0 = performance.now();
    const adj = new Map<string, Set<string>>();
    fullGraph.edges.forEach(e => {
      const s = typeof e.source === 'string' ? e.source : e.source.id;
      const t = typeof e.target === 'string' ? e.target : e.target.id;
      if (!adj.has(s)) adj.set(s, new Set());
      if (!adj.has(t)) adj.set(t, new Set());
      adj.get(s)!.add(t); adj.get(t)!.add(s);
    });
    const visited = new Set<string>();
    const queue: { id: string; d: number }[] = [{ id: rootId, d: 0 }];
    visited.add(rootId);
    while (queue.length) {
      const { id, d } = queue.shift()!;
      if (d >= depth) continue;
      const nbrs = adj.get(id);
      if (!nbrs) continue;
      for (const n of nbrs) {
        if (!visited.has(n)) { visited.add(n); queue.push({ id: n, d: d + 1 }); }
      }
    }
    const newNodes = fullGraph.nodes.filter(n => visited.has(n.id));
    const nodeSet = new Set(newNodes.map(n => n.id));
    const newEdges = fullGraph.edges.filter(e => {
      const s = typeof e.source === 'string' ? e.source : e.source.id;
      const t = typeof e.target === 'string' ? e.target : e.target.id;
      return nodeSet.has(s) && nodeSet.has(t);
    });
    const subGraph = { nodes: newNodes, edges: newEdges };
    setActiveGraph(subGraph);
    setIsolateState({ rootId, depth, active: true });
    try { window.dispatchEvent(new CustomEvent('intelweb:isolateStateChanged', { detail: { rootId, depth, active: true } })); } catch {}
    const t1 = performance.now();
    const dt = t1 - t0;
    if (dt > 1) console.log(`[IntelWeb][Perf] BFS isolate root=${rootId} depth=${depth} took ${dt.toFixed(2)}ms (nodes=${newNodes.length} edges=${newEdges.length})`);
  }, [fullGraph]);

  const clearIsolate = useCallback(() => {
    if (fullGraph) setActiveGraph(fullGraph);
    setIsolateState({ rootId: null, depth: 1, active: false });
    try { window.dispatchEvent(new CustomEvent('intelweb:isolateStateChanged', { detail: { rootId: null, depth: 1, active: false } })); } catch {}
  }, [fullGraph]);

  // Isolate mode effects (after applyIsolate defined)
  useEffect(() => {
    if (!fullGraph || !isolateState.active) {
      setActiveGraph(fullGraph);
      return;
    }
    if (isolateState.rootId) applyIsolate(isolateState.rootId, isolateState.depth);
  }, [fullGraph, isolateState, applyIsolate]);

  // Event bridge for sidebar / other components to request isolate
  useEffect(() => {
    const handler = (e: any) => {
      const { rootId, depth } = e.detail || {};
      if (!rootId) return;
      applyIsolate(rootId, typeof depth === 'number' ? depth : 2);
    };
    const clearHandler = () => clearIsolate();
    window.addEventListener('intelweb:requestIsolate', handler);
    window.addEventListener('intelweb:clearIsolate', clearHandler);
    return () => {
      window.removeEventListener('intelweb:requestIsolate', handler);
      window.removeEventListener('intelweb:clearIsolate', clearHandler);
    };
  }, [applyIsolate, clearIsolate]);

  // Handlers
  const handleNodeClick = useCallback((node: IntelNode) => {
    setSelectedEdge(null);
    setSelectedNode(node);
    onNodeSelect?.(node);
    if (node.file && onFileSelect) onFileSelect(node.file);
    try {
      window.dispatchEvent(new CustomEvent('intelweb:nodeSelected', { detail: node }));
    } catch {}
  }, [onNodeSelect, onFileSelect]);

  const _handleNodeHover = useCallback((nodeId: string | null) => {
    setHighlightedNode(nodeId);
  }, []);

  const handleFiltersChange = useCallback((newFilters: GraphFilters) => setFilters(newFilters), []);
  const handlePhysicsChange = useCallback((newPhysics: PhysicsSettings) => setPhysics(newPhysics), []);
  const handleModeChange = useCallback((mode: '2D' | '3D') => setGraphMode(mode.toLowerCase() as '2d' | '3d'), []);

  const selectedNodes: IntelNode[] = selectedNode ? [selectedNode] : [];

  // Helper functions
  function getNodeColor(type: IntelNode['type']): string {
    const baseColors = {
      report: '#4CAF50',
      entity: '#2196F3', 
      location: '#FF9800',
      event: '#9C27B0',
      source: '#607D8B'
    };
    
    const baseColor = baseColors[type] || '#9E9E9E';
    
    return baseColor;
  }

  function extractFileReferences(content: string, vault: VirtualFileSystem): string[] {
    const references: string[] = [];
    
    // Look for Obsidian-style wikilinks: [[Entity Name]]
    const wikilinkMatches = content.match(/\[\[([^\]]+)\]\]/g);
    if (wikilinkMatches) {
      wikilinkMatches.forEach(link => {
        const match = link.match(/\[\[([^\]]+)\]\]/);
        if (match) {
          const entityName = match[1].trim();
          
          // Find file that matches this entity name (without .md extension)
          const matchingPath = Array.from(vault.fileIndex.keys()).find(filePath => {
            const fileName = filePath.split('/').pop()?.replace('.md', '');
            return fileName === entityName;
          });
          
          if (matchingPath) {
            references.push(matchingPath);
          }
        }
      });
    }
    
    // Look for markdown-style links: [text](path) - keep for other references
    const markdownLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g);
    if (markdownLinks) {
      markdownLinks.forEach(link => {
        const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          const path = match[2];
          if (vault.fileIndex.has(path)) {
            references.push(path);
          }
        }
      });
    }
    
    return [...new Set(references)]; // Remove duplicates
  }

  return (
    <div ref={containerRef} className={`intel-graph-container ${className}`}>
      <GraphContext.Provider value={{
        filters,
        setFilters,
        physics,
        setPhysics,
        graphMode,
        setGraphMode,
        frozen,
        setFrozen,
        nodeCount: (activeGraph || graphData).nodes.length,
        edgeCount: (activeGraph || graphData).edges.length,
        saveLayout: () => savePositions(graphData),
        resetLayout: resetPositions,
        timestamps: (activeGraph || graphData).nodes.map(n => n.timestamp).filter(Boolean) as Date[],
        vaultHash: POSITION_KEY,
        fullGraph,
        activeGraph: activeGraph || graphData,
        isolateState,
        applyIsolate,
        clearIsolate,
        sizingMode,
        setSizingMode
      }}>
        {/* Header */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 56px 0 12px', background: 'var(--intel-bg-primary)', borderBottom: '1px solid var(--intel-border)', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--intel-text)' }}>Intel Graph</span>
            <span style={{ color: 'var(--intel-text-dim', fontSize: '0.9rem' }}>{graphData.nodes.length} nodes · {graphData.edges.length} edges</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setFrozen(f => !f)} title={frozen ? 'Unfreeze layout' : 'Freeze layout'}>
              {frozen ? 'Unfreeze' : 'Freeze'}
            </button>
            <button onClick={() => savePositions(graphData)} title="Save layout">Save</button>
            <button onClick={resetPositions} title="Reset layout">Reset</button>
          </div>
        </div>

        {/* Controls */}
        <GraphControls />
        {/* Graph Engine */}
        <div className="graph-engine-wrapper">
          {graphMode === '2d' && (
            <GraphEngine2D
              containerRef={containerRef}
              data={activeGraph || graphData}
              physics={physics}
              selectedNodes={selectedNodes}
              selectedFile={_selectedFile}
              onNodeClick={handleNodeClick}
              onEdgeClick={(edge) => { setSelectedNode(null); setSelectedEdge(edge); try { window.dispatchEvent(new CustomEvent('intelweb:edgeSelected', { detail: edge })); } catch {} }}
            />
          )}
          {graphMode === '3d' && (
            <div className="graph-3d-placeholder">3D mode coming soon…</div>
          )}
        </div>
      </GraphContext.Provider>
    </div>
  );
};

// Helper functions
function getNodeColor(type: IntelNode['type']): string {
  const baseColors = {
    report: '#4CAF50',
    entity: '#2196F3', 
    location: '#FF9800',
    event: '#9C27B0',
    source: '#607D8B'
  };
  
  const baseColor = baseColors[type] || '#9E9E9E';
  
  return baseColor;
}

function extractFileReferences(content: string, vault: VirtualFileSystem): string[] {
  const references: string[] = [];
  
  // Look for Obsidian-style wikilinks: [[Entity Name]]
  const wikilinkMatches = content.match(/\[\[([^\]]+)\]\]/g);
  if (wikilinkMatches) {
    wikilinkMatches.forEach(link => {
      const match = link.match(/\[\[([^\]]+)\]\]/);
      if (match) {
        const entityName = match[1].trim();
        
        // Find file that matches this entity name (without .md extension)
        const matchingPath = Array.from(vault.fileIndex.keys()).find(filePath => {
          const fileName = filePath.split('/').pop()?.replace('.md', '');
          return fileName === entityName;
        });
        
        if (matchingPath) {
          references.push(matchingPath);
        }
      }
    });
  }
  
  // Look for markdown-style links: [text](path) - keep for other references
  const markdownLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g);
  if (markdownLinks) {
    markdownLinks.forEach(link => {
      const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        const path = match[2];
        if (vault.fileIndex.has(path)) {
          references.push(path);
        }
      }
    });
  }
  
  return [...new Set(references)]; // Remove duplicates
}

export default IntelGraph;
