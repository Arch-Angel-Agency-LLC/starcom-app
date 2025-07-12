/**
 * NetRunner Bottom Bar
 * 
 * Status bar and quick actions panel for the NetRunner Control Station.
 * Displays system status, active operations, and provides quick access controls.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  LinearProgress,
  Tooltip,
  Divider,
  Button,
  Collapse
} from '@mui/material';
import {
  ChevronUp,
  ChevronDown,
  Terminal,
  Bot,
  GitBranch,
  Activity,
  Wifi,
  Database,
  Zap,
  Square
} from 'lucide-react';

import { LoggerFactory } from '../../services/logging';

interface NetRunnerBottomBarProps {
  height: number;
  expanded: boolean;
  onToggle: () => void;
  selectedTools: string[];
  activeBots: string[];
  runningJobs: RunningJob[];
  systemMetrics: SystemMetric[];
  errorState: {
    hasError: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info';
  };
  onErrorClear: () => void;
}

interface RunningJob {
  id: string;
  type: 'tool' | 'workflow' | 'bot';
  name: string;
  status: 'running' | 'pending' | 'paused';
  progress?: number;
  startTime: Date;
  estimatedDuration?: number;
}

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType;
  color: string;
  action: () => void;
}

interface StatusItem {
  id: string;
  label: string;
  value: string | number;
  status: 'good' | 'warning' | 'error';
  icon: React.ComponentType;
}

const NetRunnerBottomBar: React.FC<NetRunnerBottomBarProps> = ({
  height,
  expanded,
  onToggle,
  selectedTools,
  activeBots,
  runningJobs,
  systemMetrics,
  errorState,
  onErrorClear
}) => {
  const logger = useMemo(() => LoggerFactory.getLogger('NetRunnerBottomBar'), []);

  // Status Items
  const statusItems: StatusItem[] = [
    {
      id: 'connection',
      label: 'Connection',
      value: 'Online',
      status: 'good',
      icon: Wifi
    },
    {
      id: 'database',
      label: 'Database',
      value: 'Connected',
      status: 'good',
      icon: Database
    },
    {
      id: 'api',
      label: 'API Status',
      value: '98.5%',
      status: 'good',
      icon: Activity
    },
    {
      id: 'processing',
      label: 'Processing',
      value: selectedTools.length + activeBots.length,
      status: selectedTools.length > 0 || activeBots.length > 0 ? 'good' : 'warning',
      icon: Zap
    }
  ];

  // Quick Actions
  const quickActions: QuickAction[] = [
    {
      id: 'emergency_stop',
      label: 'Emergency Stop',
      icon: Square,
      color: '#ff0066',
      action: () => {
        logger.warn('Emergency stop triggered');
        // Implement emergency stop logic
      }
    },
    {
      id: 'quick_scan',
      label: 'Quick Scan',
      icon: Terminal,
      color: '#00f5ff',
      action: () => {
        logger.info('Quick scan initiated');
        // Implement quick scan logic
      }
    },
    {
      id: 'export_data',
      label: 'Export Data',
      icon: Database,
      color: '#00ff88',
      action: () => {
        logger.info('Data export initiated');
        // Implement data export logic
      }
    }
  ];

  // Status Color Mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return '#00ff88';
      case 'warning':
        return '#ff8c00';
      case 'error':
        return '#ff0066';
      default:
        return '#b0b0b0';
    }
  };

  return (
    <Box
      sx={{
        height,
        backgroundColor: '#1a1a1a',
        borderTop: '1px solid #404040',
        transition: 'height 0.3s ease',
        // Stay within container - remove fixed positioning
        position: 'relative',
        width: '100%',
        flexShrink: 0
      }}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Main Status Bar */}
        <Box
          sx={{
            height: expanded ? 48 : height,
            display: 'flex',
            alignItems: 'center',
            px: 2,
            borderBottom: expanded ? '1px solid #404040' : 'none'
          }}
        >
          {/* Expand/Collapse Button */}
          <IconButton
            onClick={onToggle}
            sx={{ 
              color: '#00f5ff',
              mr: 1,
              p: 0.5
            }}
          >
            {expanded ? <ChevronDown /> : <ChevronUp />}
          </IconButton>

          {/* Status Items */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
            {statusItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Tooltip key={item.id} title={item.label}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconComponent />
                    <Typography
                      variant="body2"
                      sx={{ 
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        minWidth: 'fit-content'
                      }}
                    >
                      {item.label}: 
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ 
                        color: getStatusColor(item.status),
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>

          <Divider orientation="vertical" flexItem sx={{ bgcolor: '#404040', mx: 2 }} />

          {/* Active Operations Summary */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedTools.length > 0 && (
              <Chip
                icon={<Terminal />}
                label={`${selectedTools.length} Tools`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                  color: '#8b5cf6',
                  border: '1px solid #8b5cf6'
                }}
              />
            )}
            
            {activeBots.length > 0 && (
              <Chip
                icon={<Bot />}
                label={`${activeBots.length} Bots`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(0, 255, 136, 0.2)',
                  color: '#00ff88',
                  border: '1px solid #00ff88'
                }}
              />
            )}
            
            {runningJobs.length > 0 && (
              <Chip
                icon={<GitBranch />}
                label={`${runningJobs.length} Job${runningJobs.length > 1 ? 's' : ''} Running`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 140, 0, 0.2)',
                  color: '#ff8c00',
                  border: '1px solid #ff8c00'
                }}
              />
            )}
          </Box>

          <Divider orientation="vertical" flexItem sx={{ bgcolor: '#404040', mx: 2 }} />

          {/* System Time */}
          <Typography
            variant="body2"
            sx={{ 
              color: '#b0b0b0',
              fontSize: '0.85rem',
              fontFamily: 'monospace',
              minWidth: '120px'
            }}
          >
            {new Date().toLocaleTimeString()}
          </Typography>
        </Box>

        {/* Expanded Content */}
        <Collapse in={expanded}>
          <Box
            sx={{
              height: height - 48,
              p: 2,
              display: 'flex',
              gap: 2
            }}
          >
            {/* Quick Actions */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: '#ffffff', mb: 1 }}
              >
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {quickActions.map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="outlined"
                      size="small"
                      startIcon={<IconComponent />}
                      onClick={action.action}
                      sx={{
                        color: action.color,
                        borderColor: action.color,
                        '&:hover': {
                          backgroundColor: `${action.color}20`,
                          borderColor: action.color
                        }
                      }}
                    >
                      {action.label}
                    </Button>
                  );
                })}
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ bgcolor: '#404040' }} />

            {/* Current Operations */}
            <Box sx={{ flex: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: '#ffffff', mb: 1 }}
              >
                Current Operations
              </Typography>
              
              {selectedTools.length === 0 && activeBots.length === 0 && runningJobs.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{ color: '#b0b0b0', fontStyle: 'italic' }}
                >
                  No active operations
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedTools.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#8b5cf6' }}>
                        Active Tools: {selectedTools.join(', ')}
                      </Typography>
                    </Box>
                  )}
                  
                  {activeBots.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#00ff88' }}>
                        Running Bots: {activeBots.join(', ')}
                      </Typography>
                    </Box>
                  )}
                  
                  {runningJobs.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#ff8c00' }}>
                        Active Jobs: {runningJobs.map(job => job.name).join(', ')}
                      </Typography>
                      <LinearProgress
                        variant="indeterminate"
                        sx={{
                          mt: 0.5,
                          backgroundColor: '#404040',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#ff8c00'
                          }
                        }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            <Divider orientation="vertical" flexItem sx={{ bgcolor: '#404040' }} />

            {/* Resource Usage */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: '#ffffff', mb: 1 }}
              >
                Resource Usage
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                    CPU: 45%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={45}
                    sx={{
                      mt: 0.5,
                      backgroundColor: '#404040',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#00ff88'
                      }
                    }}
                  />
                </Box>
                
                <Box>
                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                    Memory: 62%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={62}
                    sx={{
                      mt: 0.5,
                      backgroundColor: '#404040',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#ff8c00'
                      }
                    }}
                  />
                </Box>
                
                <Box>
                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                    Network: 23%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={23}
                    sx={{
                      mt: 0.5,
                      backgroundColor: '#404040',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#00f5ff'
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

export default NetRunnerBottomBar;
