/**
 * NetRunner Bottom Bar - BotRoster
 * 
 * BotRoster that is scrollable horizontally.
 * Displays active NetRunner bots and automation agents with real-time status.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Button
} from '@mui/material';
import {
  Bot,
  Play,
  Pause,
  Settings,
  Activity,
  Wifi,
  WifiOff,
  Shield,
  Search,
  Zap,
  Brain,
  Eye,
  Lock,
  Globe,
  Database,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface NetRunnerBottomBarProps {
  open: boolean;
  height: number;
  onToggle: () => void;
}

interface NetRunnerBot {
  id: string;
  name: string;
  type: 'scanner' | 'analyzer' | 'monitor' | 'extractor' | 'ai-agent' | 'guardian';
  status: 'online' | 'offline' | 'running' | 'paused' | 'error';
  avatar: string;
  description: string;
  lastActivity: Date;
  uptime: number;
  tasksCompleted: number;
  currentTask?: string;
  icon: React.ComponentType;
  color: string;
  capabilities: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const NetRunnerBottomBar: React.FC<NetRunnerBottomBarProps> = ({
  open,
  height,
  onToggle
}) => {
  const [bots, setBots] = useState<NetRunnerBot[]>([
    {
      id: 'recon-alpha',
      name: 'Recon Alpha',
      type: 'scanner',
      status: 'running',
      avatar: '🔍',
      description: 'Advanced reconnaissance and network discovery bot',
      lastActivity: new Date(),
      uptime: 3600000,
      tasksCompleted: 47,
      currentTask: 'Scanning subnet 192.168.1.0/24',
      icon: Search,
      color: '#00f5ff',
      capabilities: ['port-scan', 'service-enum', 'os-detect'],
      priority: 'high'
    },
    {
      id: 'intel-bravo',
      name: 'Intel Bravo',
      type: 'analyzer',
      status: 'online',
      avatar: '🧠',
      description: 'Intelligence analysis and pattern recognition specialist',
      lastActivity: new Date(Date.now() - 120000),
      uptime: 7200000,
      tasksCompleted: 23,
      icon: Brain,
      color: '#8b5cf6',
      capabilities: ['threat-analysis', 'pattern-match', 'correlation'],
      priority: 'medium'
    },
    {
      id: 'guardian-charlie',
      name: 'Guardian Charlie',
      type: 'guardian',
      status: 'online',
      avatar: '🛡️',
      description: 'Security monitoring and threat detection guardian',
      lastActivity: new Date(Date.now() - 30000),
      uptime: 14400000,
      tasksCompleted: 156,
      icon: Shield,
      color: '#00ff88',
      capabilities: ['intrusion-detect', 'anomaly-analysis', 'auto-response'],
      priority: 'critical'
    },
    {
      id: 'extractor-delta',
      name: 'Extractor Delta',
      type: 'extractor',
      status: 'running',
      avatar: '⚡',
      description: 'Data extraction and OSINT collection specialist',
      lastActivity: new Date(),
      uptime: 1800000,
      tasksCompleted: 89,
      currentTask: 'Extracting metadata from social profiles',
      icon: Zap,
      color: '#ffaa00',
      capabilities: ['web-scraping', 'metadata-extract', 'social-osint'],
      priority: 'high'
    },
    {
      id: 'ai-echo',
      name: 'AI Echo',
      type: 'ai-agent',
      status: 'running',
      avatar: '🤖',
      description: 'Autonomous AI agent for complex decision making',
      lastActivity: new Date(),
      uptime: 10800000,
      tasksCompleted: 34,
      currentTask: 'Analyzing threat vectors and risk assessment',
      icon: Bot,
      color: '#ff6b35',
      capabilities: ['decision-making', 'learning', 'adaptation', 'coordination'],
      priority: 'critical'
    },
    {
      id: 'monitor-foxtrot',
      name: 'Monitor Foxtrot',
      type: 'monitor',
      status: 'online',
      avatar: '👁️',
      description: 'Continuous monitoring and surveillance bot',
      lastActivity: new Date(Date.now() - 45000),
      uptime: 21600000,
      tasksCompleted: 278,
      icon: Eye,
      color: '#ff4081',
      capabilities: ['real-time-monitor', 'alert-system', 'log-analysis'],
      priority: 'medium'
    },
    {
      id: 'crypto-golf',
      name: 'Crypto Golf',
      type: 'analyzer',
      status: 'paused',
      avatar: '🔐',
      description: 'Cryptographic analysis and security assessment bot',
      lastActivity: new Date(Date.now() - 300000),
      uptime: 5400000,
      tasksCompleted: 12,
      icon: Lock,
      color: '#9c27b0',
      capabilities: ['crypto-analysis', 'ssl-check', 'cert-validation'],
      priority: 'low'
    },
    {
      id: 'web-hunter',
      name: 'Web Hunter',
      type: 'scanner',
      status: 'running',
      avatar: '🌐',
      description: 'Web application scanner and vulnerability detector',
      lastActivity: new Date(),
      uptime: 900000,
      tasksCompleted: 67,
      currentTask: 'Scanning web applications for vulnerabilities',
      icon: Globe,
      color: '#2196f3',
      capabilities: ['web-scan', 'vuln-detect', 'payload-test'],
      priority: 'high'
    },
    {
      id: 'data-miner',
      name: 'Data Miner',
      type: 'extractor',
      status: 'offline',
      avatar: '💾',
      description: 'Database analysis and information extraction bot',
      lastActivity: new Date(Date.now() - 1800000),
      uptime: 0,
      tasksCompleted: 145,
      icon: Database,
      color: '#607d8b',
      capabilities: ['db-analysis', 'data-mine', 'info-extract'],
      priority: 'low'
    }
  ]);

  const [scrollPosition, setScrollPosition] = useState(0);
  const cardWidth = 280;
  const visibleCards = Math.floor((window.innerWidth - 100) / cardWidth);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#00ff88';
      case 'offline': return '#666';
      case 'running': return '#00f5ff';
      case 'paused': return '#ffaa00';
      case 'error': return '#ff4444';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi size={12} />;
      case 'offline': return <WifiOff size={12} />;
      case 'running': return <Activity size={12} />;
      case 'paused': return <Pause size={12} />;
      case 'error': return <WifiOff size={12} />;
      default: return <Wifi size={12} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffaa00';
      case 'low': return '#666';
      default: return '#666';
    }
  };

  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleBotAction = useCallback((botId: string, action: 'start' | 'pause' | 'stop') => {
    setBots(prev => prev.map(bot => {
      if (bot.id === botId) {
        switch (action) {
          case 'start':
            return { ...bot, status: 'running', lastActivity: new Date() };
          case 'pause':
            return { ...bot, status: 'paused' };
          case 'stop':
            return { ...bot, status: 'offline', uptime: 0 };
          default:
            return bot;
        }
      }
      return bot;
    }));
  }, []);

  const scrollLeft = () => {
    setScrollPosition(prev => Math.max(0, prev - cardWidth));
  };

  const scrollRight = () => {
    setScrollPosition(prev => Math.min((bots.length - visibleCards) * cardWidth, prev + cardWidth));
  };

  if (!open) {
    return (
      <Box
        sx={{
          height: 40,
          width: '100%',
          backgroundColor: '#0a0a0a',
          borderTop: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingX: 2,
          cursor: 'pointer'
        }}
        onClick={onToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: '#8b5cf6',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            BOTROSTER
          </Typography>
          
          {/* Mini status indicators */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {bots.slice(0, 6).map((bot) => (
              <Box
                key={bot.id}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(bot.status),
                  animation: bot.status === 'running' ? 'pulse 2s infinite' : 'none'
                }}
              />
            ))}
          </Box>
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: '#666',
            fontSize: '11px'
          }}
        >
          {bots.filter(bot => bot.status === 'running').length} running • {bots.filter(bot => bot.status === 'online').length} online
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height,
        width: '100%',
        backgroundColor: '#0a0a0a',
        borderTop: '1px solid #333',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingX: 2,
          borderBottom: '1px solid #333',
          backgroundColor: '#111'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="h6"
            sx={{
              color: '#8b5cf6',
              fontFamily: '"Orbitron", monospace',
              fontSize: '14px',
              fontWeight: 700
            }}
          >
            BOTROSTER ({bots.length})
          </Typography>
          
          <Button
            size="small"
            variant="outlined"
            startIcon={<Plus size={12} />}
            sx={{
              borderColor: '#8b5cf6',
              color: '#8b5cf6',
              fontSize: '10px',
              minWidth: 'auto',
              padding: '4px 8px',
              '&:hover': {
                borderColor: '#a855f7',
                backgroundColor: 'rgba(139, 92, 246, 0.1)'
              }
            }}
          >
            Deploy Bot
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: '#00ff88',
              fontSize: '11px'
            }}
          >
            {bots.filter(bot => bot.status === 'running').length} ACTIVE
          </Typography>
          
          <Typography
            variant="caption"
            sx={{
              color: '#666',
              cursor: 'pointer'
            }}
            onClick={onToggle}
          >
            Collapse
          </Typography>
        </Box>
      </Box>

      {/* Bot Roster Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Scroll Left Button */}
        {scrollPosition > 0 && (
          <IconButton
            onClick={scrollLeft}
            sx={{
              position: 'absolute',
              left: 8,
              zIndex: 2,
              backgroundColor: 'rgba(139, 92, 246, 0.8)',
              color: '#fff',
              '&:hover': { backgroundColor: 'rgba(139, 92, 246, 1)' }
            }}
          >
            <ChevronLeft />
          </IconButton>
        )}

        {/* Bot Cards Container */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            padding: '16px',
            transform: `translateX(-${scrollPosition}px)`,
            transition: 'transform 0.3s ease',
            width: 'max-content'
          }}
        >
          {bots.map((bot) => {
            return (
              <Card
                key={bot.id}
                sx={{
                  minWidth: cardWidth - 16,
                  maxWidth: cardWidth - 16,
                  backgroundColor: '#1a1a1a',
                  border: `1px solid ${bot.color}`,
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                <CardContent sx={{ padding: '12px !important' }}>
                  {/* Bot Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: `${bot.color}20`,
                        border: `2px solid ${bot.color}`,
                        fontSize: '14px'
                      }}
                    >
                      {bot.avatar}
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#ccc',
                          fontSize: '13px',
                          fontWeight: 600,
                          lineHeight: 1.2
                        }}
                      >
                        {bot.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={bot.type}
                          size="small"
                          sx={{
                            backgroundColor: `${bot.color}20`,
                            color: bot.color,
                            fontSize: '8px',
                            height: '16px'
                          }}
                        />
                        <Chip
                          label={bot.priority}
                          size="small"
                          sx={{
                            backgroundColor: `${getPriorityColor(bot.priority)}20`,
                            color: getPriorityColor(bot.priority),
                            fontSize: '8px',
                            height: '16px'
                          }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getStatusIcon(bot.status)}
                      <Typography
                        variant="caption"
                        sx={{
                          color: getStatusColor(bot.status),
                          fontSize: '10px',
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}
                      >
                        {bot.status}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#b0b0b0',
                      fontSize: '11px',
                      mb: 1,
                      lineHeight: 1.3
                    }}
                  >
                    {bot.description}
                  </Typography>

                  {/* Current Task */}
                  {bot.currentTask && (
                    <Box
                      sx={{
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #333',
                        borderRadius: 1,
                        padding: 0.5,
                        mb: 1
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#00ff88',
                          fontSize: '9px',
                          fontFamily: '"Monaco", "Menlo", monospace'
                        }}
                      >
                        {bot.currentTask}
                      </Typography>
                    </Box>
                  )}

                  {/* Progress Bar for Running Bots */}
                  {bot.status === 'running' && (
                    <LinearProgress
                      sx={{
                        height: 3,
                        borderRadius: 1.5,
                        backgroundColor: '#333',
                        mb: 1,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: bot.color,
                          borderRadius: 1.5
                        }
                      }}
                    />
                  )}

                  {/* Bot Stats */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '9px' }}>
                      {bot.tasksCompleted} tasks
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '9px' }}>
                      {bot.status !== 'offline' ? formatUptime(bot.uptime) : 'Offline'}
                    </Typography>
                  </Box>

                  {/* Bot Controls */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {bot.status === 'offline' && (
                        <Tooltip title="Start Bot">
                          <IconButton
                            size="small"
                            onClick={() => handleBotAction(bot.id, 'start')}
                            sx={{ color: '#00ff88' }}
                          >
                            <Play size={10} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {(bot.status === 'running' || bot.status === 'online') && (
                        <Tooltip title="Pause Bot">
                          <IconButton
                            size="small"
                            onClick={() => handleBotAction(bot.id, 'pause')}
                            sx={{ color: '#ffaa00' }}
                          >
                            <Pause size={10} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {bot.status !== 'offline' && (
                        <Tooltip title="Stop Bot">
                          <IconButton
                            size="small"
                            onClick={() => handleBotAction(bot.id, 'stop')}
                            sx={{ color: '#ff4444' }}
                          >
                            <WifiOff size={10} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>

                    <Tooltip title="Bot Settings">
                      <IconButton
                        size="small"
                        sx={{ color: '#00f5ff' }}
                      >
                        <Settings size={10} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Scroll Right Button */}
        {scrollPosition < (bots.length - visibleCards) * cardWidth && (
          <IconButton
            onClick={scrollRight}
            sx={{
              position: 'absolute',
              right: 8,
              zIndex: 2,
              backgroundColor: 'rgba(139, 92, 246, 0.8)',
              color: '#fff',
              '&:hover': { backgroundColor: 'rgba(139, 92, 246, 1)' }
            }}
          >
            <ChevronRight />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default NetRunnerBottomBar;
