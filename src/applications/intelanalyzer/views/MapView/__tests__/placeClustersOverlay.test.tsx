import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks must be declared before modules are imported
vi.mock('../../../../../services/intel/IntelWorkspaceContext', () => ({
  useIntelWorkspace: () => ({ reports: [], intelItems: [] })
}));

vi.mock('../../../adapters/eventsAdapter', () => ({
  adaptWorkspaceToEvents: () => ([
    { id: 'a1', title: 'A1', timestamp: new Date().toISOString(), category: 'GENERAL', tags: [], lat: 37.77, lon: -122.41, sourceType: 'REPORT', sourceId: 'r1', entityRefs: [] },
    { id: 'a2', title: 'A2', timestamp: new Date().toISOString(), category: 'GENERAL', tags: [], lat: 37.76, lon: -122.42, sourceType: 'REPORT', sourceId: 'r2', entityRefs: [] },
    { id: 'a3', title: 'A3', timestamp: new Date().toISOString(), category: 'GENERAL', tags: [], lat: 37.75, lon: -122.43, sourceType: 'REPORT', sourceId: 'r3', entityRefs: [] },
  ])
}));

vi.mock('maplibre-gl', () => {
  class MockMap {
    listeners: Record<string, Function[]> = {};
    constructor(_: any) {}
    on(event: string, layerOrCb: any, maybeCb?: any) {
      const cb = typeof layerOrCb === 'function' ? layerOrCb : maybeCb;
      if (!this.listeners[event]) this.listeners[event] = [];
      if (cb) this.listeners[event].push(cb);
      if (event === 'load' && typeof layerOrCb === 'function') layerOrCb();
    }
    off() {}
    addSource(_: any, __: any) {}
    addLayer(_: any) {}
    getSource(_: any) { return { setData: (_d: any) => {} }; }
    getBounds() { return { getWest: () => -180, getSouth: () => -85, getEast: () => 180, getNorth: () => 85 }; }
    getZoom() { return 2; }
    queryRenderedFeatures() { return []; }
    remove() {}
  }
  return { default: { Map: MockMap }, Map: MockMap };
});

vi.mock('../../../state/CorrelationContext', () => ({
  useCorrelation: () => ({
    showClusters: true,
    placeClusters: [{ key: '0:0', center: [0, 0], count: 3 }],
    cooccurrence: [],
    tagCooccurrence: [],
    anomaliesByDay: new Set<string>(),
    setShowClusters: () => {}
  })
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { FilterProvider } from '../../../state/FilterContext';
import { SelectionProvider } from '../../../state/SelectionContext';


import MapView from '../MapView';

describe('MapView place clusters overlay', () => {
  beforeEach(() => { localStorage.setItem('intelAnalyzer.showClusters', 'false'); });

  it('shows a non-zero place clusters count when clusters are enabled', () => {
    render(
      <FilterProvider>
        <SelectionProvider>
          <MapView />
        </SelectionProvider>
      </FilterProvider>
    );
    const label = screen.getByTestId('place-clusters-count');
    const num = Number(label.textContent?.match(/(\d+)/)?.[1] ?? '0');
    expect(num).toBeGreaterThanOrEqual(1);
  });
});
