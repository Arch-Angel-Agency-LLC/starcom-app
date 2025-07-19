/**
 * NetRunner Left Sidebar - Tools & Navigation
 * 
 * Clean sidebar for tool access and navigation with prominent AI Agent.
 * Ready for real tool integration.
 * 
 * @author GitHub Copilot
 * @date July 12, 2025
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Brain,
  Activity,
  FileText,
  Wrench,
  GitBranch,
  Play
} from 'lucide-react';

// Import NetRunner PowerTools
import { netRunnerPowerTools } from '../../tools/NetRunnerPowerTools';

// Import Scripts Engine
import { NetRunnerScriptsUIService, UIEventData } from '../../scripts/engine/NetRunnerScriptsUIService';
import { ScriptDefinition } from '../../scripts/types/ScriptTypes';

interface NetRunnerLeftSideBarProps {
  open: boolean;
  width: number;
}

const NetRunnerLeftSideBar: React.FC<NetRunnerLeftSideBarProps> = ({
  open,
  width
}) => {
  // State for managing tab selection and PowerTools
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPowerTools, setSelectedPowerTools] = useState<string[]>([]);
  
  // Scripts Engine state
  const [scriptsService] = useState(() => NetRunnerScriptsUIService.getInstance());
  const [_availableScripts, setAvailableScripts] = useState<ScriptDefinition[]>([]);
  const [executingScripts, setExecutingScripts] = useState<Set<string>>(new Set());

  // Initialize Scripts Engine
  useEffect(() => {
    const updateScriptsState = () => {
      const uiState = scriptsService.getUIState();
      setAvailableScripts(uiState.availableScripts);
      setExecutingScripts(uiState.executingScripts);
    };

    // Initial load
    updateScriptsState();

    // Listen for script execution events
    const handleExecutionStarted = (data: UIEventData) => {
      if (data.scriptId) {
        setExecutingScripts(prev => new Set([...prev, data.scriptId!]));
      }
    };

    const handleExecutionCompleted = (data: UIEventData) => {
      if (data.scriptId) {
        setExecutingScripts(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.scriptId!);
          return newSet;
        });
      }
    };

    scriptsService.addEventListener('execution-started', handleExecutionStarted);
    scriptsService.addEventListener('execution-completed', handleExecutionCompleted);
    scriptsService.addEventListener('execution-failed', handleExecutionCompleted);

    return () => {
      scriptsService.removeEventListener('execution-started', handleExecutionStarted);
      scriptsService.removeEventListener('execution-completed', handleExecutionCompleted);
      scriptsService.removeEventListener('execution-failed', handleExecutionCompleted);
    };
  }, [scriptsService]);

  // Get default scripts for display
  const defaultScripts = scriptsService.getDefaultScripts();

  // Handle script execution
  const handleExecuteScript = async (scriptId: string, scriptName: string) => {
    console.log(`[NetRunnerSidebar] Executing script: ${scriptName} (${scriptId})`);
    
    // For now, create mock OSINT data
    // In real implementation, this would come from the active scan
    const mockOSINTData = {
      emails: ['test@example.com'],
      socialMedia: ['@example'],
      technologies: [{ name: 'nginx', category: 'framework' as const, confidence: 0.9 }],
      serverInfo: ['nginx/1.18.0'],
      subdomains: ['www.example.com'],
      certificates: [],
      dns: []
    };

    try {
      const result = await scriptsService.executeScript({
        scriptId,
        targetUrl: 'https://example.com',
        osintData: mockOSINTData,
        configuration: {}
      });

      if (result.success) {
        console.log(`[NetRunnerSidebar] Script executed successfully: ${scriptName}`);
      } else {
        console.error(`[NetRunnerSidebar] Script execution failed: ${scriptName}`, result.error);
      }
    } catch (error) {
      console.error(`[NetRunnerSidebar] Script execution error: ${scriptName}`, error);
    }
  };

  // Calculate AI Agent square size based on sidebar width
  const aiAgentSize = open ? Math.min(width - 32, 200) : 40;

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
      </Box>      {/* Scripts & PowerTools Section */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Section Header */}
        {open && (
          <Box sx={{ p: 1, borderBottom: '1px solid #00f5ff' }}>
            <Typography
              variant="caption"
              sx={{
                color: '#00f5ff',
                fontFamily: "'Aldrich', monospace",
                fontSize: '0.65rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                mb: 0.25
              }}
            >
              INTEL_PIPELINE
            </Typography>
          </Box>
        )}

        {/* Tabs */}
        {open && (
          <Box sx={{ borderBottom: '1px solid #333333' }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                minHeight: '28px',
                '& .MuiTab-root': {
                  color: '#aaaaaa',
                  fontSize: '0.6rem',
                  minHeight: '28px',
                  textTransform: 'uppercase',
                  fontFamily: "'Aldrich', monospace",
                  letterSpacing: '0.05em',
                  py: 0.25,
                  px: 0.75,
                  minWidth: 'auto'
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
                label="SCRIPTS" 
                icon={<FileText size={10} />} 
                iconPosition="start"
                sx={{ gap: 0.5 }}
              />
              <Tab 
                label="TOOLS" 
                icon={<Wrench size={10} />} 
                iconPosition="start"
                sx={{ gap: 0.5 }}
              />
              <Tab 
                label="FLOWS" 
                icon={<GitBranch size={10} />} 
                iconPosition="start"
                sx={{ gap: 0.5 }}
              />
            </Tabs>
          </Box>
        )}

        {/* Tab Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {/* Scripts Tab */}
          {(!open || activeTab === 0) && (
            <Box sx={{ p: open ? 1 : 0.5, height: '100%' }}>
              {open ? (
                <Box>
                  <Typography variant="caption" sx={{ color: '#aaaaaa', mb: 1, display: 'block' }}>
                    RawData → Intel Processing
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {/* Default Scripts */}
                    <Box>
                      <Typography variant="caption" sx={{ color: '#00f5ff', fontSize: '0.6rem' }}>
                        DEFAULT SCRIPTS
                      </Typography>
                      {defaultScripts.map((script) => {
                        const isExecuting = executingScripts.has(script.metadata.id);
                        const scriptDisplayName = script.metadata.name;
                        
                        return (
                          <Box
                            key={script.metadata.id}
                            onClick={() => !isExecuting && handleExecuteScript(script.metadata.id, scriptDisplayName)}
                            sx={{
                              p: 0.5,
                              backgroundColor: '#0a0a0a',
                              border: '1px solid #333333',
                              borderRadius: 0,
                              color: isExecuting ? '#ffaa00' : '#ffffff',
                              fontSize: '0.65rem',
                              cursor: isExecuting ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              '&:hover': isExecuting ? {} : {
                                borderColor: '#00f5ff',
                                backgroundColor: 'rgba(0, 245, 255, 0.1)'
                              }
                            }}
                          >
                            {isExecuting ? (
                              <CircularProgress size={10} sx={{ color: '#ffaa00' }} />
                            ) : (
                              <Play size={10} />
                            )}
                            {scriptDisplayName}
                            {isExecuting && (
                              <Typography variant="caption" sx={{ ml: 'auto', fontSize: '0.5rem', color: '#ffaa00' }}>
                                RUNNING
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                      
                      {defaultScripts.length === 0 && (
                        <Typography variant="caption" sx={{ color: '#666666', fontSize: '0.6rem', fontStyle: 'italic' }}>
                          No scripts available
                        </Typography>
                      )}
                    </Box>
                    
                    {/* Custom Scripts */}
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" sx={{ color: '#00ff88', fontSize: '0.6rem' }}>
                        CUSTOM SCRIPTS
                      </Typography>
                      <Box
                        sx={{
                          p: 0.5,
                          backgroundColor: '#0a0a0a',
                          border: '1px dashed #333333',
                          borderRadius: 0,
                          color: '#aaaaaa',
                          fontSize: '0.65rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                          '&:hover': {
                            borderColor: '#00ff88',
                            backgroundColor: 'rgba(0, 255, 136, 0.1)'
                          }
                        }}
                      >
                        + Add Custom Script
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  <Tooltip title="Scripts" placement="right">
                    <IconButton
                      sx={{
                        width: 28,
                        height: 28,
                        backgroundColor: activeTab === 0 ? 'rgba(0, 245, 255, 0.15)' : '#0a0a0a',
                        border: '1px solid',
                        borderColor: activeTab === 0 ? '#00f5ff' : '#333333',
                        borderRadius: 0,
                        color: activeTab === 0 ? '#00f5ff' : '#ffffff'
                      }}
                      onClick={() => setActiveTab(0)}
                    >
                      <FileText size={14} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          )}

          {/* Tools Tab */}
          {open && activeTab === 1 && (
            <Box sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Compact PowerTools List */}
              <Box sx={{ p: 1, borderBottom: '1px solid #333333' }}>
                <Typography variant="caption" sx={{ color: '#aaaaaa', fontSize: '0.6rem' }}>
                  OSINT POWERTOOLS
                </Typography>
              </Box>
              
              <Box sx={{ flex: 1, overflow: 'auto', p: 0.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {netRunnerPowerTools.slice(0, 8).map((tool) => (
                    <Box
                      key={tool.id}
                      onClick={() => {
                        setSelectedPowerTools(prev => 
                          prev.includes(tool.id) 
                            ? prev.filter(id => id !== tool.id)
                            : [...prev, tool.id]
                        );
                      }}
                      sx={{
                        p: 0.75,
                        backgroundColor: selectedPowerTools.includes(tool.id) ? 'rgba(0, 245, 255, 0.15)' : '#0a0a0a',
                        border: '1px solid',
                        borderColor: selectedPowerTools.includes(tool.id) ? '#00f5ff' : '#333333',
                        borderRadius: 0,
                        color: selectedPowerTools.includes(tool.id) ? '#00f5ff' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.25,
                        '&:hover': {
                          borderColor: '#00f5ff',
                          backgroundColor: 'rgba(0, 245, 255, 0.1)'
                        }
                      }}
                    >
                      <Typography variant="caption" sx={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 'bold',
                        color: 'inherit',
                        fontFamily: "'Aldrich', monospace"
                      }}>
                        {tool.name}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        fontSize: '0.55rem', 
                        color: '#aaaaaa',
                        lineHeight: 1.2
                      }}>
                        {tool.description.slice(0, 60)}...
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.25, mt: 0.25 }}>
                        <Typography variant="caption" sx={{ 
                          fontSize: '0.5rem', 
                          color: tool.premium ? '#ffaa00' : '#00ff88',
                          textTransform: 'uppercase'
                        }}>
                          {tool.premium ? 'Premium' : 'Free'}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          fontSize: '0.5rem', 
                          color: '#666666',
                          textTransform: 'uppercase'
                        }}>
                          {tool.category}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  
                  {/* Show More Button */}
                  <Box
                    sx={{
                      p: 0.5,
                      backgroundColor: '#0a0a0a',
                      border: '1px dashed #333333',
                      borderRadius: 0,
                      color: '#aaaaaa',
                      fontSize: '0.65rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      '&:hover': {
                        borderColor: '#00f5ff',
                        backgroundColor: 'rgba(0, 245, 255, 0.1)'
                      }
                    }}
                  >
                    + Show More Tools ({netRunnerPowerTools.length - 8} more)
                  </Box>
                </Box>
              </Box>
              
              {/* Selected Tools Summary */}
              {selectedPowerTools.length > 0 && (
                <Box sx={{ p: 0.75, borderTop: '1px solid #00f5ff', backgroundColor: '#0a0a0a' }}>
                  <Typography variant="caption" sx={{ 
                    color: '#00f5ff', 
                    fontSize: '0.6rem',
                    display: 'block',
                    mb: 0.5
                  }}>
                    SELECTED: {selectedPowerTools.length}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.25, flexWrap: 'wrap' }}>
                    {selectedPowerTools.slice(0, 3).map((toolId) => {
                      const tool = netRunnerPowerTools.find(t => t.id === toolId);
                      return tool ? (
                        <Typography key={toolId} variant="caption" sx={{ 
                          fontSize: '0.55rem', 
                          color: '#ffffff',
                          backgroundColor: 'rgba(0, 245, 255, 0.2)',
                          px: 0.5,
                          py: 0.25,
                          borderRadius: 0
                        }}>
                          {tool.name.split(' ')[0]}
                        </Typography>
                      ) : null;
                    })}
                    {selectedPowerTools.length > 3 && (
                      <Typography variant="caption" sx={{ 
                        fontSize: '0.55rem', 
                        color: '#aaaaaa'
                      }}>
                        +{selectedPowerTools.length - 3}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Workflows Tab */}
          {open && activeTab === 2 && (
            <Box sx={{ p: 1, height: '100%' }}>
              <Typography variant="caption" sx={{ color: '#aaaaaa', mb: 1, display: 'block' }}>
                Automated Tool → Script → Intel Pipelines
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {['Domain Intel Pipeline', 'Email Harvesting Flow', 'Threat Assessment Workflow', 'Infrastructure Mapping'].map((workflow) => (
                  <Box
                    key={workflow}
                    sx={{
                      p: 0.5,
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #333333',
                      borderRadius: 0,
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: '#00f5ff',
                        backgroundColor: 'rgba(0, 245, 255, 0.1)'
                      }
                    }}
                  >
                    {workflow}
                  </Box>
                ))}
                
                <Box
                  sx={{
                    p: 0.5,
                    backgroundColor: '#0a0a0a',
                    border: '1px dashed #333333',
                    borderRadius: 0,
                    color: '#aaaaaa',
                    fontSize: '0.65rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    mt: 1,
                    '&:hover': {
                      borderColor: '#00ff88',
                      backgroundColor: 'rgba(0, 255, 136, 0.1)'
                    }
                  }}
                >
                  + Create Workflow
                </Box>
              </Box>
            </Box>
          )}

          {/* Collapsed Tools Icons */}
          {!open && (
            <Box sx={{ p: 0.25 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <Tooltip title="Tools" placement="right">
                  <IconButton
                    sx={{
                      width: 28,
                      height: 28,
                      backgroundColor: activeTab === 1 ? 'rgba(0, 245, 255, 0.15)' : '#0a0a0a',
                      border: '1px solid',
                      borderColor: activeTab === 1 ? '#00f5ff' : '#333333',
                      borderRadius: 0,
                      color: activeTab === 1 ? '#00f5ff' : '#ffffff'
                    }}
                    onClick={() => setActiveTab(1)}
                  >
                    <Wrench size={14} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Workflows" placement="right">
                  <IconButton
                    sx={{
                      width: 28,
                      height: 28,
                      backgroundColor: activeTab === 2 ? 'rgba(0, 245, 255, 0.15)' : '#0a0a0a',
                      border: '1px solid',
                      borderColor: activeTab === 2 ? '#00f5ff' : '#333333',
                      borderRadius: 0,
                      color: activeTab === 2 ? '#00f5ff' : '#ffffff'
                    }}
                    onClick={() => setActiveTab(2)}
                  >
                    <GitBranch size={14} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default NetRunnerLeftSideBar;
