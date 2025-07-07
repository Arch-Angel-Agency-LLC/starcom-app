import React, { useRef, useEffect, useCallback } from 'react';
import { useGlobalCommand } from '../../../hooks/useUnifiedGlobalCommand';
import styles from './NodeGraphView.module.css';

interface NodeGraphViewProps {
  className?: string;
  fullscreen?: boolean;
}

interface GraphNode {
  id: string;
  x: number;
  y: number;
  type: 'entity' | 'event' | 'location' | 'system' | 'threat';
  label: string;
  size: number;
  color: string;
  connections: string[];
}

interface GraphEdge {
  from: string;
  to: string;
  type: 'related' | 'causes' | 'located_at' | 'communicates';
  strength: number;
  label?: string;
}

const NodeGraphView: React.FC<NodeGraphViewProps> = ({ className, fullscreen }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state } = useGlobalCommand();

  const sampleNodes: GraphNode[] = [
    { id: 'entity1', x: 200, y: 150, type: 'entity', label: 'TARGET ALPHA', size: 20, color: '#ff3333', connections: ['event1', 'location1'] },
    { id: 'event1', x: 400, y: 100, type: 'event', label: 'SECURITY BREACH', size: 16, color: '#ff6600', connections: ['entity1', 'system1'] },
    { id: 'location1', x: 300, y: 250, type: 'location', label: 'DATA CENTER', size: 18, color: '#3366ff', connections: ['entity1', 'system1'] },
    { id: 'system1', x: 500, y: 200, type: 'system', label: 'NETWORK NODE', size: 14, color: '#00ff88', connections: ['event1', 'location1', 'threat1'] },
    { id: 'threat1', x: 600, y: 300, type: 'threat', label: 'ANOMALY DETECTED', size: 22, color: '#ff0066', connections: ['system1'] },
  ];

  const sampleEdges: GraphEdge[] = [
    { from: 'entity1', to: 'event1', type: 'causes', strength: 0.8 },
    { from: 'entity1', to: 'location1', type: 'located_at', strength: 0.9 },
    { from: 'event1', to: 'system1', type: 'related', strength: 0.7 },
    { from: 'location1', to: 'system1', type: 'related', strength: 0.6 },
    { from: 'system1', to: 'threat1', type: 'causes', strength: 0.9 },
  ];

  const drawNodeGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = 'rgba(0, 10, 20, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw edges
    sampleEdges.forEach(edge => {
      const fromNode = sampleNodes.find(n => n.id === edge.from);
      const toNode = sampleNodes.find(n => n.id === edge.to);
      
      if (fromNode && toNode) {
        ctx.strokeStyle = getEdgeColor(edge.type);
        ctx.lineWidth = edge.strength * 3;
        ctx.globalAlpha = 0.6;
        
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
        
        // Draw edge label
        if (edge.label) {
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;
          
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px "Courier New", monospace';
          ctx.textAlign = 'center';
          ctx.globalAlpha = 0.8;
          ctx.fillText(edge.label, midX, midY);
        }
        
        ctx.globalAlpha = 1;
      }
    });

    // Draw nodes
    sampleNodes.forEach(node => {
      // Node circle
      ctx.fillStyle = node.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Node icon (simple shape based on type)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(getNodeIcon(node.type), node.x, node.y + 4);
      
      // Node label
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + node.size + 15);
      
      // Node type indicator
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '9px "Courier New", monospace';
      ctx.fillText(node.type.toUpperCase(), node.x, node.y + node.size + 28);
    });

    // Draw title
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NODE GRAPH ANALYSIS', canvas.width / 2, 30);
    
    // Draw legend
    drawLegend(ctx, canvas.width - 200, 50);
  }, []);

  const getNodeIcon = (type: string): string => {
    switch (type) {
      case 'entity': return '◉';
      case 'event': return '⚡';
      case 'location': return '📍';
      case 'system': return '⚙';
      case 'threat': return '⚠';
      default: return '●';
    }
  };

  const getEdgeColor = (type: string): string => {
    switch (type) {
      case 'related': return '#66ccff';
      case 'causes': return '#ff6666';
      case 'located_at': return '#66ff66';
      case 'communicates': return '#ffff66';
      default: return '#ffffff';
    }
  };

  const drawLegend = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const legendItems = [
      { type: 'entity', label: 'ENTITY', color: '#ff3333' },
      { type: 'event', label: 'EVENT', color: '#ff6600' },
      { type: 'location', label: 'LOCATION', color: '#3366ff' },
      { type: 'system', label: 'SYSTEM', color: '#00ff88' },
      { type: 'threat', label: 'THREAT', color: '#ff0066' },
    ];

    // Legend background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - 10, y - 10, 180, legendItems.length * 20 + 20);
    
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 10, y - 10, 180, legendItems.length * 20 + 20);

    // Legend title
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('NODE TYPES', x, y);

    // Legend items
    legendItems.forEach((item, index) => {
      const itemY = y + 20 + (index * 20);
      
      // Color circle
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(x + 10, itemY, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px "Courier New", monospace';
      ctx.fillText(item.label, x + 25, itemY + 4);
    });
  };

  useEffect(() => {
    drawNodeGraph();
  }, [drawNodeGraph]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if click is on a node
    const clickedNode = sampleNodes.find(node => {
      const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      return distance <= node.size;
    });

    if (clickedNode) {
      console.log('Node clicked:', clickedNode);
      // TODO: Implement node selection and context actions
    }
  };

  return (
    <div className={`${styles.nodeGraphView} ${fullscreen ? styles.fullscreen : ''} ${className || ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.icon}>🕸</span>
          Intelligence Node Graph
        </h2>
        <div className={styles.controls}>
          <button className={styles.controlBtn}>FORCE</button>
          <button className={styles.controlBtn}>HIER</button>
          <button className={styles.controlBtn}>CIRC</button>
          <button className={styles.controlBtn}>GRID</button>
        </div>
      </div>
      
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={800}
          height={500}
          onClick={handleCanvasClick}
        />
        
        <div className={styles.overlay}>
          <div className={styles.contextInfo}>
            Context: {state.enhanced?.primaryContextId || 'GLOBAL'}
          </div>
          <div className={styles.stats}>
            <div>Nodes: {sampleNodes.length}</div>
            <div>Edges: {sampleEdges.length}</div>
          </div>
        </div>
      </div>
      
      <div className={styles.footer}>
        <div className={styles.algorithm}>
          LAYOUT: Force-Directed | ZOOM: 100%
        </div>
        <div className={styles.status}>
          GRAPH READY
        </div>
      </div>
    </div>
  );
};

export default NodeGraphView;
