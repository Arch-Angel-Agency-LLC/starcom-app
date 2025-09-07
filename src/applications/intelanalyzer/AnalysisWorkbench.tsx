import React, { useState, useMemo, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { IntelWorkspaceProvider, useIntelWorkspace } from '../../services/intel/IntelWorkspaceContext';
import { FilterProvider, useFilter, FilterState } from './state/FilterContext';
import { SelectionProvider, useSelection } from './state/SelectionContext';
import { BoardsProvider } from './state/BoardsContext';
import WorkbenchLayout from './layout/WorkbenchLayout';
import TimelineView from './views/TimelineView/TimelineView';
import MapView from './views/MapView/MapView';
import GraphView from './views/GraphView/GraphView';
import TableView from './views/TableView/TableView';
import FilterPanel from './panels/FilterPanel';
import InspectorPanel from './panels/InspectorPanel';
import BoardsPanel from './panels/BoardsPanel';
import { adaptWorkspaceToEvents } from './adapters/eventsAdapter';
import { CorrelationProvider } from './state/CorrelationContext';
import {
  decodeDeepLink,
  encodeFilters,
  decodeFilters,
  DebouncedURLUpdater,
  reviveFilterState
} from './utils/deepLink';

const DeepLinkSync: React.FC = () => {
  const { setFilters } = useFilter();
  const { setSelectedItem } = useSelection();
  const { reports, intelItems } = useIntelWorkspace();
  const location = useLocation();

  // Initialize from URL on mount
  useEffect(() => {
    const urlState = decodeDeepLink(location.search);
    if (urlState.filters) {
      const decodedFilters = decodeFilters(urlState.filters);
      setFilters(reviveFilterState(decodedFilters as FilterState));
    }
    if (urlState.selected) {
      // Try to resolve selection from workspace data
      try {
        const events = adaptWorkspaceToEvents(reports, intelItems);
        const ev = events.find(e => e.id === urlState.selected);
        if (ev) {
          setSelectedItem({ id: ev.id, type: 'event', data: ev });
          return;
        }
        const report = (reports || []).find(r => r.id === urlState.selected);
        if (report) {
          setSelectedItem({ id: report.id, type: 'report', data: report });
          return;
        }
        const intel = (intelItems || []).find(i => i.id === urlState.selected);
        if (intel) {
          setSelectedItem({ id: intel.id, type: 'intelItem', data: intel });
          return;
        }
        // If not found, leave selection null
      } catch (err) {
        // Non-fatal: selection restoration best-effort
        console.warn('DeepLinkSync: failed to restore selection from URL', err);
      }
    }
  }, [setFilters, setSelectedItem, reports, intelItems, location.search]);

  return null; // This component doesn't render anything
};

const WorkbenchContent: React.FC = () => {
  const { reports, intelItems } = useIntelWorkspace();
  const location = useLocation();
  type WorkbenchView = 'timeline' | 'table' | 'map' | 'graph';
  const [currentView, setCurrentView] = useState<WorkbenchView>('timeline');
  // Bring filter + selection into scope for deep-link syncing including view param
  const { filters, updateFilter } = useFilter();
  const { selectedItem } = useSelection();
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);

  // Adapt workspace data to events
  const events = useMemo(() => {
    return adaptWorkspaceToEvents(reports, intelItems);
  }, [reports, intelItems]);

  // Initialize current view from deep link on mount (inbound parse)
  useEffect(() => {
    const urlState = decodeDeepLink(location.search);
    const allowedViews: WorkbenchView[] = ['timeline', 'table', 'map', 'graph'];
    if (urlState.view && allowedViews.includes(urlState.view as WorkbenchView)) {
      setCurrentView(urlState.view as WorkbenchView);
    }
    if (urlState.board) {
      setActiveBoardId(urlState.board);
    }
  }, [location.search]);

  // Left rail with filters
  const leftRail = (
    <Box>
      <BoardsPanel
        currentView={currentView}
        setCurrentView={(v) => setCurrentView(v as 'timeline' | 'table')}
        activeBoardId={activeBoardId}
        onActiveBoardChange={setActiveBoardId}
      />
      <FilterPanel />
    </Box>
  );

  // Center view based on selection
  const centerView = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* View Switcher */}
      <Box sx={{ p: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Button
          variant={currentView === 'timeline' ? 'contained' : 'outlined'}
          onClick={() => setCurrentView('timeline')}
          sx={{ mr: 1 }}
        >
          Timeline
        </Button>
  <Button variant={currentView === 'table' ? 'contained' : 'outlined'} onClick={() => setCurrentView('table')}>Table</Button>
  <Button variant={currentView === 'map' ? 'contained' : 'outlined'} onClick={() => setCurrentView('map')}>Map</Button>
  <Button variant={currentView === 'graph' ? 'contained' : 'outlined'} onClick={() => setCurrentView('graph')}>Graph</Button>
      </Box>

      {/* Current View */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {currentView === 'timeline' ? (
          <TimelineView onTimeFilterChange={(timeRange) => {
            if (timeRange) {
              updateFilter('timeRange', { start: timeRange.start, end: timeRange.end });
            } else {
              updateFilter('timeRange', undefined);
            }
          }} />
        ) : currentView === 'table' ? (
          <TableView events={events} />
        ) : currentView === 'map' ? (
          <MapView />
        ) : (
          <GraphView />
        )}
      </Box>
    </Box>
  );

  // Right inspector
  const rightInspector = <InspectorPanel />;

  // Unified deep link outbound sync including view param (view auto-updates on change)
  useEffect(() => {
    const updater = new DebouncedURLUpdater();
    updater.update({
      filters: encodeFilters(filters),
      selected: selectedItem?.id,
    view: currentView,
    board: activeBoardId || undefined
    });
  }, [filters, selectedItem, currentView, activeBoardId]);

  return (
    <WorkbenchLayout
      leftRail={leftRail}
      centerView={centerView}
      rightInspector={rightInspector}
    />
  );
};

/**
 * Analysis Workbench - New IntelAnalyzer
 *
 * Replaces the old IntelAnalyzer with a workbench for analysis:
 * - Left: Filters and boards
 * - Center: Timeline/Map/Graph/Table views
 * - Right: Inspector
 */

const AnalysisWorkbench: React.FC = () => {
  return (
    <IntelWorkspaceProvider>
      <BoardsProvider>
        <FilterProvider>
          <SelectionProvider>
            <CorrelationProvider>
              <DeepLinkSync />
              <WorkbenchContent />
            </CorrelationProvider>
          </SelectionProvider>
        </FilterProvider>
      </BoardsProvider>
    </IntelWorkspaceProvider>
  );
};

export default AnalysisWorkbench;
