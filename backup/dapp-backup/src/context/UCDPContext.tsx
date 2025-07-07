import React, { createContext, useState, useContext, ReactNode } from 'react';

interface UCDPContextType {
  data: unknown;
  setData: React.Dispatch<React.SetStateAction<unknown>>;
}

const UCDPContext = createContext<UCDPContextType | undefined>(undefined);

export const UCDPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState(null);

  return <UCDPContext.Provider value={{ data, setData }}>{children}</UCDPContext.Provider>;
};

export const useUCDP = () => {
  const context = useContext(UCDPContext);
  if (!context) throw new Error('useUCDP must be used within a UCDPProvider');
  return context;
};