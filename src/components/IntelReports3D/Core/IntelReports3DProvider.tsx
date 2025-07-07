/**
 * Intel Reports 3D Provider
 * 
 * Context provider that integrates Phase 3 hooks and provides
 * unified state management for Intel Reports 3D components.
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import {
  useIntelReports3D,
  useIntelContextAdapter,
  useIntelGlobeSync,
  type IntelReports3DOptions,
  type IntelContextAdapterOptions,
  type IntelGlobeSyncOptions,
  type IntelReports3DHooks
} from '../Hooks';

// =============================================================================
// PROVIDER CONFIGURATION
// =============================================================================

export interface IntelReports3DProviderOptions {
  // Hook configuration options
  mainOptions?: IntelReports3DOptions;
  contextOptions?: IntelContextAdapterOptions;
  globeOptions?: IntelGlobeSyncOptions;
  
  // Provider-level options
  enableGlobeIntegration?: boolean;
  enableContextAdaptation?: boolean;
  debugMode?: boolean;
}

export interface IntelReports3DContextValue extends IntelReports3DHooks {
  // Provider-level state
  isInitialized: boolean;
  providerError: Error | null;
  
  // Configuration
  options: IntelReports3DProviderOptions;
}

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const IntelReports3DContext = createContext<IntelReports3DContextValue | null>(null);

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

export interface IntelReports3DProviderProps {
  children: ReactNode;
  options?: IntelReports3DProviderOptions;
}

export const IntelReports3DProvider: React.FC<IntelReports3DProviderProps> = ({
  children,
  options = {}
}) => {
  const {
    mainOptions = {},
    contextOptions = {},
    globeOptions = {},
    enableGlobeIntegration = true,
    enableContextAdaptation = true,
    debugMode = process.env.NODE_ENV === 'development'
  } = options;

  // Initialize Phase 3 hooks with configuration
  const main = useIntelReports3D({
    adaptToHUD: enableContextAdaptation,
    realTimeUpdates: true,
    viewportCulling: true,
    enableBatching: true,
    ...mainOptions
  });

  const context = useIntelContextAdapter({
    hudIntegration: enableContextAdaptation,
    autoAdapt: true,
    ...contextOptions
  });

  const globe = useIntelGlobeSync({
    enableInteraction: enableGlobeIntegration,
    enableSelection: true,
    enableHover: true,
    maxMarkers: 1000,
    ...globeOptions
  });

  // Provider-level state management
  const contextValue = useMemo<IntelReports3DContextValue>(() => {
    const isInitialized = !main.loading && !context.isAdapting && !globe.loading;
    const providerError = main.error || context.error || globe.error;

    if (debugMode && providerError) {
      console.error('Intel Reports 3D Provider Error:', providerError);
    }

    return {
      // Hook instances
      main,
      context,
      globe,
      
      // Provider state
      isInitialized,
      providerError,
      options
    };
  }, [main, context, globe, options, debugMode]);

  // Debug logging in development
  if (debugMode && contextValue.isInitialized) {
    console.log('Intel Reports 3D Provider Initialized:', {
      reportsCount: contextValue.main.intelReports.length,
      contextActive: contextValue.context.context !== null,
      globeInitialized: contextValue.globe.initialized
    });
  }

  return (
    <IntelReports3DContext.Provider value={contextValue}>
      {children}
    </IntelReports3DContext.Provider>
  );
};

// =============================================================================
// HOOK FOR CONSUMING CONTEXT
// =============================================================================

export const useIntelReports3DContext = (): IntelReports3DContextValue => {
  const context = useContext(IntelReports3DContext);
  
  if (!context) {
    throw new Error(
      'useIntelReports3DContext must be used within an IntelReports3DProvider'
    );
  }
  
  return context;
};

// =============================================================================
// CONVENIENCE HOOKS FOR SPECIFIC FUNCTIONALITY
// =============================================================================

/**
 * Hook for accessing main Intel Reports functionality
 */
export const useIntelReportsMain = () => {
  const { main } = useIntelReports3DContext();
  return main;
};

/**
 * Hook for accessing context adaptation functionality
 */
export const useIntelReportsContext = () => {
  const { context } = useIntelReports3DContext();
  return context;
};

/**
 * Hook for accessing globe integration functionality
 */
export const useIntelReportsGlobe = () => {
  const { globe } = useIntelReports3DContext();
  return globe;
};

/**
 * Hook for accessing provider-level state
 */
export const useIntelReportsProvider = () => {
  const { isInitialized, providerError, options } = useIntelReports3DContext();
  return { isInitialized, providerError, options };
};
