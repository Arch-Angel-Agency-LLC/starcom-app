// SpaceWeatherIntensity.tsx - Compact intensity controls

import React from 'react';
import styles from './SpaceWeatherIntensity.module.css';

interface SpaceWeatherIntensityProps {
  intensity: number;
  opacity: number;
  onIntensityChange: (intensity: number) => void;
  onOpacityChange: (opacity: number) => void;
}

/**
 * Compact dual-slider for intensity and opacity control
 * Optimized for narrow 100px width layout
 */
const SpaceWeatherIntensity: React.FC<SpaceWeatherIntensityProps> = ({
  intensity,
  opacity,
  onIntensityChange,
  onOpacityChange
}) => {
  return (
    <div className={styles.intensityControls}>
      {/* Intensity Slider */}
      <div className={styles.sliderGroup}>
        <div className={styles.sliderHeader}>
          <span className={styles.label}>💪</span>
          <span className={styles.value}>{intensity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={intensity}
          onChange={(e) => onIntensityChange(parseInt(e.target.value))}
          className={styles.slider}
          style={{ '--value': `${intensity}%` } as React.CSSProperties}
        />
      </div>

      {/* Opacity Slider */}
      <div className={styles.sliderGroup}>
        <div className={styles.sliderHeader}>
          <span className={styles.label}>👁️</span>
          <span className={styles.value}>{opacity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => onOpacityChange(parseInt(e.target.value))}
          className={styles.slider}
          style={{ '--value': `${opacity}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
};

export default SpaceWeatherIntensity;
