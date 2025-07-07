/**
 * Phase Transition Manager
 * 
 * Manages smooth transitions between Phase 2 and Phase 3 features,
 * providing progressive enhancement and feature discovery for users.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useCollaboration } from '../../hooks/useUnifiedGlobalCommand';
import { useFeatureFlag } from '../../utils/featureFlags';
import RealTimeEventSystem from '../../services/realTimeEventSystem';
import styles from './PhaseTransitionManager.module.css';

interface PhaseTransitionManagerProps {
  children: React.ReactNode;
}

interface TransitionState {
  phase: 'legacy' | 'transitioning' | 'collaborative';
  showIntro: boolean;
  featuresUnlocked: string[];
  tutorialStep: number;
}

// TODO: Implement automated investigation report generation with templates - PRIORITY: MEDIUM
const PhaseTransitionManager: React.FC<PhaseTransitionManagerProps> = ({ children }) => {
  const { currentSession, isConnected, collaborationState } = useCollaboration();
  const collaborationEnabled = useFeatureFlag('collaborationEnabled');
  const [transitionState, setTransitionState] = useState<TransitionState>({
    phase: 'legacy',
    showIntro: false,
    featuresUnlocked: [],
    tutorialStep: 0
  });

  const eventSystem = RealTimeEventSystem.getInstance();

  // Determine current phase based on collaboration state
  const determinePhase = useCallback(() => {
    if (!collaborationEnabled) {
      return 'legacy';
    }
    
    if (currentSession && isConnected) {
      return 'collaborative';
    }
    
    if (collaborationState.enabled && (collaborationState.sessions.length > 0 || collaborationState.participants.length > 0)) {
      return 'transitioning';
    }
    
    return 'legacy';
  }, [collaborationEnabled, currentSession, isConnected, collaborationState]);

  // Handle phase transitions
  useEffect(() => {
    const newPhase = determinePhase();
    
    if (newPhase !== transitionState.phase) {
      setTransitionState(prev => ({
        ...prev,
        phase: newPhase,
        showIntro: newPhase === 'transitioning' && prev.phase === 'legacy'
      }));

      // Emit phase transition event
      eventSystem.emit({
        type: 'UI_UPDATE_CONTEXT',
        payload: {
          phaseTransition: {
            from: transitionState.phase,
            to: newPhase,
            timestamp: Date.now()
          }
        },
        source: 'system',
        timestamp: new Date(),
        priority: 'normal'
      });

      // Show notifications for major transitions
      if (newPhase === 'collaborative' && transitionState.phase !== 'collaborative') {
        eventSystem.emit({
          type: 'UI_SHOW_NOTIFICATION',
          payload: {
            type: 'success',
            title: 'Collaboration Active',
            message: 'Multi-agency collaboration features are now available',
            duration: 5000
          },
          source: 'system',
          timestamp: new Date(),
          priority: 'high'
        });
      }
    }
  }, [determinePhase, transitionState.phase, eventSystem]);

  // Progressive feature unlocking
  const unlockFeature = useCallback((featureName: string) => {
    setTransitionState(prev => {
      if (!prev.featuresUnlocked.includes(featureName)) {
        const newFeatures = [...prev.featuresUnlocked, featureName];
        
        // Emit feature unlock event
        eventSystem.emit({
          type: 'UI_SHOW_NOTIFICATION',
          payload: {
            type: 'info',
            title: 'New Feature Unlocked',
            message: `${featureName} is now available`,
            duration: 3000
          },
          source: 'system',
          timestamp: new Date(),
          priority: 'normal'
        });

        return {
          ...prev,
          featuresUnlocked: newFeatures
        };
      }
      return prev;
    });
  }, [eventSystem]);

  // Auto-unlock features based on phase progression
  useEffect(() => {
    const { phase, featuresUnlocked } = transitionState;
    
    switch (phase) {
      case 'transitioning':
        if (!featuresUnlocked.includes('SessionManager')) {
          setTimeout(() => unlockFeature('Session Management'), 1000);
        }
        if (!featuresUnlocked.includes('OperatorProfiles')) {
          setTimeout(() => unlockFeature('Operator Profiles'), 2000);
        }
        break;
        
      case 'collaborative':
        if (!featuresUnlocked.includes('RealTimeSync')) {
          setTimeout(() => unlockFeature('Real-Time Synchronization'), 500);
        }
        if (!featuresUnlocked.includes('IntelligenceMarketplace')) {
          setTimeout(() => unlockFeature('Intelligence Marketplace'), 1500);
        }
        if (!featuresUnlocked.includes('CollaborativeAnnotations')) {
          setTimeout(() => unlockFeature('Collaborative Annotations'), 2500);
        }
        break;
    }
  }, [transitionState, unlockFeature]);

  // Tutorial/intro management
  const dismissIntro = useCallback(() => {
    setTransitionState(prev => ({
      ...prev,
      showIntro: false
    }));
  }, []);

  const nextTutorialStep = useCallback(() => {
    setTransitionState(prev => ({
      ...prev,
      tutorialStep: prev.tutorialStep + 1
    }));
  }, []);

  // Enhanced HUD class names based on phase
  const getHUDClassName = useCallback(() => {
    const baseClass = styles.hudWrapper;
    const phaseClass = styles[`phase-${transitionState.phase}`];
    const transitionClass = transitionState.showIntro ? styles.showingIntro : '';
    
    return [baseClass, phaseClass, transitionClass].filter(Boolean).join(' ');
  }, [transitionState.phase, transitionState.showIntro]);

  // Feature availability checker
  const isFeatureAvailable = useCallback((featureName: string) => {
    return transitionState.featuresUnlocked.includes(featureName) || 
           transitionState.phase === 'collaborative';
  }, [transitionState.featuresUnlocked, transitionState.phase]);

  // Expose transition state to child components via events
  useEffect(() => {
    // Emit transition state updates for components to listen to
    eventSystem.emit({
      type: 'UI_UPDATE_CONTEXT',
      payload: {
        phaseTransition: {
          phase: transitionState.phase,
          featuresUnlocked: transitionState.featuresUnlocked,
          isFeatureAvailable,
          unlockFeature
        }
      },
      source: 'system',
      timestamp: new Date(),
      priority: 'low'
    });
  }, [transitionState, isFeatureAvailable, unlockFeature, eventSystem]);

  // Listen for manual feature requests
  useEffect(() => {
    const unsubscribe = eventSystem.subscribe(
      'phase-transition-manager',
      ['collaboration:feature-request'],
      (event) => {
        if (event.payload && typeof event.payload === 'object' && 'feature' in event.payload) {
          const feature = (event.payload as { feature: string }).feature;
          if (transitionState.phase === 'collaborative') {
            unlockFeature(feature);
          } else {
            // Show hint about collaboration requirement
            eventSystem.emit({
              type: 'UI_SHOW_NOTIFICATION',
              payload: {
                type: 'info',
                title: 'Feature Requires Collaboration',
                message: `${feature} is available when joined to a collaboration session`,
                duration: 4000
              },
              source: 'system',
              timestamp: new Date(),
              priority: 'normal'
            });
          }
        }
      }
    );

    return unsubscribe;
  }, [eventSystem, transitionState.phase, unlockFeature]);

  return (
    <div className={getHUDClassName()}>
      {/* Phase Transition Introduction Overlay */}
      {transitionState.showIntro && (
        <div className={styles.introOverlay}>
          <div className={styles.introModal}>
            <div className={styles.introHeader}>
              <h2>Multi-Agency Collaboration Available</h2>
              <button 
                className={styles.closeButton}
                onClick={dismissIntro}
                aria-label="Close introduction"
              >
                ×
              </button>
            </div>
            <div className={styles.introContent}>
              <p>
                Enhanced collaboration features are now available. You can now:
              </p>
              <ul>
                <li>Join multi-agency collaboration sessions</li>
                <li>Share real-time intelligence and annotations</li>
                <li>Access the intelligence marketplace</li>
                <li>Coordinate with other operators in real-time</li>
              </ul>
              <div className={styles.introActions}>
                <button 
                  className={styles.primaryButton}
                  onClick={dismissIntro}
                >
                  Get Started
                </button>
                <button 
                  className={styles.secondaryButton}
                  onClick={nextTutorialStep}
                >
                  Show Me Around
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase Status Indicator - Moved to RightSideBar for better integration */}
      {/*
      <div className={styles.phaseIndicator}>
        <div className={`${styles.phaseStatus} ${styles[transitionState.phase]}`}>
          <span className={styles.phaseIcon}>
            {transitionState.phase === 'legacy' && '🌍'}
            {transitionState.phase === 'transitioning' && '🔄'}
            {transitionState.phase === 'collaborative' && '👥'}
          </span>
          <span className={styles.phaseLabel}>
            {transitionState.phase === 'legacy' && 'Standard Mode'}
            {transitionState.phase === 'transitioning' && 'Collaboration Ready'}
            {transitionState.phase === 'collaborative' && 'Multi-Agency Active'}
          </span>
        </div>
      </div>
      */}

      {/* Enhanced HUD Content */}
      <div className={styles.enhancedHUD}>
        {children}
      </div>

      {/* Feature Unlock Notifications */}
      {transitionState.featuresUnlocked.length > 0 && (
        <div className={styles.featureIndicators}>
          {transitionState.featuresUnlocked.slice(-3).map((feature, index) => (
            <div 
              key={feature} 
              className={styles.featureUnlocked}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              ✨ {feature}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhaseTransitionManager;
