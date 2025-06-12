import { createContext, useContext, useState, useEffect } from 'react';

// Extend VisualizationMode to include sub-modes
export type VisualizationMode =
  | { mode: 'CyberCommand'; subMode: 'IntelReports' | 'Timelines' | 'CrisisZones' }
  | { mode: 'GeoPolitical'; subMode: 'NationalTerritories' | 'DiplomaticEvents' | 'ResourceZones' }
  | { mode: 'EcoNatural'; subMode: 'SpaceWeather' | 'EcologicalDisasters' | 'EarthWeather' };

// Create a context for VisualizationMode
interface VisualizationModeContextProps {
  visualizationMode: VisualizationMode;
  setVisualizationMode: (mode: VisualizationMode) => void;
  resetVisualizationMode: () => void;
}

const VisualizationModeContext = createContext<VisualizationModeContextProps | undefined>(undefined);

// Provider component
export const VisualizationModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>({ mode: 'CyberCommand', subMode: 'IntelReports' });

  const resetVisualizationMode = () => {
    setVisualizationMode({ mode: 'CyberCommand', subMode: 'IntelReports' }); // Default mode with sub-mode
  };

  useEffect(() => {
    console.log(`VisualizationMode changed to: ${visualizationMode.mode}, SubMode: ${visualizationMode.subMode}`);
  }, [visualizationMode]);

  return (
    <VisualizationModeContext.Provider value={{ visualizationMode, setVisualizationMode, resetVisualizationMode }}>
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