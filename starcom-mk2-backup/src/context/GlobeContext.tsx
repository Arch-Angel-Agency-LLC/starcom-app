// src/context/GlobeContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobeContextType {
  focusLocation: { lat: number; lng: number } | null;
  setFocusLocation: (location: { lat: number; lng: number } | null) => void;
}

const GlobeContext = createContext<GlobeContextType | undefined>(undefined);

export const GlobeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <GlobeContext.Provider value={{ focusLocation, setFocusLocation }}>
      {children}
    </GlobeContext.Provider>
  );
};

export const useGlobeContext = () => {
  const context = useContext(GlobeContext);
  if (!context) throw new Error('useGlobeContext must be used within a GlobeProvider');
  return context;
};