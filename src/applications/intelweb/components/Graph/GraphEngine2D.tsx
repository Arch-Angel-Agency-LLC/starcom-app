/**
 * GraphEngine2D - D3.js 2D Force-Directed Graph Implementation
 * 
 * Phase 3: High-performance 2D graph visualization optimized for 1000+ nodes
 */

import React, { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { IntelNode, IntelEdge, IntelGraphData, PhysicsSettings } from './IntelGraph';
import { VirtualFile } from '../../../../types/DataPack';

interface GraphEngine2DProps {
  data: IntelGraphData;
  physics: PhysicsSettings;
  selectedNodes: IntelNode[];
  selectedFile?: VirtualFile | null;
  onNodeClick?: (node: IntelNode) => void;
  onEdgeClick?: (edge: IntelEdge) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const GraphEngine2D: React.FC<GraphEngine2DProps> = ({
  data,
  physics,
  selectedNodes,
  selectedFile,
  onNodeClick,
  onEdgeClick,
  containerRef
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<IntelNode, IntelEdge> | null>(null);

  // Node size scaling
  const sizeScale = d3.scaleLinear()
    .domain([0, d3.max(data.nodes, d => d.size) || 10])
    .range([6, 20]);

  // Classification color mapping
  const classificationColors = React.useMemo(() => ({
    'UNCLASSIFIED': '#4a5568',
    'CONFIDENTIAL': '#d69e2e',
    'SECRET': '#e53e3e',
    'TOP_SECRET': '#9f7aea'
  }), []);

  // Initialize or update D3 simulation
  const initializeSimulation = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create or update simulation
    const simulation = d3.forceSimulation<IntelNode>(data.nodes)
      .force('link', d3.forceLink<IntelNode, IntelEdge>(data.edges)
        .id(d => d.id)
        .distance(physics.linkDistance)
        .strength(physics.linkStrength)
      )
      .force('charge', d3.forceManyBody().strength(physics.charge))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => sizeScale(d.size) + 2))
      .alphaDecay(0.02)
      .velocityDecay(physics.friction);

    simulationRef.current = simulation;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create main group
    const g = svg.append('g');

    // Create edge elements
    const edges = g.selectAll('.edge')
      .data(data.edges)
      .enter()
      .append('line')
      .attr('class', 'edge')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.strength * 5))
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        onEdgeClick?.(d);
      });

    // Create node groups
    const nodeGroups = g.selectAll('.node-group')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, IntelNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d);
      });

    // Add node circles
    const nodeCircles = nodeGroups.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => sizeScale(d.size))
      .attr('fill', d => d.color)
      .attr('stroke', d => classificationColors[d.classification])
      .attr('stroke-width', 2)
      .attr('opacity', d => 0.7 + (d.confidence * 0.3));

    // Add node icons based on type
    const _nodeIcons = nodeGroups.append('text')
      .attr('class', 'node-icon')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', d => Math.max(8, sizeScale(d.size) * 0.6))
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .text(d => {
        const icons = {
          report: '📄',
          entity: '👤',
          location: '📍',
          event: '⚡',
          source: '🔗'
        };
        return icons[d.type] || '📄';
      });

    // Add node labels
    const _nodeLabels = nodeGroups.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', d => sizeScale(d.size) + 12)
      .attr('font-size', '10px')
      .attr('fill', '#d4d4d4')
      .attr('pointer-events', 'none')
      .style('user-select', 'none')
      .text(d => d.title.length > 15 ? d.title.substring(0, 15) + '...' : d.title);

    // Update selection highlighting
    const updateSelection = () => {
      const selectedIds = new Set(selectedNodes.map(n => n.id));
      
      nodeCircles
        .classed('selected', d => selectedIds.has(d.id))
        .attr('stroke-width', d => selectedIds.has(d.id) ? 4 : 2);

      // Highlight selected file
      if (selectedFile) {
        nodeCircles
          .classed('highlighted', d => d.file?.path === selectedFile.path);
      }
    };

    // Simulation tick function
    simulation.on('tick', () => {
      edges
        .attr('x1', d => (d.source as IntelNode).x || 0)
        .attr('y1', d => (d.source as IntelNode).y || 0)
        .attr('x2', d => (d.target as IntelNode).x || 0)
        .attr('y2', d => (d.target as IntelNode).y || 0);

      nodeGroups
        .attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`);
    });

    // Initial selection update
    updateSelection();

    // Store update function for external calls
    (simulation as d3.Simulation<IntelNode, IntelEdge> & { updateSelection?: () => void }).updateSelection = updateSelection;

    return simulation;
  }, [data, physics, containerRef, onNodeClick, onEdgeClick, sizeScale, classificationColors, selectedFile, selectedNodes]);

  // Update simulation when data or physics change with proper cleanup
  useEffect(() => {
    // Cleanup previous simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current.nodes([]);
      // Clear all forces to prevent memory leaks
      simulationRef.current.force('link', null);
      simulationRef.current.force('charge', null);
      simulationRef.current.force('center', null);
      simulationRef.current.force('collision', null);
    }

    const simulation = initializeSimulation();
    simulationRef.current = simulation;
    
    return () => {
      if (simulation) {
        simulation.stop();
        simulation.nodes([]);
        // Clear all forces
        simulation.force('link', null);
        simulation.force('charge', null);
        simulation.force('center', null);
        simulation.force('collision', null);
      }
    };
  }, [data, physics, initializeSimulation]);

  // Update selection when selectedNodes or selectedFile change
  useEffect(() => {
    if (simulationRef.current && (simulationRef.current as d3.Simulation<IntelNode, IntelEdge> & { updateSelection?: () => void }).updateSelection) {
      (simulationRef.current as d3.Simulation<IntelNode, IntelEdge> & { updateSelection?: () => void }).updateSelection();
    }
  }, [selectedNodes, selectedFile]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && svgRef.current) {
        const container = containerRef.current;
        const svg = d3.select(svgRef.current);
        svg.attr('width', container.clientWidth)
           .attr('height', container.clientHeight);
           
        // Update center force
        if (simulationRef.current) {
          simulationRef.current
            .force('center', d3.forceCenter(container.clientWidth / 2, container.clientHeight / 2))
            .alpha(0.3)
            .restart();
        }
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [containerRef]);

  return (
    <svg
      ref={svgRef}
      className="graph-2d"
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent'
      }}
    />
  );
};

export default GraphEngine2D;
