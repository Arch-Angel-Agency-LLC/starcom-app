import React, { useState } from 'react';
import { useEcoNaturalSettings } from '../../../../hooks/useEcoNaturalSettings';
import { useSpaceWeatherContext } from '../../../../context/SpaceWeatherContext';
import styles from './CompactSpaceWeatherControlsSimple.module.css';

interface CompactSpaceWeatherControlsProps {
  subMode: 'SpaceWeather' | 'EcologicalDisasters' | 'EarthWeather';
}

declare global {
  interface Window { STARCOM_SPACEWEATHER_ENHANCED_SAMPLING?: boolean }
}
const CompactSpaceWeatherControls: React.FC<CompactSpaceWeatherControlsProps> = ({ subMode: _subMode }) => {
  const { config, updateSpaceWeather } = useEcoNaturalSettings();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Use real SpaceWeatherContext for debugging
  const {
    visualizationVectors,
    isLoading,
    error,
    lastUpdated,
    refresh,
    interMagData,
    usCanadaData,
    telemetry,
    diagnostics
  } = useSpaceWeatherContext();

  // Debug information
  const cacheStats = diagnostics?.cache?.stats;
  const latestProvider = diagnostics?.providers?.entries?.[0];
  const latestAdapter = diagnostics?.adapters?.entries?.[0];

  const debugInfo = {
    electricFieldsEnabled: config.spaceWeather.showElectricFields,
    vectorCount: visualizationVectors?.length || 0,
    interMagCount: interMagData?.vectors?.length || 0,
    usCanadaCount: usCanadaData?.vectors?.length || 0,
  totalRawData: (interMagData?.vectors?.length || 0) + (usCanadaData?.vectors?.length || 0),
  samplingStrategy: telemetry?.samplingStrategy,
  sampled: telemetry?.sampled,
    unit: telemetry?.unit,
    cacheEntries: cacheStats?.totalEntries ?? 0
  };

  console.log('🔍 Space Weather Debug Info:', debugInfo);

  const handleRefresh = () => {
    console.log('🔄 Space Weather data refresh requested');
    refresh();
  };

  return (
    <div className={styles.compactControls}>
      {/* Status indicator with debug info */}
      <div className={styles.statusBar}>
        <div className={styles.statusInfo}>
          {isLoading && <span className={styles.statusDot} title="Loading data">●</span>}
          {error && <span className={styles.errorDot} title={error}>●</span>}
          {!isLoading && !error && <span className={styles.successDot} title="Connected">●</span>}
        </div>
        <div className={styles.vectorCount} title={`InterMag: ${debugInfo.interMagCount}, US-Canada: ${debugInfo.usCanadaCount}, Rendered: ${debugInfo.vectorCount}`}>
          {debugInfo.vectorCount} / {debugInfo.totalRawData}
        </div>
      </div>

      {/* Debug panel */}
      <div style={{ fontSize: '8px', color: '#666', padding: '2px', lineHeight: 1.2 }}>
        IM:{debugInfo.interMagCount} US:{debugInfo.usCanadaCount} R:{debugInfo.vectorCount}
        <br /> Samp:{telemetry?.sampled} Strat:{telemetry?.samplingStrategy === 'grid-binning' ? 'GRID' : 'TOPN'}
        <br /> Unit:{telemetry?.unit}
        <br /> Cache:{cacheStats?.totalEntries ?? 0} entries
        <br /> Provider:{latestProvider ? `${latestProvider.datasetId} ${latestProvider.success ? '✅' : '⚠️'} ${Math.round(latestProvider.durationMs)}ms` : '—'}
        <br /> Adapter:{latestAdapter ? `${latestAdapter.adapterId} ${latestAdapter.success ? '✅' : '⚠️'} ${Math.round(latestAdapter.durationMs)}ms` : '—'}
      </div>

      {/* Main toggle for electric fields */}
      <div className={styles.mainToggle}>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={config.spaceWeather.showElectricFields}
            onChange={(e) => {
              console.log('⚡ Electric Fields toggled:', e.target.checked, 'Current vectors:', debugInfo.vectorCount);
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
              console.log('💪 Intensity changed:', e.target.value, 'Vectors:', debugInfo.vectorCount);
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
            
            <div style={{ fontSize: '9px', marginBottom: '8px', color: '#888' }}>
              <div>InterMag Data: {debugInfo.interMagCount} points</div>
              <div>US-Canada Data: {debugInfo.usCanadaCount} points</div>
              <div>Rendered Vectors: {debugInfo.vectorCount}</div>
              <div>Electric Fields: {config.spaceWeather.showElectricFields ? 'ON' : 'OFF'}</div>
              <div>Sampling: {telemetry?.samplingStrategy}</div>
              <div>Sampled Count: {telemetry?.sampled}</div>
              <div>Unit: {telemetry?.unit}</div>
              <div>Cache Entries: {cacheStats?.totalEntries ?? 0}</div>
              <div>Avg Cache Hits: {cacheStats ? cacheStats.averageHits.toFixed(1) : '0.0'}</div>
              <div>Provider Last: {latestProvider ? `${latestProvider.datasetId} (${Math.round(latestProvider.durationMs)}ms)` : '—'}</div>
              <div>Adapter Last: {latestAdapter ? `${latestAdapter.adapterId} (${Math.round(latestAdapter.durationMs)}ms)` : '—'}</div>
            </div>

            <div style={{ marginBottom: '6px' }}>
              <label className={styles.toggleRow} style={{ fontSize: '10px' }}>
                <input
                  type="checkbox"
                  onChange={(e) => {
                    window.STARCOM_SPACEWEATHER_ENHANCED_SAMPLING = e.target.checked;
                    updateSpaceWeather({ enhancedSampling: e.target.checked });
                    console.log('🧪 Enhanced sampling flag set & persisted:', e.target.checked);
                    refresh();
                  }}
                  defaultChecked={window.STARCOM_SPACEWEATHER_ENHANCED_SAMPLING === true || config.spaceWeather.enhancedSampling === true}
                />
                <span className={styles.toggleLabel}>Enhanced Sampling (Grid)</span>
              </label>
            </div>
            
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
