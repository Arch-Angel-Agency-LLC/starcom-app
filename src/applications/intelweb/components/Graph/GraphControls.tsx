/**
 * GraphControls - Control panel for graph visualization
 * 
 * Phase 3: Provides controls for physics, filters, and mode switching
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useGraphContext } from './GraphContext';
import type { GraphFilters, PhysicsSettings } from './IntelGraph';

export const GraphControls: React.FC = () => {
  const {
    graphMode,
    setGraphMode,
    filters,
    setFilters,
    physics,
    setPhysics,
    nodeCount,
    edgeCount,
    frozen,
    setFrozen,
    saveLayout,
    resetLayout,
    timestamps,
    vaultHash,
    fullGraph,
    activeGraph,
    isolateState,
    applyIsolate,
    clearIsolate,
    sizingMode,
    setSizingMode
  } = useGraphContext() as any;

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'filters' | 'physics' | 'layout' | 'views'>('filters');

  // Persist panel open and active tab
  const PANEL_KEY = `${vaultHash}.ui.controlsOpen`;
  const TAB_KEY = `${vaultHash}.ui.controlsTab`;
  useEffect(() => {
    try {
      const open = localStorage.getItem(PANEL_KEY);
      const tab = localStorage.getItem(TAB_KEY) as typeof activeTab | null;
      if (open !== null) setIsPanelOpen(open === '1');
      if (tab && ['filters','physics','layout','views'].includes(tab)) setActiveTab(tab);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { try { localStorage.setItem(PANEL_KEY, isPanelOpen ? '1' : '0'); } catch {} }, [isPanelOpen]);
  useEffect(() => { try { localStorage.setItem(TAB_KEY, activeTab); } catch {} }, [activeTab]);

  // Saved Views (filters + physics + sizing + isolate)
  type SavedViewV2 = { id: string; name: string; filters: GraphFilters; physics: PhysicsSettings; createdAt: number; version: 2; sizingMode: 'degree'|'confidence'; layoutFrozen: boolean; isolate?: { rootId: string; depth: number } | null };
  type LegacySavedView = { id: string; name: string; filters: GraphFilters; physics: PhysicsSettings; createdAt: number; version?: number };
  type SavedView = SavedViewV2 | LegacySavedView;

  const legacyViewsKey = 'intelweb.savedViews';
  const STORAGE_KEY = `${vaultHash}:views`;
  const LAST_VIEW_POINTER = 'intelweb:v1:lastView';
  useEffect(() => {
    // migrate legacy saved views once
    try {
      const migratedFlag = localStorage.getItem(`${vaultHash}:migratedViews`);
      if (!migratedFlag) {
        const legacy = localStorage.getItem(legacyViewsKey);
        if (legacy) {
          const existing = localStorage.getItem(STORAGE_KEY);
            if (!existing) {
              localStorage.setItem(STORAGE_KEY, legacy);
              console.log('[IntelWeb] Migrated legacy saved views to namespaced key');
            }
        }
        localStorage.setItem(`${vaultHash}:migratedViews`, '1');
      }
    } catch {}
  }, [vaultHash, STORAGE_KEY]);
  const loadViews = (): SavedView[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: SavedView[] = JSON.parse(raw);
      // migrate legacy entries to v2 shape in-memory
      return parsed.map(v => {
        if ((v as any).version === 2) return v as SavedViewV2;
        const legacy = v as LegacySavedView;
        const migrated: SavedViewV2 = {
          id: legacy.id,
            name: legacy.name,
            filters: legacy.filters,
            physics: legacy.physics,
            createdAt: legacy.createdAt,
            version: 2,
            sizingMode: 'degree',
            layoutFrozen: frozen,
            isolate: isolateState.active && isolateState.rootId ? { rootId: isolateState.rootId, depth: isolateState.depth } : null
        };
        return migrated;
      });
    } catch { return []; }
  };
  const saveViews = (views: SavedView[]) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(views)); } catch {} };
  const [views, setViews] = useState<SavedView[]>(loadViews());
  const [newViewName, setNewViewName] = useState('');

  const addSavedView = () => {
    const name = newViewName.trim() || `View ${views.length + 1}`;
    const view: SavedViewV2 = { id: `${Date.now()}`, name, filters, physics, createdAt: Date.now(), version: 2, sizingMode: 'degree', layoutFrozen: frozen, isolate: isolateState.active && isolateState.rootId ? { rootId: isolateState.rootId, depth: isolateState.depth } : null };
    const next = [...views.filter(v => (v as any).id !== view.id), view];
    setViews(next); saveViews(next); setNewViewName('');
    try { localStorage.setItem(LAST_VIEW_POINTER, JSON.stringify({ vaultHash, viewId: view.id })); } catch {}
  };
  const applyView = (view: SavedView) => {
    setFilters(view.filters); setPhysics(view.physics);
    if ((view as any).version === 2) {
      const v2 = view as SavedViewV2;
      setSizingMode(v2.sizingMode);
      if (v2.isolate && v2.isolate.rootId) {
        applyIsolate(v2.isolate.rootId, v2.isolate.depth);
      } else {
        clearIsolate();
      }
      if (v2.layoutFrozen !== frozen) setFrozen(v2.layoutFrozen);
    }
    try { localStorage.setItem(LAST_VIEW_POINTER, JSON.stringify({ vaultHash, viewId: view.id })); } catch {}
  };
  const deleteView = (id: string) => { const next = views.filter(v => v.id !== id); setViews(next); saveViews(next); };

  const handleNodeTypeToggle = (nodeType: string) => {
    const newNodeTypes = filters.nodeTypes.includes(nodeType)
      ? filters.nodeTypes.filter(t => t !== nodeType)
      : [...filters.nodeTypes, nodeType];
    
    setFilters({
      ...filters,
      nodeTypes: newNodeTypes
    });
  };

  const handleEdgeTypeToggle = (edgeType: string) => {
    const newEdgeTypes = filters.edgeTypes.includes(edgeType)
      ? filters.edgeTypes.filter(t => t !== edgeType)
      : [...filters.edgeTypes, edgeType];
    setFilters({
      ...filters,
      edgeTypes: newEdgeTypes
    });
  };

  const handleConfidenceChange = (min: number, max: number) => {
    setFilters({
      ...filters,
      confidenceRange: [min, max]
    });
  };

  const handleSearchChange = (query: string) => {
    setFilters({
      ...filters,
      searchQuery: query
    });
  };

  const clearSearch = () => handleSearchChange('');

  const handlePhysicsChange = (setting: keyof PhysicsSettings, value: number) => {
    setPhysics({
      ...physics,
      [setting]: value
    });
  };

  const setTimeRange = (range?: [Date, Date]) => {
    setFilters({
      ...filters,
      timeRange: range
    });
  };

  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  // Legend colors (aligned with IntelGraph getNodeColor) and edge colors
  const nodeColors: Record<string, string> = {
    report: '#4CAF50',
    entity: '#2196F3',
    location: '#FF9800',
    event: '#9C27B0',
    source: '#607D8B'
  };
  const edgeColors: Record<string, string> = {
    reference: '#9E9E9E',
    spatial: '#FF9800',
    temporal: '#9C27B0'
  };

  // Timeline Histogram (computed from timestamps)
  const ts = useMemo(() => (timestamps || []).map(d => d.getTime()).sort((a, b) => a - b), [timestamps]);
  const timeExtent = useMemo<[number, number] | null>(() => ts.length ? [ts[0], ts[ts.length - 1]] : null, [ts]);
  const BIN_COUNT = 30;
  const bins = useMemo(() => {
    if (!timeExtent) return [] as { x0: number; x1: number; count: number }[];
    const [minT, maxT] = timeExtent;
    const span = Math.max(1, maxT - minT);
    const width = span / BIN_COUNT;
    const arr = Array.from({ length: BIN_COUNT }, (_, i) => ({ x0: minT + i * width, x1: minT + (i + 1) * width, count: 0 }));
    let idx = 0;
    for (const t of ts) {
      while (idx < BIN_COUNT && t > arr[idx].x1) idx++;
      if (idx >= BIN_COUNT) break;
      if (t >= arr[idx].x0 && t <= arr[idx].x1) arr[idx].count++;
    }
    return arr;
  }, [ts, timeExtent]);
  const maxCount = useMemo(() => bins.reduce((m, b) => Math.max(m, b.count), 0), [bins]);

  // Dual slider (percent 0..100) mirrors filters.timeRange
  const [sliderRange, setSliderRange] = useState<[number, number]>([0, 100]);
  useEffect(() => {
    if (!timeExtent) return;
    if (filters.timeRange) {
      const [s, e] = filters.timeRange;
      const [minT, maxT] = timeExtent;
      const span = Math.max(1, maxT - minT);
      const lo = Math.max(0, Math.min(100, ((s.getTime() - minT) / span) * 100));
      const hi = Math.max(0, Math.min(100, ((e.getTime() - minT) / span) * 100));
      setSliderRange([lo, hi]);
    } else {
      setSliderRange([0, 100]);
    }
  }, [filters.timeRange, timeExtent]);

  const applySliderRange = (low: number, high: number) => {
    if (!timeExtent) return;
    const [minT, maxT] = timeExtent;
    const span = Math.max(1, maxT - minT);
    const s = new Date(minT + (low / 100) * span);
    const e = new Date(minT + (high / 100) * span);
    setTimeRange([s, e]);
  };

  // Reset filters to sensible defaults (OSINT)
  const resetFilters = () => {
    setFilters({
      confidenceRange: [0.3, 1.0],
      nodeTypes: ['report', 'entity', 'location', 'event', 'source'],
      edgeTypes: ['reference', 'spatial', 'temporal'],
      timeRange: undefined,
      searchQuery: ''
    });
  };

  useEffect(() => {
    // On mount / when views change, attempt to auto-apply last selected view for this vault
    try {
      const raw = localStorage.getItem(LAST_VIEW_POINTER);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { vaultHash: string; viewId: string } | null;
      if (!parsed || parsed.vaultHash !== vaultHash) return;
      const match = views.find(v => v.id === parsed.viewId);
      if (match) {
        // Apply silently without overwriting pointer
        setFilters(match.filters);
        setPhysics(match.physics);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [views, vaultHash]);

  useEffect(() => {
    const handler = (e: any) => {
      const node = e.detail;
      // Provide quick isolate event (depth default 2)
      (window as any).intelwebQuickIsolate = (depth = 2) => {
        try { window.dispatchEvent(new CustomEvent('intelweb:requestIsolate', { detail: { rootId: node.id, depth } })); } catch {}
      };
    };
    window.addEventListener('intelweb:nodeSelected', handler);
    return () => window.removeEventListener('intelweb:nodeSelected', handler);
  }, []);

  return (
    <div className="graph-controls">
      {/* Control Toggle Button */}
      <button 
        className={`controls-toggle ${isPanelOpen ? 'active' : ''}`}
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        title="Graph Controls"
        aria-label="Toggle graph controls"
      >
        ⚙️
      </button>

      {/* Mode Switcher (always visible) */}
      <div className="mode-switcher" role="radiogroup" aria-label="Graph mode">
        <button 
          className={graphMode === '2d' ? 'active' : ''}
          onClick={() => setGraphMode('2d')}
          title="2D Graph View"
          aria-pressed={graphMode === '2d'}
          aria-label="2D mode"
        >
          2D
        </button>
        <button 
          className={'disabled'}
          onClick={(e) => { e.preventDefault(); }}
          title="3D engine forthcoming"
          aria-disabled="true"
          aria-label="3D mode disabled"
        >
          3D
        </button>
      </div>

      {/* Graph Stats */}
      <div className="graph-stats-mini" aria-live="polite">
        <span title="Nodes">{nodeCount} 📄</span>
        <span title="Edges">{edgeCount} 🔗</span>
      </div>

      {/* Control Panel */}
      {isPanelOpen && (
        <div className="controls-panel">
          {/* Tab Navigation */}
          <div className="tab-nav" role="tablist" aria-label="Graph controls tabs">
            <button 
              className={activeTab === 'filters' ? 'active' : ''}
              onClick={() => setActiveTab('filters')}
              role="tab" aria-selected={activeTab === 'filters'}
            >
              Filters
            </button>
            <button 
              className={activeTab === 'physics' ? 'active' : ''}
              onClick={() => setActiveTab('physics')}
              role="tab" aria-selected={activeTab === 'physics'}
            >
              Physics
            </button>
            <button 
              className={activeTab === 'layout' ? 'active' : ''}
              onClick={() => setActiveTab('layout')}
              role="tab" aria-selected={activeTab === 'layout'}
            >
              Layout
            </button>
            <button 
              className={activeTab === 'views' ? 'active' : ''}
              onClick={() => setActiveTab('views')}
              role="tab" aria-selected={activeTab === 'views'}
            >
              Views
            </button>
          </div>

          {/* Filters Tab */}
          {activeTab === 'filters' && (
            <div className="tab-content filters-tab">
              {/* Search */}
              <div className="control-group">
                <label>Search</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Search nodes by title, tag, or description"
                    value={filters.searchQuery || ''}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    aria-label="Search nodes"
                  />
                  <button onClick={clearSearch} title="Clear search" aria-label="Clear search">✕</button>
                </div>
              </div>

              {/* Node Type Filters */}
              <div className="control-group">
                <label>Node Types</label>
                <div className="checkbox-group">
                  {['report', 'entity', 'location', 'event', 'source'].map(type => (
                    <label key={type} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={filters.nodeTypes.includes(type)}
                        onChange={() => handleNodeTypeToggle(type)}
                      />
                      <span className="node-type-badge">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Edge Type Filters */}
              <div className="control-group">
                <label>Edge Types</label>
                <div className="checkbox-group">
                  {['reference', 'spatial', 'temporal'].map(type => (
                    <label key={type} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={filters.edgeTypes.includes(type)}
                        onChange={() => handleEdgeTypeToggle(type)}
                      />
                      <span className="edge-type-badge">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Confidence Range */}
              <div className="control-group">
                <label>Confidence Range</label>
                <div className="range-inputs">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={filters.confidenceRange[0]}
                    onChange={(e) => handleConfidenceChange(
                      parseFloat(e.target.value),
                      filters.confidenceRange[1]
                    )}
                  />
                  <span>{Math.round(filters.confidenceRange[0] * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={filters.confidenceRange[1]}
                    onChange={(e) => handleConfidenceChange(
                      filters.confidenceRange[0],
                      parseFloat(e.target.value)
                    )}
                  />
                  <span>{Math.round(filters.confidenceRange[1] * 100)}%</span>
                </div>
              </div>

              {/* Time Window (Quick) */}
              <div className="control-group" style={{ marginTop: '8px' }}>
                <label>Time Window</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button disabled={!timestamps?.length} onClick={() => setTimeRange([new Date(now.getTime() - 24*60*60*1000), now])}>24h</button>
                  <button disabled={!timestamps?.length} onClick={() => setTimeRange([new Date(now.getTime() - 7*24*60*60*1000), now])}>7d</button>
                  <button disabled={!timestamps?.length} onClick={() => setTimeRange([new Date(now.getTime() - 30*24*60*60*1000), now])}>30d</button>
                  <button onClick={() => setTimeRange(undefined)}>All</button>
                  {(!timestamps || timestamps.length === 0) && (
                    <span style={{ marginLeft: 8, color: 'var(--intel-text-dim)' }}>(no timestamps available)</span>
                  )}
                  {timestamps && timestamps.length > 0 && filters.timeRange && (
                    <span style={{ marginLeft: 8, color: 'var(--intel-text-dim)' }}>
                      {fmt(filters.timeRange[0])} → {fmt(filters.timeRange[1])}
                    </span>
                  )}
                </div>
              </div>

              {/* Timeline Histogram + Range */}
              {timeExtent && bins.length > 0 && (
                <div className="control-group" style={{ marginTop: '6px' }}>
                  <label>Timeline</label>
                  <div style={{ width: '100%', maxWidth: 320 }}>
                    <svg width={320} height={70} style={{ display: 'block', width: '100%', height: 70 }}>
                      {bins.map((b, i) => {
                        const w = 320 / BIN_COUNT;
                        const h = maxCount > 0 ? Math.max(1, (b.count / maxCount) * 60) : 1;
                        const x = i * w;
                        const y = 65 - h;
                        const [lo, hi] = sliderRange;
                        const binCenterPct = ((b.x0 + (b.x1 - b.x0) / 2) - timeExtent[0]) / (timeExtent[1] - timeExtent[0]) * 100;
                        const inSel = binCenterPct >= lo && binCenterPct <= hi;
                        return (
                          <rect key={i} x={x + 1} y={y} width={w - 2} height={h}
                            fill={inSel ? 'var(--intel-accent, #4CAF50)' : '#666'} opacity={inSel ? 0.9 : 0.4}
                            rx={1} ry={1}
                          />
                        );
                      })}
                    </svg>
                    {/* Dual-range slider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="range" min={0} max={100} step={1}
                        value={sliderRange[0]}
                        onChange={(e) => {
                          const lo = Math.min(Number(e.target.value), sliderRange[1]);
                          setSliderRange([lo, sliderRange[1]]);
                          applySliderRange(lo, sliderRange[1]);
                        }}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="range" min={0} max={100} step={1}
                        value={sliderRange[1]}
                        onChange={(e) => {
                          const hi = Math.max(Number(e.target.value), sliderRange[0]);
                          setSliderRange([sliderRange[0], hi]);
                          applySliderRange(sliderRange[0], hi);
                        }}
                        style={{ flex: 1 }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--intel-text-dim)', fontSize: '0.8rem' }}>
                      <span>{new Date(timeExtent[0] + (sliderRange[0]/100) * (timeExtent[1]-timeExtent[0])).toISOString().slice(0,10)}</span>
                      <span>{new Date(timeExtent[0] + (sliderRange[1]/100) * (timeExtent[1]-timeExtent[0])).toISOString().slice(0,10)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="control-group" style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button onClick={resetFilters} title="Reset filters to defaults">Reset Filters</button>
              </div>

              {/* Legend */}
              <div className="control-group" style={{ marginTop: '10px' }}>
                <label>Legend</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['report','entity','location','event','source'] as const).map(t => (
                    <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 6px', borderRadius: 4, background: 'var(--intel-bg-secondary)', border: '1px solid var(--intel-border)' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: nodeColors[t] }} />
                      {t}
                    </span>
                  ))}
                  {(['reference','spatial','temporal'] as const).map(et => (
                    <span key={et} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 6px', borderRadius: 4, background: 'var(--intel-bg-secondary)', border: '1px solid var(--intel-border)' }}>
                      <span style={{ width: 16, height: 2, borderRadius: 1, background: edgeColors[et] }} />
                      {et}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Physics Tab */}
          {activeTab === 'physics' && (
            <div className="tab-content physics-tab">
              <div className="control-group">
                <label>Charge Force: {physics.charge}</label>
                <input
                  type="range"
                  min="-1000"
                  max="0"
                  step="10"
                  value={physics.charge}
                  onChange={(e) => handlePhysicsChange('charge', parseInt(e.target.value))}
                />
              </div>

              <div className="control-group">
                <label>Link Distance: {physics.linkDistance}</label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={physics.linkDistance}
                  onChange={(e) => handlePhysicsChange('linkDistance', parseInt(e.target.value))}
                />
              </div>

              <div className="control-group">
                <label>Link Strength: {physics.linkStrength.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={physics.linkStrength}
                  onChange={(e) => handlePhysicsChange('linkStrength', parseFloat(e.target.value))}
                />
              </div>

              <div className="control-group">
                <label>Friction: {physics.friction.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={physics.friction}
                  onChange={(e) => handlePhysicsChange('friction', parseFloat(e.target.value))}
                />
              </div>

              <div className="control-group">
                <label>Gravity: {physics.gravity.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={physics.gravity}
                  onChange={(e) => handlePhysicsChange('gravity', parseFloat(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* Layout Tab */}
          {activeTab === 'layout' && (
            <div className="tab-content layout-tab">
              {/* Isolate Mode Section */}
              <div className="control-group" style={{ marginBottom: '12px', padding: '8px', border: '1px solid var(--intel-border)', borderRadius: 6 }}>
                <label style={{ fontWeight: 600 }}>Isolate Mode (beta)</label>
                {isolateState?.active ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--intel-text-dim)' }}>Root: {isolateState.rootId} · Depth: {isolateState.depth}</span>
                    <button onClick={() => clearIsolate()} style={{ background: 'var(--intel-accent)', color: '#fff' }}>Exit Isolate</button>
                  </div>
                ) : (
                  <IsolateForm onApply={(rootId, depth) => applyIsolate(rootId, depth)} disabled={!fullGraph} />
                )}
              </div>

              <div className="layout-presets">
                <button onClick={() => {
                  setPhysics({
                    charge: -300,
                    linkDistance: 100,
                    linkStrength: 0.1,
                    friction: 0.9,
                    gravity: 0.1,
                    theta: 0.8,
                    alpha: 1,
                    alphaDecay: 0.0228
                  });
                }}>
                  Standard
                </button>
                <button onClick={() => {
                  setPhysics({
                    charge: -500,
                    linkDistance: 150,
                    linkStrength: 0.2,
                    friction: 0.95,
                    gravity: 0.05,
                    theta: 0.9,
                    alpha: 1,
                    alphaDecay: 0.0228
                  });
                }}>
                  Spread Out
                </button>
                <button onClick={() => {
                  setPhysics({
                    charge: -150,
                    linkDistance: 80,
                    linkStrength: 0.3,
                    friction: 0.8,
                    gravity: 0.2,
                    theta: 0.7,
                    alpha: 1,
                    alphaDecay: 0.0228
                  });
                }}>
                  Clustered
                </button>
              </div>

              {/* Freeze Layout Toggle */}
              <div className="control-group" style={{ marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={frozen}
                    onChange={(e) => setFrozen(e.target.checked)}
                  />
                  Freeze layout (persist positions)
                </label>
              </div>

              {/* Save/Reset Layout */}
              <div className="control-group" style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <button onClick={() => saveLayout?.()} title="Save current node positions">Save Layout</button>
                <button onClick={() => resetLayout?.()} title="Clear saved positions and unfreeze">Reset Layout</button>
              </div>

              {/* Sizing Mode */}
              <div className="control-group" style={{ marginTop: '8px' }}>
                <label style={{ fontWeight: 600 }}>Sizing Mode</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={sizingMode === 'degree' ? 'active' : ''} onClick={() => setSizingMode('degree')}>Degree</button>
                  <button className={sizingMode === 'confidence' ? 'active' : ''} onClick={() => setSizingMode('confidence')}>Confidence</button>
                </div>
              </div>
            </div>
          )}

          {/* Views Tab */}
          {activeTab === 'views' && (
            <div className="tab-content views-tab">
              <div className="control-group" style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="New view name"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button onClick={addSavedView} title="Save current filters and physics as a view">Save View</button>
              </div>
              {views.length === 0 ? (
                <div style={{ color: 'var(--intel-text-dim)', fontSize: '0.9rem' }}>No saved views yet.</div>
              ) : (
                <div className="saved-views-list" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {views.map(v => (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 8px', border: '1px solid var(--intel-border)', borderRadius: 6, background: 'var(--intel-bg-secondary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: 'var(--intel-text)' }}>{v.name}</strong>
                        <span style={{ color: 'var(--intel-text-dim)', fontSize: '0.8rem' }}>{new Date(v.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => applyView(v)}>Apply</button>
                        <button onClick={() => deleteView(v.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const IsolateForm: React.FC<{ onApply: (root: string, depth: number) => void; disabled?: boolean }> = ({ onApply, disabled }) => {
  const [root, setRoot] = React.useState('');
  const [depth, setDepth] = React.useState(1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input
        type="text"
        placeholder="Root node id"
        value={root}
        onChange={e => setRoot(e.target.value)}
        disabled={disabled}
        style={{ fontSize: '0.75rem' }}
      />
      <input
        type="number"
        min={1}
        max={6}
        value={depth}
        onChange={e => setDepth(Math.min(6, Math.max(1, parseInt(e.target.value) || 1)))}
        disabled={disabled}
        style={{ fontSize: '0.75rem' }}
      />
      <button disabled={disabled || !root} onClick={() => onApply(root, depth)}>Apply Isolate</button>
    </div>
  );
};

export default GraphControls;
