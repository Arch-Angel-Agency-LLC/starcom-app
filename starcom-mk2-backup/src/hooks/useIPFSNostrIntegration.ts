/**
 * React Hook for IPFS-Nostr Integration Manager
 * 
 * This hook provides React components with easy access to the IPFS-Nostr
 * integration layer, handling initialization, state management, and real-time
 * updates from the integration manager.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { IPFSNostrIntegrationManager } from '../services/IPFSNostrIntegrationManager';

// Hook state interface
interface UseIPFSNostrIntegrationState {
  isInitialized: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  networkHealth: {
    ipfs: 'healthy' | 'degraded' | 'offline';
    nostr: 'healthy' | 'degraded' | 'offline';
    relayNodes: number;
  };
  recentActivity: Array<{
    id: string;
    timestamp: Date;
    type: 'content-stored' | 'content-updated' | 'collaboration' | 'team-join' | 'investigation-created';
    source: 'ipfs' | 'nostr' | 'dapp';
    teamId?: string;
    investigationId?: string;
    userId: string;
    description: string;
    metadata?: Record<string, unknown>;
  }>;
  activeTeams: string[];
  activeInvestigations: string[];
  lastSync: Date;
}

// Hook configuration options
interface UseIPFSNostrIntegrationOptions {
  autoInitialize?: boolean;
  syncInterval?: number;
  enableRealTimeSync?: boolean;
  enableTeamWorkspaces?: boolean;
  enableInvestigationCoordination?: boolean;
}

// Hook return interface
interface UseIPFSNostrIntegrationReturn extends UseIPFSNostrIntegrationState {
  // Initialization
  initialize: (config?: UseIPFSNostrIntegrationOptions) => Promise<void>;
  
  // Content operations
  storeContent: (content: Record<string, unknown>, options?: {
    teamId?: string;
    investigationId?: string;
    classification?: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
    announceViaNostr?: boolean;
  }) => Promise<string>;
  
  searchContent: (query: string, options?: {
    teamId?: string;
    investigationId?: string;
    contentType?: string;
  }) => Promise<Record<string, unknown>[]>;
  
  // Team workspace operations
  getTeamWorkspace: (teamId: string) => Promise<Record<string, unknown>>;
  
  // Investigation operations
  getInvestigationCoordination: (investigationId: string) => Promise<Record<string, unknown>>;
  
  // Activity management
  getRecentActivity: (limit?: number) => Array<UseIPFSNostrIntegrationState['recentActivity'][0]>;
  
  // Configuration
  updateConfig: (updates: Partial<UseIPFSNostrIntegrationOptions>) => void;
  
  // Utility
  refresh: () => Promise<void>;
}

/**
 * useIPFSNostrIntegration Hook
 * 
 * Provides React components with integrated IPFS-Nostr functionality
 */
export const useIPFSNostrIntegration = (
  options: UseIPFSNostrIntegrationOptions = {}
): UseIPFSNostrIntegrationReturn => {
  
  // State management
  const [state, setState] = useState<UseIPFSNostrIntegrationState>({
    isInitialized: false,
    isConnected: false,
    isLoading: false,
    error: null,
    networkHealth: {
      ipfs: 'offline',
      nostr: 'offline',
      relayNodes: 0
    },
    recentActivity: [],
    activeTeams: [],
    activeInvestigations: [],
    lastSync: new Date()
  });
  
  // Service instance ref
  const integrationManagerRef = useRef<IPFSNostrIntegrationManager | null>(null);
  const eventListenersRef = useRef<(() => void)[]>([]);
  
  // Set up event listeners
  const setupEventListeners = useCallback((manager: IPFSNostrIntegrationManager) => {
    // Clear existing listeners
    eventListenersRef.current.forEach(unsubscribe => unsubscribe());
    eventListenersRef.current = [];
    
    // Activity updates
    const activityUnsub = manager.on('activity-added', (data) => {
      const activity = data as UseIPFSNostrIntegrationState['recentActivity'][0];
      setState(prev => ({
        ...prev,
        recentActivity: [activity, ...prev.recentActivity.slice(0, 99)]
      }));
    });
    eventListenersRef.current.push(activityUnsub);
    
    // Network health updates
    const healthUnsub = manager.on('network-health-changed', (data) => {
      const { service, currentHealth } = data as { service: 'ipfs' | 'nostr'; currentHealth: 'healthy' | 'degraded' | 'offline' };
      setState(prev => ({
        ...prev,
        networkHealth: {
          ...prev.networkHealth,
          [service]: currentHealth
        }
      }));
    });
    eventListenersRef.current.push(healthUnsub);
    
    // Team workspace updates
    const teamUnsub = manager.on('team-workspace-integrated', (data) => {
      const { teamId } = data as { teamId: string };
      setState(prev => ({
        ...prev,
        activeTeams: prev.activeTeams.includes(teamId) 
          ? prev.activeTeams 
          : [...prev.activeTeams, teamId]
      }));
    });
    eventListenersRef.current.push(teamUnsub);
    
    // Investigation updates
    const investigationUnsub = manager.on('investigation-integrated', (data) => {
      const { investigationId } = data as { investigationId: string };
      setState(prev => ({
        ...prev,
        activeInvestigations: prev.activeInvestigations.includes(investigationId)
          ? prev.activeInvestigations
          : [...prev.activeInvestigations, investigationId]
      }));
    });
    eventListenersRef.current.push(investigationUnsub);
    
    // Sync completion updates
    const syncUnsub = manager.on('sync-completed', () => {
      setState(prev => ({ ...prev, lastSync: new Date() }));
    });
    eventListenersRef.current.push(syncUnsub);
    
    // Connection status updates
    const connectionUnsub = manager.on('initialized', () => {
      setState(prev => ({ ...prev, isInitialized: true, isConnected: true }));
    });
    eventListenersRef.current.push(connectionUnsub);
    
  }, []);
  
  // Initialize integration manager
  const initialize = useCallback(async (config?: UseIPFSNostrIntegrationOptions) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Get singleton instance
      if (!integrationManagerRef.current) {
        integrationManagerRef.current = IPFSNostrIntegrationManager.getInstance();
      }
      
      const manager = integrationManagerRef.current;
      
      // Initialize with configuration
      await manager.initialize({
        autoInitialize: config?.autoInitialize ?? options.autoInitialize ?? true,
        syncInterval: config?.syncInterval ?? options.syncInterval ?? 30000,
        enableRealTimeSync: config?.enableRealTimeSync ?? options.enableRealTimeSync ?? true,
        enableTeamWorkspaces: config?.enableTeamWorkspaces ?? options.enableTeamWorkspaces ?? true,
        enableInvestigationCoordination: config?.enableInvestigationCoordination ?? options.enableInvestigationCoordination ?? true,
        maxRetries: 3,
        networkHealthCheck: 10000,
        activityBufferSize: 100
      });
      
      // Set up event listeners
      setupEventListeners(manager);
      
      // Update state with initial data
      const managerState = manager.getState();
      setState(prev => ({
        ...prev,
        isInitialized: managerState.isInitialized,
        isConnected: managerState.isConnected,
        networkHealth: managerState.networkHealth,
        recentActivity: managerState.recentActivity,
        activeTeams: managerState.activeTeams,
        activeInvestigations: managerState.activeInvestigations,
        lastSync: managerState.lastSync,
        isLoading: false
      }));
      
    } catch (error) {
      console.error('Failed to initialize IPFS-Nostr integration:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Initialization failed'
      }));
    }
  }, [options, setupEventListeners]);
  
  // Content operations
  const storeContent = useCallback(async (
    content: Record<string, unknown>, 
    options?: {
      teamId?: string;
      investigationId?: string;
      classification?: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
      announceViaNostr?: boolean;
    }
  ): Promise<string> => {
    if (!integrationManagerRef.current) {
      throw new Error('Integration manager not initialized');
    }
    
    return integrationManagerRef.current.storeContent(content, options);
  }, []);
  
  const searchContent = useCallback(async (
    query: string, 
    options?: {
      teamId?: string;
      investigationId?: string;
      contentType?: string;
    }
  ): Promise<Record<string, unknown>[]> => {
    if (!integrationManagerRef.current) {
      throw new Error('Integration manager not initialized');
    }
    
    return integrationManagerRef.current.searchContent(query, options);
  }, []);
  
  // Team operations
  const getTeamWorkspace = useCallback(async (teamId: string): Promise<Record<string, unknown>> => {
    if (!integrationManagerRef.current) {
      throw new Error('Integration manager not initialized');
    }
    
    return integrationManagerRef.current.getTeamWorkspace(teamId);
  }, []);
  
  // Investigation operations
  const getInvestigationCoordination = useCallback(async (investigationId: string): Promise<Record<string, unknown>> => {
    if (!integrationManagerRef.current) {
      throw new Error('Integration manager not initialized');
    }
    
    return integrationManagerRef.current.getInvestigationCoordination(investigationId);
  }, []);
  
  // Activity management
  const getRecentActivity = useCallback((limit?: number): Array<UseIPFSNostrIntegrationState['recentActivity'][0]> => {
    if (!integrationManagerRef.current) {
      return [];
    }
    
    return integrationManagerRef.current.getRecentActivity(limit);
  }, []);
  
  // Configuration updates
  const updateConfig = useCallback((updates: Partial<UseIPFSNostrIntegrationOptions>) => {
    if (!integrationManagerRef.current) {
      return;
    }
    
    integrationManagerRef.current.updateConfig({
      syncInterval: updates.syncInterval,
      enableRealTimeSync: updates.enableRealTimeSync,
      enableTeamWorkspaces: updates.enableTeamWorkspaces,
      enableInvestigationCoordination: updates.enableInvestigationCoordination
    });
  }, []);
  
  // Refresh data
  const refresh = useCallback(async () => {
    if (!integrationManagerRef.current) {
      return;
    }
    
    const managerState = integrationManagerRef.current.getState();
    setState(prev => ({
      ...prev,
      networkHealth: managerState.networkHealth,
      recentActivity: managerState.recentActivity,
      activeTeams: managerState.activeTeams,
      activeInvestigations: managerState.activeInvestigations,
      lastSync: managerState.lastSync
    }));
  }, []);
  
  // Auto-initialize effect
  useEffect(() => {
    if (options.autoInitialize !== false) {
      initialize();
    }
    
    // Cleanup on unmount
    return () => {
      eventListenersRef.current.forEach(unsubscribe => unsubscribe());
      eventListenersRef.current = [];
    };
  }, [initialize, options.autoInitialize]);
  
  // Return hook interface
  return {
    ...state,
    initialize,
    storeContent,
    searchContent,
    getTeamWorkspace,
    getInvestigationCoordination,
    getRecentActivity,
    updateConfig,
    refresh
  };
};

export default useIPFSNostrIntegration;
