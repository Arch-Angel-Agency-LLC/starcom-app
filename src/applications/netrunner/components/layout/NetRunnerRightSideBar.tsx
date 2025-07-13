/**
 * NetRunner Right Sidebar - Scan Results & Analysis
 * 
 * Displays web crawler scan results and intelligence gathering data.
 * Integrates with the center scanner to show discovered pathways.
 * 
 * @author GitHub Copilot
 * @date July 12, 2025
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  List,
  ListItem,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Activity,
  Settings,
  Menu,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  BarChart3
} from 'lucide-react';
import WebCrawlerResults from '../results/WebCrawlerResults';

interface NetRunnerRightSideBarProps {
  open: boolean;
  width: number;
  onToggle: () => void;
}

interface TaskStatus {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  progress?: number;
  timestamp: Date;
}

const NetRunnerRightSideBar: React.FC<NetRunnerRightSideBarProps> = ({
  open,
  width,
  onToggle
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [scanInProgress] = useState(true);
  const [scanProgress] = useState(75);
  const [currentTarget] = useState('https://target.example.com');

  // Mock task statuses for demo
  const tasks: TaskStatus[] = [
    {
      id: '1',
      name: 'Web Crawler',
      status: 'running',
      progress: 75,
      timestamp: new Date()
    },
    {
      id: '2',
      name: 'Port Scanner',
      status: 'completed',
      timestamp: new Date(Date.now() - 5 * 60 * 1000)
    },
    {
      id: '3',
      name: 'Vulnerability Assessment',
      status: 'pending',
      timestamp: new Date()
    }
  ];

  const getStatusIcon = (status: TaskStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color="#00ff88" />;
      case 'failed':
        return <AlertCircle size={16} color="#ff4444" />;
      case 'running':
        return <Activity size={16} color="#00f5ff" />;
      default:
        return <Clock size={16} color="#ffaa00" />;
    }
  };

  const getStatusColor = (status: TaskStatus['status']) => {
    switch (status) {
      case 'completed':
        return '#00ff88';
      case 'failed':
        return '#ff4444';
      case 'running':
        return '#00f5ff';
      default:
        return '#ffaa00';
    }
  };

  const handleNavigateToUrl = (url: string) => {
    console.log('Navigate to:', url);
    // Here you would integrate with the center scanner
  };

  const handleDeepScan = (url: string) => {
    console.log('Deep scan:', url);
    // Here you would trigger a deep scan of the URL
  };

  const handleExportResults = () => {
    console.log('Export scan results');
    // Here you would export the scan results
  };

  return (
    <Box
      sx={{
        width: `${width}px`,
        height: '100%',
        backgroundColor: '#000000',
        borderLeft: '1px solid #00f5ff',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        fontFamily: "'Aldrich', 'Courier New', monospace"
      }}
    >
      {/* Header */}
      <Box
        sx={{
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          px: open ? 0.75 : 0.5,
          borderBottom: '1px solid #00f5ff',
          backgroundColor: '#0a0a0a'
        }}
      >
        {open && (
          <Typography variant="subtitle2" sx={{ 
            color: '#00f5ff',
            fontFamily: "'Aldrich', monospace",
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            INTEL_DATA
          </Typography>
        )}
        <Tooltip title={open ? "Collapse" : "Expand"}>
          <IconButton
            onClick={onToggle}
            size="small"
            sx={{ color: '#ffffff' }}
          >
            <Menu size={16} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Content */}
      {open && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: '1px solid #00f5ff' }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                minHeight: '28px',
                '& .MuiTab-root': {
                  color: '#aaaaaa',
                  fontSize: '0.65rem',
                  minHeight: '28px',
                  textTransform: 'uppercase',
                  fontFamily: "'Aldrich', monospace",
                  letterSpacing: '0.05em',
                  py: 0.25,
                  px: 0.75
                },
                '& .MuiTab-root.Mui-selected': {
                  color: '#00f5ff'
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#00f5ff',
                  height: 1
                }
              }}
            >
              <Tab 
                label="SCANS" 
                icon={<Search size={12} />} 
                iconPosition="start"
                sx={{ gap: 0.5 }}
              />
              <Tab 
                label="STATUS" 
                icon={<BarChart3 size={12} />} 
                iconPosition="start"
                sx={{ gap: 0.5 }}
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {activeTab === 0 && (
              <WebCrawlerResults
                targetUrl={currentTarget}
                isScanning={scanInProgress}
                progress={scanProgress}
                onNavigate={handleNavigateToUrl}
                onDeepScan={handleDeepScan}
                onExportResults={handleExportResults}
              />
            )}

            {activeTab === 1 && (
              <Box sx={{ p: 2, overflow: 'auto', height: '100%' }}>
                {/* Task Status Section */}
                <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333333', mb: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#ffffff', mb: 2 }}>
                      Active Tasks
                    </Typography>
                    
                    <List sx={{ p: 0 }}>
                      {tasks.map((task) => (
                        <ListItem key={task.id} sx={{ px: 0, py: 1 }}>
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              {getStatusIcon(task.status)}
                              <Typography
                                variant="body2"
                                sx={{ ml: 1, color: '#ffffff', flex: 1 }}
                              >
                                {task.name}
                              </Typography>
                              <Chip
                                label={task.status}
                                size="small"
                                sx={{
                                  backgroundColor: `${getStatusColor(task.status)}20`,
                                  color: getStatusColor(task.status),
                                  fontSize: '0.75rem'
                                }}
                              />
                            </Box>
                            {task.progress !== undefined && (
                              <Box sx={{ width: '100%', mt: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                                    Progress
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                                    {task.progress}%
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    width: '100%',
                                    height: 4,
                                    backgroundColor: '#333333',
                                    borderRadius: 2,
                                    overflow: 'hidden'
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: `${task.progress}%`,
                                      height: '100%',
                                      backgroundColor: '#00f5ff',
                                      transition: 'width 0.3s ease'
                                    }}
                                  />
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333333' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#ffffff', mb: 2 }}>
                      System Status
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          CPU Usage
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#00ff88' }}>
                          45%
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          Memory
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#00ff88' }}>
                          2.1GB
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                          API Calls
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#00ff88' }}>
                          127/1000
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Collapsed View - Just Icons */}
      {!open && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 1 }}>
          <Tooltip title="Scan Results" placement="left">
            <IconButton size="small" sx={{ color: '#00f5ff' }}>
              <Search size={20} />
            </IconButton>
          </Tooltip>
          <Tooltip title="System Status" placement="left">
            <IconButton size="small" sx={{ color: '#00ff88' }}>
              <Activity size={20} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings" placement="left">
            <IconButton size="small" sx={{ color: '#ffffff' }}>
              <Settings size={20} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

export default NetRunnerRightSideBar;
