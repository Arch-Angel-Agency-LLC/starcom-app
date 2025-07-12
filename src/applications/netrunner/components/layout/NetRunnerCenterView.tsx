/**
 * NetRunner Center View
 * 
 * Main content area for the NetRunner control station.
 * Displays dashboard, tools, bots, workflows and other content based on active view.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

interface NetRunnerCenterViewProps {
  activeView: string;
  width?: string | number;
  height?: string | number;
  selectedTools: string[];
  toolResults: unknown[]; // TODO: Define proper tool results interface
  activeBots: string[];
  botStatuses: Record<string, unknown>; // TODO: Define proper bot status interface
  currentWorkflow: string | null;
  runningJobs: unknown[]; // TODO: Define proper running job interface
  globalSearch: string;
  searchResults: unknown[]; // TODO: Define proper search results interface
  isSearching: boolean;
  systemMetrics: unknown[]; // TODO: Define proper system metrics interface
  onViewChange: (view: string) => void;
  onToolRun: (toolId: string, params?: Record<string, unknown>) => Promise<void>;
  onBotActivate: (botId: string) => void;
  onWorkflowStart: (workflowId: string, params?: Record<string, unknown>) => Promise<void>;
  onSearchExecute: (query?: string) => Promise<void>;
}

/**
 * NetRunner Center View - Main content display area
 */
const NetRunnerCenterView: React.FC<NetRunnerCenterViewProps> = ({
  activeView,
  width = '100%',
  height = '100%',
  selectedTools,
  toolResults,
  activeBots,
  botStatuses,
  currentWorkflow,
  runningJobs,
  globalSearch,
  searchResults,
  isSearching,
  systemMetrics,
  onViewChange,
  onToolRun,
  onBotActivate,
  onWorkflowStart,
  onSearchExecute
}) => {

  const renderDashboard = () => (
    <Box sx={{ p: 3 }}>
      <Typography 
        variant="h4" 
        sx={{ 
          color: '#00f5ff', 
          mb: 4, 
          textAlign: 'center',
          fontWeight: 'bold',
          textShadow: '0 0 10px rgba(0, 245, 255, 0.5)'
        }}
      >
        NETRUNNER CONTROL STATION
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* System Status and Quick Actions Row */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* System Status */}
          <Box sx={{ flex: '1 1 400px', minWidth: '300px' }}>
            <Card sx={{ backgroundColor: '#2d2d2d', border: '1px solid #404040' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                  System Status
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#00ff88' }}>
                    ✓ All systems operational
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#00ff88' }}>
                    ✓ {selectedTools.length} tools selected
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#00ff88' }}>
                    ✓ {activeBots.length} bots active
                  </Typography>
                  {currentWorkflow && (
                    <Typography variant="body2" sx={{ color: '#ff8c00' }}>
                      ⚡ Workflow: {currentWorkflow}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Quick Actions */}
          <Box sx={{ flex: '1 1 400px', minWidth: '300px' }}>
            <Card sx={{ backgroundColor: '#2d2d2d', border: '1px solid #404040' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#00f5ff', 
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => onViewChange('powertools')}
                  >
                    → Configure Power Tools
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#00f5ff', 
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => onViewChange('bots')}
                  >
                    → Manage Bots
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#00f5ff', 
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => onViewChange('workflows')}
                  >
                    → Create Workflow
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#00f5ff', 
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => onViewChange('osintgearch')}
                  >
                    → Start OSINT Search
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Recent Activity */}
        <Box sx={{ width: '100%' }}>
          <Card sx={{ backgroundColor: '#2d2d2d', border: '1px solid #404040' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
                Recent Activity
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                  • System initialized successfully
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                  • NetRunner Control Station loaded
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                  • Awaiting user commands
                </Typography>
                {globalSearch && (
                  <Typography variant="body2" sx={{ color: '#00f5ff' }}>
                    • Search query: "{globalSearch}"
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return renderDashboard();
      case 'powertools':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ color: '#00f5ff', mb: 3 }}>
              Power Tools
            </Typography>
            <Card sx={{ backgroundColor: '#2d2d2d', border: '1px solid #404040' }}>
              <CardContent>
                <Typography variant="body1" sx={{ color: '#ffffff' }}>
                  Power Tools panel will be loaded here.
                  Integration with PowerToolsPanel component in progress.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );
      case 'bots':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ color: '#00f5ff', mb: 3 }}>
              Bot Control
            </Typography>
            <Card sx={{ backgroundColor: '#2d2d2d', border: '1px solid #404040' }}>
              <CardContent>
                <Typography variant="body1" sx={{ color: '#ffffff' }}>
                  Bot Control panel will be loaded here.
                  Integration with BotControlPanel component in progress.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );
      case 'workflows':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ color: '#00f5ff', mb: 3 }}>
              Workflow Control
            </Typography>
            <Card sx={{ backgroundColor: '#2d2d2d', border: '1px solid #404040' }}>
              <CardContent>
                <Typography variant="body1" sx={{ color: '#ffffff' }}>
                  Workflow Control panel will be loaded here.
                  Integration with WorkflowControlPanel component in progress.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );
      case 'osintgearch':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ color: '#00f5ff', mb: 3 }}>
              OSINT Search
            </Typography>
            <Card sx={{ backgroundColor: '#2d2d2d', border: '1px solid #404040' }}>
              <CardContent>
                <Typography variant="body1" sx={{ color: '#ffffff' }}>
                  OSINT Search interface will be loaded here.
                  Advanced search capabilities coming soon.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );
      case 'apikeys':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ color: '#00f5ff', mb: 3 }}>
              API Key Management
            </Typography>
            <Card sx={{ backgroundColor: '#2d2d2d', border: '1px solid #404040' }}>
              <CardContent>
                <Typography variant="body1" sx={{ color: '#ffffff' }}>
                  API Key Management panel will be loaded here.
                  Integration with ApiKeyManager component in progress.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <Box
      sx={{
        flex: 1, // Take remaining space in flex container
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        overflow: 'auto',
        position: 'relative',
        // Ensure it doesn't shrink below minimum size
        minWidth: 0
      }}
    >
      {renderView()}
    </Box>
  );
};

export default NetRunnerCenterView;
