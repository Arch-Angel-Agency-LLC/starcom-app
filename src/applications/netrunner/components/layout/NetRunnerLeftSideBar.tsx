/**
 * NetRunner Left Sidebar
 * 
 * Main navigation and tool selection sidebar for the NetRunner Control Station.
 * Contains Power Tools, Bot Roster, and Workflow management interfaces.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Badge,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Terminal,
  Bot,
  GitBranch,
  ChevronDown,
  Play,
  Pause,
  Settings,
  Shield,
  Search,
  Globe,
  Database,
  Eye,
  Mail,
  Activity
} from 'lucide-react';

import { LoggerFactory } from '../../services/logging';

interface NetRunnerLeftSideBarProps {
  open: boolean;
  width: number;
  activeView: string;
  availableTools: string[];
  selectedTools: string[];
  onToolSelect: (toolId: string) => void;
  onToolDeselect: (toolId: string) => void;
  onToolRun: (toolId: string, params?: Record<string, unknown>) => Promise<void>;
  availableBots: unknown[];
  activeBots: string[];
  onBotActivate: (botId: string) => void;
  onBotDeactivate: (botId: string) => void;
  availableWorkflows: unknown[];
  currentWorkflow: string | null;
  onWorkflowSelect: (workflowId: string | null) => void;
  onWorkflowStart: (workflowId: string, params?: Record<string, unknown>) => Promise<void>;
  onWorkflowStop: (workflowId: string) => Promise<void>;
}

interface PowerTool {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType;
  status: 'active' | 'inactive' | 'error';
  description: string;
}

interface OSINTBot {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'stopped' | 'error';
  tasks: number;
  uptime: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'stopped' | 'completed' | 'error';
  progress: number;
}

const NetRunnerLeftSideBar: React.FC<NetRunnerLeftSideBarProps> = ({
  open,
  width,
  activeView,
  availableTools,
  selectedTools,
  onToolSelect,
  onToolDeselect,
  onToolRun,
  availableBots,
  activeBots,
  onBotActivate,
  onBotDeactivate,
  availableWorkflows,
  currentWorkflow,
  onWorkflowSelect,
  onWorkflowStart,
  onWorkflowStop
}) => {
  const logger = useMemo(() => LoggerFactory.getLogger('NetRunnerLeftSideBar'), []);
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    powertools: true,
    botroster: true,
    workflows: true
  });

  // Mock Data - Replace with actual data from services
  const powerTools: PowerTool[] = [
    { id: 'shodan', name: 'Shodan', category: 'Network Discovery', icon: Globe, status: 'active', description: 'Internet device scanner' },
    { id: 'theharvester', name: 'TheHarvester', category: 'Email Discovery', icon: Mail, status: 'active', description: 'Email and subdomain enumeration' },
    { id: 'nmap', name: 'Nmap', category: 'Network Discovery', icon: Search, status: 'inactive', description: 'Network port scanner' },
    { id: 'whois', name: 'WHOIS', category: 'Domain Intelligence', icon: Database, status: 'active', description: 'Domain registration lookup' },
    { id: 'virustotal', name: 'VirusTotal', category: 'Threat Intelligence', icon: Shield, status: 'inactive', description: 'File and URL analysis' },
    { id: 'censys', name: 'Censys', category: 'Network Discovery', icon: Eye, status: 'error', description: 'Internet scanning platform' }
  ];

  const osintBots: OSINTBot[] = [
    { id: 'bot1', name: 'Domain Monitor', type: 'Continuous', status: 'running', tasks: 15, uptime: '2h 45m' },
    { id: 'bot2', name: 'Email Harvester', type: 'Scheduled', status: 'stopped', tasks: 8, uptime: '0m' },
    { id: 'bot3', name: 'Threat Intel', type: 'Event-driven', status: 'running', tasks: 23, uptime: '6h 12m' },
    { id: 'bot4', name: 'Social Media', type: 'Continuous', status: 'error', tasks: 0, uptime: '0m' }
  ];

  const workflows: Workflow[] = [
    { id: 'wf1', name: 'Domain Investigation', description: 'Complete domain analysis workflow', status: 'running', progress: 65 },
    { id: 'wf2', name: 'Email Campaign Analysis', description: 'Email threat investigation', status: 'completed', progress: 100 },
    { id: 'wf3', name: 'IP Range Sweep', description: 'Network infrastructure mapping', status: 'stopped', progress: 0 },
    { id: 'wf4', name: 'Threat Actor Profile', description: 'Comprehensive threat profiling', status: 'error', progress: 30 }
  ];

  // Section Toggle Handler
  const handleSectionToggle = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    logger.debug('Section toggled', { section, expanded: !expandedSections[section] });
  }, [expandedSections, logger]);

  // Tool Selection Handler
  const handleToolToggle = useCallback((toolId: string) => {
    if (selectedTools.includes(toolId)) {
      onToolDeselect(toolId);
    } else {
      onToolSelect(toolId);
    }
    logger.info('Tool selection toggled', { toolId, selected: !selectedTools.includes(toolId) });
  }, [onToolSelect, onToolDeselect, selectedTools, logger]);

  // Bot Control Handler
  const handleBotToggle = useCallback((botId: string) => {
    if (activeBots.includes(botId)) {
      onBotDeactivate(botId);
    } else {
      onBotActivate(botId);
    }
    logger.info('Bot activation toggled', { botId, active: !activeBots.includes(botId) });
  }, [onBotActivate, onBotDeactivate, activeBots, logger]);

  // Workflow Selection Handler
  const handleWorkflowSelect = useCallback((workflowId: string) => {
    const newSelection = currentWorkflow === workflowId ? null : workflowId;
    onWorkflowSelect(newSelection);
    logger.info('Workflow selection changed', { workflowId, selected: newSelection !== null });
  }, [currentWorkflow, onWorkflowSelect, logger]);

  // Status Color Mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
      case 'completed':
        return '#00ff88';
      case 'inactive':
      case 'stopped':
        return '#b0b0b0';
      case 'error':
        return '#ff0066';
      default:
        return '#ff8c00';
    }
  };

  return (
    <Box
      sx={{
        width: open ? width : 0,
        height: '100%',
        backgroundColor: '#1a1a1a',
        borderRight: '1px solid #404040',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        flexShrink: 0,
        // Ensure it stays within container
        position: 'relative',
        display: open ? 'flex' : 'none',
        flexDirection: 'column'
      }}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          p: 1
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid #404040' }}>
          <Typography
            variant="h6"
            sx={{
              color: '#00f5ff',
              fontFamily: 'Aldrich, monospace',
              textAlign: 'center',
              textShadow: '0 0 10px #00f5ff'
            }}
          >
            CONTROL PANEL
          </Typography>
        </Box>

        {/* Scrollable Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {/* Power Tools Section */}
          <Accordion
            expanded={expandedSections.powertools}
            onChange={() => handleSectionToggle('powertools')}
            sx={{
              backgroundColor: 'transparent',
              boxShadow: 'none',
              '&:before': { display: 'none' }
            }}
          >
            <AccordionSummary
              expandIcon={<ChevronDown style={{ color: '#00f5ff' }} />}
              sx={{
                backgroundColor: '#2d2d2d',
                border: '1px solid #404040',
                borderRadius: 1,
                mb: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Terminal style={{ color: '#8b5cf6' }} />
                <Typography sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                  Power Tools
                </Typography>
                <Badge badgeContent={selectedTools.length} color="primary" />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List dense>
                {powerTools.map((tool) => {
                  const IconComponent = tool.icon;
                  const isSelected = selectedTools.includes(tool.id);
                  
                  return (
                    <ListItem key={tool.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleToolToggle(tool.id)}
                        sx={{
                          backgroundColor: isSelected ? 'rgba(0, 245, 255, 0.1)' : 'transparent',
                          border: isSelected ? '1px solid #00f5ff' : '1px solid transparent',
                          borderRadius: 1,
                          mb: 0.5,
                          '&:hover': {
                            backgroundColor: 'rgba(139, 92, 246, 0.1)'
                          }
                        }}
                      >
                        <ListItemIcon>
                          <IconComponent />
                        </ListItemIcon>
                        <ListItemText
                          primary={tool.name}
                          secondary={tool.category}
                          primaryTypographyProps={{
                            sx: { color: '#ffffff', fontSize: '0.9rem' }
                          }}
                          secondaryTypographyProps={{
                            sx: { color: '#b0b0b0', fontSize: '0.75rem' }
                          }}
                        />
                        <Chip
                          size="small"
                          label={tool.status}
                          sx={{
                            backgroundColor: getStatusColor(tool.status),
                            color: '#000000',
                            fontSize: '0.7rem'
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </AccordionDetails>
          </Accordion>

          {/* Bot Roster Section */}
          <Accordion
            expanded={expandedSections.botroster}
            onChange={() => handleSectionToggle('botroster')}
            sx={{
              backgroundColor: 'transparent',
              boxShadow: 'none',
              '&:before': { display: 'none' }
            }}
          >
            <AccordionSummary
              expandIcon={<ChevronDown style={{ color: '#00f5ff' }} />}
              sx={{
                backgroundColor: '#2d2d2d',
                border: '1px solid #404040',
                borderRadius: 1,
                mb: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Bot style={{ color: '#00ff88' }} />
                <Typography sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                  Bot Roster
                </Typography>
                <Badge badgeContent={activeBots.length} color="secondary" />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List dense>
                {osintBots.map((bot) => {
                  const isActive = activeBots.includes(bot.id);
                  
                  return (
                    <ListItem key={bot.id} disablePadding>
                      <ListItemButton
                        sx={{
                          backgroundColor: isActive ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                          border: isActive ? '1px solid #00ff88' : '1px solid transparent',
                          borderRadius: 1,
                          mb: 0.5,
                          '&:hover': {
                            backgroundColor: 'rgba(0, 255, 136, 0.05)'
                          }
                        }}
                      >
                        <ListItemIcon>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBotToggle(bot.id);
                              }}
                              sx={{ color: getStatusColor(bot.status) }}
                            >
                              {bot.status === 'running' ? <Pause /> : <Play />}
                            </IconButton>
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={bot.name}
                          secondary={`${bot.type} • ${bot.tasks} tasks • ${bot.uptime}`}
                          primaryTypographyProps={{
                            sx: { color: '#ffffff', fontSize: '0.9rem' }
                          }}
                          secondaryTypographyProps={{
                            sx: { color: '#b0b0b0', fontSize: '0.75rem' }
                          }}
                        />
                        <Chip
                          size="small"
                          label={bot.status}
                          sx={{
                            backgroundColor: getStatusColor(bot.status),
                            color: '#000000',
                            fontSize: '0.7rem'
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </AccordionDetails>
          </Accordion>

          {/* Workflows Section */}
          <Accordion
            expanded={expandedSections.workflows}
            onChange={() => handleSectionToggle('workflows')}
            sx={{
              backgroundColor: 'transparent',
              boxShadow: 'none',
              '&:before': { display: 'none' }
            }}
          >
            <AccordionSummary
              expandIcon={<ChevronDown style={{ color: '#00f5ff' }} />}
              sx={{
                backgroundColor: '#2d2d2d',
                border: '1px solid #404040',
                borderRadius: 1,
                mb: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GitBranch style={{ color: '#ff8c00' }} />
                <Typography sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                  Workflows
                </Typography>
                <Badge 
                  badgeContent={workflows.filter(w => w.status === 'running').length} 
                  color="warning" 
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List dense>
                {workflows.map((workflow) => {
                  const isSelected = currentWorkflow === workflow.id;
                  
                  return (
                    <ListItem key={workflow.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleWorkflowSelect(workflow.id)}
                        sx={{
                          backgroundColor: isSelected ? 'rgba(255, 140, 0, 0.1)' : 'transparent',
                          border: isSelected ? '1px solid #ff8c00' : '1px solid transparent',
                          borderRadius: 1,
                          mb: 0.5,
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 140, 0, 0.05)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <ListItemText
                            primary={workflow.name}
                            secondary={workflow.description}
                            primaryTypographyProps={{
                              sx: { color: '#ffffff', fontSize: '0.9rem' }
                            }}
                            secondaryTypographyProps={{
                              sx: { color: '#b0b0b0', fontSize: '0.75rem' }
                            }}
                          />
                          <Chip
                            size="small"
                            label={workflow.status}
                            sx={{
                              backgroundColor: getStatusColor(workflow.status),
                              color: '#000000',
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                        {workflow.status === 'running' && (
                          <Box sx={{ width: '100%', mt: 1 }}>
                            <Box
                              sx={{
                                width: '100%',
                                height: 4,
                                backgroundColor: '#404040',
                                borderRadius: 2,
                                overflow: 'hidden'
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${workflow.progress}%`,
                                  height: '100%',
                                  backgroundColor: '#ff8c00',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{ color: '#b0b0b0', fontSize: '0.7rem' }}
                            >
                              {workflow.progress}% complete
                            </Typography>
                          </Box>
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* Footer Actions */}
        <Box sx={{ p: 2, borderTop: '1px solid #404040' }}>
          <Typography
            variant="caption"
            sx={{ color: '#b0b0b0', display: 'block', textAlign: 'center', mb: 1 }}
          >
            NetRunner Control v3.0
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
            <Tooltip title="System Settings">
              <IconButton size="small" sx={{ color: '#b0b0b0' }}>
                <Settings />
              </IconButton>
            </Tooltip>
            <Tooltip title="System Status">
              <IconButton size="small" sx={{ color: '#00ff88' }}>
                <Activity />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default NetRunnerLeftSideBar;
