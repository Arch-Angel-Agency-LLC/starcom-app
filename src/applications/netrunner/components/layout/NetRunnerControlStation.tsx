/**
 * NetRunner Control Station
 * 
 * Main command center UI for the NetRunner OSINT platform.
 * Provides centralized control over all NetRunner functionality including
 * PowerTools, BotRoster, AI Agents, OSINT Search, and more.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import React, { useMemo } from 'react';
import { Box, useTheme, useMediaQuery, Snackbar, Alert } from '@mui/material';
import { LoggerFactory } from '../../services/logging';
import { useNetRunnerState } from '../../hooks/useNetRunnerState';

// Layout Components
import NetRunnerTopBar from './NetRunnerTopBar';
import NetRunnerLeftSideBar from './NetRunnerLeftSideBar';
import NetRunnerRightSideBar from './NetRunnerRightSideBar';
import NetRunnerBottomBar from './NetRunnerBottomBar';
import NetRunnerCenterView from './NetRunnerCenterView';

interface NetRunnerControlStationProps {
  className?: string;
  isEmbedded?: boolean; // New prop to support embedded mode
}

/**
 * NetRunner Control Station - Main command center interface
 */
const NetRunnerControlStation: React.FC<NetRunnerControlStationProps> = ({ 
  className, 
  isEmbedded = false 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Initialize logger
  const logger = useMemo(() => LoggerFactory.getLogger('NetRunnerControlStation'), []);

  // Get centralized state management
  const {
    state,
    setActiveView,
    toggleSidebar,
    toggleBottomBar,
    setGlobalSearch,
    performSearch,
    selectTool,
    deselectTool,
    runTool,
    activateBot,
    deactivateBot,
    selectWorkflow,
    startWorkflow,
    stopWorkflow,
    clearError,
    refreshSystemMetrics,
    refreshRecentActivity
  } = useNetRunnerState();

  // Layout Calculations - adjusted for embedded vs standalone mode
  const layoutConfig = useMemo(() => {
    const topBarHeight = isEmbedded ? 48 : 64; // Smaller in embedded mode
    const bottomBarHeight = state.bottomBarExpanded ? (isEmbedded ? 150 : 200) : (isEmbedded ? 36 : 48);
    const leftSidebarWidth = state.leftSidebarOpen ? (isEmbedded ? 280 : 320) : 0;
    const rightSidebarWidth = state.rightSidebarOpen ? (isEmbedded ? 350 : 400) : 0;

    return {
      topBarHeight,
      bottomBarHeight,
      leftSidebarWidth,
      rightSidebarWidth,
      // Always use percentage calculations for proper container fitting
      centerViewHeight: `calc(100% - ${topBarHeight + bottomBarHeight}px)`,
      centerViewWidth: `calc(100% - ${leftSidebarWidth + rightSidebarWidth}px)`
    };
  }, [state.leftSidebarOpen, state.rightSidebarOpen, state.bottomBarExpanded, isEmbedded]);

  return (
    <Box
      className={className}
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#000000',
        color: '#ffffff',
        fontFamily: 'Aldrich, monospace',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        // Ensure proper container fitting
        minHeight: isEmbedded ? '600px' : '100vh',
        maxHeight: '100%'
      }}
    >
      {/* Top Bar */}
      <NetRunnerTopBar
        height={layoutConfig.topBarHeight}
        activeView={state.activeView}
        onViewChange={setActiveView}
        onSidebarToggle={toggleSidebar}
        globalSearch={state.globalSearch}
        onGlobalSearch={setGlobalSearch}
        onSearchExecute={performSearch}
        leftSidebarOpen={state.leftSidebarOpen}
        rightSidebarOpen={state.rightSidebarOpen}
        searchResults={state.searchResults}
        isSearching={state.isSearching}
        errorState={state.error}
        onErrorDismiss={clearError}
      />

      {/* Main Content Area - Horizontal flex layout */}
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
          open={state.leftSidebarOpen}
          width={layoutConfig.leftSidebarWidth}
          activeView={state.activeView}
          availableTools={state.availableTools}
          selectedTools={state.selectedTools}
          onToolSelect={selectTool}
          onToolDeselect={deselectTool}
          onToolRun={runTool}
          availableBots={state.availableBots}
          activeBots={state.activeBots}
          onBotActivate={activateBot}
          onBotDeactivate={deactivateBot}
          availableWorkflows={state.availableWorkflows}
          currentWorkflow={state.currentWorkflow}
          onWorkflowSelect={selectWorkflow}
          onWorkflowStart={startWorkflow}
          onWorkflowStop={stopWorkflow}
        />

        {/* Center View - Flex grow to fill remaining space */}
        <NetRunnerCenterView
          activeView={state.activeView}
          width={layoutConfig.centerViewWidth}
          height={layoutConfig.centerViewHeight}
          selectedTools={state.selectedTools}
          toolResults={state.toolResults}
          activeBots={state.activeBots}
          botStatuses={state.botStatuses}
          currentWorkflow={state.currentWorkflow}
          runningJobs={state.runningJobs}
          globalSearch={state.globalSearch}
          searchResults={state.searchResults}
          isSearching={state.isSearching}
          systemMetrics={state.systemMetrics}
          onViewChange={setActiveView}
          onToolRun={runTool}
          onBotActivate={activateBot}
          onWorkflowStart={startWorkflow}
          onSearchExecute={performSearch}
        />

        {/* Right Sidebar */}
        <NetRunnerRightSideBar
          open={state.rightSidebarOpen}
          width={layoutConfig.rightSidebarWidth}
          activeView={state.activeView}
          systemMetrics={state.systemMetrics}
          recentActivity={state.recentActivity}
          errorCount={state.errorCount}
          warningCount={state.warningCount}
          selectedTools={state.selectedTools}
          activeBots={state.activeBots}
          runningJobs={state.runningJobs}
          onRefreshMetrics={refreshSystemMetrics}
          onRefreshActivity={refreshRecentActivity}
        />
      </Box>

      {/* Bottom Bar */}
      <NetRunnerBottomBar
        height={layoutConfig.bottomBarHeight}
        expanded={state.bottomBarExpanded}
        onToggle={toggleBottomBar}
        selectedTools={state.selectedTools}
        activeBots={state.activeBots}
        runningJobs={state.runningJobs}
        systemMetrics={state.systemMetrics}
        errorState={state.error}
        onErrorClear={clearError}
      />

      {/* Error Notification */}
      {state.error.hasError && (
        <Snackbar
          open={state.error.hasError}
          autoHideDuration={6000}
          onClose={clearError}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={clearError}
            severity={state.error.severity}
            sx={{ width: '100%' }}
          >
            {state.error.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default NetRunnerControlStation;
