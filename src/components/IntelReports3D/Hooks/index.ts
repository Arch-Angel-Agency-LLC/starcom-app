/**
 * Intel Reports 3D - Component Hooks Re-Export
 * 
 * Re-exports the enterprise-grade Phase 3 hooks for component consumption.
 * This provides a clean import interface for Intel Reports 3D components.
 */

// Import all Phase 3 hooks and types
import {
  useIntelReports3D,
  useIntelContextAdapter,
  useIntelGlobeSync,
  type IntelReports3DOptions,
  type IntelReports3DState,
  type IntelReports3DActions,
  type IntelReports3DUtilities,
  type IntelContextAdapterOptions,
  type IntelContextAdapterState,
  type IntelContextAdapterActions,
  type IntelGlobeSyncOptions,
  type IntelGlobeSyncState,
  type IntelGlobeSyncActions
} from '../../../hooks/intelligence';

// Re-export for component use
export {
  useIntelReports3D,
  useIntelContextAdapter,
  useIntelGlobeSync,
  type IntelReports3DOptions,
  type IntelReports3DState,
  type IntelReports3DActions,
  type IntelReports3DUtilities,
  type IntelContextAdapterOptions,
  type IntelContextAdapterState,
  type IntelContextAdapterActions,
  type IntelGlobeSyncOptions,
  type IntelGlobeSyncState,
  type IntelGlobeSyncActions
};

// Convenience type combinations for component usage
export type IntelReports3DHooks = {
  main: ReturnType<typeof useIntelReports3D>;
  context: ReturnType<typeof useIntelContextAdapter>;
  globe: ReturnType<typeof useIntelGlobeSync>;
};

/**
 * Custom hook that combines all Intel Reports 3D hooks for convenience
 * Useful for components that need access to all Intel functionality
 */
export const useIntelReports3DComplete = (options?: {
  mainOptions?: IntelReports3DOptions;
  contextOptions?: IntelContextAdapterOptions;
  globeOptions?: IntelGlobeSyncOptions;
}): IntelReports3DHooks => {
  const main = useIntelReports3D(options?.mainOptions);
  const context = useIntelContextAdapter(options?.contextOptions);
  const globe = useIntelGlobeSync(options?.globeOptions);

  return {
    main,
    context,
    globe
  };
};
