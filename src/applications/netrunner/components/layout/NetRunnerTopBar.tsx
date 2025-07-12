/**
 * NetRunner Top Bar - Real-time Debug Logs
 * 
 * Displays real-time debug logs and system status.
 * Expandable to full screen for detailed log analysis.
 * 
 * @author GitHub Copilot
 * @date July 11, 2025
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source: string;
}

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
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Mock real-time logs
  useEffect(() => {
    const generateLog = () => {
      const sources = ['ShodanAdapter', 'CensysAdapter', 'VirusTotalAdapter', 'NetRunnerEngine', 'WorkflowScheduler'];
      const levels: LogEntry['level'][] = ['info', 'warning', 'error', 'success'];
      const messages = [
        'Scanning IP range 192.168.1.0/24',
        'API rate limit approaching',
        'Failed to connect to target',
        'Domain scan completed successfully',
        'Vulnerability detected: CVE-2023-1234',
        'Bot deployment successful',
        'Workflow execution started',
        'Data extraction complete'
      ];

      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        level: levels[Math.floor(Math.random() * levels.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        source: sources[Math.floor(Math.random() * sources.length)]
      };

      setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50 logs
    };

    const interval = setInterval(generateLog, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return <XCircle size={16} color="#ff4444" />;
      case 'warning': return <AlertCircle size={16} color="#ffaa00" />;
      case 'success': return <CheckCircle size={16} color="#00ff88" />;
      default: return <Activity size={16} color="#00f5ff" />;
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return '#ff4444';
      case 'warning': return '#ffaa00';
      case 'success': return '#00ff88';
      default: return '#00f5ff';
    }
  };

  return (
    <Box
      sx={{
        height: isExpanded ? '100vh' : height,
        width: '100%',
        backgroundColor: '#0a0a0a',
        border: '1px solid #333',
        borderRadius: isExpanded ? 0 : '8px',
        position: isExpanded ? 'fixed' : 'relative',
        top: isExpanded ? 0 : 'auto',
        left: isExpanded ? 0 : 'auto',
        zIndex: isExpanded ? 9999 : 1,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: '1px solid #333',
          backgroundColor: '#111'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Terminal size={18} color="#00f5ff" />
          <Typography
            variant="h6"
            sx={{
              color: '#00f5ff',
              fontFamily: 'monospace',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            NetRunner Debug Console
          </Typography>
        </Box>
        
        <Tooltip title={isExpanded ? "Minimize" : "Expand to Full Screen"}>
          <IconButton
            onClick={onToggleExpand}
            sx={{
              color: '#00f5ff',
              '&:hover': { backgroundColor: 'rgba(0, 245, 255, 0.1)' }
            }}
          >
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Logs Container */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          padding: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          backgroundColor: '#0a0a0a'
        }}
      >
        {logs.map((log) => (
          <Box
            key={log.id}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              marginBottom: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              '&:hover': { backgroundColor: 'rgba(0, 245, 255, 0.05)' }
            }}
          >
            {getLogIcon(log.level)}
            <Typography
              component="span"
              sx={{
                color: '#666',
                minWidth: '80px',
                fontSize: '11px'
              }}
            >
              {log.timestamp.toLocaleTimeString()}
            </Typography>
            <Typography
              component="span"
              sx={{
                color: getLogColor(log.level),
                minWidth: '100px',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              [{log.source}]
            </Typography>
            <Typography
              component="span"
              sx={{
                color: '#ccc',
                flex: 1,
                fontSize: '11px'
              }}
            >
              {log.message}
            </Typography>
          </Box>
        ))}
        <div ref={logsEndRef} />
      </Box>
    </Box>
  );
};

export default NetRunnerTopBar;


