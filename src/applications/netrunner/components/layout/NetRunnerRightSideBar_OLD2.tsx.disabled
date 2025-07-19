/**
 * NetRunner Right Sidebar - Tools & Results
 * 
 * Clean sidebar for tool results and status monitoring.
 * Ready for real tool integration.
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
  const [scanInProgress, setScanInProgress] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentTarget, setCurrentTarget] = useState('https://example.com');

  // Mock task statuses for demo
  const tasks: TaskStatus[] = [
    {
      id: '1',
      name: 'Domain Scan',
      status: 'completed',
      timestamp: new Date(Date.now() - 5 * 60 * 1000)
    },
    {
      id: '2',
      name: 'Port Analysis',
      status: 'running',
      progress: 65,
      timestamp: new Date()
    },
    {
      id: '3',
      name: 'Intel Gathering',
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

  const handleScanStart = () => {
    setScanInProgress(true);
    setScanProgress(0);

    // Simulate scan progress
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev === 100) {
          clearInterval(interval);
          setScanInProgress(false);
          return 100;
        }
        return prev + 10;
      });
    }, 1000);
  };

  return (
    <Box
      sx={{
        width: `${width}px`,
        height: '100%',
        backgroundColor: '#111111',
        borderLeft: '1px solid #333333',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          px: open ? 2 : 1,
          borderBottom: '1px solid #333333'
        }}
      >
        {open && (
          <Typography variant="subtitle2" sx={{ color: '#ffffff' }}>
            Status
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
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
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
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333333', mb: 2 }}>
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

          {/* Web Crawler Results */}
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333333' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#ffffff', mb: 2 }}>
                Web Crawler Results
              </Typography>
              
              <WebCrawlerResults />
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Collapsed View - Just Icons */}
      {!open && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 1 }}>
          <Tooltip title="Activity" placement="left">
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
