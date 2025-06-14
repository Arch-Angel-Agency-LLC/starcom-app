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
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { http } from "wagmi";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthErrorBoundary from './components/Auth/AuthErrorBoundary';

const config = getDefaultConfig({
  appName: "Starcom dApp",
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "06f5dc3f3e7a9680c053d22f0ec1d242",
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  appUrl: "http://localhost:5173", // Explicitly set to match actual page URL, no trailing slash
});

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
    <WagmiProvider config={config}>
      <RainbowKitProvider>
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
      </RainbowKitProvider>
    </WagmiProvider>
  </QueryClientProvider>
);

export default App;