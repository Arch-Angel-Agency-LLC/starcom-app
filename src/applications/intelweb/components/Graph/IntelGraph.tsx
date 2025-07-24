/**
 * IntelGraph - Main Graph Visualization Component
 * 
 * Phase 3: D3.js force-directed graph with intelligence-specific features
 * Supports 2D/3D modes and optimized for 1000+ nodes
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { VirtualFileSystem, VirtualFile } from '../../../../types/DataPack';
import { GraphEngine2D } from './GraphEngine2D';
import { GraphControls } from './GraphControls';

// Graph data interfaces
export interface IntelNode extends d3.SimulationNodeDatum {
  id: string;
  type: 'report' | 'entity' | 'location' | 'event' | 'source';
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  confidence: number; // 0-1, affects node opacity
  title: string;
  description?: string;
  timestamp?: Date;
  location?: [number, number]; // lat, lng
  tags: string[];
  metadata: Record<string, unknown>;
  
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
  classifications: string[];
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
  selectedFile?: VirtualFile | null;
  onFileSelect?: (file: VirtualFile) => void;
  onNodeSelect?: (node: IntelNode) => void;
  width?: number;
  height?: number;
  className?: string;
}

export const IntelGraph: React.FC<IntelGraphProps> = ({
  vault,
  selectedFile: _selectedFile,
  onFileSelect,
  onNodeSelect,
  width: _width = 800,
  height: _height = 600,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphMode, setGraphMode] = useState<'2d' | '3d'>('2d');
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [filters, setFilters] = useState<GraphFilters>({
    classifications: ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET'],
    confidenceRange: [0.3, 1.0],
    nodeTypes: ['report', 'entity', 'location', 'event'],
    edgeTypes: ['reference', 'temporal', 'spatial', 'causal']
  });
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
  const [_highlightedNode, setHighlightedNode] = useState<string | null>(null);

  // Graph size limits for performance
  const MAX_NODES = 5000;
  const _MAX_EDGES = 10000;
  const _WARNING_THRESHOLD = 1000;

  // Convert VirtualFileSystem to graph data with size limits
  const convertVaultToGraph = useCallback((vault: VirtualFileSystem): GraphData => {
    const nodes: IntelNode[] = [];
    const edges: IntelEdge[] = [];
    const nodeMap = new Map<string, IntelNode>();

    const filesArray = Array.from(vault.fileIndex.values());
    
    // Check if dataset is too large
    if (filesArray.length > MAX_NODES) {
      console.warn(`Graph too large: ${filesArray.length} nodes exceeds limit of ${MAX_NODES}. Truncating...`);
    }

    // Limit the number of files processed
    const limitedFiles = filesArray.slice(0, MAX_NODES);

    // Create nodes from files
    limitedFiles.forEach((file, _index) => {
      const nodeId = file.path;
      const _fileExtension = file.extension || '';
      
      // Determine node type based on file properties with type safety
      let nodeType: IntelNode['type'] = 'report';
      if (file.frontmatter?.type === 'entity') nodeType = 'entity';
      else if (file.frontmatter?.type === 'location') nodeType = 'location';
      else if (file.frontmatter?.type === 'event') nodeType = 'event';
      else if (file.frontmatter?.type === 'source') nodeType = 'source';
      
      // Determine classification with type safety
      const rawClassification = file.frontmatter?.classification;
      const validClassifications = ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'] as const;
      const classification: IntelNode['classification'] = 
        typeof rawClassification === 'string' && 
        (validClassifications as readonly string[]).includes(rawClassification)
          ? rawClassification as IntelNode['classification']
          : 'UNCLASSIFIED';
      
      // Calculate confidence based on frontmatter with type safety
      const rawConfidence = file.frontmatter?.confidence;
      const confidence = typeof rawConfidence === 'number' && rawConfidence >= 0 && rawConfidence <= 1
        ? rawConfidence
        : (file.modifiedAt ? 0.8 : 0.5);

      const node: IntelNode = {
        id: nodeId,
        type: nodeType,
        classification,
        confidence,
        title: file.name,
        description: file.frontmatter?.description || '',
        timestamp: file.modifiedAt ? new Date(file.modifiedAt) : undefined,
        location: file.frontmatter?.coordinates,
        tags: file.hashtags || [],
        metadata: file.frontmatter || {},
        file,
        
        // Visual properties
        color: getNodeColor(nodeType, classification),
        size: Math.max(8, Math.min(20, (confidence * 15) + 5)),
        group: nodeType
      };

      nodes.push(node);
      nodeMap.set(nodeId, node);
    });

    // Create edges from file references and relationships
    nodes.forEach(node => {
      const file = node.file!;
      
      // Parse content for references to other files
      if (file.content && typeof file.content === 'string') {
        const references = extractFileReferences(file.content, vault);
        references.forEach(refPath => {
          const targetNode = nodeMap.get(refPath);
          if (targetNode && targetNode.id !== node.id) {
            const edgeId = `${node.id}->${targetNode.id}`;
            
            if (!edges.find(e => e.id === edgeId)) {
              edges.push({
                id: edgeId,
                source: node.id,
                target: targetNode.id,
                type: 'reference',
                weight: 0.5,
                confidence: Math.min(node.confidence, targetNode.confidence),
                metadata: {}
              });
            }
          }
        });
      }

      // Use explicit relationships from the vault relationship graph
      if (vault.relationshipGraph) {
        vault.relationshipGraph.forEach(relationship => {
          if (relationship.source === node.id || relationship.target === node.id) {
            const sourceId = relationship.source;
            const targetId = relationship.target;
            const sourceNode = nodeMap.get(sourceId);
            const targetNode = nodeMap.get(targetId);
            
            if (sourceNode && targetNode) {
              const edgeId = `${sourceId}-${targetId}`;
              
              if (!edges.find(e => e.id === edgeId)) {
                edges.push({
                  id: edgeId,
                  source: sourceId,
                  target: targetId,
                  type: 'reference',
                  weight: relationship.strength || 0.5,
                  confidence: Math.min(sourceNode.confidence, targetNode.confidence),
                  metadata: relationship.metadata || {}
                });
              }
            }
          }
        });
      }
    });

    console.log(`🔗 Graph created: ${nodes.length} nodes, ${edges.length} edges (wikilink-based only)`);
    return { nodes, edges };
  }, []);

  // Filter graph data based on current filters
  const filterGraphData = useCallback((data: GraphData, filters: GraphFilters): GraphData => {
    const filteredNodes = data.nodes.filter(node => {
      // Classification filter
      if (!filters.classifications.includes(node.classification)) return false;
      
      // Confidence filter
      if (node.confidence < filters.confidenceRange[0] || 
          node.confidence > filters.confidenceRange[1]) return false;
      
      // Node type filter
      if (!filters.nodeTypes.includes(node.type)) return false;
      
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!node.title.toLowerCase().includes(query) &&
            !node.description?.toLowerCase().includes(query) &&
            !node.tags.some(tag => tag.toLowerCase().includes(query))) {
          return false;
        }
      }
      
      // Time range filter
      if (filters.timeRange && node.timestamp) {
        if (node.timestamp < filters.timeRange[0] || 
            node.timestamp > filters.timeRange[1]) return false;
      }
      
      return true;
    });

    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = data.edges.filter(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      
      // Only include edges between filtered nodes
      if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) return false;
      
      // Edge type filter
      if (!filters.edgeTypes.includes(edge.type)) return false;
      
      // Edge confidence filter
      if (edge.confidence < filters.confidenceRange[0] || 
          edge.confidence > filters.confidenceRange[1]) return false;
      
      return true;
    });

    return { nodes: filteredNodes, edges: filteredEdges };
  }, []);

  // Update graph data when vault or filters change
  useEffect(() => {
    const rawData = convertVaultToGraph(vault);
    const filteredData = filterGraphData(rawData, filters);
    setGraphData(filteredData);
  }, [vault, filters, convertVaultToGraph, filterGraphData]);

  // Handle node interactions
  const handleNodeClick = useCallback((node: IntelNode) => {
    setSelectedNode(node);
    onNodeSelect?.(node);
    
    if (node.file && onFileSelect) {
      onFileSelect(node.file);
    }
  }, [onNodeSelect, onFileSelect]);

  const _handleNodeHover = useCallback((nodeId: string | null) => {
    setHighlightedNode(nodeId);
  }, []);

  // Handle control updates
  const handleFiltersChange = useCallback((newFilters: GraphFilters) => {
    setFilters(newFilters);
  }, []);

  const handlePhysicsChange = useCallback((newPhysics: PhysicsSettings) => {
    setPhysics(newPhysics);
  }, []);

  const handleModeChange = useCallback((mode: '2D' | '3D') => {
    setGraphMode(mode.toLowerCase() as '2d' | '3d');
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`intel-graph ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--intel-bg-secondary)',
        border: '1px solid var(--intel-border)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* Graph Controls */}
      <GraphControls
        filters={filters}
        physics={physics}
        mode={graphMode.toUpperCase() as '2D' | '3D'}
        nodeCount={graphData.nodes.length}
        edgeCount={graphData.edges.length}
        onFiltersChange={handleFiltersChange}
        onPhysicsChange={handlePhysicsChange}
        onModeChange={handleModeChange}
      />

      {/* Graph Visualization */}
      <div style={{ 
        position: 'absolute',
        top: '60px',
        left: '0',
        right: '0',
        bottom: '0',
        overflow: 'hidden'
      }}>
        {graphMode === '3d' ? (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            color: 'var(--intel-text-dim)',
            fontSize: '1.1rem'
          }}>
            3D Graph Engine - Coming Soon
          </div>
        ) : (
          <GraphEngine2D
            data={graphData}
            physics={physics}
            selectedNodes={selectedNode ? [selectedNode] : []}
            selectedFile={_selectedFile}
            onNodeClick={handleNodeClick}
            onEdgeClick={() => {}}
            containerRef={containerRef}
          />
        )}
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div style={{
          position: 'absolute',
          top: '70px',
          right: '10px',
          width: '300px',
          backgroundColor: 'var(--intel-bg-primary)',
          border: '1px solid var(--intel-border)',
          borderRadius: '6px',
          padding: '12px',
          fontSize: '0.9rem',
          color: 'var(--intel-text)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 100
        }}>
          <div style={{ 
            fontSize: '1rem', 
            fontWeight: 'bold',
            marginBottom: '8px',
            color: 'var(--intel-accent)'
          }}>
            {selectedNode.title}
          </div>
          
          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: 'var(--intel-text-dim)' }}>Type:</span> {selectedNode.type}
          </div>
          
          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: 'var(--intel-text-dim)' }}>Classification:</span>{' '}
            <span style={{ 
              color: getClassificationColor(selectedNode.classification),
              fontWeight: 'bold'
            }}>
              {selectedNode.classification}
            </span>
          </div>
          
          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: 'var(--intel-text-dim)' }}>Confidence:</span>{' '}
            {Math.round(selectedNode.confidence * 100)}%
          </div>
          
          {selectedNode.timestamp && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: 'var(--intel-text-dim)' }}>Date:</span>{' '}
              {selectedNode.timestamp.toLocaleDateString()}
            </div>
          )}
          
          {selectedNode.tags.length > 0 && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: 'var(--intel-text-dim)' }}>Tags:</span>{' '}
              {selectedNode.tags.join(', ')}
            </div>
          )}
          
          {selectedNode.description && (
            <div style={{ 
              marginTop: '8px',
              fontSize: '0.85rem',
              color: 'var(--intel-text-dim)',
              lineHeight: '1.4'
            }}>
              {selectedNode.description}
            </div>
          )}
          
          <button
            onClick={() => setSelectedNode(null)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              color: 'var(--intel-text-dim)',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

// Helper functions
function getNodeColor(type: IntelNode['type'], classification: IntelNode['classification']): string {
  const baseColors = {
    report: '#4CAF50',
    entity: '#2196F3', 
    location: '#FF9800',
    event: '#9C27B0',
    source: '#607D8B'
  };
  
  const classificationModifiers = {
    UNCLASSIFIED: 1.0,
    CONFIDENTIAL: 0.8,
    SECRET: 0.6,
    TOP_SECRET: 0.4
  };
  
  const baseColor = baseColors[type] || '#9E9E9E';
  const modifier = classificationModifiers[classification] || 1.0;
  
  // Adjust brightness based on classification
  return adjustColorBrightness(baseColor, modifier);
}

function getClassificationColor(classification: IntelNode['classification']): string {
  const colors = {
    UNCLASSIFIED: '#4CAF50',
    CONFIDENTIAL: '#FF9800',
    SECRET: '#F44336',
    TOP_SECRET: '#9C27B0'
  };
  return colors[classification] || '#9E9E9E';
}

function adjustColorBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const newR = Math.round(r * factor);
  const newG = Math.round(g * factor);
  const newB = Math.round(b * factor);
  
  return `rgb(${newR}, ${newG}, ${newB})`;
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
