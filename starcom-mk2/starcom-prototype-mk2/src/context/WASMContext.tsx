import React, { createContext, useContext, useEffect, useState } from "react";
import { initWASM, fetchFromMiniServer } from "../utils/wasm";

// Create WASM Context
const WASMContext = createContext(null);

// WASM Provider Component
export const WASMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wasmReady, setWasmReady] = useState(false);

  useEffect(() => {
    async function loadWASM() {
      await initWASM();
      setWasmReady(true);
      console.log("✅ WASM Mini-Server Initialized");
    }
    loadWASM();
  }, []);

  return (
    <WASMContext.Provider value={{ wasmReady, fetchFromMiniServer }}>
      {children}
    </WASMContext.Provider>
  );
};

// Hook for easy access
export const useWASM = () => useContext(WASMContext);