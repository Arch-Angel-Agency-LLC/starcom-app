import React, { useState } from 'react';
import { useEcoNaturalSettings } from '../../../../hooks/useEcoNaturalSettings';
import styles from './CompactSpaceWeatherControlsSimple.module.css';

interface CompactSpaceWeatherControlsProps {
  subMode: 'SpaceWeather' | 'EcologicalDisasters' | 'EarthWeather';
}

const CompactSpaceWeatherControls: React.FC<CompactSpaceWeatherControlsProps> = ({ subMode }) => {
  const { config, updateSpaceWeather } = useEcoNaturalSettings();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Mock data for testing UI
  const mockVectorCount = config.spaceWeather.showElectricFields ? 127 : 0;
  const mockIsLoading = false;
  const mockError = null;
  const mockLastUpdated = new Date();

  const handleRefresh = () => {
    console.log('🔄 Space Weather data refresh requested');
    // In real implementation, this would call the context refresh function
  };

  return (
    <div className={styles.compactControls}>
      {/* Status indicator */}
      <div className={styles.statusBar}>
        <div className={styles.statusInfo}>
          {mockIsLoading && <span className={styles.statusDot} title="Loading data">●</span>}
          {mockError && <span className={styles.errorDot} title={mockError}>●</span>}
          {!mockIsLoading && !mockError && <span className={styles.successDot} title="Connected">●</span>}
        </div>
        <div className={styles.vectorCount}>
          {mockVectorCount} pts
        </div>
      </div>

      {/* Main toggle for electric fields */}
      <div className={styles.mainToggle}>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={config.spaceWeather.showElectricFields}
            onChange={(e) => {
              console.log('⚡ Electric Fields toggled:', e.target.checked);
              updateSpaceWeather({ showElectricFields: e.target.checked });
            }}
            className={styles.checkbox}
          />
          <span className={styles.toggleLabel}>⚡ Electric Fields</span>
        </label>
      </div>

      {/* Intensity slider when electric fields are enabled */}
      {config.spaceWeather.showElectricFields && (
        <div className={styles.intensityControl}>
          <label className={styles.sliderLabel}>
            Intensity: {config.spaceWeather.vectorIntensity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={config.spaceWeather.vectorIntensity}
            onChange={(e) => {
              console.log('💪 Intensity changed:', e.target.value);
              updateSpaceWeather({ vectorIntensity: parseInt(e.target.value) });
            }}
            className={styles.slider}
          />
        </div>
      )}

      {/* Secondary toggles */}
      <div className={styles.secondaryToggles}>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={config.spaceWeather.showMagneticField || false}
            onChange={(e) => {
              console.log('🧲 Magnetic Field toggled:', e.target.checked);
              updateSpaceWeather({ showMagneticField: e.target.checked });
            }}
            className={styles.checkbox}
          />
          <span className={styles.toggleLabel}>🧲 Magnetic</span>
        </label>

        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={config.spaceWeather.showSolarWind || false}
            onChange={(e) => {
              console.log('💨 Solar Wind toggled:', e.target.checked);
              updateSpaceWeather({ showSolarWind: e.target.checked });
            }}
            className={styles.checkbox}
          />
          <span className={styles.toggleLabel}>💨 Solar Wind</span>
        </label>

        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={config.spaceWeather.showAuroralOval || false}
            onChange={(e) => {
              console.log('🌌 Aurora toggled:', e.target.checked);
              updateSpaceWeather({ showAuroralOval: e.target.checked });
            }}
            className={styles.checkbox}
          />
          <span className={styles.toggleLabel}>🌌 Aurora</span>
        </label>
      </div>

      {/* Refresh and Advanced */}
      <div className={styles.actions}>
        <button
          className={styles.refreshButton}
          onClick={handleRefresh}
          disabled={mockIsLoading}
          title="Refresh data"
        >
          🔄
        </button>
        <button
          className={styles.advancedButton}
          onClick={() => setShowAdvanced(!showAdvanced)}
          title="Advanced settings"
        >
          ⚙️
        </button>
      </div>

      {/* Last updated timestamp */}
      <div className={styles.lastUpdated}>
        Updated: {mockLastUpdated.toLocaleTimeString()}
      </div>

      {/* Advanced settings panel */}
      {showAdvanced && (
        <div className={styles.advancedPanel}>
          <div className={styles.advancedContent}>
            <h4>Advanced Settings</h4>
            
            <div className={styles.sliderRow}>
              <label>Vector Scale: {(config.spaceWeather.vectorScale || 1).toFixed(1)}x</label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={config.spaceWeather.vectorScale || 1}
                onChange={(e) => {
                  console.log('🎯 Vector Scale changed:', e.target.value);
                  updateSpaceWeather({ vectorScale: parseFloat(e.target.value) });
                }}
                className={styles.slider}
              />
            </div>

            <div className={styles.sliderRow}>
              <label>Opacity: {config.spaceWeather.vectorOpacity}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={config.spaceWeather.vectorOpacity}
                onChange={(e) => {
                  console.log('👁️ Opacity changed:', e.target.value);
                  updateSpaceWeather({ vectorOpacity: parseInt(e.target.value) });
                }}
                className={styles.slider}
              />
            </div>

            <label className={styles.toggleRow}>
              <input
                type="checkbox"
                checked={config.spaceWeather.showAlerts}
                onChange={(e) => {
                  console.log('🚨 Alerts toggled:', e.target.checked);
                  updateSpaceWeather({ showAlerts: e.target.checked });
                }}
                className={styles.checkbox}
              />
              <span className={styles.toggleLabel}>🚨 Alerts</span>
            </label>

            <button 
              className={styles.closeAdvanced} 
              onClick={() => setShowAdvanced(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactSpaceWeatherControls;
