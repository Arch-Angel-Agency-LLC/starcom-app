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
import SettingsInitializer from "./components/SettingsInitializer";
import SettingsStatusIndicator from "./components/SettingsStatusIndicator";
import PreloaderManager from "./components/Preloader/PreloaderManager";
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
      <VisualizationModeProvider>
        <SettingsInitializer />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <SettingsStatusIndicator />
      </VisualizationModeProvider>
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
              <GlobeProvider>
                <SpaceWeatherProvider>
                  <MarketplaceProvider>
                    <AppContent />
                  </MarketplaceProvider>
                </SpaceWeatherProvider>
              </GlobeProvider>
            </DashboardProvider>
          </WASMProvider>
        </AuthErrorBoundary>
      </AuthProvider>
    </PreloaderManager>
  </QueryClientProvider>
);

export default App;