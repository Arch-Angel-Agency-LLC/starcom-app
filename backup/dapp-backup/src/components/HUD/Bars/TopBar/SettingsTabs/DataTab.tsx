// DataTab.tsx
// Data settings tab for Marquee Settings
import React from 'react';
import { EnhancedSettings } from '../EnhancedSettingsPopup';
import styles from './DataTab.module.css';

export interface DataTabProps {
  settings: EnhancedSettings;
  onSettingChange: <K extends keyof EnhancedSettings>(key: K, value: EnhancedSettings[K]) => void;
  previewMode: boolean;
}

const DataTab: React.FC<DataTabProps> = ({
  settings,
  onSettingChange,
  previewMode,
}) => {
  return (
    <div className={styles.dataTab}>
      <div className={styles.tabSection}>
        <h3 className={styles.sectionTitle}>
          🔄 Update Frequency
        </h3>
        <p className={styles.sectionDescription}>
          Control how often data is refreshed and updated in the marquee.
        </p>
        
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Update Interval
            <span className={styles.currentValue}>
              {settings.updateFrequency / 1000}s
            </span>
          </label>
          
          <div className={styles.sliderContainer}>
            <span className={styles.sliderMin}>1s</span>
            <input
              type="range"
              min="1"
              max="60"
              step="1"
              value={settings.updateFrequency / 1000}
              onChange={(e) => onSettingChange('updateFrequency', parseInt(e.target.value) * 1000)}
              className={styles.slider}
            />
            <span className={styles.sliderMax}>60s</span>
          </div>
          
          <div className={styles.presetButtons}>
            <button 
              className={`${styles.presetButton} ${settings.updateFrequency === 1000 ? styles.active : ''}`}
              onClick={() => onSettingChange('updateFrequency', 1000)}
            >
              ⚡ Real-time (1s)
            </button>
            <button 
              className={`${styles.presetButton} ${settings.updateFrequency === 5000 ? styles.active : ''}`}
              onClick={() => onSettingChange('updateFrequency', 5000)}
            >
              🚀 Fast (5s)
            </button>
            <button 
              className={`${styles.presetButton} ${settings.updateFrequency === 15000 ? styles.active : ''}`}
              onClick={() => onSettingChange('updateFrequency', 15000)}
            >
              🐌 Normal (15s)
            </button>
          </div>
        </div>
      </div>

      <div className={styles.tabSection}>
        <h3 className={styles.sectionTitle}>
          📊 Data Management
        </h3>
        <p className={styles.sectionDescription}>
          Configure data handling and display limits.
        </p>
        
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Maximum Data Points
            <span className={styles.currentValue}>
              {settings.maxDataPoints} items
            </span>
          </label>
          
          <div className={styles.sliderContainer}>
            <span className={styles.sliderMin}>5</span>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={settings.maxDataPoints}
              onChange={(e) => onSettingChange('maxDataPoints', parseInt(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.sliderMax}>50</span>
          </div>
        </div>

        <div className={styles.toggleGroup}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.enableRealTime}
              onChange={(e) => onSettingChange('enableRealTime', e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>
              🔴 Real-time Updates
              <span className={styles.toggleDescription}>
                Enable live data streaming for supported sources
              </span>
            </span>
          </label>

          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.prioritizeCritical}
              onChange={(e) => onSettingChange('prioritizeCritical', e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>
              🚨 Prioritize Critical Data
              <span className={styles.toggleDescription}>
                Show critical alerts and energy security data first
              </span>
            </span>
          </label>
        </div>
      </div>

      {previewMode && (
        <div className={styles.previewNotification}>
          <div className={styles.previewIcon}>📡</div>
          <div className={styles.previewText}>
            <strong>Data Settings Preview</strong>
            <br />
            Changes to update frequency will take effect on the next refresh cycle.
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTab;
