/**
 * NetRunner Right Sidebar
 * 
 * Real-time monitoring, alerts, and intelligence feed sidebar.
 * Displays system status, active operations, and recent intelligence.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  TrendingUp,
  RefreshCw
} from 'lucide-react';

import { LoggerFactory } from '../../services/logging';

interface NetRunnerRightSideBarProps {
  open: boolean;
  width: number;
  activeView: string;
  systemMetrics: SystemMetric[];
  recentActivity: RecentActivity[];
  errorCount: number;
  warningCount: number;
  selectedTools: string[];
  activeBots: string[];
  runningJobs: RunningJob[];
  onRefreshMetrics: () => void;
  onRefreshActivity: () => void;
}

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface RecentActivity {
  id: string;
  type: 'tool' | 'bot' | 'workflow' | 'alert';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'info';
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

interface IntelligenceFeed {
  id: string;
  source: string;
  type: 'threat' | 'vulnerability' | 'ioc' | 'domain' | 'ip';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

const NetRunnerRightSideBar: React.FC<NetRunnerRightSideBarProps> = ({
  open,
  width,
  systemMetrics,
  recentActivity,
  errorCount,
  warningCount,
  selectedTools,
  activeBots,
  runningJobs,
  onRefreshMetrics,
  onRefreshActivity
}) => {
  const logger = useMemo(() => LoggerFactory.getLogger('NetRunnerRightSideBar'), []);
  
  const [activeTab, setActiveTab] = useState(0);

  // Mock Data - Replace with actual data from services
  // Mock Intelligence Feed - TODO: Replace with real data feed
  const intelligenceFeed: IntelligenceFeed[] = [
    {
      id: '1',
      source: 'VirusTotal',
      type: 'threat',
      title: 'Malicious Domain Detected',
      description: 'suspicious-domain.com flagged by 15 engines',
      severity: 'high',
      timestamp: new Date(Date.now() - 8 * 60 * 1000)
    },
    {
      id: '2',
      source: 'Shodan',
      type: 'vulnerability',
      title: 'Exposed Database Found',
      description: 'MongoDB instance on 192.168.1.100:27017',
      severity: 'critical',
      timestamp: new Date(Date.now() - 15 * 60 * 1000)
    },
    {
      id: '3',
      source: 'TheHarvester',
      type: 'domain',
      title: 'New Subdomain Discovered',
      description: 'api.target-company.com with open ports',
      severity: 'medium',
      timestamp: new Date(Date.now() - 28 * 60 * 1000)
    },
    {
      id: '4',
      source: 'Custom Feed',
      type: 'ioc',
      title: 'IP Address Blacklisted',
      description: '203.45.67.89 added to threat feed',
      severity: 'low',
      timestamp: new Date(Date.now() - 42 * 60 * 1000)
    }
  ];

  // Auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      logger.debug('Right sidebar data refreshed');
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [logger]);

  // Tab Change Handler
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    logger.debug('Right sidebar tab changed', { tab: newValue });
  }, [logger]);

  // Manual Refresh Handler
  const handleRefresh = useCallback(() => {
    logger.info('Manual refresh triggered');
    if (activeTab === 0) {
      onRefreshMetrics();
    } else if (activeTab === 1) {
      onRefreshActivity();
    }
  }, [logger, activeTab, onRefreshMetrics, onRefreshActivity]);

  // Status Color Mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'success':
        return '#00ff88';
      case 'warning':
        return '#ff8c00';
      case 'critical':
      case 'error':
        return '#ff0066';
      case 'info':
        return '#00f5ff';
      default:
        return '#b0b0b0';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return '#00ff88';
      case 'medium':
        return '#ff8c00';
      case 'high':
        return '#ff0066';
      case 'critical':
        return '#8b5cf6';
      default:
        return '#b0b0b0';
    }
  };

  // Format Time Ago
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Box
      sx={{
        width: open ? width : 0,
        height: '100%',
        backgroundColor: '#1a1a1a',
        borderLeft: '1px solid #404040',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        flexShrink: 0,
        // Ensure it stays within container
        position: 'relative',
        display: open ? 'flex' : 'none',
        flexDirection: 'column'
      }}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #404040',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: '#00f5ff',
              fontFamily: 'Aldrich, monospace',
              textShadow: '0 0 10px #00f5ff'
            }}
          >
            INTEL FEED
          </Typography>
          <IconButton
            onClick={handleRefresh}
            sx={{ color: '#00f5ff' }}
            size="small"
          >
            <RefreshCw />
          </IconButton>
        </Box>

        {/* Tab Navigation */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: '1px solid #404040',
            '& .MuiTab-root': {
              color: '#b0b0b0',
              minHeight: 48,
              fontSize: '0.8rem'
            },
            '& .Mui-selected': {
              color: '#00f5ff'
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00f5ff'
            }
          }}
        >
          <Tab label="Metrics" />
          <Tab label="Activity" />
          <Tab label="Intel" />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {/* System Metrics Tab */}
          {activeTab === 0 && (
            <Box sx={{ p: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: '#ffffff', mb: 2, px: 1 }}
              >
                System Performance
              </Typography>
              
              {systemMetrics.map((metric) => (
                <Card
                  key={metric.name}
                  sx={{
                    backgroundColor: '#2d2d2d',
                    border: '1px solid #404040',
                    mb: 1
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#ffffff' }}>
                        {metric.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: getStatusColor(metric.status) }}
                        >
                          {metric.value}{metric.unit}
                        </Typography>
                        <TrendingUp
                          style={{
                            color: metric.trend === 'up' ? '#00ff88' : 
                                   metric.trend === 'down' ? '#ff0066' : '#b0b0b0',
                            transform: metric.trend === 'down' ? 'rotate(180deg)' : 'none'
                          }}
                        />
                      </Box>
                    </Box>
                    {metric.name === 'CPU Usage' || metric.name === 'Memory' ? (
                      <LinearProgress
                        variant="determinate"
                        value={metric.value}
                        sx={{
                          backgroundColor: '#404040',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getStatusColor(metric.status)
                          }
                        }}
                      />
                    ) : null}
                  </CardContent>
                </Card>
              ))}

              {/* Quick Stats */}
              <Typography
                variant="subtitle2"
                sx={{ color: '#ffffff', my: 2, px: 1 }}
              >
                Quick Stats
              </Typography>
              
              <Card
                sx={{
                  backgroundColor: '#2d2d2d',
                  border: '1px solid #404040'
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ color: '#8b5cf6' }}>
                        {selectedTools.length}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                        Active Tools
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ color: '#00ff88' }}>
                        {activeBots.length}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                        Running Bots
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Recent Activity Tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: '#ffffff', mb: 2, px: 1 }}
              >
                Recent Activity
              </Typography>
              
              <List dense>
                {recentActivity.map((activity) => (
                  <ListItem
                    key={activity.id}
                    sx={{
                      backgroundColor: '#2d2d2d',
                      border: '1px solid #404040',
                      borderRadius: 1,
                      mb: 1,
                      flexDirection: 'column',
                      alignItems: 'flex-start'
                    }}
                  >
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: getStatusColor(activity.status)
                        }}
                      />
                      <ListItemText
                        primary={activity.title}
                        secondary={activity.description}
                        primaryTypographyProps={{
                          sx: { color: '#ffffff', fontSize: '0.85rem' }
                        }}
                        secondaryTypographyProps={{
                          sx: { color: '#b0b0b0', fontSize: '0.75rem' }
                        }}
                        sx={{ flex: 1 }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: '#b0b0b0', fontSize: '0.7rem' }}
                      >
                        {formatTimeAgo(activity.timestamp)}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Intelligence Feed Tab */}
          {activeTab === 2 && (
            <Box sx={{ p: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: '#ffffff', mb: 2, px: 1 }}
              >
                Intelligence Feed
              </Typography>
              
              <List dense>
                {intelligenceFeed.map((intel) => (
                  <ListItem
                    key={intel.id}
                    sx={{
                      backgroundColor: '#2d2d2d',
                      border: '1px solid #404040',
                      borderRadius: 1,
                      mb: 1,
                      flexDirection: 'column',
                      alignItems: 'flex-start'
                    }}
                  >
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Chip
                            size="small"
                            label={intel.severity}
                            sx={{
                              backgroundColor: getSeverityColor(intel.severity),
                              color: '#000000',
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ color: '#b0b0b0', fontSize: '0.7rem' }}
                          >
                            {intel.source}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{ color: '#ffffff', fontSize: '0.85rem', mb: 0.5 }}
                        >
                          {intel.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: '#b0b0b0', fontSize: '0.75rem' }}
                        >
                          {intel.description}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: '#b0b0b0', fontSize: '0.7rem' }}
                      >
                        {formatTimeAgo(intel.timestamp)}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: '1px solid #404040' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="caption"
              sx={{ color: '#b0b0b0' }}
            >
              Last updated: {new Date().toLocaleTimeString()}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Live Status">
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#00ff88',
                    animation: 'pulse 2s infinite'
                  }}
                />
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default NetRunnerRightSideBar;
