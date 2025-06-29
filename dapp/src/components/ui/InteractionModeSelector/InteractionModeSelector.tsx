// InteractionModeSelector.tsx - Professional mode switching UI for 3D Globe
// Inspired by video game tool palettes and CAD software mode selectors

import React, { useState, useEffect } from 'react';
import { InteractionMode, interactionModeManager, ModeConfiguration } from '../../../systems/interaction/InteractionModeSystem';
import styles from './InteractionModeSelector.module.css';

interface InteractionModeSelectorProps {
  availableModes?: InteractionMode[];
  onModeChange?: (mode: InteractionMode, config: ModeConfiguration) => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  compact?: boolean;
  showLabels?: boolean;
  showHotkeys?: boolean;
  className?: string;
}

export const InteractionModeSelector: React.FC<InteractionModeSelectorProps> = ({
  availableModes = Object.values(InteractionMode),
  onModeChange,
  position = 'left',
  compact = false,
  showLabels = true,
  showHotkeys = true,
  className = ''
}) => {
  const [currentMode, setCurrentMode] = useState<InteractionMode>(InteractionMode.NAVIGATION);
  const [hoveredMode, setHoveredMode] = useState<InteractionMode | null>(null);
  const [isExpanded, setIsExpanded] = useState(!compact);
  
  // Listen for mode changes
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleModeChange = (newMode: InteractionMode, _prevMode: InteractionMode) => {
      const config = interactionModeManager.getCurrentConfig();
      setCurrentMode(newMode);
      onModeChange?.(newMode, config);
    };
    
    interactionModeManager.onModeChange(handleModeChange);
    
    // Set initial mode
    setCurrentMode(interactionModeManager.getCurrentConfig().mode);
  }, [onModeChange]);
  
  // Get mode configurations
  const getModeConfig = (mode: InteractionMode): ModeConfiguration => {
    return interactionModeManager.getAvailableModes().find(config => config.mode === mode) 
           || interactionModeManager.getCurrentConfig();
  };
  
  // Handle mode selection
  const handleModeSelect = (mode: InteractionMode) => {
    if (interactionModeManager.switchMode(mode)) {
      setCurrentMode(mode);
    }
  };
  
  // Keyboard shortcut display
  const getHotkeyDisplay = (config: ModeConfiguration): string => {
    return config.hotkey ? `[${config.hotkey}]` : '';
  };
  
  // Get CSS classes for positioning and layout
  const getContainerClasses = (): string => {
    const baseClasses = [
      styles.modeSelector,
      styles[`position-${position}`],
      compact ? styles.compact : styles.expanded,
      isExpanded ? styles.open : styles.closed
    ];
    
    if (className) baseClasses.push(className);
    return baseClasses.join(' ');
  };
  
  // Render mode button
  const renderModeButton = (mode: InteractionMode) => {
    const config = getModeConfig(mode);
    const isActive = currentMode === mode;
    const isHovered = hoveredMode === mode;
    
    const buttonClasses = [
      styles.modeButton,
      isActive ? styles.active : '',
      isHovered ? styles.hovered : ''
    ].filter(Boolean).join(' ');
    
    return (
      <button
        key={mode}
        className={buttonClasses}
        onClick={() => handleModeSelect(mode)}
        onMouseEnter={() => setHoveredMode(mode)}
        onMouseLeave={() => setHoveredMode(null)}
        title={`${config.name}: ${config.description}${showHotkeys ? ` ${getHotkeyDisplay(config)}` : ''}`}
        aria-label={`Switch to ${config.name} mode`}
        aria-pressed={isActive}
      >
        <div className={styles.iconContainer}>
          <span className={styles.icon} role="img" aria-hidden="true">
            {config.icon}
          </span>
          {isActive && <div className={styles.activeIndicator} />}
        </div>
        
        {(showLabels && (isExpanded || !compact)) && (
          <div className={styles.labelContainer}>
            <span className={styles.label}>{config.name}</span>
            {showHotkeys && config.hotkey && (
              <span className={styles.hotkey}>{getHotkeyDisplay(config)}</span>
            )}
          </div>
        )}
        
        {isHovered && (
          <div className={styles.tooltip}>
            <div className={styles.tooltipTitle}>{config.name}</div>
            <div className={styles.tooltipDescription}>{config.description}</div>
            {showHotkeys && config.hotkey && (
              <div className={styles.tooltipHotkey}>Hotkey: {config.hotkey}</div>
            )}
          </div>
        )}
      </button>
    );
  };
  
  // Toggle expansion for compact mode
  const toggleExpansion = () => {
    if (compact) {
      setIsExpanded(!isExpanded);
    }
  };
  
  return (
    <div className={getContainerClasses()}>
      {/* Header with current mode and expand/collapse button */}
      <div className={styles.header}>
        <div className={styles.currentMode}>
          <span className={styles.currentIcon}>
            {getModeConfig(currentMode).icon}
          </span>
          {(showLabels && (isExpanded || !compact)) && (
            <span className={styles.currentLabel}>
              {getModeConfig(currentMode).name}
            </span>
          )}
        </div>
        
        {compact && (
          <button
            className={styles.expandButton}
            onClick={toggleExpansion}
            aria-label={isExpanded ? 'Collapse mode selector' : 'Expand mode selector'}
          >
            <span className={isExpanded ? styles.collapseIcon : styles.expandIcon}>
              {isExpanded ? '◀' : '▶'}
            </span>
          </button>
        )}
      </div>
      
      {/* Mode buttons */}
      <div className={styles.modeList}>
        {availableModes.map(renderModeButton)}
      </div>
      
      {/* Status indicator */}
      <div className={styles.statusIndicator}>
        <div className={`${styles.statusDot} ${styles[currentMode.toLowerCase()]}`} />
        <span className={styles.statusText}>
          {getModeConfig(currentMode).name}
        </span>
      </div>
    </div>
  );
};

export default InteractionModeSelector;
