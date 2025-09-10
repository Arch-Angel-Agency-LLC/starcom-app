import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Box, Typography, Stack, Button, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import ForceGraph2D, { NodeObject, LinkObject, ForceGraphMethods } from 'react-force-graph-2d';
import { useIntelWorkspace } from '../../../../services/intel/IntelWorkspaceContext';
import { adaptWorkspaceToEvents } from '../../adapters/eventsAdapter';
import { useFilter, FilterState } from '../../state/FilterContext';
import { useSelection } from '../../state/SelectionContext';
import { useCorrelation } from '../../state/CorrelationContext';
import { isolateSubgraph } from './isolate';
import { loadPositions, savePositions, clearPositions, type LayoutMap } from './positionsStorage';
import { deriveWorkspaceHash, loadViews, saveViews, saveLastView, loadLastView, clearLastView, type ViewV2 } from './viewStorage';
import { validateViewName, dedupeName } from './viewValidation';

interface GraphNode extends NodeObject { id: string; type: 'event' | 'entity' | 'tag'; label?: string }
type Endpoint = string | { id: string };
interface GraphLink extends LinkObject { source: Endpoint; target: Endpoint; co?: boolean; tco?: boolean; count?: number }

type FGNodeWithPos = NodeObject & { x?: number; y?: number };
type ForceGraphAPI = ForceGraphMethods & { nodeById?: (id: string | number) => FGNodeWithPos | undefined };

function endpointId(ep: Endpoint): string { return typeof ep === 'string' ? ep : ep.id; }

const GraphView: React.FC = () => {
  const { reports, intelItems } = useIntelWorkspace();
  const { filters, updateFilter, setFilters } = useFilter();
  const { setSelectedItem } = useSelection();
  const fgRef = useRef<ForceGraphMethods | undefined>();
  const { showClusters, setShowClusters, cooccurrence, tagCooccurrence } = useCorrelation();

  // Controls state (Phase A minimal)
  const [layoutFrozen, setLayoutFrozen] = useState(false);
  const [sizingMode, setSizingMode] = useState<'fixed' | 'degree'>('fixed');
  const [isolate, setIsolate] = useState<{ rootId: string; depth: number } | null>(null);
  const [positions, setPositions] = useState<LayoutMap | null>(null);

  // Build a workspace signature for persistence keying
  const workspaceHash = useMemo(() => {
    const reportIds = reports.map(r => r.id);
    const itemIds = intelItems.map(i => i.id);
    return deriveWorkspaceHash({ reportIds, itemIds, name: 'intelAnalyzer' });
  }, [reports, intelItems]);

  // Saved views
  const [views, setViews] = useState<ViewV2[]>([]);
  const [viewsOpen, setViewsOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [rename, setRename] = useState<{ id: string; name: string } | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  useEffect(() => {
    setViews(loadViews(workspaceHash));
  setPositions(loadPositions(workspaceHash));
  }, [workspaceHash]);

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

  const baseGraph = useMemo(() => {
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

  const { nodes, links } = useMemo(() => {
    if (isolate && isolate.rootId) {
      return isolateSubgraph({ nodes: baseGraph.nodes, links: baseGraph.links.map(l => ({ source: String(l.source), target: String(l.target) })) }, isolate.rootId, isolate.depth);
    }
    return baseGraph;
  }, [baseGraph, isolate]);

  const handleNodeClick = (node: GraphNode, event?: MouseEvent) => {
    if (node.type === 'event') {
      const ev = filtered.find(e => e.id === node.id);
      if (ev) setSelectedItem({ id: ev.id, type: 'event', data: ev });
    } else if (node.type === 'entity') {
      // Clicking an entity applies entityRefs filter
      updateFilter('entityRefs', [node.id]);
    }
    // Alt-click to isolate around clicked node at depth 1
    if (event && event.altKey) {
      setIsolate({ rootId: node.id, depth: 1 });
    }
  };

  // Saved view ops (minimal)
  const addSavedView = useCallback((name?: string) => {
    const view: ViewV2 = {
      id: `${Date.now()}`,
      name: (name ?? newViewName)?.trim() || `View ${views.length + 1}`,
      createdAt: Date.now(),
      filters: filters as FilterState,
      showClusters,
      layoutFrozen,
      sizingMode,
      isolate
    };
    const val = validateViewName(view.name, views);
    if (!val.ok) { setNameError(val.error || 'Invalid'); return; }
    const next = [...views.filter(v => v.id !== view.id), view];
    setViews(next);
    saveViews(workspaceHash, next);
    saveLastView(workspaceHash, view.id);
    setNewViewName('');
    setNameError(null);
  }, [filters, showClusters, layoutFrozen, sizingMode, isolate, views, workspaceHash, newViewName]);

  const applyView = useCallback((v: ViewV2) => {
    // Apply all filters at once
    setFilters(v.filters as FilterState);
    setLayoutFrozen(v.layoutFrozen);
    setSizingMode(v.sizingMode);
    setIsolate(v.isolate ?? null);
  setShowClusters(v.showClusters);
    saveLastView(workspaceHash, v.id);
  }, [setFilters, workspaceHash, setShowClusters]);

  const deleteView = useCallback((id: string) => {
    const next = views.filter(v => v.id !== id);
    setViews(next);
    saveViews(workspaceHash, next);
    const last = loadLastView(workspaceHash);
    if (last === id) clearLastView(workspaceHash);
  }, [views, workspaceHash]);

  const startRename = useCallback((v: ViewV2) => {
    setRename({ id: v.id, name: v.name });
    setNameError(null);
  }, []);

  const commitRename = useCallback(() => {
    if (!rename) return;
    const val = validateViewName(rename.name, views.filter(v => v.id !== rename.id));
    if (!val.ok) { setNameError(val.error || 'Invalid'); return; }
    const next = views.map(v => (v.id === rename.id ? { ...v, name: rename.name.trim() } : v));
    setViews(next);
    saveViews(workspaceHash, next);
    setRename(null);
    setNameError(null);
  }, [rename, views, workspaceHash]);

  const duplicateView = useCallback((v: ViewV2) => {
    const copy: ViewV2 = { ...v, id: `${Date.now()}`, name: dedupeName(`${v.name} (copy)`, views) , createdAt: Date.now() };
    const next = [...views, copy];
    setViews(next);
    saveViews(workspaceHash, next);
    saveLastView(workspaceHash, copy.id);
  }, [views, workspaceHash]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'f') setLayoutFrozen(v => !v);
      if (e.key === 'g') setSizingMode(m => (m === 'fixed' ? 'degree' : 'fixed'));
  if (e.key === 'c') setShowClusters(!showClusters);
      if (e.key === 'Escape' && isolate) setIsolate(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isolate, setShowClusters, showClusters]);

  useEffect(() => {
    // Attempt to apply last view on mount
    const id = loadLastView(workspaceHash);
    if (!id) return;
    const v = views.find(x => x.id === id);
    if (v) applyView(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceHash]);

  // Apply saved node positions whenever saved positions or current nodes change
  useEffect(() => {
    if (!positions) return;
    const fg = fgRef.current as ForceGraphAPI | undefined;
    if (!fg) return;
    try {
      (nodes as GraphNode[]).forEach(n => {
        const p = positions[n.id];
        if (!p) return;
        const node = fg.nodeById?.(n.id);
        if (node) { node.x = p.x; node.y = p.y; }
      });
    } catch (_e) {
      // non-fatal
    }
  }, [positions, nodes]);

  // Freeze control: pause/resume simulation
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    try {
      if (layoutFrozen) fg.pauseAnimation?.(); else fg.resumeAnimation?.();
  } catch (_e) {
      // non-fatal
    }
  }, [layoutFrozen]);

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 1 }}>
        <Typography variant="body2">GraphView {showClusters && `— clusters: ${cooccurrence.length} pairs`}</Typography>
        <FormControlLabel control={<Switch checked={layoutFrozen} onChange={e => setLayoutFrozen(e.target.checked)} />} label="Freeze" />
        <FormControlLabel control={<Switch checked={showClusters} onChange={e => setShowClusters(e.target.checked)} />} label="Clusters" />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="sizing-label">Sizing</InputLabel>
          <Select labelId="sizing-label" label="Sizing" value={sizingMode} onChange={e => setSizingMode(e.target.value as 'fixed' | 'degree')}>
            <MenuItem value="fixed">Fixed</MenuItem>
            <MenuItem value="degree">Degree</MenuItem>
          </Select>
        </FormControl>
  <Button size="small" onClick={() => setViewsOpen(true)}>Manage Views</Button>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="views-label">Views</InputLabel>
          <Select labelId="views-label" label="Views" value="" displayEmpty onChange={e => {
            const id = String(e.target.value);
            const v = views.find(v => v.id === id);
            if (v) applyView(v);
          }} renderValue={() => 'Select View'}>
            {views.map(v => (
              <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button size="small" disabled={!layoutFrozen} onClick={() => {
          const fg = fgRef.current as ForceGraphAPI | undefined;
          if (!fg) return;
          const map: LayoutMap = {};
          (nodes as GraphNode[]).forEach(n => {
            const node = fg.nodeById?.(n.id);
            const x = node?.x ?? 0; const y = node?.y ?? 0;
            map[n.id] = { x, y };
          });
          savePositions(workspaceHash, map);
          setPositions(map);
        }}>Save Layout</Button>
        <Button size="small" disabled={!positions} onClick={() => {
          clearPositions(workspaceHash);
          setPositions(null);
        }}>Reset Layout</Button>
        {isolate && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 'auto' }}>
            <Typography variant="caption">Isolate: {isolate.rootId} (d={isolate.depth})</Typography>
            <Button size="small" onClick={() => setIsolate(i => (i ? { ...i, depth: Math.max(0, i.depth - 1) } : i))}>-</Button>
            <Button size="small" onClick={() => setIsolate(i => (i ? { ...i, depth: Math.min(5, i.depth + 1) } : i))}>+</Button>
            <Button size="small" onClick={() => setIsolate(null)}>Clear</Button>
          </Stack>
        )}
      </Stack>
      <Dialog open={viewsOpen} onClose={() => setViewsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Saved Views</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField label="New view name" size="small" value={newViewName} onChange={e => setNewViewName(e.target.value)} fullWidth error={!!nameError} helperText={nameError || ''} />
              <Button onClick={() => addSavedView()} disabled={newViewName.trim().length === 0}>Save</Button>
            </Stack>
            {views.length === 0 && <Typography variant="body2" color="text.secondary">No saved views yet.</Typography>}
            {views.map(v => (
              <Stack key={v.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ border: '1px solid var(--mui-palette-divider)', borderRadius: 1, p: 1 }}>
                <Stack>
                  {rename?.id === v.id ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField size="small" value={rename.name} onChange={e => setRename(r => r ? { ...r, name: e.target.value } : r)} error={!!nameError} helperText={nameError || ''} />
                      <Button size="small" onClick={commitRename}>OK</Button>
                      <Button size="small" onClick={() => { setRename(null); setNameError(null); }}>Cancel</Button>
                    </Stack>
                  ) : (
                    <Typography variant="subtitle2">{v.name}</Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">{new Date(v.createdAt).toLocaleString()}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button size="small" onClick={() => applyView(v)}>Apply</Button>
                  <Tooltip title="Duplicate">
                    <IconButton size="small" aria-label="duplicate" onClick={() => duplicateView(v)}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Rename">
                    <IconButton size="small" aria-label="rename" onClick={() => startRename(v)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <IconButton size="small" aria-label="delete" onClick={() => deleteView(v.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Box sx={{ flex: 1, minHeight: 300 }}>
        <ForceGraph2D
          ref={fgRef}
          graphData={{ nodes, links }}
          // Apply saved positions
          onEngineTick={() => {
            if (!positions || !layoutFrozen) return;
            const fg = fgRef.current as ForceGraphAPI | undefined;
            if (!fg) return;
            (nodes as GraphNode[]).forEach(n => {
              const p = positions[n.id];
              if (p) {
                const node = fg.nodeById?.(n.id);
                if (node) { node.x = p.x; node.y = p.y; }
              }
            });
          }}
          nodeLabel={(n: GraphNode) => n.label || n.id}
          nodeRelSize={5}
      nodeVal={(n: GraphNode) => {
            if (sizingMode === 'fixed') return 1;
            // degree sizing
            const id = n.id;
            let d = 0;
            for (const l of links as GraphLink[]) {
        const s = endpointId(l.source);
        const t = endpointId(l.target);
              if (s === id || t === id) d++;
            }
            return Math.max(1, Math.min(8, d * 0.5));
          }}
          linkColor={(l: GraphLink) => l.co ? 'rgba(255,170,0,0.65)' : l.tco ? 'rgba(0,191,255,0.45)' : 'rgba(0,255,65,0.35)'}
          linkWidth={(l: GraphLink) => l.co ? Math.min(4, 1 + (l.count || 1) * 0.3) : l.tco ? Math.min(3, 1 + (l.count || 1) * 0.2) : 1}
          nodeColor={(n: GraphNode) => {
            if (n.type === 'event') return '#00bfff';
            // Highlight entity nodes involved in co-occurrence
            if (showClusters && (cooccurrence.some(p => p.a === n.id || p.b === n.id) || (tagCooccurrence || []).some(p => p.a === n.id || p.b === n.id))) return '#ffd54f';
            return '#00ff41';
          }}
          onNodeClick={(n, e) => handleNodeClick(n as GraphNode, e as unknown as MouseEvent)}
        />
      </Box>
    </Box>
  );
};

export default GraphView;
