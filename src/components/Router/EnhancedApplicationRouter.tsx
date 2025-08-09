import React, { useState, useCallback, useMemo, ReactNode } from 'react';
import { EnhancedApplicationRouterContext } from '../../context/EnhancedApplicationRouterContext';

// Import actual application components
import CyberCommandApplication from '../../applications/cybercommand/CyberCommandApplication';
import NetRunnerApplication from '../../applications/netrunner/NetRunnerApplication';
import IntelAnalyzerApplication from '../../applications/intelanalyzer/IntelAnalyzerApplication';
import IntelDashboardApplication from '../../applications/inteldashboard/IntelDashboardApplication';
import TimeMapApplication from '../../applications/timemap/TimeMapApplication';
import IntelWebApplicationWrapper from '../../applications/intelweb/IntelWebApplicationWrapper';
import TeamWorkspaceApplication from '../../applications/teamworkspace/TeamWorkspaceApplication';
import MarketExchangeApplication from '../../applications/marketexchange/MarketExchangeApplication';

// Define application types and modes
export type ApplicationId = 
  | 'cybercommand'
  | 'netrunner'
  | 'intelanalyzer'
  | 'inteldashboard'
  | 'timemap'
  | 'intelweb' // renamed from nodeweb
  | 'teamworkspace'
  | 'marketexchange';

export type PresentationMode = 'standalone' | 'modal' | 'embedded';

// Application context type - can be extended as needed
export interface ApplicationContext {
  [key: string]: string | number | boolean | null | undefined;
}

// Application state for preservation
export interface ApplicationStateData {
  [key: string]: unknown;
}

export interface ApplicationConfig {
  id: ApplicationId;
  name: string;
  icon: string;
  description: string;
  defaultMode: PresentationMode;
  supportedModes: PresentationMode[];
  component: React.ComponentType<ApplicationContext>;
  isProtected?: boolean; // For CyberCommand
}

export interface ApplicationState {
  currentApp: ApplicationId | null;
  presentationMode: PresentationMode;
  context: ApplicationContext;
  history: ApplicationId[];
}

export interface EnhancedApplicationRouterContextType {
  // Current state
  currentApp: ApplicationId | null;
  presentationMode: PresentationMode;
  context: ApplicationContext;
  history: ApplicationId[];
  
  // Navigation methods
  navigateToApp: (appId: ApplicationId, mode?: PresentationMode, context?: ApplicationContext) => void;
  goBack: () => void;
  setContext: (key: string, value: string | number | boolean | null | undefined) => void;
  getContext: (key: string) => string | number | boolean | null | undefined;
  
  // Application registry
  registerApplication: (config: ApplicationConfig) => void;
  getApplication: (appId: ApplicationId) => ApplicationConfig | undefined;
  getAllApplications: () => ApplicationConfig[];
  
  // State management
  preserveState: (appId: ApplicationId, state: ApplicationStateData) => void;
  restoreState: (appId: ApplicationId) => ApplicationStateData | undefined;
}

// Application registry - stores registered applications
const applicationRegistry = new Map<ApplicationId, ApplicationConfig>();

// State preservation - stores application states
const applicationStates = new Map<ApplicationId, ApplicationStateData>();

// Default application configurations
const defaultApplications: ApplicationConfig[] = [
  {
    id: 'cybercommand',
    name: 'CyberCommand',
    icon: '🌐',
    description: '3D Globe interface with cyberpunk HUD',
    defaultMode: 'standalone',
    supportedModes: ['standalone'],
    component: CyberCommandApplication,
    isProtected: false // Now properly integrated
  },
  {
    id: 'netrunner',
    name: 'NetRunner',
    icon: '🕵️',
    description: 'Advanced investigation and search tools',
    defaultMode: 'standalone',
    supportedModes: ['standalone', 'modal'],
    component: NetRunnerApplication
  },
  {
    id: 'intelanalyzer',
    name: 'IntelAnalyzer',
    icon: '📊',
    description: 'Intelligence analysis and reporting',
    defaultMode: 'standalone',
    supportedModes: ['standalone', 'modal'],
    component: IntelAnalyzerApplication
  },
  {
    id: 'inteldashboard',
    name: 'IntelDashboard',
    icon: '📋',
    description: 'Intelligence reports and dashboard management',
    defaultMode: 'standalone',
    supportedModes: ['standalone', 'modal'],
    component: IntelDashboardApplication
  },
  {
    id: 'timemap',
    name: 'TimeMap',
    icon: '🗓️',
    description: 'Temporal analysis and timeline management',
    defaultMode: 'standalone',
    supportedModes: ['standalone', 'modal'],
    component: TimeMapApplication
  },
  {
    id: 'intelweb', // renamed from nodeweb
    name: 'IntelWeb',
    icon: '🕸️',
    description: 'Intelligence connections and relationship mapping',
    defaultMode: 'standalone',
    supportedModes: ['standalone', 'modal'],
    component: IntelWebApplicationWrapper
  },
  {
    id: 'teamworkspace',
    name: 'CollabCenter',
    icon: '👥',
    description: 'Intelligence operations collaboration and project management',
    defaultMode: 'standalone',
    supportedModes: ['standalone', 'modal'],
    component: TeamWorkspaceApplication
  },
  {
    id: 'marketexchange',
    name: 'MarketExchange',
    icon: '💰',
    description: 'Economic analysis and market intelligence',
    defaultMode: 'standalone',
    supportedModes: ['standalone', 'modal'],
    component: MarketExchangeApplication
  }
];

// Initialize default applications
defaultApplications.forEach(app => {
  applicationRegistry.set(app.id, app);
});

export const EnhancedApplicationRouterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ApplicationState>({
    currentApp: null,
    presentationMode: 'standalone',
    context: {},
    history: []
  });

  const navigateToApp = useCallback((
    appId: ApplicationId, 
    mode?: PresentationMode, 
    context?: ApplicationContext
  ) => {
    const app = applicationRegistry.get(appId);
    if (!app) {
      console.warn(`Application ${appId} not found in registry`);
      return;
    }

    const targetMode = mode || app.defaultMode;
    if (!app.supportedModes.includes(targetMode)) {
      console.warn(`Application ${appId} does not support mode ${targetMode}`);
      return;
    }

    setState(prevState => ({
      ...prevState,
      currentApp: appId,
      presentationMode: targetMode,
      context: { ...prevState.context, ...(context || {}) },
      history: prevState.currentApp 
        ? [...prevState.history.slice(-9), prevState.currentApp] // Keep last 10
        : prevState.history
    }));
  }, []);

  const goBack = useCallback(() => {
    setState(prevState => {
      if (prevState.history.length === 0) return prevState;
      
      const previousApp = prevState.history[prevState.history.length - 1];
      const newHistory = prevState.history.slice(0, -1);
      
      return {
        ...prevState,
        currentApp: previousApp,
        history: newHistory
      };
    });
  }, []);

  const setContext = useCallback((key: string, value: string | number | boolean | null | undefined) => {
    setState(prevState => ({
      ...prevState,
      context: {
        ...prevState.context,
        [key]: value
      }
    }));
  }, []);

  const getContext = useCallback((key: string) => {
    return state.context[key];
  }, [state.context]);

  const registerApplication = useCallback((config: ApplicationConfig) => {
    applicationRegistry.set(config.id, config);
  }, []);

  const getApplication = useCallback((appId: ApplicationId) => {
    return applicationRegistry.get(appId);
  }, []);

  const getAllApplications = useCallback(() => {
    return Array.from(applicationRegistry.values());
  }, []);

  const preserveState = useCallback((appId: ApplicationId, appState: ApplicationStateData) => {
    applicationStates.set(appId, appState);
  }, []);

  const restoreState = useCallback((appId: ApplicationId) => {
    return applicationStates.get(appId);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: EnhancedApplicationRouterContextType = useMemo(() => ({
    currentApp: state.currentApp,
    presentationMode: state.presentationMode,
    context: state.context,
    history: state.history,
    
    navigateToApp,
    goBack,
    setContext,
    getContext,
    
    registerApplication,
    getApplication,
    getAllApplications,
    
    preserveState,
    restoreState
  }), [
    state.currentApp,
    state.presentationMode,
    state.context,
    state.history,
    navigateToApp,
    goBack,
    setContext,
    getContext,
    registerApplication,
    getApplication,
    getAllApplications,
    preserveState,
    restoreState
  ]);

  return (
    <EnhancedApplicationRouterContext.Provider value={contextValue}>
      {children}
    </EnhancedApplicationRouterContext.Provider>
  );
};
