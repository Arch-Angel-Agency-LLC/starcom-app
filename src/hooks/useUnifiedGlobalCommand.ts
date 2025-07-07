/**
 * Unified Global Command Hooks
 * Main hook and utility hooks for the unified global command context
 */

import { useContext } from 'react';
import UnifiedGlobalCommandContext from '../context/UnifiedGlobalCommandContext';
import type { 
  OperationMode, 
  UnifiedGlobalCommandContextType 
} from '../context/UnifiedGlobalCommandContext';

// ===============================
// MAIN HOOK
// ===============================

export const useGlobalCommand = (): UnifiedGlobalCommandContextType => {
  const context = useContext(UnifiedGlobalCommandContext);
  if (!context) {
    throw new Error('useGlobalCommand must be used within a UnifiedGlobalCommandProvider');
  }
  return context;
};

// ===============================
// UTILITY HOOKS
// ===============================

// Hook for specific operation mode
export const useOperationMode = () => {
  const { state, setOperationMode } = useGlobalCommand();
  return {
    operationMode: state.operationMode,
    setOperationMode,
    isActive: (mode: OperationMode) => state.operationMode === mode
  };
};

// Hook for data layer management
export const useDataLayers = (category?: OperationMode) => {
  const { state, addDataLayer, removeDataLayer, toggleLayerVisibility } = useGlobalCommand();
  
  const layers = category 
    ? state.activeLayers.filter(layer => layer.category === category)
    : state.activeLayers;
    
  const activeLayers = layers.filter(layer => layer.isActive);
  
  return {
    layers,
    activeLayers,
    addDataLayer,
    removeDataLayer,
    toggleLayerVisibility,
    layerCount: layers.length,
    activeLayerCount: activeLayers.length
  };
};

// Hook for mission operations
export const useMissionOperations = () => {
  const { state, startOperation, endOperation, setPriorityLevel } = useGlobalCommand();
  
  return {
    missionState: state.missionState,
    activeOperations: state.missionState.activeOperations,
    startOperation,
    endOperation,
    setPriorityLevel,
    hasActiveOperations: state.missionState.activeOperations.length > 0,
    criticalOperationsCount: state.missionState.activeOperations.filter(op => op.priority === 'CRITICAL').length
  };
};

// Hook for layout management
export const useLayoutState = () => {
  const { state, updateLayoutState } = useGlobalCommand();
  
  return {
    layoutState: state.layoutState,
    updateLayoutState,
    togglePanel: (panel: keyof typeof state.layoutState) => {
      if (panel === 'megaCategoryPanel') {
        const current = state.layoutState.megaCategoryPanel;
        const next = current === 'expanded' ? 'collapsed' : 'expanded';
        updateLayoutState({ megaCategoryPanel: next });
      }
    }
  };
};

// Enhanced hooks (conditionally available)
export const useEnhancedFeatures = () => {
  const { state, features, createContextSnapshot, switchPrimaryContext } = useGlobalCommand();
  
  if (!features.enhanced) {
    return null;
  }
  
  return {
    enhanced: state.enhanced,
    createContextSnapshot,
    switchPrimaryContext,
    isEnhanced: true
  };
};

export const useAIFeatures = () => {
  const { state, features, addThreatIndicator, addAIInsight } = useGlobalCommand();
  
  if (!features.ai) {
    return null;
  }
  
  return {
    ai: state.ai,
    addThreatIndicator,
    addAIInsight,
    hasAI: true
  };
};

export const useCollaborationFeatures = () => {
  const { state, features, joinCollaborationSession, leaveCollaborationSession } = useGlobalCommand();
  
  if (!features.collaboration) {
    return null;
  }
  
  return {
    collaboration: state.collaboration,
    joinCollaborationSession,
    leaveCollaborationSession,
    hasCollaboration: true
  };
};

export const useSecurityFeatures = () => {
  const { state, features, addSecurityAlert, resolveSecurityAlert } = useGlobalCommand();
  
  if (!features.security) {
    return null;
  }
  
  return {
    security: state.security,
    addSecurityAlert,
    resolveSecurityAlert,
    hasSecurity: true
  };
};

export const useAdaptiveFeatures = () => {
  const { state, features, updateOperatorProfile, setInterfaceComplexity } = useGlobalCommand();
  
  if (!features.adaptive) {
    return null;
  }
  
  return {
    adaptive: state.adaptive,
    updateOperatorProfile,
    setInterfaceComplexity,
    hasAdaptive: true
  };
};

// Progressive enhancement hook
export const useProgressiveEnhancement = () => {
  const { features } = useGlobalCommand();
  
  return {
    isEnhanced: features.enhanced,
    hasAI: features.ai,
    hasCollaboration: features.collaboration,
    hasSecurity: features.security,
    hasAdaptive: features.adaptive,
    
    // Helper to check if any enhanced features are available
    hasAnyEnhanced: features.enhanced || features.ai || features.collaboration || features.security || features.adaptive,
    
    // Helper to get available feature set
    availableFeatures: Object.entries(features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature)
  };
};

// Legacy alias for backward compatibility
export const useCollaboration = () => {
  const collaborationFeatures = useCollaborationFeatures();
  
  if (!collaborationFeatures) {
    // Return mock data when collaboration features are not available
    return {
      currentSession: null,
      isConnected: false,
      collaborationState: {
        enabled: false,
        sessions: [],
        participants: [],
        activeSession: null,
        operator: null
      },
      collaborationEnabled: false,
      createSession: () => Promise.resolve(null),
      joinSession: () => Promise.resolve(false),
      leaveSession: () => Promise.resolve(),
      sendMessage: (message: string) => {
        console.log('Mock sendMessage:', message);
      }
    };
  }
  
  // Return a safe implementation when collaboration features are available
  return {
    currentSession: collaborationFeatures.collaboration?.currentSession || null,
    isConnected: Boolean(collaborationFeatures.collaboration?.state?.connected),
    collaborationState: {
      enabled: true,
      sessions: [],
      participants: [],
      activeSession: collaborationFeatures.collaboration?.currentSession || null,
      operator: { id: 'mock-operator-id', name: 'Mock Operator' }
    },
    collaborationEnabled: true,
    createSession: () => {
      // Implementation would go here
      return Promise.resolve(null);
    },
    joinSession: (sessionId: string) => {
      // Safe wrapper for join session
      try {
        return collaborationFeatures.joinCollaborationSession({ sessionId });
      } catch {
        return Promise.resolve(false);
      }
    },
    leaveSession: () => {
      // Safe wrapper for leave session
      try {
        return collaborationFeatures.leaveCollaborationSession();
      } catch {
        return Promise.resolve();
      }
    },
    sendMessage: (message: string) => {
      // Mock implementation for message sending
      console.log('Collaboration message:', message);
    }
  };
};
