import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../../../../services/intel/IntelWorkspaceContext', () => ({
  useIntelWorkspace: () => ({
    // Provide events with entityRefs so entity nodes E1 & E2 exist in the graph
    reports: [
      { id: 'rA', title: 'RA', createdAt: new Date('2025-01-01T00:00:00Z'), updatedAt: new Date('2025-01-01T00:00:00Z'), tags: [], categories: ['GENERAL'] },
      { id: 'rB', title: 'RB', createdAt: new Date('2025-01-01T01:00:00Z'), updatedAt: new Date('2025-01-01T01:00:00Z'), tags: [], categories: ['GENERAL'] }
    ],
    intelItems: []
  })
}));

vi.mock('../../../state/FilterContext', () => ({
  useFilter: () => ({ filters: {}, updateFilter: () => {} })
}));

vi.mock('../../../state/SelectionContext', () => ({
  useSelection: () => ({ selectedItem: null, setSelectedItem: () => {} })
}));

vi.mock('../../../state/CorrelationContext', () => ({
  useCorrelation: () => ({
    showClusters: true,
    // Ensure pairs reference entities that exist; GraphView creates entity nodes
    // from event.entityRefs, but eventsAdapter currently doesn't populate them.
    // We will mock adaptWorkspaceToEvents to inject entityRefs into events instead.
    cooccurrence: [ { a: 'E1', b: 'E2', count: 3 } ],
    tagCooccurrence: [],
    anomaliesByDay: new Set<string>(),
    setShowClusters: () => {}
  })
}));

// Inject entityRefs by mocking eventsAdapter
vi.mock('../../../adapters/eventsAdapter', async (orig) => {
  const actual = await (orig as any).default?.() ?? await import('../../../adapters/eventsAdapter');
  return {
    ...actual,
    adaptWorkspaceToEvents: (_reports: any, _items: any) => ([
      { id: 'evt1', title: 'Evt1', timestamp: new Date('2025-01-01T00:00:00Z').toISOString(), category: 'GENERAL', tags: [], sourceType: 'REPORT', sourceId: 'rA', entityRefs: ['E1','E2'] },
      { id: 'evt2', title: 'Evt2', timestamp: new Date('2025-01-01T01:00:00Z').toISOString(), category: 'GENERAL', tags: [], sourceType: 'REPORT', sourceId: 'rB', entityRefs: ['E2'] }
    ])
  };
});

vi.mock('../../../state/SelectionContext', () => ({
  useSelection: () => ({ selectedItem: null, setSelectedItem: () => {} })
}));

// Mock force graph to just render link info
vi.mock('react-force-graph-2d', () => ({
  __esModule: true,
  default: React.forwardRef(({ graphData }: any, _ref) => {
    const coLinks = (graphData.links || []).filter((l: any) => l.co);
    return <div data-testid="fg" data-colinks={coLinks.length}></div>;
  })
}));

import GraphView from '../GraphView';

describe('GraphView co-occurrence overlay', () => {
  it('includes co-occurrence links when showClusters is true', () => {
    render(<GraphView />);
    const fg = screen.getByTestId('fg');
    expect(fg.getAttribute('data-colinks')).toBe('1');
  });
});
