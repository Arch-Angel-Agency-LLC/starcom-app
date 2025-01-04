import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobeContextType {
  ucdpData: any;
  setUcdpData: React.Dispatch<React.SetStateAction<any>>;
}

const GlobeContext = createContext<GlobeContextType | undefined>(undefined);

export const GlobeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ucdpData, setUcdpData] = useState(null);

  return (
    <GlobeContext.Provider value={{ ucdpData, setUcdpData }}>
      {children}
    </GlobeContext.Provider>
  );
};

export const useGlobeContext = () => {
  const context = useContext(GlobeContext);
  if (!context) throw new Error('useGlobeContext must be used within a GlobeProvider');
  return context;
};