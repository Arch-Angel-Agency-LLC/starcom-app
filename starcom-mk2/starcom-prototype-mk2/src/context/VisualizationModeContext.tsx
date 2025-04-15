import { createContext, useContext, useState, useEffect } from 'react';

// Define the VisualizationMode type
export type VisualizationMode = 'geoMagnetics' | 'intelReports' | 'solarSystem';

// Create a context for VisualizationMode
interface VisualizationModeContextProps {
  visualizationMode: VisualizationMode;
  setVisualizationMode: (mode: VisualizationMode) => void;
  resetVisualizationMode: () => void;
}

const VisualizationModeContext = createContext<VisualizationModeContextProps | undefined>(undefined);

// Provider component
export const VisualizationModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('geoMagnetics');

  const resetVisualizationMode = () => {
    setVisualizationMode('geoMagnetics'); // Default mode
  };

  useEffect(() => {
    console.log(`VisualizationMode changed to: ${visualizationMode}`);
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