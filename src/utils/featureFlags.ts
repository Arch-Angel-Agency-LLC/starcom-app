// Feature Flag Management System for Enhanced HUD
// Enables gradual rollout and safe testing of new features

export interface FeatureFlags {
  // Core System Enhancements
  enhancedContextEnabled: boolean;
  enhancedCenter: boolean;
  multiContextEnabled: boolean;
  splitScreenEnabled: boolean;
  contextSnapshotsEnabled: boolean;
  
  // AI Integration Features
  aiSuggestionsEnabled: boolean;
  threatHorizonEnabled: boolean;
  proactiveAlertsEnabled: boolean;
  aiAnalyticsEnabled: boolean;
  
  // Collaboration Features
  collaborationEnabled: boolean;
  marketplaceEnabled: boolean;
  multiAgencyEnabled: boolean;
  realTimeCollabEnabled: boolean;
  
  // Security Features
  pqcEncryptionEnabled: boolean;
  web3AuthEnabled: boolean;
  securityIndicatorsEnabled: boolean;
  blockchainIntegrationEnabled: boolean;
  
  // Developer Tools
  walletDiagnosticsEnabled: boolean;
  
  // User Experience Features
  adaptiveInterfaceEnabled: boolean;
  rtsEnhancementsEnabled: boolean;
  gamingUxEnabled: boolean;
  advancedVisualizationsEnabled: boolean;
  autoShowSolarFlarePopupsEnabled: boolean;
  
  // Performance Features
  performanceOptimizationsEnabled: boolean;
  performanceMonitoringEnabled: boolean;
  performanceOptimizerEnabled: boolean;
  lazyLoadingEnabled: boolean;
  cacheOptimizationsEnabled: boolean;
  
  // Security Monitoring Features
  securityHardeningEnabled: boolean;
  securityDashboardEnabled: boolean;
  vulnerabilityScanningEnabled: boolean;
  
  // Development & Testing Features
  uiTestingDiagnosticsEnabled: boolean;
  
  // Logging Control Features
  verboseLoggingEnabled: boolean;
  assetDebugLoggingEnabled: boolean;
  deploymentDebugLoggingEnabled: boolean;
  securityVerboseLoggingEnabled: boolean;
  serviceInitLoggingEnabled: boolean;
  performanceLoggingEnabled: boolean;
  assetRetryLoggingEnabled: boolean;
  networkDebugLoggingEnabled: boolean;
  pointerEventsDebugEnabled: boolean;
  consoleErrorMonitoringEnabled: boolean;
  
  // Auth & Wallet Debugging
  authDebugLoggingEnabled: boolean;
  walletStateLoggingEnabled: boolean;
  siwsDebugLoggingEnabled: boolean;
  authTimelineLoggingEnabled: boolean;
  
  // 3D Asset Debugging
  threeDAssetLoggingEnabled: boolean;
  intelReportLoggingEnabled: boolean;
  
  // Component Loading Debugging
  componentLoadLoggingEnabled: boolean;
}

// Default feature flag configuration
const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // Core System - Start with basic enhancements
  enhancedContextEnabled: true,
  enhancedCenter: true, // Enable the new center view manager
  multiContextEnabled: false, // Enable after enhanced context is stable
  splitScreenEnabled: false,
  contextSnapshotsEnabled: false,
  
  // AI Integration - Enabled for Phase 2 testing
  aiSuggestionsEnabled: true,
  threatHorizonEnabled: true,
  proactiveAlertsEnabled: false,
  aiAnalyticsEnabled: false,
  
  // Collaboration - Later phase
  collaborationEnabled: false,
  marketplaceEnabled: false,
  multiAgencyEnabled: false,
  realTimeCollabEnabled: false,
  
  // Security - Enable when infrastructure ready
  pqcEncryptionEnabled: false,
  web3AuthEnabled: false,
  securityIndicatorsEnabled: false,
  blockchainIntegrationEnabled: false,
  
  // Developer Tools - Off by default, toggle in dev tools
  walletDiagnosticsEnabled: false,
  
  // UX - Enable with core features
  adaptiveInterfaceEnabled: true, // Phase 4: Enable adaptive interface
  rtsEnhancementsEnabled: true, // Safe to enable immediately
  gamingUxEnabled: true,
  advancedVisualizationsEnabled: false,
  autoShowSolarFlarePopupsEnabled: false, // Off by default - user must enable
  
  // Performance - Enable when needed for diagnostics
  performanceOptimizationsEnabled: true,
  performanceMonitoringEnabled: false, // Off by default - use diagnostics mode
  performanceOptimizerEnabled: false, // Off by default - use diagnostics mode
  lazyLoadingEnabled: true,
  cacheOptimizationsEnabled: true,
  
  // Security - Enable when needed for diagnostics
  securityHardeningEnabled: false, // Off by default - use diagnostics mode
  securityDashboardEnabled: false, // Off by default - use diagnostics mode
  vulnerabilityScanningEnabled: false, // Off by default - use diagnostics mode
  
  // Development & Testing - Off by default for clean production experience
  uiTestingDiagnosticsEnabled: false, // Enable AI agent testing UI and diagnostics
  
  // Logging Control - Environment-aware defaults
  verboseLoggingEnabled: !import.meta.env.PROD,
  assetDebugLoggingEnabled: import.meta.env.DEV,
  deploymentDebugLoggingEnabled: import.meta.env.DEV,
  securityVerboseLoggingEnabled: import.meta.env.DEV,
  serviceInitLoggingEnabled: import.meta.env.DEV,
  performanceLoggingEnabled: import.meta.env.DEV,
  assetRetryLoggingEnabled: import.meta.env.DEV,
  networkDebugLoggingEnabled: import.meta.env.DEV,
  pointerEventsDebugEnabled: import.meta.env.DEV,
  consoleErrorMonitoringEnabled: import.meta.env.DEV,
  
  // Auth & Wallet Debugging - Reduced noise by default
  authDebugLoggingEnabled: false, // Off by default - enable when debugging auth issues
  walletStateLoggingEnabled: false, // Off by default - enable when debugging wallet issues  
  siwsDebugLoggingEnabled: false, // Off by default - enable when debugging SIWS
  authTimelineLoggingEnabled: false, // Off by default - enable for detailed auth flow analysis
  
  // 3D Asset Debugging - Off by default in production to reduce noise
  threeDAssetLoggingEnabled: false, // Explicitly disabled by default
  intelReportLoggingEnabled: false, // Explicitly disabled by default
  
  // Component Loading Debugging - Off by default in production
  componentLoadLoggingEnabled: import.meta.env.DEV,
};

// Feature flag storage key
const FEATURE_FLAGS_STORAGE_KEY = 'starcom-feature-flags';

// Feature flag management class
class FeatureFlagManager {
  private flags: FeatureFlags;
  private listeners: Set<(flags: FeatureFlags) => void> = new Set();

  constructor() {
    this.flags = this.loadFlags();
  }

  private loadFlags(): FeatureFlags {
    try {
      const stored = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
      if (stored) {
        const parsedFlags = JSON.parse(stored);
        return { ...DEFAULT_FEATURE_FLAGS, ...parsedFlags };
      }
    } catch (error) {
      console.warn('Failed to load feature flags from storage:', error);
    }
    return { ...DEFAULT_FEATURE_FLAGS };
  }

  private saveFlags(): void {
    try {
      localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(this.flags));
    } catch (error) {
      console.warn('Failed to save feature flags to storage:', error);
    }
  }

  getFlag(flagName: keyof FeatureFlags): boolean {
    return this.flags[flagName];
  }

  setFlag(flagName: keyof FeatureFlags, value: boolean): void {
    this.flags[flagName] = value;
    this.saveFlags();
    this.notifyListeners();
  }

  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  updateFlags(updates: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...updates };
    this.saveFlags();
    this.notifyListeners();
  }

  resetToDefaults(): void {
    this.flags = { ...DEFAULT_FEATURE_FLAGS };
    this.saveFlags();
    this.notifyListeners();
  }

  subscribe(listener: (flags: FeatureFlags) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.flags));
  }

  // Convenience methods for common flag groups
  enableCoreEnhancements(): void {
    this.updateFlags({
      enhancedContextEnabled: true,
      multiContextEnabled: true,
      contextSnapshotsEnabled: true,
    });
  }

  enableAIFeatures(): void {
    this.updateFlags({
      aiSuggestionsEnabled: true,
      threatHorizonEnabled: true,
      proactiveAlertsEnabled: true,
      aiAnalyticsEnabled: true,
    });
  }

  enableCollaboration(): void {
    this.updateFlags({
      collaborationEnabled: true,
      realTimeCollabEnabled: true,
    });
  }

  enableSecurity(): void {
    this.updateFlags({
      pqcEncryptionEnabled: true,
      web3AuthEnabled: true,
      securityIndicatorsEnabled: true,
    });
  }

  // Development helper methods
  enableAllFeatures(): void {
    const allEnabled = Object.keys(this.flags).reduce((acc, key) => {
      acc[key as keyof FeatureFlags] = true;
      return acc;
    }, {} as FeatureFlags);
    this.updateFlags(allEnabled);
  }

  disableAllFeatures(): void {
    const allDisabled = Object.keys(this.flags).reduce((acc, key) => {
      acc[key as keyof FeatureFlags] = false;
      return acc;
    }, {} as FeatureFlags);
    this.updateFlags(allDisabled);
  }
}

// Global feature flag manager instance
export const featureFlagManager = new FeatureFlagManager();

// React hook for using feature flags
import { useState, useEffect } from 'react';

export const useFeatureFlags = (): FeatureFlags & {
  updateFlag: (flagName: keyof FeatureFlags, value: boolean) => void;
  updateFlags: (updates: Partial<FeatureFlags>) => void;
} => {
  const [flags, setFlags] = useState<FeatureFlags>(featureFlagManager.getAllFlags());

  useEffect(() => {
    const unsubscribe = featureFlagManager.subscribe(setFlags);
    return unsubscribe;
  }, []);

  const updateFlag = (flagName: keyof FeatureFlags, value: boolean) => {
    featureFlagManager.setFlag(flagName, value);
  };

  const updateFlags = (updates: Partial<FeatureFlags>) => {
    featureFlagManager.updateFlags(updates);
  };

  return {
    ...flags,
    updateFlag,
    updateFlags,
  };
};

// Hook for individual feature flag
export const useFeatureFlag = (flagName: keyof FeatureFlags): boolean => {
  const [flagValue, setFlagValue] = useState<boolean>(featureFlagManager.getFlag(flagName));

  useEffect(() => {
    const unsubscribe = featureFlagManager.subscribe((flags) => {
      setFlagValue(flags[flagName]);
    });
    return unsubscribe;
  }, [flagName]);

  return flagValue;
};

// Logging helper functions that respect feature flags
export const conditionalLog = {
  verbose: (message: string, ...args: unknown[]) => {
    if (featureFlagManager.getFlag('verboseLoggingEnabled')) {
      console.log(message, ...args);
    }
  },
  
  assetDebug: (message: string, ...args: unknown[]) => {
    if (featureFlagManager.getFlag('assetDebugLoggingEnabled')) {
      console.log(message, ...args);
    }
  },
  
  deploymentDebug: (message: string, ...args: unknown[]) => {
    if (featureFlagManager.getFlag('deploymentDebugLoggingEnabled')) {
      console.log(message, ...args);
    }
  },
  
  securityVerbose: (message: string, ...args: unknown[]) => {
    if (featureFlagManager.getFlag('securityVerboseLoggingEnabled')) {
      console.log(message, ...args);
    }
  },
  
  serviceInit: (message: string, ...args: unknown[]) => {
    if (featureFlagManager.getFlag('serviceInitLoggingEnabled')) {
      console.log(message, ...args);
    }
  },
  
  performance: (message: string, ...args: unknown[]) => {
    if (featureFlagManager.getFlag('performanceLoggingEnabled')) {
      console.log(message, ...args);
    }
  },
  
  assetRetry: (message: string, ...args: unknown[]) => {
    if (featureFlagManager.getFlag('assetRetryLoggingEnabled')) {
      console.log(message, ...args);
    }
  },
  
  networkDebug: (message: string, ...args: unknown[]) => {
    if (featureFlagManager.getFlag('networkDebugLoggingEnabled')) {
      console.log(message, ...args);
    }
  },
  
  pointerEvents: (message: string, ...args: unknown[]) => {
    if (featureFlagManager.getFlag('pointerEventsDebugEnabled')) {
      console.log(message, ...args);
    }
  },
  
  errorMonitoring: (message: string, ...args: unknown[]) => {
    if (featureFlagManager.getFlag('consoleErrorMonitoringEnabled')) {
      console.log(message, ...args);
    }
  },
};

// Helper to check if any logging is enabled
export const isAnyLoggingEnabled = (): boolean => {
  const flags = featureFlagManager.getAllFlags();
  return flags.verboseLoggingEnabled ||
         flags.assetDebugLoggingEnabled ||
         flags.deploymentDebugLoggingEnabled ||
         flags.securityVerboseLoggingEnabled ||
         flags.serviceInitLoggingEnabled ||
         flags.performanceLoggingEnabled ||
         flags.assetRetryLoggingEnabled ||
         flags.networkDebugLoggingEnabled ||
         flags.pointerEventsDebugEnabled ||
         flags.consoleErrorMonitoringEnabled;
};

// Environment-aware logging announcement (only in development)
if (import.meta.env.DEV) {
  console.log('🏁 Starcom logging feature flags initialized');
  console.log('📝 Logging disabled by default in production builds');
  console.log('🛠️ Use window.__STARCOM_FEATURES to control flags');
}

export default featureFlagManager;
