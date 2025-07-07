import React, { useState, ReactNode, useCallback } from 'react';
import { ViewContext } from './ViewContextInstance';

// Define types for our view architecture
export type PageType = 'main' | 'settings';
export type ScreenType = 
  // Main Page Screens
  | 'globe'
  | 'netrunner'
  | 'analyzer'
  | 'nodeweb'
  | 'timeline'
  | 'casemanager'
  | 'teams'
  | 'aiagent'
  | 'botroster'
  
  // Settings Page Screens
  | 'profile'
  | 'appearance'
  | 'security'
  | 'notifications'
  | 'advanced';

// Legacy view mode mapping (for backward compatibility)
export type ViewMode = 'globe' | 'teams' | 'ai-agent' | 'bots' | 'netrunner' | 'info-gathering' | 'info-analysis' | 'node-web' | 'timeline' | 'cases' | 'intel';

// Define the screen params type to avoid 'any'
export interface ScreenParams {
  [key: string]: string | number | boolean | null | undefined;
}

// Map legacy view modes to new screen types
const viewModeToScreenType: Record<ViewMode, ScreenType> = {
  'globe': 'globe',
  'teams': 'teams',
  'ai-agent': 'aiagent',
  'bots': 'botroster',
  'netrunner': 'netrunner',
  'info-gathering': 'netrunner', // Consolidated into NetRunner
  'info-analysis': 'analyzer',   // Renamed to Analyzer
  'node-web': 'nodeweb',
  'timeline': 'timeline',
  'cases': 'casemanager',        // Renamed to CaseManager
  'intel': 'casemanager'         // Consolidated into CaseManager
};

// Define the view state interface
export interface ViewState {
  currentPage: PageType;
  currentScreen: ScreenType;
  screenParams: ScreenParams;
  viewHistory: Array<{
    screen: ScreenType;
    params?: ScreenParams;
  }>;
  isNavAnimating: boolean;
}

// Define the context type
export interface ViewContextType {
  currentPage: PageType;
  currentScreen: ScreenType;
  screenParams: ScreenParams;
  isNavAnimating: boolean;
  
  // Navigation methods
  navigateToScreen: (screen: ScreenType, params?: ScreenParams) => void;
  navigateToPage: (page: PageType, screen?: ScreenType, params?: ScreenParams) => void;
  goBack: () => void;
  setScreenParams: (params: ScreenParams) => void;
  
  // Legacy support
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
}

interface ViewProviderProps {
  children: ReactNode;
}

export const ViewProvider: React.FC<ViewProviderProps> = ({ children }) => {
  // Initialize with default state
  const [viewState, setViewState] = useState<ViewState>({
    currentPage: 'main',
    currentScreen: 'globe',
    screenParams: {},
    viewHistory: [],
    isNavAnimating: false
  });
  
  // For backward compatibility
  const currentView = getViewModeFromScreenType(viewState.currentScreen);
  
  // Navigation methods
  const navigateToScreen = useCallback((screen: ScreenType, params: ScreenParams = {}) => {
    setViewState(prevState => {
      // Don't add to history if navigating to the same screen
      if (prevState.currentScreen === screen && 
          JSON.stringify(prevState.screenParams) === JSON.stringify(params)) {
        return prevState;
      }
      
      // Add current screen to history before changing
      const newHistory = [...prevState.viewHistory];
      if (prevState.currentScreen !== screen) {
        newHistory.push({
          screen: prevState.currentScreen,
          params: prevState.screenParams
        });
      }
      
      return {
        ...prevState,
        currentScreen: screen,
        screenParams: params,
        viewHistory: newHistory,
        isNavAnimating: true
      };
    });
    
    // Reset animation flag after a short delay
    setTimeout(() => {
      setViewState(prevState => ({
        ...prevState,
        isNavAnimating: false
      }));
    }, 300); // Match this with your CSS transition duration
  }, []);
  
  const navigateToPage = useCallback((page: PageType, screen?: ScreenType, params: ScreenParams = {}) => {
    setViewState(prevState => {
      // Determine the target screen
      const targetScreen = screen || 
        (page === 'main' ? 'globe' : 'profile'); // Defaults for each page
      
      // Only add to history if changing pages
      const newHistory = prevState.currentPage !== page ? [] : [...prevState.viewHistory];
      
      return {
        ...prevState,
        currentPage: page,
        currentScreen: targetScreen,
        screenParams: params,
        viewHistory: newHistory,
        isNavAnimating: true
      };
    });
    
    // Reset animation flag after a short delay
    setTimeout(() => {
      setViewState(prevState => ({
        ...prevState,
        isNavAnimating: false
      }));
    }, 300);
  }, []);
  
  const goBack = useCallback(() => {
    setViewState(prevState => {
      if (prevState.viewHistory.length === 0) {
        return prevState; // No history to go back to
      }
      
      // Get the last item from history
      const newHistory = [...prevState.viewHistory];
      const lastScreen = newHistory.pop();
      
      return {
        ...prevState,
        currentScreen: lastScreen?.screen || 'globe',
        screenParams: lastScreen?.params || {},
        viewHistory: newHistory,
        isNavAnimating: true
      };
    });
    
    // Reset animation flag after a short delay
    setTimeout(() => {
      setViewState(prevState => ({
        ...prevState,
        isNavAnimating: false
      }));
    }, 300);
  }, []);
  
  const setScreenParams = useCallback((params: ScreenParams) => {
    setViewState(prevState => ({
      ...prevState,
      screenParams: {
        ...prevState.screenParams,
        ...params
      }
    }));
  }, []);
  
  // Legacy support - map new screen type to old view mode
  const setCurrentView = useCallback((view: ViewMode) => {
    const screen = viewModeToScreenType[view];
    navigateToScreen(screen);
  }, [navigateToScreen]);
  
  // Helper function to convert ScreenType to legacy ViewMode
  function getViewModeFromScreenType(screen: ScreenType): ViewMode {
    // Find the key in the mapping that corresponds to this screen
    const entry = Object.entries(viewModeToScreenType).find(([, s]) => s === screen);
    
    // If found, return the key (which is the ViewMode)
    // If not found (shouldn't happen with proper mapping), default to 'globe'
    return entry ? entry[0] as ViewMode : 'globe';
  }
  
  const value: ViewContextType = {
    currentPage: viewState.currentPage,
    currentScreen: viewState.currentScreen,
    screenParams: viewState.screenParams,
    isNavAnimating: viewState.isNavAnimating,
    navigateToScreen,
    navigateToPage,
    goBack,
    setScreenParams,
    // Legacy support
    currentView,
    setCurrentView
  };

  return (
    <ViewContext.Provider value={value}>
      {children}
    </ViewContext.Provider>
  );
};
