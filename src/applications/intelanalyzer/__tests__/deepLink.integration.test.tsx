import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock IntelWorkspaceContext to avoid real manager
vi.mock('../../services/intel/IntelWorkspaceContext', () => {
  const Ctx = React.createContext({ reports: [], intelItems: [], refresh: async () => {}, loading: false });
  const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => React.createElement(Ctx.Provider, { value: { reports: [], intelItems: [], refresh: async () => {}, loading: false } }, children);
  return {
    IntelWorkspaceProvider: Provider,
    useIntelWorkspace: () => React.useContext(Ctx)
  };
});

// Mock heavy libs that expect browser APIs
vi.mock('maplibre-gl', () => {
  class MockMap {
    listeners: Record<string, Function[]> = {};
    on(ev: string, cb: any) { (this.listeners[ev] ||= []).push(cb); if (ev === 'load' && typeof cb === 'function') cb(); }
    off() {}
    addSource() {}
    addLayer() {}
    getSource() { return { setData: () => {} }; }
    getBounds() { return { getWest: () => -180, getEast: () => 180, getSouth: () => -85, getNorth: () => 85 }; }
    getZoom() { return 2; }
    queryRenderedFeatures() { return []; }
    remove() {}
  }
  return { Map: MockMap, default: { Map: MockMap } };
});

vi.mock('react-force-graph-2d', () => ({ default: () => null }));

// Mock InspectorPanel only
vi.mock('../panels/InspectorPanel', () => ({ default: () => React.createElement('div', { 'data-testid': 'inspector-panel' }) }));
vi.mock('../views/MapView/MapView', () => ({ default: () => null }));
vi.mock('../views/GraphView/GraphView', () => ({ default: () => null }));
vi.mock('../views/TimelineView/TimelineView', () => ({ default: () => null }));
vi.mock('../views/TableView/TableView', () => ({ default: () => React.createElement('div', null) }));

// Targeted icon mocks to avoid EMFILE from many icon files
vi.mock('@mui/icons-material/DeleteOutline', () => ({ default: () => React.createElement('span', null) }));
vi.mock('@mui/icons-material/Save', () => ({ default: () => React.createElement('span', null) }));
vi.mock('@mui/icons-material/Launch', () => ({ default: () => React.createElement('span', null) }));

import AnalysisWorkbench from '../AnalysisWorkbench';

const STORAGE_KEY = 'intelAnalyzer.boards';

describe('Deep Link integration — board and filters', () => {
  beforeEach(() => {
    // Reset storage
    localStorage.removeItem(STORAGE_KEY);
    // Preload a board with timeRange as strings
    const board = {
      id: 'b1',
      name: 'Board One',
      savedAt: Date.now(),
      state: {
        view: 'table',
        filters: {
          timeRange: { start: '2024-01-01T00:00:00.000Z', end: '2024-01-02T00:00:00.000Z' },
          tags: ['alpha']
        },
        selection: null
      }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([board]));
  });

  it('applies board from URL and revives timeRange to Date', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/', search: '?view=graph&board=b1' }]}>
        <AnalysisWorkbench />
      </MemoryRouter>
    );

  // Active board label appears
  const activeLabel = await screen.findByTestId('active-board-label');
  expect(activeLabel.textContent || '').toMatch(/Active:\s*Board One/i);

  // The FilterPanel Apply button for time range should be enabled due to valid revived dates in inputs
  const applyButton = await screen.findByTestId('apply-time-range');
  expect(applyButton.getAttribute('disabled')).toBeNull();
  });
});
