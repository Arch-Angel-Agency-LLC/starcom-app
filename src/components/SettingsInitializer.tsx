import { useEffect } from 'react';
import { secureLogger } from '../security/logging/SecureLogger';
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
      secureLogger.log('debug', 'Settings Initializer: All settings hooks loaded', {
        visualizationMode,
        ecoNaturalLoaded: !!ecoNaturalSettings.config,
        cyberCommandLoaded: !!cyberCommandSettings.config,
        geoPoliticalLoaded: !!geoPoliticalSettings.config
      }, { 
        component: 'SettingsInitializer',
        classification: 'PUBLIC'
      });
      
      // Report storage stats
      const stats = settingsStorage.getStorageStats();
      secureLogger.log('debug', 'Storage stats', stats, { component: 'SettingsInitializer' });
    }
  }, [visualizationMode, ecoNaturalSettings.config, cyberCommandSettings.config, geoPoliticalSettings.config]);

  // Removed excessive useEffect logging for performance

  // This component doesn't render anything - it just ensures settings initialization
  return null;
};

export default SettingsInitializer;
