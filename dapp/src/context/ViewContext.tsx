import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ViewMode = 'globe' | 'teams' | 'bots' | 'node-web' | 'investigations' | 'intel';

interface ViewContextType {
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

interface ViewProviderProps {
  children: ReactNode;
}

export const ViewProvider: React.FC<ViewProviderProps> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewMode>('globe');

  return (
    <ViewContext.Provider value={{ currentView, setCurrentView }}>
      {children}
    </ViewContext.Provider>
  );
};

export const useView = () => {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
};
