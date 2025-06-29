import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/routes";
import { WASMProvider, useWASM } from "./context/WASMContext";
import { DashboardProvider } from "./context/DashboardContext";
import { GlobeProvider } from "./context/GlobeContext.tsx";
import { VisualizationModeProvider } from "./context/VisualizationModeContext";
import { AuthProvider } from "./context/AuthContext.tsx";
import { MarketplaceProvider } from "./context/MarketplaceContext";
import { SpaceWeatherProvider } from "./context/SpaceWeatherContext";
import { UnifiedGlobalCommandProvider } from "./context/UnifiedGlobalCommandContext";
import { InvestigationProvider } from "./context/InvestigationContext";
import { GlobalGlobeContextMenuProvider } from "./context/GlobalGlobeContextMenuProvider";
import SettingsInitializer from "./components/SettingsInitializer";
import SettingsStatusIndicator from "./components/SettingsStatusIndicator";
import PreloaderManager from "./components/Preloader/PreloaderManager";
import WalletDiagnostic from "./components/Debug/WalletDiagnostic";
import "./styles/globals.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthErrorBoundary from './components/Auth/AuthErrorBoundary';

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const { fetchFromMiniServer, wasmReady } = useWASM();

  useEffect(() => {
    return () => {
      // No cleanup needed
    };
  }, [wasmReady, fetchFromMiniServer]);

  return (
    <>
      <SettingsInitializer />
      <BrowserRouter>
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
      <AuthProvider>
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
                            <AppContent />
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
      </AuthProvider>
    </PreloaderManager>
  </QueryClientProvider>
);

export default App;