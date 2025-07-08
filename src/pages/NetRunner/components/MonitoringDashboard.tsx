/**
 * MonitoringDashboard.tsx
 * 
 * Component for active monitoring of intelligence sources.
 * This dashboard connects to the MonitoringSystem to provide real-time
 * monitoring of targets, events, and alerts.
 */

import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Tabs,
  Tab,
  Grid,
  CardHeader,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Alert,
  LinearProgress
} from '@mui/material';
import { 
  Clock, 
  Bell, 
  AlertTriangle,
  Eye,
  Play,
  Pause,
  Trash2,
  Plus,
  Target,
  Activity,
  Radar,
  CheckCircle,
  Filter,
  PlusCircle,
  Edit,
  RefreshCw,
  Calendar,
  Search,
  ExternalLink
} from 'lucide-react';

import { IntelType } from '../tools/NetRunnerPowerTools';
import { 
  MonitoringSystem, 
  MonitoringTarget, 
  MonitoringEvent, 
  MonitoringAlert,
  EntityType,
  monitoringSystem
} from '../monitoring/MonitoringSystem';

// Interface for component props
interface MonitoringDashboardProps {
  onTargetSelect?: (targetId: string) => void;
}

// Interface for monitoring results
interface MonitorResult {
  id: string;
  monitorId: string;
  timestamp: string;
  significance: number;
  summary: string;
  detailedReport?: string;
  entities: string[];
  source: string;
}

// Interface for monitors
interface Monitor {
  id: string;
  name: string;
  description: string;
  target: string;
  intelTypes: string[];
  frequency: string;
  lastRun: string;
  nextRun: string;
  status: 'active' | 'inactive' | 'paused' | 'error';
  notifications: boolean;
  alertThreshold: number;
  resultsCount: number;
  lastResults?: MonitorResult[];
}

/**
 * MonitoringDashboard Component
 * 
 * NOTE: This component has some broken/duplicate content. 
 * The first definition was incomplete and is commented out.
 * Using the second complete definition below.
 */
/*
const MonitoringDashboard_OLD: React.FC<MonitoringDashboardProps> = ({ onTargetSelect }) => {
  // State management
  const [activeTab, setActiveTab] = useState<number>(0);
  const [targets, setTargets] = useState<MonitoringTarget[]>([]);
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<MonitoringTarget | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MonitoringEvent | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<MonitoringAlert | null>(null);
  const [showAddTargetDialog, setShowAddTargetDialog] = useState<boolean>(false);
  const [newTarget, setNewTarget] = useState<Partial<MonitoringTarget>>({
    name: '',
    type: 'person',
    category: 'person',
    priority: 'medium',
    description: '',
    identifiers: {},
    monitoringParams: {
      frequency: 60,
      sources: [],
      keywords: [],
      startDate: new Date().toISOString(),
      depth: 'standard'
    },
    tags: [],
    createdBy: 'current-user',
    active: true
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Initialize and load data
  useEffect(() => {
    // Initialize the monitoring system
    monitoringSystem.initialize();

    // Set up notification handler
    monitoringSystem.setNotificationCallback((alert) => {
      // In a real app, this would show a notification
      console.log('New alert:', alert);
      refreshData();
    });

    // Load initial data
    refreshData();

    // Cleanup on unmount
    return () => {
      monitoringSystem.stopCollection();
    };
  }, []);
  
  // Placeholder return - this component definition is incomplete
  return <div>Monitoring Dashboard</div>;
};
*/ 

// Sample monitors
const sampleMonitors: Monitor[] = [
  {
    id: 'mon-1',
    name: 'Corporate Security Threats',
    description: 'Monitor for security threats targeting major corporations',
    target: 'corporate security breach vulnerability',
    intelTypes: ['threat', 'vulnerability'],
    frequency: 'hourly',
    lastRun: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    nextRun: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    status: 'active',
    notifications: true,
    alertThreshold: 0.7,
    resultsCount: 17,
    lastResults: [
      {
        id: 'res-1',
        monitorId: 'mon-1',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        significance: 0.85,
        summary: 'New vulnerability discovered in widely used corporate VPN solution',
        entities: ['VPN', 'CVE-2025-2789'],
        source: 'Security Advisory'
      },
      {
        id: 'res-2',
        monitorId: 'mon-1',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        significance: 0.72,
        summary: 'Increase in phishing campaigns targeting financial executives',
        entities: ['Phishing', 'Finance', 'Executives'],
        source: 'Threat Intelligence Feed'
      }
    ]
  },
  {
    id: 'mon-2',
    name: 'Crypto Market Movements',
    description: 'Monitor for significant movements in cryptocurrency markets',
    target: 'cryptocurrency market movements significant',
    intelTypes: ['financial'],
    frequency: 'continuous',
    lastRun: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    nextRun: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    status: 'active',
    notifications: true,
    alertThreshold: 0.8,
    resultsCount: 42,
    lastResults: [
      {
        id: 'res-3',
        monitorId: 'mon-2',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        significance: 0.65,
        summary: 'Bitcoin volatility increased following regulatory announcement',
        entities: ['Bitcoin', 'Regulation', 'Volatility'],
        source: 'Financial News'
      }
    ]
  },
  {
    id: 'mon-3',
    name: 'Dark Web Mentions',
    description: 'Monitor for mentions of target organizations on dark web forums',
    target: 'starcom blockchain "cyber collective"',
    intelTypes: ['darkweb', 'threat'],
    frequency: 'daily',
    lastRun: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    nextRun: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
    status: 'paused',
    notifications: false,
    alertThreshold: 0.6,
    resultsCount: 3
  },
  {
    id: 'mon-4',
    name: 'Infrastructure Changes',
    description: 'Monitor for changes to critical digital infrastructure',
    target: 'infrastructure changes DNS BGP routing',
    intelTypes: ['infrastructure', 'network'],
    frequency: 'daily',
    lastRun: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    nextRun: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    status: 'error',
    notifications: true,
    alertThreshold: 0.5,
    resultsCount: 8
  }
];

interface MonitoringDashboardProps {
  onCreateMonitor?: (monitor: Omit<Monitor, 'id' | 'status' | 'resultsCount'>) => void;
  onDeleteMonitor?: (monitorId: string) => void;
  onToggleMonitor?: (monitorId: string, active: boolean) => void;
  renderAdvancedPanel?: () => React.ReactNode;
}

/**
 * MonitoringDashboard displays active monitors and their results
 */
const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  onCreateMonitor,
  onDeleteMonitor,
  onToggleMonitor,
  renderAdvancedPanel
}) => {
  // Monitor state
  const [monitors, setMonitors] = useState<Monitor[]>(sampleMonitors);
  const [showNewMonitor, setShowNewMonitor] = useState<boolean>(false);
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
  
  // New monitor form state
  const [newMonitorName, setNewMonitorName] = useState<string>('');
  const [newMonitorDesc, setNewMonitorDesc] = useState<string>('');
  const [newMonitorTarget, setNewMonitorTarget] = useState<string>('');
  const [newMonitorFreq, setNewMonitorFreq] = useState<'continuous' | 'hourly' | 'daily' | 'weekly'>('daily');
  const [newMonitorNotify, setNewMonitorNotify] = useState<boolean>(true);
  const [newMonitorThreshold, setNewMonitorThreshold] = useState<number>(0.7);
  const [newMonitorIntelTypes, setNewMonitorIntelTypes] = useState<IntelType[]>(['threat']);
  
  // Handle creating a new monitor
  const handleCreateMonitor = () => {
    const newMonitor: Omit<Monitor, 'id' | 'status' | 'resultsCount'> = {
      name: newMonitorName,
      description: newMonitorDesc,
      target: newMonitorTarget,
      intelTypes: newMonitorIntelTypes,
      frequency: newMonitorFreq,
      lastRun: new Date().toISOString(),
      nextRun: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Next hour
      notifications: newMonitorNotify,
      alertThreshold: newMonitorThreshold,
      lastResults: []
    };
    
    if (onCreateMonitor) {
      onCreateMonitor(newMonitor);
    }
    
    // Reset form
    setNewMonitorName('');
    setNewMonitorDesc('');
    setNewMonitorTarget('');
    setNewMonitorFreq('daily');
    setNewMonitorNotify(true);
    setNewMonitorThreshold(0.7);
    setNewMonitorIntelTypes(['threat']);
    setShowNewMonitor(false);
  };
  
  // Handle monitor toggle
  const handleToggleMonitor = (monitorId: string) => {
    const monitor = monitors.find(m => m.id === monitorId);
    if (!monitor) return;
    
    const newStatus = monitor.status === 'active' ? 'paused' : 'active';
    
    if (onToggleMonitor) {
      onToggleMonitor(monitorId, newStatus === 'active');
    }
    
    // Update local state
    setMonitors(monitors.map(m => 
      m.id === monitorId ? { ...m, status: newStatus } : m
    ));
  };
  
  // Handle monitor deletion
  const handleDeleteMonitor = (monitorId: string) => {
    if (onDeleteMonitor) {
      onDeleteMonitor(monitorId);
    }
    
    // Update local state
    setMonitors(monitors.filter(m => m.id !== monitorId));
    if (selectedMonitor?.id === monitorId) {
      setSelectedMonitor(null);
    }
  };
  
  // Format time remaining
  const formatTimeRemaining = (nextRunTime: string) => {
    const nextRun = new Date(nextRunTime).getTime();
    const now = Date.now();
    const diffMs = nextRun - now;
    
    if (diffMs <= 0) return 'Running...';
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    } else {
      return `${diffMins}m`;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <Box>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
            <Clock size={20} style={{ marginRight: '8px' }} />
            Active Monitoring
            <Chip 
              label={`${monitors.filter(m => m.status === 'active').length} Active`} 
              size="small" 
              color="primary"
              sx={{ ml: 2 }} 
            />
          </Typography>
          
          <Box>
            <Button 
              variant="contained"
              size="small"
              onClick={() => setShowNewMonitor(true)}
              startIcon={<Plus size={16} />}
              disabled={showNewMonitor}
            >
              New Monitor
            </Button>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Set up continuous monitoring for specific targets, keywords, or data sources.
          Receive alerts when new intelligence is available.
        </Typography>
        
        {/* New Monitor Form */}
        {showNewMonitor && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Create New Monitor</Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Monitor Name"
                  fullWidth
                  value={newMonitorName}
                  onChange={(e) => setNewMonitorName(e.target.value)}
                  size="small"
                />
                
                <TextField
                  label="Description"
                  fullWidth
                  value={newMonitorDesc}
                  onChange={(e) => setNewMonitorDesc(e.target.value)}
                  size="small"
                />
                
                <TextField
                  label="Target (search terms, domain, etc.)"
                  fullWidth
                  value={newMonitorTarget}
                  onChange={(e) => setNewMonitorTarget(e.target.value)}
                  size="small"
                />
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    select
                    label="Frequency"
                    value={newMonitorFreq}
                    onChange={(e) => setNewMonitorFreq(e.target.value as 'continuous' | 'hourly' | 'daily' | 'weekly')}
                    size="small"
                    sx={{ minWidth: 150 }}
                  >
                    <option value="continuous">Continuous</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </TextField>
                  
                  <TextField
                    label="Alert Threshold"
                    type="number"
                    value={newMonitorThreshold}
                    onChange={(e) => setNewMonitorThreshold(Number(e.target.value))}
                    size="small"
                    inputProps={{ min: 0, max: 1, step: 0.1 }}
                    sx={{ width: 150 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={newMonitorNotify}
                        onChange={(e) => setNewMonitorNotify(e.target.checked)}
                      />
                    }
                    label="Notifications"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ width: '100%', mb: 1 }}>Intel Types:</Typography>
                  {(['identity', 'network', 'financial', 'geospatial', 'social', 'infrastructure', 'vulnerability', 'darkweb', 'threat', 'temporal'] as IntelType[]).map(type => (
                    <Chip
                      key={type}
                      label={type}
                      onClick={() => {
                        if (newMonitorIntelTypes.includes(type)) {
                          setNewMonitorIntelTypes(newMonitorIntelTypes.filter(t => t !== type));
                        } else {
                          setNewMonitorIntelTypes([...newMonitorIntelTypes, type]);
                        }
                      }}
                      color={newMonitorIntelTypes.includes(type) ? 'primary' : 'default'}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                  <Button 
                    variant="outlined"
                    onClick={() => setShowNewMonitor(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained"
                    onClick={handleCreateMonitor}
                    disabled={!newMonitorName || !newMonitorTarget || newMonitorIntelTypes.length === 0}
                  >
                    Create Monitor
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
        
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Monitor List */}
          <Box sx={{ flex: 2 }}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Monitor</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Frequency</TableCell>
                    <TableCell>Next Run</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monitors.map(monitor => (
                    <TableRow 
                      key={monitor.id}
                      onClick={() => setSelectedMonitor(monitor)}
                      selected={selectedMonitor?.id === monitor.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {monitor.notifications && (
                            <Badge color="error" variant="dot" sx={{ mr: 1 }}>
                              <Bell size={16} />
                            </Badge>
                          )}
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {monitor.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {monitor.intelTypes.join(', ')}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {monitor.target}
                        </Typography>
                      </TableCell>
                      <TableCell>{monitor.frequency}</TableCell>
                      <TableCell>
                        {monitor.nextRun ? (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            <Clock size={14} style={{ marginRight: 4 }} />
                            {formatTimeRemaining(monitor.nextRun)}
                          </Typography>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={monitor.status}
                          color={
                            monitor.status === 'active' ? 'success' :
                            monitor.status === 'paused' ? 'default' : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex' }}>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMonitor(monitor.id);
                            }}
                          >
                            {monitor.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMonitor(monitor.id);
                            }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          
          {/* Monitor Details */}
          <Box sx={{ flex: 1 }}>
            {selectedMonitor ? (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6">{selectedMonitor.name}</Typography>
                    <Chip
                      size="small"
                      label={selectedMonitor.status}
                      color={
                        selectedMonitor.status === 'active' ? 'success' :
                        selectedMonitor.status === 'paused' ? 'default' : 'error'
                      }
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {selectedMonitor.description}
                  </Typography>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Target:</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.05)', p: 1, borderRadius: 1 }}>
                      {selectedMonitor.target}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle2">Frequency:</Typography>
                      <Typography variant="body2">{selectedMonitor.frequency}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Notifications:</Typography>
                      <Typography variant="body2">{selectedMonitor.notifications ? 'Enabled' : 'Disabled'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Alert Threshold:</Typography>
                      <Typography variant="body2">{selectedMonitor.alertThreshold}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Results Count:</Typography>
                      <Typography variant="body2">{selectedMonitor.resultsCount}</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Intel Types:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {selectedMonitor.intelTypes.map(type => (
                        <Chip key={type} label={type} size="small" />
                      ))}
                    </Box>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Recent Results</Typography>
                  
                  {selectedMonitor.lastResults && selectedMonitor.lastResults.length > 0 ? (
                    <List sx={{ bgcolor: 'background.paper' }}>
                      {selectedMonitor.lastResults.map(result => (
                        <ListItem 
                          key={result.id}
                          sx={{ 
                            border: '1px solid rgba(0,0,0,0.1)', 
                            borderRadius: 1, 
                            mb: 1 
                          }}
                          secondaryAction={
                            <Chip 
                              size="small" 
                              label={`${(result.significance * 100).toFixed(0)}%`}
                              color={result.significance > selectedMonitor.alertThreshold ? 'error' : 'default'}
                            />
                          }
                        >
                          <ListItemIcon>
                            {result.significance > selectedMonitor.alertThreshold ? 
                              <AlertTriangle color="error" /> : 
                              <Activity />
                            }
                          </ListItemIcon>
                          <ListItemText 
                            primary={result.summary}
                            secondary={
                              <React.Fragment>
                                <Typography variant="caption" display="block" color="text.secondary">
                                  Source: {result.source} | {formatDate(result.timestamp)}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  {result.entities.map(entity => (
                                    <Chip key={entity} label={entity} size="small" variant="outlined" />
                                  ))}
                                </Box>
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        No results available
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<Eye size={16} />}
                      size="small"
                    >
                      View All Results
                    </Button>
                  </Box>
                </CardContent>
              </Card>
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
                <Target size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>Select a Monitor</Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Choose a monitor from the list to view details and results
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Render the advanced monitoring panel if provided */}
      {renderAdvancedPanel && renderAdvancedPanel()}
    </Box>
  );
};

export default MonitoringDashboard;
