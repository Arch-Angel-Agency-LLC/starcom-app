import React from 'react';
import styles from './GlobeControls.module.css';

// AI-NOTE: Globe Controls component moved from RightSideBar to LeftSideBar
// Contains overlay toggles and quick action buttons for globe manipulation

interface OverlayData {
  activeOverlays: string[];
  overlayStats: { [key: string]: { count: number; lastUpdate: string } };
}

interface GlobeControlsProps {
  overlayData: OverlayData;
}

const GlobeControls: React.FC<GlobeControlsProps> = ({ overlayData }) => {
  return (
    <div className={styles.globeControls}>
      <div className={styles.header}>
        <span className={styles.icon}>🌍</span>
        <span className={styles.title}>Globe Controls</span>
      </div>
      
      <div className={styles.overlayToggles}>
        {overlayData.activeOverlays.map((overlay: string) => (
          <div key={overlay} className={styles.overlayToggle}>
            <button className={`${styles.toggleBtn} ${styles.active}`}>
              <span className={styles.toggleIcon}>●</span>
              <span className={styles.toggleLabel}>{overlay}</span>
            </button>
          </div>
        ))}
      </div>
      
      <div className={styles.quickActions}>
        <button className={styles.actionButton}>
          <span>🔍</span>
          <span>Search Location</span>
        </button>
        <button className={styles.actionButton}>
          <span>📍</span>
          <span>Add Bookmark</span>
        </button>
        <button className={styles.actionButton}>
          <span>📤</span>
          <span>Export View</span>
        </button>
      </div>
    </div>
  );
};

export default GlobeControls;
