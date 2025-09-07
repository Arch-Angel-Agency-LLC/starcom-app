/* @vitest-environment jsdom */
import { vi } from 'vitest';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardsProvider } from '../../state/BoardsContext';
import { FilterProvider, useFilter } from '../../state/FilterContext';
import { SelectionProvider, useSelection, SelectionItem } from '../../state/SelectionContext';
import BoardsPanel from '../BoardsPanel';
import InspectorPanel from '../InspectorPanel';

// Reduce file handle usage by stubbing icon modules used by the panels
// Use inline factory functions to avoid hoist issues in Vitest
vi.mock('@mui/icons-material/Save', () => ({ default: () => null }));
vi.mock('@mui/icons-material/DeleteOutline', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Launch', () => ({ default: () => null }));
vi.mock('@mui/icons-material/PushPin', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Link', () => ({ default: () => null }));
vi.mock('@mui/icons-material/LocationOn', () => ({ default: () => null }));
vi.mock('@mui/icons-material/AccessTime', () => ({ default: () => null }));
vi.mock('@mui/icons-material/ViewCarousel', () => ({ default: () => null }));
vi.mock('@mui/icons-material/ViewArraySharp', () => ({ default: () => null }));

// Also stub the MUI icons barrel import used by InspectorPanel to prevent loading many files
vi.mock('@mui/icons-material', () => {
  const Icon = () => null;
  return {
    __esModule: true,
    PushPin: Icon,
    Link: Icon,
    Launch: Icon,
    LocationOn: Icon,
    AccessTime: Icon,
    default: {}
  };
});

// Stub EventDetails to avoid its internal icon/dependency imports during tests
vi.mock('../components/EventDetails', () => ({ default: () => null }));

// Provide a lightweight CorrelationContext mock so InspectorPanel can render
vi.mock('../../state/CorrelationContext', () => ({
  useCorrelation: () => ({
    showClusters: false,
    anomaliesByDay: new Set<string>(),
    cooccurrence: [],
    tagCooccurrence: [],
    placeClusters: [],
    setShowClusters: () => {}
  })
}));

const Harness: React.FC<PropsWithChildren<{
  initialActiveBoardId?: string | null;
  initialView?: 'timeline' | 'map' | 'graph' | 'table';
  presetSelection?: SelectionItem | null;
}>> = ({ initialActiveBoardId = null, initialView = 'timeline', presetSelection }) => {
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
  presetSelection?: SelectionItem | null;
}> = ({ activeBoardId, setActiveBoardId, currentView, setCurrentView, presetSelection }) => {
  const { setSelectedItem } = useSelection();
  const { setFilters } = useFilter();

  useEffect(() => {
    // Ensure deterministic base state
    setFilters({});
    if (presetSelection !== undefined) setSelectedItem(presetSelection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 360px', gap: 8 }}>
      <div>
        <BoardsPanel
          currentView={currentView}
          setCurrentView={setCurrentView}
          activeBoardId={activeBoardId}
          onActiveBoardChange={setActiveBoardId}
        />
      </div>
      <div />
      <div>
        <InspectorPanel />
      </div>
    </div>
  );
};

const makeSelection = (): SelectionItem => ({
  id: 'ev-999',
  type: 'event',
  data: {
    id: 'ev-999',
    title: 'Event 999',
    timestamp: new Date('2025-01-01T00:00:00Z').toISOString(),
    category: 'OSINT',
    tags: ['alpha'],
    sourceType: 'REPORT',
    sourceId: 'rep-42',
    entityRefs: ['ent-x']
  }
} as unknown as SelectionItem);

describe('Step 9 — Notes & Pins persistence per board', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('persists notes per board and swaps correctly when switching boards', async () => {
    const user = userEvent.setup();
    render(<Harness presetSelection={makeSelection()} />);

    // Create Board A
    await user.type(screen.getByPlaceholderText('New board name'), 'Board A');
    await user.click(screen.getByRole('button', { name: /save board/i }));
    expect(await screen.findByText(/Active: Board A/i)).toBeTruthy();

    // Add notes in Inspector and save
    const notesInput = screen.getByPlaceholderText('Add notes or hypotheses…');
    await user.clear(notesInput);
    await user.type(notesInput, 'Alpha note for board A');
    await user.click(screen.getByRole('button', { name: /save notes/i }));
  // BoardsPanel should reflect notes snippet (ensure we don't match textarea content)
  const alphaNotes = await screen.findAllByText(/Alpha note for board A/i);
  expect(alphaNotes.some(el => el.tagName.toLowerCase() !== 'textarea')).toBe(true);

    // Create Board B and make it active automatically
    const nameInput = screen.getByPlaceholderText('New board name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Board B');
    await user.click(screen.getByRole('button', { name: /save board/i }));
    expect(await screen.findByText(/Active: Board B/i)).toBeTruthy();

    // Set different notes for Board B
    const notesInputB = screen.getByPlaceholderText('Add notes or hypotheses…');
    await user.clear(notesInputB);
    await user.type(notesInputB, 'Bravo note for board B');
    await user.click(screen.getByRole('button', { name: /save notes/i }));
  const bravoNotes = await screen.findAllByText(/Bravo note for board B/i);
  expect(bravoNotes.some(el => el.tagName.toLowerCase() !== 'textarea')).toBe(true);

  // Switch back to Board A and verify original notes appear
  await user.click(screen.getByRole('button', { name: /Board A/i }));
    expect(await screen.findByText(/Active: Board A/i)).toBeTruthy();
    const alphaNotesBack = await screen.findAllByText(/Alpha note for board A/i);
    expect(alphaNotesBack.some(el => el.tagName.toLowerCase() !== 'textarea')).toBe(true);
  });

  it('updates pin count on pin action and pin lists swap per board', async () => {
    const user = userEvent.setup();
    render(<Harness presetSelection={makeSelection()} />);

    // Create Board A and pin current selection
    await user.type(screen.getByPlaceholderText('New board name'), 'Board A');
    await user.click(screen.getByRole('button', { name: /save board/i }));
    expect(await screen.findByText(/Active: Board A/i)).toBeTruthy();

    // Pin via Inspector action (tooltip label)
    await user.click(screen.getByRole('button', { name: /pin to board/i }));

    // Inspector chip shows pinned count; BoardsPanel chip shows pins
    expect(await screen.findByText(/Pinned: 1/i)).toBeTruthy();
    expect(await screen.findByText(/Pins: 1/i)).toBeTruthy();

    // Create Board B and ensure pins are independent
    const nameInput = screen.getByPlaceholderText('New board name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Board B');
    await user.click(screen.getByRole('button', { name: /save board/i }));
    expect(await screen.findByText(/Active: Board B/i)).toBeTruthy();

    // Initially no pins for B
    expect(screen.queryByText(/Pinned: 1/i)).toBeNull();
    expect(screen.queryByText(/Pins: 1/i)).toBeNull();

    // Pin on Board B
    await user.click(screen.getByRole('button', { name: /pin to board/i }));
    expect(await screen.findByText(/Pins: 1/i)).toBeTruthy();

    // Switch back to A and confirm counts for A remain 1
  await user.click(screen.getByRole('button', { name: /Board A/i }));
    expect(await screen.findByText(/Active: Board A/i)).toBeTruthy();
    expect(await screen.findByText(/Pins: 1/i)).toBeTruthy();
  });
});
