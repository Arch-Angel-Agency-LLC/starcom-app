import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
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
    
    // Initialize Google Analytics service
    try {
      // Track app initialization
      googleAnalyticsService.trackEvent('app_initialized', 'Application');
      debugLogger.info(DebugCategory.COMPONENT_LOAD, 'Google Analytics service initialized');
    } catch (error) {
      debugLogger.warn(DebugCategory.COMPONENT_LOAD, 'Google Analytics initialization failed:', error);
    }
    
    return () => {
      // No cleanup needed
    };
  }, [wasmReady, fetchFromMiniServer]);

  return (
    <>
      <SettingsInitializer />
      <BrowserRouter>
        <EnhancedApplicationRouterProvider>
          <AnalyticsTracker />
          <RouteSynchronizer />
          <AppRoutes />
        </EnhancedApplicationRouterProvider>
      </BrowserRouter>
      <SettingsStatusIndicator />
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