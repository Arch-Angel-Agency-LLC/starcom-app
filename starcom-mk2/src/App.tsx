import React, { useEffect, useState } from "react";
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

const config = getDefaultConfig({
  appName: "Starcom dApp",
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "06f5dc3f3e7a9680c053d22f0ec1d242",
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const { fetchFromMiniServer, wasmReady } = useWASM();
  const [fetchPromise, setFetchPromise] = useState<Promise<void> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const data = await fetchFromMiniServer("https://jsonplaceholder.typicode.com/todos/1");
        if (isMounted) {
          console.log("Fetched data:", data);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching data:", error);
          let retryCount = 0;
          const maxRetries = 5;
          const retryFetch = async () => {
            if (retryCount < maxRetries) {
              retryCount++;
              const delay = Math.pow(2, retryCount) * 1000;
              setTimeout(async () => {
                try {
                  const data = await fetchFromMiniServer("https://jsonplaceholder.typicode.com/todos/1");
                  if (isMounted) {
                    console.log("Fetched data on retry:", data);
                  }
                } catch (retryError) {
                  if (isMounted) {
                    console.error("Retry error fetching data:", retryError);
                    retryFetch();
                  }
                }
              }, delay);
            } else {
              console.error("Max retries reached. Could not fetch data.");
            }
          };
          retryFetch();
        }
      }
    };

    if (wasmReady && !fetchPromise) {
      const promise = fetchData();
      setFetchPromise(promise);
    }

    return () => {
      isMounted = false;
    };
  }, [wasmReady, fetchFromMiniServer, fetchPromise]);

  return (
    <VisualizationModeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </VisualizationModeProvider>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={config}>
      <RainbowKitProvider>
        <AuthProvider>
          <WASMProvider>
            <DashboardProvider>
              <GlobeProvider>
                <MarketplaceProvider>
                  <AppContent />
                </MarketplaceProvider>
              </GlobeProvider>
            </DashboardProvider>
          </WASMProvider>
        </AuthProvider>
      </RainbowKitProvider>
    </WagmiProvider>
  </QueryClientProvider>
);

export default App;