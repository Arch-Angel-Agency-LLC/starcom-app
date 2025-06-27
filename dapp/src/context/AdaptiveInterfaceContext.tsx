/**
 * Adaptive Interface Context and Hooks
 * 
 * React context and hooks for managing adaptive interface state,
 * role-based UI customization, and progressive disclosure.
 */

import React, { createContext, useReducer, useEffect, useMemo, useCallback, useRef } from 'react';
import AdaptiveInterfaceService from '../services/adaptiveInterfaceService';
import type {
  AdaptiveInterfaceState,
  AdaptiveInterfaceAction
} from '../types';

// ============================================================================
// INITIAL STATE
// ============================================================================

const createInitialState = (): AdaptiveInterfaceState => {
  const service = AdaptiveInterfaceService.getInstance();
  const savedState = service.loadAdaptiveState();
  
  if (savedState) {
    return {
      operatorProfile: savedState.operatorProfile,
      adaptiveConfiguration: savedState.adaptiveConfiguration,
      progressiveDisclosure: savedState.progressiveDisclosure,
      aiAdaptation: savedState.aiAdaptation,
      contextualHelp: [],
      isAdaptationEnabled: true,
      adaptationMode: 'HYBRID',
      lastAdaptation: new Date()
    };
  }

  // Create default state
  const defaultProfile = service.createDefaultOperatorProfile();
  
  return {
    operatorProfile: defaultProfile,
    adaptiveConfiguration: {
      uiComplexity: {
        level: 'SIMPLIFIED',
        visiblePanels: ['navigation', 'basic_tools'],
        collapsedSections: ['advanced_features'],
        hiddenFeatures: ['expert_mode'],
        simplifiedControls: true,
        reducedDensity: true
      },
      guidanceLevel: {
        type: 'FULL_GUIDANCE',
        showOnboarding: true,
        highlightNewFeatures: true,
        provideRecommendations: true,
        enableTutorials: true
      },
      availableTools: [],
      enabledFeatures: [],
      panelConfigurations: [],
      workflowTemplates: [],
      contextualHelp: {
        enableTooltips: true,
        enableGuidance: true,
        enableTutorials: true,
        showKeyboardShortcuts: true,
        adaptiveHelp: true,
        helpLevel: 'COMPREHENSIVE'
      }
    },
    progressiveDisclosure: {
      unlockedFeatures: [],
      availableFeatures: [],
      recommendedNextSteps: [],
      completedTutorials: [],
      skillProgress: [],
      achievementLevel: 1
    },
    aiAdaptation: {
      userBehaviorProfile: {
        preferredWorkflows: [],
        frequentlyUsedTools: [],
        taskCompletionPatterns: [],
        errorPatterns: [],
        learningVelocity: 0.5,
        adaptationReadiness: 0.3
      },
      adaptationRecommendations: [],
      learningProgress: {
        totalLearningHours: 0,
        completedModules: [],
        currentGoals: [],
        achievements: [],
        skillGaps: []
      },
      performanceMetrics: {
        taskCompletionRate: 0.5,
        averageTaskTime: 300,
        errorRate: 0.1,
        efficiencyScore: 0.5,
        collaborationScore: 0.5,
        adaptationScore: 0.5,
        trends: []
      },
      adaptationHistory: []
    },
    contextualHelp: [],
    isAdaptationEnabled: true,
    adaptationMode: 'HYBRID',
    lastAdaptation: new Date()
  };
};

// ============================================================================
// REDUCER
// ============================================================================

const adaptiveInterfaceReducer = (
  state: AdaptiveInterfaceState,
  action: AdaptiveInterfaceAction
): AdaptiveInterfaceState => {
  switch (action.type) {
    case 'SET_OPERATOR_PROFILE':
      return {
        ...state,
        operatorProfile: action.payload,
        lastAdaptation: new Date()
      };

    case 'UPDATE_EXPERIENCE_LEVEL':
      return {
        ...state,
        operatorProfile: {
          ...state.operatorProfile,
          experienceLevel: action.payload
        },
        lastAdaptation: new Date()
      };

    case 'SET_INTERFACE_COMPLEXITY':
      return {
        ...state,
        operatorProfile: {
          ...state.operatorProfile,
          preferredComplexity: action.payload
        },
        adaptiveConfiguration: {
          ...state.adaptiveConfiguration,
          uiComplexity: {
            ...state.adaptiveConfiguration.uiComplexity,
            level: action.payload
          }
        },
        lastAdaptation: new Date()
      };

    case 'UPDATE_SPECIALIZATIONS':
      return {
        ...state,
        operatorProfile: {
          ...state.operatorProfile,
          specializations: action.payload
        },
        lastAdaptation: new Date()
      };

    case 'UNLOCK_FEATURE':
      return {
        ...state,
        progressiveDisclosure: {
          ...state.progressiveDisclosure,
          unlockedFeatures: [
            ...state.progressiveDisclosure.unlockedFeatures,
            action.payload
          ]
        },
        lastAdaptation: new Date()
      };

    case 'COMPLETE_TUTORIAL':
      return {
        ...state,
        operatorProfile: {
          ...state.operatorProfile,
          trainingCompleted: [
            ...state.operatorProfile.trainingCompleted,
            action.payload
          ]
        },
        progressiveDisclosure: {
          ...state.progressiveDisclosure,
          completedTutorials: [
            ...state.progressiveDisclosure.completedTutorials,
            action.payload
          ]
        },
        lastAdaptation: new Date()
      };

    case 'UPDATE_SKILL_PROGRESS': {
      const existingSkillIndex = state.progressiveDisclosure.skillProgress.findIndex(
        skill => skill.skillId === action.payload.skillId
      );

      const newSkillProgress = [...state.progressiveDisclosure.skillProgress];
      if (existingSkillIndex >= 0) {
        newSkillProgress[existingSkillIndex] = action.payload;
      } else {
        newSkillProgress.push(action.payload);
      }

      return {
        ...state,
        progressiveDisclosure: {
          ...state.progressiveDisclosure,
          skillProgress: newSkillProgress
        },
        lastAdaptation: new Date()
      };
    }

    case 'ADD_CUSTOMIZATION':
      return {
        ...state,
        operatorProfile: {
          ...state.operatorProfile,
          customizations: [
            ...state.operatorProfile.customizations,
            action.payload
          ]
        },
        lastAdaptation: new Date()
      };

    case 'REMOVE_CUSTOMIZATION':
      return {
        ...state,
        operatorProfile: {
          ...state.operatorProfile,
          customizations: state.operatorProfile.customizations.filter(
            custom => custom.id !== action.payload
          )
        },
        lastAdaptation: new Date()
      };

    case 'UPDATE_ADAPTATION_PREFERENCES':
      return {
        ...state,
        operatorProfile: {
          ...state.operatorProfile,
          adaptationPreferences: action.payload
        },
        lastAdaptation: new Date()
      };

    case 'APPLY_AI_RECOMMENDATION':
      return {
        ...state,
        aiAdaptation: {
          ...state.aiAdaptation,
          adaptationRecommendations: state.aiAdaptation.adaptationRecommendations.filter(
            rec => rec.id !== action.payload.id
          )
        },
        lastAdaptation: new Date()
      };

    case 'RECORD_ADAPTATION_EVENT':
      return {
        ...state,
        aiAdaptation: {
          ...state.aiAdaptation,
          adaptationHistory: [
            ...state.aiAdaptation.adaptationHistory,
            action.payload
          ]
        }
      };

    case 'TOGGLE_ADAPTATION':
      return {
        ...state,
        isAdaptationEnabled: action.payload
      };

    case 'SET_ADAPTATION_MODE':
      return {
        ...state,
        adaptationMode: action.payload
      };

    case 'RESET_ADAPTATION_STATE':
      return createInitialState();

    default:
      return state;
  }
};

// ============================================================================
// CONTEXT
// ============================================================================

const AdaptiveInterfaceContext = createContext<{
  state: AdaptiveInterfaceState;
  dispatch: React.Dispatch<AdaptiveInterfaceAction>;
} | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface AdaptiveInterfaceProviderProps {
  children: React.ReactNode;
}

export const AdaptiveInterfaceProvider: React.FC<AdaptiveInterfaceProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(adaptiveInterfaceReducer, createInitialState());

  // Auto-save state changes with debouncing to prevent excessive storage operations
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      const service = AdaptiveInterfaceService.getInstance();
      service.saveAdaptiveState({
        operatorProfile: state.operatorProfile,
        adaptiveConfiguration: state.adaptiveConfiguration,
        progressiveDisclosure: state.progressiveDisclosure,
        aiAdaptation: state.aiAdaptation
      });
    }, 1000); // Debounce for 1 second
  }, [state.operatorProfile, state.adaptiveConfiguration, state.progressiveDisclosure, state.aiAdaptation]);

  useEffect(() => {
    debouncedSave();
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [debouncedSave]);

  // Generate AI recommendations periodically - DISABLED TO PREVENT PERFORMANCE ISSUES
  // This feature was causing excessive loops and has been completely disabled

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <AdaptiveInterfaceContext.Provider value={value}>
      {children}
    </AdaptiveInterfaceContext.Provider>
  );
};

// ============================================================================
// CONTEXT EXPORT
// ============================================================================

export { AdaptiveInterfaceContext };
export default AdaptiveInterfaceProvider;
