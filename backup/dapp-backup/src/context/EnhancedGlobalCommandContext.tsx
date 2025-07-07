import React, { createContext, useContext, ReactNode } from 'react';
import { GlobalCommandProvider } from './GlobalCommandContext';

// Enhanced Global Command Context with additional features
interface EnhancedGlobalCommandState {
  mode: 'tactical' | 'strategic' | 'diplomatic';
  activeCommand: string | null;
  isProcessing: boolean;
  commandHistory: string[];
  permissions: string[];
  securityLevel: 'standard' | 'enhanced' | 'classified';
}

interface EnhancedGlobalCommandContextType {
  state: EnhancedGlobalCommandState;
  setMode: (mode: EnhancedGlobalCommandState['mode']) => void;
  executeCommand: (command: string) => Promise<void>;
  executeSecureCommand: (command: string, securityToken?: string) => Promise<void>;
  clearCommand: () => void;
  getCommandHistory: () => string[];
  hasPermission: (permission: string) => boolean;
  setSecurityLevel: (level: EnhancedGlobalCommandState['securityLevel']) => void;
}

const defaultEnhancedState: EnhancedGlobalCommandState = {
  mode: 'tactical',
  activeCommand: null,
  isProcessing: false,
  commandHistory: [],
  permissions: ['basic', 'read', 'tactical'],
  securityLevel: 'standard',
};

const EnhancedGlobalCommandContext = createContext<EnhancedGlobalCommandContextType | null>(null);

export const useEnhancedGlobalCommand = () => {
  const context = useContext(EnhancedGlobalCommandContext);
  if (!context) {
    throw new Error('useEnhancedGlobalCommand must be used within an EnhancedGlobalCommandProvider');
  }
  return context;
};

interface EnhancedGlobalCommandProviderProps {
  children: ReactNode;
}

export const EnhancedGlobalCommandProvider: React.FC<EnhancedGlobalCommandProviderProps> = ({ children }) => {
  const [state, setState] = React.useState<EnhancedGlobalCommandState>(defaultEnhancedState);

  const setMode = (mode: EnhancedGlobalCommandState['mode']) => {
    setState(prev => ({ ...prev, mode }));
  };

  const executeCommand = async (command: string) => {
    setState(prev => ({ 
      ...prev, 
      activeCommand: command, 
      isProcessing: true,
      commandHistory: [...prev.commandHistory, command].slice(-10) // Keep last 10 commands
    }));
    
    try {
      // Simulate command execution
      await new Promise(resolve => setTimeout(resolve, 100));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const executeSecureCommand = async (command: string, securityToken?: string) => {
    if (state.securityLevel === 'classified' && !securityToken) {
      throw new Error('Security token required for classified operations');
    }

    setState(prev => ({ 
      ...prev, 
      activeCommand: command, 
      isProcessing: true,
      commandHistory: [...prev.commandHistory, `[SECURE] ${command}`].slice(-10)
    }));
    
    try {
      // Simulate secure command execution
      await new Promise(resolve => setTimeout(resolve, 150));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const clearCommand = () => {
    setState(prev => ({ ...prev, activeCommand: null, isProcessing: false }));
  };

  const getCommandHistory = () => {
    return state.commandHistory;
  };

  const hasPermission = (permission: string) => {
    return state.permissions.includes(permission);
  };

  const setSecurityLevel = (level: EnhancedGlobalCommandState['securityLevel']) => {
    setState(prev => ({ ...prev, securityLevel: level }));
  };

  const value: EnhancedGlobalCommandContextType = {
    state,
    setMode,
    executeCommand,
    executeSecureCommand,
    clearCommand,
    getCommandHistory,
    hasPermission,
    setSecurityLevel,
  };

  return (
    <GlobalCommandProvider>
      <EnhancedGlobalCommandContext.Provider value={value}>
        {children}
      </EnhancedGlobalCommandContext.Provider>
    </GlobalCommandProvider>
  );
};

export { EnhancedGlobalCommandContext };
export default EnhancedGlobalCommandContext;
