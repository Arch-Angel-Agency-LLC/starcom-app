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
  timeRange?: [Date, Date]; // optional temporal filter window
}

export const GraphEngine2D: React.FC<GraphEngine2DProps> = ({
  data,
  physics,
  selectedNodes,
  selectedFile,
  onNodeClick,
  onEdgeClick,
  containerRef,
  timeRange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<IntelNode, IntelEdge> | null>(null);

  // Node size scaling
  const sizeScale = d3.scaleLinear()
    .domain([0, d3.max(data.nodes, d => d.size) || 10])
    .range([6, 20]);

  // Precompute degree ranking for label LOD
  const degreeSortedIds = React.useMemo(() => {
    return [...data.nodes]
      .sort((a, b) => (b.degree || 0) - (a.degree || 0))
      .map(n => n.id);
  }, [data.nodes]);

  // Edge color mapping by type
  const edgeColors: Record<string, string> = {
    reference: '#9E9E9E',
    spatial: '#FF9800',
    temporal: '#9C27B0'
  };

  // Initialize or update D3 simulation
  const initializeSimulation = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // If nodes are frozen (fx/fy set), start with low alpha
    const hasFixed = data.nodes.some(n => typeof n.fx === 'number' && typeof n.fy === 'number');

    // Precompute adjacency for hover highlighting
    const neighborMap = new Map<string, Set<string>>();
    const incidentEdgeIds = new Map<string, Set<string>>();
    data.edges.forEach(e => {
      const s = typeof e.source === 'string' ? e.source : e.source.id;
      const t = typeof e.target === 'string' ? e.target : e.target.id;
      if (!neighborMap.has(s)) neighborMap.set(s, new Set());
      if (!neighborMap.has(t)) neighborMap.set(t, new Set());
      neighborMap.get(s)!.add(t);
      neighborMap.get(t)!.add(s);
      if (!incidentEdgeIds.has(s)) incidentEdgeIds.set(s, new Set());
      if (!incidentEdgeIds.has(t)) incidentEdgeIds.set(t, new Set());
      incidentEdgeIds.get(s)!.add(e.id);
      incidentEdgeIds.get(t)!.add(e.id);
    });

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
      .alpha(hasFixed ? 0.05 : 1)
      .alphaDecay(0.02)
      .velocityDecay(physics.friction);

    simulationRef.current = simulation;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('data-max-labels-zoomed-out', 30)
      .attr('data-zoom-threshold-hide', 0.5);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        const t0 = performance.now();
        g.attr('transform', event.transform);
        updateLabelLOD(event.transform.k);
        const t1 = performance.now();
        if ((t1 - t0) > 1) {
          console.log(`[IntelWeb][Perf] Zoom handler ${ (t1 - t0).toFixed(2) }ms (labels)`);
        }
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
      .attr('stroke', d => edgeColors[d.type] || '#9E9E9E')
      .attr('stroke-opacity', d => Math.max(0.2, Math.min(1, 0.3 + d.confidence * 0.7)))
      .attr('stroke-width', d => Math.max(1, (d.weight || 0.5) * 3))
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        onEdgeClick?.(d);
      });

    // Add simple tooltips for edges with predicate/provenance
    edges.append('title').text(d => {
      const m: any = d.metadata || {};
      const predicate = m.predicate;
      const provenance = m.provenance || m.derivedFrom;
      const sourceReport = m.sourceReport;
      const parts: string[] = [
        `Type: ${d.type}`,
      ];
      if (predicate) parts.push(`Predicate: ${predicate}`);
      if (sourceReport) parts.push(`Source: ${sourceReport}`);
      if (provenance) parts.push(`Provenance: ${provenance}`);
      parts.push(`Weight: ${(d.weight || 0).toFixed(2)}`);
      parts.push(`Confidence: ${Math.round((d.confidence || 0) * 100)}%`);
      return parts.join('\n');
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
      .attr('fill', d => d.color as string)
      .attr('stroke', d => {
        const c = d3.color(d.color as string);
        return c ? c.darker(1).toString() : '#333';
      })
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
        const icons: Record<string, string> = {
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

    // Label LOD constants (exported for potential external tuning via inspection)
    const MAX_LABELS_ZOOMED_OUT = 30;
    const ZOOM_THRESHOLD_HIDE = 0.5; // below this zoom (more zoomed out) limit to top N
    let hoveredId: string | null = null;

    const updateLabelLOD = (k: number) => {
      const showAll = k >= ZOOM_THRESHOLD_HIDE;
      const allowed = new Set<string>();
      if (showAll) {
        degreeSortedIds.forEach(id => allowed.add(id));
      } else {
        degreeSortedIds.slice(0, MAX_LABELS_ZOOMED_OUT).forEach(id => allowed.add(id));
      }
      if (hoveredId) allowed.add(hoveredId);
      const selectedIds = new Set(selectedNodes.map(n => n.id));
      selectedIds.forEach(id => allowed.add(id));
      _nodeLabels.style('display', d => allowed.has(d.id) ? 'block' : 'none');
    };

    // Temporal edge fading helper
    const applyTemporalFading = () => {
      if (!timeRange) return;
      const t0 = performance.now();
      const [start, end] = timeRange;
      edges.attr('stroke-opacity', (d: any) => {
        const m: any = d.metadata || {};
        const ts = m?.provenance?.timestamp || m?.timestamp || m?.time;
        if (!ts) return Math.max(0.15, Math.min(1, 0.3 + d.confidence * 0.7));
        const date = new Date(ts);
        const inRange = date >= start && date <= end;
        return inRange ? Math.max(0.4, Math.min(1, 0.4 + d.confidence * 0.6)) : 0.05;
      });
      // Node dimming (do not remove filtered nodes; dim those out of range)
      nodeCircles.attr('fill-opacity', (d: any) => {
        const ts = (d.timestamp instanceof Date) ? d.timestamp : (d.timestamp ? new Date(d.timestamp as any) : null);
        if (!ts) return 0.9;
        const inRange = ts >= start && ts <= end;
        return inRange ? 1 : 0.15;
      });
      const t1 = performance.now();
      if ((t1 - t0) > 2) console.log(`[IntelWeb][Perf] Temporal fading pass ${(t1 - t0).toFixed(2)}ms`);
    };

    // Initial label LOD
    updateLabelLOD(1);
    applyTemporalFading();

    // Hover highlighting helpers
    const clearHover = () => {
      nodeGroups.style('opacity', 1);
      edges
        .style('opacity', null)
        .attr('stroke-width', d => Math.max(1, (d.weight || 0.5) * 3));
    };

    const highlightNode = (nodeId: string) => {
      const neighbors = neighborMap.get(nodeId) || new Set<string>();
      const incident = incidentEdgeIds.get(nodeId) || new Set<string>();

      nodeGroups.style('opacity', (d: any) => {
        if (d.id === nodeId) return 1;
        return neighbors.has(d.id) ? 0.95 : 0.15;
      });

      edges
        .style('opacity', (e: any) => incident.has(e.id) ? 1 : 0.1)
        .attr('stroke-width', (e: any) => incident.has(e.id) ? Math.max(2, (e.weight || 0.5) * 4) : Math.max(1, (e.weight || 0.5) * 2));
    };

    const highlightEdge = (edge: IntelEdge) => {
      const s = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const t = typeof edge.target === 'string' ? edge.target : edge.target.id;
      const neighborSet = new Set([s, t]);

      nodeGroups.style('opacity', (d: any) => neighborSet.has(d.id) ? 1 : 0.15);
      edges
        .style('opacity', (e: any) => e.id === edge.id ? 1 : 0.1)
        .attr('stroke-width', (e: any) => e.id === edge.id ? Math.max(2, (e.weight || 0.5) * 4) : Math.max(1, (e.weight || 0.5) * 2));
    };

    // Wire hover events
    nodeGroups
      .on('mouseover', (_, d) => { hoveredId = (d as any).id; highlightNode((d as any).id); updateLabelLOD(d3.zoomTransform(svg.node() as any).k); })
      .on('mouseout', () => { hoveredId = null; clearHover(); updateLabelLOD(d3.zoomTransform(svg.node() as any).k); });

    edges
      .on('mouseover', (_, d) => { highlightEdge(d as any); updateLabelLOD(d3.zoomTransform(svg.node() as any).k); })
      .on('mouseout', () => { clearHover(); updateLabelLOD(d3.zoomTransform(svg.node() as any).k); });

    // Re-apply temporal fading when timeRange changes via mutation observer pattern (simplified)
    if (timeRange) {
      applyTemporalFading();
    }

    // Update selection highlighting
    const updateSelection = () => {
      const selectedIds = new Set(selectedNodes.map(n => n.id));
      nodeCircles
        .classed('selected', d => selectedIds.has(d.id))
        .attr('stroke-width', d => selectedIds.has(d.id) ? 4 : 2);
      updateLabelLOD(d3.zoomTransform(svg.node() as any).k);
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
  }, [data, physics, containerRef, onNodeClick, onEdgeClick, sizeScale, selectedFile, selectedNodes, degreeSortedIds, timeRange]);

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
