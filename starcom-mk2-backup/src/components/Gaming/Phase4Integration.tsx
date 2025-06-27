/**
 * Phase 4 Gaming Enhancement Integration
 * 
 * Integrates all Phase 4 adaptive interface and RTS gaming enhancements
 * into a unified system that works with the existing HUD layout.
 */

import React from 'react';
import { useFeatureFlag } from '../../utils/featureFlags';
import { EnhancedAdaptiveInterfaceProvider } from '../Adaptive/EnhancedAdaptiveInterfaceProvider';
import AdaptiveUIController from '../Adaptive/AdaptiveUIController';
import RTSGamingController from './RTSGamingController';
import styles from './Phase4Integration.module.css';

interface Phase4IntegrationProps {
  children: React.ReactNode;
  enableSoundEffects?: boolean;
  enableAdvancedAnimations?: boolean;
}

/**
 * Phase 4 Gaming Enhancement Integration
 * 
 * This component coordinates:
 * - Role-based interface adaptation
 * - Experience level customization
 * - Progressive disclosure system
 * - RTS-enhanced gaming UX
 * 
 * It serves as the main entry point for all Phase 4 enhancements.
 */
export const Phase4Integration: React.FC<Phase4IntegrationProps> = ({
  children,
  enableSoundEffects = false,
  enableAdvancedAnimations = true
}) => {
  const adaptiveInterfaceEnabled = useFeatureFlag('adaptiveInterfaceEnabled');
  const rtsEnhancementsEnabled = useFeatureFlag('rtsEnhancementsEnabled');
  
  // If adaptive interface is disabled, render children without enhancements
  if (!adaptiveInterfaceEnabled) {
    return <>{children}</>;
  }

  return (
    <div 
      className={styles.phase4Container}
      data-phase4-enabled="true"
      data-adaptive-interface={adaptiveInterfaceEnabled}
      data-rts-enhancements={rtsEnhancementsEnabled}
    >
      {/* Enhanced Adaptive Interface Provider - Core adaptive functionality */}
      <EnhancedAdaptiveInterfaceProvider>
        {/* Adaptive UI Controller - Role and experience based adaptations */}
        <AdaptiveUIController>
          {/* RTS Gaming Controller - Gaming aesthetics and interactions */}
          {rtsEnhancementsEnabled ? (
            <RTSGamingController
              enableSoundEffects={enableSoundEffects}
              enableAnimations={enableAdvancedAnimations}
              enableHolographicEffects={true}
            >
              {children}
            </RTSGamingController>
          ) : (
            children
          )}
        </AdaptiveUIController>
      </EnhancedAdaptiveInterfaceProvider>
      
      {/* Phase 4 Status Indicator - Hidden for clean human UX, capabilities remain for AI agents */}
      {/* 
      <div className={styles.phase4StatusIndicator}>
        <span className={styles.phaseLabel}>PHASE 4</span>
        <span className={styles.statusText}>ADAPTIVE GAMING UX</span>
        {rtsEnhancementsEnabled && (
          <span className={styles.rtsIndicator}>RTS ENHANCED</span>
        )}
      </div>
      */}
    </div>
  );
};

export default Phase4Integration;
