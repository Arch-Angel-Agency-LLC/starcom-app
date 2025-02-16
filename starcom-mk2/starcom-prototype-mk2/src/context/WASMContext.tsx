import React, { createContext, useContext, useEffect, useState } from "react";
import { initMiniServer, fetchFromMiniServer } from "../utils/wasm";

// Create WASM Context
const WASMContext = createContext(null);

// Global variable to track initialization state
let wasmInitPromise: Promise<void> | null = null;

// WASM Provider Component
export const WASMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wasmReady, setWasmReady] = useState(false);

  /**
   * Initialize the WASM Mini-Server.
   * @param forceReinitialize - If true, forces re-initialization of the WASM Mini-Server.
   */
  const initializeWASM = async (forceReinitialize = false) => {
    if (forceReinitialize || !wasmInitPromise) {
      wasmInitPromise = initMiniServer().then(() => {
        setWasmReady(true);
        console.log("WASMContext: ✅ WASM Mini-Server Initialized");
      });
    } else {
      wasmInitPromise.then(() => setWasmReady(true));
    }
  };

  // Effect to initialize the WASM Mini-Server on component mount
  useEffect(() => {
    initializeWASM();
  }, []);

  return (
    <WASMContext.Provider value={{ wasmReady, fetchFromMiniServer, initializeWASM }}>
      {children}
    </WASMContext.Provider>
  );
};

// Hook for easy access to WASM context
export const useWASM = () => useContext(WASMContext);