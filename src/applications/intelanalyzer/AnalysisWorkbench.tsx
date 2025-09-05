import React from 'react';
import { Box, Typography } from '@mui/material';
import { IntelWorkspaceProvider } from '../../services/intel/IntelWorkspaceContext';
import { FilterProvider } from './state/FilterContext';
import { SelectionProvider } from './state/SelectionContext';
import WorkbenchLayout from './layout/WorkbenchLayout';
import TimelineView from './views/TimelineView/TimelineView';

/**
 * Analysis Workbench - New IntelAnalyzer
 *
 * Replaces the old IntelAnalyzer with a workbench for analysis:
 * - Left: Filters and boards
 * - Center: Timeline/Map/Graph/Table views
 * - Right: Inspector
 */

const AnalysisWorkbench: React.FC = () => {
  // Left rail stub
  const leftRail = (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ color: '#00ff41' }}>
        Filters & Boards
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
        Coming soon...
      </Typography>
    </Box>
  );

  // Center view - Timeline
  const centerView = (
    <TimelineView onTimeFilterChange={(timeRange) => {
      // TODO: Update FilterContext with time range
      console.log('Time filter changed:', timeRange);
    }} />
  );

  // Right inspector stub
  const rightInspector = (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ color: '#00ff41' }}>
        Inspector
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
        Select an item to inspect details
      </Typography>
    </Box>
  );

  return (
    <IntelWorkspaceProvider>
      <FilterProvider>
        <SelectionProvider>
          <WorkbenchLayout
            leftRail={leftRail}
            centerView={centerView}
            rightInspector={rightInspector}
          />
        </SelectionProvider>
      </FilterProvider>
    </IntelWorkspaceProvider>
  );
};

export default AnalysisWorkbench;
