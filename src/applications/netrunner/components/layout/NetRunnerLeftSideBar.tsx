/**
 * NetRunner Left Sidebar - AI Agent Commander
 * 
 * A Square view of a NetRunnerAIAgentCommander that can autonomously control the entire interface.
 * Features autonomou        <Tooltip title="AI Agent Commander">
          <IconButton
            onClick={onToggle}
            sx={{ 
              color: '#00ff88',
              mb: 2,
              border: '2px solid #00ff88',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 255, 136, 0.1)',
              boxShadow: '0 0 15px rgba(0, 255, 136, 0.4)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(0, 255, 136, 0.2)',
                boxShadow: '0 0 25px rgba(0, 255, 136, 0.6)',
                transform: 'scale(1.05)'
              }
            }}
          >
            <Brain />
          </IconButton>
        </Tooltip>icators and real-time AI agent status monitoring.
 * 
 * @author GitHub Copilot
 * @date July 11, 2025
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent
} from '@mui/material';
import {
  Bot,
  Brain,
  Activity,
  Target,
  Eye,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface NetRunnerLeftSideBarProps {
  open: boolean;
  width: number;
  onToggle: () => void;
}

interface AIAgentState {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'learning' | 'analyzing' | 'controlling';
  autonomyLevel: number; // 0-100
  currentTask: string;
  tasksCompleted: number;
  successRate: number;
  lastActivity: Date;
  capabilities: string[];
  controllingModules: string[];
}

const NetRunnerLeftSideBar: React.FC<NetRunnerLeftSideBarProps> = ({
  open,
  width,
  onToggle
}) => {
  const [aiAgent, setAiAgent] = useState<AIAgentState>({
    id: 'netrunner-ai-001',
    name: 'NetRunner AI Commander',
    status: 'controlling',
    autonomyLevel: 87,
    currentTask: 'Coordinating multi-vector OSINT scan across 247 targets',
    tasksCompleted: 1247,
    successRate: 94.7,
    lastActivity: new Date(),
    capabilities: [
      'Autonomous OSINT Coordination',
      'Real-time Threat Assessment', 
      'Adaptive Tool Selection',
      'Multi-target Analysis',
      'Risk Evaluation',
      'Resource Optimization'
    ],
    controllingModules: [
      'Scanning Engine',
      'Bot Management',
      'Tool Orchestration',
      'Data Analysis',
      'Workflow Control'
    ]
  });

  const [activityLog, setActivityLog] = useState<string[]>([]);

  // Simulate AI agent activity
  useEffect(() => {
    const activities = [
      'Initiated port scan on 192.168.1.0/24',
      'Detected anomalous traffic pattern',
      'Optimized scanning parameters for stealth',
      'Coordinated bot deployment strategy',
      'Analyzed vulnerability correlation',
      'Adjusted threat assessment algorithms',
      'Prioritized high-value targets',
      'Synchronized tool execution timing'
    ];

    const interval = setInterval(() => {
      const activity = activities[Math.floor(Math.random() * activities.length)];
      setActivityLog(prev => [...prev.slice(-4), activity]);
      
      setAiAgent(prev => ({
        ...prev,
        lastActivity: new Date(),
        tasksCompleted: prev.tasksCompleted + Math.floor(Math.random() * 3),
        autonomyLevel: Math.max(75, Math.min(100, prev.autonomyLevel + (Math.random() - 0.5) * 10))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#00ff88';
      case 'controlling': return '#8b5cf6';
      case 'analyzing': return '#00f5ff';
      case 'learning': return '#ffaa00';
      case 'idle': return '#666';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity size={14} />;
      case 'controlling': return <Bot size={14} />;
      case 'analyzing': return <Brain size={14} />;
      case 'learning': return <Target size={14} />;
      case 'idle': return <Eye size={14} />;
      default: return <Bot size={14} />;
    }
  };

  if (!open) {
    return (
      <Box
        sx={{
          width: 60,
          height: '100vh',
          backgroundColor: '#000000',
          backgroundImage: `
            linear-gradient(45deg, rgba(0, 255, 136, 0.08) 0%, transparent 70%),
            radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)
          `,
          borderRight: `2px solid rgba(0, 255, 136, 0.6)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 2,
          position: 'relative',
          boxShadow: `
            inset -2px 0 15px rgba(0, 255, 136, 0.2),
            2px 0 20px rgba(0, 0, 0, 0.6)
          `,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 8px,
                rgba(0, 255, 136, 0.04) 8px,
                rgba(0, 255, 136, 0.04) 16px
              )
            `,
            pointerEvents: 'none'
          }
        }}
      >
        <Tooltip title="AI Agent Commander">
          <IconButton
            onClick={onToggle}
            sx={{ 
              color: '#8b5cf6',
              mb: 2,
              border: '2px solid #8b5cf6',
              borderRadius: '8px'
            }}
          >
            <Bot />
          </IconButton>
        </Tooltip>

        {/* Compact AI Status */}
        <Avatar
          sx={{
            width: 40,
            height: 40,
            backgroundColor: getStatusColor(aiAgent.status),
            color: '#000',
            fontSize: '20px',
            mb: 1
          }}
        >
          🤖
        </Avatar>

        <Typography
          variant="caption"
          sx={{
            color: getStatusColor(aiAgent.status),
            fontSize: '10px',
            textAlign: 'center',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed'
          }}
        >
          {Math.round(aiAgent.autonomyLevel)}%
        </Typography>

        {/* Activity indicators */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center', mt: 2 }}>
          {aiAgent.status === 'active' && (
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#00ff88',
                border: '2px solid rgba(0, 255, 136, 0.5)',
                boxShadow: '0 0 15px rgba(0, 255, 136, 0.8)',
                animation: 'pulse 1.2s infinite',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  animation: 'pulse 0.6s infinite'
                }
              }}
            />
          )}
          {aiAgent.autonomyLevel > 70 && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#ff4444',
                border: '1px solid rgba(255, 68, 68, 0.5)',
                boxShadow: '0 0 10px rgba(255, 68, 68, 0.6)',
                animation: 'pulse 2s infinite'
              }}
            />
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width,
        height: '100vh',
        backgroundColor: '#000000',
        backgroundImage: `
          linear-gradient(135deg, rgba(0, 255, 136, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 30% 70%, rgba(0, 245, 255, 0.08) 0%, transparent 40%)
        `,
        borderRight: `2px solid transparent`,
        borderImage: `linear-gradient(180deg, 
          rgba(0, 255, 136, 0.8) 0%, 
          rgba(0, 245, 255, 0.6) 50%, 
          rgba(139, 92, 246, 0.4) 100%
        ) 1`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: `
          inset -2px 0 8px rgba(0, 255, 136, 0.15),
          2px 0 20px rgba(0, 0, 0, 0.5)
        `,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 1px,
              rgba(0, 255, 136, 0.02) 1px,
              rgba(0, 255, 136, 0.02) 2px
            )
          `,
          pointerEvents: 'none',
          zIndex: 1
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          padding: 2,
          borderBottom: `1px solid rgba(0, 255, 136, 0.3)`,
          backgroundColor: 'rgba(0, 255, 136, 0.05)',
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#00ff88',
            fontFamily: '"Orbitron", monospace',
            fontSize: '16px',
            fontWeight: 900,
            textAlign: 'center',
            textShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}
        >
          █ AI AGENT COMMANDER █
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(0, 255, 136, 0.8)',
            display: 'block',
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '1px',
            marginTop: '4px',
            textShadow: '0 0 5px rgba(0, 255, 136, 0.3)'
          }}
        >
          ▓ AUTONOMOUS CONTROL INTERFACE ▓
        </Typography>
      </Box>

      {/* AI Agent Square View - 120x120px as requested */}
      <Box sx={{ 
        padding: 2, 
        borderBottom: `1px solid rgba(0, 255, 136, 0.2)`,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        position: 'relative',
        zIndex: 2
      }}>
        <Card
          sx={{
            backgroundColor: '#000000',
            border: `2px solid ${getStatusColor(aiAgent.status)}`,
            borderRadius: 2,
            boxShadow: `
              0 0 20px ${getStatusColor(aiAgent.status)}40,
              inset 0 0 20px rgba(0, 0, 0, 0.8)
            `,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                linear-gradient(45deg, 
                  transparent 30%, 
                  ${getStatusColor(aiAgent.status)}20 50%, 
                  transparent 70%
                )
              `,
              animation: aiAgent.status === 'active' ? 'pulse 2s infinite' : 'none'
            }
          }}
        >
          <CardContent sx={{ padding: '16px !important' }}>
            {/* Agent Avatar - Square 120x120px */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 2
              }}
            >
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  backgroundColor: `${getStatusColor(aiAgent.status)}20`,
                  border: `3px solid ${getStatusColor(aiAgent.status)}`,
                  fontSize: '48px',
                  borderRadius: 2
                }}
              >
                🤖
              </Avatar>
            </Box>

            {/* Agent Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              {getStatusIcon(aiAgent.status)}
              <Typography
                variant="h6"
                sx={{
                  color: getStatusColor(aiAgent.status),
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                {aiAgent.status}
              </Typography>
            </Box>

            {/* Autonomy Level */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#ccc', fontSize: '12px' }}>
                  Autonomy Level
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: getStatusColor(aiAgent.status),
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {Math.round(aiAgent.autonomyLevel)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={aiAgent.autonomyLevel}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#333',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getStatusColor(aiAgent.status),
                    borderRadius: 4
                  }
                }}
              />
            </Box>

            {/* Current Task */}
            <Box
              sx={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: 1,
                padding: 1,
                mb: 2
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: '#00ff88',
                  fontSize: '10px',
                  fontFamily: '"Monaco", "Menlo", monospace'
                }}
              >
                {aiAgent.currentTask}
              </Typography>
            </Box>

            {/* Control Actions */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Tooltip title="Pause AI Control">
                <IconButton size="small" sx={{ color: '#ffaa00' }}>
                  <Pause size={14} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Resume AI Control">
                <IconButton size="small" sx={{ color: '#00ff88' }}>
                  <Play size={14} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset AI State">
                <IconButton size="small" sx={{ color: '#00f5ff' }}>
                  <RotateCcw size={14} />
                </IconButton>
              </Tooltip>
              <Tooltip title="AI Settings">
                <IconButton size="small" sx={{ color: '#8b5cf6' }}>
                  <Settings size={14} />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#666', fontSize: '10px' }}>
                  Tasks
                </Typography>
                <Typography variant="body2" sx={{ color: '#ccc', fontSize: '12px', fontWeight: 600 }}>
                  {aiAgent.tasksCompleted.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#666', fontSize: '10px' }}>
                  Success
                </Typography>
                <Typography variant="body2" sx={{ color: '#00ff88', fontSize: '12px', fontWeight: 600 }}>
                  {aiAgent.successRate}%
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Controlling Modules */}
      <Box sx={{ padding: 2, borderBottom: '1px solid #333' }}>
        <Typography
          variant="h6"
          sx={{
            color: '#8b5cf6',
            fontSize: '14px',
            fontWeight: 600,
            mb: 1
          }}
        >
          AUTONOMOUS CONTROL
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {aiAgent.controllingModules.map((module, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                padding: 1,
                backgroundColor: '#1a1a1a',
                borderRadius: 1,
                border: '1px solid #333'
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#00ff88',
                  animation: 'pulse 2s infinite'
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: '#ccc',
                  fontSize: '11px'
                }}
              >
                {module}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Recent Activity */}
      <Box sx={{ flex: 1, padding: 2, overflow: 'auto' }}>
        <Typography
          variant="h6"
          sx={{
            color: '#8b5cf6',
            fontSize: '14px',
            fontWeight: 600,
            mb: 1
          }}
        >
          RECENT ACTIVITY
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {activityLog.map((activity, index) => (
            <Box
              key={index}
              sx={{
                padding: 1,
                backgroundColor: '#1a1a1a',
                borderRadius: 1,
                border: '1px solid #333'
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: '#b0b0b0',
                  fontSize: '10px',
                  fontFamily: '"Monaco", "Menlo", monospace'
                }}
              >
                {activity}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default NetRunnerLeftSideBar;
