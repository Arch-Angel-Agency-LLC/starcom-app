import React, { createContext, useEffect, useState, useCallback } from "react";
import initWasm, { get_api_data } from "../wasm/wasm_mini_server";

// Define the shape of the WASM context
interface WASMContextType {
  wasmReady: boolean;
  fetchFromMiniServer: (url: string) => Promise<any>;
}

// Create WASM Context with the defined type
const WASMContext = createContext<WASMContextType | undefined>(undefined);

// WASM Provider Component
export const WASMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wasmReady, setWasmReady] = useState(false);

  const initializeWASM = useCallback(async () => {
    try {
      await initWasm();
      setWasmReady(true);
      console.log("WASMContext: ✅ WASM Mini-Server Initialized");
    } catch (error) {
      console.error("WASMContext: ❌ Failed to initialize WASM Mini-Server", error);
    }
  }, []);

  // Effect to initialize the WASM Mini-Server on component mount
  useEffect(() => {
    initializeWASM();
  }, [initializeWASM]);

  const fetchFromMiniServer = useCallback(async (url: string) => {
    if (!wasmReady) {
      throw new Error("WASM not initialized");
    }
    return get_api_data(url);
  }, [wasmReady]);

  return (
    <WASMContext.Provider value={{ wasmReady, fetchFromMiniServer }}>
      {children}
    </WASMContext.Provider>
  );
};

export { WASMContext };