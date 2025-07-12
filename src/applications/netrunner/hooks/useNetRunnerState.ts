/**
 * useNetRunnerState Hook
 * 
 * Centralized state management for the NetRunner application.
 * Manages all application state including search, tools, bots, workflows,
 * and real-time monitoring data.
 * 
 * @author GitHub Copilot
 * @date July 10, 2025
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { LoggerFactory } from '../services/logging';
import { monitoringService } from '../services/monitoring';
import { workflowEngine } from '../services/workflow';
import { netRunnerSearchService } from '../services/search';
import { getAdapter, getAllAdapters } from '../tools/adapters/AdapterRegistry';
import { SearchResult } from '../types/netrunner';

// Type definitions for NetRunner state
interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface RecentActivity {
  id: string;
  type: 'tool' | 'bot' | 'workflow' | 'alert';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'info';
}

// Types
interface NetRunnerGlobalState {
  // UI State
  activeView: string;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  bottomBarExpanded: boolean;
  
  // Search State
  globalSearch: string;
  searchResults: SearchResult[];
  searchHistory: string[];
  isSearching: boolean;
  
  // Tools State
  availableTools: string[];
  selectedTools: string[];
  toolResults: Record<string, unknown>;
  activeAdapters: string[];
  
  // Bot State
  availableBots: unknown[];
  activeBots: string[];
  botStatuses: Record<string, string>;
  
  // Workflow State
  availableWorkflows: unknown[];
  currentWorkflow: string | null;
  workflowStatus: string;
  runningJobs: unknown[];
  
  // Monitoring State
  systemMetrics: SystemMetric[];
  recentActivity: RecentActivity[];
  errorCount: number;
  warningCount: number;
  
  // Error State
  error: {
    hasError: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info';
  };
}

interface UseNetRunnerStateResult {
  state: NetRunnerGlobalState;
  
  // UI Actions
  setActiveView: (view: string) => void;
  toggleSidebar: (side: 'left' | 'right') => void;
  toggleBottomBar: () => void;
  
  // Search Actions
  setGlobalSearch: (query: string) => void;
  performSearch: (query?: string) => Promise<void>;
  clearSearchResults: () => void;
  
  // Tool Actions
  selectTool: (toolId: string) => void;
  deselectTool: (toolId: string) => void;
  runTool: (toolId: string, params?: Record<string, unknown>) => Promise<void>;
  refreshAvailableTools: () => Promise<void>;
  
  // Bot Actions
  activateBot: (botId: string) => void;
  deactivateBot: (botId: string) => void;
  getBotStatus: (botId: string) => string;
  refreshBotStatuses: () => Promise<void>;
  
  // Workflow Actions
  selectWorkflow: (workflowId: string | null) => void;
  startWorkflow: (workflowId: string, params?: Record<string, unknown>) => Promise<void>;
  stopWorkflow: (workflowId: string) => Promise<void>;
  refreshWorkflowStatus: () => Promise<void>;
  
  // Error Actions
  setError: (message: string, severity?: 'error' | 'warning' | 'info') => void;
  clearError: () => void;
  
  // System Actions
  refreshSystemMetrics: () => Promise<void>;
  refreshRecentActivity: () => Promise<void>;
}

/**
 * Centralized state management hook for NetRunner application
 */
export function useNetRunnerState(): UseNetRunnerStateResult {
  const logger = useMemo(() => LoggerFactory.getLogger('NetRunner:GlobalState'), []);
  
  // Initialize state
  const [state, setState] = useState<NetRunnerGlobalState>({
    // UI State
    activeView: 'dashboard',
    leftSidebarOpen: true,
    rightSidebarOpen: true,
    bottomBarExpanded: false,
    
    // Search State
    globalSearch: '',
    searchResults: [],
    searchHistory: [],
    isSearching: false,
    
    // Tools State
    availableTools: [],
    selectedTools: [],
    toolResults: {},
    activeAdapters: [],
    
    // Bot State
    availableBots: [],
    activeBots: [],
    botStatuses: {},
    
    // Workflow State
    availableWorkflows: [],
    currentWorkflow: null,
    workflowStatus: 'idle',
    runningJobs: [],
    
    // Monitoring State
    systemMetrics: [
      { name: 'CPU Usage', value: 45, unit: '%', status: 'good', trend: 'stable' },
      { name: 'Memory', value: 62, unit: '%', status: 'warning', trend: 'up' },
      { name: 'API Calls', value: 1247, unit: '/hr', status: 'good', trend: 'up' },
      { name: 'Data Processed', value: 15.7, unit: 'GB', status: 'good', trend: 'up' },
      { name: 'Active Connections', value: 23, unit: 'conn', status: 'good', trend: 'stable' },
      { name: 'Error Rate', value: 0.3, unit: '%', status: 'good', trend: 'down' }
    ],
    recentActivity: [
      {
        id: '1',
        type: 'tool',
        title: 'Shodan Scan Completed',
        description: 'Found 127 hosts for domain example.com',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        status: 'success'
      },
      {
        id: '2',
        type: 'bot',
        title: 'Domain Monitor Bot Started',
        description: 'Monitoring 15 domains for changes',
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
        status: 'info'
      }
    ],
    errorCount: 0,
    warningCount: 0,
    
    // Error State
    error: {
      hasError: false,
      message: '',
      severity: 'info'
    }
  });

  // Error Actions (declared first to resolve dependencies)
  const setError = useCallback((message: string, severity: 'error' | 'warning' | 'info' = 'error') => {
    setState(prev => ({
      ...prev,
      error: { hasError: true, message, severity }
    }));
    
    if (severity === 'error') {
      setState(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
    } else if (severity === 'warning') {
      setState(prev => ({ ...prev, warningCount: prev.warningCount + 1 }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: { hasError: false, message: '', severity: 'info' }
    }));
  }, []);

  // System Actions
  const refreshSystemMetrics = useCallback(async () => {
    try {
      // For now, use mock data - TODO: integrate with real system health data
      const metrics: SystemMetric[] = [
        { 
          name: 'CPU Usage', 
          value: Math.floor(Math.random() * 40) + 30, 
          unit: '%', 
          status: 'good', 
          trend: 'stable' 
        },
        { 
          name: 'Memory', 
          value: Math.floor(Math.random() * 30) + 50, 
          unit: '%', 
          status: 'warning', 
          trend: 'up' 
        },
        { 
          name: 'API Calls', 
          value: Math.floor(Math.random() * 500) + 1000, 
          unit: '/hr', 
          status: 'good', 
          trend: 'up' 
        },
        { 
          name: 'Data Processed', 
          value: Math.floor(Math.random() * 10) + 10, 
          unit: 'GB', 
          status: 'good', 
          trend: 'up' 
        },
        { 
          name: 'Active Connections', 
          value: Math.floor(Math.random() * 20) + 10, 
          unit: 'conn', 
          status: 'good', 
          trend: 'stable' 
        },
        { 
          name: 'Error Rate', 
          value: Math.random() * 2, 
          unit: '%', 
          status: 'good', 
          trend: 'down' 
        }
      ];
      
      setState(prev => ({ ...prev, systemMetrics: metrics }));
      logger.debug('System metrics refreshed');
    } catch (error) {
      logger.error('Failed to refresh system metrics', error);
    }
  }, [logger]);

  const refreshRecentActivity = useCallback(async () => {
    try {
      // Generate mock recent activity data
      const activity: RecentActivity[] = [
        {
          id: '1',
          type: 'tool',
          title: 'Shodan Scan Completed',
          description: 'Found 127 hosts for domain example.com',
          timestamp: new Date(Date.now() - Math.random() * 60000),
          status: 'success'
        },
        {
          id: '2',
          type: 'bot',
          title: 'Domain Monitor Bot Started',
          description: 'Monitoring 15 domains for changes',
          timestamp: new Date(Date.now() - Math.random() * 120000),
          status: 'info'
        },
        {
          id: '3',
          type: 'workflow',
          title: 'Email Campaign Analysis',
          description: 'Workflow completed with 45 IOCs identified',
          timestamp: new Date(Date.now() - Math.random() * 180000),
          status: 'success'
        }
      ];
      setState(prev => ({ ...prev, recentActivity: activity }));
      logger.debug('Recent activity refreshed');
    } catch (error) {
      logger.error('Failed to refresh recent activity', error);
    }
  }, [logger]);

  // Tool Actions
  const refreshAvailableTools = useCallback(async () => {
    try {
      const tools = getAllAdapters();
      const toolIds = tools.map(tool => tool.getToolId());
      
      setState(prev => ({ 
        ...prev, 
        availableTools: toolIds,
        activeAdapters: toolIds // Assume all available tools are active for now
      }));
      
      logger.debug(`Refreshed available tools: ${toolIds.length} tools found`);
    } catch (error) {
      logger.error('Failed to refresh available tools', error);
    }
  }, [logger]);

  // Workflow Actions
  const refreshWorkflowStatus = useCallback(async () => {
    try {
      // Use mock data for now - would be replaced with real service calls
      const workflows = [
        { id: 'domain-intel', name: 'Domain Intelligence', status: 'available' },
        { id: 'ip-investigation', name: 'IP Investigation', status: 'available' }
      ];
      const runningJobs: unknown[] = [];
      
      setState(prev => ({
        ...prev,
        availableWorkflows: workflows,
        runningJobs,
        workflowStatus: runningJobs.length > 0 ? 'running' : 'idle'
      }));
      
      logger.debug(`Refreshed workflow status: ${workflows.length} workflows, ${runningJobs.length} running`);
    } catch (error) {
      logger.error('Failed to refresh workflow status', error);
    }
  }, [logger]);

  // Initialize services and load initial data
  useEffect(() => {
    logger.info('NetRunner global state initializing');
    
    const initializeServices = async () => {
      try {
        // Initialize monitoring
        await monitoringService.start();
        
        // Load available tools
        refreshAvailableTools();
        
        // Load available workflows
        refreshWorkflowStatus();
        
        // Load initial system metrics
        refreshSystemMetrics();
        
        logger.info('NetRunner global state initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize NetRunner services', error);
        setError('Failed to initialize NetRunner services', 'error');
      }
    };

    initializeServices();

    return () => {
      logger.info('NetRunner global state cleanup');
      monitoringService.stop();
    };
  }, [logger, refreshAvailableTools, refreshSystemMetrics, refreshWorkflowStatus, setError]);

  // UI Actions
  const setActiveView = useCallback((view: string) => {
    logger.info(`Switching to view: ${view}`);
    setState(prev => ({ ...prev, activeView: view }));
  }, [logger]);

  const toggleSidebar = useCallback((side: 'left' | 'right') => {
    setState(prev => ({
      ...prev,
      [side === 'left' ? 'leftSidebarOpen' : 'rightSidebarOpen']: 
        !prev[side === 'left' ? 'leftSidebarOpen' : 'rightSidebarOpen']
    }));
  }, []);

  const toggleBottomBar = useCallback(() => {
    setState(prev => ({ ...prev, bottomBarExpanded: !prev.bottomBarExpanded }));
  }, []);

  // Search Actions
  const setGlobalSearch = useCallback((query: string) => {
    setState(prev => ({ ...prev, globalSearch: query }));
  }, []);

  const performSearch = useCallback(async (query?: string) => {
    const searchQuery = query || state.globalSearch;
    if (!searchQuery.trim()) return;

    setState(prev => ({ ...prev, isSearching: true }));
    
    try {
      logger.info(`Performing global search: ${searchQuery}`);
      
      const results = await netRunnerSearchService.performSearch({
        text: searchQuery,
        maxResults: 50,
        authenticated: true
      });

      setState(prev => ({
        ...prev,
        searchResults: results,
        searchHistory: prev.searchHistory.includes(searchQuery) 
          ? prev.searchHistory 
          : [searchQuery, ...prev.searchHistory.slice(0, 9)],
        isSearching: false
      }));

      logger.info(`Search completed: ${results.length} results found`);
    } catch (error) {
      logger.error('Search failed', error);
      setState(prev => ({ ...prev, isSearching: false }));
      setError('Search operation failed', 'error');
    }
  }, [state.globalSearch, logger, setError]);

  const clearSearchResults = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      searchResults: [], 
      globalSearch: '',
      isSearching: false 
    }));
  }, []);

  // Remaining Tool Actions
  const selectTool = useCallback((toolId: string) => {
    setState(prev => ({
      ...prev,
      selectedTools: prev.selectedTools.includes(toolId)
        ? prev.selectedTools
        : [...prev.selectedTools, toolId]
    }));
  }, []);

  const deselectTool = useCallback((toolId: string) => {
    setState(prev => ({
      ...prev,
      selectedTools: prev.selectedTools.filter(id => id !== toolId)
    }));
  }, []);

  const runTool = useCallback(async (toolId: string, params?: Record<string, unknown>) => {
    try {
      logger.info(`Running tool: ${toolId}`, params);
      
      // Get adapter from registry
      const adapter = getAdapter(toolId);
      if (!adapter) {
        throw new Error(`Tool ${toolId} not found`);
      }

      // Execute tool with proper request structure
      const request = {
        toolId,
        parameters: params || {},
        requestId: `req_${Date.now()}`,
        timestamp: Date.now()
      };
      const result = await adapter.execute(request);
      
      setState(prev => ({
        ...prev,
        toolResults: {
          ...prev.toolResults,
          [toolId]: result
        }
      }));

      logger.info(`Tool ${toolId} completed successfully`);
    } catch (error) {
      logger.error(`Tool ${toolId} failed`, error);
      setError(`Tool ${toolId} execution failed`, 'error');
    }
  }, [logger, setError]);

  // Bot Actions
  const activateBot = useCallback((botId: string) => {
    setState(prev => ({
      ...prev,
      activeBots: prev.activeBots.includes(botId)
        ? prev.activeBots
        : [...prev.activeBots, botId],
      botStatuses: {
        ...prev.botStatuses,
        [botId]: 'active'
      }
    }));
    logger.info(`Bot ${botId} activated`);
  }, [logger]);

  const deactivateBot = useCallback((botId: string) => {
    setState(prev => ({
      ...prev,
      activeBots: prev.activeBots.filter(id => id !== botId),
      botStatuses: {
        ...prev.botStatuses,
        [botId]: 'inactive'
      }
    }));
    logger.info(`Bot ${botId} deactivated`);
  }, [logger]);

  const getBotStatus = useCallback((botId: string) => {
    return state.botStatuses[botId] || 'unknown';
  }, [state.botStatuses]);

  const refreshBotStatuses = useCallback(async () => {
    // This would integrate with a real bot management service
    logger.debug('Refreshing bot statuses');
  }, [logger]);

  // Workflow Actions
  const selectWorkflow = useCallback((workflowId: string | null) => {
    setState(prev => ({ ...prev, currentWorkflow: workflowId }));
    logger.info(`Workflow selected: ${workflowId}`);
  }, [logger]);

  const startWorkflow = useCallback(async (workflowId: string, params?: Record<string, unknown>) => {
    try {
      logger.info(`Starting workflow: ${workflowId}`, params);
      
      const job = await workflowEngine.executeWorkflow(workflowId, params || {});
      
      setState(prev => ({
        ...prev,
        runningJobs: [...prev.runningJobs, job],
        workflowStatus: 'running'
      }));

      logger.info(`Workflow ${workflowId} started successfully`);
    } catch (error) {
      logger.error(`Failed to start workflow ${workflowId}`, error);
      setError(`Failed to start workflow ${workflowId}`, 'error');
    }
  }, [logger, setError]);

  const stopWorkflow = useCallback(async (workflowId: string) => {
    try {
      await workflowEngine.cancelExecution(workflowId);
      
      setState(prev => ({
        ...prev,
        runningJobs: prev.runningJobs.filter((job: unknown) => 
          (job as { id?: string }).id !== workflowId
        ),
        workflowStatus: prev.runningJobs.length <= 1 ? 'idle' : 'running'
      }));

      logger.info(`Workflow ${workflowId} stopped`);
    } catch (error) {
      logger.error(`Failed to stop workflow ${workflowId}`, error);
      setError(`Failed to stop workflow ${workflowId}`, 'error');
    }
  }, [logger, setError]);

  return {
    state,
    
    // UI Actions
    setActiveView,
    toggleSidebar,
    toggleBottomBar,
    
    // Search Actions
    setGlobalSearch,
    performSearch,
    clearSearchResults,
    
    // Tool Actions
    selectTool,
    deselectTool,
    runTool,
    refreshAvailableTools,
    
    // Bot Actions
    activateBot,
    deactivateBot,
    getBotStatus,
    refreshBotStatuses,
    
    // Workflow Actions
    selectWorkflow,
    startWorkflow,
    stopWorkflow,
    refreshWorkflowStatus,
    
    // Error Actions
    setError,
    clearError,
    
    // System Actions
    refreshSystemMetrics,
    refreshRecentActivity
  };
}
