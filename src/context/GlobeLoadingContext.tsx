import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobeLoadingContextType {
  hasGlobeLoadedBefore: boolean;
  markGlobeAsLoaded: () => void;
  isGlobeInitialized: boolean;
  setGlobeInitialized: (initialized: boolean) => void;
}

const GlobeLoadingContext = createContext<GlobeLoadingContextType | undefined>(undefined);

interface GlobeLoadingProviderProps {
  children: ReactNode;
}

export const GlobeLoadingProvider: React.FC<GlobeLoadingProviderProps> = ({ children }) => {
  const [hasGlobeLoadedBefore, setHasGlobeLoadedBefore] = useState(false);
  const [isGlobeInitialized, setIsGlobeInitialized] = useState(false);

  const markGlobeAsLoaded = () => {
    setHasGlobeLoadedBefore(true);
  };

  const setGlobeInitialized = (initialized: boolean) => {
    setIsGlobeInitialized(initialized);
  };

  return (
    <GlobeLoadingContext.Provider value={{ 
      hasGlobeLoadedBefore, 
      markGlobeAsLoaded, 
      isGlobeInitialized, 
      setGlobeInitialized 
    }}>
      {children}
    </GlobeLoadingContext.Provider>
  );
};

export const useGlobeLoading = () => {
  const context = useContext(GlobeLoadingContext);
  if (!context) {
    throw new Error('useGlobeLoading must be used within a GlobeLoadingProvider');
  }
  return context;
};
