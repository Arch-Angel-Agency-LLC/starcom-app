import React from 'react';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import { useGlobeContext } from '../../../../context/GlobeContext';
import NOAAVisualizationStatus from './NOAAVisualizationStatus';
import styles from './GlobeStatus.module.css';

// AI-NOTE: Globe Status component moved from LeftSideBar (TinyGlobe/ModeSettingsPanel) to RightSideBar
// Shows current globe state, visualization mode, and system health
// Now includes NOAA Space Weather visualization status

interface OverlayData {
  activeOverlays: string[];
  overlayStats: { [key: string]: { count: number; lastUpdate: string } };
}

interface GlobeStatusProps {
  overlayData: OverlayData;
}

const GlobeStatus: React.FC<GlobeStatusProps> = ({ overlayData }) => {
  const { visualizationMode } = useVisualizationMode();
  const { focusLocation } = useGlobeContext();

  return (
    <div className={styles.globeStatus}>
      <div className={styles.header}>
        <span className={styles.icon}>📡</span>
        <span className={styles.title}>Globe Status</span>
      </div>
      
      <div className={styles.statusItems}>
        <div className={styles.statusItem}>
          <span className={styles.label}>Mode:</span>
          <span className={styles.value}>{visualizationMode.mode}</span>
        </div>
        {visualizationMode.subMode && (
          <div className={styles.statusItem}>
            <span className={styles.label}>Sub-mode:</span>
            <span className={styles.value}>{visualizationMode.subMode}</span>
          </div>
        )}
        <div className={styles.statusItem}>
          <span className={styles.label}>Active Overlays:</span>
          <span className={styles.value}>{overlayData.activeOverlays.length}</span>
        </div>
        {focusLocation && (
          <div className={styles.statusItem}>
            <span className={styles.label}>Focus:</span>
            <span className={styles.value}>
              {focusLocation.lat.toFixed(2)}°, {focusLocation.lng.toFixed(2)}°
            </span>
          </div>
        )}
      </div>
      
      {/* NOAA Space Weather Status - Only show for EcoNatural mode */}
      {visualizationMode.mode === 'EcoNatural' && (
        <NOAAVisualizationStatus />
      )}
      
      <div className={styles.systemHealth}>
        <div className={styles.healthItem}>
          <div className={styles.healthDot} style={{ backgroundColor: '#00ff41' }}></div>
          <span>Globe Engine</span>
        </div>
        <div className={styles.healthItem}>
          <div className={styles.healthDot} style={{ backgroundColor: '#00ff41' }}></div>
          <span>Data Feeds</span>
        </div>
        <div className={styles.healthItem}>
          <div className={styles.healthDot} style={{ backgroundColor: '#ffaa00' }}></div>
          <span>Intel Network</span>
        </div>
      </div>

      {/* Live Metrics Section */}
      <div className={styles.metricsSection}>
        <div className={styles.metricsHeader}>
          <span className={styles.metricsIcon}>📈</span>
          <span className={styles.metricsTitle}>Live Metrics</span>
        </div>
        <div className={styles.metricsGrid}>
          {Object.entries(overlayData.overlayStats).map(([overlay, stats]: [string, { count: number; lastUpdate: string }]) => (
            <div key={overlay} className={styles.metricItem}>
              <div>
                <div className={styles.metricLabel}>{overlay}</div>
                <div className={styles.metricUpdate}>{stats.lastUpdate}</div>
              </div>
              <div className={styles.metricValue}>{stats.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GlobeStatus;
