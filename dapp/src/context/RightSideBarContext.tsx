import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface RightSideBarContextType {
  isCollapsed: boolean;
  sidebarWidth: number;
  activeSection: string;
  setIsCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setActiveSection: (section: string) => void;
}

const defaultContext: RightSideBarContextType = {
  isCollapsed: false,
  sidebarWidth: 120, // Default width
  activeSection: 'mission',
  setIsCollapsed: () => {},
  setSidebarWidth: () => {},
  setActiveSection: () => {}
};

const RightSideBarContext = createContext<RightSideBarContextType>(defaultContext);

interface RightSideBarProviderProps {
  children: ReactNode;
}

export const RightSideBarProvider: React.FC<RightSideBarProviderProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(120);
  const [activeSection, setActiveSection] = useState('mission');

  // Calculate and update width when state changes
  useEffect(() => {
    // Calculate sidebar width based on state
    const calculatedWidth = isCollapsed 
      ? 40 
      : (activeSection === 'chat' ? 320 : 120);
    
    setSidebarWidth(calculatedWidth);
    
    // Update CSS custom property for other components to use
    document.documentElement.style.setProperty('--right-sidebar-width', `${calculatedWidth}px`);
  }, [isCollapsed, activeSection]);

  const contextValue: RightSideBarContextType = {
    isCollapsed,
    sidebarWidth,
    activeSection,
    setIsCollapsed,
    setSidebarWidth,
    setActiveSection
  };

  return (
    <RightSideBarContext.Provider value={contextValue}>
      {children}
    </RightSideBarContext.Provider>
  );
};

export default RightSideBarContext;
