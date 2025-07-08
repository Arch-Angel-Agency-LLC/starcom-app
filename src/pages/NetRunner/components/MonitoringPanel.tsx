/**
 * MonitoringPanel.tsx
 * 
 * Enhanced monitoring panel that interfaces with the MonitoringSystem.
 * This provides advanced monitoring capabilities for the NetRunner system.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Tooltip,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Radar,
  Eye,
  Bell,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  PlusCircle,
  Trash2,
  Edit,
  RefreshCw,
  Calendar,
  Search
} from 'lucide-react';

import { 
  MonitoringSystem, 
  MonitoringTarget, 
  MonitoringEvent, 
  MonitoringAlert,
  EntityType,
  monitoringSystem
} from '../monitoring/MonitoringSystem';

// Interface for component props
interface MonitoringPanelProps {
  onTargetSelect?: (targetId: string) => void;
}

/**
 * MonitoringPanel Component
 * 
 * Advanced monitoring interface that connects to the MonitoringSystem
 * to provide real-time monitoring of targets, events, and alerts.
 */
const MonitoringPanel: React.FC<MonitoringPanelProps> = ({ onTargetSelect }) => {
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

  // Refresh all data from the monitoring system
  const refreshData = () => {
    setIsLoading(true);
    setStatusMessage('Refreshing data...');

    // Get targets
    const targetManager = monitoringSystem.getTargetManager();
    setTargets(targetManager.getAllTargets());

    // Get events
    const eventProcessor = monitoringSystem.getEventProcessor();
    setEvents(eventProcessor.getAllEvents());

    // Get alerts
    const alertProcessor = monitoringSystem.getAlertProcessor();
    setAlerts(alertProcessor.getAllAlerts());

    setIsLoading(false);
    setStatusMessage('');
  };

  // Handle tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle target selection
  const handleTargetSelect = (target: MonitoringTarget) => {
    setSelectedTarget(target);
    if (onTargetSelect) {
      onTargetSelect(target.id);
    }

    // Load target-specific events and alerts
    const eventProcessor = monitoringSystem.getEventProcessor();
    const targetEvents = eventProcessor.getTargetEvents(target.id);
    setEvents(targetEvents);

    const alertProcessor = monitoringSystem.getAlertProcessor();
    const targetAlerts = alertProcessor.getTargetAlerts(target.id);
    setAlerts(targetAlerts);
  };

  // Add new target
  const handleAddTarget = () => {
    if (!newTarget.name) {
      setStatusMessage('Target name is required');
      return;
    }

    const targetManager = monitoringSystem.getTargetManager();
    const target = targetManager.createTarget(newTarget as any);
    
    refreshData();
    setShowAddTargetDialog(false);
    setNewTarget({
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
    
    setStatusMessage(`Target "${target.name}" added successfully`);
  };

  // Run manual collection for a target
  const handleRunManualCollection = (targetId: string) => {
    setIsLoading(true);
    setStatusMessage('Running manual collection...');
    
    monitoringSystem.runManualCollection(targetId);
    
    // Wait a moment to simulate collection process
    setTimeout(() => {
      refreshData();
      setIsLoading(false);
      setStatusMessage('Manual collection completed');
    }, 1500);
  };

  // Acknowledge an alert
  const handleAcknowledgeAlert = (alertId: string) => {
    const alertProcessor = monitoringSystem.getAlertProcessor();
    alertProcessor.updateAlert(alertId, { 
      state: 'acknowledged',
      assignedTo: 'current-user'
    });
    refreshData();
  };

  // Resolve an alert
  const handleResolveAlert = (alertId: string) => {
    const alertProcessor = monitoringSystem.getAlertProcessor();
    alertProcessor.updateAlert(alertId, { 
      state: 'resolved',
      resolvedAt: new Date().toISOString(),
      resolvedBy: 'current-user'
    });
    refreshData();
  };

  // Render the targets panel
  const renderTargetsPanel = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Monitoring Targets</Typography>
        <Button 
          variant="contained" 
          startIcon={<PlusCircle size={18} />}
          onClick={() => setShowAddTargetDialog(true)}
        >
          Add Target
        </Button>
      </Box>

      {targets.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No monitoring targets configured. Add a target to begin monitoring.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {targets.map((target) => (
            <Grid item xs={12} md={6} lg={4} key={target.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: selectedTarget?.id === target.id ? '2px solid #3f51b5' : 'none' 
                }}
                onClick={() => handleTargetSelect(target)}
              >
                <CardHeader
                  title={target.name}
                  subheader={`${target.type} • ${target.category}`}
                  action={
                    <Box>
                      <Chip 
                        size="small" 
                        label={target.priority} 
                        color={
                          target.priority === 'critical' ? 'error' :
                          target.priority === 'high' ? 'warning' :
                          target.priority === 'medium' ? 'info' : 'default'
                        }
                        sx={{ mr: 1 }}
                      />
                      <Tooltip title="Run Manual Collection">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRunManualCollection(target.id);
                          }}
                        >
                          <RefreshCw size={18} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {target.description || 'No description provided'}
                  </Typography>
                  
                  <Box mt={1}>
                    <Typography variant="caption" display="block">
                      Monitoring since: {new Date(target.created).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Sources: {target.monitoringParams.sources.length || 'None configured'}
                    </Typography>
                  </Box>
                  
                  <Box mt={1} display="flex" justifyContent="space-between" alignItems="center">
                    <FormControlLabel
                      control={
                        <Switch 
                          size="small" 
                          checked={target.active} 
                          onChange={(e) => {
                            e.stopPropagation();
                            const targetManager = monitoringSystem.getTargetManager();
                            targetManager.updateTarget(target.id, { active: e.target.checked });
                            refreshData();
                          }}
                        />
                      }
                      label="Active"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <Box>
                      {target.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Target Dialog */}
      <Dialog open={showAddTargetDialog} onClose={() => setShowAddTargetDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Monitoring Target</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Target Name"
                fullWidth
                required
                value={newTarget.name}
                onChange={(e) => setNewTarget({...newTarget, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Target Type</InputLabel>
                <Select
                  value={newTarget.type}
                  label="Target Type"
                  onChange={(e) => setNewTarget({
                    ...newTarget, 
                    type: e.target.value as EntityType,
                    category: e.target.value as 'person' | 'organization' | 'system' | 'location' | 'digital' | 'custom'
                  })}
                >
                  <MenuItem value="person">Person</MenuItem>
                  <MenuItem value="organization">Organization</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                  <MenuItem value="location">Location</MenuItem>
                  <MenuItem value="digital">Digital Asset</MenuItem>
                  <MenuItem value="network">Network</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newTarget.priority}
                  label="Priority"
                  onChange={(e) => setNewTarget({
                    ...newTarget, 
                    priority: e.target.value as 'low' | 'medium' | 'high' | 'critical'
                  })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Monitoring Frequency (minutes)"
                type="number"
                fullWidth
                value={newTarget.monitoringParams?.frequency || 60}
                onChange={(e) => setNewTarget({
                  ...newTarget, 
                  monitoringParams: {
                    ...newTarget.monitoringParams as any,
                    frequency: parseInt(e.target.value)
                  }
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={newTarget.description}
                onChange={(e) => setNewTarget({...newTarget, description: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Keywords (comma separated)"
                fullWidth
                value={newTarget.monitoringParams?.keywords?.join(', ') || ''}
                onChange={(e) => setNewTarget({
                  ...newTarget, 
                  monitoringParams: {
                    ...newTarget.monitoringParams as any,
                    keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                  }
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Tags (comma separated)"
                fullWidth
                value={newTarget.tags?.join(', ') || ''}
                onChange={(e) => setNewTarget({
                  ...newTarget, 
                  tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddTargetDialog(false)}>Cancel</Button>
          <Button onClick={handleAddTarget} variant="contained">Add Target</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  // Render the events panel
  const renderEventsPanel = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          {selectedTarget ? `Events for ${selectedTarget.name}` : 'All Monitoring Events'}
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshCw size={18} />}
          onClick={refreshData}
        >
          Refresh
        </Button>
      </Box>

      {events.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No events recorded yet. Events will appear as monitoring progresses.
          </Typography>
        </Paper>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {events.map((event) => (
            <React.Fragment key={event.id}>
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  <Chip 
                    label={event.source} 
                    size="small" 
                    color="default" 
                    variant="outlined" 
                  />
                }
                sx={{ 
                  cursor: 'pointer',
                  bgcolor: selectedEvent?.id === event.id ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                }}
                onClick={() => setSelectedEvent(event)}
              >
                <ListItemIcon>
                  {event.alertGenerated ? (
                    <Badge color="error" variant="dot">
                      <AlertTriangle size={20} />
                    </Badge>
                  ) : (
                    <Eye size={20} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="subtitle2">{event.title}</Typography>
                      <Typography variant="caption">{new Date(event.timestamp).toLocaleString()}</Typography>
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.primary" component="span">
                        {event.description}
                      </Typography>
                      <Box mt={1}>
                        {event.intelTypes.map((type, index) => (
                          <Chip key={index} label={type} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                        <Chip 
                          label={event.type} 
                          size="small" 
                          sx={{ mr: 0.5, mb: 0.5 }} 
                          color="primary" 
                          variant="outlined" 
                        />
                        <Chip 
                          label={event.severity} 
                          size="small" 
                          sx={{ mr: 0.5, mb: 0.5 }} 
                          color={
                            event.severity === 'critical' ? 'error' :
                            event.severity === 'high' ? 'warning' :
                            event.severity === 'medium' ? 'info' : 'default'
                          }
                        />
                      </Box>
                    </>
                  }
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );

  // Render the alerts panel
  const renderAlertsPanel = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          {selectedTarget ? `Alerts for ${selectedTarget.name}` : 'All Monitoring Alerts'}
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshCw size={18} />}
          onClick={refreshData}
        >
          Refresh
        </Button>
      </Box>

      {alerts.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No alerts generated yet. Alerts will appear when significant events are detected.
          </Typography>
        </Paper>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {alerts.map((alert) => (
            <React.Fragment key={alert.id}>
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  <Box>
                    {alert.state === 'new' && (
                      <>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          sx={{ mr: 1 }}
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                        <Button 
                          size="small" 
                          variant="contained" 
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                      </>
                    )}
                    {alert.state === 'acknowledged' && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    )}
                    {alert.state === 'resolved' && (
                      <Chip label="Resolved" color="success" size="small" />
                    )}
                    {alert.state === 'false-positive' && (
                      <Chip label="False Positive" color="default" size="small" />
                    )}
                  </Box>
                }
                sx={{ 
                  cursor: 'pointer',
                  bgcolor: selectedAlert?.id === alert.id ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                }}
                onClick={() => setSelectedAlert(alert)}
              >
                <ListItemIcon>
                  {alert.state === 'resolved' ? (
                    <CheckCircle size={20} color="green" />
                  ) : (
                    <AlertTriangle 
                      size={20} 
                      color={
                        alert.severity === 'critical' ? 'red' :
                        alert.severity === 'high' ? 'orange' :
                        alert.severity === 'medium' ? 'blue' : 'gray'
                      } 
                    />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="subtitle2">{alert.title}</Typography>
                      <Typography variant="caption">{new Date(alert.timestamp).toLocaleString()}</Typography>
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.primary" component="span">
                        {alert.message}
                      </Typography>
                      <Box mt={1}>
                        <Chip 
                          label={alert.severity} 
                          size="small" 
                          sx={{ mr: 0.5, mb: 0.5 }} 
                          color={
                            alert.severity === 'critical' ? 'error' :
                            alert.severity === 'high' ? 'warning' :
                            alert.severity === 'medium' ? 'info' : 'default'
                          }
                        />
                        <Chip 
                          label={alert.state} 
                          size="small" 
                          sx={{ mr: 0.5, mb: 0.5 }} 
                          color={
                            alert.state === 'new' ? 'error' :
                            alert.state === 'acknowledged' ? 'warning' :
                            alert.state === 'resolved' ? 'success' : 'default'
                          }
                        />
                        {alert.assignedTo && (
                          <Chip 
                            label={`Assigned: ${alert.assignedTo}`} 
                            size="small" 
                            sx={{ mr: 0.5, mb: 0.5 }} 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </>
                  }
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );

  // Render the dashboard statistics
  const renderStatistics = () => (
    <Box mt={4}>
      <Typography variant="h6" gutterBottom>Dashboard Statistics</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Targets
              </Typography>
              <Typography variant="h3">
                {targets.filter(t => t.active).length}
              </Typography>
              <Typography variant="caption" display="block">
                of {targets.length} total targets
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Events (24h)
              </Typography>
              <Typography variant="h3">
                {events.filter(e => 
                  new Date(e.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
                ).length}
              </Typography>
              <Typography variant="caption" display="block">
                of {events.length} total events
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Alerts
              </Typography>
              <Typography variant="h3">
                {alerts.filter(a => 
                  a.state === 'new' || a.state === 'acknowledged'
                ).length}
              </Typography>
              <Typography variant="caption" display="block">
                of {alerts.length} total alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Critical Alerts
              </Typography>
              <Typography variant="h3">
                {alerts.filter(a => 
                  a.severity === 'critical' && 
                  (a.state === 'new' || a.state === 'acknowledged')
                ).length}
              </Typography>
              <Typography variant="caption" display="block" color="error">
                Requires immediate attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Radar size={24} style={{ marginRight: 8 }} />
        <Typography variant="h5">NetRunner Monitoring System</Typography>
      </Box>

      {statusMessage && (
        <Alert 
          severity={statusMessage.includes('success') ? 'success' : 'info'} 
          sx={{ mb: 2 }}
        >
          {statusMessage}
        </Alert>
      )}

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Target size={18} />} label="Targets" />
          <Tab icon={<Eye size={18} />} label="Events" />
          <Tab 
            icon={
              <Badge 
                badgeContent={alerts.filter(a => a.state === 'new').length} 
                color="error"
              >
                <Bell size={18} />
              </Badge>
            } 
            label="Alerts" 
          />
        </Tabs>
        <Box p={2}>
          {activeTab === 0 && renderTargetsPanel()}
          {activeTab === 1 && renderEventsPanel()}
          {activeTab === 2 && renderAlertsPanel()}
        </Box>
      </Paper>

      {renderStatistics()}
    </Box>
  );
};

export default MonitoringPanel;
