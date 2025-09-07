import React, { useMemo, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import ForceGraph2D, { NodeObject, LinkObject, ForceGraphMethods } from 'react-force-graph-2d';
import { useIntelWorkspace } from '../../../../services/intel/IntelWorkspaceContext';
import { adaptWorkspaceToEvents } from '../../adapters/eventsAdapter';
import { useFilter } from '../../state/FilterContext';
import { useSelection } from '../../state/SelectionContext';
import { useCorrelation } from '../../state/CorrelationContext';

interface GraphNode extends NodeObject { id: string; type: 'event' | 'entity' | 'tag'; label?: string }
interface GraphLink extends LinkObject { source: string; target: string; co?: boolean; tco?: boolean; count?: number }

const GraphView: React.FC = () => {
  const { reports, intelItems } = useIntelWorkspace();
  const { filters, updateFilter } = useFilter();
  const { setSelectedItem } = useSelection();
  const fgRef = useRef<ForceGraphMethods | undefined>();
  const { showClusters, cooccurrence, tagCooccurrence } = useCorrelation();

  const events = useMemo(() => adaptWorkspaceToEvents(reports, intelItems), [reports, intelItems]);

  const filtered = useMemo(() => {
    return events.filter(ev => {
      if (filters.timeRange) {
        const t = new Date(ev.timestamp).getTime();
        const s = filters.timeRange.start.getTime();
        const e = filters.timeRange.end.getTime();
        if (t < s || t > e) return false;
      }
      if (filters.categories?.length && !filters.categories.includes(ev.category)) return false;
      if (filters.entityRefs?.length && !ev.entityRefs?.some(id => filters.entityRefs!.includes(id))) return false;
      return true;
    });
  }, [events, filters]);

  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const edges: GraphLink[] = [];
    const NODE_CAP = 400; // overall
  const ENTITY_CAP = 250;
  const TAG_CAP = 120;
    const EVENT_CAP = 200;

    const evSlice = filtered.slice(0, EVENT_CAP);
    evSlice.forEach(ev => {
      nodeMap.set(ev.id, { id: ev.id, type: 'event', label: ev.title });
      (ev.entityRefs || []).slice(0, 6).forEach(ent => {
        if (!nodeMap.has(ent) && nodeMap.size < NODE_CAP && [...nodeMap.values()].filter(n => n.type==='entity').length < ENTITY_CAP) {
          nodeMap.set(ent, { id: ent, type: 'entity', label: ent });
        }
        if (nodeMap.has(ent)) edges.push({ source: ev.id, target: ent });
      });
      (ev.tags || []).slice(0, 6).forEach(tag => {
        if (!nodeMap.has(tag) && nodeMap.size < NODE_CAP && [...nodeMap.values()].filter(n => n.type==='tag').length < TAG_CAP) {
          nodeMap.set(tag, { id: tag, type: 'tag', label: `#${tag}` });
        }
        if (nodeMap.has(tag)) edges.push({ source: ev.id, target: tag });
      });
    });

    // Overlay: entity-entity co-occurrence links when enabled
    if (showClusters) {
      let added = 0;
      const MAX_CO = 150;
      for (const pair of cooccurrence) {
        if (added >= MAX_CO) break;
        if (nodeMap.has(pair.a) && nodeMap.has(pair.b)) {
          edges.push({ source: pair.a, target: pair.b, co: true, count: pair.count });
          added++;
        }
      }
      // Tag co-occurrence overlay (lighter color)
      let tadded = 0;
      const MAX_TCO = 120;
  for (const pair of (tagCooccurrence || [])) {
        if (tadded >= MAX_TCO) break;
        if (nodeMap.has(pair.a) && nodeMap.has(pair.b)) {
          edges.push({ source: pair.a, target: pair.b, tco: true, count: pair.count });
          tadded++;
        }
      }
    }
    return { nodes: Array.from(nodeMap.values()), links: edges };
  }, [filtered, showClusters, cooccurrence, tagCooccurrence]);

  const handleNodeClick = (node: GraphNode) => {
    if (node.type === 'event') {
      const ev = filtered.find(e => e.id === node.id);
      if (ev) setSelectedItem({ id: ev.id, type: 'event', data: ev });
    } else if (node.type === 'entity') {
      // Clicking an entity applies entityRefs filter
      updateFilter('entityRefs', [node.id]);
    }
  };

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="body2" sx={{ p: 1 }}>
        GraphView {showClusters && `— clusters: ${cooccurrence.length} pairs`}
      </Typography>
      <Box sx={{ flex: 1, minHeight: 300 }}>
        <ForceGraph2D
          ref={fgRef}
          graphData={{ nodes, links }}
          nodeLabel={(n: GraphNode) => n.label || n.id}
          nodeRelSize={5}
          linkColor={(l: GraphLink) => l.co ? 'rgba(255,170,0,0.65)' : l.tco ? 'rgba(0,191,255,0.45)' : 'rgba(0,255,65,0.35)'}
          linkWidth={(l: GraphLink) => l.co ? Math.min(4, 1 + (l.count || 1) * 0.3) : l.tco ? Math.min(3, 1 + (l.count || 1) * 0.2) : 1}
          nodeColor={(n: GraphNode) => {
            if (n.type === 'event') return '#00bfff';
            // Highlight entity nodes involved in co-occurrence
            if (showClusters && (cooccurrence.some(p => p.a === n.id || p.b === n.id) || (tagCooccurrence || []).some(p => p.a === n.id || p.b === n.id))) return '#ffd54f';
            return '#00ff41';
          }}
          onNodeClick={(n) => handleNodeClick(n as GraphNode)}
        />
      </Box>
    </Box>
  );
};

export default GraphView;
