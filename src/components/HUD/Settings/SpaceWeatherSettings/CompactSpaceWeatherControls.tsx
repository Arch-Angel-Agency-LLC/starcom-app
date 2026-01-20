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
type DatasetKey = 'intermag' | 'usCanada' | 'pipeline';

const defaultDatasetState: Record<DatasetKey, boolean> = {
  intermag: true,
  usCanada: true,
  pipeline: false
};

const CompactSpaceWeatherControls: React.FC<CompactSpaceWeatherControlsProps> = ({ subMode }) => {
  const { config, updateSpaceWeather } = useEcoNaturalSettings();
  const { 
    visualizationVectors, 
    isLoading, 
    error, 
    lastUpdated,
    telemetry
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

  const enabledDatasets = config.spaceWeather.enabledDatasets || defaultDatasetState;

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

  const handleDatasetToggle = (dataset: DatasetKey) => {
    const nextState: Record<DatasetKey, boolean> = {
      ...defaultDatasetState,
      ...enabledDatasets,
      [dataset]: !enabledDatasets[dataset]
    };
    updateSpaceWeather({ enabledDatasets: nextState });
  };

  const datasetOptions: Array<{ key: DatasetKey; label: string; accent: string; count: number }> = [
    { key: 'intermag', label: 'InterMag', accent: 'cyan', count: telemetry?.rawInterMag ?? 0 },
    { key: 'usCanada', label: 'US/Canada', accent: 'orange', count: telemetry?.rawUSCanada ?? 0 },
    { key: 'pipeline', label: 'Pipeline', accent: 'purple', count: telemetry?.rawPipeline ?? 0 }
  ];

  const samplingMode = config.spaceWeather.samplingMode || 'legacy-topN';

  const handleSamplingModeChange = (mode: 'legacy-topN' | 'grid-binning') => {
    updateSpaceWeather({ samplingMode: mode });
  };

  const handleSamplingNumberChange = (field: 'gridBinSize' | 'legacyCap' | 'magnitudeFloor', value: number) => {
    if (Number.isNaN(value)) return;
    let clamped = value;
    switch (field) {
      case 'gridBinSize':
        clamped = Math.min(20, Math.max(1, value));
        break;
      case 'legacyCap':
        clamped = Math.min(5000, Math.max(50, value));
        break;
      case 'magnitudeFloor':
        clamped = Math.min(5000, Math.max(0, value));
        break;
    }
    updateSpaceWeather({ [field]: clamped } as Partial<typeof config.spaceWeather>);
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

      {/* Dataset toggles */}
      <div className={styles.datasetGroup}>
        <div className={styles.datasetHeader}>Datasets</div>
        <div className={styles.datasetButtons}>
          {datasetOptions.map(option => {
            const active = enabledDatasets?.[option.key];
            return (
              <button
                key={option.key}
                type="button"
                className={`${styles.datasetButton} ${active ? styles.datasetButtonActive : ''}`}
                onClick={() => handleDatasetToggle(option.key)}
                aria-pressed={active}
                title={`${option.label} • ${option.count} vectors`}
                style={{ borderColor: active ? option.accent : undefined }}
              >
                <span>{option.label}</span>
                <span className={styles.datasetCount}>{option.count}</span>
              </button>
            );
          })}
        </div>
      </div>

        {/* Sampling controls */}
        <div className={styles.samplingGroup}>
          <div className={styles.samplingHeader}>Sampling</div>
          <div className={styles.samplingModes}>
            <button
              type="button"
              className={`${styles.samplingModeButton} ${samplingMode === 'legacy-topN' ? styles.samplingModeActive : ''}`}
              onClick={() => handleSamplingModeChange('legacy-topN')}
              title="Legacy: Top-N vectors prioritized by magnitude and quality"
            >
              Legacy
            </button>
            <button
              type="button"
              className={`${styles.samplingModeButton} ${samplingMode === 'grid-binning' ? styles.samplingModeActive : ''}`}
              onClick={() => handleSamplingModeChange('grid-binning')}
              title="Grid: Spatial binning to balance hemispheres"
            >
              Grid
            </button>
          </div>
          <div className={styles.samplingInputs}>
            <label className={styles.samplingInput}>
              <span>Bin °</span>
              <input
                type="number"
                min={1}
                max={20}
                value={config.spaceWeather.gridBinSize ?? 5}
                onChange={(e) => handleSamplingNumberChange('gridBinSize', parseInt(e.target.value, 10))}
                disabled={samplingMode !== 'grid-binning'}
              />
            </label>
            <label className={styles.samplingInput}>
              <span>Cap</span>
              <input
                type="number"
                min={50}
                max={5000}
                value={config.spaceWeather.legacyCap ?? 500}
                onChange={(e) => handleSamplingNumberChange('legacyCap', parseInt(e.target.value, 10))}
                disabled={samplingMode !== 'legacy-topN'}
              />
            </label>
            <label className={styles.samplingInput}>
              <span>Floor mV</span>
              <input
                type="number"
                min={0}
                max={5000}
                value={config.spaceWeather.magnitudeFloor ?? 0}
                onChange={(e) => handleSamplingNumberChange('magnitudeFloor', parseInt(e.target.value, 10))}
              />
            </label>
          </div>
        </div>

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
