import React, { createContext, useContext, ReactNode } from 'react';

// Basic Global Command Context
interface GlobalCommandState {
  mode: 'tactical' | 'strategic' | 'diplomatic';
  activeCommand: string | null;
  isProcessing: boolean;
}

interface GlobalCommandContextType {
  state: GlobalCommandState;
  setMode: (mode: GlobalCommandState['mode']) => void;
  executeCommand: (command: string) => Promise<void>;
  clearCommand: () => void;
}

const defaultState: GlobalCommandState = {
  mode: 'tactical',
  activeCommand: null,
  isProcessing: false,
};

const GlobalCommandContext = createContext<GlobalCommandContextType | null>(null);

export const useGlobalCommand = () => {
  const context = useContext(GlobalCommandContext);
  if (!context) {
    throw new Error('useGlobalCommand must be used within a UnifiedGlobalCommandProvider');
  }
  return context;
};

interface GlobalCommandProviderProps {
  children: ReactNode;
}

export const GlobalCommandProvider: React.FC<GlobalCommandProviderProps> = ({ children }) => {
  const [state, setState] = React.useState<GlobalCommandState>(defaultState);

  const setMode = (mode: GlobalCommandState['mode']) => {
    setState(prev => ({ ...prev, mode }));
  };

  const executeCommand = async (command: string) => {
    setState(prev => ({ ...prev, activeCommand: command, isProcessing: true }));
    
    try {
      // Simulate command execution
      await new Promise(resolve => setTimeout(resolve, 100));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const clearCommand = () => {
    setState(prev => ({ ...prev, activeCommand: null, isProcessing: false }));
  };

  const value: GlobalCommandContextType = {
    state,
    setMode,
    executeCommand,
    clearCommand,
  };

  return (
    <GlobalCommandContext.Provider value={value}>
      {children}
    </GlobalCommandContext.Provider>
  );
};

export { GlobalCommandContext };
export default GlobalCommandContext;
