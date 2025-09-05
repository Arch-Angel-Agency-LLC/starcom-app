import React from 'react';
import { Box } from '@mui/material';

/**
 * WorkbenchLayout - Main layout for the Analysis Workbench
 *
 * Provides the three-panel layout:
 * - Left: Filters and board switcher
 * - Center: Timeline/Map/Graph/Table views
 * - Right: Inspector panel
 */
interface WorkbenchLayoutProps {
  leftRail: React.ReactNode;
  centerView: React.ReactNode;
  rightInspector: React.ReactNode;
}

const WorkbenchLayout: React.FC<WorkbenchLayoutProps> = ({
  leftRail,
  centerView,
  rightInspector
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Left Rail - Filters and Boards */}
      <Box
        sx={{
          width: '300px',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          overflowY: 'auto'
        }}
      >
        {leftRail}
      </Box>

      {/* Center View - Main content area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {centerView}
      </Box>

      {/* Right Inspector */}
      <Box
        sx={{
          width: '350px',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          overflowY: 'auto'
        }}
      >
        {rightInspector}
      </Box>
    </Box>
  );
};

export default WorkbenchLayout;
