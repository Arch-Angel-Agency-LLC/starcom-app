import React, { lazy, Suspense } from 'react';
import { VisualizationModeInterface } from '../../Common/VisualizationModeInterface';
import styles from './CyberCommandLeftSideBar.module.css';

// Lazy load TinyGlobe to reduce initial bundle size
const TinyGlobe = lazy(() => import('../../../TinyGlobe/TinyGlobe'));

// Clean placeholder components for future implementation
const PrimaryModeSelector: React.FC = () => {
  return (
    <div className={styles.primaryModeSelector}>
      {/* Placeholder for primary mode buttons */}
      <div className={styles.modePlaceholder}>Primary Modes</div>
    </div>
  );
};

const SettingsPanel: React.FC = () => {
  return (
    <div className={styles.settingsPanel}>
      {/* Placeholder for settings */}
      <div className={styles.settingsPlaceholder}>Settings</div>
    </div>
  );
};

const CyberCommandLeftSideBar: React.FC = () => {
  return (
    <div className={styles.cyberCommandLeftSideBar}>
      <div className={styles.content}>
        {/* TinyGlobe - Keep this as it works well */}
        <div className={styles.globeContainer}>
          <Suspense fallback={<div className={styles.tinyGlobePlaceholder}>Loading Globe...</div>}>
            <TinyGlobe />
          </Suspense>
        </div>
        
        {/* Visualization Mode Controls - NEW: Primary + Secondary mode buttons */}
        <div className={styles.visualizationControls}>
          <Suspense fallback={<div className={styles.visualizationPlaceholder}>⚡</div>}>
            <VisualizationModeInterface compact={true} />
          </Suspense>
        </div>
        
        {/* Primary Mode Selector - Clean placeholder */}
        <div className={styles.primarySection}>
          <PrimaryModeSelector />
        </div>
        
        {/* Settings Panel - Clean placeholder */}
        <div className={styles.settingsSection}>
          <SettingsPanel />
        </div>
      </div>
    </div>
  );
};

export default CyberCommandLeftSideBar;