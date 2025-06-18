import { createContext, useContext, useState, useEffect } from 'react';
import { settingsStorage } from '../utils/settingsStorage';

// Extend VisualizationMode to include sub-modes
export type VisualizationMode =
  | { mode: 'CyberCommand'; subMode: 'IntelReports' | 'Timelines' | 'CrisisZones' }
  | { mode: 'GeoPolitical'; subMode: 'NationalTerritories' | 'DiplomaticEvents' | 'ResourceZones' }
  | { mode: 'EcoNatural'; subMode: 'SpaceWeather' | 'EcologicalDisasters' | 'EarthWeather' };

// Interface for tracking last selected submode for each primary mode
interface LastSelectedSubmodes {
  CyberCommand: 'IntelReports' | 'Timelines' | 'CrisisZones';
  GeoPolitical: 'NationalTerritories' | 'DiplomaticEvents' | 'ResourceZones';
  EcoNatural: 'SpaceWeather' | 'EcologicalDisasters' | 'EarthWeather';
}

// Default visualization mode and submodes
const DEFAULT_MODE: VisualizationMode = { mode: 'CyberCommand', subMode: 'IntelReports' };
const DEFAULT_SUBMODES: LastSelectedSubmodes = {
  CyberCommand: 'IntelReports',
  GeoPolitical: 'NationalTerritories',
  EcoNatural: 'SpaceWeather'
};

// Storage keys for persistence
const VISUALIZATION_MODE_STORAGE_KEY = 'visualization-mode';
const LAST_SUBMODES_STORAGE_KEY = 'last-selected-submodes';

// Create a context for VisualizationMode
interface VisualizationModeContextProps {
  visualizationMode: VisualizationMode;
  setVisualizationMode: (mode: VisualizationMode) => void;
  setPrimaryMode: (mode: 'CyberCommand' | 'GeoPolitical' | 'EcoNatural') => void;
  resetVisualizationMode: () => void;
}

const VisualizationModeContext = createContext<VisualizationModeContextProps | undefined>(undefined);

// Provider component
export const VisualizationModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with persisted values or defaults
  const [visualizationMode, setVisualizationModeState] = useState<VisualizationMode>(() => {
    return settingsStorage.loadSettings(VISUALIZATION_MODE_STORAGE_KEY, DEFAULT_MODE);
  });

  const [lastSelectedSubmodes, setLastSelectedSubmodesState] = useState<LastSelectedSubmodes>(() => {
    return settingsStorage.loadSettings(LAST_SUBMODES_STORAGE_KEY, DEFAULT_SUBMODES);
  });

  // Enhanced setter that also persists to storage
  const setVisualizationMode = (mode: VisualizationMode) => {
    setVisualizationModeState(mode);
    settingsStorage.saveSettings(VISUALIZATION_MODE_STORAGE_KEY, mode);
    
    // Update the last selected submode for this primary mode
    setLastSelectedSubmodesState(prev => {
      const updated = { ...prev, [mode.mode]: mode.subMode };
      settingsStorage.saveSettings(LAST_SUBMODES_STORAGE_KEY, updated);
      return updated;
    });
  };

  // New function to set primary mode while preserving last selected submode
  const setPrimaryMode = (mode: 'CyberCommand' | 'GeoPolitical' | 'EcoNatural') => {
    const lastSubMode = lastSelectedSubmodes[mode];
    const newVisualizationMode = { mode, subMode: lastSubMode } as VisualizationMode;
    setVisualizationMode(newVisualizationMode);
  };

  const resetVisualizationMode = () => {
    setVisualizationMode(DEFAULT_MODE);
    setLastSelectedSubmodesState(DEFAULT_SUBMODES);
    settingsStorage.saveSettings(LAST_SUBMODES_STORAGE_KEY, DEFAULT_SUBMODES);
  };

  useEffect(() => {
    console.log(`📊 VisualizationMode changed to: ${visualizationMode.mode}, SubMode: ${visualizationMode.subMode}`);
  }, [visualizationMode]);

  return (
    <VisualizationModeContext.Provider value={{ 
      visualizationMode, 
      setVisualizationMode, 
      setPrimaryMode,
      resetVisualizationMode 
    }}>
      {children}
    </VisualizationModeContext.Provider>
  );
};

// Hook to use the VisualizationMode context
export const useVisualizationMode = () => {
  const context = useContext(VisualizationModeContext);
  if (!context) {
    throw new Error('useVisualizationMode must be used within a VisualizationModeProvider');
  }
  return context;
};