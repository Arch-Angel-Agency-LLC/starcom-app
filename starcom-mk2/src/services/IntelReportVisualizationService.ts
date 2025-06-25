// src/services/IntelReportVisualizationService.ts
// Service for managing Intel Report visualization data for the 3D Globe

import { IntelReportOverlayMarker } from '../interfaces/IntelReportOverlay';
import { IntelReportData, IntelReportTransformer } from '../models/IntelReportData';
import { fetchIntelReports } from '../api/intelligence';
import type { IntelReport } from '../models/IntelReport';

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

  /**
   * Fetch Intel Reports for visualization on the globe
   */
  async getIntelReportMarkers(
    options: IntelReportVisualizationOptions = {}
  ): Promise<IntelReportOverlayMarker[]> {
    try {
      // Check cache first
      if (this.isCacheValid()) {
        return this.applyFilters(this.cache, options);
      }

      console.log('Fetching Intel Reports for 3D visualization...');
      
      // Fetch from API
      const reports = await fetchIntelReports();
      
      // Transform to overlay markers
      const markers = reports.map(report => 
        this.transformReportToMarker(report)
      );

      // Update cache
      this.cache = markers;
      this.lastFetch = new Date();

      console.log(`Loaded ${markers.length} Intel Report markers for 3D visualization`);
      
      return this.applyFilters(markers, options);
    } catch (error) {
      console.error('Error fetching Intel Reports for visualization:', error);
      
      // Return demo data for development
      return this.getDemoData();
    }
  }

  /**
   * Transform IntelReport to overlay marker format
   */
  private transformReportToMarker(report: IntelReportData | IntelReport): IntelReportOverlayMarker {
    // Check if it's an IntelReportData or IntelReport class instance
    const isIntelReportData = 'pubkey' in report && 'latitude' in report;
    
    return {
      pubkey: isIntelReportData ? (report as IntelReportData).pubkey || `temp-${Date.now()}-${Math.random()}` : `temp-${Date.now()}-${Math.random()}`,
      title: report.title || 'Unknown Intel Report',
      content: report.content || '',
      tags: report.tags || [],
      latitude: isIntelReportData ? (report as IntelReportData).latitude : (report as IntelReport).lat || 0,
      longitude: isIntelReportData ? (report as IntelReportData).longitude : (report as IntelReport).long || 0,
      timestamp: isIntelReportData ? (report as IntelReportData).timestamp || Date.now() : Date.parse((report as IntelReport).date) || Date.now(),
      author: isIntelReportData ? (report as IntelReportData).author || 'Unknown' : (report as IntelReport).author || 'Unknown'
    };
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
  }

  /**
   * Add a new Intel Report marker immediately (for real-time updates)
   */
  addMarker(reportData: IntelReportData): void {
    const marker = IntelReportTransformer.dataToOverlayMarker(reportData);
    this.cache.unshift(marker); // Add to beginning for recency
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
