import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TableView from '../TableView';
import { FilterProvider } from '../../../state/FilterContext';
import { SelectionProvider } from '../../../state/SelectionContext';

const events = [
  { id: 'e1', title: 'Event 1', timestamp: new Date().toISOString(), category: 'GENERAL', tags: ['alpha','beta'], sourceType: 'REPORT', sourceId: 'r1', entityRefs: [], lat: 0, lon: 0 },
  { id: 'e2', title: 'Event 2', timestamp: new Date().toISOString(), category: 'GENERAL', tags: ['gamma'], sourceType: 'REPORT', sourceId: 'r2', entityRefs: [] },
];

// Mock BoardsContext to provide a single active board with a tag watchlist
vi.mock('../../../state/BoardsContext', () => ({
  useBoards: () => ({
    boards: [{ id: 'b1', name: 'B', savedAt: Date.now(), state: { view: 'table', filters: {}, selection: null, watch: { entities: [], tags: ['alpha'] } } }],
    activeBoardId: 'b1'
  })
}));

// Mock Correlation to avoid unrelated chips interfering
vi.mock('../../../state/CorrelationContext', () => ({
  useCorrelation: () => ({ showClusters: false, anomaliesByDay: new Set<string>() })
}));

describe('TableView watchlist marking', () => {
  it('marks rows with Watch chip when event matches watched tag', () => {
    render(
      <FilterProvider>
        <SelectionProvider>
          <TableView events={events as any} />
        </SelectionProvider>
      </FilterProvider>
    );
    const rows = screen.getAllByRole('row');
    // header row exists separately; look for any text matching 'Watch'
    const chips = screen.getAllByText('Watch');
    expect(chips.length).toBeGreaterThanOrEqual(1);
  });
});
