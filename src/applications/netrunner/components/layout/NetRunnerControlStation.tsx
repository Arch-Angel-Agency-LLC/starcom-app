/**
 * NetRunner Control Station
 * 
 * Main command center UI for the NetRunner OSINT platform.
 * Provides centralized control over all NetRunner functionality including
 * PowerTools, BotRoster, AI Agents, OSINT Search, and more.
 * 
 * @author GitHub Copilot
 * @date July 11, 2025
 */

import React, { useState, useMemo } from 'react';
import { Box } from '@mui/material';

// Layout Components
import NetRunnerTopBar from './NetRunnerTopBar';
import NetRunnerLeftSideBar from './NetRunnerLeftSideBar';
import NetRunnerRightSideBar from './NetRunnerRightSideBar';
import NetRunnerBottomBar from './NetRunnerBottomBar';
import NetRunnerCenterView from './NetRunnerCenterView';

interface NetRunnerControlStationProps {
  className?: string;
  isEmbedded?: boolean;
}

/**
 * NetRunner Control Station - Main command center interface
 */
const NetRunnerControlStation: React.FC<NetRunnerControlStationProps> = ({ 
  className, 
  isEmbedded = false 
}) => {
  // Simple state management for sidebar toggles
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [bottomBarOpen, setBottomBarOpen] = useState(false);
  const [topBarExpanded, setTopBarExpanded] = useState(false);

  // Layout Calculations - adjusted for embedded vs standalone mode
  const layoutConfig = useMemo(() => {
    const topBarHeight = topBarExpanded ? (isEmbedded ? 400 : 500) : (isEmbedded ? 48 : 64);
    const bottomBarHeight = bottomBarOpen ? (isEmbedded ? 150 : 200) : (isEmbedded ? 36 : 48);
    const leftSidebarWidth = leftSidebarOpen ? (isEmbedded ? 280 : 320) : 60;
    const rightSidebarWidth = rightSidebarOpen ? (isEmbedded ? 350 : 400) : 60;

    return {
      topBarHeight,
      bottomBarHeight,
      leftSidebarWidth,
      rightSidebarWidth,
      centerViewHeight: `calc(100% - ${topBarHeight + bottomBarHeight}px)`,
      centerViewWidth: `calc(100% - ${leftSidebarWidth + rightSidebarWidth}px)`
    };
  }, [leftSidebarOpen, rightSidebarOpen, bottomBarOpen, topBarExpanded, isEmbedded]);

  return (
    <Box
      className={className}
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#000000',
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(0, 245, 255, 0.04) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.04) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(0, 255, 136, 0.03) 0%, transparent 50%)
        `,
        color: '#ffffff',
        fontFamily: 'Aldrich, monospace',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: isEmbedded ? '600px' : '100vh',
        maxHeight: '100%',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            linear-gradient(0deg, transparent 24%, rgba(0, 255, 136, 0.03) 25%, rgba(0, 255, 136, 0.03) 26%, transparent 27%, transparent 74%, rgba(0, 255, 136, 0.03) 75%, rgba(0, 255, 136, 0.03) 76%, transparent 77%),
            linear-gradient(90deg, transparent 24%, rgba(0, 245, 255, 0.02) 25%, rgba(0, 245, 255, 0.02) 26%, transparent 27%, transparent 74%, rgba(0, 245, 255, 0.02) 75%, rgba(0, 245, 255, 0.02) 76%, transparent 77%)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.3
        }
      }}
    >
      {/* Top Bar */}
      <NetRunnerTopBar
        height={layoutConfig.topBarHeight}
        isExpanded={topBarExpanded}
        onToggleExpand={() => setTopBarExpanded(!topBarExpanded)}
      />

      {/* Main Content Area - Only show when top bar is not expanded */}
      {!topBarExpanded && (
        <>
          <Box
            sx={{
              display: 'flex',
              flex: 1,
              overflow: 'hidden',
              width: '100%'
            }}
          >
            {/* Left Sidebar - Fixed width when open */}
            <NetRunnerLeftSideBar
              open={leftSidebarOpen}
              width={layoutConfig.leftSidebarWidth}
              onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
            />

            {/* Center View - Flex grow to fill remaining space */}
            <NetRunnerCenterView
              width={layoutConfig.centerViewWidth}
              height={layoutConfig.centerViewHeight}
            />

            {/* Right Sidebar */}
            <NetRunnerRightSideBar
              open={rightSidebarOpen}
              width={layoutConfig.rightSidebarWidth}
              onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
            />
          </Box>

          {/* Bottom Bar */}
          <NetRunnerBottomBar
            open={bottomBarOpen}
            height={layoutConfig.bottomBarHeight}
            onToggle={() => setBottomBarOpen(!bottomBarOpen)}
          />
        </>
      )}
    </Box>
  );
};

export default NetRunnerControlStation;
