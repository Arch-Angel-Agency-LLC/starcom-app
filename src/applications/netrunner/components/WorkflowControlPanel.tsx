/**
 * WorkflowControlPanel.tsx
 * 
 * Component for creating, managing, and monitoring OSINT workflows in the NetRunner system.
 * Integrates with WorkflowEngine and WorkflowScheduler to enable bot automation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  LinearProgress,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { 
  Play, 
  Pause, 
  Plus, 
  Clock, 
  Calendar, 
  Check, 
  X,
  Trash2,
  Edit,
  RotateCw,
  PlusCircle,
  Bot,
  Activity,
  GitBranch
} from 'lucide-react';

import { LoggerFactory } from '../services/logging';
import { ErrorFactory, NETRUNNER_ERROR_CODES } from '../services/error';
import { 
  Workflow,
  WorkflowExecutionState,
  WorkflowEngine,
  sampleWorkflows
} from '../integration/WorkflowEngine';
import { WorkflowScheduler, ScheduledJob } from '../integration/WorkflowScheduler';
import { OsintBot } from '../integration/BotRosterIntegration';
import { NetRunnerTool } from '../tools/NetRunnerPowerTools';

interface WorkflowControlPanelProps {
  bots: OsintBot[];
  tools: NetRunnerTool[];
  workflowEngine?: WorkflowEngine;
  workflowScheduler?: WorkflowScheduler;
}

const WorkflowControlPanel: React.FC<WorkflowControlPanelProps> = ({
  bots,
  tools,
  workflowEngine: propsWorkflowEngine,
  workflowScheduler: propsWorkflowScheduler
}) => {
  // Initialize logging and notifications
  const logger = LoggerFactory.getLogger('WorkflowControlPanel');
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'warning' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Show notification helper
  const showNotification = (message: string, severity: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    setNotification({ open: true, message, severity });
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Initialize workflow engine and scheduler if not provided
  const [workflowEngine] = useState<WorkflowEngine>(() => 
    propsWorkflowEngine || new WorkflowEngine(bots, tools)
  );
  
  const [workflowScheduler] = useState<WorkflowScheduler>(() => 
    propsWorkflowScheduler || new WorkflowScheduler(workflowEngine)
  );
  
  // Initialize with sample workflows if empty
  useEffect(() => {
    if (workflowEngine.getWorkflows().length === 0) {
      // Configure sample workflows with real tool and bot IDs
      const configuredWorkflows = sampleWorkflows.map(workflow => {
        // Assign bot IDs
        const workflowWithBots = {
          ...workflow,
          botIds: bots.slice(0, 2).map(bot => bot.id)
        };
        
        // Assign tool IDs to steps
        if (workflowWithBots.steps) {
          workflowWithBots.steps = workflowWithBots.steps.map((step, index) => {
            // Assign a compatible tool based on the step's purpose
            let toolId = '';
            
            if (step.name.includes('Reconnaissance') || step.name.includes('Domain')) {
              toolId = tools.find(t => t.name.includes('Shodan'))?.id || '';
            } else if (step.name.includes('Email') || step.name.includes('Harvesting')) {
              toolId = tools.find(t => t.name.includes('Harvester'))?.id || '';
            } else if (step.name.includes('Intelligence') || step.name.includes('Analysis')) {
              toolId = tools.find(t => t.name.includes('Analyzer'))?.id || '';
            } else if (step.name.includes('Vulnerability') || step.name.includes('Scanning')) {
              toolId = tools.find(t => t.name.includes('Shodan'))?.id || '';
            } else if (step.name.includes('Dark Web') || step.name.includes('Monitoring')) {
              toolId = tools.find(t => t.name.includes('Dark'))?.id || '';
            } else {
              // Default to the first tool if no match
              toolId = tools[0]?.id || '';
            }
            
            // Set dependencies to previous steps where appropriate
            const dependsOn: string[] = [];
            if (index > 0 && step.name.includes('Analysis')) {
              // Analysis steps typically depend on data collection steps
              dependsOn.push(workflowWithBots.steps?.[0].id || '');
              if (index > 1) {
                dependsOn.push(workflowWithBots.steps?.[1].id || '');
              }
            }
            
            return {
              ...step,
              toolId,
              dependsOn: dependsOn.length > 0 ? dependsOn : step.dependsOn
            };
          });
        }
        
        return workflowWithBots;
      });
      
      // Create the workflows
      configuredWorkflows.forEach(workflow => {
        workflowEngine.createWorkflow(workflow);
      });
    }
    
    // Initialize the scheduler
    workflowScheduler.initialize();
    
    // Cleanup on unmount
    return () => {
      workflowScheduler.shutdown();
    };
  }, [workflowEngine, workflowScheduler, bots, tools]);
  
  // State
  const [activeTab, setActiveTab] = useState<number>(0);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [executionStates, setExecutionStates] = useState<WorkflowExecutionState[]>([]);
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  
  // Refresh data
  const refreshData = useCallback(() => {
    setIsLoading(true);
    setWorkflows(workflowEngine.getWorkflows());
    
    if (selectedWorkflow) {
      const executions = workflowEngine.getWorkflowExecutions(selectedWorkflow.id);
      setExecutionStates(executions);
      
      const jobs = workflowScheduler.getWorkflowJobs(selectedWorkflow.id);
      setScheduledJobs(jobs);
    }
    
    setIsLoading(false);
  }, [workflowEngine, workflowScheduler, selectedWorkflow]);
  
  // Initial data load
  useEffect(() => {
    refreshData();
  }, [selectedWorkflow, refreshData]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle workflow selection
  const handleSelectWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
  };
  
  // Handle workflow creation
  const handleCreateWorkflow = () => {
    setDialogMode('create');
    setDialogOpen(true);
  };
  
  // Handle workflow editing
  const handleEditWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setDialogMode('edit');
    setDialogOpen(true);
  };
  
  // Handle workflow execution
  const handleRunWorkflow = (workflowId: string) => {
    try {
      setIsLoading(true);
      
      logger.info('Initiating workflow execution', { 
        workflowId,
        source: 'manual_trigger'
      });
      
      const job = workflowScheduler.runWorkflowNow(workflowId);
      if (job) {
        logger.info('Workflow scheduled for immediate execution', { 
          workflowId, 
          jobId: job.id 
        });
        showNotification('Workflow started successfully', 'success');
      } else {
        throw ErrorFactory.createWorkflowError(
          'Failed to schedule workflow for execution',
          NETRUNNER_ERROR_CODES.WORKFLOW_STEP_FAILED,
          { details: { workflowId } }
        );
      }
      
      setTimeout(refreshData, 500);
    } catch (error) {
      logger.error('Workflow execution failed', error);
      showNotification(
        error instanceof Error ? error.message : 'Failed to start workflow', 
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle workflow activation/deactivation
  const handleToggleWorkflowStatus = (workflow: Workflow) => {
    try {
      const newStatus = workflow.status === 'active' ? 'inactive' : 'active';
      
      logger.info('Toggling workflow status', { 
        workflowId: workflow.id,
        workflowName: workflow.name,
        fromStatus: workflow.status,
        toStatus: newStatus
      });
      
      const updated = workflowEngine.updateWorkflow(workflow.id, { status: newStatus });
      
      if (updated) {
        if (newStatus === 'inactive') {
          workflowScheduler.cancelWorkflowJobs(workflow.id);
          logger.info('Workflow deactivated and jobs cancelled', { workflowId: workflow.id });
        } else if (workflow.schedule) {
          workflowScheduler.scheduleWorkflow(workflow.id, workflow.schedule);
          logger.info('Workflow activated and scheduled', { 
            workflowId: workflow.id,
            schedule: workflow.schedule 
          });
        }
        
        showNotification(
          `Workflow ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 
          'success'
        );
        refreshData();
      } else {
        throw ErrorFactory.createWorkflowError(
          'Failed to update workflow status',
          NETRUNNER_ERROR_CODES.WORKFLOW_STEP_FAILED,
          { details: { workflowId: workflow.id, newStatus } }
        );
      }
    } catch (error) {
      logger.error('Failed to toggle workflow status', error);
      showNotification('Failed to update workflow status', 'error');
    }
  };
  
  // Handle workflow deletion
  const handleDeleteWorkflow = (workflowId: string) => {
    try {
      logger.info('Deleting workflow', { workflowId });
      
      workflowScheduler.cancelWorkflowJobs(workflowId);
      workflowEngine.deleteWorkflow(workflowId);
      
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(null);
      }
      
      logger.info('Workflow deleted successfully', { workflowId });
      showNotification('Workflow deleted', 'success');
      refreshData();
    } catch (error) {
      logger.error('Failed to delete workflow', error);
      showNotification('Failed to delete workflow', 'error');
    }
  };
  
  // Determine if a workflow is running
  const isWorkflowRunning = (workflowId: string): boolean => {
    return scheduledJobs.some(job => 
      job.workflowId === workflowId && job.status === 'running'
    );
  };
  
  // Get execution progress for a workflow
  const getExecutionProgress = (workflowId: string): number => {
    const runningExecution = executionStates.find(
      exec => exec.workflowId === workflowId && exec.status === 'running'
    );
    
    return runningExecution ? runningExecution.progress : 0;
  };
  
  // Dialog close handler
  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  
  return (
    <Box>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
            <Activity size={20} style={{ marginRight: '8px' }} />
            Workflow Automation
            <Chip 
              label={`${workflows.filter(w => w.status === 'active').length} Active`} 
              size="small" 
              color="primary"
              sx={{ ml: 2 }} 
            />
          </Typography>
          
          <Box>
            <Button 
              variant="contained"
              size="small"
              startIcon={<PlusCircle size={16} />}
              onClick={handleCreateWorkflow}
            >
              New Workflow
            </Button>
          </Box>
        </Box>
        
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Create and manage automated intelligence gathering workflows using OSINT bots and tools.
          Schedule recurring tasks, define multi-step processes, and integrate with the Intelligence Exchange.
        </Typography>
        
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Workflows" />
          <Tab label="Executions" />
          <Tab label="Schedule" />
        </Tabs>
        
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          {/* Workflow List */}
          <Box sx={{ width: { xs: '100%', md: '35%' } }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              {activeTab === 0 ? 'Available Workflows' : 
               activeTab === 1 ? 'Execution History' : 'Scheduled Tasks'}
            </Typography>
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                {activeTab === 0 && workflows.map(workflow => (
                  <Card 
                    key={workflow.id}
                    sx={{ 
                      mb: 2,
                      cursor: 'pointer',
                      borderLeft: selectedWorkflow?.id === workflow.id ? '4px solid #1976d2' : 'none',
                      bgcolor: workflow.status === 'active' ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                    }}
                    onClick={() => handleSelectWorkflow(workflow)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <GitBranch size={20} style={{ marginRight: '8px' }} />
                          <Typography variant="h6">{workflow.name}</Typography>
                        </Box>
                        <Box>
                          <IconButton 
                            color={workflow.status === 'active' ? "primary" : "default"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWorkflowStatus(workflow);
                            }}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            {workflow.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                          </IconButton>
                          <IconButton 
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRunWorkflow(workflow.id);
                            }}
                            size="small"
                            disabled={isWorkflowRunning(workflow.id)}
                          >
                            <RotateCw size={18} />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {workflow.description}
                      </Typography>
                      
                      {isWorkflowRunning(workflow.id) && (
                        <Box sx={{ width: '100%', mb: 2 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={getExecutionProgress(workflow.id)}
                            sx={{ height: 6, borderRadius: 1 }}
                          />
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                            Execution in progress: {getExecutionProgress(workflow.id)}%
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        <Chip 
                          size="small" 
                          label={`${workflow.steps.length} Steps`}
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                        <Chip 
                          size="small" 
                          label={workflow.parallelExecution ? 'Parallel' : 'Sequential'}
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                        {workflow.schedule && (
                          <Chip 
                            size="small" 
                            icon={<Clock size={14} />}
                            label={workflow.schedule.type === 'once' ? 'One-time' : 'Recurring'}
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Chip 
                          size="small"
                          label={`${workflow.botIds.length} bots assigned`}
                          icon={<Bot size={14} />}
                        />
                        
                        {workflow.lastRun && (
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            <Clock size={14} style={{ marginRight: '4px' }} />
                            Last run: {new Date(workflow.lastRun).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
                
                {activeTab === 1 && executionStates.map(execution => (
                  <Card key={execution.executionId} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1">
                          Execution {execution.executionId.substring(0, 8)}
                        </Typography>
                        <Chip 
                          size="small"
                          label={execution.status}
                          color={
                            execution.status === 'completed' ? 'success' :
                            execution.status === 'failed' ? 'error' :
                            execution.status === 'cancelled' ? 'warning' : 'primary'
                          }
                        />
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Started: {new Date(execution.startTime).toLocaleString()}
                      </Typography>
                      
                      {execution.endTime && (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          Completed: {new Date(execution.endTime).toLocaleString()}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip 
                          size="small" 
                          label={`${execution.completedSteps.length} Completed`}
                          icon={<Check size={14} />}
                        />
                        {execution.failedSteps.length > 0 && (
                          <Chip 
                            size="small" 
                            label={`${execution.failedSteps.length} Failed`}
                            icon={<X size={14} />}
                            color="error"
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
                
                {activeTab === 2 && scheduledJobs.map(job => (
                  <Card key={job.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1">
                          {job.recurrence ? 'Recurring Job' : 'One-time Job'}
                        </Typography>
                        <Chip 
                          size="small"
                          label={job.status}
                          color={
                            job.status === 'completed' ? 'success' :
                            job.status === 'failed' ? 'error' :
                            job.status === 'cancelled' ? 'warning' :
                            job.status === 'running' ? 'primary' : 'default'
                          }
                        />
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Scheduled: {new Date(job.scheduledTime).toLocaleString()}
                      </Typography>
                      
                      {job.started && (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          Started: {new Date(job.started).toLocaleString()}
                        </Typography>
                      )}
                      
                      {job.completed && (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          Completed: {new Date(job.completed).toLocaleString()}
                        </Typography>
                      )}
                      
                      {job.status === 'pending' && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                          <Button 
                            size="small" 
                            color="error"
                            startIcon={<X size={14} />}
                            onClick={() => workflowScheduler.cancelJob(job.id)}
                          >
                            Cancel
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {/* Empty states */}
                {activeTab === 0 && workflows.length === 0 && (
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="body1">No workflows available</Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<Plus size={16} />} 
                      onClick={handleCreateWorkflow}
                      sx={{ mt: 2 }}
                    >
                      Create Workflow
                    </Button>
                  </Box>
                )}
                
                {activeTab === 1 && (!selectedWorkflow || executionStates.length === 0) && (
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="body1">
                      {selectedWorkflow 
                        ? 'No execution history for this workflow' 
                        : 'Select a workflow to view execution history'}
                    </Typography>
                  </Box>
                )}
                
                {activeTab === 2 && (!selectedWorkflow || scheduledJobs.length === 0) && (
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="body1">
                      {selectedWorkflow 
                        ? 'No scheduled jobs for this workflow' 
                        : 'Select a workflow to view scheduled jobs'}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
          
          {/* Workflow Details */}
          <Box sx={{ width: { xs: '100%', md: '65%' } }}>
            {selectedWorkflow ? (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Workflow Details</Typography>
                <Card elevation={2} sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{selectedWorkflow.name}</Typography>
                      <Box>
                        <IconButton 
                          color="primary"
                          onClick={() => handleEditWorkflow(selectedWorkflow)}
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <Edit size={18} />
                        </IconButton>
                        <IconButton 
                          color="primary"
                          onClick={() => handleRunWorkflow(selectedWorkflow.id)}
                          size="small"
                          disabled={isWorkflowRunning(selectedWorkflow.id)}
                        >
                          <Play size={18} />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {selectedWorkflow.description}
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Workflow Configuration:</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ flex: { xs: '0 0 50%', sm: '0 0 25%' }, textAlign: 'center' }}>
                          <Typography variant="h6">{selectedWorkflow.executionCount}</Typography>
                          <Typography variant="caption">Executions</Typography>
                        </Box>
                        <Box sx={{ flex: { xs: '0 0 50%', sm: '0 0 25%' }, textAlign: 'center' }}>
                          <Typography variant="h6">
                            {selectedWorkflow.averageDuration > 60 
                              ? `${Math.round(selectedWorkflow.averageDuration / 60)} min` 
                              : `${Math.round(selectedWorkflow.averageDuration)} sec`}
                          </Typography>
                          <Typography variant="caption">Avg. Duration</Typography>
                        </Box>
                        <Box sx={{ flex: { xs: '0 0 50%', sm: '0 0 25%' }, textAlign: 'center' }}>
                          <Typography variant="h6">{selectedWorkflow.steps.length}</Typography>
                          <Typography variant="caption">Steps</Typography>
                        </Box>
                        <Box sx={{ flex: { xs: '0 0 50%', sm: '0 0 25%' }, textAlign: 'center' }}>
                          <Typography variant="h6">{selectedWorkflow.botIds.length}</Typography>
                          <Typography variant="caption">Bots</Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Schedule:</Typography>
                    <Box sx={{ mb: 3 }}>
                      {selectedWorkflow.schedule ? (
                        <Box>
                          <Chip 
                            icon={<Calendar size={16} />}
                            label={
                              selectedWorkflow.schedule.type === 'once' 
                                ? `One-time: ${new Date(selectedWorkflow.schedule.startTime || '').toLocaleString()}` 
                                : selectedWorkflow.schedule.type === 'recurring' 
                                  ? `Every ${selectedWorkflow.schedule.interval} minutes` 
                                  : 'Custom Schedule'
                            }
                            sx={{ mb: 1 }}
                          />
                          
                          {selectedWorkflow.nextRun && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Next scheduled run: {new Date(selectedWorkflow.nextRun).toLocaleString()}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No schedule configured. This workflow can be run manually.
                        </Typography>
                      )}
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>Workflow Steps:</Typography>
                    <List sx={{ bgcolor: 'background.paper' }}>
                      {selectedWorkflow.steps.map((step, index) => {
                        const tool = tools.find(t => t.id === step.toolId);
                        const executionResult = executionStates[0]?.results[step.id];
                        
                        return (
                          <ListItem key={step.id} sx={{ 
                            borderLeft: '4px solid',
                            borderColor: 
                              step.status === 'completed' ? 'success.main' :
                              step.status === 'failed' ? 'error.main' :
                              step.status === 'running' ? 'primary.main' :
                              'grey.300',
                            mb: 1,
                            bgcolor: 'background.paper',
                            borderRadius: 1
                          }}>
                            <ListItemIcon>
                              <Typography variant="body2" sx={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%', 
                                bgcolor: 'primary.main',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {index + 1}
                              </Typography>
                            </ListItemIcon>
                            <ListItemText 
                              primary={step.name}
                              secondary={
                                <Box>
                                  <Typography variant="caption" display="block">
                                    Tool: {tool?.name || 'Unknown tool'}
                                  </Typography>
                                  {step.dependsOn.length > 0 && (
                                    <Typography variant="caption" display="block">
                                      Depends on: {step.dependsOn.map(depId => {
                                        const depStep = selectedWorkflow.steps.find(s => s.id === depId);
                                        return depStep?.name || 'Unknown step';
                                      }).join(', ')}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            {executionResult && (
                              <Chip 
                                size="small"
                                label={executionResult.status}
                                color={executionResult.status === 'success' ? 'success' : 'error'}
                              />
                            )}
                          </ListItem>
                        );
                      })}
                    </List>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                      <Button 
                        variant="outlined"
                        color="error"
                        startIcon={<Trash2 size={16} />}
                        onClick={() => handleDeleteWorkflow(selectedWorkflow.id)}
                      >
                        Delete Workflow
                      </Button>
                      
                      <Button 
                        variant="contained"
                        startIcon={<Play size={16} />}
                        onClick={() => handleRunWorkflow(selectedWorkflow.id)}
                        disabled={isWorkflowRunning(selectedWorkflow.id)}
                      >
                        Run Now
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
                
                {/* Assigned Bots */}
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Assigned Bots</Typography>
                <Card elevation={1}>
                  <CardContent>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedWorkflow.botIds.map(botId => {
                        const bot = bots.find(b => b.id === botId);
                        return bot ? (
                          <Chip 
                            key={bot.id}
                            label={bot.name}
                            icon={<Bot size={14} />}
                            sx={{ mb: 1 }}
                          />
                        ) : null;
                      })}
                      
                      {selectedWorkflow.botIds.length === 0 && (
                        <Typography variant="body2" color="textSecondary">
                          No bots assigned to this workflow.
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
                <GitBranch size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>Select a Workflow</Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  Choose a workflow from the list to view details and execution history
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<Plus size={16} />} 
                  onClick={handleCreateWorkflow}
                  sx={{ mt: 3 }}
                >
                  Create New Workflow
                </Button>
              </Box>
            )}
          </Box>
        </Stack>
      </Paper>
      
      {/* Workflow Creation/Edit Dialog */}
      <Dialog 
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New Workflow' : 'Edit Workflow'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This is a simplified workflow editor. In a full implementation, this would include a visual workflow designer
            that allows for more complex step creation and configuration.
          </Alert>
          
          {/* Workflow form would go here */}
          <Typography variant="body1" sx={{ my: 2 }}>
            The complete workflow editor UI would include:
          </Typography>
          <ul>
            <li>Visual workflow design with drag-and-drop steps</li>
            <li>Step configuration panels for each tool</li>
            <li>Data flow mapping between steps</li>
            <li>Conditional branching and error handling</li>
            <li>Schedule configuration options</li>
            <li>Bot assignment and capability matching</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button variant="contained" onClick={handleDialogClose}>
            {dialogMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
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

export default WorkflowControlPanel;
