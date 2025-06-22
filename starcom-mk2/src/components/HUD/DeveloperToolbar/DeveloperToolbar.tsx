import React, { useState } from 'react';
import { useFeatureFlag, featureFlagManager } from '../../../utils/featureFlags';
import FeatureFlagControls from '../FeatureFlagControls/FeatureFlagControls';
import styles from './DeveloperToolbar.module.css';

/**
 * Developer Toolbar - Integrated development tools
 * 
 * Provides quick access to:
 * - UI Testing Diagnostics toggle
 * - Feature flag controls
 * - Development utilities
 * - Quick keyboard shortcuts
 */
const DeveloperToolbar: React.FC = () => {
  const [showFeatureFlags, setShowFeatureFlags] = useState(false);
  const uiTestingDiagnosticsEnabled = useFeatureFlag('uiTestingDiagnosticsEnabled');

  // Keyboard shortcut: Ctrl+Shift+D (or Cmd+Shift+D) - same as original DiagnosticsToggle
  React.useEffect(() => {
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

  const handleDiagnosticsToggle = () => {
    featureFlagManager.setFlag('uiTestingDiagnosticsEnabled', !uiTestingDiagnosticsEnabled);
    const message = uiTestingDiagnosticsEnabled ? 'Diagnostics OFF' : 'Diagnostics ON';
    console.log(`🔧 UI Testing ${message}`);
  };

  return (
    <div className={styles.toolbar}>
      {/* Main Developer Controls */}
      <div className={styles.mainControls}>
        <div className={styles.sectionTitle}>
          <span className={styles.icon}>🔧</span>
          <span>Developer Tools</span>
        </div>

        {/* Enhanced DIAG Button */}
        <div className={styles.diagSection}>
          <button
            onClick={handleDiagnosticsToggle}
            className={`${styles.diagButton} ${uiTestingDiagnosticsEnabled ? styles.active : ''}`}
            title="Toggle UI Testing Diagnostics (Ctrl+Shift+D)"
            aria-label={`UI Testing Diagnostics ${uiTestingDiagnosticsEnabled ? 'enabled' : 'disabled'}`}
          >
            <div className={styles.diagContent}>
              <div className={styles.diagMain}>
                <span className={styles.diagIcon}>🔧</span>
                <span className={styles.diagLabel}>DIAG</span>
                <div className={`${styles.statusBadge} ${uiTestingDiagnosticsEnabled ? styles.statusActive : styles.statusInactive}`}>
                  {uiTestingDiagnosticsEnabled ? 'ON' : 'OFF'}
                </div>
              </div>
              <div className={styles.diagHint}>Ctrl+Shift+D</div>
            </div>
            {uiTestingDiagnosticsEnabled && (
              <div className={styles.activeIndicator}>●</div>
            )}
          </button>
        </div>

        {/* Status Info */}
        <div className={styles.statusInfo}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Mode:</span>
            <span className={styles.statusValue}>DEV</span>
          </div>
          {uiTestingDiagnosticsEnabled && (
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Testing:</span>
              <span className={`${styles.statusValue} ${styles.active}`}>ACTIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Developer Tools */}
      <div className={styles.expandedControls}>
        <div className={styles.expandedSection}>
          <div className={styles.expandedTitle}>Quick Actions</div>
          <div className={styles.expandedActions}>
            <button
              className={styles.expandedButton}
              onClick={() => window.location.reload()}
              title="Reload page"
            >
              🔄 Reload
            </button>
            <button
              className={styles.expandedButton}
              onClick={() => console.clear()}
              title="Clear console"
            >
              🧹 Clear Log
            </button>
            <button
              className={styles.expandedButton}
              onClick={() => localStorage.clear()}
              title="Clear local storage"
            >
              🗑️ Clear Storage
            </button>
            <button
              className={styles.expandedButton}
              onClick={() => {
                // Clear cache functionality
                if ('caches' in window) {
                  caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                  });
                }
                console.log('🧹 Cache cleared');
              }}
              title="Clear application cache"
            >
              💾 Clear Cache
            </button>
            <button
              className={styles.expandedButton}
              onClick={() => {
                const settings = {
                  timestamp: new Date().toISOString(),
                  localStorage: { ...localStorage },
                  sessionStorage: { ...sessionStorage }
                };
                const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'starcom-settings.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              title="Export settings to file"
            >
              📄 Export Settings
            </button>
          </div>
        </div>

        <div className={styles.expandedSection}>
          <div className={styles.expandedTitle}>Debug Tools</div>
          <div className={styles.debugControls}>
            <label className={styles.debugCheckbox}>
              <input 
                type="checkbox" 
                onChange={(e) => {
                  if (e.target.checked) {
                    console.log('🔧 Performance metrics enabled');
                    // Add performance monitoring logic here
                  } else {
                    console.log('🔧 Performance metrics disabled');
                  }
                }}
              />
              <span>Show Performance Metrics</span>
            </label>
            <label className={styles.debugCheckbox}>
              <input 
                type="checkbox" 
                onChange={(e) => {
                  if (e.target.checked) {
                    console.log('🔧 Debug logging enabled');
                    window.localStorage.setItem('debug-logging', 'true');
                  } else {
                    console.log('🔧 Debug logging disabled');
                    window.localStorage.removeItem('debug-logging');
                  }
                }}
              />
              <span>Enable Debug Logging</span>
            </label>
            <label className={styles.debugCheckbox}>
              <input 
                type="checkbox" 
                onChange={(e) => {
                  if (e.target.checked) {
                    console.log('🔧 Data source URLs enabled');
                    window.localStorage.setItem('show-data-urls', 'true');
                  } else {
                    console.log('🔧 Data source URLs disabled');
                    window.localStorage.removeItem('show-data-urls');
                  }
                }}
              />
              <span>Show Data Source URLs</span>
            </label>
          </div>
        </div>

        <div className={styles.expandedSection}>
          <div className={styles.expandedTitle}>
            Feature Flags
            <button
              className={styles.showFlagsBtn}
              onClick={() => setShowFeatureFlags(!showFeatureFlags)}
            >
              {showFeatureFlags ? 'Hide' : 'Show'}
            </button>
          </div>
          {showFeatureFlags && (
            <div className={styles.featureFlagContainer}>
              <FeatureFlagControls onDismiss={() => setShowFeatureFlags(false)} />
            </div>
          )}
        </div>

        <div className={styles.expandedSection}>
          <div className={styles.expandedTitle}>Keyboard Shortcuts</div>
          <div className={styles.shortcuts}>
            <div className={styles.shortcut}>
              <kbd>Ctrl+Shift+D</kbd>
              <span>Toggle Diagnostics</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>F12</kbd>
              <span>Dev Tools</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperToolbar;
