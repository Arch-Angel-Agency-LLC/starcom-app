import { useEffect } from 'react';
import { useEcoNaturalSettings } from '../hooks/useEcoNaturalSettings';
import { useCyberCommandSettings } from '../hooks/useCyberCommandSettings';
import { useGeoPoliticalSettings } from '../hooks/useGeoPoliticalSettings';
import { useVisualizationMode } from '../context/VisualizationModeContext';
import { settingsStorage } from '../utils/settingsStorage';

// AI-NOTE: Component to ensure all persistent settings are properly initialized and reflected in the UI
// This component helps guarantee that the UI state matches the persisted settings

export const SettingsInitializer: React.FC = () => {
  const { visualizationMode } = useVisualizationMode();
  const ecoNaturalSettings = useEcoNaturalSettings();
  const cyberCommandSettings = useCyberCommandSettings();
  const geoPoliticalSettings = useGeoPoliticalSettings();

  useEffect(() => {
    // Log initialization of all settings to ensure they're loaded (only once and in dev mode)
    if (import.meta.env.DEV) {
      console.log('🔧 Settings Initializer: All settings hooks loaded');
      console.log('📊 Current visualization mode:', visualizationMode);
      console.log('🌍 EcoNatural settings loaded:', ecoNaturalSettings.config);
      console.log('💻 CyberCommand settings loaded:', cyberCommandSettings.config);
      console.log('🗺️ GeoPolitical settings loaded:', geoPoliticalSettings.config);
      
      // Report storage stats
      const stats = settingsStorage.getStorageStats();
      console.log('💾 Storage stats:', stats);
    }
  }, [visualizationMode, ecoNaturalSettings.config, cyberCommandSettings.config, geoPoliticalSettings.config]);

  // Removed excessive useEffect logging for performance

  // This component doesn't render anything - it just ensures settings initialization
  return null;
};

export default SettingsInitializer;
