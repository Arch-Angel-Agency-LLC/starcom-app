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

export default featureFlagManager;
