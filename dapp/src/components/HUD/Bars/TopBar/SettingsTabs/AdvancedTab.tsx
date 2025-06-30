// AdvancedTab.tsx
// Advanced settings tab for Marquee Settings
import React from 'react';
import { EnhancedSettings } from '../EnhancedSettingsPopup';
import styles from './AdvancedTab.module.css';

export interface AdvancedTabProps {
  settings: EnhancedSettings;
  onSettingChange: <K extends keyof EnhancedSettings>(key: K, value: EnhancedSettings[K]) => void;
  previewMode: boolean;
}

const AdvancedTab: React.FC<AdvancedTabProps> = ({
  settings,
  onSettingChange,
  previewMode,
}) => {
  return (
    <div className={styles.advancedTab}>
      <div className={styles.tabSection}>
        <h3 className={styles.sectionTitle}>
          ⚡ Performance
        </h3>
        <p className={styles.sectionDescription}>
          Optimize performance for your device and usage patterns.
        </p>
        
        <div className={styles.toggleGroup}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.performanceMode}
              onChange={(e) => onSettingChange('performanceMode', e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>
              🚀 Performance Mode
              <span className={styles.toggleDescription}>
                Reduce animations and effects for better performance
              </span>
            </span>
          </label>

          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.momentumPhysics}
              onChange={(e) => onSettingChange('momentumPhysics', e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>
              🌊 Momentum Physics
              <span className={styles.toggleDescription}>
                Enable smooth acceleration and deceleration effects
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className={styles.tabSection}>
        <h3 className={styles.sectionTitle}>
          ♿ Accessibility
        </h3>
        <p className={styles.sectionDescription}>
          Make the marquee more accessible for users with disabilities.
        </p>
        
        <div className={styles.toggleGroup}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.accessibilityMode}
              onChange={(e) => onSettingChange('accessibilityMode', e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>
              ♿ Accessibility Mode
              <span className={styles.toggleDescription}>
                Enable screen reader support and reduced motion
              </span>
            </span>
          </label>
        </div>

        <div className={styles.accessibilityInfo}>
          <h4 className={styles.infoTitle}>Accessibility Features:</h4>
          <ul className={styles.featureList}>
            <li>🔍 Enhanced keyboard navigation</li>
            <li>📢 Screen reader announcements</li>
            <li>🎯 High contrast focus indicators</li>
            <li>⏸️ Reduced motion for motion sensitivity</li>
            <li>🎨 ARIA labels and semantic markup</li>
          </ul>
        </div>
      </div>

      <div className={styles.tabSection}>
        <h3 className={styles.sectionTitle}>
          🛠️ Developer Options
        </h3>
        <p className={styles.sectionDescription}>
          Advanced options for debugging and development.
        </p>
        
        <div className={styles.developerControls}>
          <button className={styles.devButton}>
            🔍 Debug Mode
          </button>
          <button className={styles.devButton}>
            📊 Performance Monitor
          </button>
          <button className={styles.devButton}>
            🧹 Clear Cache
          </button>
        </div>

        <details className={styles.debugSection}>
          <summary className={styles.debugToggle}>
            🐛 Debug Information
          </summary>
          
          <div className={styles.debugInfo}>
            <div className={styles.debugItem}>
              <span className={styles.debugLabel}>Component Version:</span>
              <span className={styles.debugValue}>v3.1.0</span>
            </div>
            <div className={styles.debugItem}>
              <span className={styles.debugLabel}>Render Count:</span>
              <span className={styles.debugValue}>42</span>
            </div>
            <div className={styles.debugItem}>
              <span className={styles.debugLabel}>Performance Score:</span>
              <span className={styles.debugValue}>98/100</span>
            </div>
          </div>
        </details>
      </div>

      {previewMode && (
        <div className={styles.previewNotification}>
          <div className={styles.previewIcon}>⚙️</div>
          <div className={styles.previewText}>
            <strong>Advanced Settings Preview</strong>
            <br />
            Some performance changes may require a page refresh to fully apply.
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedTab;
