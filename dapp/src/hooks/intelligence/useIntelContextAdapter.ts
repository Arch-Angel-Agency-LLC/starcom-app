/**
 * Intel Context Adapter Hook - Enhanced
 * 
 * Provides context-aware adaptation for Intel Reports 3D with enhanced
 * error handling, performance optimization, and resource management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  IntelReport3DContextState,
  OperationMode,
  IntelDisplayContext
} from '../../types/intelligence/IntelContextTypes';
import { IntelContextService } from '../../services/intelligence/IntelContextService';

// =============================================================================
// HOOK INTERFACE
// =============================================================================

// TODO: Implement data state synchronization across multiple components - PRIORITY: MEDIUM
// TODO: Add comprehensive data state validation and error handling - PRIORITY: HIGH
// TODO: Implement data state transformation and normalization pipelines - PRIORITY: MEDIUM
export interface IntelContextAdapterOptions {
  autoAdapt?: boolean;
  hudIntegration?: boolean;
  adaptationDelay?: number;
  maxRetries?: number;
}

export interface IntelContextAdapterState {
  context: IntelReport3DContextState | null;
  isAdapting: boolean;
  lastAdaptation: Date | null;
  error: Error | null;
  adaptationCount: number;
}

export interface IntelContextAdapterActions {
  adaptToOperationMode: (mode: OperationMode) => Promise<void>;
  adaptToDisplayContext: (display: IntelDisplayContext) => Promise<void>;
  resetToDefault: () => Promise<void>;
  clearError: () => void;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export const useIntelContextAdapter = (
  options: IntelContextAdapterOptions = {}
): IntelContextAdapterState & IntelContextAdapterActions => {
  const { 
    hudIntegration = true, 
    adaptationDelay = 300,
    maxRetries = 3
  } = options;
  
  const contextServiceRef = useRef<IntelContextService | null>(null);
  const isUnmounted = useRef<boolean>(false);
  const retryCount = useRef<number>(0);
  
  const [state, setState] = useState<IntelContextAdapterState>({
    context: null,
    isAdapting: false,
    lastAdaptation: null,
    error: null,
    adaptationCount: 0
  });
  
  // Enhanced error handler
  const handleError = useCallback((error: Error, action: string) => {
    if (isUnmounted.current) return;
    
    setState(prevState => ({
      ...prevState,
      error,
      isAdapting: false
    }));
    
    if (process.env.NODE_ENV === 'development') {
      console.error(`Intel Context Adapter Error [${action}]:`, error);
    }
  }, []);
  
  // Clear error action
  const clearError = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      error: null
    }));
  }, []);
  
  // Component unmount detection
  useEffect(() => {
    return () => {
      isUnmounted.current = true;
    };
  }, []);
  
  // Initialize context service
  useEffect(() => {
    if (!contextServiceRef.current) {
      contextServiceRef.current = new IntelContextService(undefined, {
        enableAutoSync: hudIntegration,
        debugMode: process.env.NODE_ENV === 'development'
      });
      
      // Subscribe to context changes
      const unsubscribe = contextServiceRef.current.on('contextChanged', (newContext) => {
        setState(prevState => ({
          ...prevState,
          context: newContext,
          lastAdaptation: new Date()
        }));
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [hudIntegration]);
  
  // Adapt to operation mode with retry logic
  const adaptToOperationMode = useCallback(async (mode: OperationMode): Promise<void> => {
    if (!contextServiceRef.current || isUnmounted.current) return;
    
    setState(prevState => ({ ...prevState, isAdapting: true, error: null }));
    
    const attemptAdaptation = async (attempt: number): Promise<void> => {
      try {
        const optimizedContext = createOptimalContextForOperationMode(mode, state.context);
        contextServiceRef.current!.updateContext(optimizedContext);
        
        if (!isUnmounted.current) {
          setState(prevState => ({
            ...prevState,
            isAdapting: false,
            adaptationCount: prevState.adaptationCount + 1,
            lastAdaptation: new Date()
          }));
        }
        retryCount.current = 0;
      } catch (error) {
        if (attempt < maxRetries) {
          retryCount.current = attempt + 1;
          // Exponential backoff
          setTimeout(() => attemptAdaptation(attempt + 1), adaptationDelay * Math.pow(2, attempt));
        } else {
          handleError(error as Error, 'operation-mode-adaptation');
          retryCount.current = 0;
        }
      }
    };
    
    await attemptAdaptation(0);
  }, [state.context, handleError, maxRetries, adaptationDelay]);
  
  // Adapt to display context with retry logic
  const adaptToDisplayContext = useCallback(async (display: IntelDisplayContext): Promise<void> => {
    if (!contextServiceRef.current || isUnmounted.current) return;
    
    setState(prevState => ({ ...prevState, isAdapting: true, error: null }));
    
    try {
      const currentContext = state.context || createDefaultContext();
      const optimizedContext: IntelReport3DContextState = {
        ...currentContext,
        displayContext: display
      };
      
      contextServiceRef.current.updateContext(optimizedContext);
      
      if (!isUnmounted.current) {
        setState(prevState => ({
          ...prevState,
          isAdapting: false,
          adaptationCount: prevState.adaptationCount + 1,
          lastAdaptation: new Date()
        }));
      }
    } catch (error) {
      handleError(error as Error, 'display-context-adaptation');
    }
  }, [state.context, handleError]);
  
  // Reset to default with error handling
  const resetToDefault = useCallback(async (): Promise<void> => {
    if (!contextServiceRef.current || isUnmounted.current) return;
    
    try {
      setState(prevState => ({ ...prevState, isAdapting: true, error: null }));
      
      const defaultContext = createDefaultContext();
      contextServiceRef.current.updateContext(defaultContext);
      
      if (!isUnmounted.current) {
        setState(prevState => ({
          ...prevState,
          isAdapting: false,
          adaptationCount: prevState.adaptationCount + 1,
          lastAdaptation: new Date()
        }));
      }
    } catch (error) {
      handleError(error as Error, 'reset-to-default');
    }
  }, [handleError]);
  
  return {
    ...state,
    adaptToOperationMode,
    adaptToDisplayContext,
    resetToDefault,
    clearError
  };
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createOptimalContextForOperationMode(
  mode: OperationMode,
  currentContext: IntelReport3DContextState | null
): IntelReport3DContextState {
  const base = currentContext || createDefaultContext();
  
  switch (mode) {
    case 'CYBER':
      return {
        ...base,
        hudContext: {
          ...base.hudContext,
          operationMode: mode,
          centerMode: 'NODE_GRAPH'
        },
        displayContext: {
          ...base.displayContext,
          priority: 'primary',
          adaptiveRendering: true
        }
      };
      
    case 'SPACE':
      return {
        ...base,
        hudContext: {
          ...base.hudContext,
          operationMode: mode,
          centerMode: 'TIMELINE'
        },
        displayContext: {
          ...base.displayContext,
          priority: 'secondary',
          adaptiveRendering: true
        }
      };
      
    case 'PLANETARY':
      return {
        ...base,
        hudContext: {
          ...base.hudContext,
          operationMode: mode,
          centerMode: '3D_GLOBE'
        },
        displayContext: {
          ...base.displayContext,
          priority: 'primary',
          adaptiveRendering: true
        }
      };
      
    case 'STELLAR':
      return {
        ...base,
        hudContext: {
          ...base.hudContext,
          operationMode: mode,
          centerMode: 'TIMELINE'
        },
        displayContext: {
          ...base.displayContext,
          priority: 'tertiary',
          adaptiveRendering: false
        }
      };
      
    default:
      return base;
  }
}

function createDefaultContext(): IntelReport3DContextState {
  return {
    hudContext: {
      operationMode: 'PLANETARY',
      centerMode: '3D_GLOBE',
      activeLayers: [],
      selectedObject: null
    },
    displayContext: {
      priority: 'primary',
      visibility: 'full',
      adaptiveRendering: true
    },
    integrationState: {
      leftSideControls: false,
      rightSideTools: false,
      bottomBarDetails: false,
      topBarStatus: false
    }
  };
}
