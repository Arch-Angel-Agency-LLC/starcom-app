/**
 * Intel Reports 3D - Context Integration Service
 * 
 * Manages HUD integration and context-aware behavior for Intel Reports 3D.
 * Handles operation mode transitions, layer management, and synchronization
 * with the broader Starcom HUD architecture.
 */

import { 
  IntelReport3DContextState,
  OperationMode,
  CenterMode,
  IntelDisplayContext
} from '../../types/intelligence/IntelContextTypes';

// =============================================================================
// SERVICE CONFIGURATION & TYPES
// =============================================================================

/**
 * Context service configuration options
 */
export interface IntelContextServiceOptions {
  enableAutoSync?: boolean;
  operationModeTransitionDelay?: number;
  layerActivationDelay?: number;
  optimizationInterval?: number;
  debugMode?: boolean;
}

/**
 * Default context service configuration
 */
const DEFAULT_OPTIONS: Required<IntelContextServiceOptions> = {
  enableAutoSync: true,
  operationModeTransitionDelay: 200,
  layerActivationDelay: 100,
  optimizationInterval: 30000, // 30 seconds
  debugMode: false
};

/**
 * HUD State interface (simplified for Intel integration)
 */
export interface HUDState {
  currentOperationMode: OperationMode;
  currentCenterMode: CenterMode;
  activeLayers: string[];
  selectedObject: string | null;
  uiState: {
    leftSideExpanded: boolean;
    rightSideExpanded: boolean;
    bottomBarVisible: boolean;
    topBarVisible: boolean;
  };
  performance: {
    frameRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

/**
 * Context metrics for monitoring and optimization
 */
export interface IntelContextMetrics {
  currentOperationMode: OperationMode;
  currentCenterMode: CenterMode;
  activeLayerCount: number;
  syncOperationsCount: number;
  averageTransitionTime: number;
  lastOptimizationTime: Date;
  performanceScore: number;
  errorCount: number;
}

/**
 * Context service events
 */
export interface IntelContextServiceEvents {
  contextChanged: IntelReport3DContextState;
  operationModeChanged: { from: OperationMode; to: OperationMode };
  centerModeChanged: { from: CenterMode; to: CenterMode };
  layerActivated: string;
  layerDeactivated: string;
  hudSyncCompleted: HUDState;
  optimizationCompleted: IntelContextMetrics;
  error: Error;
}

// =============================================================================
// CONTEXT INTEGRATION SERVICE IMPLEMENTATION
// =============================================================================

/**
 * Intel Context Service
 * 
 * Manages HUD integration and context-aware behavior with performance
 * optimization and seamless operation mode transitions.
 */
export class IntelContextService {
  private readonly options: Required<IntelContextServiceOptions>;
  private contextState: IntelReport3DContextState;
  private previousContextState: IntelReport3DContextState | null = null;
  private hudState: HUDState | null = null;
  private metrics: IntelContextMetrics;
  private eventListeners: Map<keyof IntelContextServiceEvents, Set<(data: unknown) => void>> = new Map();
  private optimizationTimer: NodeJS.Timeout | null = null;
  private transitionPromises: Map<string, Promise<void>> = new Map();

  constructor(initialContext?: IntelReport3DContextState, options: IntelContextServiceOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.contextState = initialContext || this.createDefaultContext();
    this.metrics = this.initializeMetrics();
    
    // Set up optimization timer
    this.setupOptimizationTimer();
    
    if (this.options.debugMode) {
      console.debug('IntelContextService initialized', {
        context: this.contextState,
        options: this.options
      });
    }
  }

  // =============================================================================
  // HUD INTEGRATION
  // =============================================================================

  /**
   * Synchronize with HUD state changes
   */
  syncWithHUD(hudState: HUDState): void {
    try {
      this.hudState = { ...hudState };
      
      // Update context state based on HUD changes
      const contextUpdates: Partial<IntelReport3DContextState> = {};
      let hasChanges = false;
      
      // Sync operation mode
      if (this.contextState.hudContext.operationMode !== hudState.currentOperationMode) {
        contextUpdates.hudContext = {
          ...this.contextState.hudContext,
          operationMode: hudState.currentOperationMode
        };
        hasChanges = true;
      }
      
      // Sync center mode
      if (this.contextState.hudContext.centerMode !== hudState.currentCenterMode) {
        contextUpdates.hudContext = {
          ...contextUpdates.hudContext,
          ...this.contextState.hudContext,
          centerMode: hudState.currentCenterMode
        };
        hasChanges = true;
      }
      
      // Sync active layers
      if (!this.arraysEqual(this.contextState.hudContext.activeLayers, hudState.activeLayers)) {
        contextUpdates.hudContext = {
          ...contextUpdates.hudContext,
          ...this.contextState.hudContext,
          activeLayers: [...hudState.activeLayers]
        };
        hasChanges = true;
      }
      
      // Sync selected object
      if (this.contextState.hudContext.selectedObject !== hudState.selectedObject) {
        contextUpdates.hudContext = {
          ...contextUpdates.hudContext,
          ...this.contextState.hudContext,
          selectedObject: hudState.selectedObject
        };
        hasChanges = true;
      }
      
      // Apply updates if there are changes
      if (hasChanges) {
        this.updateContextInternal(contextUpdates);
      }
      
      // Update metrics
      this.metrics.syncOperationsCount++;
      
      // Emit sync completion event
      this.emit('hudSyncCompleted', hudState);
      
      if (this.options.debugMode) {
        console.debug('HUD sync completed', {
          hasChanges,
          operationMode: hudState.currentOperationMode,
          centerMode: hudState.currentCenterMode,
          activeLayers: hudState.activeLayers
        });
      }
      
    } catch (error) {
      this.handleError('syncWithHUD', error as Error);
    }
  }

  /**
   * Set operation mode with smooth transition
   */
  async setOperationMode(mode: OperationMode): Promise<void> {
    if (this.contextState.hudContext.operationMode === mode) {
      return; // No change needed
    }
    
    const transitionKey = `operation-mode-${mode}`;
    
    // Check if transition is already in progress
    if (this.transitionPromises.has(transitionKey)) {
      return this.transitionPromises.get(transitionKey);
    }
    
    const transitionPromise = this.performOperationModeTransition(mode);
    this.transitionPromises.set(transitionKey, transitionPromise);
    
    try {
      await transitionPromise;
    } finally {
      this.transitionPromises.delete(transitionKey);
    }
  }

  /**
   * Set center mode with context optimization
   */
  async setCenterMode(mode: CenterMode): Promise<void> {
    if (this.contextState.hudContext.centerMode === mode) {
      return; // No change needed
    }
    
    const transitionKey = `center-mode-${mode}`;
    
    // Check if transition is already in progress
    if (this.transitionPromises.has(transitionKey)) {
      return this.transitionPromises.get(transitionKey);
    }
    
    const transitionPromise = this.performCenterModeTransition(mode);
    this.transitionPromises.set(transitionKey, transitionPromise);
    
    try {
      await transitionPromise;
    } finally {
      this.transitionPromises.delete(transitionKey);
    }
  }

  // =============================================================================
  // LAYER MANAGEMENT
  // =============================================================================

  /**
   * Activate a data layer
   */
  async activateLayer(layerId: string): Promise<void> {
    try {
      const { activeLayers } = this.contextState.hudContext;
      
      if (activeLayers.includes(layerId)) {
        return; // Already active
      }
      
      // Add layer with delay for smooth activation
      await this.delay(this.options.layerActivationDelay);
      
      const updatedLayers = [...activeLayers, layerId];
      
      this.updateContextInternal({
        hudContext: {
          ...this.contextState.hudContext,
          activeLayers: updatedLayers
        }
      });
      
      // Update metrics
      this.metrics.activeLayerCount = updatedLayers.length;
      
      // Emit layer activation event
      this.emit('layerActivated', layerId);
      
      if (this.options.debugMode) {
        console.debug('Layer activated', { layerId, totalLayers: updatedLayers.length });
      }
      
    } catch (error) {
      this.handleError('activateLayer', error as Error);
      throw error;
    }
  }

  /**
   * Deactivate a data layer
   */
  async deactivateLayer(layerId: string): Promise<void> {
    try {
      const { activeLayers } = this.contextState.hudContext;
      
      if (!activeLayers.includes(layerId)) {
        return; // Not active
      }
      
      // Remove layer with delay for smooth deactivation
      await this.delay(this.options.layerActivationDelay);
      
      const updatedLayers = activeLayers.filter(id => id !== layerId);
      
      this.updateContextInternal({
        hudContext: {
          ...this.contextState.hudContext,
          activeLayers: updatedLayers
        }
      });
      
      // Update metrics
      this.metrics.activeLayerCount = updatedLayers.length;
      
      // Emit layer deactivation event
      this.emit('layerDeactivated', layerId);
      
      if (this.options.debugMode) {
        console.debug('Layer deactivated', { layerId, totalLayers: updatedLayers.length });
      }
      
    } catch (error) {
      this.handleError('deactivateLayer', error as Error);
      throw error;
    }
  }

  /**
   * Get list of active layers
   */
  getActiveLayers(): string[] {
    return [...this.contextState.hudContext.activeLayers];
  }

  // =============================================================================
  // CONTEXT STATE MANAGEMENT
  // =============================================================================

  /**
   * Get current context state
   */
  getContext(): IntelReport3DContextState {
    return JSON.parse(JSON.stringify(this.contextState)); // Deep copy
  }

  /**
   * Update context state
   */
  updateContext(updates: Partial<IntelReport3DContextState>): void {
    this.updateContextInternal(updates);
  }

  // =============================================================================
  // EVENT HANDLING
  // =============================================================================

  /**
   * Listen for context changes
   */
  onContextChange(callback: (context: IntelReport3DContextState) => void): () => void {
    return this.on('contextChanged', callback);
  }

  /**
   * Listen for operation mode changes
   */
  onOperationModeChange(callback: (change: { from: OperationMode; to: OperationMode }) => void): () => void {
    return this.on('operationModeChanged', callback);
  }

  /**
   * Add event listener
   */
  on<K extends keyof IntelContextServiceEvents>(
    event: K, 
    listener: (data: IntelContextServiceEvents[K]) => void
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(listener as (data: unknown) => void);
    
    return () => {
      this.eventListeners.get(event)?.delete(listener as (data: unknown) => void);
    };
  }

  // =============================================================================
  // OPTIMIZATION
  // =============================================================================

  /**
   * Optimize context for current conditions
   */
  optimizeForContext(): void {
    try {
      const startTime = performance.now();
      
      // Optimization based on current operation mode
      const optimizations = this.calculateOptimizations();
      
      if (optimizations.length > 0) {
        // Apply display context optimizations
        const displayContext: IntelDisplayContext = {
          ...this.contextState.displayContext,
          ...this.mergeOptimizations(optimizations)
        };
        
        this.updateContextInternal({
          displayContext
        });
      }
      
      // Update metrics
      const optimizationTime = performance.now() - startTime;
      this.updateOptimizationMetrics(optimizationTime);
      
      if (this.options.debugMode) {
        console.debug('Context optimization completed', {
          optimizations: optimizations.length,
          time: optimizationTime
        });
      }
      
    } catch (error) {
      this.handleError('optimizeForContext', error as Error);
    }
  }

  /**
   * Get context metrics
   */
  getContextMetrics(): IntelContextMetrics {
    return { ...this.metrics };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private createDefaultContext(): IntelReport3DContextState {
    return {
      hudContext: {
        operationMode: 'PLANETARY',
        centerMode: '3D_GLOBE',
        activeLayers: ['intel-reports'],
        selectedObject: null
      },
      displayContext: {
        priority: 'primary',
        visibility: 'full',
        adaptiveRendering: true
      },
      integrationState: {
        leftSideControls: true,
        rightSideTools: false,
        bottomBarDetails: true,
        topBarStatus: true
      }
    };
  }

  private initializeMetrics(): IntelContextMetrics {
    return {
      currentOperationMode: this.contextState.hudContext.operationMode,
      currentCenterMode: this.contextState.hudContext.centerMode,
      activeLayerCount: this.contextState.hudContext.activeLayers.length,
      syncOperationsCount: 0,
      averageTransitionTime: 0,
      lastOptimizationTime: new Date(),
      performanceScore: 100,
      errorCount: 0
    };
  }

  private updateContextInternal(updates: Partial<IntelReport3DContextState>): void {
    this.previousContextState = JSON.parse(JSON.stringify(this.contextState));
    
    // Apply updates
    this.contextState = {
      ...this.contextState,
      ...updates,
      hudContext: {
        ...this.contextState.hudContext,
        ...updates.hudContext
      },
      displayContext: {
        ...this.contextState.displayContext,
        ...updates.displayContext
      },
      integrationState: {
        ...this.contextState.integrationState,
        ...updates.integrationState
      }
    };
    
    // Update metrics
    this.updateMetricsFromContext();
    
    // Emit context change event
    this.emit('contextChanged', this.contextState);
  }

  private async performOperationModeTransition(mode: OperationMode): Promise<void> {
    const startTime = performance.now();
    const fromMode = this.contextState.hudContext.operationMode;
    
    try {
      // Pre-transition delay
      await this.delay(this.options.operationModeTransitionDelay);
      
      // Get optimized display context for new mode
      const optimizedDisplayContext = this.getDisplayContextForMode(mode);
      
      // Update context state
      this.updateContextInternal({
        hudContext: {
          ...this.contextState.hudContext,
          operationMode: mode
        },
        displayContext: optimizedDisplayContext
      });
      
      // Update metrics
      const transitionTime = performance.now() - startTime;
      this.updateTransitionMetrics(transitionTime);
      
      // Emit mode change event
      this.emit('operationModeChanged', { from: fromMode, to: mode });
      
      if (this.options.debugMode) {
        console.debug('Operation mode transition completed', {
          from: fromMode,
          to: mode,
          time: transitionTime
        });
      }
      
    } catch (error) {
      this.handleError('performOperationModeTransition', error as Error);
      throw error;
    }
  }

  private async performCenterModeTransition(mode: CenterMode): Promise<void> {
    const startTime = performance.now();
    const fromMode = this.contextState.hudContext.centerMode;
    
    try {
      // Pre-transition delay
      await this.delay(this.options.operationModeTransitionDelay);
      
      // Update context state
      this.updateContextInternal({
        hudContext: {
          ...this.contextState.hudContext,
          centerMode: mode
        }
      });
      
      // Update metrics
      const transitionTime = performance.now() - startTime;
      this.updateTransitionMetrics(transitionTime);
      
      // Emit mode change event
      this.emit('centerModeChanged', { from: fromMode, to: mode });
      
      if (this.options.debugMode) {
        console.debug('Center mode transition completed', {
          from: fromMode,
          to: mode,
          time: transitionTime
        });
      }
      
    } catch (error) {
      this.handleError('performCenterModeTransition', error as Error);
      throw error;
    }
  }

  private getDisplayContextForMode(mode: OperationMode): IntelDisplayContext {
    const baseContext = this.contextState.displayContext;
    
    switch (mode) {
      case 'PLANETARY':
        return {
          ...baseContext,
          priority: 'primary',
          visibility: 'full',
          adaptiveRendering: true
        };
      
      case 'SPACE':
        return {
          ...baseContext,
          priority: 'secondary',
          visibility: 'minimal',
          adaptiveRendering: true
        };
      
      case 'CYBER':
        return {
          ...baseContext,
          priority: 'tertiary',
          visibility: 'hidden',
          adaptiveRendering: false
        };
      
      case 'STELLAR':
        return {
          ...baseContext,
          priority: 'tertiary',
          visibility: 'minimal',
          adaptiveRendering: true
        };
      
      default:
        return baseContext;
    }
  }

  private calculateOptimizations(): Array<{ key: string; value: unknown; reason: string }> {
    const optimizations: Array<{ key: string; value: unknown; reason: string }> = [];
    
    // Performance-based optimizations
    if (this.hudState?.performance) {
      const { frameRate, memoryUsage } = this.hudState.performance;
      
      if (frameRate < 30) {
        optimizations.push({
          key: 'adaptiveRendering',
          value: false,
          reason: 'Low frame rate detected'
        });
      }
      
      if (memoryUsage > 80) {
        optimizations.push({
          key: 'visibility',
          value: 'minimal',
          reason: 'High memory usage detected'
        });
      }
    }
    
    // Layer count optimizations
    if (this.contextState.hudContext.activeLayers.length > 5) {
      optimizations.push({
        key: 'priority',
        value: 'secondary',
        reason: 'Too many active layers'
      });
    }
    
    return optimizations;
  }

  private mergeOptimizations(optimizations: Array<{ key: string; value: unknown }>): Partial<IntelDisplayContext> {
    const result: Partial<IntelDisplayContext> = {};
    
    for (const opt of optimizations) {
      if (opt.key in this.contextState.displayContext) {
        (result as Record<string, unknown>)[opt.key] = opt.value;
      }
    }
    
    return result;
  }

  private updateMetricsFromContext(): void {
    this.metrics.currentOperationMode = this.contextState.hudContext.operationMode;
    this.metrics.currentCenterMode = this.contextState.hudContext.centerMode;
    this.metrics.activeLayerCount = this.contextState.hudContext.activeLayers.length;
  }

  private updateTransitionMetrics(transitionTime: number): void {
    if (this.metrics.averageTransitionTime === 0) {
      this.metrics.averageTransitionTime = transitionTime;
    } else {
      this.metrics.averageTransitionTime = (this.metrics.averageTransitionTime * 0.9) + (transitionTime * 0.1);
    }
  }

  private updateOptimizationMetrics(optimizationTime: number): void {
    this.metrics.lastOptimizationTime = new Date();
    
    // Calculate performance score based on various factors
    let score = 100;
    
    if (this.metrics.averageTransitionTime > 500) score -= 20;
    if (this.metrics.errorCount > 0) score -= 10 * this.metrics.errorCount;
    if (optimizationTime > 100) score -= 10;
    
    this.metrics.performanceScore = Math.max(0, score);
    
    this.emit('optimizationCompleted', this.metrics);
  }

  private setupOptimizationTimer(): void {
    if (!this.options.enableAutoSync) return;
    
    this.optimizationTimer = setInterval(() => {
      this.optimizeForContext();
    }, this.options.optimizationInterval);
  }

  private arraysEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, i) => val === b[i]);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private emit<K extends keyof IntelContextServiceEvents>(
    event: K, 
    data: IntelContextServiceEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Event listener error for ${event}:`, error);
        }
      });
    }
  }

  private handleError(operation: string, error: Error): void {
    this.metrics.errorCount++;
    console.error(`IntelContextService.${operation} error:`, error);
    this.emit('error', error);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Clear optimization timer
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = null;
    }
    
    // Clear event listeners
    this.eventListeners.clear();
    
    // Clear transition promises
    this.transitionPromises.clear();
    
    if (this.options.debugMode) {
      console.debug('IntelContextService destroyed');
    }
  }
}
