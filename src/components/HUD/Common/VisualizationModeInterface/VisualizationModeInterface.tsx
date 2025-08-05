/**
 * VisualizationModeInterface - Primary and Secondary Mode Controls
 * 
 * Provides compact emoji-based controls for switching between:
 * - 3 Primary visualization modes (CyberCommand, GeoPolitical, EcoNatural)
 * - Dynamic secondary modes based on active primary mode
 * 
 * Designed for integration with CyberCommandLeftSideBar below TinyGlobe
 */

import React, { useState, useEffect } from 'react';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import { PrimaryModeSelector } from './PrimaryModeSelector';
import { SecondaryModeSelector } from './SecondaryModeSelector';
import styles from './VisualizationModeInterface.module.css';

interface VisualizationModeInterfaceProps {
  /** Whether the interface is in compact mode */
  compact?: boolean;
  /** Custom CSS class */
  className?: string;
}

/**
 * Complete visualization mode control interface
 * Controls both primary and secondary visualization modes for 3D Globe and TinyGlobe
 */
export const VisualizationModeInterface: React.FC<VisualizationModeInterfaceProps> = ({
  compact = false,
  className = ''
}) => {
  const [isReady, setIsReady] = useState(false);
  
  // Always call the hook unconditionally
  const contextData = useVisualizationMode();

  // Wait for context to be ready with a small delay to handle async initialization
  useEffect(() => {
    if (contextData && contextData.visualizationMode) {
      console.log('VisualizationModeInterface: Context ready', contextData.visualizationMode);
      setIsReady(true);
    } else {
      console.log('VisualizationModeInterface: Context not ready, retrying...', contextData);
      // Retry after a short delay to handle potential async initialization
      const timer = setTimeout(() => {
        if (contextData && contextData.visualizationMode) {
          console.log('VisualizationModeInterface: Context ready on retry', contextData.visualizationMode);
          setIsReady(true);
        } else {
          console.warn('VisualizationModeInterface: Context still not ready after retry, showing fallback');
          // Show fallback after retry fails
          setIsReady(true);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [contextData]);

  // Show loading state while context initializes
  if (!isReady) {
    return (
      <div className={`${styles.visualizationModeInterface} ${compact ? styles.compact : ''} ${className}`}>
        <div className={styles.loadingState}>
          <div className={styles.loadingText}>⚡</div>
        </div>
      </div>
    );
  }

  // Fallback if context is not available
  if (!contextData || !contextData.visualizationMode) {
    console.warn('VisualizationModeInterface: No context data, showing minimal fallback');
    return (
      <div className={`${styles.visualizationModeInterface} ${compact ? styles.compact : ''} ${className}`}>
        <div className={styles.fallbackState}>
          <div className={styles.fallbackButtons}>
            <button className={styles.fallbackButton} title="CyberCommand Mode">📑</button>
            <button className={styles.fallbackButton} title="GeoPolitical Mode">🌍</button>
            <button className={styles.fallbackButton} title="EcoNatural Mode">🌿</button>
          </div>
        </div>
      </div>
    );
  }

  const { visualizationMode } = contextData;

  return (
    <div className={`${styles.visualizationModeInterface} ${compact ? styles.compact : ''} ${className}`}>
      {/* Primary Mode Controls - 3 small emoji buttons */}
      <div className={styles.primaryModeSection}>
        <PrimaryModeSelector compact={compact} />
      </div>

      {/* Secondary Mode Controls - Dynamic row based on primary mode */}
      <div className={styles.secondaryModeSection}>
        <SecondaryModeSelector 
          primaryMode={visualizationMode.mode}
          activeSubMode={visualizationMode.subMode}
          compact={compact}
        />
      </div>
    </div>
  );
};

export default VisualizationModeInterface;
