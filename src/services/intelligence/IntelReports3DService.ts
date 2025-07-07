/**
 * Intel Reports 3D - Core Service
 * 
 * Central data management and querying service for Intel Reports 3D.
 * Provides high-performance, context-aware data operations with
 * real-time updates and viewport-based optimization.
 */

import { 
  IntelReport3DData, 
  IntelReport3DViewport,
  IntelClassification,
  IntelCategory,
  IntelThreatLevel
} from '../../types/intelligence/IntelReportTypes';
import { IntelReport3DContextState } from '../../types/intelligence/IntelContextTypes';
import { IntelCompatibilityAdapter } from '../../types/intelligence/IntelCompatibilityTypes';

// =============================================================================
// SERVICE CONFIGURATION & TYPES
// =============================================================================

/**
 * Service configuration options
 */
export interface IntelServiceOptions {
  maxCacheSize?: number;
  viewportCulling?: boolean;
  realTimeUpdates?: boolean;
  persistenceEnabled?: boolean;
  batchSize?: number;
  debounceDelay?: number;
}

/**
 * Default service configuration
 */
const DEFAULT_OPTIONS: Required<IntelServiceOptions> = {
  maxCacheSize: 10000,
  viewportCulling: true,
  realTimeUpdates: true,
  persistenceEnabled: false,
  batchSize: 100,
  debounceDelay: 100
};

/**
 * Query filters for intel reports
 */
export interface IntelReportFilters {
  tags?: string[];
  classification?: IntelClassification[];
  category?: IntelCategory[];
  threatLevel?: IntelThreatLevel[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  geographic?: {
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  confidence?: {
    min: number;
    max: number;
  };
  reliability?: {
    min: number;
    max: number;
  };
  freshness?: {
    min: number;
    max: number;
  };
  searchText?: string;
  authorFilter?: string[];
  sourceFilter?: string[];
}

/**
 * Service performance metrics
 */
export interface IntelServiceMetrics {
  totalReports: number;
  visibleReports: number;
  cacheHitRate: number;
  averageQueryTime: number;
  memoryUsage: number;
  lastUpdateTime: Date;
  subscriptionCount: number;
  errorCount: number;
}

/**
 * Subscription callback type
 */
export type IntelSubscriptionCallback = (reports: IntelReport3DData[]) => void;

/**
 * Service events
 */
export interface IntelServiceEvents {
  reportAdded: IntelReport3DData;
  reportUpdated: { id: string; report: IntelReport3DData; changes: Partial<IntelReport3DData> };
  reportDeleted: string;
  contextChanged: IntelReport3DContextState;
  error: Error;
  metricsUpdated: IntelServiceMetrics;
}

// =============================================================================
// CORE SERVICE IMPLEMENTATION
// =============================================================================

/**
 * Core Intel Reports 3D Service
 * 
 * Provides centralized data management with context-aware operations,
 * high-performance querying, and real-time update capabilities.
 */
export class IntelReports3DService {
  private readonly options: Required<IntelServiceOptions>;
  private readonly data: Map<string, IntelReport3DData> = new Map();
  private readonly subscriptions: Map<string, IntelSubscriptionCallback> = new Map();
  private readonly queryCache: Map<string, { data: IntelReport3DData[]; timestamp: number }> = new Map();
  private readonly eventListeners: Map<keyof IntelServiceEvents, Set<(data: unknown) => void>> = new Map();
  
  private contextState: IntelReport3DContextState;
  private currentViewport: IntelReport3DViewport | null = null;
  private metrics: IntelServiceMetrics;
  private batchQueue: Array<{ operation: string; data: unknown }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor(contextState: IntelReport3DContextState, options: IntelServiceOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.contextState = contextState;
    this.metrics = this.initializeMetrics();
    
    // Set up batch processing
    this.setupBatchProcessing();
    
    console.debug('IntelReports3DService initialized', {
      options: this.options,
      contextMode: contextState.hudContext.operationMode
    });
  }

  // =============================================================================
  // DATA MANAGEMENT OPERATIONS
  // =============================================================================

  /**
   * Add a new intel report
   */
  async addReport(report: IntelReport3DData): Promise<void> {
    try {
      const startTime = performance.now();
      
      // Validate report data
      this.validateReport(report);
      
      // Check for existing report
      if (this.data.has(report.id)) {
        throw new Error(`Report with id ${report.id} already exists`);
      }
      
      // Add to data store
      this.data.set(report.id, { ...report });
      
      // Update metrics
      this.updateMetrics('add', performance.now() - startTime);
      
      // Invalidate cache
      this.invalidateCache();
      
      // Emit event
      this.emit('reportAdded', report);
      
      // Notify subscribers
      this.notifySubscribers();
      
      console.debug('Intel report added', { id: report.id, title: report.title });
      
    } catch (error) {
      this.handleError('addReport', error as Error);
      throw error;
    }
  }

  /**
   * Update an existing intel report
   */
  async updateReport(id: string, updates: Partial<IntelReport3DData>): Promise<void> {
    try {
      const startTime = performance.now();
      
      const existingReport = this.data.get(id);
      if (!existingReport) {
        throw new Error(`Report with id ${id} not found`);
      }
      
      // Create updated report
      const updatedReport: IntelReport3DData = {
        ...existingReport,
        ...updates,
        id // Ensure ID cannot be changed
      };
      
      // Validate updated report
      this.validateReport(updatedReport);
      
      // Update data store
      this.data.set(id, updatedReport);
      
      // Update metrics
      this.updateMetrics('update', performance.now() - startTime);
      
      // Invalidate cache
      this.invalidateCache();
      
      // Emit event
      this.emit('reportUpdated', { id, report: updatedReport, changes: updates });
      
      // Notify subscribers
      this.notifySubscribers();
      
      console.debug('Intel report updated', { id, changes: Object.keys(updates) });
      
    } catch (error) {
      this.handleError('updateReport', error as Error);
      throw error;
    }
  }

  /**
   * Delete an intel report
   */
  async deleteReport(id: string): Promise<void> {
    try {
      const startTime = performance.now();
      
      if (!this.data.has(id)) {
        throw new Error(`Report with id ${id} not found`);
      }
      
      // Remove from data store
      this.data.delete(id);
      
      // Update metrics
      this.updateMetrics('delete', performance.now() - startTime);
      
      // Invalidate cache
      this.invalidateCache();
      
      // Emit event
      this.emit('reportDeleted', id);
      
      // Notify subscribers
      this.notifySubscribers();
      
      console.debug('Intel report deleted', { id });
      
    } catch (error) {
      this.handleError('deleteReport', error as Error);
      throw error;
    }
  }

  /**
   * Get a specific intel report by ID
   */
  async getReport(id: string): Promise<IntelReport3DData | null> {
    try {
      const startTime = performance.now();
      
      const report = this.data.get(id) || null;
      
      // Update metrics
      this.updateMetrics('get', performance.now() - startTime);
      
      return report ? { ...report } : null; // Return copy to prevent mutation
      
    } catch (error) {
      this.handleError('getReport', error as Error);
      return null;
    }
  }

  // =============================================================================
  // QUERYING OPERATIONS
  // =============================================================================

  /**
   * Query all intel reports
   */
  async queryAll(): Promise<IntelReport3DData[]> {
    try {
      const startTime = performance.now();
      
      const cacheKey = 'queryAll';
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      const reports = Array.from(this.data.values())
        .filter(report => this.passesContextFilter(report))
        .map(report => ({ ...report })); // Return copies
      
      // Cache results
      this.setCache(cacheKey, reports);
      
      // Update metrics
      this.updateMetrics('query', performance.now() - startTime);
      
      return reports;
      
    } catch (error) {
      this.handleError('queryAll', error as Error);
      return [];
    }
  }

  /**
   * Query intel reports within a viewport
   */
  async queryByViewport(viewport: IntelReport3DViewport): Promise<IntelReport3DData[]> {
    try {
      const startTime = performance.now();
      
      this.currentViewport = viewport;
      
      const cacheKey = `viewport-${JSON.stringify(viewport)}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      let reports = Array.from(this.data.values())
        .filter(report => this.passesContextFilter(report))
        .filter(report => this.passesViewportFilter(report, viewport));
      
      // Apply LOD-based filtering
      reports = this.applyLODFiltering(reports, viewport);
      
      // Limit results
      if (reports.length > viewport.maxItems) {
        reports = reports
          .sort((a, b) => this.calculateReportPriority(b) - this.calculateReportPriority(a))
          .slice(0, viewport.maxItems);
      }
      
      // Return copies
      const result = reports.map(report => ({ ...report }));
      
      // Cache results
      this.setCache(cacheKey, result);
      
      // Update metrics
      this.updateMetrics('query', performance.now() - startTime);
      
      return result;
      
    } catch (error) {
      this.handleError('queryByViewport', error as Error);
      return [];
    }
  }

  /**
   * Query intel reports with custom filters
   */
  async queryByFilters(filters: IntelReportFilters): Promise<IntelReport3DData[]> {
    try {
      const startTime = performance.now();
      
      const cacheKey = `filters-${JSON.stringify(filters)}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      const reports = Array.from(this.data.values())
        .filter(report => this.passesContextFilter(report))
        .filter(report => this.passesCustomFilters(report, filters))
        .map(report => ({ ...report })); // Return copies
      
      // Cache results
      this.setCache(cacheKey, reports);
      
      // Update metrics
      this.updateMetrics('query', performance.now() - startTime);
      
      return reports;
      
    } catch (error) {
      this.handleError('queryByFilters', error as Error);
      return [];
    }
  }

  /**
   * Query related intel reports
   */
  async queryByRelationships(reportId: string): Promise<IntelReport3DData[]> {
    try {
      const startTime = performance.now();
      
      const report = this.data.get(reportId);
      if (!report || !report.relationships) {
        return [];
      }
      
      const relatedIds = report.relationships.map(rel => rel.target_intel_id);
      const relatedReports = relatedIds
        .map(id => this.data.get(id))
        .filter((r): r is IntelReport3DData => r !== undefined)
        .filter(r => this.passesContextFilter(r))
        .map(r => ({ ...r })); // Return copies
      
      // Update metrics
      this.updateMetrics('query', performance.now() - startTime);
      
      return relatedReports;
      
    } catch (error) {
      this.handleError('queryByRelationships', error as Error);
      return [];
    }
  }

  // =============================================================================
  // SUBSCRIPTION MANAGEMENT
  // =============================================================================

  /**
   * Subscribe to data updates
   */
  subscribe(key: string, callback: IntelSubscriptionCallback): () => void {
    this.subscriptions.set(key, callback);
    
    // Immediately notify with current data if available
    this.notifySubscriber(key);
    
    console.debug('Subscription added', { key, totalSubscriptions: this.subscriptions.size });
    
    // Return unsubscribe function
    return () => this.unsubscribe(key);
  }

  /**
   * Unsubscribe from data updates
   */
  unsubscribe(key: string): void {
    this.subscriptions.delete(key);
    console.debug('Subscription removed', { key, totalSubscriptions: this.subscriptions.size });
  }

  /**
   * Notify all subscribers of data changes
   */
  private async notifySubscribers(): Promise<void> {
    if (this.subscriptions.size === 0) return;
    
    try {
      // Get current viewport data or all data
      const data = this.currentViewport 
        ? await this.queryByViewport(this.currentViewport)
        : await this.queryAll();
      
      // Notify all subscribers
      Array.from(this.subscriptions.entries()).forEach(([key, callback]) => {
        try {
          callback(data);
        } catch (error) {
          console.error('Subscription callback error', { key, error });
        }
      });
      
    } catch (error) {
      console.error('Failed to notify subscribers', error);
    }
  }

  /**
   * Notify a specific subscriber
   */
  private async notifySubscriber(key: string): Promise<void> {
    const callback = this.subscriptions.get(key);
    if (!callback) return;
    
    try {
      const data = this.currentViewport 
        ? await this.queryByViewport(this.currentViewport)
        : await this.queryAll();
      
      callback(data);
    } catch (error) {
      console.error('Failed to notify subscriber', { key, error });
    }
  }

  // =============================================================================
  // CONTEXT MANAGEMENT
  // =============================================================================

  /**
   * Update context state
   */
  updateContext(contextState: IntelReport3DContextState): void {
    const previousMode = this.contextState.hudContext.operationMode;
    this.contextState = { ...contextState };
    
    // Invalidate cache if operation mode changed
    if (previousMode !== contextState.hudContext.operationMode) {
      this.invalidateCache();
    }
    
    // Emit context change event
    this.emit('contextChanged', contextState);
    
    // Notify subscribers of potential data changes
    this.notifySubscribers();
    
    console.debug('Context updated', {
      operationMode: contextState.hudContext.operationMode,
      centerMode: contextState.hudContext.centerMode
    });
  }

  /**
   * Get current context state
   */
  getContext(): IntelReport3DContextState {
    return { ...this.contextState };
  }

  // =============================================================================
  // PERFORMANCE & METRICS
  // =============================================================================

  /**
   * Get service performance metrics
   */
  getMetrics(): IntelServiceMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.queryCache.clear();
    console.debug('Cache cleared');
  }

  /**
   * Optimize service performance
   */
  optimize(): void {
    // Clear old cache entries
    const now = Date.now();
    const maxAge = 300000; // 5 minutes
    
    Array.from(this.queryCache.entries()).forEach(([key, cached]) => {
      if (now - cached.timestamp > maxAge) {
        this.queryCache.delete(key);
      }
    });
    
    // Limit cache size
    if (this.queryCache.size > this.options.maxCacheSize) {
      const entries = Array.from(this.queryCache.entries())
        .sort(([, a], [, b]) => b.timestamp - a.timestamp)
        .slice(0, Math.floor(this.options.maxCacheSize * 0.8));
      
      this.queryCache.clear();
      entries.forEach(([key, value]) => this.queryCache.set(key, value));
    }
    
    console.debug('Service optimized', {
      cacheSize: this.queryCache.size,
      dataSize: this.data.size
    });
  }

  // =============================================================================
  // DATA LOADING & MIGRATION
  // =============================================================================

  /**
   * Load data from various sources with automatic migration
   */
  async loadData(sources: Array<{ id: string; data: unknown[] }>): Promise<void> {
    try {
      let totalLoaded = 0;
      
      for (const source of sources) {
        const reports = IntelCompatibilityAdapter.batchMigrate(source.data);
        
        for (const report of reports) {
          if (!this.data.has(report.id)) {
            this.data.set(report.id, report);
            totalLoaded++;
          }
        }
      }
      
      // Invalidate cache
      this.invalidateCache();
      
      // Update metrics
      this.updateMetrics('load', 0, totalLoaded);
      
      // Notify subscribers
      this.notifySubscribers();
      
      console.info('Data loaded successfully', {
        sources: sources.length,
        totalReports: totalLoaded,
        totalInStore: this.data.size
      });
      
    } catch (error) {
      console.error('Failed to load data', error);
      throw error;
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private initializeMetrics(): IntelServiceMetrics {
    return {
      totalReports: 0,
      visibleReports: 0,
      cacheHitRate: 0,
      averageQueryTime: 0,
      memoryUsage: 0,
      lastUpdateTime: new Date(),
      subscriptionCount: 0,
      errorCount: 0
    };
  }

  private validateReport(report: IntelReport3DData): void {
    if (!report.id || typeof report.id !== 'string') {
      throw new Error('Report must have a valid ID');
    }
    
    if (!report.title || typeof report.title !== 'string') {
      throw new Error('Report must have a valid title');
    }
    
    if (!report.location || typeof report.location.lat !== 'number' || typeof report.location.lng !== 'number') {
      throw new Error('Report must have a valid location');
    }
    
    if (!report.timestamp || !(report.timestamp instanceof Date)) {
      throw new Error('Report must have a valid timestamp');
    }
  }

  private passesContextFilter(report: IntelReport3DData): boolean {
    // Context-based filtering based on operation mode
    const { activeLayers } = this.contextState.hudContext;
    
    // If no active layers specified, show all
    if (!activeLayers.length) return true;
    
    // Check if report matches active layers (simplified logic)
    return activeLayers.includes('intel-reports') || 
           activeLayers.some(layer => report.metadata.tags.includes(layer));
  }

  private passesViewportFilter(report: IntelReport3DData, viewport: IntelReport3DViewport): boolean {
    if (!this.options.viewportCulling) return true;
    
    const { lat, lng } = report.location;
    const { bounds } = viewport;
    
    return lat >= bounds.south && lat <= bounds.north &&
           lng >= bounds.west && lng <= bounds.east;
  }

  private passesCustomFilters(report: IntelReport3DData, filters: IntelReportFilters): boolean {
    // Tag filtering
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => report.metadata.tags.includes(tag));
      if (!hasMatchingTag) return false;
    }
    
    // Classification filtering
    if (filters.classification && filters.classification.length > 0) {
      if (!filters.classification.includes(report.classification)) return false;
    }
    
    // Category filtering
    if (filters.category && filters.category.length > 0) {
      if (!filters.category.includes(report.metadata.category)) return false;
    }
    
    // Threat level filtering
    if (filters.threatLevel && filters.threatLevel.length > 0 && report.metadata.threat_level) {
      if (!filters.threatLevel.includes(report.metadata.threat_level)) return false;
    }
    
    // Time range filtering
    if (filters.timeRange) {
      const timestamp = report.timestamp.getTime();
      const start = filters.timeRange.start.getTime();
      const end = filters.timeRange.end.getTime();
      if (timestamp < start || timestamp > end) return false;
    }
    
    // Geographic filtering
    if (filters.geographic) {
      const { lat, lng } = report.location;
      const { bounds } = filters.geographic;
      if (lat < bounds.south || lat > bounds.north || lng < bounds.west || lng > bounds.east) {
        return false;
      }
    }
    
    // Confidence filtering
    if (filters.confidence) {
      const confidence = report.metadata.confidence;
      if (confidence < filters.confidence.min || confidence > filters.confidence.max) {
        return false;
      }
    }
    
    // Reliability filtering
    if (filters.reliability) {
      const reliability = report.metadata.reliability;
      if (reliability < filters.reliability.min || reliability > filters.reliability.max) {
        return false;
      }
    }
    
    // Freshness filtering
    if (filters.freshness) {
      const freshness = report.metadata.freshness;
      if (freshness < filters.freshness.min || freshness > filters.freshness.max) {
        return false;
      }
    }
    
    // Text search
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const titleMatch = report.title.toLowerCase().includes(searchLower);
      const contentMatch = report.content.summary.toLowerCase().includes(searchLower) ||
                          report.content.details.toLowerCase().includes(searchLower);
      const tagMatch = report.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower));
      
      if (!titleMatch && !contentMatch && !tagMatch) return false;
    }
    
    // Author filtering
    if (filters.authorFilter && filters.authorFilter.length > 0) {
      if (!filters.authorFilter.includes(report.source)) return false;
    }
    
    return true;
  }

  private applyLODFiltering(reports: IntelReport3DData[], viewport: IntelReport3DViewport): IntelReport3DData[] {
    // Apply Level of Detail filtering based on zoom level
    switch (viewport.lodLevel) {
      case 'low':
        // Only show high priority reports
        return reports.filter(report => 
          report.visualization.priority === 'critical' || 
          report.visualization.priority === 'high'
        );
      
      case 'medium':
        // Show high and medium priority reports
        return reports.filter(report => 
          report.visualization.priority !== 'low' && 
          report.visualization.priority !== 'background'
        );
      
      case 'high':
      default:
        // Show all reports
        return reports;
    }
  }

  private calculateReportPriority(report: IntelReport3DData): number {
    // Calculate priority score for sorting
    let score = 0;
    
    // Priority contribution
    switch (report.visualization.priority) {
      case 'critical': score += 100; break;
      case 'high': score += 80; break;
      case 'medium': score += 60; break;
      case 'low': score += 40; break;
      case 'background': score += 20; break;
    }
    
    // Threat level contribution
    if (report.metadata.threat_level) {
      switch (report.metadata.threat_level) {
        case 'critical': score += 50; break;
        case 'high': score += 40; break;
        case 'moderate': score += 30; break;
        case 'low': score += 20; break;
        case 'minimal': score += 10; break;
      }
    }
    
    // Freshness contribution
    score += report.metadata.freshness * 20;
    
    // Confidence contribution
    score += report.metadata.confidence * 10;
    
    return score;
  }

  private getFromCache(key: string): IntelReport3DData[] | null {
    const cached = this.queryCache.get(key);
    if (!cached) return null;
    
    // Check if cache is still valid (5 minutes)
    const maxAge = 300000;
    if (Date.now() - cached.timestamp > maxAge) {
      this.queryCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: IntelReport3DData[]): void {
    this.queryCache.set(key, {
      data: [...data], // Store copy
      timestamp: Date.now()
    });
  }

  private invalidateCache(): void {
    this.queryCache.clear();
  }

  private updateMetrics(operation: string, queryTime: number, additionalReports: number = 0): void {
    this.metrics.totalReports = this.data.size + additionalReports;
    this.metrics.lastUpdateTime = new Date();
    this.metrics.subscriptionCount = this.subscriptions.size;
    
    // Update average query time (rolling average)
    if (this.metrics.averageQueryTime === 0) {
      this.metrics.averageQueryTime = queryTime;
    } else {
      this.metrics.averageQueryTime = (this.metrics.averageQueryTime * 0.9) + (queryTime * 0.1);
    }
    
    // Estimate memory usage (simplified)
    this.metrics.memoryUsage = this.data.size * 1024; // Rough estimate: 1KB per report
    
    // Emit metrics update
    this.emit('metricsUpdated', this.metrics);
  }

  private handleError(operation: string, error: Error): void {
    this.metrics.errorCount++;
    console.error(`IntelReports3DService.${operation} error:`, error);
    this.emit('error', error);
  }

  private setupBatchProcessing(): void {
    // Batch processing implementation can be added here for high-volume operations
    // This is a placeholder for future batch optimization
  }

  private emit<K extends keyof IntelServiceEvents>(
    event: K, 
    data: IntelServiceEvents[K]
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

  /**
   * Add event listener
   */
  on<K extends keyof IntelServiceEvents>(
    event: K, 
    listener: (data: IntelServiceEvents[K]) => void
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(listener);
    
    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Clear all data
    this.data.clear();
    this.queryCache.clear();
    
    // Clear subscriptions
    this.subscriptions.clear();
    
    // Clear event listeners
    this.eventListeners.clear();
    
    // Clear batch timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    console.debug('IntelReports3DService destroyed');
  }
}
