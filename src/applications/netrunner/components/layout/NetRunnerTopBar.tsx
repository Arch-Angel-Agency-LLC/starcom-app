/**
 * NetRunner Top Bar
 * 
 * Main navigation and control bar for the NetRunner Control Station.
 * Includes view navigation, global search, sidebar controls, and status indicators.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Alert,
  Snackbar,
  Divider
} from '@mui/material';
import {
  Search,
  Settings,
  Bell,
  Menu as MenuIcon,
  Grid3X3,
  Terminal,
  Bot,
  GitBranch,
  Shield,
  Activity,
  Database,
  Zap
} from 'lucide-react';

import { LoggerFactory } from '../../services/logging';

interface NetRunnerTopBarProps {
  height: number;
  activeView: string;
  onViewChange: (view: string) => void;
  onSidebarToggle: (side: 'left' | 'right') => void;
  globalSearch: string;
  onGlobalSearch: (query: string) => void;
  onSearchExecute: (query?: string) => Promise<void>;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  searchResults: unknown[];
  isSearching: boolean;
  errorState: {
    hasError: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info';
  };
  onErrorDismiss: () => void;
}

interface NavButton {
  id: string;
  label: string;
  icon: React.ComponentType;
  description: string;
  color: string;
}

const NetRunnerTopBar: React.FC<NetRunnerTopBarProps> = ({
  height,
  activeView,
  onViewChange,
  onSidebarToggle,
  globalSearch,
  onGlobalSearch,
  onSearchExecute,
  leftSidebarOpen,
  rightSidebarOpen,
  searchResults,
  isSearching,
  errorState,
  onErrorDismiss
}) => {
  const logger = useMemo(() => LoggerFactory.getLogger('NetRunnerTopBar'), []);
  
  const [notificationMenu, setNotificationMenu] = useState<HTMLElement | null>(null);
  const [settingsMenu, setSettingsMenu] = useState<HTMLElement | null>(null);

  // Navigation Buttons Configuration
  const navButtons: NavButton[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Grid3X3,
      description: 'Main dashboard overview',
      color: '#00f5ff'
    },
    {
      id: 'powertools',
      label: 'Power Tools',
      icon: Terminal,
      description: 'OSINT tool collection',
      color: '#8b5cf6'
    },
    {
      id: 'botroster',
      label: 'Bot Roster',
      icon: Bot,
      description: 'Automated collection bots',
      color: '#00ff88'
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: GitBranch,
      description: 'Automated workflows',
      color: '#ff8c00'
    },
    {
      id: 'aiagent',
      label: 'AI Agent',
      icon: Zap,
      description: 'AI-powered automation',
      color: '#ff0066'
    },
    {
      id: 'osintgearch',
      label: 'OSINT Search',
      icon: Search,
      description: 'Multi-source search',
      color: '#00f5ff'
    },
    {
      id: 'intelligence',
      label: 'Intelligence',
      icon: Shield,
      description: 'Intelligence analysis',
      color: '#8b5cf6'
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: Activity,
      description: 'System monitoring',
      color: '#00ff88'
    }
  ];

  // Search Handler
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    onGlobalSearch(query);
    logger.debug('Global search query changed', { query });
  }, [onGlobalSearch, logger]);

  // Navigation Handler
  const handleNavigation = useCallback((viewId: string) => {
    onViewChange(viewId);
    logger.info('Navigation action', { from: activeView, to: viewId });
  }, [onViewChange, activeView, logger]);

  // Menu Handlers
  const handleNotificationClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setNotificationMenu(event.currentTarget);
  }, []);

  const handleSettingsClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setSettingsMenu(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setNotificationMenu(null);
    setSettingsMenu(null);
  }, []);

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          height,
          backgroundColor: '#1a1a1a',
          borderBottom: '1px solid #404040',
          '& .MuiToolbar-root': {
            minHeight: height,
            paddingX: 2
          }
        }}
      >
        <Toolbar>
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <IconButton
              onClick={() => onSidebarToggle('left')}
              sx={{ 
                color: leftSidebarOpen ? '#00f5ff' : '#b0b0b0',
                mr: 1
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Aldrich, monospace',
                color: '#00f5ff',
                fontWeight: 'bold',
                textShadow: '0 0 10px #00f5ff'
              }}
            >
              NETRUNNER
            </Typography>
            <Chip
              label="v3.0"
              size="small"
              sx={{
                ml: 1,
                backgroundColor: '#8b5cf6',
                color: '#ffffff',
                fontSize: '0.7rem'
              }}
            />
          </Box>

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', gap: 1, mr: 3 }}>
            {navButtons.map((button) => {
              const IconComponent = button.icon;
              const isActive = activeView === button.id;
              
              return (
                <Tooltip key={button.id} title={button.description}>
                  <IconButton
                    onClick={() => handleNavigation(button.id)}
                    sx={{
                      color: isActive ? button.color : '#b0b0b0',
                      backgroundColor: isActive ? 'rgba(0, 245, 255, 0.1)' : 'transparent',
                      border: isActive ? `1px solid ${button.color}` : '1px solid transparent',
                      borderRadius: 1,
                      padding: '8px 12px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: `rgba(${button.color.replace('#', '')}, 0.1)`,
                        color: button.color
                      }
                    }}
                  >
                  <IconComponent />
                  </IconButton>
                </Tooltip>
              );
            })}
          </Box>

          {/* Global Search */}
          <Box sx={{ flexGrow: 1, maxWidth: 400, mr: 3 }}>
            <TextField
              fullWidth
              placeholder="Global OSINT Search..."
              value={globalSearch}
              onChange={handleSearchChange}
              onKeyPress={(e) => e.key === 'Enter' && onSearchExecute()}
              size="small"
              disabled={isSearching}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="#00f5ff" />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: '#2d2d2d',
                  border: '1px solid #404040',
                  borderRadius: 1,
                  color: '#ffffff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  },
                  '&:hover': {
                    borderColor: '#00f5ff'
                  },
                  '&.Mui-focused': {
                    borderColor: '#00f5ff',
                    boxShadow: '0 0 10px rgba(0, 245, 255, 0.3)'
                  }
                }
              }}
            />
            {searchResults.length > 0 && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#00ff88', 
                  display: 'block',
                  mt: 0.5 
                }}
              >
                {searchResults.length} results found
              </Typography>
            )}
          </Box>

          {/* Status Indicators */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Active Tools Indicator */}
            <Tooltip title="Active Tools">
              <Badge badgeContent={3} color="primary">
                <IconButton sx={{ color: '#00ff88' }}>
                  <Terminal />
                </IconButton>
              </Badge>
            </Tooltip>

            {/* Active Bots Indicator */}
            <Tooltip title="Running Bots">
              <Badge badgeContent={2} color="secondary">
                <IconButton sx={{ color: '#ff8c00' }}>
                  <Bot />
                </IconButton>
              </Badge>
            </Tooltip>

            {/* System Status */}
            <Tooltip title="System Status">
              <IconButton sx={{ color: '#00ff88' }}>
                <Activity />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ bgcolor: '#404040', mx: 1 }} />

            {/* Notifications */}
            <Tooltip title="Notifications">
              <Badge badgeContent={5} color="error">
                <IconButton
                  onClick={handleNotificationClick}
                  sx={{ color: '#b0b0b0' }}
                >
                  <Bell />
                </IconButton>
              </Badge>
            </Tooltip>

            {/* Settings */}
            <Tooltip title="Settings">
              <IconButton
                onClick={handleSettingsClick}
                sx={{ color: '#b0b0b0' }}
              >
                <Settings />
              </IconButton>
            </Tooltip>

            {/* Right Sidebar Toggle */}
            <IconButton
              onClick={() => onSidebarToggle('right')}
              sx={{ 
                color: rightSidebarOpen ? '#00f5ff' : '#b0b0b0',
                ml: 1
              }}
            >
              <Database />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Notification Menu */}
      <Menu
        anchorEl={notificationMenu}
        open={Boolean(notificationMenu)}
        onClose={handleMenuClose}
        disablePortal={true}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            border: '1px solid #404040',
            minWidth: 300
          }
        }}
      >
        <MenuItem sx={{ color: '#ffffff' }}>
          <Typography variant="body2">New OSINT data available</Typography>
        </MenuItem>
        <MenuItem sx={{ color: '#ffffff' }}>
          <Typography variant="body2">Bot #1 completed task</Typography>
        </MenuItem>
        <MenuItem sx={{ color: '#ffffff' }}>
          <Typography variant="body2">Workflow execution finished</Typography>
        </MenuItem>
      </Menu>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsMenu}
        open={Boolean(settingsMenu)}
        onClose={handleMenuClose}
        disablePortal={true}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            border: '1px solid #404040',
            minWidth: 200
          }
        }}
      >
        <MenuItem sx={{ color: '#ffffff' }}>
          <Typography variant="body2">Preferences</Typography>
        </MenuItem>
        <MenuItem sx={{ color: '#ffffff' }}>
          <Typography variant="body2">API Keys</Typography>
        </MenuItem>
        <MenuItem sx={{ color: '#ffffff' }}>
          <Typography variant="body2">Export Data</Typography>
        </MenuItem>
        <MenuItem sx={{ color: '#ffffff' }}>
          <Typography variant="body2">About</Typography>
        </MenuItem>
      </Menu>

      {/* Error Snackbar */}
      <Snackbar
        open={errorState.hasError}
        autoHideDuration={6000}
        onClose={onErrorDismiss}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={onErrorDismiss}
          severity={errorState.severity}
          sx={{
            backgroundColor: errorState.severity === 'error' ? '#ff0066' : 
                           errorState.severity === 'warning' ? '#ff8c00' : '#00f5ff',
            color: '#ffffff'
          }}
        >
          {errorState.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NetRunnerTopBar;
