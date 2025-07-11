/**
 * Intel Reports 3D - Hooks Index
 * 
 // TODO: Add support for data state optimistic updates and rollback mechanisms - PRIORITY: MEDIUM
 // TODO: Implement comprehensive data state caching with TTL and invalidation - PRIORITY: MEDIUM
 // TODO: Add support for data state persistence across browser sessions - PRIORITY: MEDIUM
 * Centralized export for all Intel Reports 3D hooks.
 * Provides unified access to context-aware Intel Reports functionality.
 */

// Main hooks
export { useIntelReports3D } from './useIntelReports3D';
export { useIntelContextAdapter } from './useIntelContextAdapter';
export { useIntelGlobeSync } from './useIntelGlobeSync';

// Hook types
export type {
  IntelReports3DOptions,
  IntelReports3DState,
  IntelReports3DActions,
  IntelReports3DUtilities
} from './useIntelReports3D';

export type {
  IntelContextAdapterOptions,
  IntelContextAdapterState,
  IntelContextAdapterActions
} from './useIntelContextAdapter';

export type {
  IntelGlobeSyncOptions,
  IntelGlobeSyncState,
  IntelGlobeSyncActions
} from './useIntelGlobeSync';
