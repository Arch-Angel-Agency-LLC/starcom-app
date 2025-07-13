/**
 * NetRunner Bottom Bar - Bot Roster
 * 
 * Horizontal scrolling bot roster with autonomous bots that can be controlled by AI Agent.
 * Supports default Starcom bots and user-created custom bots.
 * 
 * @author GitHub Copilot
 * @date July 12, 2025
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent
} from '@mui/material';
import {
  ChevronUp,
  ChevronDown,
  Plus,
  Play,
  Pause,
  Settings,
  Trash2,
  Bot,
  Zap,
  Globe,
  Shield,
  Search,
  Database,
  Code,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface NetRunnerBottomBarProps {
  open: boolean;
  height: number;
  onToggle: () => void;
}

interface BotInstance {
  id: string;
  name: string;
  type: 'default' | 'custom';
  category: string;
  status: 'active' | 'paused' | 'idle' | 'error';
  icon: React.ComponentType<{ size?: number | string; color?: string }>;
  description: string;
  tasksCompleted: number;
  uptime: string;
  autonomyLevel: number; // 0-100
  aiControlled: boolean;
  capabilities: string[];
}

const NetRunnerBottomBar: React.FC<NetRunnerBottomBarProps> = ({
  open,
  height,
  onToggle
}) => {
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [createBotOpen, setCreateBotOpen] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotCategory, setNewBotCategory] = useState('');
  const [newBotDescription, setNewBotDescription] = useState('');

  // Default Starcom bots + user created bots
  const [bots, setBots] = useState<BotInstance[]>([
    {
      id: 'spider-01',
      name: 'WebSpider Alpha',
      type: 'default',
      category: 'crawler',
      status: 'active',
      icon: Globe,
      description: 'Advanced web crawling and data extraction',
      tasksCompleted: 1247,
      uptime: '72h 34m',
      autonomyLevel: 85,
      aiControlled: true,
      capabilities: ['Deep Crawling', 'JS Rendering', 'Data Mining']
    },
    {
      id: 'recon-02',
      name: 'ReconBot Beta',
      type: 'default',
      category: 'reconnaissance',
      status: 'active',
      icon: Search,
      description: 'OSINT reconnaissance and intelligence gathering',
      tasksCompleted: 892,
      uptime: '48h 12m',
      autonomyLevel: 92,
      aiControlled: true,
      capabilities: ['Port Scanning', 'Service Detection', 'Vuln Assessment']
    },
    {
      id: 'exploit-03',
      name: 'ExploitBot Gamma',
      type: 'default',
      category: 'security',
      status: 'paused',
      icon: Shield,
      description: 'Automated security testing and exploitation',
      tasksCompleted: 156,
      uptime: '12h 45m',
      autonomyLevel: 78,
      aiControlled: false,
      capabilities: ['Exploit Testing', 'Payload Delivery', 'Post-Exploitation']
    },
    {
      id: 'data-04',
      name: 'DataMiner Delta',
      type: 'default',
      category: 'data',
      status: 'idle',
      icon: Database,
      description: 'Big data processing and correlation engine',
      tasksCompleted: 2341,
      uptime: '120h 18m',
      autonomyLevel: 67,
      aiControlled: true,
      capabilities: ['Data Processing', 'Pattern Recognition', 'Correlation']
    },
    {
      id: 'custom-01',
      name: 'Custom Scraper',
      type: 'custom',
      category: 'scraping',
      status: 'error',
      icon: Code,
      description: 'User-created custom scraping bot',
      tasksCompleted: 23,
      uptime: '2h 15m',
      autonomyLevel: 45,
      aiControlled: false,
      capabilities: ['Custom Scripts', 'API Integration']
    }
  ]);

  const getBotStatusColor = (status: BotInstance['status']) => {
    switch (status) {
      case 'active': return '#00ff88';
      case 'paused': return '#ffaa00';
      case 'idle': return '#888888';
      case 'error': return '#ff4444';
      default: return '#ffffff';
    }
  };

  const getBotStatusIcon = (status: BotInstance['status']) => {
    switch (status) {
      case 'active': return <Activity size={12} />;
      case 'paused': return <Pause size={12} />;
      case 'idle': return <Clock size={12} />;
      case 'error': return <AlertTriangle size={12} />;
      default: return <CheckCircle size={12} />;
    }
  };

  const handleCreateBot = () => {
    if (!newBotName || !newBotCategory) return;

    const newBot: BotInstance = {
      id: `custom-${Date.now()}`,
      name: newBotName,
      type: 'custom',
      category: newBotCategory,
      status: 'idle',
      icon: Bot,
      description: newBotDescription || 'Custom user-created bot',
      tasksCompleted: 0,
      uptime: '0h 0m',
      autonomyLevel: 50,
      aiControlled: false,
      capabilities: ['Custom Logic']
    };

    setBots([...bots, newBot]);
    setCreateBotOpen(false);
    setNewBotName('');
    setNewBotCategory('');
    setNewBotDescription('');
  };

  const toggleBotStatus = (botId: string) => {
    setBots(bots.map(bot => {
      if (bot.id === botId) {
        const newStatus = bot.status === 'active' ? 'paused' : 
                         bot.status === 'paused' ? 'active' : 'active';
        return { ...bot, status: newStatus };
      }
      return bot;
    }));
  };

  return (
    <Box
      sx={{
        height: `${height}px`,
        width: '100%',
        backgroundColor: '#000000',
        borderTop: '1px solid #00f5ff',
        display: 'flex',
        transition: 'height 0.3s ease',
        overflow: 'hidden',
        fontFamily: "'Aldrich', 'Courier New', monospace"
      }}
    >
      {/* Left Control Panel */}
      <Box
        sx={{
          width: '48px',
          backgroundColor: '#0a0a0a',
          borderRight: '1px solid #00f5ff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 0.5,
          gap: 0.5
        }}
      >
        {/* Expand/Collapse Toggle */}
        <Tooltip title={open ? "Collapse Bot Roster" : "Expand Bot Roster"}>
          <IconButton
            onClick={onToggle}
            size="small"
            sx={{ 
              color: '#ffffff',
              p: 0.25,
              '&:hover': { color: '#00f5ff' }
            }}
          >
            {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </IconButton>
        </Tooltip>

        {/* Create Bot Button */}
        <Tooltip title="Create New Bot">
          <IconButton
            onClick={() => setCreateBotOpen(true)}
            size="small"
            sx={{
              color: '#00ff88',
              border: '1px solid #00ff88',
              borderRadius: 0,
              p: 0.25,
              minWidth: 20,
              minHeight: 20,
              '&:hover': {
                backgroundColor: 'rgba(0, 255, 136, 0.1)'
              }
            }}
          >
            <Plus size={12} />
          </IconButton>
        </Tooltip>

        {/* Bot Management */}
        <Tooltip title="Bot Settings">
          <IconButton
            size="small"
            sx={{ 
              color: '#aaaaaa',
              p: 0.25,
              '&:hover': { color: '#ffffff' }
            }}
          >
            <Settings size={12} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Bot Roster - Horizontal Scroll */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            px: 0.75,
            backgroundColor: '#0a0a0a',
            borderBottom: '1px solid #00f5ff'
          }}
        >
          <Typography variant="caption" sx={{ 
            color: '#00f5ff',
            fontFamily: "'Aldrich', monospace",
            fontSize: '0.65rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            BOT_ROSTER ({bots.length}_ACTIVE)
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 0.25 }}>
            <Chip
              label={`${bots.filter(b => b.status === 'active').length}_RUN`}
              size="small"
              sx={{
                backgroundColor: 'rgba(0, 255, 136, 0.15)',
                color: '#00ff88',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.6rem',
                height: 16,
                borderRadius: 0,
                '& .MuiChip-label': { px: 0.5, py: 0 }
              }}
            />
            <Chip
              label={`${bots.filter(b => b.aiControlled).length}_AI`}
              size="small"
              sx={{
                backgroundColor: 'rgba(0, 245, 255, 0.15)',
                color: '#00f5ff',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.6rem',
                height: 16,
                borderRadius: 0,
                '& .MuiChip-label': { px: 0.5, py: 0 }
              }}
            />
          </Box>
        </Box>

        {/* Bot Cards - Horizontal Scroll */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            gap: 0.5,
            p: 0.5,
            '&::-webkit-scrollbar': {
              height: '3px'
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#000000'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#00f5ff',
              borderRadius: 0
            }
          }}
        >
          {bots.map((bot) => (
            <Card
              key={bot.id}
              sx={{
                minWidth: open ? '200px' : '80px',
                maxWidth: open ? '200px' : '80px',
                height: open ? '80px' : '40px',
                backgroundColor: selectedBot === bot.id ? 'rgba(0, 245, 255, 0.1)' : '#0a0a0a',
                border: '1px solid',
                borderColor: selectedBot === bot.id ? '#00f5ff' : '#333333',
                borderRadius: 0,
                cursor: 'pointer',
                transition: 'all 0.1s ease',
                '&:hover': {
                  borderColor: '#00f5ff',
                  backgroundColor: 'rgba(0, 245, 255, 0.05)'
                }
              }}
              onClick={() => setSelectedBot(selectedBot === bot.id ? null : bot.id)}
            >
              <CardContent sx={{ p: 0.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Bot Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
                  <Avatar
                    sx={{
                      width: open ? 24 : 16,
                      height: open ? 24 : 16,
                      backgroundColor: `${getBotStatusColor(bot.status)}15`,
                      border: `1px solid ${getBotStatusColor(bot.status)}`,
                      borderRadius: 0
                    }}
                  >
                    <bot.icon size={open ? 12 : 8} color={getBotStatusColor(bot.status)} />
                  </Avatar>
                  <Box sx={{ ml: 0.5, flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#ffffff',
                        fontFamily: "'Aldrich', monospace",
                        fontSize: open ? '0.65rem' : '0.55rem',
                        lineHeight: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase'
                      }}
                    >
                      {bot.name}
                    </Typography>
                    {open && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#aaaaaa',
                          fontFamily: "'Courier New', monospace",
                          fontSize: '0.55rem',
                          lineHeight: 1
                        }}
                      >
                        {bot.category.toUpperCase()}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <Box sx={{ color: getBotStatusColor(bot.status) }}>
                      {getBotStatusIcon(bot.status)}
                    </Box>
                    {bot.aiControlled && (
                      <Tooltip title="AI Controlled">
                        <Box sx={{ color: '#00f5ff' }}>
                          <Zap size={8} />
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* Bot Stats - Only when expanded */}
                {open && (
                  <>
                    <Box sx={{ mb: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#aaaaaa',
                          fontFamily: "'Courier New', monospace",
                          fontSize: '0.55rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {bot.description.toUpperCase()}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ 
                        color: '#00ff88', 
                        fontFamily: "'Courier New', monospace",
                        fontSize: '0.55rem' 
                      }}>
                        T:{bot.tasksCompleted}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#ffaa00', 
                        fontFamily: "'Courier New', monospace",
                        fontSize: '0.55rem' 
                      }}>
                        UP:{bot.uptime}
                      </Typography>
                    </Box>

                    {/* Autonomy Level Bar */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ 
                        color: '#aaaaaa', 
                        fontFamily: "'Aldrich', monospace",
                        fontSize: '0.5rem' 
                      }}>
                        AUTO:
                      </Typography>
                      <Box
                        sx={{
                          flex: 1,
                          height: 2,
                          backgroundColor: '#333333',
                          borderRadius: 0,
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            width: `${bot.autonomyLevel}%`,
                            height: '100%',
                            backgroundColor: '#00f5ff',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#00f5ff', fontSize: '0.6rem' }}>
                        {bot.autonomyLevel}%
                      </Typography>
                    </Box>
                  </>
                )}

                {/* Control Buttons - Bottom */}
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBotStatus(bot.id);
                    }}
                    sx={{
                      color: bot.status === 'active' ? '#ffaa00' : '#00ff88',
                      minWidth: open ? 24 : 20,
                      minHeight: open ? 24 : 20
                    }}
                  >
                    {bot.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
                  </IconButton>
                  
                  {open && (
                    <>
                      <IconButton
                        size="small"
                        sx={{ color: '#aaaaaa', minWidth: 24, minHeight: 24 }}
                      >
                        <Settings size={12} />
                      </IconButton>
                      
                      {bot.type === 'custom' && (
                        <IconButton
                          size="small"
                          sx={{ color: '#ff4444', minWidth: 24, minHeight: 24 }}
                        >
                          <Trash2 size={12} />
                        </IconButton>
                      )}
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Create Bot Dialog */}
      <Dialog
        open={createBotOpen}
        onClose={() => setCreateBotOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            border: '1px solid #333333',
            color: '#ffffff'
          }
        }}
      >
        <DialogTitle sx={{ color: '#00f5ff' }}>
          Create New Bot
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Bot Name"
              value={newBotName}
              onChange={(e) => setNewBotName(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': { borderColor: '#333333' },
                  '&:hover fieldset': { borderColor: '#555555' },
                  '&.Mui-focused fieldset': { borderColor: '#00f5ff' }
                },
                '& .MuiInputLabel-root': { color: '#aaaaaa' }
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#aaaaaa' }}>Category</InputLabel>
              <Select
                value={newBotCategory}
                onChange={(e) => setNewBotCategory(e.target.value)}
                sx={{
                  color: '#ffffff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555555' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00f5ff' }
                }}
              >
                <MenuItem value="crawler">Web Crawler</MenuItem>
                <MenuItem value="scraper">Data Scraper</MenuItem>
                <MenuItem value="scanner">Security Scanner</MenuItem>
                <MenuItem value="recon">Reconnaissance</MenuItem>
                <MenuItem value="automation">Automation</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Description"
              value={newBotDescription}
              onChange={(e) => setNewBotDescription(e.target.value)}
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': { borderColor: '#333333' },
                  '&:hover fieldset': { borderColor: '#555555' },
                  '&.Mui-focused fieldset': { borderColor: '#00f5ff' }
                },
                '& .MuiInputLabel-root': { color: '#aaaaaa' }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateBotOpen(false)}
            sx={{ color: '#aaaaaa' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateBot}
            sx={{
              backgroundColor: '#00ff88',
              color: '#000000',
              '&:hover': { backgroundColor: '#00dd77' }
            }}
          >
            Create Bot
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NetRunnerBottomBar;
