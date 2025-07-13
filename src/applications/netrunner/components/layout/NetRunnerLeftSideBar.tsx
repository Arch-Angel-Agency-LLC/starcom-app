/**
 * NetRunner Left Sidebar - Tools & Navigation
 * 
 * Clean sidebar for tool access and navigation with prominent AI Agent.
 * Ready for real tool integration.
 * 
 * @author GitHub Copilot
 * @date July 12, 2025
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Brain,
  Activity,
  Plus,
  Edit,
  Trash2,
  Zap,
  Terminal,
  Search,
  Shield,
  Target,
  Code,
  Database,
  Network,
  Lock,
  Eye,
  Settings
} from 'lucide-react';

interface NetRunnerLeftSideBarProps {
  open: boolean;
  width: number;
}

const NetRunnerLeftSideBar: React.FC<NetRunnerLeftSideBarProps> = ({
  open,
  width
}) => {
  // State for managing script/powertool selection
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  // Calculate AI Agent square size based on sidebar width
  const aiAgentSize = open ? Math.min(width - 32, 200) : 40;

  // Scripts and PowerTools configuration
  const scriptsAndTools = [
    { id: 'scan', name: 'Port Scanner', icon: Target, category: 'network' },
    { id: 'enum', name: 'Enumeration', icon: Search, category: 'recon' },
    { id: 'exploit', name: 'Exploit Kit', icon: Zap, category: 'exploit' },
    { id: 'stealth', name: 'Stealth Mode', icon: Eye, category: 'stealth' },
    { id: 'crypto', name: 'Crypto Tools', icon: Lock, category: 'crypto' },
    { id: 'db', name: 'DB Access', icon: Database, category: 'data' },
    { id: 'net', name: 'Network Tools', icon: Network, category: 'network' },
    { id: 'code', name: 'Code Exec', icon: Code, category: 'exec' },
    { id: 'shell', name: 'Shell Access', icon: Terminal, category: 'access' },
    { id: 'shield', name: 'Defense', icon: Shield, category: 'defense' },
    { id: 'config', name: 'Config', icon: Settings, category: 'config' }
  ];

  return (
    <Box
      sx={{
        width: `${width}px`,
        height: '100%',
        backgroundColor: '#000000',
        borderRight: '1px solid #00f5ff',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        fontFamily: "'Aldrich', 'Courier New', monospace"
      }}
    >
      {/* AI Agent Square */}
      <Box
        sx={{
          p: 0.75,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderBottom: '1px solid #00f5ff',
          backgroundColor: '#0a0a0a'
        }}
      >
        <Box
          sx={{
            width: aiAgentSize,
            height: aiAgentSize,
            backgroundColor: '#000000',
            border: '2px solid #00ff88',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: '#00f5ff',
              backgroundColor: '#0a0a0a'
            }
          }}
        >
          {/* AI Agent Avatar/Icon */}
          <Avatar
            sx={{
              width: open ? 48 : 20,
              height: open ? 48 : 20,
              backgroundColor: 'rgba(0, 255, 136, 0.15)',
              border: '1px solid #00ff88',
              borderRadius: 0,
              mb: open ? 0.5 : 0
            }}
          >
            <Brain size={open ? 24 : 14} color="#00ff88" />
          </Avatar>

          {/* AI Agent Status - Only show when expanded */}
          {open && (
            <>
              <Typography
                variant="caption"
                sx={{
                  color: '#00ff88',
                  fontFamily: "'Aldrich', monospace",
                  fontSize: '0.6rem',
                  letterSpacing: '0.05em',
                  textAlign: 'center',
                  mb: 0.25
                }}
              >
                AI_AGENT
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <Activity size={10} color="#00ff88" />
                <Typography
                  variant="caption"
                  sx={{
                    color: '#00ff88',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '0.6rem'
                  }}
                >
                  ACTIVE
                </Typography>
              </Box>

              {/* Status Indicator */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 12,
                  height: 12,
                  backgroundColor: '#00ff88',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px rgba(0, 255, 136, 0.8)',
                  '@keyframes pulse': {
                    '0%': {
                      opacity: 1,
                      transform: 'scale(1)'
                    },
                    '50%': {
                      opacity: 0.7,
                      transform: 'scale(1.1)'
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'scale(1)'
                    }
                  },
                  animation: 'pulse 2s infinite'
                }}
              />
            </>
          )}

          {/* Collapsed view indicator */}
          {!open && (
            <Box
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                backgroundColor: '#00ff88',
                borderRadius: '50%',
                boxShadow: '0 0 8px rgba(0, 255, 136, 0.8)',
                '@keyframes pulse': {
                  '0%': {
                    opacity: 1,
                    transform: 'scale(1)'
                  },
                  '50%': {
                    opacity: 0.7,
                    transform: 'scale(1.1)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'scale(1)'
                  }
                },
                animation: 'pulse 2s infinite'
              }}
            />
          )}
        </Box>

        {/* AI Agent Name - Only when expanded */}
        {open && (
          <Typography
            variant="caption"
            sx={{
              color: '#ffffff',
              mt: 1,
              textAlign: 'center',
              fontSize: '0.75rem'
            }}
          >
            Neural Commander
          </Typography>
        )}
      </Box>

      {/* Scripts & PowerTools Section */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Section Header */}
        {open && (
          <Box
            sx={{
              p: 0.75,
              pb: 0.5,
              borderBottom: '1px solid #00f5ff',
              backgroundColor: '#0a0a0a'
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: '#00f5ff',
                fontFamily: "'Aldrich', monospace",
                fontSize: '0.65rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                mb: 0.25
              }}
            >
              SCRIPTS_&_POWERTOOLS
            </Typography>
          </Box>
        )}

        {/* Tools Grid */}
        <Box sx={{ flex: 1, overflow: 'auto', p: open ? 0.5 : 0.25 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: open ? 'repeat(2, 1fr)' : '1fr',
              gap: open ? 0.5 : 0.25
            }}
          >
            {scriptsAndTools.map((tool) => (
              <Tooltip title={tool.name} placement="right" key={tool.id}>
                <IconButton
                  onClick={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
                  sx={{
                    width: open ? 'auto' : 28,
                    height: open ? 'auto' : 28,
                    minWidth: open ? 36 : 28,
                    minHeight: open ? 36 : 28,
                    backgroundColor: selectedTool === tool.id ? 'rgba(0, 245, 255, 0.15)' : '#0a0a0a',
                    border: '1px solid',
                    borderColor: selectedTool === tool.id ? '#00f5ff' : '#333333',
                    borderRadius: 0,
                    color: selectedTool === tool.id ? '#00f5ff' : '#ffffff',
                    display: 'flex',
                    flexDirection: open ? 'column' : 'row',
                    gap: open ? 0.25 : 0,
                    transition: 'all 0.1s ease',
                    '&:hover': {
                      borderColor: '#00f5ff',
                      backgroundColor: 'rgba(0, 245, 255, 0.1)'
                    }
                  }}
                >
                  <tool.icon size={open ? 16 : 14} />
                  {open && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.55rem',
                        textAlign: 'center',
                        lineHeight: 1,
                        color: 'inherit',
                        fontFamily: "'Courier New', monospace"
                      }}
                    >
                      {tool.name.split(' ')[0].toUpperCase()}
                    </Typography>
                  )}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        </Box>

        {/* Management Bar */}
        <Box
          sx={{
            borderTop: '1px solid #00f5ff',
            p: 0.5,
            display: 'flex',
            justifyContent: 'space-around',
            gap: 0.25,
            backgroundColor: '#0a0a0a'
          }}
        >
          <Tooltip title="Add Script/Tool">
            <IconButton
              size="small"
              sx={{
                color: '#00ff88',
                border: '1px solid #00ff88',
                borderRadius: '6px',
                minWidth: open ? 32 : 28,
                minHeight: open ? 32 : 28,
                '&:hover': {
                  backgroundColor: 'rgba(0, 255, 136, 0.1)',
                  transform: 'scale(1.1)'
                }
              }}
            >
              <Plus size={open ? 16 : 14} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit Selected">
            <IconButton
              size="small"
              disabled={!selectedTool}
              sx={{
                color: selectedTool ? '#ffaa00' : '#555555',
                border: '1px solid',
                borderColor: selectedTool ? '#ffaa00' : '#555555',
                borderRadius: '6px',
                minWidth: open ? 32 : 28,
                minHeight: open ? 32 : 28,
                '&:hover': {
                  backgroundColor: selectedTool ? 'rgba(255, 170, 0, 0.1)' : 'transparent',
                  transform: selectedTool ? 'scale(1.1)' : 'none'
                }
              }}
            >
              <Edit size={open ? 16 : 14} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Remove Selected">
            <IconButton
              size="small"
              disabled={!selectedTool}
              sx={{
                color: selectedTool ? '#ff4444' : '#555555',
                border: '1px solid',
                borderColor: selectedTool ? '#ff4444' : '#555555',
                borderRadius: '6px',
                minWidth: open ? 32 : 28,
                minHeight: open ? 32 : 28,
                '&:hover': {
                  backgroundColor: selectedTool ? 'rgba(255, 68, 68, 0.1)' : 'transparent',
                  transform: selectedTool ? 'scale(1.1)' : 'none'
                }
              }}
            >
              <Trash2 size={open ? 16 : 14} />
            </IconButton>
          </Tooltip>
        </Box>

      </Box>
    </Box>
  );
};

export default NetRunnerLeftSideBar;
