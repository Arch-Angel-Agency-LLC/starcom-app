import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/routes";
import { WASMProvider, useWASM } from "./context/WASMContext";
import { DashboardProvider } from "./context/DashboardContext";
import { GlobeProvider } from "./context/GlobeContext.tsx";
import { VisualizationModeProvider } from "./context/VisualizationModeContext";
import { AuthProvider } from "./context/AuthContext.tsx";
import { MarketplaceProvider } from "./context/MarketplaceContext";
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
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </VisualizationModeProvider>
    </>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AuthErrorBoundary>
        <WASMProvider>
          <DashboardProvider>
            <GlobeProvider>
              <MarketplaceProvider>
                <AppContent />
              </MarketplaceProvider>
            </GlobeProvider>
          </DashboardProvider>
        </WASMProvider>
      </AuthErrorBoundary>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;