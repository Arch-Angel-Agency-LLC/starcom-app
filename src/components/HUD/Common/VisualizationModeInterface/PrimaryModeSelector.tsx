/**
 * PrimaryModeSelector - Primary Visualization Mode Controls
 * 
 * Three small emoji-only buttons for switching between primary visualization modes:
 * - CyberCommand (📑)
 * - GeoPolitical (🌍) 
 * - EcoNatural (🌿)
 */

import React from 'react';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import styles from './PrimaryModeSelector.module.css';

interface PrimaryModeSelectorProps {
  /** Whether to render in compact mode */
  compact?: boolean;
  /** Custom CSS class */
  className?: string;
}

// Primary mode configuration with emojis and tooltips
const PRIMARY_MODES = [
  {
    mode: 'CyberCommand' as const,
    emoji: '📑',
    tooltip: 'Cyber Command - Intelligence & Security Operations',
    description: 'Intel Reports, Cyber Threats, Network Infrastructure'
  },
  {
    mode: 'GeoPolitical' as const,
    emoji: '🌍',
    tooltip: 'Geo Political - Global Political Analysis',
    description: 'National Territories, Diplomatic Events, Resource Zones'
  },
  {
    mode: 'EcoNatural' as const,
    emoji: '🌿',
    tooltip: 'Eco Natural - Environmental & Weather Systems',
    description: 'Space Weather, Ecological Disasters, Earth Weather'
  }
] as const;

/**
 * Primary visualization mode selector with emoji buttons
 */
export const PrimaryModeSelector: React.FC<PrimaryModeSelectorProps> = ({
  compact = false,
  className = ''
}) => {
  const { visualizationMode, setPrimaryMode } = useVisualizationMode();

  const handlePrimaryModeClick = (mode: 'CyberCommand' | 'GeoPolitical' | 'EcoNatural') => {
    setPrimaryMode(mode);
  };

  return (
    <div className={`${styles.primaryModeSelector} ${compact ? styles.compact : ''} ${className}`}>
      {PRIMARY_MODES.map(({ mode, emoji, tooltip }) => (
        <button
          key={mode}
          className={`${styles.primaryModeButton} ${
            visualizationMode.mode === mode ? styles.active : ''
          }`}
          onClick={() => handlePrimaryModeClick(mode)}
          title={tooltip}
          aria-label={tooltip}
          aria-pressed={visualizationMode.mode === mode}
        >
          <span className={styles.emoji} role="img" aria-hidden="true">
            {emoji}
          </span>
        </button>
      ))}
    </div>
  );
};

export default PrimaryModeSelector;
