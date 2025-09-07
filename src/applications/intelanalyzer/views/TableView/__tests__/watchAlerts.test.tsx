import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TableView from '../TableView';
import { FilterProvider } from '../../../state/FilterContext';
import { SelectionProvider } from '../../../state/SelectionContext';
import { vi } from 'vitest';

const events = [
  { id: 'e1', title: 'Event 1', timestamp: new Date().toISOString(), category: 'GENERAL', tags: ['alpha','beta'], sourceType: 'REPORT', sourceId: 'r1', entityRefs: [], lat: 0, lon: 0 },
  { id: 'e2', title: 'Event 2', timestamp: new Date().toISOString(), category: 'GENERAL', tags: ['gamma'], sourceType: 'REPORT', sourceId: 'r2', entityRefs: ['ENT-1'] },
];

vi.mock('../../../state/BoardsContext', () => ({
  useBoards: () => ({
    boards: [{ id: 'b1', name: 'B', savedAt: Date.now(), state: { view: 'table', filters: {}, selection: null, watch: { entities: ['ENT-1'], tags: ['alpha'] } } }],
    activeBoardId: 'b1'
  })
}));

vi.mock('../../../state/CorrelationContext', () => ({
  useCorrelation: () => ({ showClusters: false, anomaliesByDay: new Set<string>() })
}));

describe('TableView watch alerts', () => {
  it('shows header watch hits count and marks rows with data attribute', () => {
    render(
      <FilterProvider>
        <SelectionProvider>
          <TableView events={events as any} />
        </SelectionProvider>
      </FilterProvider>
    );
    expect(screen.getByTestId('watch-hits-count')).toHaveTextContent('2');
    const rows = screen.getAllByRole('row');
    // Ignore header row, check at least one body row has data-watch-hit
    const hitRows = rows.filter(r => r.getAttribute('data-watch-hit') === 'true');
    expect(hitRows.length).toBeGreaterThanOrEqual(1);
  });
});
