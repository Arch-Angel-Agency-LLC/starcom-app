import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Chip,
  Stack,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ThemeProvider,
  createTheme
} from '@mui/material';
import { 
  Clock, 
  Play, 
  Pause, 
  RefreshCw,
  TrendingUp,
  Activity,
  MapPin
} from 'lucide-react';

// Cyberpunk Temporal Theme for TimeMap
const cyberpunkTemporalTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00bfff', // Deep sky blue for temporal elements
      dark: '#0088cc',
      light: '#4dd0ff',
    },
    secondary: {
      main: '#9c27b0', // Purple for timeline and events
      dark: '#7b1fa2',
      light: '#ba68c8',
    },
    background: {
      default: '#0a0a1a',
      paper: 'rgba(0, 10, 30, 0.95)', // Deep blue tint for temporal theme
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    error: {
      main: '#ff4444',
    },
    warning: {
      main: '#ffaa00',
    },
    info: {
      main: '#00bfff',
    },
    success: {
      main: '#00ff9f',
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
          background: 'rgba(0, 10, 30, 0.95)',
          border: '1px solid rgba(0, 191, 255, 0.2)',
          borderRadius: '0',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 20px rgba(0, 191, 255, 0.1)',
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
          background: 'linear-gradient(135deg, #00bfff 0%, #0088cc 100%)',
          color: '#000',
          border: '1px solid #00bfff',
          boxShadow: '0 0 15px rgba(0, 191, 255, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0088cc 0%, #006699 100%)',
            boxShadow: '0 0 25px rgba(0, 191, 255, 0.5)',
          },
        },
        outlined: {
          color: '#00bfff',
          border: '1px solid rgba(0, 191, 255, 0.5)',
          '&:hover': {
            border: '1px solid #00bfff',
            background: 'rgba(0, 191, 255, 0.1)',
            boxShadow: '0 0 15px rgba(0, 191, 255, 0.2)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '0',
          fontFamily: "'Aldrich-Regular', monospace",
          fontSize: '0.75rem',
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '0',
            '& fieldset': {
              borderColor: 'rgba(0, 191, 255, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 191, 255, 0.6)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00bfff',
              boxShadow: '0 0 10px rgba(0, 191, 255, 0.3)',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            fontFamily: "'Aldrich-Regular', monospace",
            '&.Mui-focused': {
              color: '#00bfff',
            },
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: "'Aldrich-Regular', monospace",
          backgroundColor: 'rgba(0, 10, 30, 0.95)',
          '&:hover': {
            backgroundColor: 'rgba(0, 191, 255, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 191, 255, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(0, 191, 255, 0.3)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiSelect-select': {
            fontFamily: "'Aldrich-Regular', monospace",
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#00bfff',
        },
      },
    },
  },
});

// TimeMap Event Interface
interface TimeMapEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: 'intelligence' | 'security' | 'operation' | 'communication' | 'analysis';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  location?: {
    lat: number;
    lng: number;
    name: string;
  };
  entities: string[];
  tags: string[];
  relatedEvents: string[];
}

// Monitoring Alert Interface
interface MonitoringAlert {
  id: string;
  type: 'system' | 'security' | 'performance' | 'data';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  acknowledged: boolean;
}

const TimeMapApplication: React.FC = () => {
  // State management
  const [events, setEvents] = useState<TimeMapEvent[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'monitoring' | 'analysis'>('timeline');

  // Load timeline data
  useEffect(() => {
    const loadTimelineData = async () => {
      setLoading(true);
      try {
        // Simulate API call - replace with actual data loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock timeline events
        const mockEvents: TimeMapEvent[] = [
          {
            id: '1',
            title: 'Suspicious Network Activity Detected',
            description: 'Unusual traffic patterns detected from external IP range',
            timestamp: new Date().toISOString(),
            category: 'security',
            severity: 'high',
            source: 'NetRunner Monitoring',
            location: { lat: 40.7128, lng: -74.0060, name: 'New York, NY' },
            entities: ['192.168.1.100', 'external-threat'],
            tags: ['network', 'security', 'intrusion'],
            relatedEvents: []
          },
          {
            id: '2',
            title: 'Intelligence Report Generated',
            description: 'New intelligence report available for analysis',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            category: 'intelligence',
            severity: 'medium',
            source: 'IntelAnalyzer',
            entities: ['report-2024-001'],
            tags: ['intelligence', 'analysis', 'report'],
            relatedEvents: []
          }
        ];

        // Mock monitoring alerts
        const mockAlerts: MonitoringAlert[] = [
          {
            id: '1',
            type: 'system',
            message: 'High CPU usage detected on primary server',
            timestamp: new Date().toISOString(),
            severity: 'warning',
            source: 'System Monitor',
            acknowledged: false
          },
          {
            id: '2',
            type: 'security',
            message: 'Failed login attempts detected',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            severity: 'error',
            source: 'Security Monitor',
            acknowledged: false
          }
        ];

        setEvents(mockEvents);
        setAlerts(mockAlerts);
      } catch (error) {
        console.error('Error loading timeline data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTimelineData();
  }, [selectedTimeframe]);

  // Handle playback controls
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  // Handle alert acknowledgment
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#FF5722';
      case 'critical': return '#F44336';
      default: return '#2196F3';
    }
  };

  // Filter events
  const filteredEvents = events.filter(event => 
    filterCategory === 'all' || event.category === filterCategory
  );

  // Get unacknowledged alerts
  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);

  if (loading) {
    return (
      <ThemeProvider theme={cyberpunkTemporalTheme}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{
          background: 'linear-gradient(135deg, rgba(0, 10, 30, 0.95) 0%, rgba(0, 5, 20, 0.98) 100%)',
          backdropFilter: 'blur(10px)',
        }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>Loading Timeline Data...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={cyberpunkTemporalTheme}>
      <Box sx={{ 
        p: 3, 
        height: '100vh', 
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(0, 10, 30, 0.95) 0%, rgba(0, 5, 20, 0.98) 100%)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, transparent 49%, rgba(0, 191, 255, 0.02) 50%, transparent 51%)',
          pointerEvents: 'none',
          zIndex: 0,
        }
      }}>
      {/* Header */}
      <Box sx={{ mb: 3, position: 'relative', zIndex: 1 }}>
        {/* TimeMap Title */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography 
            variant="h4" 
            sx={{ 
              color: '#00bfff',
              fontFamily: "'Orbitron', monospace",
              fontWeight: 700,
              letterSpacing: '2px',
              textShadow: '0 0 20px rgba(0, 191, 255, 0.5)',
              mb: 1,
              '&::before': {
                content: '"⟨"',
                color: 'rgba(0, 191, 255, 0.6)',
                marginRight: '12px',
                fontSize: '1.2em',
              },
              '&::after': {
                content: '"⟩"',
                color: 'rgba(0, 191, 255, 0.6)',
                marginLeft: '12px',
                fontSize: '1.2em',
              }
            }}
          >
            TIMEMAP
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
            TEMPORAL ANALYSIS & MONITORING PLATFORM
          </Typography>
        </Box>
        
        {/* Controls */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {/* View Mode Selector */}
          <FormControl size="small">
            <InputLabel>View Mode</InputLabel>
            <Select
              value={viewMode}
              label="View Mode"
              onChange={(e) => setViewMode(e.target.value as 'timeline' | 'monitoring' | 'analysis')}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="timeline">Timeline</MenuItem>
              <MenuItem value="monitoring">Monitoring</MenuItem>
              <MenuItem value="analysis">Analysis</MenuItem>
            </Select>
          </FormControl>

          {/* Timeframe Selector */}
          <FormControl size="small">
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={selectedTimeframe}
              label="Timeframe"
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>

          {/* Category Filter */}
          <FormControl size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={filterCategory}
              label="Category"
              onChange={(e) => setFilterCategory(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="intelligence">Intelligence</MenuItem>
              <MenuItem value="security">Security</MenuItem>
              <MenuItem value="operation">Operations</MenuItem>
              <MenuItem value="communication">Communications</MenuItem>
              <MenuItem value="analysis">Analysis</MenuItem>
            </Select>
          </FormControl>

          {/* Playback Controls */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={isPlaying ? "contained" : "outlined"}
              startIcon={isPlaying ? <Pause /> : <Play />}
              onClick={togglePlayback}
              size="small"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button variant="outlined" startIcon={<RefreshCw />} size="small">
              Refresh
            </Button>
          </Box>

          {/* Alert Counter */}
          {unacknowledgedAlerts.length > 0 && (
            <Chip
              icon={<Activity />}
              label={`${unacknowledgedAlerts.length} Active Alerts`}
              color="error"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 200px)' }}>
        {/* Timeline Events Panel */}
        <Paper sx={{ 
          flex: 2, 
          p: 2, 
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
            background: 'linear-gradient(180deg, #00bfff 0%, #0088cc 100%)',
            borderRadius: '0',
            boxShadow: '0 0 10px rgba(0, 191, 255, 0.5)',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(180deg, #0088cc 0%, #006699 100%)',
          },
        }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Clock size={20} />
            Timeline Events
          </Typography>
          
          <Stack spacing={2}>
            {filteredEvents.map((event) => (
              <Paper key={event.id} sx={{ p: 2, border: `2px solid ${getSeverityColor(event.severity)}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {event.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {event.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={event.category} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={event.severity} 
                        size="small" 
                        sx={{ 
                          backgroundColor: getSeverityColor(event.severity),
                          color: 'white'
                        }}
                      />
                      {event.location && (
                        <Chip 
                          icon={<MapPin size={14} />}
                          label={event.location.name} 
                          size="small" 
                          variant="outlined" 
                        />
                      )}
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      {new Date(event.timestamp).toLocaleString()} • Source: {event.source}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Paper>

        {/* Monitoring & Analysis Panel */}
        <Paper sx={{ 
          flex: 1, 
          p: 2, 
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
            background: 'linear-gradient(180deg, #9c27b0 0%, #7b1fa2 100%)',
            borderRadius: '0',
            boxShadow: '0 0 10px rgba(156, 39, 176, 0.5)',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(180deg, #7b1fa2 0%, #4a148c 100%)',
          },
        }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Activity size={20} />
            System Monitoring
          </Typography>
          
          <Stack spacing={2}>
            {alerts.map((alert) => (
              <Paper 
                key={alert.id} 
                sx={{ 
                  p: 2, 
                  border: `1px solid ${getSeverityColor(alert.severity)}`,
                  opacity: alert.acknowledged ? 0.6 : 1
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {alert.type.toUpperCase()} ALERT
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {alert.message}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Chip 
                        label={alert.severity} 
                        size="small" 
                        sx={{ 
                          backgroundColor: getSeverityColor(alert.severity),
                          color: 'white'
                        }}
                      />
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      {new Date(alert.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                  
                  {!alert.acknowledged && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      ACK
                    </Button>
                  )}
                </Box>
              </Paper>
            ))}
          </Stack>

          {/* Analytics Summary */}
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp size={20} />
              Analytics Summary
            </Typography>
            
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Total Events:</Typography>
                <Typography variant="body2" fontWeight="bold">{events.length}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Active Alerts:</Typography>
                <Typography variant="body2" fontWeight="bold" color="error.main">
                  {unacknowledgedAlerts.length}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Critical Events:</Typography>
                <Typography variant="body2" fontWeight="bold" color="error.main">
                  {events.filter(e => e.severity === 'critical').length}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
    </ThemeProvider>
  );
};

export default TimeMapApplication;
