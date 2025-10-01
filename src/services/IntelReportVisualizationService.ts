// src/services/IntelReportVisualizationService.ts
// Service for managing Intel Report visualization data for the 3D Globe

import { IntelReportOverlayMarker } from '../interfaces/IntelReportOverlay';
import { intelReportService } from './intel/IntelReportService';
import type { IntelReportUI } from '../types/intel/IntelReportUI';

// Import unified Intel types from Phase 2 cleanup
// import { IntelReport as UnifiedIntelReport, IntelReportAdapter } from '../models/Intel/IntelReport';

// Legacy interfaces removed; this service now consumes IntelReportUI exclusively

// Legacy transformer and types removed in favor of IntelReportUI + intelReportService

export interface IntelReportVisualizationOptions {
  maxReports?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tagFilter?: string[];
  radiusFilter?: {
    centerLat: number;
    centerLng: number;
    radiusKm: number;
  };
}

export class IntelReportVisualizationService {
  private cache: IntelReportOverlayMarker[] = [];
  private lastFetch: Date | null = null;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private lastFilteredResult: IntelReportOverlayMarker[] = [];
  private lastOptionsHash: string = '';
  private subscribers = new Set<(markers: IntelReportOverlayMarker[]) => void>();
  private subscriptionInitialized = false;
  private realtimeUnsubscribe: (() => void) | null = null;
  private invalidCoordinateReports = new Set<string>();

  constructor() {
    this.initializeRealtimeSubscription();
  }

  /**
   * Fetch Intel Reports for visualization on the globe
   */
  async getIntelReportMarkers(
    options: IntelReportVisualizationOptions = {}
  ): Promise<IntelReportOverlayMarker[]> {
    try {
      this.initializeRealtimeSubscription();

      // Create options hash for memoization
      const optionsHash = JSON.stringify(options);
      
      // Check cache first
      if (this.isCacheValid()) {
        // Return same reference if options haven't changed
        if (optionsHash === this.lastOptionsHash && this.lastFilteredResult.length > 0) {
          return this.lastFilteredResult;
        }
        
        const filtered = this.applyFilters(this.cache, options);
        this.lastFilteredResult = filtered;
        this.lastOptionsHash = optionsHash;
        return filtered;
      }

      console.log('Fetching Intel Reports (UI) for 3D visualization...');
      
      // Fetch via centralized intelReportService
      const uiReports = await intelReportService.listReports();
      
      // Transform to overlay markers with validation
      const markers = this.buildMarkersFromReports(uiReports);

      // Update cache
      this.updateCache(markers);
  this.notifySubscribers(markers);

      console.log(`Loaded ${markers.length} Intel Report markers for 3D visualization`);
      
      const filtered = this.applyFilters(markers, options);
      this.lastFilteredResult = filtered;
      this.lastOptionsHash = JSON.stringify(options);
      return filtered;
    } catch (error) {
      console.error('Error fetching Intel Reports for visualization:', error);
      
      // Return demo data for development
      return this.getDemoData();
    }
  }

  subscribe(listener: (markers: IntelReportOverlayMarker[]) => void): () => void {
    this.subscribers.add(listener);

    if (this.cache.length > 0) {
      listener(this.cloneMarkers(this.cache));
    }

    return () => {
      this.subscribers.delete(listener);
    };
  }

  private initializeRealtimeSubscription(): void {
    if (this.subscriptionInitialized) {
      return;
    }

    // Avoid initializing during SSR
    if (typeof window === 'undefined') {
      return;
    }

    this.subscriptionInitialized = true;

    try {
      this.realtimeUnsubscribe = intelReportService.onChange((reports) => {
        this.refreshCacheFromReports(reports);
      });

      // Prime the cache on first subscription
      void intelReportService.listReports()
        .then((reports) => {
          this.refreshCacheFromReports(reports);
        })
        .catch((error) => {
          console.warn('Failed to prime Intel Report visualization cache:', error);
        });
    } catch (error) {
      console.warn('Failed to subscribe to intelReportService changes:', error);
      this.subscriptionInitialized = false;
    }
  }

  private refreshCacheFromReports(reports: IntelReportUI[]): void {
    const markers = this.buildMarkersFromReports(reports);
    this.updateCache(markers);
    this.notifySubscribers(markers);
  }

  private buildMarkersFromReports(reports: IntelReportUI[]): IntelReportOverlayMarker[] {
    const markers: IntelReportOverlayMarker[] = [];

    reports.forEach((report) => {
      const marker = this.transformReportToMarker(report);
      if (marker) {
        markers.push(marker);
      }
    });

    return markers;
  }

  private updateCache(markers: IntelReportOverlayMarker[]): void {
    this.cache = markers;
    this.lastFetch = new Date();
    this.lastOptionsHash = '';
    this.lastFilteredResult = [];
  }

  private notifySubscribers(markers: IntelReportOverlayMarker[]): void {
    if (this.subscribers.size === 0) {
      return;
    }

    const snapshot = this.cloneMarkers(markers);
    this.subscribers.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        console.warn('IntelReportVisualizationService subscriber threw an error:', error);
      }
    });
  }

  private cloneMarkers(markers: IntelReportOverlayMarker[]): IntelReportOverlayMarker[] {
    return markers.map((marker) => ({
      ...marker,
      tags: [...marker.tags]
    }));
  }

  /**
   * Transform IntelReport to overlay marker format
   */
  private transformReportToMarker(report: IntelReportUI): IntelReportOverlayMarker | null {
    const latitude = this.normalizeCoordinate(report.latitude);
    const longitude = this.normalizeCoordinate(report.longitude);

    if (latitude === null || longitude === null) {
      if (!this.invalidCoordinateReports.has(report.id)) {
        this.invalidCoordinateReports.add(report.id);
        console.warn(
          `Skipping intel report "${report.title}" (${report.id}) due to missing or invalid coordinates.`
        );
      }
      return null;
    }

    // Coordinate is now valid, ensure the warning can fire again if it becomes invalid later
    if (this.invalidCoordinateReports.has(report.id)) {
      this.invalidCoordinateReports.delete(report.id);
    }

    return {
      pubkey: report.id,
      title: report.title || 'Unknown Intel Report',
      content: report.content || '',
      tags: report.tags || [],
      latitude,
      longitude,
      timestamp: this.normalizeTimestamp(report.updatedAt ?? report.createdAt),
      author: report.author || 'Unknown'
    };
  }

  private normalizeCoordinate(value: number | string | undefined | null): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private normalizeTimestamp(value: Date | string | number | undefined | null): number {
    if (value instanceof Date) {
      const time = value.getTime();
      return Number.isFinite(time) ? time : Date.now();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : Date.now();
    }

    return Date.now();
  }

  /**
   * Apply filters to the markers
   */
  private applyFilters(
    markers: IntelReportOverlayMarker[], 
    options: IntelReportVisualizationOptions
  ): IntelReportOverlayMarker[] {
    let filtered = [...markers];

    // Date range filter
    if (options.dateRange) {
      filtered = filtered.filter(marker => {
        const date = new Date(marker.timestamp);
        return date >= options.dateRange!.start && date <= options.dateRange!.end;
      });
    }

    // Tag filter
    if (options.tagFilter && options.tagFilter.length > 0) {
      filtered = filtered.filter(marker =>
        options.tagFilter!.some(tag =>
          marker.tags.some(markerTag =>
            markerTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    // Radius filter (geographic)
    if (options.radiusFilter) {
      filtered = filtered.filter(marker => {
        const distance = this.calculateDistance(
          marker.latitude,
          marker.longitude,
          options.radiusFilter!.centerLat,
          options.radiusFilter!.centerLng
        );
        return distance <= options.radiusFilter!.radiusKm;
      });
    }

    // Limit results
    if (options.maxReports && options.maxReports > 0) {
      filtered = filtered.slice(0, options.maxReports);
    }

    return filtered;
  }

  /**
   * Calculate distance between two points in kilometers
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.degToRad(lat2 - lat1);
    const dLng = this.degToRad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private degToRad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    if (!this.lastFetch || this.cache.length === 0) {
      return false;
    }
    
    const now = new Date();
    return (now.getTime() - this.lastFetch.getTime()) < this.cacheTimeout;
  }

  /**
   * Clear cache and force refetch
   */
  clearCache(): void {
    this.cache = [];
    this.lastFetch = null;
    this.lastFilteredResult = [];
    this.lastOptionsHash = '';
  }

  /**
   * Add a new Intel Report marker immediately (for real-time updates)
   */
  addMarker(report: IntelReportUI): void {
    const marker = this.transformReportToMarker(report);
    if (!marker) {
      return;
    }

    this.cache.unshift(marker); // Add to beginning for recency
    this.lastFetch = new Date();
    this.lastFilteredResult = [];
    this.lastOptionsHash = '';
    this.notifySubscribers(this.cache);
  }

  /**
   * Demo data for development and testing
   */
  private getDemoData(): IntelReportOverlayMarker[] {
    return [
      {
        pubkey: 'demo-1',
        title: 'Anomalous Signal Detected',
        content: 'Unusual electromagnetic signatures detected in sector 7G. Requires investigation.',
        tags: ['SIGINT', 'ELECTROMAGNETIC', 'INVESTIGATION'],
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: Date.now() - 3600000,
        author: 'Agent-Alpha-7'
      },
      {
        pubkey: 'demo-2',
        title: 'Cyber Activity Alert',
        content: 'Increased cyber traffic from suspected state actor. Monitoring ongoing.',
        tags: ['CYBER', 'HUMINT', 'MONITORING'],
        latitude: 51.5074,
        longitude: -0.1278,
        timestamp: Date.now() - 7200000,
        author: 'Agent-Beta-3'
      },
      {
        pubkey: 'demo-3',
        title: 'Supply Chain Intelligence',
        content: 'Critical infrastructure supply chain analysis reveals potential vulnerabilities.',
        tags: ['INFRASTRUCTURE', 'ANALYSIS', 'CRITICAL'],
        latitude: 35.6762,
        longitude: 139.6503,
        timestamp: Date.now() - 10800000,
        author: 'Agent-Gamma-9'
      }
    ];
  }
}

// Export singleton instance
export const intelReportVisualizationService = new IntelReportVisualizationService();
