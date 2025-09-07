/* @vitest-environment jsdom */
import React, { PropsWithChildren, useEffect, useState } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import BoardsPanel from '../BoardsPanel';
import { FilterProvider, useFilter, FilterState } from '../../state/FilterContext';
import { SelectionProvider, useSelection, SelectionItem } from '../../state/SelectionContext';
import { BoardsProvider } from '../../state/BoardsContext';

// Harness to expose and assert context values while rendering BoardsPanel
const Harness: React.FC<PropsWithChildren<{
  initialActiveBoardId?: string | null;
  initialView?: 'timeline' | 'map' | 'graph' | 'table';
  presetFilters?: FilterState;
  presetSelection?: SelectionItem | null;
}>> = ({ initialActiveBoardId = null, initialView = 'timeline', presetFilters, presetSelection }) => {
  const [activeBoardId, setActiveBoardId] = useState<string | null>(initialActiveBoardId);
  const [currentView, setCurrentView] = useState<'timeline' | 'map' | 'graph' | 'table'>(initialView);
  return (
    <MemoryRouter>
      <BoardsProvider>
        <FilterProvider>
          <SelectionProvider>
            <InnerHarness
              activeBoardId={activeBoardId}
              setActiveBoardId={setActiveBoardId}
              currentView={currentView}
              setCurrentView={setCurrentView}
              presetFilters={presetFilters}
              presetSelection={presetSelection}
            />
          </SelectionProvider>
        </FilterProvider>
      </BoardsProvider>
    </MemoryRouter>
  );
};

const InnerHarness: React.FC<{
  activeBoardId: string | null;
  setActiveBoardId: (id: string | null) => void;
  currentView: 'timeline' | 'map' | 'graph' | 'table';
  setCurrentView: (v: 'timeline' | 'map' | 'graph' | 'table') => void;
  presetFilters?: FilterState;
  presetSelection?: SelectionItem | null;
}> = ({ activeBoardId, setActiveBoardId, currentView, setCurrentView, presetFilters, presetSelection }) => {
  const { filters, setFilters } = useFilter();
  const { selectedItem, setSelectedItem } = useSelection();

  // Apply initial preset state once
  useEffect(() => {
    if (presetFilters) setFilters(presetFilters);
    if (presetSelection !== undefined) setSelectedItem(presetSelection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <BoardsPanel
        currentView={currentView}
        setCurrentView={setCurrentView}
        activeBoardId={activeBoardId}
        onActiveBoardChange={setActiveBoardId}
      />
      {/* Expose context for assertions */}
      <pre data-testid="filters-json">{JSON.stringify(filters)}</pre>
      <div data-testid="selection-id">{selectedItem?.id || ''}</div>
      <div data-testid="current-view">{currentView}</div>
      <div data-testid="active-board-id">{activeBoardId || ''}</div>
    </div>
  );
};

const makePreset = () => {
  const start = new Date('2025-01-01T00:00:00Z');
  const end = new Date('2025-01-02T00:00:00Z');
  const filters: FilterState = {
    timeRange: { start, end },
    tags: ['alpha', 'bravo'],
    categories: ['OSINT'],
    confidence: { min: 0.2, max: 0.8 },
  };
  const selection: SelectionItem = {
    id: 'ev-123',
    type: 'event',
    data: {
      id: 'ev-123',
      title: 'Event 123',
      timestamp: start.toISOString(),
      category: 'OSINT',
      tags: ['alpha'],
      sourceType: 'REPORT',
      sourceId: 'rep-1',
      entityRefs: ['ent-1'],
    },
  } as unknown as SelectionItem;
  return { filters, selection };
};

describe('BoardsPanel persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('saves a board and restores filters/selection across remount', async () => {
    const user = userEvent.setup();
    const { filters, selection } = makePreset();

    render(<Harness presetFilters={filters} presetSelection={selection} />);

    // Type a board name and click the adjacent save icon button
    const nameInput = screen.getByPlaceholderText('New board name');
    await user.type(nameInput, 'Test Board');

  // Click the Save board icon button
  const saveBtn = await screen.findByRole('button', { name: /save board/i });
  await user.click(saveBtn);

    // Active board label should appear
    expect(await screen.findByText(/Active: Test Board/i)).toBeTruthy();

    // Extract saved board id from storage
    const raw = localStorage.getItem('intelAnalyzer.boards');
    expect(raw).toBeTruthy();
    const saved = JSON.parse(raw!);
    expect(Array.isArray(saved)).toBe(true);
    const savedId: string = saved[0].id;

    // Verify URL deep link update includes board id indirectly by checking active board id rendered
    expect(screen.getByTestId('active-board-id').textContent).toBe(savedId);

    // Simulate a "refresh": unmount and remount with initialActiveBoardId
    cleanup();
    render(<Harness initialActiveBoardId={savedId} />);

    // After remount, BoardsPanel should load boards from localStorage and apply the active board state
    const filtersJson = screen.getByTestId('filters-json').textContent || '{}';
    const restored = JSON.parse(filtersJson) as FilterState;
    expect(restored.tags).toEqual(['alpha', 'bravo']);
    expect(restored.categories).toEqual(['OSINT']);
    expect(restored.timeRange).toBeTruthy();
    expect(screen.getByTestId('selection-id').textContent).toBe('ev-123');
  });
});
