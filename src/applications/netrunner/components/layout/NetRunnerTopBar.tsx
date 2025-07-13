/**
 * NetRunner Top Bar - System Status & Controls
 * 
 * Clean status bar for NetRunner application.
 * Shows basic system status and can expand for more details.
 * 
 * @author GitHub Copilot
 * @date July 12, 2025
 */

import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Maximize2,
  Minimize2,
  Terminal,
  Activity
} from 'lucide-react';

interface NetRunnerTopBarProps {
  height: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const NetRunnerTopBar: React.FC<NetRunnerTopBarProps> = ({
  height,
  isExpanded,
  onToggleExpand
}) => {
  return (
    <Box
      sx={{
        height: `${height}px`,
        width: '100%',
        backgroundColor: '#000000',
        borderBottom: '1px solid #00f5ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 0.75,
        transition: 'height 0.3s ease',
        fontFamily: "'Aldrich', 'Courier New', monospace"
      }}
    >
      {/* Left Section - Status */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Terminal size={16} color="#00f5ff" />
        <Typography variant="body2" sx={{ 
          color: '#ffffff',
          fontFamily: "'Aldrich', monospace",
          fontSize: '0.7rem',
          letterSpacing: '0.05em'
        }}>
          NETRUNNER_v3.0.0
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Activity size={14} color="#00ff88" />
          <Typography variant="body2" sx={{ 
            color: '#00ff88',
            fontFamily: "'Courier New', monospace",
            fontSize: '0.65rem'
          }}>
            ONLINE
          </Typography>
        </Box>
      </Box>

      {/* Right Section - Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title={isExpanded ? "Collapse" : "Expand"}>
          <IconButton
            onClick={onToggleExpand}
            size="small"
            sx={{ 
              color: '#ffffff',
              p: 0.25,
              '&:hover': { color: '#00f5ff' }
            }}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Expanded Content */}
      {isExpanded && (
        <Box
          sx={{
            position: 'absolute',
            top: 48,
            left: 0,
            right: 0,
            height: height - 48,
            backgroundColor: '#111111',
            borderBottom: '1px solid #333333',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Typography variant="h6" sx={{ color: '#ffffff' }}>
            System Status
          </Typography>
          <Box sx={{ color: '#aaaaaa' }}>
            <Typography variant="body2">
              Status dashboard content will be implemented here.
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default NetRunnerTopBar;
