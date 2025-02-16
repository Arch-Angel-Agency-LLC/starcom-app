import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/routes";
import { WASMProvider } from "./context/WASMContext";
import { useWASM } from "./hooks/useWASM";
import "./styles/globals.css";

const AppContent: React.FC = () => {
  const { fetchFromMiniServer, wasmReady } = useWASM();

  useEffect(() => {
    console.log("WASM Ready:", wasmReady);
    let isMounted = true;

    const fetchData = async () => {
      console.log("fetchData called");
      try {
        console.log("trying to fetch data");
        const data = await fetchFromMiniServer("https://jsonplaceholder.typicode.com/todos/1");
        if (isMounted) {
          console.log("Fetched data:", data);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching data:", error);
          // Retry logic with exponential backoff
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

    if (wasmReady) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [wasmReady, fetchFromMiniServer]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

const App: React.FC = () => (
  <WASMProvider>
    <AppContent />
  </WASMProvider>
);

export default App;