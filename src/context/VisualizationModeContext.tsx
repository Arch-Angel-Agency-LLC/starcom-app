import React, { useContext, useState, useEffect, useRef } from 'react';
import { settingsStorage } from '../utils/settingsStorage';
import { pollerRegistry } from '../services/pollerRegistry';
import { makeModeScope } from '../services/pollerScopes';
import { assetLoader } from '../utils/assetLoader';

// Extend VisualizationMode to include sub-modes
export type VisualizationMode =
  | { mode: 'CyberCommand'; subMode: 'IntelReports' | 'CyberThreats' | 'CyberAttacks' | 'Satellites' | 'CommHubs' }
  | { mode: 'GeoPolitical'; subMode: 'NationalTerritories' | 'DiplomaticEvents' | 'ResourceZones' }
  | { mode: 'EcoNatural'; subMode: 'SpaceWeather' | 'EcologicalDisasters' | 'EarthWeather' };

// Interface for tracking last selected submode for each primary mode
interface LastSelectedSubmodes {
  CyberCommand: 'IntelReports' | 'CyberThreats' | 'CyberAttacks' | 'Satellites' | 'CommHubs';
  GeoPolitical: 'NationalTerritories' | 'DiplomaticEvents' | 'ResourceZones';
  EcoNatural: 'SpaceWeather' | 'EcologicalDisasters' | 'EarthWeather';
}

// Default visualization mode and submodes
const DEFAULT_MODE: VisualizationMode = { mode: 'CyberCommand', subMode: 'IntelReports' };
const DEFAULT_SUBMODES: LastSelectedSubmodes = {
  CyberCommand: 'IntelReports',
  GeoPolitical: 'NationalTerritories',
  EcoNatural: 'EcologicalDisasters'
};

// Storage keys for persistence
const VISUALIZATION_MODE_STORAGE_KEY = 'visualization-mode';
const LAST_SUBMODES_STORAGE_KEY = 'last-selected-submodes';
const HEAVY_MODES = new Set(['CyberCommand', 'EcoNatural']);

// Create a context for VisualizationMode
interface VisualizationModeContextProps {
  visualizationMode: VisualizationMode;
  setVisualizationMode: (mode: VisualizationMode) => void;
  setPrimaryMode: (mode: 'CyberCommand' | 'GeoPolitical' | 'EcoNatural') => void;
  resetVisualizationMode: () => void;
}

// Ensure React is properly loaded before creating context
const VisualizationModeContext = React.createContext<VisualizationModeContextProps | undefined>(undefined);

// Provider component
export const VisualizationModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with defaults first, then load from storage
  const [visualizationMode, setVisualizationModeState] = useState<VisualizationMode>(DEFAULT_MODE);
  const [lastSelectedSubmodes, setLastSelectedSubmodesState] = useState<LastSelectedSubmodes>(DEFAULT_SUBMODES);
  const [isInitialized, setIsInitialized] = useState(false);
  const previousModeRef = useRef<VisualizationMode | null>(null);

  // Load persisted settings after component mounts
  useEffect(() => {
    try {
      const persistedMode = settingsStorage.loadSettings(VISUALIZATION_MODE_STORAGE_KEY, DEFAULT_MODE);
      const persistedSubmodes = settingsStorage.loadSettings(LAST_SUBMODES_STORAGE_KEY, DEFAULT_SUBMODES);
      
      setVisualizationModeState(persistedMode);
      setLastSelectedSubmodesState(persistedSubmodes);
      setIsInitialized(true);
      
      console.log('VisualizationModeProvider: Initialized with', persistedMode);
    } catch (error) {
      console.warn('VisualizationModeProvider: Failed to load settings, using defaults', error);
      setIsInitialized(true);
    }
  }, []);

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
    // Only log in dev mode to reduce console noise
    if (import.meta.env.DEV) {
      console.log(`📊 VisualizationMode changed to: ${visualizationMode.mode}, SubMode: ${visualizationMode.subMode}`);
    }
  }, [visualizationMode]);

  useEffect(() => {
    if (!isInitialized) {
      previousModeRef.current = visualizationMode;
      return;
    }
    const previous = previousModeRef.current;
    if (previous && previous.mode !== visualizationMode.mode) {
      pollerRegistry.stopAll(makeModeScope(previous.mode));
      if (HEAVY_MODES.has(previous.mode) && !HEAVY_MODES.has(visualizationMode.mode)) {
        assetLoader.purgeCache('mode-change');
      }
    }
    previousModeRef.current = visualizationMode;
  }, [visualizationMode.mode, isInitialized, visualizationMode]);

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