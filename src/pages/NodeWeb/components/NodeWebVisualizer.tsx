/**
 * NodeWebVisualizer Component
 * 
 * Interactive network visualization component for the NodeWeb functionality.
 * Extracted and repurposed from the OSINT and NodeGraphView modules.
 */

import React, { useRef, useEffect, useState } from 'react';
import { useNodeWeb } from '../hooks/useNodeWeb';
import styles from './NodeWebVisualizer.module.css';
import { Node, Edge, NodeType } from '../types/nodeWeb';

interface NodeWebVisualizerProps {
  className?: string;
  fullscreen?: boolean;
  nodes?: Node[];
  edges?: Edge[];
  onNodeSelect?: (nodeId: string) => void;
}

const NodeWebVisualizer: React.FC<NodeWebVisualizerProps> = ({ 
  className, 
  fullscreen: isFullscreen,
  nodes: externalNodes,
  edges: externalEdges,
  onNodeSelect
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Use either external nodes/edges or get them from the useNodeWeb hook
  const {
    nodes: hookNodes,
    edges: hookEdges,
    setSelectedNodeId: hookSetSelectedNodeId,
    visualizationOptions,
    updateVisualizationOptions
  } = useNodeWeb();
  
  const nodes = externalNodes || hookNodes;
  const edges = externalEdges || hookEdges;

  // Get node size based on its properties
  const getNodeSize = (node: Node): number => {
    // Base size
    const baseSize = 12;
    
    if (node.threatLevel) {
      return baseSize + node.threatLevel * 10;
    }
    
    // Count connections as a sizing metric
    const connections = edges.filter(e => 
      e.sourceId === node.id || e.targetId === node.id
    ).length;
    
    return baseSize + Math.min(connections * 2, 10);
  };

  // Get icon based on node type
  const getNodeIcon = (type: NodeType): string => {
    switch (type) {
      case 'person': return '👤';
      case 'organization': return '🏢';
      case 'wallet': return '💰';
      case 'address': return '📍';
      case 'domain': return '🌐';
      case 'file': return '📄';
      case 'server': return '🖥️';
      case 'device': return '📱';
      case 'account': return '🔑';
      case 'network': return '🕸️';
      case 'threat': return '⚠️';
      case 'custom': return '❓';
      default: return '●';
    }
  };

  // Get color based on edge type
  const getEdgeColor = (type: string): string => {
    switch (type) {
      case 'owner': return '#4CAF50';
      case 'member': return '#2196F3';
      case 'associate': return '#9C27B0';
      case 'transaction': return '#FF9800';
      case 'communication': return '#03A9F4';
      case 'location': return '#8BC34A';
      case 'temporal': return '#607D8B';
      case 'access': return '#FF5722';
      case 'creation': return '#CDDC39';
      case 'dependency': return '#795548';
      case 'attack': return '#F44336';
      case 'control': return '#E91E63';
      default: return '#BBBBBB';
    }
  };

  // Get node color based on type and attributes
  const getNodeColor = (node: Node): string => {
    // If node has a threat level, use that for coloring
    if (node.threatLevel !== undefined) {
      return calculateThreatColor(node.threatLevel);
    }
    
    // Otherwise, color by type
    switch (node.type) {
      case 'person': return '#FF5722';
      case 'organization': return '#3F51B5';
      case 'wallet': return '#FF9800';
      case 'address': return '#4CAF50';
      case 'domain': return '#2196F3';
      case 'file': return '#9C27B0';
      case 'server': return '#607D8B';
      case 'device': return '#795548';
      case 'account': return '#CDDC39';
      case 'network': return '#00BCD4';
      case 'threat': return '#F44336';
      case 'custom': return '#9E9E9E';
      default: return '#BBBBBB';
    }
  };

  // Calculate color based on threat level (0-1)
  const calculateThreatColor = (threatLevel: number): string => {
    if (!threatLevel && threatLevel !== 0) return '#BBBBBB';
    
    // Calculate color from green to red based on threat level
    const r = Math.floor(255 * threatLevel);
    const g = Math.floor(255 * (1 - threatLevel));
    const b = 0;
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Draw legend for node types
  const drawLegend = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const types: NodeType[] = ['person', 'organization', 'wallet', 'address', 'domain', 'server'];
    const spacing = 30;
    
    ctx.font = '14px Arial';
    ctx.textBaseline = 'middle';
    
    types.forEach((type, index) => {
      const yPos = y + index * spacing;
      
      // Draw color box
      ctx.fillStyle = getNodeColor({ 
        id: '', 
        type, 
        label: '', 
        properties: {}, 
        sources: [], 
        confidence: 1, 
        created: '', 
        updated: '' 
      });
      ctx.fillRect(x, yPos - 8, 16, 16);
      
      // Draw outline
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, yPos - 8, 16, 16);
      
      // Draw label
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(type.charAt(0).toUpperCase() + type.slice(1), x + 24, yPos);
    });
  };

  // Drawing function
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get canvas dimensions
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#0a1520';
    ctx.fillRect(0, 0, width, height);
    
    // Skip if no nodes
    if (!nodes.length) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText('No network data to display', width / 2, height / 2);
      return;
    }
    
    // Calculate node positions (simple force-directed layout)
    // This is a placeholder - a real implementation would use a proper force-directed algorithm
    const nodePositions = new Map<string, { x: number, y: number }>();
    
    // Simple circular layout
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.4;
      const x = width / 2 + radius * Math.cos(angle);
      const y = height / 2 + radius * Math.sin(angle);
      
      nodePositions.set(node.id, { x, y });
    });
    
    // Draw edges
    ctx.lineWidth = 1;
    edges.forEach(edge => {
      const source = nodePositions.get(edge.sourceId);
      const target = nodePositions.get(edge.targetId);
      
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        
        // Set edge color based on type
        ctx.strokeStyle = getEdgeColor(edge.type);
        
        // Set alpha based on selection state
        if (selectedNodeId && 
            edge.sourceId !== selectedNodeId && 
            edge.targetId !== selectedNodeId) {
          ctx.globalAlpha = 0.2;
        } else {
          ctx.globalAlpha = 1.0;
        }
        
        // Draw edge
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;
      
      const size = getNodeSize(node);
      
      // Set alpha based on selection state
      if (selectedNodeId && node.id !== selectedNodeId) {
        ctx.globalAlpha = 0.4;
      } else {
        ctx.globalAlpha = 1.0;
      }
      
      // Draw node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fillStyle = getNodeColor(node);
      ctx.fill();
      
      // Draw node outline
      ctx.lineWidth = node.id === selectedNodeId ? 3 : 1;
      ctx.strokeStyle = node.id === selectedNodeId ? '#FFFFFF' : '#333333';
      ctx.stroke();
      
      // Draw node icon or label
      if (visualizationOptions?.showLabels !== false) {
        ctx.font = `${size}px Arial`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const icon = getNodeIcon(node.type);
        if (icon) {
          ctx.fillText(icon, pos.x, pos.y);
        }
      }
      
      // Draw node label
      if (visualizationOptions?.showLabels) {
        ctx.font = '12px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.label || node.id, pos.x, pos.y + size + 5);
      }
      
      // Reset alpha
      ctx.globalAlpha = 1.0;
    });
    
    // Draw legend
    if (visualizationOptions?.showLabels) {
      drawLegend(ctx, 20, 40);
    }
  };

  // Handle click on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Simple hit detection - can be improved with spatial data structures
    const nodePositions = new Map<string, { x: number, y: number }>();
    
    // Simple circular layout (must match drawing logic)
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * Math.PI * 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.4;
      const nodeX = canvas.width / 2 + radius * Math.cos(angle);
      const nodeY = canvas.height / 2 + radius * Math.sin(angle);
      
      nodePositions.set(node.id, { x: nodeX, y: nodeY });
    });
    
    // Check if click is on a node
    let clickedNodeId: string | null = null;
    
    // Iterate in reverse to handle overlapping nodes (top-most should be selected)
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const pos = nodePositions.get(node.id);
      
      if (pos) {
        const dx = x - pos.x;
        const dy = y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= getNodeSize(node)) {
          clickedNodeId = node.id;
          break;
        }
      }
    }
    
    // Update selected node
    setSelectedNodeId(clickedNodeId);
    
    // Notify parent
    if (clickedNodeId && onNodeSelect) {
      onNodeSelect(clickedNodeId);
    }
    
    // Update hook state if using internal nodes
    if (clickedNodeId && !externalNodes && hookSetSelectedNodeId) {
      hookSetSelectedNodeId(clickedNodeId);
    }
  };

  // Initialize canvas and handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      draw();
    };
    
    // Initial size
    resizeCanvas();
    
    // Add resize listener
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw when data or options change
  useEffect(() => {
    draw();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, selectedNodeId, visualizationOptions]);

  return (
    <div className={`${styles.visualizerContainer} ${className || ''} ${isFullscreen ? styles.fullscreen : ''}`}>
      <canvas 
        ref={canvasRef} 
        className={styles.canvas}
        onClick={handleCanvasClick}
      />
      <div className={styles.controls}>
        <button 
          onClick={() => updateVisualizationOptions?.({ 
            ...visualizationOptions, 
            showLabels: !visualizationOptions?.showLabels 
          })}
          className={styles.controlButton}
          title={visualizationOptions?.showLabels ? "Hide Labels" : "Show Labels"}
        >
          {visualizationOptions?.showLabels ? "🏷️" : "🏷️"}
        </button>
        <button 
          onClick={() => updateVisualizationOptions?.({ 
            ...visualizationOptions, 
            highlightConnections: !visualizationOptions?.highlightConnections 
          })}
          className={styles.controlButton}
          title={visualizationOptions?.highlightConnections ? "Hide Connections" : "Show Connections"}
        >
          {visualizationOptions?.highlightConnections ? "🔗" : "🔗"}
        </button>
      </div>
    </div>
  );
};

export default NodeWebVisualizer;
