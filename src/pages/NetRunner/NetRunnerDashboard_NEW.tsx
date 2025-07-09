import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  Database, 
  Settings, 
  Bot
} from 'lucide-react';

// Import custom components and tools
import { DashboardMode } from './types/netrunner';
import PowerToolsPanel from './components/PowerToolsPanel';
import BotControlPanel from './components/BotControlPanel';
import WorkflowControlPanel from './components/WorkflowControlPanel';

// Import tools and bots
import { netRunnerPowerTools } from './tools/NetRunnerPowerTools';
import { sampleBots } from './integration/BotRosterIntegration';

/**
 * NetRunner Dashboard
 * 
 * Simplified interface focused on Power Tools and Bot Automation.
 * 
 * Features:
 * - Power tools integration for OSINT operations
 * - Bot automation integration with BotRoster
 * - Workflow automation
 */
const NetRunnerDashboard: React.FC = () => {
  // State management
  const [activeMode, setActiveMode] = useState<DashboardMode>('powertools');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Power tools and bots state
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [activeBots, setActiveBots] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('discovery');
  
  // Handle mode change
  const handleModeChange = (mode: DashboardMode) => {
    setActiveMode(mode);
  };

  // Handle settings menu
  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleSettingsClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          NetRunner
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant={activeMode === 'powertools' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handleModeChange('powertools')}
            startIcon={<Database />}
          >
            Power Tools
          </Button>
          <Button 
            variant={activeMode === 'bots' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handleModeChange('bots')}
            startIcon={<Bot size={16} />}
          >
            Bots
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleSettingsClick}
            startIcon={<Settings />}
            sx={{ ml: 2 }}
          >
            Settings
          </Button>
          
          {/* Settings Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleSettingsClose}
          >
            <MenuItem onClick={handleSettingsClose}>Tool Configuration</MenuItem>
            <MenuItem onClick={handleSettingsClose}>Bot Settings</MenuItem>
            <MenuItem onClick={handleSettingsClose}>Workflow Settings</MenuItem>
            <MenuItem onClick={handleSettingsClose}>Privacy Settings</MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Power Tools Mode */}
        {activeMode === 'powertools' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            <Typography variant="h5" component="h2">
              OSINT Power Tools
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Access a comprehensive suite of Open Source Intelligence tools for data gathering and analysis.
            </Typography>
            
            <PowerToolsPanel 
              tools={netRunnerPowerTools}
              selectedTools={selectedTools}
              onSelectionChange={setSelectedTools}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </Box>
        )}

        {/* Bots Mode */}
        {activeMode === 'bots' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            <Typography variant="h5" component="h2">
              Bot Automation
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Deploy and manage autonomous OSINT bots for continuous intelligence gathering.
            </Typography>
            
            {/* Bot Control Panel for individual bot management */}
            <BotControlPanel 
              bots={sampleBots}
              activeBots={activeBots}
              onBotsChange={setActiveBots}
              tools={netRunnerPowerTools}
            />
            
            {/* Workflow Control Panel for automated workflows */}
            <WorkflowControlPanel
              bots={sampleBots}
              tools={netRunnerPowerTools}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default NetRunnerDashboard;
