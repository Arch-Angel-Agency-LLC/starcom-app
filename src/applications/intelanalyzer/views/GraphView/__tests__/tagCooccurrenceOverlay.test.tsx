import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../../../../services/intel/IntelWorkspaceContext', () => ({
  useIntelWorkspace: () => ({
    reports: [
      { id: 'rA', title: 'RA', createdAt: new Date('2025-01-01T00:00:00Z'), updatedAt: new Date('2025-01-01T00:00:00Z'), tags: ['alpha','beta'], categories: ['GENERAL'] },
      { id: 'rB', title: 'RB', createdAt: new Date('2025-01-01T01:00:00Z'), updatedAt: new Date('2025-01-01T01:00:00Z'), tags: ['beta','gamma'], categories: ['GENERAL'] },
      { id: 'rC', title: 'RC', createdAt: new Date('2025-01-02T00:00:00Z'), updatedAt: new Date('2025-01-02T00:00:00Z'), tags: ['alpha','beta'], categories: ['GENERAL'] },
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
    cooccurrence: [],
    tagCooccurrence: [ { a: 'alpha', b: 'beta', count: 2 } ],
    anomaliesByDay: new Set<string>(),
    setShowClusters: () => {}
  })
}));

vi.mock('../../../adapters/eventsAdapter', async (orig) => {
  const actual = await (orig as any).default?.() ?? await import('../../../adapters/eventsAdapter');
  return {
    ...actual,
    adaptWorkspaceToEvents: (_reports: any, _items: any) => ([
      { id: 'evt1', title: 'Evt1', timestamp: new Date('2025-01-01T00:00:00Z').toISOString(), category: 'GENERAL', tags: ['alpha','beta'], sourceType: 'REPORT', sourceId: 'rA', entityRefs: [] },
      { id: 'evt2', title: 'Evt2', timestamp: new Date('2025-01-01T01:00:00Z').toISOString(), category: 'GENERAL', tags: ['beta','gamma'], sourceType: 'REPORT', sourceId: 'rB', entityRefs: [] },
      { id: 'evt3', title: 'Evt3', timestamp: new Date('2025-01-02T00:00:00Z').toISOString(), category: 'GENERAL', tags: ['alpha','beta'], sourceType: 'REPORT', sourceId: 'rC', entityRefs: [] },
    ])
  };
});

// Mock force graph to expose tag co-occurrence links count
vi.mock('react-force-graph-2d', () => ({
  __esModule: true,
  default: React.forwardRef(({ graphData }: any, _ref) => {
    const tcoLinks = (graphData.links || []).filter((l: any) => l.tco);
    return <div data-testid="fg" data-tcolinks={tcoLinks.length}></div>;
  })
}));

import GraphView from '../GraphView';

describe('GraphView tag co-occurrence overlay', () => {
  it('includes tag co-occurrence links when showClusters is true', () => {
    render(<GraphView />);
    const fg = screen.getByTestId('fg');
    expect(fg.getAttribute('data-tcolinks')).toBe('1');
  });
});
