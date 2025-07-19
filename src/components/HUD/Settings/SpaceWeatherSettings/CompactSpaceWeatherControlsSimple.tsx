import React, { useState } from 'react';
import { useEcoNaturalSettings } from '../../../../hooks/useEcoNaturalSettings';
import { useSpaceWeatherContext } from '../../../../context/SpaceWeatherContext';
import styles from './CompactSpaceWeatherControls.module.css';

interface CompactSpaceWeatherControlsProps {
  subMode: 'SpaceWeather' | 'EcologicalDisasters' | 'EarthWeather';
}

const CompactSpaceWeatherControls: React.FC<CompactSpaceWeatherControlsProps> = ({ subMode }) => {
  const { config, updateSpaceWeather } = useEcoNaturalSettings();
  const { 
    visualizationVectors, 
    isLoading, 
    error, 
    lastUpdated,
    refresh
  } = useSpaceWeatherContext();
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className={styles.compactControls}>
      {/* Status indicator */}
      <div className={styles.statusBar}>
        <div className={styles.statusInfo}>
          {isLoading && <span className={styles.statusDot} title="Loading data">●</span>}
          {error && <span className={styles.errorDot} title={error}>●</span>}
          {!isLoading && !error && <span className={styles.successDot} title="Connected">●</span>}
        </div>
        <div className={styles.vectorCount}>
          {visualizationVectors?.length || 0} pts
        </div>
      </div>

      {/* Main toggle for electric fields */}
      <div className={styles.mainToggle}>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={config.spaceWeather.showElectricFields}
            onChange={(e) => updateSpaceWeather({ showElectricFields: e.target.checked })}
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
            onChange={(e) => updateSpaceWeather({ vectorIntensity: parseInt(e.target.value) })}
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
            onChange={(e) => updateSpaceWeather({ showMagneticField: e.target.checked })}
            className={styles.checkbox}
          />
          <span className={styles.toggleLabel}>🧲 Magnetic</span>
        </label>

        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={config.spaceWeather.showSolarWind || false}
            onChange={(e) => updateSpaceWeather({ showSolarWind: e.target.checked })}
            className={styles.checkbox}
          />
          <span className={styles.toggleLabel}>💨 Solar Wind</span>
        </label>

        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={config.spaceWeather.showAuroralOval || false}
            onChange={(e) => updateSpaceWeather({ showAuroralOval: e.target.checked })}
            className={styles.checkbox}
          />
          <span className={styles.toggleLabel}>🌌 Aurora</span>
        </label>
      </div>

      {/* Refresh and Advanced */}
      <div className={styles.actions}>
        <button
          className={styles.refreshButton}
          onClick={refresh}
          disabled={isLoading}
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
      {lastUpdated && (
        <div className={styles.lastUpdated}>
          Updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

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
                onChange={(e) => updateSpaceWeather({ vectorScale: parseFloat(e.target.value) })}
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
                onChange={(e) => updateSpaceWeather({ vectorOpacity: parseInt(e.target.value) })}
                className={styles.slider}
              />
            </div>

            <label className={styles.toggleRow}>
              <input
                type="checkbox"
                checked={config.spaceWeather.showAlerts}
                onChange={(e) => updateSpaceWeather({ showAlerts: e.target.checked })}
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
