/**
 * Lazy Loading Utility for HUD Components
 * 
 * Provides React.lazy wrappers for HUD components to improve startup performance
 * by loading components only when they're needed.
 */

import React, { lazy, Suspense } from 'react';

/**
 * Creates a lazy-loaded component with loading state
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createLazyComponent(importFn: () => Promise<any>, name?: string) {
  const LazyComponent = lazy(importFn);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (props: any) => (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40px',
        opacity: 0.7,
        fontSize: '12px',
        color: '#64b5f6'
      }}>
        {name ? `Loading ${name}...` : 'Loading...'}
      </div>
    }>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Pre-defined lazy HUD components for improved startup performance
 */
export const LazyHUDComponents = {
  TopBar: createLazyComponent(
    () => import('../components/HUD/Bars/TopBar/TopBar'),
    'TopBar'
  ),
  BottomBar: createLazyComponent(
    () => import('../components/HUD/Bars/BottomBar/BottomBar'),
    'BottomBar'
  ),
  LeftSideBar: createLazyComponent(
    () => import('../components/HUD/Bars/LeftSideBar/LeftSideBar'),
    'LeftSideBar'
  ),
  RightSideBar: createLazyComponent(
    () => import('../components/HUD/Bars/RightSideBar/RightSideBar'),
    'RightSideBar'
  ),
  TopLeftCorner: createLazyComponent(
    () => import('../components/HUD/Corners/TopLeft/TopLeft'),
    'TopLeft Corner'
  ),
  TopRightCorner: createLazyComponent(
    () => import('../components/HUD/Corners/TopRight/TopRight'),
    'TopRight Corner'
  ),
  BottomLeftCorner: createLazyComponent(
    () => import('../components/HUD/Corners/BottomLeft/BottomLeft'),
    'BottomLeft Corner'
  ),
  BottomRightCorner: createLazyComponent(
    () => import('../components/HUD/Corners/BottomRight/BottomRight'),
    'BottomRight Corner'
  ),
  FloatingPanelManager: createLazyComponent(
    () => import('../components/HUD/FloatingPanels/FloatingPanelManager'),
    'Floating Panels'
  ),
  FloatingPanelDemo: createLazyComponent(
    () => import('../components/HUD/FloatingPanels/FloatingPanelDemo'),
    'Panel Demo'
  ),
  NOAAFloatingIntegration: createLazyComponent(
    () => import('../components/HUD/FloatingPanels/NOAAFloatingIntegration'),
    'NOAA Integration'
  ),
  CenterViewManager: createLazyComponent(
    () => import('../components/HUD/Center/CenterViewManager'),
    'Center View'
  ),
  QuickAccessPanel: createLazyComponent(
    () => import('../components/HUD/QuickAccess/QuickAccessPanel'),
    'Quick Access'
  ),
  NewUserHint: createLazyComponent(
    () => import('../components/HUD/NewUserHint/NewUserHint'),
    'User Hints'
  ),
};

/**
 * Utility to preload critical HUD components
 * Call this when the user shows intent to interact with the HUD
 */
export const preloadCriticalHUDComponents = async (): Promise<void> => {
  const criticalComponents = [
    () => import('../components/HUD/Bars/TopBar/TopBar'),
    () => import('../components/HUD/Bars/BottomBar/BottomBar'),
    () => import('../components/HUD/Center/CenterViewManager'),
  ];

  try {
    await Promise.all(criticalComponents.map(importFn => importFn()));
  } catch (error) {
    console.warn('Failed to preload some HUD components:', error);
  }
};

/**
 * Intelligent preloading based on user interaction patterns
 */
export class IntelligentPreloader {
  private static readonly STORAGE_KEY = 'starcom_hud_usage_patterns';
  private static readonly MAX_PATTERN_ENTRIES = 100;
  private static usagePatterns: Map<string, number> = new Map();
  private static interactionHistory: string[] = [];

  /**
   * Track component usage for pattern analysis
   */
  static trackComponentUsage(componentName: string): void {
    const currentCount = this.usagePatterns.get(componentName) || 0;
    this.usagePatterns.set(componentName, currentCount + 1);
    
    // Add to interaction history
    this.interactionHistory.push(componentName);
    
    // Keep only recent interactions
    if (this.interactionHistory.length > this.MAX_PATTERN_ENTRIES) {
      this.interactionHistory = this.interactionHistory.slice(-this.MAX_PATTERN_ENTRIES);
    }

    // Persist patterns to localStorage
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        patterns: Array.from(this.usagePatterns.entries()),
        history: this.interactionHistory
      }));
    } catch (error) {
      console.warn('Failed to save usage patterns:', error);
    }
  }

  /**
   * Load usage patterns from localStorage
   */
  static loadUsagePatterns(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.usagePatterns = new Map(data.patterns || []);
        this.interactionHistory = data.history || [];
      }
    } catch (error) {
      console.warn('Failed to load usage patterns:', error);
    }
  }

  /**
   * Get components that should be preloaded based on usage patterns
   */
  static getPreloadCandidates(): string[] {
    // Sort components by usage frequency
    const sortedPatterns = Array.from(this.usagePatterns.entries())
      .sort(([, a], [, b]) => b - a);

    // Return top 5 most used components
    return sortedPatterns.slice(0, 5).map(([name]) => name);
  }

  /**
   * Predict next likely components based on current interaction
   */
  static predictNextComponents(currentComponent: string): string[] {
    const predictions: Map<string, number> = new Map();
    
    // Look for patterns in interaction history
    for (let i = 0; i < this.interactionHistory.length - 1; i++) {
      if (this.interactionHistory[i] === currentComponent) {
        const nextComponent = this.interactionHistory[i + 1];
        const currentCount = predictions.get(nextComponent) || 0;
        predictions.set(nextComponent, currentCount + 1);
      }
    }

    // Return top 3 predictions
    return Array.from(predictions.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);
  }
}

/**
 * HUD component usage analytics for optimization insights
 */
export class HUDAnalytics {
  private static readonly ANALYTICS_KEY = 'starcom_hud_analytics';
  private static analytics = {
    loadTimes: new Map<string, number[]>(),
    errorRates: new Map<string, number>(),
    lastUpdated: Date.now()
  };

  /**
   * Record component load time
   */
  static recordLoadTime(componentName: string, loadTime: number): void {
    const times = this.analytics.loadTimes.get(componentName) || [];
    times.push(loadTime);
    
    // Keep only last 10 load times per component
    if (times.length > 10) {
      times.shift();
    }
    
    this.analytics.loadTimes.set(componentName, times);
    this.saveAnalytics();
  }

  /**
   * Record component load error
   */
  static recordLoadError(componentName: string): void {
    const currentErrors = this.analytics.errorRates.get(componentName) || 0;
    this.analytics.errorRates.set(componentName, currentErrors + 1);
    this.saveAnalytics();
  }

  /**
   * Get performance insights for optimization
   */
  static getPerformanceInsights(): {
    slowestComponents: Array<{ name: string; avgLoadTime: number }>;
    errorProneComponents: Array<{ name: string; errorCount: number }>;
    recommendations: string[];
  } {
    const slowestComponents = Array.from(this.analytics.loadTimes.entries())
      .map(([name, times]) => ({
        name,
        avgLoadTime: times.reduce((a, b) => a + b, 0) / times.length
      }))
      .sort((a, b) => b.avgLoadTime - a.avgLoadTime)
      .slice(0, 5);

    const errorProneComponents = Array.from(this.analytics.errorRates.entries())
      .map(([name, count]) => ({ name, errorCount: count }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 3);

    const recommendations: string[] = [];
    
    if (slowestComponents.length > 0 && slowestComponents[0].avgLoadTime > 1000) {
      recommendations.push(`Consider optimizing ${slowestComponents[0].name} - avg load time: ${slowestComponents[0].avgLoadTime.toFixed(0)}ms`);
    }
    
    if (errorProneComponents.length > 0 && errorProneComponents[0].errorCount > 5) {
      recommendations.push(`Investigate loading issues with ${errorProneComponents[0].name} - ${errorProneComponents[0].errorCount} errors`);
    }

    return { slowestComponents, errorProneComponents, recommendations };
  }

  /**
   * Save analytics to localStorage
   */
  private static saveAnalytics(): void {
    try {
      this.analytics.lastUpdated = Date.now();
      localStorage.setItem(this.ANALYTICS_KEY, JSON.stringify({
        loadTimes: Array.from(this.analytics.loadTimes.entries()),
        errorRates: Array.from(this.analytics.errorRates.entries()),
        lastUpdated: this.analytics.lastUpdated
      }));
    } catch (error) {
      console.warn('Failed to save HUD analytics:', error);
    }
  }

  /**
   * Load analytics from localStorage
   */
  static loadAnalytics(): void {
    try {
      const stored = localStorage.getItem(this.ANALYTICS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.analytics.loadTimes = new Map(data.loadTimes || []);
        this.analytics.errorRates = new Map(data.errorRates || []);
        this.analytics.lastUpdated = data.lastUpdated || Date.now();
      }
    } catch (error) {
      console.warn('Failed to load HUD analytics:', error);
    }
  }
}

// Initialize analytics and preloader on module load
IntelligentPreloader.loadUsagePatterns();
HUDAnalytics.loadAnalytics();

// TODO: Implement intelligent preloading based on user interaction patterns - PRIORITY: LOW
// ✅ COMPLETED: IntelligentPreloader class implemented with pattern tracking
// TODO: Add HUD component usage analytics for optimization insights - PRIORITY: LOW
// ✅ COMPLETED: HUDAnalytics class implemented with performance insights
