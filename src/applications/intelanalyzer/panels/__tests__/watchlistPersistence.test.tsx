import React from 'react';
import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilterPanel from '../../panels/FilterPanel';
import { FilterProvider } from '../../state/FilterContext';
import { BoardsContext } from '../../state/BoardsContext';
import type { BoardState } from '../../state/BoardsTypes';
vi.mock('../../state/CorrelationContext', () => ({
  useCorrelation: () => ({ showClusters: false, setShowClusters: () => {}, anomaliesByDay: new Set<string>() })
}));

// Minimal BoardsContext harness to verify watchlist persistence in context

describe('Boards watchlist persistence', () => {
  it('adds tag and entity to watchlist and persists in provider state', () => {
    const TestHarness: React.FC = () => {
      const [boards, setBoards] = React.useState<BoardState[]>([
        { id: 'b1', name: 'B', savedAt: Date.now(), state: { view: 'table', filters: {} as any, selection: null, watch: { entities: [] as string[], tags: [] as string[] } } } as BoardState
      ]);
      const [activeBoardId, setActiveBoardId] = React.useState('b1');
      const ctx = React.useMemo(() => ({
        boards,
        activeBoardId,
        setActiveBoardId,
        createBoard: (b: any) => b,
        deleteBoard: () => {},
        updateActiveBoardState: (patch: any) => {
          setBoards(prev => prev.map(x => x.id === activeBoardId ? { ...x, state: { ...x.state, ...patch } } : x));
        },
        addPin: () => {},
        removePin: () => {},
        setNotes: () => {},
        addWatchTag: (tag: string) => {
          setBoards(prev => prev.map(x => x.id === activeBoardId ? { ...x, state: { ...x.state, watch: { entities: x.state.watch?.entities ?? [], tags: [...(x.state.watch?.tags ?? []), tag] } } } : x));
        },
        removeWatchTag: (tag: string) => {
          setBoards(prev => prev.map(x => x.id === activeBoardId ? { ...x, state: { ...x.state, watch: { entities: x.state.watch?.entities ?? [], tags: (x.state.watch?.tags ?? []).filter((t: string) => t !== tag) } } } : x));
        },
        addWatchEntity: (id: string) => {
          setBoards(prev => prev.map(x => x.id === activeBoardId ? { ...x, state: { ...x.state, watch: { tags: x.state.watch?.tags ?? [], entities: [...(x.state.watch?.entities ?? []), id] } } } : x));
        },
        removeWatchEntity: (id: string) => {
          setBoards(prev => prev.map(x => x.id === activeBoardId ? { ...x, state: { ...x.state, watch: { tags: x.state.watch?.tags ?? [], entities: (x.state.watch?.entities ?? []).filter((e: string) => e !== id) } } } : x));
        },
      }), [boards, activeBoardId]);
      return (
        <BoardsContext.Provider value={ctx as any}>
          <FilterProvider>
            <FilterPanel />
            <div data-testid="snapshot">{JSON.stringify(boards)}</div>
          </FilterProvider>
        </BoardsContext.Provider>
      );
    };

    render(<TestHarness />);

    // Add tag
    const addTag = screen.getByPlaceholderText('Add tag to watch…');
    fireEvent.change(addTag, { target: { value: 'alpha' } });
    fireEvent.keyPress(addTag, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Add entity
    const addEnt = screen.getByPlaceholderText('Add entity id to watch…');
    fireEvent.change(addEnt, { target: { value: 'ENT-1' } });
    fireEvent.keyPress(addEnt, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Validate chips visible
    expect(screen.getByText('#alpha')).toBeInTheDocument();
    expect(screen.getByText('ENT-1')).toBeInTheDocument();

    // Snapshot reflect persisted state
    const snap = screen.getByTestId('snapshot');
    const state = JSON.parse(snap.textContent || '[]');
    expect(state[0].state.watch.tags).toContain('alpha');
    expect(state[0].state.watch.entities).toContain('ENT-1');
  });
});
