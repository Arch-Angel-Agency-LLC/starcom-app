import React, { useState } from 'react';
import { useEcoNaturalSettings } from '../../../../hooks/useEcoNaturalSettings';
import { useSettingsValidation } from '../../../../utils/uiSettingsReflection';
import CompactSpaceWeatherControls from './CompactSpaceWeatherControlsMock';
import styles from './SpaceWeatherSettings.module.css';

// AI-NOTE: EcoNatural visualization settings panel for all natural/environmental data
// Redesigned with compact, modular controls optimized for 100px width sidebar

interface SpaceWeatherSettingsProps {
  subMode: 'SpaceWeather' | 'EcologicalDisasters' | 'EarthWeather';
}

const SpaceWeatherSettings: React.FC<SpaceWeatherSettingsProps> = ({ subMode }) => {
  const { 
    config, 
    updateSpaceWeather, 
    updateEcologicalDisasters, 
    updateEarthWeather 
  } = useEcoNaturalSettings();

  // State for the old NOAA popup (to be removed)
  const [showNOAAPopup, setShowNOAAPopup] = useState(false);

  // Validate that UI state reflects persistent settings
  // Note: Simplified validation to avoid type mismatches
  useSettingsValidation('SpaceWeatherSettings', {
    vectorIntensity: config.spaceWeather?.vectorIntensity,
    timeRange: config.ecologicalDisasters?.timeRange, 
    forecastRange: config.earthWeather?.forecastRange
  }, {
    vectorIntensity: config.spaceWeather?.vectorIntensity,
    timeRange: config.ecologicalDisasters?.timeRange,
    forecastRange: config.earthWeather?.forecastRange
  });

  // Handler for opening NOAA popup (temporary)
  const openNOAAPopup = () => {
    setShowNOAAPopup(true);
  };

  // FOR ALL SUBMODES: Use compact controls
  return (
    <div className={styles.compactContainer}>
      <div className={styles.subModeTitle}>{subMode}</div>
      <CompactSpaceWeatherControls subMode={subMode} />
      
      {/* Temporary old popup for compatibility */}
      {showNOAAPopup && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <h3>NOAA Controls (Legacy)</h3>
            <p>Use the new compact controls above instead.</p>
            <button onClick={() => setShowNOAAPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSpaceWeatherSettings = () => (
    <div className={styles.spaceWeatherSettings}>
      {/* NOAA Popup Button */}
      <div className={styles.section}>
        <button 
          className={styles.noaaButton}
          onClick={openNOAAPopup}
          aria-label="Open NOAA Space Weather Controls"
        >
          🌡️ NOAA Controls
        </button>
      </div>
      
      {/* Data Layer Toggles */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>⚡ Data</div>
        
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={config.spaceWeather.showElectricFields}
            onChange={(e) => updateSpaceWeather({ showElectricFields: e.target.checked })}
            className={styles.checkbox}
          />
          <span className={styles.toggleLabel}>⚡ Fields</span>
        </label>

        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={config.spaceWeather.showGeomagneticIndex}
            onChange={(e) => updateSpaceWeather({ showGeomagneticIndex: e.target.checked })}
            className={styles.checkbox}
          />
          <span className={styles.toggleLabel}>🧲 Dst</span>
        </label>

        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={config.spaceWeather.showAlerts}
            onChange={(e) => updateSpaceWeather({ showAlerts: e.target.checked })}
            className={styles.checkbox}
          />
          <span className={styles.toggleLabel}>🚨 Alerts</span>
        </label>
      </div>

      {/* Visualization Controls */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>🎨 Visual</div>
        
        <div className={styles.sliderRow}>
          <label className={styles.sliderLabel}>
            💪 {config.spaceWeather.vectorIntensity}%
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

        <div className={styles.sliderRow}>
          <label className={styles.sliderLabel}>
            👁️ {config.spaceWeather.vectorOpacity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={config.spaceWeather.vectorOpacity}
            onChange={(e) => updateSpaceWeather({ vectorOpacity: parseInt(e.target.value) })}
            className={styles.slider}
          />
        </div>

        <div className={styles.sliderRow}>
          <label className={styles.sliderLabel}>
            🎯 Vector Scale {Math.round(config.spaceWeather.vectorScale || 1)}x
          </label>
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
          <label className={styles.sliderLabel}>
            🌡️ Heat Map {config.spaceWeather.heatMapIntensity || 50}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={config.spaceWeather.heatMapIntensity || 50}
            onChange={(e) => updateSpaceWeather({ heatMapIntensity: parseInt(e.target.value) })}
            className={styles.slider}
          />
        </div>

        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={config.spaceWeather.showMagneticField || false}
            onChange={(e) => updateSpaceWeather({ showMagneticField: e.target.checked })}
            className={styles.checkbox}
          />
          <span className={styles.toggleLabel}>🧭 Field Lines</span>
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

      {/* Electric Field Normalization Controls */}
      {config.spaceWeather.showElectricFields && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>🔧 Normalization</div>
          
          <div className={styles.selectRow}>
            <label className={styles.selectLabel}>Method:</label>
            <select
              value={config.spaceWeather.normalization.method}
              onChange={(e) => updateSpaceWeather({
                normalization: { 
                  ...config.spaceWeather.normalization, 
                  method: e.target.value as 'linear' | 'logarithmic' | 'percentile' | 'statistical' | 'adaptive'
                }
              })}
              className={styles.select}
            >
              <option value="adaptive">🤖 Adaptive</option>
              <option value="percentile">📊 Percentile</option>
              <option value="statistical">📈 Statistical</option>
              <option value="logarithmic">📉 Logarithmic</option>
              <option value="linear">📏 Linear</option>
            </select>
          </div>

          <div className={styles.sliderRow}>
            <label className={styles.sliderLabel}>
              🎯 Outlier Factor {config.spaceWeather.normalization.outlierFactor.toFixed(1)}
            </label>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={config.spaceWeather.normalization.outlierFactor}
              onChange={(e) => updateSpaceWeather({
                normalization: { 
                  ...config.spaceWeather.normalization, 
                  outlierFactor: parseFloat(e.target.value) 
                }
              })}
              className={styles.slider}
            />
          </div>

          <div className={styles.sliderRow}>
            <label className={styles.sliderLabel}>
              🌊 Smoothing {Math.round(config.spaceWeather.normalization.smoothingFactor * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.spaceWeather.normalization.smoothingFactor}
              onChange={(e) => updateSpaceWeather({
                normalization: { 
                  ...config.spaceWeather.normalization, 
                  smoothingFactor: parseFloat(e.target.value) 
                }
              })}
              className={styles.slider}
            />
          </div>

          {config.spaceWeather.normalization.method === 'percentile' && (
            <div className={styles.rangeRow}>
              <label className={styles.rangeLabel}>
                📊 Range: {config.spaceWeather.normalization.percentileRange[0]}-{config.spaceWeather.normalization.percentileRange[1]}%
              </label>
              <div className={styles.rangeInputs}>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={config.spaceWeather.normalization.percentileRange[0]}
                  onChange={(e) => updateSpaceWeather({
                    normalization: { 
                      ...config.spaceWeather.normalization, 
                      percentileRange: [parseInt(e.target.value), config.spaceWeather.normalization.percentileRange[1]]
                    }
                  })}
                  className={styles.rangeSlider}
                />
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={config.spaceWeather.normalization.percentileRange[1]}
                  onChange={(e) => updateSpaceWeather({
                    normalization: { 
                      ...config.spaceWeather.normalization, 
                      percentileRange: [config.spaceWeather.normalization.percentileRange[0], parseInt(e.target.value)]
                    }
                  })}
                  className={styles.rangeSlider}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Geomagnetic Analysis */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>📊 Analysis</div>
        
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={config.spaceWeather.showKpIndex || false}
            onChange={(e) => updateSpaceWeather({ showKpIndex: e.target.checked })}
            className={styles.checkbox}
          />
          <span className={styles.toggleLabel}>📈 Kp Index</span>
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
            checked={config.spaceWeather.showMagnetopause || false}
            onChange={(e) => updateSpaceWeather({ showMagnetopause: e.target.checked })}
            className={styles.checkbox}
          />
          <span className={styles.toggleLabel}>🛡️ Magnetosphere</span>
        </label>

        <div className={styles.sliderRow}>
          <label className={styles.sliderLabel}>
            ⏰ Time Window {config.spaceWeather.timeWindow || 24}h
          </label>
          <input
            type="range"
            min="1"
            max="72"
            value={config.spaceWeather.timeWindow || 24}
            onChange={(e) => updateSpaceWeather({ timeWindow: parseInt(e.target.value) })}
            className={styles.slider}
          />
        </div>
      </div>

      {/* Alert Thresholds */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>⚠️ Limits</div>
        
        <div className={styles.thresholdRow}>
          <label className={styles.thresholdLabel}>🟡:</label>
          <input
            type="number"
            value={config.spaceWeather.alertThresholds.moderate}
            onChange={(e) => updateSpaceWeather({
              alertThresholds: { ...config.spaceWeather.alertThresholds, moderate: parseInt(e.target.value) || 1000 }
            })}
            className={styles.numberInput}
          />
          <span className={styles.unit}>mV</span>
        </div>

        <div className={styles.thresholdRow}>
          <label className={styles.thresholdLabel}>🟠:</label>
          <input
            type="number"
            value={config.spaceWeather.alertThresholds.high}
            onChange={(e) => updateSpaceWeather({
              alertThresholds: { ...config.spaceWeather.alertThresholds, high: parseInt(e.target.value) || 3000 }
            })}
            className={styles.numberInput}
          />
          <span className={styles.unit}>mV</span>
        </div>

        <div className={styles.thresholdRow}>
          <label className={styles.thresholdLabel}>🔴:</label>
          <input
            type="number"
            value={config.spaceWeather.alertThresholds.extreme}
            onChange={(e) => updateSpaceWeather({
              alertThresholds: { ...config.spaceWeather.alertThresholds, extreme: parseInt(e.target.value) || 5000 }
            })}
            className={styles.numberInput}
          />
          <span className={styles.unit}>mV</span>
        </div>
      </div>
    </div>
  );

  const renderEcologicalDisastersSettings = () => (
    <div className={styles.ecoNaturalSettings}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>🌪️ Disaster Types</div>
        {Object.entries(config.ecologicalDisasters.disasterTypes).map(([key, enabled]) => (
          <label key={key} className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => updateEcologicalDisasters({
                disasterTypes: {
                  ...config.ecologicalDisasters.disasterTypes,
                  [key]: e.target.checked
                }
              })}
              className={styles.checkbox}
            />
            <span className={styles.toggleLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
          </label>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>⚠️ Severity</div>
        {Object.entries(config.ecologicalDisasters.severity).map(([key, enabled]) => (
          <label key={key} className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => updateEcologicalDisasters({
                severity: {
                  ...config.ecologicalDisasters.severity,
                  [key]: e.target.checked
                }
              })}
              className={styles.checkbox}
            />
            <span className={styles.toggleLabel}>{key.replace('show', '')}</span>
          </label>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>🎯 Display</div>
        
        <div className={styles.sliderRow}>
          <label className={styles.sliderLabel}>
            📅 Time Range: {config.ecologicalDisasters.timeRange} days
          </label>
          <input
            type="range"
            min="1"
            max="30"
            value={config.ecologicalDisasters.timeRange}
            onChange={(e) => updateEcologicalDisasters({ timeRange: parseInt(e.target.value) })}
            className={styles.slider}
          />
        </div>

        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={config.ecologicalDisasters.showImpactRadius}
            onChange={(e) => updateEcologicalDisasters({ showImpactRadius: e.target.checked })}
            className={styles.checkbox}
          />
          <span className={styles.toggleLabel}>Show Impact Radius</span>
        </label>

        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={config.ecologicalDisasters.showEvacuationZones}
            onChange={(e) => updateEcologicalDisasters({ showEvacuationZones: e.target.checked })}
            className={styles.checkbox}
          />
          <span className={styles.toggleLabel}>Show Evacuation Zones</span>
        </label>
      </div>
    </div>
  );

  const renderEarthWeatherSettings = () => (
    <div className={styles.ecoNaturalSettings}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>🌤️ Weather Layers</div>
        {Object.entries(config.earthWeather.weatherLayers).map(([key, enabled]) => (
          <label key={key} className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => updateEarthWeather({
                weatherLayers: {
                  ...config.earthWeather.weatherLayers,
                  [key]: e.target.checked
                }
              })}
              className={styles.checkbox}
            />
            <span className={styles.toggleLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
          </label>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>⚙️ Display Mode</div>
        
        <select
          value={config.earthWeather.displayMode}
          onChange={(e) => updateEarthWeather({ displayMode: e.target.value as 'realtime' | 'forecast' | 'historical' })}
          className={styles.select}
        >
          <option value="realtime">Real-time</option>
          <option value="forecast">Forecast</option>
          <option value="historical">Historical</option>
        </select>

        {config.earthWeather.displayMode === 'forecast' && (
          <div className={styles.sliderRow}>
            <label className={styles.sliderLabel}>
              📅 Forecast: {config.earthWeather.forecastRange}h
            </label>
            <input
              type="range"
              min="1"
              max="240"
              value={config.earthWeather.forecastRange}
              onChange={(e) => updateEarthWeather({ forecastRange: parseInt(e.target.value) })}
              className={styles.slider}
            />
          </div>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>📊 Units</div>
        
        <div className={styles.unitRow}>
          <label className={styles.unitLabel}>Temperature:</label>
          <select
            value={config.earthWeather.temperatureUnit}
            onChange={(e) => updateEarthWeather({ temperatureUnit: e.target.value as 'celsius' | 'fahrenheit' | 'kelvin' })}
            className={styles.unitSelect}
          >
            <option value="celsius">°C</option>
            <option value="fahrenheit">°F</option>
            <option value="kelvin">K</option>
          </select>
        </div>

        <div className={styles.unitRow}>
          <label className={styles.unitLabel}>Wind:</label>
          <select
            value={config.earthWeather.windUnit}
            onChange={(e) => updateEarthWeather({ windUnit: e.target.value as 'kmh' | 'mph' | 'ms' | 'knots' })}
            className={styles.unitSelect}
          >
            <option value="kmh">km/h</option>
            <option value="mph">mph</option>
            <option value="ms">m/s</option>
            <option value="knots">knots</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSubModeSettings = () => {
    switch (subMode) {
      case 'SpaceWeather':
        return renderSpaceWeatherSettings();
      case 'EcologicalDisasters':
        return renderEcologicalDisastersSettings();
      case 'EarthWeather':
        return renderEarthWeatherSettings();
      default:
        return renderSpaceWeatherSettings();
    }
  };

  return (
    <div className={styles.ecoNaturalContainer}>
      <div className={styles.subModeTitle}>{subMode}</div>
      {renderSubModeSettings()}
    </div>
  );
};

export default SpaceWeatherSettings;
