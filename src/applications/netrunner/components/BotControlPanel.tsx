/**
 * BotControlPanel.tsx
 * 
 * Component for controlling and managing OSINT bots from the BotRoster.
 * Integrated with NetRunner logging and error handling frameworks.
 */

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Button, 
  Divider, 
  Chip,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Bot, 
  Play, 
  Pause, 
  Settings, 
  Database,
  Clock,
  ArrowUpRight,
  List
} from 'lucide-react';

import { OsintBot } from '../integration/BotRosterIntegration';
import { NetRunnerTool } from '../tools/NetRunnerPowerTools';
import { LoggerFactory } from '../services/logging';
import { ErrorFactory, NETRUNNER_ERROR_CODES } from '../services/error';

interface BotControlPanelProps {
  bots: OsintBot[];
  activeBots: string[];
  onBotActivate: (botId: string) => void;
  tools: NetRunnerTool[];
}

const BotControlPanel: React.FC<BotControlPanelProps> = ({
  bots,
  activeBots,
  onBotActivate,
  tools
}) => {
  const [selectedBot, setSelectedBot] = useState<OsintBot | null>(null);
  const [searchTarget, setSearchTarget] = useState<string>('');
  const [taskPriority, setTaskPriority] = useState<string>('medium');
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'warning' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Initialize logger
  const logger = LoggerFactory.getLogger('BotControlPanel');

  // Show notification helper
  const showNotification = (message: string, severity: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    setNotification({ open: true, message, severity });
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  // Map of compatible tools for each bot
  const compatibleToolsMap = bots.reduce((acc, bot) => {
    acc[bot.id] = tools.filter(tool => 
      tool.automationCompatible && 
      bot.specializations.some(spec => tool.intelTypes.includes(spec))
    );
    return acc;
  }, {} as Record<string, NetRunnerTool[]>);
  
  // Handle bot selection
  const handleBotSelect = (bot: OsintBot) => {
    try {
      logger.info('Bot selected for control panel', { 
        botId: bot.id, 
        botName: bot.name,
        specializations: bot.specializations 
      });
      setSelectedBot(bot);
      showNotification(`Selected bot: ${bot.name}`, 'info');
    } catch (error) {
      const botError = ErrorFactory.createBotError(
        'Failed to select bot for control panel',
        NETRUNNER_ERROR_CODES.BOT_EXECUTION_FAILED,
        { details: { botId: bot.id, error } }
      );
      logger.error('Bot selection failed', botError);
      showNotification('Failed to select bot', 'error');
    }
  };
  
  // Handle task creation
  const handleCreateTask = () => {
    try {
      if (!selectedBot) {
        throw ErrorFactory.createBotError(
          'No bot selected for task creation',
          NETRUNNER_ERROR_CODES.BOT_NOT_AVAILABLE
        );
      }

      if (!searchTarget.trim()) {
        throw ErrorFactory.createBotError(
          'Search target is required for task creation',
          NETRUNNER_ERROR_CODES.BOT_PARAMETER_INVALID
        );
      }

      logger.info('Creating bot task', {
        botId: selectedBot.id,
        botName: selectedBot.name,
        searchTarget,
        priority: taskPriority,
        compatibleTools: compatibleToolsMap[selectedBot.id]?.length || 0
      });

      // Task creation logic would go here
      console.log('Creating task for bot', selectedBot?.id);
      console.log('Search target:', searchTarget);
      console.log('Priority:', taskPriority);
      
      showNotification(`Task created for ${selectedBot.name}`, 'success');
    } catch (error) {
      logger.error('Task creation failed', error);
      showNotification(error instanceof Error ? error.message : 'Failed to create task', 'error');
    }
  };
  
  return (
    <Box>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
            <Bot size={20} style={{ marginRight: '8px' }} />
            Bot Automation
            <Chip 
              label={`${activeBots.length} Active`} 
              size="small" 
              color={activeBots.length > 0 ? "primary" : "default"}
              sx={{ ml: 2 }} 
            />
          </Typography>
          
          <Box>
            <Button 
              variant="outlined"
              size="small"
              startIcon={<List size={16} />}
              sx={{ mr: 1 }}
            >
              Task Queue
            </Button>
            <Button 
              variant="outlined"
              size="small"
              startIcon={<ArrowUpRight size={16} />}
            >
              Bot Roster
            </Button>
          </Box>
        </Box>
        
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Manage automated OSINT bots to perform continuous intelligence gathering operations.
          Bots can use multiple power tools to collect and analyze data autonomously.
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: 3 }}>
          {/* Bot List */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Available Bots</Typography>
            <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
              {bots.map(bot => (
                <Card 
                  key={bot.id}
                  sx={{ 
                    mb: 2,
                    cursor: 'pointer',
                    borderLeft: selectedBot?.id === bot.id ? '4px solid #1976d2' : 'none',
                    bgcolor: activeBots.includes(bot.id) ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                  }}
                  onClick={() => handleBotSelect(bot)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Bot size={20} style={{ marginRight: '8px' }} />
                        <Typography variant="h6">{bot.name}</Typography>
                      </Box>
                      <IconButton 
                        color={activeBots.includes(bot.id) ? "primary" : "default"}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBotActivate(bot.id);
                        }}
                      >
                        {activeBots.includes(bot.id) ? <Pause size={18} /> : <Play size={18} />}
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {bot.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      <Chip 
                        size="small" 
                        label={`Autonomy: ${bot.autonomyLevel}`}
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                      <Chip 
                        size="small" 
                        label={`Scope: ${bot.scope}`}
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip 
                        size="small"
                        label={`${compatibleToolsMap[bot.id]?.length || 0} compatible tools`}
                        icon={<Database size={14} />}
                      />
                      
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <Clock size={14} style={{ marginRight: '4px' }} />
                        Last active: {new Date(bot.updated).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
          
          {/* Bot Details & Controls */}
          <Box>
            {selectedBot ? (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Bot Controls & Task Creation</Typography>
                <Card elevation={2} sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{selectedBot.name}</Typography>
                      <Chip 
                        label={activeBots.includes(selectedBot.id) ? "Active" : "Inactive"}
                        color={activeBots.includes(selectedBot.id) ? "success" : "default"}
                        size="small"
                      />
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Performance Metrics:</Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6">{(selectedBot.performance.accuracy * 100).toFixed(0)}%</Typography>
                          <Typography variant="caption">Accuracy</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6">{selectedBot.performance.speed}</Typography>
                          <Typography variant="caption">Ops/Min</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6">{(selectedBot.performance.successRate * 100).toFixed(0)}%</Typography>
                          <Typography variant="caption">Success Rate</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6">{(selectedBot.performance.intelQualityScore * 100).toFixed(0)}%</Typography>
                          <Typography variant="caption">Intel Quality</Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Create Task:</Typography>
                    <Box sx={{ mb: 2 }}>
                      <TextField 
                        fullWidth
                        label="Search Target"
                        placeholder="Domain, person, organization, etc."
                        value={searchTarget}
                        onChange={(e) => setSearchTarget(e.target.value)}
                        size="small"
                        sx={{ mb: 2 }}
                      />
                      
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={taskPriority}
                          label="Priority"
                          onChange={(e) => setTaskPriority(e.target.value)}
                        >
                          <MenuItem value="low">Low</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                          <MenuItem value="critical">Critical</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <FormControlLabel
                          control={<Switch defaultChecked />}
                          label="Auto-generate Intel Report"
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Button 
                        variant="outlined"
                        startIcon={<Settings size={16} />}
                      >
                        Bot Settings
                      </Button>
                      
                      <Button 
                        variant="contained"
                        startIcon={<Play size={16} />}
                        disabled={!searchTarget.trim()}
                        onClick={handleCreateTask}
                      >
                        Run Task
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
                
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Compatible Power Tools</Typography>
                <Card elevation={1}>
                  <CardContent>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {compatibleToolsMap[selectedBot.id]?.map(tool => (
                        <Chip 
                          key={tool.id}
                          label={tool.name}
                          icon={<Database size={14} />}
                          sx={{ mb: 1 }}
                        />
                      ))}
                      
                      {(!compatibleToolsMap[selectedBot.id] || compatibleToolsMap[selectedBot.id].length === 0) && (
                        <Typography variant="body2" color="textSecondary">
                          No compatible tools found for this bot.
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ) : (
              <Box sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center',
                p: 5,
                border: '1px dashed #ccc',
                borderRadius: 2
              }}>
                <Bot size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>Select a Bot</Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  Choose a bot from the list to view details and create tasks
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BotControlPanel;
