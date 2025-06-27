import React from 'react';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import SpaceWeatherSettings from '../../Settings/SpaceWeatherSettings/SpaceWeatherSettings';
import CyberCommandSettings from '../../Settings/CyberCommandSettings/CyberCommandSettings';
import GeoPoliticalSettings from '../../Settings/GeoPoliticalSettings/GeoPoliticalSettings';
import styles from './ModeSettingsPanel.module.css';

// AI-NOTE: Dynamic settings panel that displays different controls based on visualization mode
// Integrates with NOAA space weather data and other visualization systems

const ModeSettingsPanel: React.FC = () => {
  const { visualizationMode } = useVisualizationMode();

  const renderSettingsForMode = () => {
    switch (visualizationMode.mode) {
      case 'EcoNatural':
        return <SpaceWeatherSettings subMode={visualizationMode.subMode} />;
      case 'CyberCommand':
        return <CyberCommandSettings subMode={visualizationMode.subMode} />;
      case 'GeoPolitical':
        return <GeoPoliticalSettings subMode={visualizationMode.subMode} />;
      default:
        return (
          <div className={styles.placeholderSettings}>
            <div className={styles.modeTitle}>
              Unknown Mode
            </div>
            <div className={styles.comingSoon}>
              Settings coming soon...
            </div>
          </div>
        );
    }
  };

  return (
    <div className={styles.modeSettingsPanel}>
      <div className={styles.header}>
        <div className={styles.modeIndicator}>
          {visualizationMode.mode}
        </div>
        <div className={styles.subModeIndicator}>
          {visualizationMode.subMode}
        </div>
      </div>
      <div className={styles.settingsContent}>
        {renderSettingsForMode()}
      </div>
    </div>
  );
};

export default ModeSettingsPanel;
