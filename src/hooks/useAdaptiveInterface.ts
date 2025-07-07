/**
 * Adaptive Interface Hooks
 * 
 * Custom hooks for the adaptive interface system, separated from the context
 * to maintain fast refresh compatibility.
 */

import { useContext, useCallback } from 'react';
import { AdaptiveInterfaceContext } from '../context/AdaptiveInterfaceContext';
import AdaptiveInterfaceService from '../services/adaptiveInterfaceService';
import type {
  UseAdaptiveInterfaceReturn,
  OperatorProfile,
  ExperienceLevel,
  InterfaceComplexity,
  Specialization,
  FeatureConfiguration,
  SkillProgress,
  InterfaceCustomization,
  AdaptationRecommendation,
  AdaptationEvent
} from '../types';

// ============================================================================
// MAIN HOOK
// ============================================================================

export const useAdaptiveInterface = (): UseAdaptiveInterfaceReturn => {
  const context = useContext(AdaptiveInterfaceContext);
  if (!context) {
    throw new Error('useAdaptiveInterface must be used within an AdaptiveInterfaceProvider');
  }

  const { state, dispatch } = context;
  const service = AdaptiveInterfaceService.getInstance();

  // Profile Management
  const updateOperatorProfile = useCallback((profile: Partial<OperatorProfile>) => {
    dispatch({
      type: 'SET_OPERATOR_PROFILE',
      payload: { ...state.operatorProfile, ...profile }
    });
  }, [state.operatorProfile, dispatch]);

  const setExperienceLevel = useCallback((level: ExperienceLevel) => {
    dispatch({ type: 'UPDATE_EXPERIENCE_LEVEL', payload: level });
  }, [dispatch]);

  const setInterfaceComplexity = useCallback((complexity: InterfaceComplexity) => {
    dispatch({ type: 'SET_INTERFACE_COMPLEXITY', payload: complexity });
  }, [dispatch]);

  const updateSpecializations = useCallback((specializations: Specialization[]) => {
    dispatch({ type: 'UPDATE_SPECIALIZATIONS', payload: specializations });
  }, [dispatch]);

  // Feature Management
  const unlockFeature = useCallback((featureId: string) => {
    dispatch({ type: 'UNLOCK_FEATURE', payload: featureId });
  }, [dispatch]);

  const checkFeatureAccess = useCallback((featureId: string) => {
    const feature: FeatureConfiguration = {
      id: featureId,
      name: featureId,
      description: '',
      enabled: true,
      discoverable: true,
      autoEnable: false,
      dependencies: []
    };
    
    const access = service.checkFeatureAccess(state.operatorProfile, feature);
    return access.hasAccess;
  }, [state.operatorProfile, service]);

  const getAvailableFeatures = useCallback((): FeatureConfiguration[] => {
    // This would typically come from a configuration or API
    const allFeatures: FeatureConfiguration[] = [
      {
        id: 'advanced_visualization',
        name: 'Advanced Visualization',
        description: 'Advanced data visualization tools',
        requiredExperience: 'INTERMEDIATE',
        enabled: true,
        discoverable: true,
        autoEnable: false,
        dependencies: []
      },
      {
        id: 'collaboration_tools',
        name: 'Collaboration Tools',
        description: 'Multi-agency collaboration features',
        requiredExperience: 'INTERMEDIATE',
        enabled: true,
        discoverable: true,
        autoEnable: false,
        dependencies: []
      },
      {
        id: 'ai_assistance',
        name: 'AI Assistance',
        description: 'AI-powered analysis and recommendations',
        requiredExperience: 'EXPERT',
        enabled: true,
        discoverable: true,
        autoEnable: false,
        dependencies: []
      }
    ];

    return service.getAvailableFeatures(state.operatorProfile, allFeatures);
  }, [state.operatorProfile, service]);

  // Progressive Disclosure
  const completeTutorial = useCallback((tutorialId: string) => {
    dispatch({ type: 'COMPLETE_TUTORIAL', payload: tutorialId });
  }, [dispatch]);

  const updateSkillProgress = useCallback((skillProgress: SkillProgress) => {
    dispatch({ type: 'UPDATE_SKILL_PROGRESS', payload: skillProgress });
  }, [dispatch]);

  const getRecommendedNextSteps = useCallback((): string[] => {
    return state.progressiveDisclosure.recommendedNextSteps;
  }, [state.progressiveDisclosure.recommendedNextSteps]);

  // Customization
  const addCustomization = useCallback((customization: InterfaceCustomization) => {
    dispatch({ type: 'ADD_CUSTOMIZATION', payload: customization });
  }, [dispatch]);

  const removeCustomization = useCallback((customizationId: string) => {
    dispatch({ type: 'REMOVE_CUSTOMIZATION', payload: customizationId });
  }, [dispatch]);

  const getCustomizations = useCallback((): InterfaceCustomization[] => {
    return state.operatorProfile.customizations;
  }, [state.operatorProfile.customizations]);

  // AI Adaptation
  const applyAIRecommendation = useCallback((recommendation: AdaptationRecommendation) => {
    dispatch({ type: 'APPLY_AI_RECOMMENDATION', payload: recommendation });
    
    // Record the adaptation event
    const event: AdaptationEvent = {
      id: `event_${Date.now()}`,
      timestamp: new Date(),
      type: recommendation.type === 'FEATURE_UNLOCK' ? 'FEATURE_UNLOCK' : 
            recommendation.type === 'COMPLEXITY_INCREASE' ? 'COMPLEXITY_CHANGE' :
            recommendation.type === 'TOOL_SUGGESTION' ? 'TOOL_ADDITION' : 'GUIDANCE_ADJUSTMENT',
      description: `Applied AI recommendation: ${recommendation.title}`
    };
    
    dispatch({ type: 'RECORD_ADAPTATION_EVENT', payload: event });
  }, [dispatch]);

  const getAdaptationRecommendations = useCallback((): AdaptationRecommendation[] => {
    return state.aiAdaptation.adaptationRecommendations;
  }, [state.aiAdaptation.adaptationRecommendations]);

  const recordAdaptationEvent = useCallback((event: AdaptationEvent) => {
    dispatch({ type: 'RECORD_ADAPTATION_EVENT', payload: event });
  }, [dispatch]);

  // Configuration
  const toggleAdaptation = useCallback(() => {
    dispatch({ type: 'TOGGLE_ADAPTATION', payload: !state.isAdaptationEnabled });
  }, [state.isAdaptationEnabled, dispatch]);

  const setAdaptationMode = useCallback((mode: 'AUTOMATIC' | 'MANUAL' | 'HYBRID') => {
    dispatch({ type: 'SET_ADAPTATION_MODE', payload: mode });
  }, [dispatch]);

  const resetAdaptationState = useCallback(() => {
    dispatch({ type: 'RESET_ADAPTATION_STATE' });
  }, [dispatch]);

  return {
    // State
    operatorProfile: state.operatorProfile,
    adaptiveConfiguration: state.adaptiveConfiguration,
    progressiveDisclosure: state.progressiveDisclosure,
    aiAdaptation: state.aiAdaptation,
    
    // Profile Management
    updateOperatorProfile,
    setExperienceLevel,
    setInterfaceComplexity,
    updateSpecializations,
    
    // Feature Management
    unlockFeature,
    checkFeatureAccess,
    getAvailableFeatures,
    
    // Progressive Disclosure
    completeTutorial,
    updateSkillProgress,
    getRecommendedNextSteps,
    
    // Customization
    addCustomization,
    removeCustomization,
    getCustomizations,
    
    // AI Adaptation
    applyAIRecommendation,
    getAdaptationRecommendations,
    recordAdaptationEvent,
    
    // Configuration
    isAdaptationEnabled: state.isAdaptationEnabled,
    toggleAdaptation,
    setAdaptationMode,
    resetAdaptationState
  };
};

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

export const useOperatorProfile = () => {
  const { operatorProfile, updateOperatorProfile } = useAdaptiveInterface();
  return { operatorProfile, updateOperatorProfile };
};

export const useFeatureAccess = () => {
  const { checkFeatureAccess, getAvailableFeatures, unlockFeature } = useAdaptiveInterface();
  return { checkFeatureAccess, getAvailableFeatures, unlockFeature };
};

export const useProgressiveDisclosure = () => {
  const { 
    progressiveDisclosure, 
    completeTutorial, 
    updateSkillProgress, 
    getRecommendedNextSteps 
  } = useAdaptiveInterface();
  return { 
    progressiveDisclosure, 
    completeTutorial, 
    updateSkillProgress, 
    getRecommendedNextSteps 
  };
};

export const useAIAdaptation = () => {
  const { 
    aiAdaptation, 
    applyAIRecommendation, 
    getAdaptationRecommendations, 
    recordAdaptationEvent 
  } = useAdaptiveInterface();
  return { 
    aiAdaptation, 
    applyAIRecommendation, 
    getAdaptationRecommendations, 
    recordAdaptationEvent 
  };
};
