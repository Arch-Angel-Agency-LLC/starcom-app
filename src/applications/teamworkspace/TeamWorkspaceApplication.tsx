import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField,
  Chip,
  Stack,
  CircularProgress,
  Avatar,
  Badge,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  ThemeProvider,
  createTheme
} from '@mui/material';
import { 
  MessageSquare, 
  UserPlus, 
  Settings, 
  FileText,
  Clock,
  Video,
  Send,
  Bot,
  Zap
} from 'lucide-react';

// Cyberpunk Theme for CollabCenter
const cyberpunkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ffff',
      dark: '#00d4ff',
      light: '#4dffff',
    },
    secondary: {
      main: '#ff0080',
      dark: '#cc0066',
      light: '#ff4da6',
    },
    background: {
      default: '#0a0f14',
      paper: 'rgba(0, 15, 30, 0.95)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    error: {
      main: '#ff4444',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#00c4ff',
    },
    success: {
      main: '#00ff41',
    },
  },
  typography: {
    fontFamily: "'Aldrich-Regular', 'Orbitron', monospace",
    h1: { fontFamily: "'Orbitron', monospace" },
    h2: { fontFamily: "'Orbitron', monospace" },
    h3: { fontFamily: "'Orbitron', monospace" },
    h4: { fontFamily: "'Orbitron', monospace" },
    h5: { fontFamily: "'Orbitron', monospace" },
    h6: { fontFamily: "'Orbitron', monospace" },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(0, 15, 30, 0.95)',
          border: '1px solid rgba(0, 255, 255, 0.2)',
          borderRadius: '0',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0',
          textTransform: 'uppercase',
          fontFamily: "'Aldrich-Regular', monospace",
          fontWeight: 600,
          letterSpacing: '0.5px',
        },
        contained: {
          background: 'linear-gradient(135deg, #00ffff 0%, #0099cc 100%)',
          color: '#000',
          border: '1px solid #00ffff',
          boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #00d4ff 0%, #0088bb 100%)',
            boxShadow: '0 0 25px rgba(0, 255, 255, 0.5)',
          },
        },
        outlined: {
          color: '#00ffff',
          border: '1px solid rgba(0, 255, 255, 0.5)',
          '&:hover': {
            border: '1px solid #00ffff',
            background: 'rgba(0, 255, 255, 0.1)',
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '0',
            '& fieldset': {
              borderColor: 'rgba(0, 255, 255, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 255, 255, 0.6)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00ffff',
              boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '0',
          fontFamily: "'Aldrich-Regular', monospace",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(0, 20, 35, 0.9)',
          border: '1px solid rgba(0, 255, 255, 0.2)',
          borderRadius: '0',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            borderColor: 'rgba(0, 255, 255, 0.4)',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 255, 255, 0.2)',
          borderRadius: '0',
        },
        bar: {
          backgroundColor: '#00ffff',
          boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
        },
      },
    },
  },
});

// Team Member Interface
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'analyst' | 'operator' | 'viewer';
  status: 'online' | 'away' | 'busy' | 'offline';
  avatar?: string;
  lastActive: string;
  skills: string[];
  currentTasks: number;
}

// Team Project Interface
interface TeamProject {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedMembers: string[];
  progress: number;
  deadline: string;
  createdAt: string;
  tasks: Task[];
}

// Task Interface
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  assignedTo: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags: string[];
}

// Chat Message Interface
interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  type: 'text' | 'file' | 'system';
  attachments?: string[];
}

const TeamWorkspaceApplication: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'chat' | 'operatives' | 'admin'>('overview');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<TeamProject[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Load team data
  useEffect(() => {
    const loadTeamData = async () => {
      setLoading(true);
      try {
        // Simulate API call - replace with actual data loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock team members
        const mockMembers: TeamMember[] = [
          {
            id: '1',
            name: 'Sarah Chen',
            email: 'sarah.chen@starcom.ops',
            role: 'admin',
            status: 'online',
            lastActive: new Date().toISOString(),
            skills: ['cybersecurity', 'threat-analysis', 'team-leadership'],
            currentTasks: 3
          },
          {
            id: '2',
            name: 'Marcus Rodriguez',
            email: 'marcus.rodriguez@starcom.ops',
            role: 'analyst',
            status: 'online',
            lastActive: new Date(Date.now() - 300000).toISOString(),
            skills: ['osint', 'data-analysis', 'research'],
            currentTasks: 5
          },
          {
            id: '3',
            name: 'Alex Kim',
            email: 'alex.kim@starcom.ops',
            role: 'operator',
            status: 'away',
            lastActive: new Date(Date.now() - 1800000).toISOString(),
            skills: ['network-ops', 'incident-response', 'automation'],
            currentTasks: 2
          }
        ];

        // Mock projects
        const mockProjects: TeamProject[] = [
          {
            id: 'proj1',
            title: 'Operation Cyber Shield',
            description: 'Comprehensive cybersecurity assessment and threat mitigation',
            status: 'active',
            priority: 'high',
            assignedMembers: ['1', '2', '3'],
            progress: 67,
            deadline: '2025-01-15',
            createdAt: '2024-12-01',
            tasks: [
              {
                id: 'task1',
                title: 'Network vulnerability assessment',
                description: 'Scan and identify network vulnerabilities',
                status: 'done',
                assignedTo: '2',
                priority: 'high',
                dueDate: '2025-01-10',
                tags: ['security', 'assessment']
              },
              {
                id: 'task2',
                title: 'Threat intelligence gathering',
                description: 'Collect and analyze current threat intelligence',
                status: 'in-progress',
                assignedTo: '1',
                priority: 'medium',
                dueDate: '2025-01-12',
                tags: ['intelligence', 'research']
              }
            ]
          },
          {
            id: 'proj2',
            title: 'Data Analysis Pipeline',
            description: 'Automated data processing and analysis system',
            status: 'planning',
            priority: 'medium',
            assignedMembers: ['2', '3'],
            progress: 23,
            deadline: '2025-02-01',
            createdAt: '2024-12-10',
            tasks: []
          }
        ];

        // Mock chat messages
        const mockMessages: ChatMessage[] = [
          {
            id: 'msg1',
            senderId: '1',
            senderName: 'Sarah Chen',
            message: 'Team meeting at 2 PM to discuss Operation Cyber Shield progress',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            type: 'text'
          },
          {
            id: 'msg2',
            senderId: '2',
            senderName: 'Marcus Rodriguez',
            message: 'Vulnerability assessment complete. Found 3 critical issues.',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            type: 'text'
          },
          {
            id: 'msg3',
            senderId: '3',
            senderName: 'Alex Kim',
            message: 'Automated monitoring systems are now active',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            type: 'text'
          }
        ];

        setTeamMembers(mockMembers);
        setProjects(mockProjects);
        setChatMessages(mockMessages);
      } catch (error) {
        console.error('Error loading team data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeamData();
  }, []);

  // Handle send message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg${Date.now()}`,
      senderId: 'current-user',
      senderName: 'You',
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setChatMessages(prev => [...prev, newMsg]);
    setNewMessage('');
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'away': return '#FF9800';
      case 'busy': return '#F44336';
      case 'offline': return '#9E9E9E';
      default: return '#2196F3';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#FF5722';
      case 'critical': return '#F44336';
      default: return '#2196F3';
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={cyberpunkTheme}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>Loading Team Workspace...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={cyberpunkTheme}>
      <Box sx={{ 
        p: 3, 
        height: '100vh', 
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(0, 10, 20, 0.95) 0%, rgba(0, 15, 30, 0.98) 100%)',
        backdropFilter: 'blur(10px)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, transparent 49%, rgba(0, 255, 255, 0.02) 50%, transparent 51%)',
          pointerEvents: 'none',
          zIndex: 0,
        }
      }}>
      {/* Header */}
      <Box sx={{ mb: 3, position: 'relative', zIndex: 1 }}>
        {/* CollabCenter Title */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography 
            variant="h4" 
            sx={{ 
              color: '#00ffff',
              fontFamily: "'Orbitron', monospace",
              fontWeight: 700,
              letterSpacing: '2px',
              textShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
              mb: 1,
              '&::before': {
                content: '"[["',
                color: 'rgba(0, 255, 255, 0.6)',
                marginRight: '8px',
              },
              '&::after': {
                content: '"]]"',
                color: 'rgba(0, 255, 255, 0.6)',
                marginLeft: '8px',
              }
            }}
          >
            COLLABCENTER
          </Typography>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontFamily: "'Aldrich-Regular', monospace",
              letterSpacing: '1px',
              fontSize: '0.9rem',
            }}
          >
            INTELLIGENCE OPERATIONS COLLABORATION HUB
          </Typography>
        </Box>
        
        {/* Tab Navigation */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'center' }}>
          {(['overview', 'projects', 'chat', 'operatives', 'admin'] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'contained' : 'outlined'}
              onClick={() => setActiveTab(tab)}
              sx={{ textTransform: 'capitalize' }}
            >
              {tab}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Tab Content */}
      <Box sx={{ 
        height: 'calc(100vh - 250px)', 
        overflow: 'auto',
        position: 'relative',
        zIndex: 1,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '0',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'linear-gradient(180deg, #00ffff 0%, #0099cc 100%)',
          borderRadius: '0',
          boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'linear-gradient(180deg, #00d4ff 0%, #0088bb 100%)',
        },
      }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {/* Team Status */}
            <Box>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UserPlus size={20} />
                  Team Status
                </Typography>
                <List>
                  {teamMembers.slice(0, 5).map((member) => (
                    <ListItem key={member.id}>
                      <ListItemAvatar>
                        <Badge
                          badgeContent=""
                          color="success"
                          variant="dot"
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: getStatusColor(member.status)
                            }
                          }}
                        >
                          <Avatar>{member.name.split(' ').map(n => n[0]).join('')}</Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={member.name}
                        secondary={`${member.role} • ${member.currentTasks} active tasks`}
                      />
                      <Chip 
                        label={member.status} 
                        size="small"
                        sx={{ 
                          backgroundColor: getStatusColor(member.status),
                          color: 'white'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>

            {/* Active Projects */}
            <Box>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileText size={20} />
                  Active Projects
                </Typography>
                <Stack spacing={2}>
                  {projects.filter(p => p.status === 'active').map((project) => (
                    <Card key={project.id} variant="outlined">
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {project.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {project.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip 
                            label={project.priority} 
                            size="small"
                            sx={{ 
                              backgroundColor: getPriorityColor(project.priority),
                              color: 'white'
                            }}
                          />
                          <Typography variant="caption">
                            Due: {new Date(project.deadline).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={project.progress} 
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {project.progress}% complete
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Paper>
            </Box>

            {/* Recent Activity */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Clock size={20} />
                  Recent Activity
                </Typography>
                <List>
                  {chatMessages.slice(-5).map((message) => (
                    <ListItem key={message.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {message.senderName.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={message.message}
                        secondary={`${message.senderName} • ${new Date(message.timestamp).toLocaleString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          </Box>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
            {projects.map((project) => (
              <Box key={project.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {project.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {project.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip 
                        label={project.status} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={project.priority} 
                        size="small"
                        sx={{ 
                          backgroundColor: getPriorityColor(project.priority),
                          color: 'white'
                        }}
                      />
                    </Box>

                    <LinearProgress 
                      variant="determinate" 
                      value={project.progress} 
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {project.progress}% complete
                    </Typography>

                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Due: {new Date(project.deadline).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small">
                      View Details
                    </Button>
                    <Button size="small">Edit</Button>
                  </CardActions>
                </Card>
              </Box>
            ))}
          </Box>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Chat Messages */}
            <Paper sx={{ flex: 1, p: 2, mb: 2, overflow: 'auto' }}>
              <Stack spacing={2}>
                {chatMessages.map((message) => (
                  <Box key={message.id} sx={{ display: 'flex', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {message.senderName.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {message.senderName} • {new Date(message.timestamp).toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        {message.message}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>

            {/* Message Input */}
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  size="small"
                />
                <IconButton onClick={handleSendMessage} color="primary">
                  <Send />
                </IconButton>
                <IconButton>
                  <FileText size={16} />
                </IconButton>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Members Tab */}
        {activeTab === 'operatives' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
            {teamMembers.map((member) => (
              <Box key={member.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Badge
                        badgeContent=""
                        color="success"
                        variant="dot"
                        sx={{
                          '& .MuiBadge-badge': {
                            backgroundColor: getStatusColor(member.status)
                          }
                        }}
                      >
                        <Avatar sx={{ width: 56, height: 56 }}>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                      </Badge>
                      <Box>
                        <Typography variant="h6">
                          {member.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {member.email}
                        </Typography>
                        <Chip 
                          label={member.role} 
                          size="small" 
                          variant="outlined" 
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Skills:</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {member.skills.map(skill => (
                          <Chip key={skill} label={skill} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      Active tasks: {member.currentTasks}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Last active: {new Date(member.lastActive).toLocaleString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<MessageSquare size={16} />}>
                      Message
                    </Button>
                    <Button size="small" startIcon={<Video size={16} />}>
                      Call
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            ))}
          </Box>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Settings size={20} />
                  Team Settings
                </Typography>
                <Stack spacing={2}>
                  <Button variant="outlined" startIcon={<UserPlus />}>
                    Invite New Member
                  </Button>
                  <Button variant="outlined" startIcon={<Settings />}>
                    Configure Permissions
                  </Button>
                  <Button variant="outlined" startIcon={<Bot />}>
                    AI Agent Settings
                  </Button>
                  <Button variant="outlined" startIcon={<Zap />}>
                    Automation Rules
                  </Button>
                </Stack>
              </Paper>
            </Box>

            <Box>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Team Analytics
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Members:</Typography>
                    <Typography variant="body2" fontWeight="bold">{teamMembers.length}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Active Projects:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {projects.filter(p => p.status === 'active').length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Online Members:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {teamMembers.filter(m => m.status === 'online').length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Messages Today:</Typography>
                    <Typography variant="body2" fontWeight="bold">{chatMessages.length}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
    </ThemeProvider>
  );
};

export default TeamWorkspaceApplication;
