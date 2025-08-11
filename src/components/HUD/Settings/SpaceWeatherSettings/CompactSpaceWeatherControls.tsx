// CompactSpaceWeatherControls.tsx - Redesigned compact controls for EcoNatural SpaceWeather mode

import React, { useState } from 'react';
import { useEcoNaturalSettings } from '../../../../hooks/useEcoNaturalSettings';
import { useSpaceWeatherContext } from '../../../../context/SpaceWeatherContext';
import SpaceWeatherPresets from './SpaceWeatherPresets';
import SpaceWeatherIntensity from './SpaceWeatherIntensity';
import NOAADataToggle from './NOAADataToggle';
import AdvancedNOAATabbed from './AdvancedNOAATabbed';
import styles from './CompactSpaceWeatherControls.module.css';

interface CompactSpaceWeatherControlsProps {
  subMode: 'SpaceWeather' | 'EcologicalDisasters' | 'EarthWeather';
}

/**
 * Compact, modular space weather controls designed for 100px width
 * Simplifies 30+ NOAA datasets into manageable presets and categories
 */
const CompactSpaceWeatherControls: React.FC<CompactSpaceWeatherControlsProps> = ({ subMode }) => {
  const { config, updateSpaceWeather } = useEcoNaturalSettings();
  const { 
    visualizationVectors, 
    isLoading, 
    error, 
    lastUpdated
  } = useSpaceWeatherContext();
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handler for preset changes with proper typing
  const handlePresetChange = (preset: 'quiet' | 'moderate' | 'storm' | 'extreme') => {
    updateSpaceWeather({ preset });
    
    // Apply preset-specific settings to visualization
    switch (preset) {
      case 'quiet':
        updateSpaceWeather({
          vectorIntensity: 20,
          vectorOpacity: 40,
          showElectricFields: true,
          showGeomagneticIndex: false,
          showSolarWind: false
        });
        break;
      case 'moderate':
        updateSpaceWeather({
          vectorIntensity: 50,
          vectorOpacity: 60,
          showElectricFields: true,
          showGeomagneticIndex: true,
          showSolarWind: true
        });
        break;
      case 'storm':
        updateSpaceWeather({
          vectorIntensity: 75,
          vectorOpacity: 80,
          showElectricFields: true,
          showGeomagneticIndex: true,
          showSolarWind: true,
          showMagneticField: true,
          showAuroralOval: true
        });
        break;
      case 'extreme':
        updateSpaceWeather({
          vectorIntensity: 100,
          vectorOpacity: 100,
          showElectricFields: true,
          showGeomagneticIndex: true,
          showSolarWind: true,
          showMagneticField: true,
          showAuroralOval: true,
          showKpIndex: true
        });
        break;
    }
  };

  // Handler for category toggles
  const handleCategoryToggle = (category: 'solar' | 'geomagnetic' | 'radiation', enabled: boolean) => {
    switch (category) {
      case 'solar':
        updateSpaceWeather({
          showSolarWind: enabled,
          showMagnetopause: enabled
        });
        break;
      case 'geomagnetic':
        updateSpaceWeather({
          showElectricFields: enabled,
          showGeomagneticIndex: enabled,
          showMagneticField: enabled,
          showAuroralOval: enabled
        });
        break;
      case 'radiation':
        updateSpaceWeather({
          showKpIndex: enabled,
          showAlerts: enabled
        });
        break;
    }
  };

  if (subMode !== 'SpaceWeather') {
    return null; // Only show for SpaceWeather submode
  }

  return (
    <div className={styles.compactControls}>
      {/* Status indicator */}
      <div className={styles.statusBar}>
        {isLoading && <span className={styles.statusDot}>●</span>}
        {error && <span className={styles.errorDot}>●</span>}
        {visualizationVectors.length > 0 && (
          <span className={styles.vectorCount}>{visualizationVectors.length}</span>
        )}
      </div>

      {/* Space Weather Activity Presets - Primary Control */}
      <SpaceWeatherPresets 
        currentPreset={config.spaceWeather.preset || 'moderate'}
        onPresetChange={handlePresetChange}
      />

      {/* Overall Intensity Control */}
      <SpaceWeatherIntensity
        intensity={config.spaceWeather.vectorIntensity || 50}
        opacity={config.spaceWeather.vectorOpacity || 50}
        onIntensityChange={(intensity) => updateSpaceWeather({ vectorIntensity: intensity })}
        onOpacityChange={(opacity) => updateSpaceWeather({ vectorOpacity: opacity })}
      />

      {/* Quick Data Category Toggles */}
      <NOAADataToggle
        solarEnabled={config.spaceWeather.showSolarWind}
        geomagneticEnabled={config.spaceWeather.showElectricFields}
        radiationEnabled={config.spaceWeather.showKpIndex}
        onSolarToggle={(enabled) => handleCategoryToggle('solar', enabled)}
        onGeomagneticToggle={(enabled) => handleCategoryToggle('geomagnetic', enabled)}
        onRadiationToggle={(enabled) => handleCategoryToggle('radiation', enabled)}
      />

      {/* Advanced Settings - Compact Button */}
      <div className={styles.advancedSection}>
        <button
          className={styles.advancedButton}
          onClick={() => setShowAdvanced(!showAdvanced)}
          title="Advanced NOAA Dataset Controls"
          disabled={isLoading}
        >
          <span className={styles.advancedIcon}>⚙️</span>
          <span className={styles.advancedLabel}>NOAA</span>
        </button>
        {lastUpdated && (
          <div className={styles.lastUpdated}>
            {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Advanced Settings Tabbed Popup */}
      {showAdvanced && (
        <AdvancedNOAATabbed
          onClose={() => setShowAdvanced(false)}
        />
      )}
    </div>
  );
};

export default CompactSpaceWeatherControls;
