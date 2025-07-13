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
import SettingsInitializer from "./components/SettingsInitializer";
import SettingsStatusIndicator from "./components/SettingsStatusIndicator";
import PreloaderManager from "./components/Preloader/PreloaderManager";
import WalletDiagnostic from "./components/Debug/WalletDiagnostic";
import { initConsoleErrorMonitoring } from "./utils/consoleErrorFixer";
import { initializeErrorHandling } from "./utils/consoleErrorResolver";
import { initPointerEventsDebugging } from "./utils/pointerEventsDebugger";
import "./styles/globals.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthErrorBoundary from './components/Auth/AuthErrorBoundary';

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const { fetchFromMiniServer, wasmReady } = useWASM();

  useEffect(() => {
    // Initialize console error monitoring in development
    if (import.meta.env.DEV) {
      initConsoleErrorMonitoring();
      initializeErrorHandling();
      initPointerEventsDebugging();
    }
    
    return () => {
      // No cleanup needed
    };
  }, [wasmReady, fetchFromMiniServer]);

  return (
    <>
      <SettingsInitializer />
      <BrowserRouter>
        <RouteSynchronizer />
        <AppRoutes />
      </BrowserRouter>
      <SettingsStatusIndicator />
      {/* Wallet Diagnostics - Only shown when feature flag is enabled */}
      <WalletDiagnostic />
    </>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <PreloaderManager minimumDisplayTime={2500}>
      <AuthErrorBoundary>
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
                                  <EnhancedApplicationRouterProvider>
                                    <div data-testid="app-root">
                                      <AppContent />
                                    </div>
                                  </EnhancedApplicationRouterProvider>
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
        </AuthErrorBoundary>
    </PreloaderManager>
  </QueryClientProvider>
);

export default App;