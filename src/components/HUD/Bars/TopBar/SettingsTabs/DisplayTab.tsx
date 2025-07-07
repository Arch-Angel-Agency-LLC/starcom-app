// DisplayTab.tsx
// Display settings tab for Marquee Settings
import React from 'react';
import { EnhancedSettings } from '../EnhancedSettingsPopup';
import AnimationControls from './DisplayControls/AnimationControls';
import AppearanceControls from './DisplayControls/AppearanceControls';
import LayoutControls from './DisplayControls/LayoutControls';
import styles from './DisplayTab.module.css';

export interface DisplayTabProps {
  settings: EnhancedSettings;
  onSettingChange: <K extends keyof EnhancedSettings>(key: K, value: EnhancedSettings[K]) => void;
  previewMode: boolean;
}

const DisplayTab: React.FC<DisplayTabProps> = ({
  settings,
  onSettingChange,
  previewMode,
}) => {
  return (
    <div className={styles.displayTab}>
      <div className={styles.tabSection}>
        <h3 className={styles.sectionTitle}>
          🎬 Animation Settings
        </h3>
        <p className={styles.sectionDescription}>
          Control marquee scrolling speed, easing, and motion behavior.
        </p>
        
        <AnimationControls
          settings={settings}
          onSettingChange={onSettingChange}
          previewMode={previewMode}
        />
      </div>

      <div className={styles.tabSection}>
        <h3 className={styles.sectionTitle}>
          🎨 Appearance
        </h3>
        <p className={styles.sectionDescription}>
          Customize colors, icons, typography, and visual style.
        </p>
        
        <AppearanceControls
          settings={settings}
          onSettingChange={onSettingChange}
          previewMode={previewMode}
        />
      </div>

      <div className={styles.tabSection}>
        <h3 className={styles.sectionTitle}>
          📐 Layout & Spacing
        </h3>
        <p className={styles.sectionDescription}>
          Adjust spacing, sizing, and layout configuration.
        </p>
        
        <LayoutControls
          settings={settings}
          onSettingChange={onSettingChange}
          previewMode={previewMode}
        />
      </div>

      {previewMode && (
        <div className={styles.previewNotification}>
          <div className={styles.previewIcon}>👁️</div>
          <div className={styles.previewText}>
            <strong>Live Preview Active</strong>
            <br />
            Changes are being applied in real-time to the marquee above.
          </div>
        </div>
      )}
    </div>
  );
};

export default DisplayTab;
