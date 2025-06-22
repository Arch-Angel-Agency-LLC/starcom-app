import React, { useEffect } from 'react';
import { useFeatureFlag, featureFlagManager } from '../../../utils/featureFlags';
import styles from './DiagnosticsToggle.module.css';

/**
 * Simple toggle for UI Testing Diagnostics mode
 * - Keyboard shortcut: Ctrl+Shift+D (or Cmd+Shift+D on Mac)
 * - Shows a small toggle button in bottom-right corner when in dev mode
 */
const DiagnosticsToggle: React.FC = () => {
  const uiTestingDiagnosticsEnabled = useFeatureFlag('uiTestingDiagnosticsEnabled');

  // Keyboard shortcut: Ctrl+Shift+D (or Cmd+Shift+D)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        featureFlagManager.setFlag('uiTestingDiagnosticsEnabled', !uiTestingDiagnosticsEnabled);
        
        // Visual feedback
        const message = uiTestingDiagnosticsEnabled ? 'Diagnostics OFF' : 'Diagnostics ON';
        console.log(`🔧 UI Testing ${message}`);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [uiTestingDiagnosticsEnabled]);

  // Only show in development mode
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleToggle = () => {
    featureFlagManager.setFlag('uiTestingDiagnosticsEnabled', !uiTestingDiagnosticsEnabled);
  };

  return (
    <div className={styles.toggle}>
      <button
        onClick={handleToggle}
        className={`${styles.button} ${uiTestingDiagnosticsEnabled ? styles.active : ''}`}
        title="Toggle UI Testing Diagnostics (Ctrl+Shift+D)"
        aria-label="Toggle UI Testing Diagnostics mode"
      >
        <span className={styles.icon}>🔧</span>
        <span className={styles.label}>
          {uiTestingDiagnosticsEnabled ? 'DIAG' : 'diag'}
        </span>
      </button>
      {uiTestingDiagnosticsEnabled && (
        <div className={styles.indicator}>
          <span className={styles.pulse}>●</span>
          <span className={styles.text}>Testing Mode</span>
        </div>
      )}
    </div>
  );
};

export default DiagnosticsToggle;
