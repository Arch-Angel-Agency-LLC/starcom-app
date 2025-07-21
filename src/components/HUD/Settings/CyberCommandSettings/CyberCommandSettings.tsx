import React from 'react';
import { useCyberCommandSettings } from '../../../../hooks/useCyberCommandSettings';
import { useSettingsValidation } from '../../../../utils/uiSettingsReflection';
import styles from './CyberCommandSettings.module.css';

interface CyberCommandSettingsProps {
  subMode: 'IntelReports' | 'CyberThreats' | 'CyberAttacks';
}

const CyberCommandSettings: React.FC<CyberCommandSettingsProps> = ({ subMode }) => {
  const { 
    config, 
    updateIntelReports
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

  const renderCyberThreatsSettings = () => (
    <div className={styles.settingsSection}>
      <div className={styles.settingGroup}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" defaultChecked />
          Show Threat Zones
        </label>
      </div>
      <div className={styles.settingGroup}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" defaultChecked />
          Show Malware Origins
        </label>
      </div>
      <div className={styles.settingGroup}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" defaultChecked />
          Show Botnet C&C
        </label>
      </div>
      <div className={styles.comingSoon}>
        Full cyber threat visualization controls coming soon...
      </div>
    </div>
  );

  const renderCyberAttacksSettings = () => (
    <div className={styles.settingsSection}>
      <div className={styles.settingGroup}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" defaultChecked />
          Show Real-time Attacks
        </label>
      </div>
      <div className={styles.settingGroup}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" defaultChecked />
          Show Attack Vectors
        </label>
      </div>
      <div className={styles.settingGroup}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" defaultChecked />
          Show Target Analysis
        </label>
      </div>
      <div className={styles.comingSoon}>
        Full cyber attack visualization controls coming soon...
      </div>
    </div>
  );

  const renderSubModeSettings = () => {
    switch (subMode) {
      case 'IntelReports':
        return renderIntelReportsSettings();
      case 'CyberThreats':
        return renderCyberThreatsSettings();
      case 'CyberAttacks':
        return renderCyberAttacksSettings();
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
