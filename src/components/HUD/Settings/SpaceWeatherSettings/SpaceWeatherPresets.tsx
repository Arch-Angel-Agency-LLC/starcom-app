// SpaceWeatherPresets.tsx - Smart presets for space weather visualization

import React from 'react';
import styles from './SpaceWeatherPresets.module.css';

interface SpaceWeatherPresetsProps {
  currentPreset: 'quiet' | 'moderate' | 'storm' | 'extreme';
  onPresetChange: (preset: 'quiet' | 'moderate' | 'storm' | 'extreme') => void;
}

/**
 * Simplified space weather activity presets
 * Combines multiple NOAA datasets into meaningful scenarios
 */
const SpaceWeatherPresets: React.FC<SpaceWeatherPresetsProps> = ({
  currentPreset,
  onPresetChange
}) => {
  const presets: Array<{
    id: 'quiet' | 'moderate' | 'storm' | 'extreme';
    name: string;
    icon: string;
    description: string;
    color: string;
  }> = [
    {
      id: 'quiet' as const,
      name: 'Quiet',
      icon: '🌙',
      description: 'Minimal activity - basic monitoring',
      color: '#4a90e2'
    },
    {
      id: 'moderate' as const,
      name: 'Active',
      icon: '⚡',
      description: 'Moderate activity - standard visualization',
      color: '#f5a623'
    },
    {
      id: 'storm' as const,
      name: 'Storm',
      icon: '🌪️',
      description: 'High activity - enhanced effects',
      color: '#d0021b'
    },
    {
      id: 'extreme' as const,
      name: 'Extreme',
      icon: '💥',
      description: 'Maximum activity - all visualizations',
      color: '#8b0000'
    }
  ];

  return (
    <div className={styles.presets}>
      <div className={styles.header}>
        <span className={styles.title}>Activity Level</span>
      </div>
      
      <div className={styles.presetGrid}>
        {presets.map((preset) => (
          <button
            key={preset.id}
            className={`${styles.preset} ${currentPreset === preset.id ? styles.active : ''}`}
            onClick={() => onPresetChange(preset.id)}
            title={preset.description}
            style={{ '--accent-color': preset.color } as React.CSSProperties}
          >
            <span className={styles.icon}>{preset.icon}</span>
            <span className={styles.name}>{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SpaceWeatherPresets;
