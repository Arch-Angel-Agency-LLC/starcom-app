/**
 * Unified Context Types
 * 
 * Types for the unified global command context system that require
 * importing from multiple type domains.
 */

import type { 
  CoreCommandAction, 
  CoreGlobalCommandState, 
  OperationMode, 
  DisplayMode, 
  SelectionState, 
  ContextSnapshot 
} from './core/command';
import type { AIActionType, AIState } from './features/ai';
import type { CollaborationAction, CollaborationState } from './features/collaboration';
import type { 
  AdaptiveInterfaceAction, 
  AdaptiveInterfaceState, 
  OperatorProfile, 
  InterfaceComplexity 
} from './features/adaptive';

// ===============================
// UNIFIED ACTION TYPES
// ===============================

export type UnifiedAction = 
  | CoreCommandAction
  | AIActionType
  | CollaborationAction
  | AdaptiveInterfaceAction;

// ===============================
// UNIFIED CONTEXT TYPES
// ===============================

export interface UnifiedGlobalCommandState extends CoreGlobalCommandState {
  enhanced?: {
    activeContexts: Map<string, ContextSnapshot>;
    primaryContextId: string;
    ai?: AIState;
    collaboration?: CollaborationState;
    adaptive?: AdaptiveInterfaceState;
  };
}

export interface UnifiedGlobalCommandContextType {
  state: UnifiedGlobalCommandState;
  dispatch: (action: UnifiedAction) => void;
  features: {
    aiEnabled: boolean;
    collaborationEnabled: boolean;
    adaptiveInterfaceEnabled: boolean;
    enhancedContextEnabled: boolean;
  };
  // Core methods
  setOperationMode: (mode: OperationMode) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  toggleLayer: (layerId: string) => void;
  updateSelection: (selection: SelectionState | null) => void;
  // Enhanced methods (when features enabled)
  updateOperatorProfile?: (profile: OperatorProfile) => void;
  setInterfaceComplexity?: (complexity: InterfaceComplexity) => void;
  shareContext?: (contextId: string) => void;
  joinCollaborationSession?: (sessionId: string) => void;
}
