import React, { useState, useCallback, useMemo, ReactNode } from 'react';
import { EnhancedApplicationRouterContext } from '../../context/EnhancedApplicationRouterContext';
import { trackInvestorEvents } from '../../utils/analytics';
import { googleAnalyticsService } from '../../services/GoogleAnalyticsService';

// Import actual application components
import CyberCommandApplication from '../../applications/cybercommand/CyberCommandApplication';
import NetRunnerApplication from '../../applications/netrunner/NetRunnerApplication';
import AnalysisWorkbench from '../../applications/intelanalyzer/AnalysisWorkbench';
import IntelDashboardApplication from '../../applications/inteldashboard/IntelDashboardApplication';
import IntelWebApplicationWrapper from '../../applications/intelweb/IntelWebApplicationWrapper';
import TeamWorkspaceApplication from '../../applications/teamworkspace/TeamWorkspaceApplication';
import MarketExchangeApplication from '../../applications/marketexchange/MarketExchangeApplication';

// Define application types and modes
export type ApplicationId = 
  | 'cybercommand'
  | 'netrunner'
  | 'intelanalyzer'
  | 'inteldashboard'
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

// Application state preservation - stores application states
const applicationStates = new Map<ApplicationId, ApplicationStateData>();

// Analytics tracking utilities
const getAppUsageHistory = (): Set<ApplicationId> => {
  const stored = sessionStorage.getItem('starcom_app_usage');
  return stored ? new Set(JSON.parse(stored)) : new Set();
};

const updateAppUsageHistory = (appId: ApplicationId): void => {
  const history = getAppUsageHistory();
  history.add(appId);
  sessionStorage.setItem('starcom_app_usage', JSON.stringify(Array.from(history)));
};

const getTimeInApp = (appId: ApplicationId): number => {
  const startTime = sessionStorage.getItem(`starcom_app_start_${appId}`);
  return startTime ? Date.now() - parseInt(startTime) : 0;
};

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
    component: AnalysisWorkbench
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
    id: 'intelweb', // renamed from nodeweb
    name: 'IntelWeb',
    icon: '�️',
    description: 'Intelligence connections and relationship mapping',
    defaultMode: 'standalone',
    supportedModes: ['standalone', 'modal'],
    component: IntelWebApplicationWrapper
  },
  {
    id: 'teamworkspace',
    name: 'CollabCenter',
    icon: '�',
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

    // ANALYTICS: Track application navigation (Tier 1 - Highest ROI)
    const previousApp = state.currentApp;
    const timeInPreviousApp = previousApp ? getTimeInApp(previousApp) : 0;
    const appUsageHistory = getAppUsageHistory();
    const isReturningUser = appUsageHistory.has(appId);
    const sessionAppCount = appUsageHistory.size + (isReturningUser ? 0 : 1);
    
    // Track core application usage (CRITICAL for investor metrics)
    trackInvestorEvents.featureUsed(`application-${appId}`);
    googleAnalyticsService.trackEvent('app_navigation', 'core_usage', appId, 1);
    
    // Enhanced tracking with custom events for detailed context
    googleAnalyticsService.trackEvent('app_navigation_detailed', 'engagement', appId);
    googleAnalyticsService.trackEvent('session_app_count', 'engagement', sessionAppCount.toString(), sessionAppCount);
    
    // Track first-time vs returning app usage
    if (isReturningUser) {
      trackInvestorEvents.featureUsed('app-return-user');
      googleAnalyticsService.trackEvent('app_usage_pattern', 'retention', 'returning_user');
    } else {
      trackInvestorEvents.featureUsed('app-first-time-user');
      googleAnalyticsService.trackEvent('app_usage_pattern', 'acquisition', 'new_user');
      updateAppUsageHistory(appId);
    }

    // Track presentation mode usage (useful for UX insights)
    if (targetMode !== 'standalone') {
      trackInvestorEvents.featureUsed(`app-mode-${targetMode}`);
      googleAnalyticsService.trackEvent('presentation_mode', 'ux_behavior', targetMode);
    }

    // Track session depth (engagement quality)
    if (sessionAppCount === 1) {
      trackInvestorEvents.featureUsed('session-first-app');
      googleAnalyticsService.trackEvent('session_depth', 'engagement', 'first_app');
    } else if (sessionAppCount >= 3) {
      trackInvestorEvents.featureUsed('session-deep-engagement');
      googleAnalyticsService.trackEvent('session_depth', 'engagement', 'deep_engagement', sessionAppCount);
    }

    // Track previous app exit duration (retention insight)
    if (previousApp && timeInPreviousApp > 0) {
      const durationMinutes = Math.round(timeInPreviousApp / 60000);
      googleAnalyticsService.trackEvent('app_session_duration', 'engagement', previousApp, durationMinutes);
    }

    // Set app start time for duration tracking
    sessionStorage.setItem(`starcom_app_start_${appId}`, Date.now().toString());

    setState(prevState => ({
      ...prevState,
      currentApp: appId,
      presentationMode: targetMode,
      context: { ...prevState.context, ...(context || {}) },
      history: prevState.currentApp 
        ? [...prevState.history.slice(-9), prevState.currentApp] // Keep last 10
        : prevState.history
    }));
  }, [state.currentApp]);

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
