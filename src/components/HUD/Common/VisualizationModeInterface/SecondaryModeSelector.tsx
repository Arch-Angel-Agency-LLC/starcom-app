/**
 * SecondaryModeSelector - Secondary Visualization Mode Controls
 * 
 * Dynamic row of emoji-only buttons for secondary modes based on active primary mode:
 * 
 * CyberCommand: IntelReports (📑), CyberThreats (🛡️), CyberAttacks (⚡), NetworkInfrastructure (🌐), CommHubs (📡)
 * GeoPolitical: NationalTerritories (🗺️), DiplomaticEvents (🤝), ResourceZones (⛽)
 * EcoNatural: SpaceWeather (☀️), EcologicalDisasters (🌋), EarthWeather (🌦️)
 */

import React from 'react';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import styles from './SecondaryModeSelector.module.css';

interface SecondaryModeSelectorProps {
  /** Current primary mode */
  primaryMode: 'CyberCommand' | 'GeoPolitical' | 'EcoNatural';
  /** Currently active sub mode */
  activeSubMode: string;
  /** Whether to render in compact mode */
  compact?: boolean;
  /** Custom CSS class */
  className?: string;
}

// Secondary mode configurations by primary mode
const SECONDARY_MODES = {
  CyberCommand: [
    {
      subMode: 'IntelReports' as const,
      emoji: '📑',
      tooltip: 'Intel Reports - Intelligence Analysis & Reports'
    },
    {
      subMode: 'CyberThreats' as const,
      emoji: '🛡️',
      tooltip: 'Cyber Threats - Threat Detection & Analysis'
    },
    {
      subMode: 'CyberAttacks' as const,
      emoji: '⚡',
      tooltip: 'Cyber Attacks - Active Attack Monitoring'
    },
    {
      subMode: 'NetworkInfrastructure' as const,
      emoji: '🌐',
      tooltip: 'Network Infrastructure - Network Topology & Health'
    },
    {
      subMode: 'CommHubs' as const,
      emoji: '📡',
      tooltip: 'Communication Hubs - Comm Network Analysis'
    }
  ],
  GeoPolitical: [
    {
      subMode: 'NationalTerritories' as const,
      emoji: '🗺️',
      tooltip: 'National Territories - Sovereign Boundaries & Claims'
    },
    {
      subMode: 'DiplomaticEvents' as const,
      emoji: '🤝',
      tooltip: 'Diplomatic Events - International Relations & Treaties'
    },
    {
      subMode: 'ResourceZones' as const,
      emoji: '⛽',
      tooltip: 'Resource Zones - Strategic Resources & Trade Routes'
    }
  ],
  EcoNatural: [
    {
      subMode: 'SpaceWeather' as const,
      emoji: '☀️',
      tooltip: 'Space Weather - Solar Activity & Geomagnetic Events'
    },
    {
      subMode: 'EcologicalDisasters' as const,
      emoji: '🌋',
      tooltip: 'Ecological Disasters - Natural Disasters & Environmental Crises'
    },
    {
      subMode: 'EarthWeather' as const,
      emoji: '🌦️',
      tooltip: 'Earth Weather - Atmospheric Conditions & Climate'
    }
  ]
} as const;

/**
 * Secondary visualization mode selector with dynamic emoji buttons
 */
export const SecondaryModeSelector: React.FC<SecondaryModeSelectorProps> = ({
  primaryMode,
  activeSubMode,
  compact = false,
  className = ''
}) => {
  const { setVisualizationMode } = useVisualizationMode();

  // Get secondary modes for current primary mode
  const secondaryModes = SECONDARY_MODES[primaryMode] || [];

  const handleSecondaryModeClick = (subMode: string) => {
    setVisualizationMode({ 
      mode: primaryMode, 
      subMode: subMode as never // Type assertion for dynamic subMode mapping
    });
  };

  if (secondaryModes.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.secondaryModeSelector} ${compact ? styles.compact : ''} ${className}`}>
      {secondaryModes.map(({ subMode, emoji, tooltip }) => (
        <button
          key={subMode}
          className={`${styles.secondaryModeButton} ${
            activeSubMode === subMode ? styles.active : ''
          }`}
          onClick={() => handleSecondaryModeClick(subMode)}
          title={tooltip}
          aria-label={tooltip}
          aria-pressed={activeSubMode === subMode}
        >
          <span className={styles.emoji} role="img" aria-hidden="true">
            {emoji}
          </span>
        </button>
      ))}
    </div>
  );
};

export default SecondaryModeSelector;
