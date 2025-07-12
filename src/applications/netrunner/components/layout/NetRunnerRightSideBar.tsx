/**
 * NetRunner Right Sidebar - PowerTools and Scripts
 * 
 * PowerTools and Scripts management interface with controls for adding new ones.
 * Provides a toolkit for custom tools, scripts, and automation capabilities.
 * 
 * @author GitHub Copilot
 * @date July 11, 2025
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import {
  Play,
  Plus,
  Edit,
  ChevronDown,
  Zap,
  Settings,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Cog,
  Target,
  Shield
} from 'lucide-react';

interface NetRunnerRightSideBarProps {
  open: boolean;
  width: number;
  onToggle: () => void;
}

interface PowerTool {
  id: string;
  name: string;
  description: string;
  category: 'scanner' | 'analyzer' | 'extractor' | 'monitor' | 'custom';
  icon: React.ComponentType;
  status: 'idle' | 'running' | 'completed' | 'error';
  lastRun?: Date;
  duration?: number;
  author: string;
  version: string;
  parameters: ToolParameter[];
}

interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required: boolean;
  default?: unknown;
  options?: string[];
  description: string;
}

interface CustomScript {
  id: string;
  name: string;
  description: string;
  language: 'python' | 'javascript' | 'bash' | 'powershell';
  content: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  lastRun?: Date;
  output?: string;
  author: string;
  tags: string[];
}

const NetRunnerRightSideBar: React.FC<NetRunnerRightSideBarProps> = ({
  open,
  width,
  onToggle
}) => {
  const [powerTools, setPowerTools] = useState<PowerTool[]>([
    {
      id: 'nmap-scanner',
      name: 'Nmap Port Scanner',
      description: 'Advanced network port scanning and service detection',
      category: 'scanner',
      icon: Target,
      status: 'idle',
      author: 'NetRunner Team',
      version: '1.2.0',
      parameters: [
        { name: 'target', type: 'string', required: true, description: 'Target IP or hostname' },
        { name: 'ports', type: 'string', required: false, default: '1-1000', description: 'Port range to scan' },
        { name: 'aggressive', type: 'boolean', required: false, default: false, description: 'Enable aggressive scanning' }
      ]
    },
    {
      id: 'ssl-analyzer',
      name: 'SSL Certificate Analyzer',
      description: 'Analyzes SSL certificates and security configurations',
      category: 'analyzer',
      icon: Shield,
      status: 'running',
      lastRun: new Date(),
      duration: 45000,
      author: 'Security Team',
      version: '2.1.3',
      parameters: [
        { name: 'hostname', type: 'string', required: true, description: 'Target hostname' },
        { name: 'port', type: 'number', required: false, default: 443, description: 'SSL port' }
      ]
    },
    {
      id: 'domain-extractor',
      name: 'Domain Intelligence Extractor',
      description: 'Extracts comprehensive domain intelligence and metadata',
      category: 'extractor',
      icon: Zap,
      status: 'completed',
      lastRun: new Date(Date.now() - 300000),
      duration: 120000,
      author: 'OSINT Team',
      version: '3.0.1',
      parameters: [
        { name: 'domain', type: 'string', required: true, description: 'Target domain' },
        { name: 'depth', type: 'select', required: false, default: 'medium', options: ['shallow', 'medium', 'deep'], description: 'Scan depth' }
      ]
    }
  ]);

  const [customScripts, setCustomScripts] = useState<CustomScript[]>([
    {
      id: 'social-media-osint',
      name: 'Social Media OSINT',
      description: 'Automated social media profile discovery and analysis',
      language: 'python',
      content: `#!/usr/bin/env python3
import requests
import json
from datetime import datetime

def search_social_profiles(username):
    platforms = ['twitter', 'linkedin', 'github', 'instagram']
    results = {}
    
    for platform in platforms:
        # Platform-specific search logic
        url = f"https://api.{platform}.com/users/{username}"
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                results[platform] = response.json()
        except Exception as e:
            results[platform] = {"error": str(e)}
    
    return results

if __name__ == "__main__":
    target = input("Enter username: ")
    profiles = search_social_profiles(target)
    print(json.dumps(profiles, indent=2))`,
      status: 'idle',
      author: 'OSINT Specialist',
      tags: ['social-media', 'osint', 'automation']
    },
    {
      id: 'vulnerability-reporter',
      name: 'Vulnerability Report Generator',
      description: 'Generates comprehensive vulnerability reports in multiple formats',
      language: 'javascript',
      content: `const fs = require('fs');
const path = require('path');

class VulnerabilityReporter {
    constructor(scanData) {
        this.scanData = scanData;
        this.reportData = {
            timestamp: new Date().toISOString(),
            summary: {},
            vulnerabilities: [],
            recommendations: []
        };
    }

    generateReport() {
        this.analyzeScanData();
        this.generateSummary();
        this.generateRecommendations();
        return this.reportData;
    }

    analyzeScanData() {
        // Process scan data and extract vulnerabilities
        this.scanData.forEach(item => {
            if (item.severity) {
                this.reportData.vulnerabilities.push({
                    id: item.id,
                    title: item.title,
                    severity: item.severity,
                    description: item.description,
                    impact: this.calculateImpact(item.severity)
                });
            }
        });
    }

    calculateImpact(severity) {
        const impacts = {
            critical: 10,
            high: 8,
            medium: 5,
            low: 2,
            info: 1
        };
        return impacts[severity] || 0;
    }
}

module.exports = VulnerabilityReporter;`,
      status: 'idle',
      author: 'Security Engineer',
      tags: ['reporting', 'vulnerability', 'automation']
    }
  ]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'scanner': return '#00f5ff';
      case 'analyzer': return '#8b5cf6';
      case 'extractor': return '#ffaa00';
      case 'monitor': return '#00ff88';
      case 'custom': return '#ff8c00';
      default: return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#00ff88';
      case 'completed': return '#8b5cf6';
      case 'error': return '#ff4444';
      case 'idle': return '#666';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      case 'error': return <AlertCircle size={14} />;
      case 'idle': return <Clock size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getLanguageIcon = (language: string) => {
    switch (language) {
      case 'python': return '🐍';
      case 'javascript': return '📜';
      case 'bash': return '🐚';
      case 'powershell': return '💙';
      default: return '📄';
    }
  };

  const handleRunTool = useCallback((toolId: string) => {
    setPowerTools(prev => prev.map(tool => 
      tool.id === toolId 
        ? { ...tool, status: 'running', lastRun: new Date() }
        : tool
    ));

    // Simulate tool execution
    setTimeout(() => {
      setPowerTools(prev => prev.map(tool => 
        tool.id === toolId 
          ? { ...tool, status: 'completed', duration: Math.random() * 180000 + 30000 }
          : tool
      ));
    }, 5000 + Math.random() * 10000);
  }, []);

  const handleRunScript = useCallback((scriptId: string) => {
    setCustomScripts(prev => prev.map(script => 
      script.id === scriptId 
        ? { 
            ...script, 
            status: 'running', 
            lastRun: new Date(),
            output: 'Script execution started...\n'
          }
        : script
    ));

    // Simulate script execution
    setTimeout(() => {
      setCustomScripts(prev => prev.map(script => 
        script.id === scriptId 
          ? { 
              ...script, 
              status: 'completed',
              output: 'Script execution completed successfully.\nResults have been saved to output directory.'
            }
          : script
      ));
    }, 3000 + Math.random() * 7000);
  }, []);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  if (!open) {
    return (
      <Box
        sx={{
          width: 60,
          height: '100vh',
          backgroundColor: '#000000',
          backgroundImage: `
            linear-gradient(135deg, rgba(255, 170, 0, 0.1) 0%, transparent 70%),
            radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)
          `,
          borderLeft: `2px solid rgba(255, 170, 0, 0.6)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 2,
          position: 'relative',
          boxShadow: `
            inset 2px 0 15px rgba(255, 170, 0, 0.2),
            -5px 0 20px rgba(0, 0, 0, 0.6)
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
                transparent 10px,
                rgba(255, 170, 0, 0.03) 10px,
                rgba(255, 170, 0, 0.03) 20px
              )
            `,
            pointerEvents: 'none'
          }
        }}
      >
        <Tooltip title="PowerTools & Scripts">
          <IconButton
            onClick={onToggle}
            sx={{ 
              color: '#ffaa00',
              mb: 2,
              border: '2px solid #ffaa00',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 170, 0, 0.1)',
              boxShadow: '0 0 15px rgba(255, 170, 0, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 170, 0, 0.2)',
                boxShadow: '0 0 25px rgba(255, 170, 0, 0.5)',
                transform: 'scale(1.05)'
              }
            }}
          >
            <Cog />
          </IconButton>
        </Tooltip>

        {/* Activity indicators */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {powerTools.filter(tool => tool.status === 'running').length > 0 && (
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#00ff88',
                border: '2px solid rgba(0, 255, 136, 0.5)',
                boxShadow: '0 0 15px rgba(0, 255, 136, 0.6)',
                animation: 'pulse 1.5s infinite',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  animation: 'pulse 0.8s infinite'
                }
              }}
            />
          )}
          {customScripts.filter(script => script.status === 'running').length > 0 && (
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#ffaa00',
                border: '2px solid rgba(255, 170, 0, 0.5)',
                boxShadow: '0 0 15px rgba(255, 170, 0, 0.6)',
                animation: 'pulse 1.5s infinite',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  animation: 'pulse 0.8s infinite'
                }
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
          linear-gradient(225deg, rgba(255, 170, 0, 0.04) 0%, transparent 50%),
          radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 40%)
        `,
        borderLeft: `2px solid transparent`,
        borderImage: `linear-gradient(180deg, 
          rgba(255, 170, 0, 0.8) 0%, 
          rgba(139, 92, 246, 0.6) 50%, 
          rgba(0, 245, 255, 0.4) 100%
        ) 1`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: `
          inset 2px 0 8px rgba(255, 170, 0, 0.15),
          -2px 0 20px rgba(0, 0, 0, 0.5)
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
              270deg,
              transparent,
              transparent 1px,
              rgba(255, 170, 0, 0.02) 1px,
              rgba(255, 170, 0, 0.02) 2px
            )
          `,
          pointerEvents: 'none',
          zIndex: 1
        },
        // Add keyframe animations
        '@keyframes pulse': {
          '0%': {
            opacity: 0.4,
          },
          '50%': {
            opacity: 1,
          },
          '100%': {
            opacity: 0.4,
          },
        },
        '@keyframes dataStream': {
          '0%': {
            transform: 'translateX(-100%)',
          },
          '100%': {
            transform: 'translateX(100%)',
          },
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          padding: 2,
          borderBottom: `2px solid rgba(255, 170, 0, 0.4)`,
          backgroundColor: 'rgba(255, 170, 0, 0.08)',
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 2px 15px rgba(0, 0, 0, 0.4)'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#ffaa00',
            fontFamily: '"Orbitron", monospace',
            fontSize: '16px',
            fontWeight: 900,
            textAlign: 'center',
            textShadow: '0 0 15px rgba(255, 170, 0, 0.6)',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}
        >
          ▓█ POWERTOOLS & SCRIPTS █▓
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 170, 0, 0.9)',
            display: 'block',
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '1px',
            marginTop: '4px',
            textShadow: '0 0 8px rgba(255, 170, 0, 0.4)'
          }}
        >
          ▓ AUTOMATION TOOLKIT ▓
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* PowerTools Section */}
        <Box sx={{ padding: 2, borderBottom: '1px solid #333' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography
              variant="h6"
              sx={{
                color: '#8b5cf6',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              POWERTOOLS ({powerTools.length})
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
              Add
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {powerTools.map((tool) => {
              const IconComponent = tool.icon;
              
              return (
                <Card
                  key={tool.id}
                  sx={{
                    backgroundColor: '#000000',
                    border: `2px solid ${getCategoryColor(tool.category)}`,
                    borderRadius: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `
                      0 0 20px ${getCategoryColor(tool.category)}40,
                      inset 0 0 20px rgba(0, 0, 0, 0.8),
                      0 4px 15px rgba(0, 0, 0, 0.6)
                    `,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `
                        0 0 30px ${getCategoryColor(tool.category)}60,
                        inset 0 0 20px rgba(0, 0, 0, 0.8),
                        0 8px 25px rgba(0, 0, 0, 0.8)
                      `,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `
                        linear-gradient(135deg, 
                          transparent 30%, 
                          ${getCategoryColor(tool.category)}10 50%, 
                          transparent 70%
                        )
                      `,
                      opacity: tool.status === 'running' ? 1 : 0.3,
                      animation: tool.status === 'running' ? 'pulse 2s infinite' : 'none',
                      pointerEvents: 'none'
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '2px',
                      background: `linear-gradient(90deg, 
                        transparent, 
                        ${getCategoryColor(tool.category)}, 
                        transparent
                      )`,
                      animation: tool.status === 'running' ? 'dataStream 2s infinite linear' : 'none'
                    }
                  }}
                >
                  <CardContent sx={{ padding: '12px !important' }}>
                    {/* Tool Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <IconComponent 
                        size={14} 
                        color={getCategoryColor(tool.category)} 
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#ccc',
                          fontSize: '13px',
                          fontWeight: 600,
                          flex: 1
                        }}
                      >
                        {tool.name}
                      </Typography>
                      <Chip
                        label={tool.category}
                        size="small"
                        sx={{
                          backgroundColor: `${getCategoryColor(tool.category)}20`,
                          color: getCategoryColor(tool.category),
                          fontSize: '8px',
                          height: '16px'
                        }}
                      />
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
                      {tool.description}
                    </Typography>

                    {/* Status and Controls */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getStatusIcon(tool.status)}
                        <Typography
                          variant="caption"
                          sx={{
                            color: getStatusColor(tool.status),
                            fontSize: '10px',
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}
                        >
                          {tool.status}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Run Tool">
                          <IconButton
                            size="small"
                            onClick={() => handleRunTool(tool.id)}
                            disabled={tool.status === 'running'}
                            sx={{
                              color: '#00ff88',
                              backgroundColor: 'rgba(0, 255, 136, 0.1)',
                              border: '1px solid rgba(0, 255, 136, 0.3)',
                              borderRadius: '6px',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 255, 136, 0.2)',
                                boxShadow: '0 0 15px rgba(0, 255, 136, 0.4)',
                                transform: 'scale(1.05)'
                              },
                              '&:disabled': { 
                                opacity: 0.3,
                                backgroundColor: 'rgba(100, 100, 100, 0.1)',
                                border: '1px solid rgba(100, 100, 100, 0.3)'
                              }
                            }}
                          >
                            <Play size={10} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Configure">
                          <IconButton
                            size="small"
                            sx={{ 
                              color: '#00f5ff',
                              backgroundColor: 'rgba(0, 245, 255, 0.1)',
                              border: '1px solid rgba(0, 245, 255, 0.3)',
                              borderRadius: '6px',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 245, 255, 0.2)',
                                boxShadow: '0 0 15px rgba(0, 245, 255, 0.4)',
                                transform: 'scale(1.05)'
                              }
                            }}
                          >
                            <Settings size={10} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Progress Bar for Running Tools */}
                    {tool.status === 'running' && (
                      <LinearProgress
                        sx={{
                          height: 3,
                          borderRadius: 1.5,
                          backgroundColor: '#333',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#00ff88',
                            borderRadius: 1.5
                          }
                        }}
                      />
                    )}

                    {/* Tool Metadata */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="caption" sx={{ color: '#666', fontSize: '9px' }}>
                        v{tool.version}
                      </Typography>
                      {tool.lastRun && tool.duration && (
                        <Typography variant="caption" sx={{ color: '#666', fontSize: '9px' }}>
                          {formatDuration(tool.duration)}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>

        {/* Custom Scripts Section */}
        <Box sx={{ padding: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography
              variant="h6"
              sx={{
                color: '#ffaa00',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              CUSTOM SCRIPTS ({customScripts.length})
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Plus size={12} />}
              sx={{
                borderColor: '#ffaa00',
                color: '#ffaa00',
                fontSize: '10px',
                minWidth: 'auto',
                padding: '4px 8px',
                '&:hover': {
                  borderColor: '#ffc107',
                  backgroundColor: 'rgba(255, 170, 0, 0.1)'
                }
              }}
            >
              Add
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {customScripts.map((script) => (
              <Accordion
                key={script.id}
                sx={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #ffaa00',
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary
                  expandIcon={<ChevronDown style={{ color: '#ffaa00', width: 14, height: 14 }} />}
                  sx={{ padding: '6px 12px', minHeight: 'auto' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Typography sx={{ fontSize: '14px' }}>
                      {getLanguageIcon(script.language)}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#ccc',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        {script.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#666',
                          fontSize: '9px'
                        }}
                      >
                        {script.language}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getStatusIcon(script.status)}
                      <Typography
                        variant="caption"
                        sx={{
                          color: getStatusColor(script.status),
                          fontSize: '8px',
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}
                      >
                        {script.status}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ padding: '0 12px 12px' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#b0b0b0',
                      fontSize: '11px',
                      mb: 1
                    }}
                  >
                    {script.description}
                  </Typography>

                  {/* Script Tags */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {script.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255, 170, 0, 0.2)',
                          color: '#ffaa00',
                          fontSize: '8px',
                          height: '16px'
                        }}
                      />
                    ))}
                  </Box>

                  {/* Script Controls */}
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Play size={10} />}
                      onClick={() => handleRunScript(script.id)}
                      disabled={script.status === 'running'}
                      sx={{
                        backgroundColor: '#00ff88',
                        background: 'linear-gradient(45deg, #00ff88 0%, #00e676 100%)',
                        color: '#000',
                        fontSize: '10px',
                        minHeight: '28px',
                        padding: '4px 12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        border: '1px solid rgba(0, 255, 136, 0.5)',
                        boxShadow: '0 0 10px rgba(0, 255, 136, 0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          backgroundColor: '#00e676',
                          background: 'linear-gradient(45deg, #00e676 0%, #00ff88 100%)',
                          boxShadow: '0 0 20px rgba(0, 255, 136, 0.6)',
                          transform: 'translateY(-1px)'
                        },
                        '&:disabled': { 
                          backgroundColor: '#333', 
                          background: 'linear-gradient(45deg, #333 0%, #444 100%)',
                          color: '#666',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      ▶ Execute
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Edit size={10} />}
                      sx={{
                        borderColor: '#00f5ff',
                        color: '#00f5ff',
                        fontSize: '10px',
                        minHeight: '28px',
                        padding: '4px 12px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        backgroundColor: 'rgba(0, 245, 255, 0.05)',
                        boxShadow: '0 0 8px rgba(0, 245, 255, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          borderColor: '#00d4d4',
                          backgroundColor: 'rgba(0, 245, 255, 0.15)',
                          boxShadow: '0 0 15px rgba(0, 245, 255, 0.4)',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      ⚙ Modify
                    </Button>
                  </Box>

                  {/* Script Output */}
                  {script.output && (
                    <Box
                      sx={{
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #333',
                        borderRadius: 1,
                        padding: 1
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#666',
                          fontSize: '9px',
                          display: 'block',
                          mb: 0.5
                        }}
                      >
                        OUTPUT:
                      </Typography>
                      <Typography
                        component="pre"
                        sx={{
                          color: '#00ff88',
                          fontSize: '9px',
                          fontFamily: '"Monaco", "Menlo", monospace',
                          whiteSpace: 'pre-wrap',
                          margin: 0,
                          lineHeight: 1.2
                        }}
                      >
                        {script.output}
                      </Typography>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default NetRunnerRightSideBar;
