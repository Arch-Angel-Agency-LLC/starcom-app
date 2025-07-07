import React, { createContext, useContext, useState, useEffect } from "react";
import { initializeWASM, fetchFromMiniServer as fetchFromWASM } from "../utils/wasm";

interface WASMContextType {
  wasmReady: boolean;
  fetchFromMiniServer: (url: string) => Promise<unknown>;
}

const WASMContext = createContext<WASMContextType | undefined>(undefined);

interface WASMProviderProps {
  children: React.ReactNode;
}

let wasmInitializationPromise: Promise<void> | null = null;

const WASMProvider: React.FC<WASMProviderProps> = ({ children }) => {
  const [wasmReady, setWasmReady] = useState(false);

  useEffect(() => {
    if (!wasmInitializationPromise) {
      wasmInitializationPromise = initializeWASM().then(() => {
        setWasmReady(true);
      });
    } else {
      wasmInitializationPromise.then(() => {
        setWasmReady(true);
      });
    }
  }, []);

  const fetchFromMiniServer = async (url: string) => {
    return await fetchFromWASM(url);
  };

  return (
    <WASMContext.Provider value={{ wasmReady, fetchFromMiniServer }}>
      {children}
    </WASMContext.Provider>
  );
};

const useWASM = () => {
  const context = useContext(WASMContext);
  if (!context) {
    throw new Error("useWASM must be used within a WASMProvider");
  }
  return context;
};

export { WASMProvider, useWASM, WASMContext };