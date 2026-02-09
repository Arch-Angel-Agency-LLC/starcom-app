/**
 * RTS Gaming UX Controller - Phase 4 Enhancement
 * 
 * Provides gaming-style interactions, animations, and RTS command center aesthetics
 * for the enhanced adaptive interface system.
 */

import React, { useEffect, useCallback, useState } from 'react';
import { useAdaptiveInterface } from '../../hooks/useAdaptiveInterface';
import { useFeatureFlag } from '../../utils/featureFlags';
import { playNotificationTone, clearNotificationAudioResources } from '../../services/audio/notificationAudio';
import styles from './RTSGamingController.module.css';

interface RTSGamingControllerProps {
  children: React.ReactNode;
  enableSoundEffects?: boolean;
  enableAnimations?: boolean;
  enableHolographicEffects?: boolean;
}

interface GamingInteraction {
  type: 'hover' | 'click' | 'selection' | 'command';
  element: string;
  timestamp: number;
}

/**
 * RTS Gaming UX Controller
 * 
 * Enhances the interface with real-time strategy game aesthetics and interactions.
 * Provides command center feel with holographic effects, smooth animations,
 * and role-adaptive gaming elements.
 */
export const RTSGamingController: React.FC<RTSGamingControllerProps> = ({
  children,
  enableSoundEffects = false,
  enableAnimations = true,
  enableHolographicEffects = true
}) => {
  const { operatorProfile/* , adaptiveConfiguration */ } = useAdaptiveInterface();
  const rtsEnhancementsEnabled = useFeatureFlag('rtsEnhancementsEnabled');
  const [/* interactionHistory */, setInteractionHistory] = useState<GamingInteraction[]>([]);
  
  // ============================================================================
  // GAMING INTERACTION TRACKING
  // ============================================================================
  
  const trackInteraction = useCallback((interaction: GamingInteraction) => {
    setInteractionHistory(prev => [
      ...prev.slice(-9), // Keep last 10 interactions
      interaction
    ]);
  }, []);

  // ============================================================================
  // HOLOGRAPHIC EFFECTS SYSTEM
  // ============================================================================
  
  const initializeHolographicEffects = useCallback(() => {
    if (!enableHolographicEffects || !rtsEnhancementsEnabled) return;

    const panels = document.querySelectorAll('.holo-panel, .adaptive-panel');
    
    panels.forEach(panel => {
      // Add holographic scanning effect
      const scanOverlay = document.createElement('div');
      scanOverlay.className = 'holo-scan-overlay';
      panel.appendChild(scanOverlay);
      
      // Add interactive glow effects
      panel.addEventListener('mouseenter', (e) => {
        (e.target as HTMLElement).classList.add('holo-active');
        trackInteraction({
          type: 'hover',
          element: panel.className,
          timestamp: Date.now()
        });
      });
      
      panel.addEventListener('mouseleave', (e) => {
        (e.target as HTMLElement).classList.remove('holo-active');
      });
    });
  }, [enableHolographicEffects, rtsEnhancementsEnabled, trackInteraction]);

  // ============================================================================
  // COMMAND CENTER ANIMATIONS
  // ============================================================================
  
  const initializeCommandCenterAnimations = useCallback(() => {
    if (!enableAnimations || !rtsEnhancementsEnabled) return;

    // Staggered entry animations for interface elements
    const animateElements = document.querySelectorAll('[data-rts-animate]');
    
    animateElements.forEach((element, index) => {
      (element as HTMLElement).style.animationDelay = `${index * 0.1}s`;
      element.classList.add('rts-entry-animation');
    });

    // Command execution animations
    const buttons = document.querySelectorAll('.rts-button');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const ripple = document.createElement('span');
        ripple.className = 'rts-ripple-effect';
        (e.target as HTMLElement).appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
        
        trackInteraction({
          type: 'command',
          element: (e.target as HTMLElement).textContent || 'unknown',
          timestamp: Date.now()
        });
      });
    });
  }, [enableAnimations, rtsEnhancementsEnabled, trackInteraction]);

  // ============================================================================
  // ROLE-BASED GAMING AESTHETICS
  // ============================================================================
  
  const applyRoleBasedGamingTheme = useCallback(() => {
    if (!rtsEnhancementsEnabled) return;

    const root = document.documentElement;
    
    // Role-specific gaming enhancements
    const roleThemes = {
      COMMANDER: {
        accentColor: '#ff3838',
        uiStyle: 'command-authority',
        animationSpeed: 'fast',
        effectIntensity: 'high'
      },
      ANALYST: {
        accentColor: '#00c4ff',
        uiStyle: 'data-focused',
        animationSpeed: 'smooth',
        effectIntensity: 'medium'
      },
      CYBER_WARRIOR: {
        accentColor: '#88ff00',
        uiStyle: 'tactical-aggressive',
        animationSpeed: 'fast',
        effectIntensity: 'high'
      },
      FIELD_OPERATIVE: {
        accentColor: '#ff6b35',
        uiStyle: 'operational-efficient',
        animationSpeed: 'fast',
        effectIntensity: 'medium'
      },
      INTELLIGENCE_OFFICER: {
        accentColor: '#00ff88',
        uiStyle: 'intelligence-refined',
        animationSpeed: 'smooth',
        effectIntensity: 'medium'
      },
      TECHNICAL_SPECIALIST: {
        accentColor: '#00c4ff',
        uiStyle: 'technical-precise',
        animationSpeed: 'smooth',
        effectIntensity: 'low'
      }
    };

    const theme = roleThemes[operatorProfile.role];
    if (theme) {
      root.style.setProperty('--rts-role-accent', theme.accentColor);
      root.setAttribute('data-rts-ui-style', theme.uiStyle);
      root.setAttribute('data-rts-animation-speed', theme.animationSpeed);
      root.setAttribute('data-rts-effect-intensity', theme.effectIntensity);
    }
  }, [operatorProfile.role, rtsEnhancementsEnabled]);

  // ============================================================================
  // SOUND EFFECTS SYSTEM
  // ============================================================================
  
  const initializeSoundEffects = useCallback(() => {
    if (!enableSoundEffects || !rtsEnhancementsEnabled) return () => {};

    const timeoutIds: number[] = [];

    const hoverSound = () => playNotificationTone({ frequency: 800, duration: 0.1 });
    const clickSound = () => playNotificationTone({ frequency: 600, duration: 0.15 });
    const successSound = () => {
      clickSound();
      timeoutIds.push(window.setTimeout(() => playNotificationTone({ frequency: 659, duration: 0.1 }), 100));
      timeoutIds.push(window.setTimeout(() => playNotificationTone({ frequency: 784, duration: 0.2 }), 200));
    };
    const warningSound = () => {
      playNotificationTone({ frequency: 400, duration: 0.2, type: 'square', gain: 0.09 });
      timeoutIds.push(
        window.setTimeout(
          () => playNotificationTone({ frequency: 300, duration: 0.2, type: 'square', gain: 0.08 }),
          250
        )
      );
    };

    const clickHandler = (e: Event) => {
      if ((e.target as HTMLElement).classList.contains('rts-button')) {
        clickSound();
      }
    };

    const hoverHandler = (e: Event) => {
      if ((e.target as HTMLElement).classList.contains('holo-panel')) {
        hoverSound();
      }
    };

    document.addEventListener('click', clickHandler);
    document.addEventListener('mouseenter', hoverHandler, true);

    return () => {
      timeoutIds.forEach(id => window.clearTimeout(id));
      document.removeEventListener('click', clickHandler);
      document.removeEventListener('mouseenter', hoverHandler, true);
      void clearNotificationAudioResources();
    };
  }, [enableSoundEffects, rtsEnhancementsEnabled, playNotificationTone, clearNotificationAudioResources]);

  // ============================================================================
  // PROGRESSIVE DISCLOSURE GAMING ENHANCEMENT
  // ============================================================================
  
  const enhanceProgressiveDisclosure = useCallback(() => {
    if (!rtsEnhancementsEnabled) return;

    const disclosureElements = document.querySelectorAll('[data-disclosure-level]');
    
    disclosureElements.forEach(element => {
      const level = element.getAttribute('data-disclosure-level');
      const experienceLevel = operatorProfile.experienceLevel;
      
      // Gaming-style progressive disclosure based on experience
      const shouldShow = (() => {
        switch (experienceLevel) {
          case 'NOVICE':
            return level === 'basic' || level === 'intermediate';
          case 'INTERMEDIATE':
            return level !== 'expert';
          case 'EXPERT':
          case 'MASTER':
            return true;
          default:
            return level === 'basic';
        }
      })();

      if (shouldShow) {
        element.classList.add('rts-disclosure-visible');
        element.classList.remove('rts-disclosure-hidden');
      } else {
        element.classList.add('rts-disclosure-hidden');
        element.classList.remove('rts-disclosure-visible');
      }
    });
  }, [operatorProfile.experienceLevel, rtsEnhancementsEnabled]);

  // ============================================================================
  // INITIALIZATION AND CLEANUP
  // ============================================================================
  
  useEffect(() => {
    if (!rtsEnhancementsEnabled) return;

    // Initialize all gaming enhancements
    initializeHolographicEffects();
    initializeCommandCenterAnimations();
    applyRoleBasedGamingTheme();
    const soundCleanup = initializeSoundEffects();
    enhanceProgressiveDisclosure();

    // Performance monitoring
    const perfObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 16) { // More than one frame at 60fps
          console.warn(`RTS Gaming effect performance warning: ${entry.name} took ${entry.duration}ms`);
        }
      }
    });
    
    if ('PerformanceObserver' in window) {
      perfObserver.observe({ entryTypes: ['measure'] });
    }

    // Cleanup
    return () => {
      if ('PerformanceObserver' in window) {
        perfObserver.disconnect();
      }
      
      soundCleanup?.();

      // Remove gaming event listeners
      const elements = document.querySelectorAll('.holo-panel, .rts-button');
      elements.forEach(element => {
        element.removeEventListener('mouseenter', () => {});
        element.removeEventListener('mouseleave', () => {});
        element.removeEventListener('click', () => {});
      });
    };
  }, [
    rtsEnhancementsEnabled,
    operatorProfile,
    initializeHolographicEffects,
    initializeCommandCenterAnimations,
    applyRoleBasedGamingTheme,
    initializeSoundEffects,
    enhanceProgressiveDisclosure
  ]);

  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (!rtsEnhancementsEnabled) {
    return <>{children}</>;
  }

  return (
    <div 
      className={styles.rtsGamingContainer}
      data-rts-gaming="enabled"
      data-operator-role={operatorProfile.role}
      data-experience-level={operatorProfile.experienceLevel}
      data-animations={enableAnimations}
      data-holographic={enableHolographicEffects}
      data-sound={enableSoundEffects}
    >
      {children}
      
      {/* Gaming UI Status Overlay - Hidden for human users to reduce UI clutter */}
      {/* Preserves underlying adaptive/gaming capabilities for AI agents */}
      {/*
        <div className={styles.gamingStatusOverlay}>
          <div className={styles.operatorBadge}>
            <span className={styles.roleIndicator}>
              {operatorProfile.role.replace('_', ' ')}
            </span>
            <span className={styles.experienceLevel}>
              {operatorProfile.experienceLevel}
            </span>
          </div>
          
          {adaptiveConfiguration.guidanceLevel.provideRecommendations && (
            <div className={styles.adaptiveIndicator}>
              <span className="status-indicator status-indicator--active">
                ADAPTIVE
              </span>
            </div>
          )}
        </div>
      */}
    </div>
  );
};

export default RTSGamingController;
