/**
 * NetRunner Bottom Bar - Quick Status & Controls
 * 
 * Clean bottom status bar for quick information and controls.
 * Ready for real system integration.
 * 
 * @author GitHub Copilot
 * @date July 12, 2025
 */

import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  ChevronUp,
  ChevronDown,
  Activity,
  Wifi,
  Shield
} from 'lucide-react';

interface NetRunnerBottomBarProps {
  open: boolean;
  height: number;
  onToggle: () => void;
}

const NetRunnerBottomBar: React.FC<NetRunnerBottomBarProps> = ({
  open,
  height,
  onToggle
}) => {
  return (
    <Box
      sx={{
        height: `${height}px`,
        width: '100%',
        backgroundColor: '#111111',
        borderTop: '1px solid #333333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        transition: 'height 0.3s ease'
      }}
    >
      {/* Left Section - Status */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Activity size={16} color="#00ff88" />
          <Typography variant="caption" sx={{ color: '#00ff88' }}>
            System Active
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Wifi size={16} color="#00f5ff" />
          <Typography variant="caption" sx={{ color: '#00f5ff' }}>
            Connected
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Shield size={16} color="#ffaa00" />
          <Typography variant="caption" sx={{ color: '#ffaa00' }}>
            Secure Mode
          </Typography>
        </Box>
      </Box>

      {/* Center Section - Additional Info when expanded */}
      {open && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label="3 Active Tasks"
            size="small"
            sx={{
              backgroundColor: 'rgba(0, 245, 255, 0.2)',
              color: '#00f5ff',
              fontSize: '0.75rem'
            }}
          />
          <Chip
            label="API: 127/1000"
            size="small"
            sx={{
              backgroundColor: 'rgba(0, 255, 136, 0.2)',
              color: '#00ff88',
              fontSize: '0.75rem'
            }}
          />
        </Box>
      )}

      {/* Right Section - Toggle Control */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
          {new Date().toLocaleTimeString()}
        </Typography>
        <Tooltip title={open ? "Collapse" : "Expand"}>
          <IconButton
            onClick={onToggle}
            size="small"
            sx={{ color: '#ffffff' }}
          >
            {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Expanded Content */}
      {open && height > 50 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 32,
            left: 0,
            right: 0,
            height: height - 32,
            backgroundColor: '#111111',
            borderTop: '1px solid #333333',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#ffffff' }}>
            Extended Status Panel
          </Typography>
          <Box sx={{ color: '#aaaaaa' }}>
            <Typography variant="body2">
              Detailed status information and controls will be implemented here.
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default NetRunnerBottomBar;
