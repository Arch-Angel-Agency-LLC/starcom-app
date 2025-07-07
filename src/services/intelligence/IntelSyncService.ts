/**
 * Intel Sync Service
 * 
 * Manages cross-layer synchronization for Intel Reports 3D.
 * Handles synchronization with other CYBER data layers, 
 * multi-context scenarios, and real-time data updates.
 */

import { EventEmitter } from 'events';
import type {
  IntelReport3DData,
  IntelPriority,
  IntelClassification
} from '../../types/intelligence/IntelReportTypes';
import type {
  IntelReport3DContextState,
  CyberDataLayer
} from '../../types/intelligence/IntelContextTypes';
import type {
  IntelReport3DMultiContext,
  IntelCustomSyncRule,
  IntelSyncTrigger,
  IntelSyncAction
} from '../../types/intelligence/IntelMultiContextTypes';

// =============================================================================
// INTERFACES AND TYPES
// =============================================================================

export interface IntelSyncConfiguration {
  // Enable/disable different sync types
  entitySync: boolean;
  geospatialSync: boolean;
  temporalSync: boolean;
  threatSync: boolean;
  
  // Sync thresholds and tolerances
  geospatialTolerance: number;    // kilometers
  temporalTolerance: number;      // milliseconds
  threatPropagationThreshold: IntelPriority;
  
  // Performance settings
  maxSyncItems: number;
  syncInterval: number;           // milliseconds
  batchSize: number;
  
  // Cross-layer integration
  enableCyberLayerSync: boolean;
  enableSecurityLayerSync: boolean;
  enableNetworkLayerSync: boolean;
  enableFinancialLayerSync: boolean;
}

export interface IntelSyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastSyncTime: Date;
  averageSyncDuration: number;
  activeSyncConnections: number;
  syncLatency: number;
}

export interface IntelSyncConnection {
  id: string;
  type: 'cyber' | 'security' | 'network' | 'financial' | 'external';
  name: string;
  active: boolean;
  lastSync: Date;
  syncCount: number;
  errorCount: number;
}

export interface IntelCrossLayerData {
  layerId: string;
  layerType: string;
  data: Record<string, unknown>;
  timestamp: Date;
  source: string;
  priority: IntelPriority;
  classification: IntelClassification;
}

// =============================================================================
// INTEL SYNC SERVICE
// =============================================================================

export class IntelSyncService extends EventEmitter {
  private config: IntelSyncConfiguration;
  private metrics: IntelSyncMetrics;
  private connections: Map<string, IntelSyncConnection> = new Map();
  private customRules: Map<string, IntelCustomSyncRule> = new Map();
  private activeContexts: Map<string, IntelReport3DContextState> = new Map();
  private syncQueue: Array<{ data: IntelReport3DData; timestamp: Date }> = [];
  
  // Sync state
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTimes: Map<string, Date> = new Map();
  
  // Cross-layer data cache
  private crossLayerCache: Map<string, IntelCrossLayerData[]> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  
  constructor(config: Partial<IntelSyncConfiguration> = {}) {
    super();
    
    this.config = {
      entitySync: true,
      geospatialSync: true,
      temporalSync: true,
      threatSync: true,
      geospatialTolerance: 5, // 5km
      temporalTolerance: 300000, // 5 minutes
      threatPropagationThreshold: 'medium',
      maxSyncItems: 1000,
      syncInterval: 30000, // 30 seconds
      batchSize: 50,
      enableCyberLayerSync: true,
      enableSecurityLayerSync: true,
      enableNetworkLayerSync: true,
      enableFinancialLayerSync: true,
      ...config
    };
    
    this.metrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastSyncTime: new Date(),
      averageSyncDuration: 0,
      activeSyncConnections: 0,
      syncLatency: 0
    };
    
    this.startSyncLoop();
  }
  
  // =============================================================================
  // CONTEXT MANAGEMENT
  // =============================================================================
  
  /**
   * Register a context for synchronization
   */
  registerContext(contextId: string, context: IntelReport3DContextState): void {
    this.activeContexts.set(contextId, context);
    this.emit('contextRegistered', contextId, context);
  }
  
  /**
   * Unregister a context
   */
  unregisterContext(contextId: string): void {
    this.activeContexts.delete(contextId);
    this.emit('contextUnregistered', contextId);
  }
  
  /**
   * Update context state
   */
  updateContext(contextId: string, context: IntelReport3DContextState): void {
    if (!this.activeContexts.has(contextId)) {
      this.registerContext(contextId, context);
      return;
    }
    
    const previousContext = this.activeContexts.get(contextId)!;
    this.activeContexts.set(contextId, context);
    
    // Check for sync triggers
    this.checkSyncTriggers(contextId, previousContext, context);
    
    this.emit('contextUpdated', contextId, context);
  }
  
  /**
   * Get all active contexts
   */
  getActiveContexts(): Map<string, IntelReport3DContextState> {
    return new Map(this.activeContexts);
  }
  
  // =============================================================================
  // MULTI-CONTEXT SYNCHRONIZATION
  // =============================================================================
  
  /**
   * Synchronize intel reports across multiple contexts
   */
  async syncMultiContext(multiContext: IntelReport3DMultiContext): Promise<void> {
    const startTime = Date.now();
    
    try {
      const syncState = multiContext.syncState;
      
      // Entity synchronization
      if (syncState.entitySync) {
        await this.syncEntitiesAcrossContexts(multiContext.contexts);
      }
      
      // Geospatial synchronization
      if (syncState.geospatialSync) {
        await this.syncGeospatialData(multiContext.contexts);
      }
      
      // Temporal synchronization
      if (syncState.temporalSync) {
        await this.syncTemporalData(multiContext.contexts);
      }
      
      // Threat synchronization
      if (syncState.threatSync) {
        await this.syncThreatData(multiContext.contexts);
      }
      
      // Apply custom sync rules
      await this.applyCustomSyncRules(multiContext);
      
      this.updateSyncMetrics(true, Date.now() - startTime);
      this.emit('multiContextSynced', multiContext);
      
    } catch (error) {
      this.updateSyncMetrics(false, Date.now() - startTime);
      this.emit('syncError', error);
      throw error;
    }
  }
  
  /**
   * Synchronize entities across contexts
   */
  private async syncEntitiesAcrossContexts(contexts: IntelReport3DContextState[]): Promise<void> {
    const entityMap = new Map<string, IntelReport3DData[]>();
    
    // Group intel reports by entity/ID across contexts
    for (const context of contexts) {
      // In a real implementation, this would fetch intel data for each context
      // For now, we'll emit events to request data
      this.emit('requestContextIntelData', context);
    }
    
    // Process entity mappings for cross-context synchronization
    console.debug('Entity sync completed', entityMap.size);
  }
  
  /**
   * Synchronize geospatial data
   */
  private async syncGeospatialData(contexts: IntelReport3DContextState[]): Promise<void> {
    const geospatialGroups = new Map<string, {
      context: IntelReport3DContextState;
      reports: IntelReport3DData[];
    }[]>();
    
    // Group by geographic regions
    for (const context of contexts) {
      if (context.hudContext.focusRegion) {
        const regionKey = `${context.hudContext.focusRegion.id}`;
        if (!geospatialGroups.has(regionKey)) {
          geospatialGroups.set(regionKey, []);
        }
        geospatialGroups.get(regionKey)!.push({
          context,
          reports: [] // Would be populated with actual intel data
        });
      }
    }
    
    // Sync within each geographic group
    Array.from(geospatialGroups.entries()).forEach(([regionKey, group]) => {
      this.emit('geospatialSync', regionKey, group);
    });
  }
  
  /**
   * Synchronize temporal data
   */
  private async syncTemporalData(contexts: IntelReport3DContextState[]): Promise<void> {
    const now = Date.now();
    const tolerance = this.config.temporalTolerance;
    
    // Find contexts with overlapping time windows
    const timeGroups: IntelReport3DContextState[][] = [];
    
    for (let i = 0; i < contexts.length; i++) {
      for (let j = i + 1; j < contexts.length; j++) {
        // In a real implementation, contexts would have time ranges
        // For now, assume they should sync if within tolerance
        const timeDiff = Math.abs(now - now); // Placeholder
        if (timeDiff <= tolerance) {
          timeGroups.push([contexts[i], contexts[j]]);
        }
      }
    }
    
    // Sync each time group
    for (const group of timeGroups) {
      this.emit('temporalSync', group);
    }
  }
  
  /**
   * Synchronize threat data
   */
  private async syncThreatData(contexts: IntelReport3DContextState[]): Promise<void> {
    const threshold = this.config.threatPropagationThreshold;
    const priorityOrder: IntelPriority[] = ['critical', 'high', 'medium', 'low', 'background'];
    const thresholdIndex = priorityOrder.indexOf(threshold);
    
    // Propagate high-priority threats across all contexts
    for (const sourceContext of contexts) {
      for (const targetContext of contexts) {
        if (sourceContext === targetContext) continue;
        
        this.emit('threatSync', {
          source: sourceContext,
          target: targetContext,
          threshold: threshold,
          eligiblePriorities: priorityOrder.slice(0, thresholdIndex + 1)
        });
      }
    }
  }
  
  // =============================================================================
  // CUSTOM SYNC RULES
  // =============================================================================
  
  /**
   * Add custom synchronization rule
   */
  addCustomSyncRule(rule: IntelCustomSyncRule): void {
    this.customRules.set(rule.id, rule);
    this.emit('customRuleAdded', rule);
  }
  
  /**
   * Remove custom synchronization rule
   */
  removeCustomSyncRule(ruleId: string): boolean {
    const removed = this.customRules.delete(ruleId);
    if (removed) {
      this.emit('customRuleRemoved', ruleId);
    }
    return removed;
  }
  
  /**
   * Update custom synchronization rule
   */
  updateCustomSyncRule(rule: IntelCustomSyncRule): void {
    if (this.customRules.has(rule.id)) {
      this.customRules.set(rule.id, rule);
      this.emit('customRuleUpdated', rule);
    }
  }
  
  /**
   * Get all custom rules
   */
  getCustomSyncRules(): IntelCustomSyncRule[] {
    return Array.from(this.customRules.values()).sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Apply custom sync rules to multi-context scenario
   */
  private async applyCustomSyncRules(multiContext: IntelReport3DMultiContext): Promise<void> {
    const enabledRules = Array.from(this.customRules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);
    
    for (const rule of enabledRules) {
      try {
        await this.executeCustomSyncRule(rule, multiContext);
      } catch (error) {
        this.emit('customRuleError', rule.id, error);
      }
    }
  }
  
  /**
   * Execute a custom sync rule
   */
  private async executeCustomSyncRule(
    rule: IntelCustomSyncRule,
    multiContext: IntelReport3DMultiContext
  ): Promise<void> {
    // Check if rule trigger conditions are met
    const triggerMet = await this.evaluateSyncTrigger(rule.trigger, multiContext);
    if (!triggerMet) return;
    
    // Get target contexts for this rule
    const targetContexts = rule.targetContexts
      .map(index => multiContext.contexts[index])
      .filter(context => context !== undefined);
    
    if (targetContexts.length === 0) return;
    
    // Execute the sync action
    await this.executeSyncAction(rule.action, multiContext.contexts[0], targetContexts);
    
    this.emit('customRuleExecuted', rule.id, targetContexts.length);
  }
  
  /**
   * Evaluate sync trigger conditions
   */
  private async evaluateSyncTrigger(
    trigger: IntelSyncTrigger,
    multiContext: IntelReport3DMultiContext
  ): Promise<boolean> {
    // Handle different trigger types
    switch (trigger.eventType) {
      case 'selection':
        return this.evaluateSelectionTrigger(trigger, multiContext);
      case 'focus':
        return this.evaluateFocusTrigger(trigger, multiContext);
      case 'filter':
        return this.evaluateFilterTrigger(trigger, multiContext);
      case 'search':
        return this.evaluateSearchTrigger(trigger, multiContext);
      case 'timeline':
        return this.evaluateTimelineTrigger(trigger, multiContext);
      case 'custom':
        return this.evaluateCustomTrigger(trigger, multiContext);
      default:
        return false;
    }
  }
  
  /**
   * Execute sync action
   */
  private async executeSyncAction(
    action: IntelSyncAction,
    sourceContext: IntelReport3DContextState,
    targetContexts: IntelReport3DContextState[]
  ): Promise<void> {
    switch (action.type) {
      case 'propagate':
        await this.executePropagateAction(action, sourceContext, targetContexts);
        break;
      case 'highlight':
        await this.executeHighlightAction(action, sourceContext, targetContexts);
        break;
      case 'filter':
        await this.executeFilterAction(action, sourceContext, targetContexts);
        break;
      case 'focus':
        await this.executeFocusAction(action, sourceContext, targetContexts);
        break;
      case 'custom':
        await this.executeCustomAction(action, sourceContext, targetContexts);
        break;
    }
  }
  
  // =============================================================================
  // CYBER LAYER INTEGRATION
  // =============================================================================
  
  /**
   * Sync with CYBER data layers
   */
  async syncWithCyberLayers(layers: CyberDataLayer[]): Promise<void> {
    if (!this.config.enableCyberLayerSync) return;
    
    for (const layer of layers) {
      if (!layer.active) continue;
      
      try {
        await this.syncWithSingleCyberLayer(layer);
      } catch (error) {
        this.emit('cyberLayerSyncError', layer.id, error);
      }
    }
  }
  
  /**
   * Sync with a single CYBER layer
   */
  private async syncWithSingleCyberLayer(layer: CyberDataLayer): Promise<void> {
    const connectionId = `cyber-${layer.type}-${layer.id}`;
    
    // Update or create connection
    const connection: IntelSyncConnection = {
      id: connectionId,
      type: 'cyber',
      name: `CYBER ${layer.type} Layer`,
      active: true,
      lastSync: new Date(),
      syncCount: (this.connections.get(connectionId)?.syncCount || 0) + 1,
      errorCount: this.connections.get(connectionId)?.errorCount || 0
    };
    
    this.connections.set(connectionId, connection);
    
    // Fetch and cache cross-layer data
    const crossLayerData = await this.fetchCyberLayerData(layer);
    this.crossLayerCache.set(layer.id, crossLayerData);
    
    this.emit('cyberLayerSynced', layer, crossLayerData.length);
  }
  
  /**
   * Fetch data from a CYBER layer
   */
  private async fetchCyberLayerData(layer: CyberDataLayer): Promise<IntelCrossLayerData[]> {
    // In a real implementation, this would make API calls to fetch layer data
    // For now, return mock data based on layer type
    
    const mockData: IntelCrossLayerData[] = [];
    const now = new Date();
    
    switch (layer.type) {
      case 'security':
        mockData.push({
          layerId: layer.id,
          layerType: 'security',
          data: { threatLevel: 'high', incidentCount: 5 },
          timestamp: now,
          source: 'Security Operations Center',
          priority: 'high',
          classification: 'CONFIDENTIAL'
        });
        break;
        
      case 'intelligence':
        mockData.push({
          layerId: layer.id,
          layerType: 'intelligence',
          data: { reportCount: 12, verifiedReports: 8 },
          timestamp: now,
          source: 'Intelligence Fusion Center',
          priority: 'medium',
          classification: 'SECRET'
        });
        break;
        
      case 'networks':
        mockData.push({
          layerId: layer.id,
          layerType: 'networks',
          data: { anomalies: 3, bandwidth: '85%' },
          timestamp: now,
          source: 'Network Operations Center',
          priority: 'low',
          classification: 'UNCLASSIFIED'
        });
        break;
        
      case 'financial':
        mockData.push({
          layerId: layer.id,
          layerType: 'financial',
          data: { suspiciousTransactions: 7, totalValue: '$2.3M' },
          timestamp: now,
          source: 'Financial Crimes Unit',
          priority: 'high',
          classification: 'CONFIDENTIAL'
        });
        break;
        
      case 'threats':
        mockData.push({
          layerId: layer.id,
          layerType: 'threats',
          data: { activeThreat : 15, mitigated: 8 },
          timestamp: now,
          source: 'Threat Intelligence Platform',
          priority: 'critical',
          classification: 'TOP_SECRET'
        });
        break;
    }
    
    return mockData;
  }
  
  /**
   * Get cached cross-layer data
   */
  getCrossLayerData(layerId: string): IntelCrossLayerData[] | null {
    const data = this.crossLayerCache.get(layerId);
    if (!data) return null;
    
    // Check if cache is expired
    const now = Date.now();
    const isExpired = data.some(item => 
      now - item.timestamp.getTime() > this.cacheExpiry
    );
    
    if (isExpired) {
      this.crossLayerCache.delete(layerId);
      return null;
    }
    
    return data;
  }
  
  // =============================================================================
  // SYNC TRIGGERS AND ACTIONS
  // =============================================================================
  
  /**
   * Check for sync triggers when context changes
   */
  private checkSyncTriggers(
    contextId: string,
    previousContext: IntelReport3DContextState,
    newContext: IntelReport3DContextState
  ): void {
    // Operation mode change
    if (previousContext.hudContext.operationMode !== newContext.hudContext.operationMode) {
      this.emit('syncTrigger', {
        type: 'operationModeChange',
        contextId,
        previous: previousContext.hudContext.operationMode,
        current: newContext.hudContext.operationMode
      });
    }
    
    // Center mode change
    if (previousContext.hudContext.centerMode !== newContext.hudContext.centerMode) {
      this.emit('syncTrigger', {
        type: 'centerModeChange',
        contextId,
        previous: previousContext.hudContext.centerMode,
        current: newContext.hudContext.centerMode
      });
    }
    
    // Layer changes
    const prevLayers = new Set(previousContext.hudContext.activeLayers);
    const newLayers = new Set(newContext.hudContext.activeLayers);
    
    if (prevLayers.size !== newLayers.size || 
        Array.from(prevLayers).some(layer => !newLayers.has(layer))) {
      this.emit('syncTrigger', {
        type: 'layerChange',
        contextId,
        addedLayers: Array.from(newLayers).filter(layer => !prevLayers.has(layer)),
        removedLayers: Array.from(prevLayers).filter(layer => !newLayers.has(layer))
      });
    }
  }
  
  // =============================================================================
  // TRIGGER EVALUATION METHODS
  // =============================================================================
  
  private evaluateSelectionTrigger(
    trigger: IntelSyncTrigger,
    multiContext: IntelReport3DMultiContext
  ): boolean {
    // Check if selection conditions are met across contexts
    if (trigger.eventType === 'selection' && multiContext.contexts.length > 0) {
      return multiContext.contexts.some(ctx => ctx.hudContext.selectedObject !== null);
    }
    return true; // Simplified implementation
  }
  
  private evaluateFocusTrigger(
    trigger: IntelSyncTrigger,
    multiContext: IntelReport3DMultiContext
  ): boolean {
    // Check if focus conditions are met
    if (trigger.eventType === 'focus' && multiContext.contexts.length > 0) {
      return multiContext.contexts.some(ctx => ctx.hudContext.activeLayers.length > 0);
    }
    return true; // Simplified implementation
  }
  
  private evaluateFilterTrigger(
    trigger: IntelSyncTrigger,
    multiContext: IntelReport3DMultiContext
  ): boolean {
    // Check if filter conditions are met
    if (trigger.eventType === 'filter' && multiContext.contexts.length > 0) {
      return multiContext.contexts.some(ctx => ctx.displayContext.priority === 'primary');
    }
    return true; // Simplified implementation
  }
  
  private evaluateSearchTrigger(
    trigger: IntelSyncTrigger,
    multiContext: IntelReport3DMultiContext
  ): boolean {
    // Check if search conditions are met
    if (trigger.eventType === 'search' && multiContext.contexts.length > 0) {
      return multiContext.contexts.some(ctx => ctx.hudContext.focusRegion !== undefined);
    }
    return true; // Simplified implementation
  }
  
  private evaluateTimelineTrigger(
    trigger: IntelSyncTrigger,
    multiContext: IntelReport3DMultiContext
  ): boolean {
    // Check if timeline conditions are met
    if (trigger.eventType === 'timeline' && multiContext.contexts.length > 0) {
      return multiContext.contexts.some(ctx => ctx.hudContext.centerMode === 'TIMELINE');
    }
    return true; // Simplified implementation
  }
  
  private evaluateCustomTrigger(
    trigger: IntelSyncTrigger,
    multiContext: IntelReport3DMultiContext
  ): boolean {
    if (trigger.customTrigger && multiContext.contexts.length > 0) {
      return trigger.customTrigger(multiContext.contexts[0], []);
    }
    return false;
  }
  
  // =============================================================================
  // ACTION EXECUTION METHODS
  // =============================================================================
  
  private async executePropagateAction(
    action: IntelSyncAction,
    sourceContext: IntelReport3DContextState,
    targetContexts: IntelReport3DContextState[]
  ): Promise<void> {
    this.emit('propagateAction', {
      source: sourceContext,
      targets: targetContexts,
      parameters: action.parameters
    });
  }
  
  private async executeHighlightAction(
    action: IntelSyncAction,
    sourceContext: IntelReport3DContextState,
    targetContexts: IntelReport3DContextState[]
  ): Promise<void> {
    this.emit('highlightAction', {
      source: sourceContext,
      targets: targetContexts,
      duration: action.parameters?.highlightDuration || 3000
    });
  }
  
  private async executeFilterAction(
    action: IntelSyncAction,
    sourceContext: IntelReport3DContextState,
    targetContexts: IntelReport3DContextState[]
  ): Promise<void> {
    this.emit('filterAction', {
      source: sourceContext,
      targets: targetContexts,
      criteria: action.parameters?.filterCriteria || {}
    });
  }
  
  private async executeFocusAction(
    action: IntelSyncAction,
    sourceContext: IntelReport3DContextState,
    targetContexts: IntelReport3DContextState[]
  ): Promise<void> {
    this.emit('focusAction', {
      source: sourceContext,
      targets: targetContexts,
      transition: action.parameters?.focusTransition || false,
      duration: action.parameters?.animationDuration || 1000
    });
  }
  
  private async executeCustomAction(
    action: IntelSyncAction,
    sourceContext: IntelReport3DContextState,
    targetContexts: IntelReport3DContextState[]
  ): Promise<void> {
    if (action.customAction) {
      action.customAction(sourceContext, targetContexts, []);
    }
  }
  
  // =============================================================================
  // SYNC LOOP AND METRICS
  // =============================================================================
  
  /**
   * Start the background sync loop
   */
  private startSyncLoop(): void {
    this.syncInterval = setInterval(() => {
      this.performPeriodicSync();
    }, this.config.syncInterval);
  }
  
  /**
   * Perform periodic synchronization
   */
  private async performPeriodicSync(): Promise<void> {
    if (this.isSyncing || this.activeContexts.size === 0) return;
    
    this.isSyncing = true;
    
    try {
      // Process sync queue
      await this.processSyncQueue();
      
      // Update cross-layer cache
      await this.refreshCrossLayerCache();
      
      // Clean up expired data
      this.cleanupExpiredData();
      
      // Update connection states
      this.updateConnectionStates();
      
    } catch (error) {
      this.emit('periodicSyncError', error);
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * Process the sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) return;
    
    const batchSize = Math.min(this.config.batchSize, this.syncQueue.length);
    const batch = this.syncQueue.splice(0, batchSize);
    
    for (const item of batch) {
      try {
        await this.syncSingleItem(item.data);
      } catch (error) {
        this.emit('syncItemError', item, error);
      }
    }
  }
  
  /**
   * Sync a single intel report
   */
  private async syncSingleItem(report: IntelReport3DData): Promise<void> {
    // Emit sync event for interested services
    this.emit('intelReportSync', report);
  }
  
  /**
   * Refresh cross-layer cache
   */
  private async refreshCrossLayerCache(): Promise<void> {
    // Remove expired entries
    const now = Date.now();
    Array.from(this.crossLayerCache.entries()).forEach(([layerId, data]) => {
      const isExpired = data.some(item => 
        now - item.timestamp.getTime() > this.cacheExpiry
      );
      
      if (isExpired) {
        this.crossLayerCache.delete(layerId);
      }
    });
  }
  
  /**
   * Clean up expired data
   */
  private cleanupExpiredData(): void {
    const now = Date.now();
    const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours
    
    // Clean up last sync times
    Array.from(this.lastSyncTimes.entries()).forEach(([key, time]) => {
      if (time.getTime() < cutoff) {
        this.lastSyncTimes.delete(key);
      }
    });
  }
  
  /**
   * Update connection states
   */
  private updateConnectionStates(): void {
    let activeCount = 0;
    
    Array.from(this.connections.values()).forEach(connection => {
      const timeSinceLastSync = Date.now() - connection.lastSync.getTime();
      connection.active = timeSinceLastSync < (this.config.syncInterval * 3);
      
      if (connection.active) {
        activeCount++;
      }
    });
    
    this.metrics.activeSyncConnections = activeCount;
  }
  
  /**
   * Update sync metrics
   */
  private updateSyncMetrics(success: boolean, duration: number): void {
    this.metrics.totalSyncs++;
    
    if (success) {
      this.metrics.successfulSyncs++;
    } else {
      this.metrics.failedSyncs++;
    }
    
    this.metrics.lastSyncTime = new Date();
    
    // Update average duration
    const totalDuration = this.metrics.averageSyncDuration * (this.metrics.totalSyncs - 1) + duration;
    this.metrics.averageSyncDuration = totalDuration / this.metrics.totalSyncs;
    
    this.metrics.syncLatency = duration;
  }
  
  // =============================================================================
  // PUBLIC API
  // =============================================================================
  
  /**
   * Queue intel report for synchronization
   */
  queueForSync(report: IntelReport3DData): void {
    if (this.syncQueue.length >= this.config.maxSyncItems) {
      // Remove oldest item
      this.syncQueue.shift();
    }
    
    this.syncQueue.push({
      data: report,
      timestamp: new Date()
    });
    
    this.emit('queuedForSync', report);
  }
  
  /**
   * Force immediate sync
   */
  async forceSync(): Promise<void> {
    await this.performPeriodicSync();
  }
  
  /**
   * Get sync metrics
   */
  getSyncMetrics(): IntelSyncMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get sync connections
   */
  getSyncConnections(): IntelSyncConnection[] {
    return Array.from(this.connections.values());
  }
  
  /**
   * Update sync configuration
   */
  updateConfiguration(config: Partial<IntelSyncConfiguration>): void {
    Object.assign(this.config, config);
    
    // Restart sync loop with new interval if changed
    if (config.syncInterval && this.syncInterval) {
      clearInterval(this.syncInterval);
      this.startSyncLoop();
    }
    
    this.emit('configurationUpdated', this.config);
  }
  
  /**
   * Get sync configuration
   */
  getConfiguration(): IntelSyncConfiguration {
    return { ...this.config };
  }
  
  /**
   * Test sync connection
   */
  async testSyncConnection(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;
    
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 100));
      
      connection.lastSync = new Date();
      connection.active = true;
      
      this.emit('connectionTested', connectionId, true);
      return true;
      
    } catch (error) {
      connection.active = false;
      connection.errorCount++;
      
      this.emit('connectionTested', connectionId, false);
      this.emit('connectionError', connectionId, error);
      return false;
    }
  }
  
  /**
   * Cleanup and shutdown
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.activeContexts.clear();
    this.connections.clear();
    this.customRules.clear();
    this.syncQueue.length = 0;
    this.crossLayerCache.clear();
    this.lastSyncTimes.clear();
    
    this.removeAllListeners();
  }
}

// Export singleton instance
export const intelSyncService = new IntelSyncService();
