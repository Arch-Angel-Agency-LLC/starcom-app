import React from 'react';
import { useCyberCommandSettings } from '../../../../hooks/useCyberCommandSettings';
import { useSettingsValidation } from '../../../../utils/uiSettingsReflection';
import styles from './CyberCommandSettings.module.css';

interface CyberCommandSettingsProps {
  subMode: 'IntelReports' | 'Timelines' | 'CrisisZones';
}

const CyberCommandSettings: React.FC<CyberCommandSettingsProps> = ({ subMode }) => {
  const { 
    config, 
    updateIntelReports, 
    updateTimelines, 
    updateCrisisZones
  } = useCyberCommandSettings();

  // Validate that UI state reflects persistent settings
  useSettingsValidation('CyberCommandSettings', config as unknown as Record<string, unknown>, {
    'intelReports.overlayOpacity': config.intelReports.overlayOpacity,
    'timelines.animationSpeed': config.timelines.animationSpeed,
    'crisisZones.alertLevel': config.crisisZones.alertLevel
  });

  const renderIntelReportsSettings = () => (
    <div className={styles.settingsSection}>
      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>
          Overlay Opacity: {config.intelReports.overlayOpacity}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.intelReports.overlayOpacity}
          onChange={(e) => updateIntelReports({ overlayOpacity: parseInt(e.target.value) })}
          className={styles.slider}
        />
      </div>

      <div className={styles.settingGroup}>
        <h5 className={styles.subheading}>Report Filtering</h5>
        {Object.entries(config.intelReports.reportFiltering).map(([key, enabled]) => (
          <label key={key} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => updateIntelReports({
                reportFiltering: {
                  ...config.intelReports.reportFiltering,
                  [key]: e.target.checked
                }
              })}
            />
            Show {key} priority
          </label>
        ))}
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={config.intelReports.autoRefresh}
            onChange={(e) => updateIntelReports({ autoRefresh: e.target.checked })}
          />
          Auto-refresh reports
        </label>

        {config.intelReports.autoRefresh && (
          <div className={styles.subSetting}>
            <label className={styles.settingLabel}>
              Refresh Interval: {config.intelReports.refreshInterval} min
            </label>
            <input
              type="range"
              min="1"
              max="60"
              value={config.intelReports.refreshInterval}
              onChange={(e) => updateIntelReports({ refreshInterval: parseInt(e.target.value) })}
              className={styles.slider}
            />
          </div>
        )}
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>
          Max Reports: {config.intelReports.maxReports}
        </label>
        <input
          type="range"
          min="10"
          max="200"
          value={config.intelReports.maxReports}
          onChange={(e) => updateIntelReports({ maxReports: parseInt(e.target.value) })}
          className={styles.slider}
        />
      </div>
    </div>
  );

  const renderTimelinesSettings = () => (
    <div className={styles.settingsSection}>
      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>
          Time Range: {config.timelines.timeRange} hours
        </label>
        <input
          type="range"
          min="6"
          max="168"
          value={config.timelines.timeRange}
          onChange={(e) => updateTimelines({ timeRange: parseInt(e.target.value) })}
          className={styles.slider}
        />
      </div>

      <div className={styles.settingGroup}>
        <h5 className={styles.subheading}>Event Categories</h5>
        {Object.entries(config.timelines.eventCategories).map(([key, enabled]) => (
          <label key={key} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => updateTimelines({
                eventCategories: {
                  ...config.timelines.eventCategories,
                  [key]: e.target.checked
                }
              })}
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>
          Animation Speed: {config.timelines.animationSpeed.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.1"
          max="2.0"
          step="0.1"
          value={config.timelines.animationSpeed}
          onChange={(e) => updateTimelines({ animationSpeed: parseFloat(e.target.value) })}
          className={styles.slider}
        />
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>
          Marker Size: {config.timelines.markerSize.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={config.timelines.markerSize}
          onChange={(e) => updateTimelines({ markerSize: parseFloat(e.target.value) })}
          className={styles.slider}
        />
      </div>
    </div>
  );

  const renderCrisisZonesSettings = () => (
    <div className={styles.settingsSection}>
      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>Alert Level</label>
        <select
          value={config.crisisZones.alertLevel}
          onChange={(e) => updateCrisisZones({ alertLevel: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
          className={styles.select}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className={styles.settingGroup}>
        <h5 className={styles.subheading}>Zone Categories</h5>
        {Object.entries(config.crisisZones.zoneCategories).map(([key, enabled]) => (
          <label key={key} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => updateCrisisZones({
                zoneCategories: {
                  ...config.crisisZones.zoneCategories,
                  [key]: e.target.checked
                }
              })}
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={config.crisisZones.showRadius}
            onChange={(e) => updateCrisisZones({ showRadius: e.target.checked })}
          />
          Show Crisis Radius
        </label>
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={config.crisisZones.blinkAlerts}
            onChange={(e) => updateCrisisZones({ blinkAlerts: e.target.checked })}
          />
          Blink Alerts
        </label>
      </div>

      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>
          Intensity Threshold: {config.crisisZones.intensityThreshold}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.crisisZones.intensityThreshold}
          onChange={(e) => updateCrisisZones({ intensityThreshold: parseInt(e.target.value) })}
          className={styles.slider}
        />
      </div>
    </div>
  );

  const renderSubModeSettings = () => {
    switch (subMode) {
      case 'IntelReports':
        return renderIntelReportsSettings();
      case 'Timelines':
        return renderTimelinesSettings();
      case 'CrisisZones':
        return renderCrisisZonesSettings();
      default:
        return renderIntelReportsSettings();
    }
  };

  return (
    <div className={styles.cyberCommandSettings}>
      <div className={styles.subModeTitle}>{subMode}</div>
      {renderSubModeSettings()}
    </div>
  );
};

export default CyberCommandSettings;
