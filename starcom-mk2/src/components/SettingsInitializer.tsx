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
    // Log initialization of all settings to ensure they're loaded
    console.log('🔧 Settings Initializer: All settings hooks loaded');
    console.log('📊 Current visualization mode:', visualizationMode);
    console.log('🌍 EcoNatural settings loaded:', ecoNaturalSettings.config);
    console.log('💻 CyberCommand settings loaded:', cyberCommandSettings.config);
    console.log('🗺️ GeoPolitical settings loaded:', geoPoliticalSettings.config);
    
    // Report storage stats
    const stats = settingsStorage.getStorageStats();
    console.log('💾 Storage stats:', stats);
  }, [visualizationMode, ecoNaturalSettings.config, cyberCommandSettings.config, geoPoliticalSettings.config]);

  useEffect(() => {
    // Log when visualization mode changes to track persistence
    console.log('📱 UI State Update - Visualization mode changed:', visualizationMode);
  }, [visualizationMode]);

  useEffect(() => {
    // Log when settings change to track persistence
    console.log('⚙️ UI State Update - EcoNatural settings changed');
  }, [ecoNaturalSettings.config]);

  useEffect(() => {
    // Log when settings change to track persistence
    console.log('⚙️ UI State Update - CyberCommand settings changed');
  }, [cyberCommandSettings.config]);

  useEffect(() => {
    // Log when settings change to track persistence
    console.log('⚙️ UI State Update - GeoPolitical settings changed');
  }, [geoPoliticalSettings.config]);

  // This component doesn't render anything - it just ensures settings initialization
  return null;
};

export default SettingsInitializer;
