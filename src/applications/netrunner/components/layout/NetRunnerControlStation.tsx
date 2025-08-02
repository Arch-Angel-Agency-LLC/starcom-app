/**
 * NetRunner Control Station
 * 
 * Main command center layout for the NetRunner OSINT platform.
 * Clean, minimal structure ready for real functionality.
 * 
 * @author GitHub Copilot
 * @date July 12, 2025
 */

import React, { useState } from 'react';
import { Box } from '@mui/material';

// Layout Components
import NetRunnerLeftSideBar from './NetRunnerLeftSideBar';
import NetRunnerCenterView from './NetRunnerCenterView';
import NetRunnerRightSideBar from './NetRunnerRightSideBar';
import NetRunnerBottomBar from './NetRunnerBottomBar';
import ScriptsEngineDebugger from '../debug/ScriptsEngineDebugger';

interface NetRunnerControlStationProps {
  className?: string;
  isEmbedded?: boolean;
}

/**
 * NetRunner Control Station - Main command center interface
 */
const NetRunnerControlStation: React.FC<NetRunnerControlStationProps> = ({ 
  className
}) => {
  // UI state management
  const leftSidebarOpen = true; // AI Agent sidebar always open
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [bottomBarOpen, setBottomBarOpen] = useState(false);

  // Layout dimensions
  const bottomBarHeight = bottomBarOpen ? 200 : 32;
  const leftSidebarWidth = leftSidebarOpen ? 280 : 48;
  const rightSidebarWidth = rightSidebarOpen ? 320 : 48;

  return (
    <Box
      className={className}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#000000',
        color: '#ffffff',
        fontFamily: 'Aldrich, monospace',
        overflow: 'hidden'
      }}
    >
      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Debug Panel - TEMPORARY */}
        <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 1000 }}>
          <ScriptsEngineDebugger />
        </Box>
        
        {/* Left Sidebar */}
        <NetRunnerLeftSideBar
          open={leftSidebarOpen}
          width={leftSidebarWidth}
        />

        {/* Center View */}
        <NetRunnerCenterView
          width={`calc(100% - ${leftSidebarWidth}px - ${rightSidebarWidth}px)`}
          height={`calc(100% - ${bottomBarHeight}px)`}
        />

        {/* Right Sidebar */}
        <NetRunnerRightSideBar
          open={rightSidebarOpen}
          width={rightSidebarWidth}
          onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
        />
      </Box>

      {/* Bottom Bar */}
      <NetRunnerBottomBar
        height={bottomBarHeight}
        open={bottomBarOpen}
        onToggle={() => setBottomBarOpen(!bottomBarOpen)}
      />
    </Box>
  );
};

export default NetRunnerControlStation;
