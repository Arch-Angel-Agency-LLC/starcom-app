import React, { useEffect } from "react";
import RouterProvider from "./routes/RouterProvider";
import AppRoutes from "./routes/routes";
import { WASMProvider, useWASM } from "./context/WASMContext";
import { DashboardProvider } from "./context/DashboardContext";
import { GlobeProvider } from "./context/GlobeContext.tsx";
import { VisualizationModeProvider } from "./context/VisualizationModeContext";
import { MarketplaceProvider } from "./context/MarketplaceContext";
import { SpaceWeatherProvider } from "./context/SpaceWeatherContext";
import { UnifiedGlobalCommandProvider } from "./context/UnifiedGlobalCommandContext";
import { InvestigationProvider } from "./context/InvestigationContext";
import { GlobalGlobeContextMenuProvider } from "./context/GlobalGlobeContextMenuProvider";
import { RightSideBarProvider } from "./context/RightSideBarContext";
import { ViewProvider } from "./context/ViewContext";
import { SecureChatProvider } from "./communication/context/SecureChatContext";
import { EnhancedApplicationRouterProvider } from "./components/Router/EnhancedApplicationRouter";
import RouteSynchronizer from "./components/Navigation/RouteSynchronizer";
import AnalyticsTracker from "./components/Analytics/AnalyticsTracker";
import { googleAnalyticsService } from "./services/GoogleAnalyticsService";
import SettingsInitializer from "./components/SettingsInitializer";
import SettingsStatusIndicator from "./components/SettingsStatusIndicator";
import StorageStatusBadge from "./components/Status/StorageStatusBadge";
import PreloaderManager from "./components/Preloader/PreloaderManager";
import WalletDiagnostic from "./components/Debug/WalletDiagnostic";
import DebugControlPanel from "./components/Debug/DebugControlPanel";
import { useDebugPanel } from "./hooks/useDebugPanel";
import { initConsoleErrorMonitoring } from "./utils/consoleErrorFixer";
import { initializeErrorHandling } from "./utils/consoleErrorResolver";
import { initPointerEventsDebugging } from "./utils/pointerEventsDebugger";
import { debugLogger, DebugCategory } from "./utils/debugLogger";
import "./styles/globals.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/Shared/ErrorBoundary';
import { PopupProvider } from './components/Popup/PopupManager';

// Component loading debug
debugLogger.info(DebugCategory.COMPONENT_LOAD, 'App.tsx loaded - main application entry point');

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const { fetchFromMiniServer, wasmReady } = useWASM();
  const { isVisible, closePanel } = useDebugPanel();
  
  useEffect(() => {
    // Initialize console error monitoring in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      initConsoleErrorMonitoring();
      initializeErrorHandling();
      initPointerEventsDebugging();
    }
    
    // ANALYTICS: Enhanced session tracking for investor metrics (Tier 1)
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionStart = Date.now();
    
    // Store session info for cross-component access
    sessionStorage.setItem('starcom_session_id', sessionId);
    sessionStorage.setItem('starcom_session_start', sessionStart.toString());
    
    // Initialize Google Analytics service
    try {
      // Track app initialization with enhanced context
      googleAnalyticsService.trackEvent('app_initialized', 'Application');
      googleAnalyticsService.trackEvent('session_started', 'engagement', 'app_launch');
      
      // Track session context for investor insights
      googleAnalyticsService.trackEvent('session_context', 'technical', navigator.userAgent);
      googleAnalyticsService.trackEvent('viewport_size', 'technical', `${window.innerWidth}x${window.innerHeight}`);
      
      debugLogger.info(DebugCategory.COMPONENT_LOAD, 'Google Analytics service initialized');
    } catch (error) {
      debugLogger.warn(DebugCategory.COMPONENT_LOAD, 'Google Analytics initialization failed:', error);
    }
    
    // Track page visibility changes (engagement quality)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        googleAnalyticsService.trackEvent('session_backgrounded', 'engagement');
      } else {
        googleAnalyticsService.trackEvent('session_foregrounded', 'engagement');
      }
    };
    
    // Track window focus/blur for engagement metrics
    const handleWindowFocus = () => {
      googleAnalyticsService.trackEvent('window_focused', 'engagement');
    };
    
    const handleWindowBlur = () => {
      googleAnalyticsService.trackEvent('window_blurred', 'engagement');
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    
    // Session end tracking and cleanup
    return () => {
      const sessionDuration = Date.now() - sessionStart;
      const durationMinutes = Math.round(sessionDuration / 60000);
      
      // Track session end metrics (CRITICAL for retention analysis)
      googleAnalyticsService.trackEvent('session_ended', 'engagement', 'normal_close', durationMinutes);
      googleAnalyticsService.trackEvent('session_duration', 'engagement', 'minutes', durationMinutes);
      
      // Track apps used in session for engagement depth
      const appsUsed = sessionStorage.getItem('starcom_app_usage');
      if (appsUsed) {
        const appCount = JSON.parse(appsUsed).length;
        googleAnalyticsService.trackEvent('session_app_diversity', 'engagement', 'app_count', appCount);
      }
      
      // Cleanup event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [wasmReady, fetchFromMiniServer]);

  return (
    <>
      <SettingsInitializer />
  <RouterProvider>
        <EnhancedApplicationRouterProvider>
          <AnalyticsTracker />
          <RouteSynchronizer />
          <AppRoutes />
        </EnhancedApplicationRouterProvider>
  </RouterProvider>
      <SettingsStatusIndicator />
  <StorageStatusBadge />
      {/* Wallet Diagnostics - Only shown when feature flag is enabled */}
      <WalletDiagnostic />
      {/* Debug Control Panel - Toggle with Ctrl+Shift+D */}
      <DebugControlPanel isVisible={isVisible} onClose={closePanel} />
    </>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <PopupProvider>
      <PreloaderManager minimumDisplayTime={2500}>
        <ErrorBoundary>
            <WASMProvider>
              <DashboardProvider>
                <VisualizationModeProvider>
                  <GlobeProvider>
                    <SpaceWeatherProvider>
                      <MarketplaceProvider>
                        <UnifiedGlobalCommandProvider>
                          <InvestigationProvider>
                            <GlobalGlobeContextMenuProvider>
                              <RightSideBarProvider>
                                <ViewProvider>
                                  <SecureChatProvider>
                                    <div data-testid="app-root">
                                      <AppContent />
                                    </div>
                                  </SecureChatProvider>
                                </ViewProvider>
                              </RightSideBarProvider>
                            </GlobalGlobeContextMenuProvider>
                          </InvestigationProvider>
                        </UnifiedGlobalCommandProvider>
                      </MarketplaceProvider>
                    </SpaceWeatherProvider>
                  </GlobeProvider>
                </VisualizationModeProvider>
              </DashboardProvider>
            </WASMProvider>
          </ErrorBoundary>
      </PreloaderManager>
    </PopupProvider>
  </QueryClientProvider>
);

export default App;