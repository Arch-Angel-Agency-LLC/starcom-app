import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FilterProvider, useFilter } from '../../state/FilterContext';
import { SelectionProvider } from '../../state/SelectionContext';

// Define samples before mocks
const sampleEvents = [
  { id: 'ev1', title: 'E1', timestamp: new Date().toISOString(), category: 'GENERAL', entityRefs: ['ent1'], sourceType: 'report', sourceId: 'r1' },
  { id: 'ev2', title: 'E2', timestamp: new Date().toISOString(), category: 'GENERAL', entityRefs: ['ent1','ent2'], sourceType: 'report', sourceId: 'r2' }
];

// Mock workspace and adapters to provide sample events consistently
vi.mock('../../../../services/intel/IntelWorkspaceContext', () => ({
  useIntelWorkspace: () => ({ reports: [], intelItems: [] })
}));

vi.mock('../../adapters/eventsAdapter', () => ({
  adaptWorkspaceToEvents: () => sampleEvents
}));

// Mock react-force-graph-2d to a simple test double
let lastGraphData = null;
vi.mock('react-force-graph-2d', () => ({
  default: (props) => {
    lastGraphData = props.graphData;
    return (
      <div>
        <button aria-label="click-entity" onClick={() => props.onNodeClick?.({ id: 'ent1', type: 'entity' })} />
        <div data-testid="nodes-count">{props.graphData?.nodes?.length ?? 0}</div>
        <div data-testid="links-count">{props.graphData?.links?.length ?? 0}</div>
      </div>
    );
  }
}));

// Mock maplibre-gl to a controllable test double
vi.mock('maplibre-gl', () => {
  let lastInstance;
  class MockMap {
  listeners;
  sources;
  zoom;
  bounds;
    constructor(_) {
      this.listeners = {};
      this.sources = {};
      this.zoom = 2;
      this.bounds = { getWest: () => -180, getEast: () => 180, getSouth: () => -85, getNorth: () => 85 };
      lastInstance = this;
    }
    on(event, layerOrCb, maybeCb) {
      const cb = typeof layerOrCb === 'function' ? layerOrCb : maybeCb;
      if (!this.listeners[event]) this.listeners[event] = [];
      if (cb) this.listeners[event].push(cb);
      // Simulate immediate load event
      if (event === 'load' && !maybeCb && typeof layerOrCb === 'function') {
        layerOrCb();
      }
    }
    off() {}
    addSource(id, source) { this.sources[id] = source; }
    addLayer(_) {}
    getSource(id) { return { setData: (_) => {} }; }
    getBounds() { return this.bounds; }
    getZoom() { return this.zoom; }
    queryRenderedFeatures() { return [{ properties: { id: 'ev1' } }]; }
    remove() {}
    emit(event, payload) { (this.listeners[event] || []).forEach(cb => cb(payload)); }
  }
  return { default: { Map: MockMap }, Map: MockMap, getLastInstance: () => lastInstance };
});

// Mock CorrelationContext used by GraphView and MapView overlays
vi.mock('../../state/CorrelationContext', () => ({
  useCorrelation: () => ({
    showClusters: true,
    cooccurrence: [],
    tagCooccurrence: [],
    anomaliesByDay: new Set<string>(),
    placeClusters: [],
    setShowClusters: () => {}
  })
}));

// Import after mocks are set up
import GraphView from '../GraphView/GraphView';
import MapView from '../MapView/MapView';

// Helper component to read filters in assertions
const ReadFilters = ({ onRead }) => {
  const { filters } = useFilter();
  React.useEffect(() => { onRead(filters); });
  return null;
};

describe('Phase B Step 8 Views', () => {
  beforeEach(() => { lastGraphData = null; });

  it('GraphView: clicking an entity node applies entityRefs filter and caps nodes', () => {
    let seenFilters: any = null;
    render(
      <FilterProvider>
        <SelectionProvider>
          <ReadFilters onRead={(f) => { seenFilters = f; }} />
          <GraphView />
        </SelectionProvider>
      </FilterProvider>
    );

    // caps: at least should produce nodes and links from sample events
    const nodesCount = Number(screen.getByTestId('nodes-count').textContent);
    const linksCount = Number(screen.getByTestId('links-count').textContent);
    expect(nodesCount).toBeGreaterThan(0);
    expect(linksCount).toBeGreaterThan(0);

    // click entity
    const btn = screen.getByRole('button', { name: 'click-entity' });
    fireEvent.click(btn);
    expect(seenFilters?.entityRefs).toEqual(['ent1']);
  });

  it('MapView: completing polygon adds geo filter (chip)', async () => {
    let seenFilters: any = null;
    render(
      <FilterProvider>
        <SelectionProvider>
          <ReadFilters onRead={(f) => { seenFilters = f; }} />
          <MapView />
        </SelectionProvider>
      </FilterProvider>
    );

    // Toggle draw
    const drawBtn = screen.getByRole('button', { name: /Draw polygon|Drawing/i });
    fireEvent.click(drawBtn);

    // Initially disabled
    const completeBtn = screen.getByRole('button', { name: 'Complete' });
    expect(completeBtn.getAttribute('disabled')).not.toBeNull();

    // Simulate 3 map clicks to create a polygon
    const maplibre = await import('maplibre-gl');
    const map = (maplibre as any).getLastInstance?.();
    expect(map).toBeTruthy();
    act(() => {
      map.emit('click', { lngLat: { lng: 0, lat: 0 } });
      map.emit('click', { lngLat: { lng: 1, lat: 0 } });
      map.emit('click', { lngLat: { lng: 1, lat: 1 } });
    });

    // Complete should now be enabled
    expect(completeBtn.getAttribute('disabled')).toBeNull();
    fireEvent.click(completeBtn);

    // Geo filter should be set with at least 3 points
    await waitFor(() => {
      expect(seenFilters?.geo?.polygon?.length).toBeGreaterThanOrEqual(3);
    });
  });
});
