// NOAADataToggle.tsx - Quick category toggles for major NOAA data types

import React from 'react';
import styles from './NOAADataToggle.module.css';

interface NOAADataToggleProps {
  solarEnabled: boolean;
  geomagneticEnabled: boolean;
  radiationEnabled: boolean;
  onSolarToggle: (enabled: boolean) => void;
  onGeomagneticToggle: (enabled: boolean) => void;
  onRadiationToggle: (enabled: boolean) => void;
}

/**
 * Compact toggle switches for major NOAA data categories
 * Consolidates 30+ datasets into 3 primary categories
 */
const NOAADataToggle: React.FC<NOAADataToggleProps> = ({
  solarEnabled,
  geomagneticEnabled,
  radiationEnabled,
  onSolarToggle,
  onGeomagneticToggle,
  onRadiationToggle
}) => {
  const categories = [
    {
      id: 'solar',
      icon: '☀️',
      label: 'Solar',
      enabled: solarEnabled,
      onToggle: onSolarToggle,
      description: 'X-ray flux, flares, solar wind'
    },
    {
      id: 'geomagnetic',
      icon: '🧲',
      label: 'Mag',
      enabled: geomagneticEnabled,
      onToggle: onGeomagneticToggle,
      description: 'Kp/Dst indices, aurora, magnetosphere'
    },
    {
      id: 'radiation',
      icon: '☢️',
      label: 'Rad',
      enabled: radiationEnabled,
      onToggle: onRadiationToggle,
      description: 'Proton/electron flux, cosmic rays'
    }
  ];

  return (
    <div className={styles.dataToggles}>
      <div className={styles.header}>
        <span className={styles.title}>Data Types</span>
      </div>
      
      <div className={styles.toggleGrid}>
        {categories.map((category) => (
          <label
            key={category.id}
            className={`${styles.toggle} ${category.enabled ? styles.enabled : ''}`}
            title={category.description}
          >
            <input
              type="checkbox"
              checked={category.enabled}
              onChange={(e) => category.onToggle(e.target.checked)}
              className={styles.checkbox}
            />
            <div className={styles.toggleVisual}>
              <span className={styles.icon}>{category.icon}</span>
              <span className={styles.label}>{category.label}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default NOAADataToggle;
