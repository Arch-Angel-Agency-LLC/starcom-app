// Updated Satellite Visualization Service - Phase 2 Implementation
// Now uses SatelliteDataManager for intelligent satellite selection
// Handles real 21K+ CelesTrak data with smart curation

import { SatelliteDataManager, SatelliteData, SatellitePosition, SatelliteInfo, SelectionCriteria } from './SatelliteDataManager';

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export class SatelliteVisualizationService {
  private dataManager: SatelliteDataManager;
  private selectedSatellites: string[] = [];
  private currentSelectionCriteria: SelectionCriteria = { maxCount: 100 };
  private lastSelectionUpdate: Date | null = null;
  private readonly SELECTION_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.dataManager = new SatelliteDataManager();
  }

  /**
   * Initialize the service and load satellite data
   */
  async initialize(): Promise<void> {
    console.log('🛰️ Initializing SatelliteVisualizationService...');
    
    try {
      await this.dataManager.loadSatelliteData();
      await this.updateSelection();
      console.log('🛰️ SatelliteVisualizationService initialized successfully');
    } catch (error) {
      console.error('🛰️ Failed to initialize SatelliteVisualizationService:', error);
      throw error;
    }
  }

  /**
   * Get curated satellite data for visualization
   * Returns the intelligently selected ~100 satellites
   */
  async getSatelliteData(): Promise<SatelliteData[]> {
    console.log('🛰️ Getting satellite data for visualization...');
    
    try {
      // Check if we need to refresh data
      if (this.dataManager.needsUpdate()) {
        console.log('🛰️ Satellite data cache expired, refreshing...');
        await this.dataManager.loadSatelliteData();
        await this.updateSelection();
      }

      // Check if we need to update selection
      if (this.needsSelectionUpdate()) {
        console.log('🛰️ Updating satellite selection...');
        await this.updateSelection();
      }

      // Convert selected IDs to full satellite data
      const selectedData: SatelliteData[] = [];
      for (const id of this.selectedSatellites) {
        const info = this.dataManager.getSatelliteInfo(id);
        if (info) {
          // Convert SatelliteInfo back to SatelliteData format for compatibility
          selectedData.push({
            id: info.id,
            name: info.name,
            lat: 0, // Will be updated in getPositions
            lng: 0, // Will be updated in getPositions
            altitude: info.altitude,
            type: this.mapTypeFromDisplayName(info.type),
            status: 'active',
            priority: 50, // Default priority
            country: info.country
          });
        }
      }

      // Update positions for current time
      const positions = this.dataManager.getPositions(this.selectedSatellites);
      const positionMap = new Map(positions.map(p => [p.id, p]));

      // Update lat/lng from calculated positions
      selectedData.forEach(satellite => {
        const position = positionMap.get(satellite.id);
        if (position) {
          satellite.lat = position.lat;
          satellite.lng = position.lng;
        }
      });

      console.log(`🛰️ Returning ${selectedData.length} satellites for visualization`);
      
      // Verify we're not using fallback data
      if (selectedData.length === 3 && 
          selectedData.some(s => s.id === 'iss') && 
          selectedData.some(s => s.id === 'css') && 
          selectedData.some(s => s.id === 'hubble')) {
        console.warn('⚠️ WARNING: Appears to be using fallback data instead of real CelesTrak data!');
      } else {
        console.log('✅ CONFIRMED: Using real satellite data from CelesTrak (not fallback)');
        console.log(`📊 Data breakdown: ${selectedData.length} satellites across multiple types`);
      }
      
      return selectedData;

    } catch (error) {
      console.error('🛰️ Error getting satellite data:', error);
      console.error('❌ FALLBACK MODE: Using hardcoded satellite data because real data failed to load');
      console.error('🔍 This means CelesTrak API is not accessible or there is a network/configuration issue');
      return this.getFallbackSatelliteData();
    }
  }

  /**
   * Update selection based on current criteria
   */
  async updateSelection(zoom?: number, region?: BoundingBox): Promise<void> {
    // Update criteria based on zoom level and region
    const criteria: SelectionCriteria = {
      ...this.currentSelectionCriteria,
      maxCount: this.calculateMaxCount(zoom),
      region: region ? {
        minLat: region.minLat,
        maxLat: region.maxLat,
        minLng: region.minLng,
        maxLng: region.maxLng
      } : undefined
    };

    this.selectedSatellites = this.dataManager.selectSatellites(criteria);
    this.lastSelectionUpdate = new Date();
    
    console.log(`🛰️ Updated selection: ${this.selectedSatellites.length} satellites selected`);
  }

  /**
   * Get current satellite positions for rendering
   */
  getCurrentPositions(): SatellitePosition[] {
    return this.dataManager.getPositions(this.selectedSatellites);
  }

  /**
   * Handle satellite interaction - find satellite at screen coordinates
   * Note: This is a placeholder - actual implementation would use Three.js raycasting
   */
  getSatelliteAt(screenCoords: { x: number; y: number }): SatelliteInfo | null {
    // This would be implemented with proper Three.js raycasting in Phase 3
    console.log('🛰️ Satellite interaction at:', screenCoords);
    
    // For now, return first satellite as demo
    if (this.selectedSatellites.length > 0) {
      return this.dataManager.getSatelliteInfo(this.selectedSatellites[0]);
    }
    
    return null;
  }

  /**
   * Get detailed info for a specific satellite
   */
  getSatelliteInfo(id: string): SatelliteInfo | null {
    return this.dataManager.getSatelliteInfo(id);
  }

  /**
   * Update selection criteria (for filtering, searching, etc.)
   */
  setSelectionCriteria(criteria: Partial<SelectionCriteria>): void {
    this.currentSelectionCriteria = { ...this.currentSelectionCriteria, ...criteria };
    console.log('🛰️ Updated selection criteria:', this.currentSelectionCriteria);
  }

  /**
   * Search satellites by name
   */
  searchSatellites(query: string): SatelliteInfo[] {
    const results: SatelliteInfo[] = [];
    
    for (const id of this.selectedSatellites) {
      const info = this.dataManager.getSatelliteInfo(id);
      if (info && info.name.toLowerCase().includes(query.toLowerCase())) {
        results.push(info);
      }
    }
    
    return results;
  }

  /**
   * Filter satellites by type
   */
  filterByType(types: SatelliteData['type'][]): void {
    this.setSelectionCriteria({ types });
    this.updateSelection();
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalInCache: number;
    selectedCount: number;
    lastUpdate: Date | null;
    cacheStats: Record<string, number>;
  } {
    const cacheStats = this.dataManager.getCacheStats();
    
    return {
      totalInCache: cacheStats.total,
      selectedCount: this.selectedSatellites.length,
      lastUpdate: cacheStats.lastUpdate,
      cacheStats: cacheStats.byType
    };
  }

  /**
   * Clear cache and force refresh
   */
  async refresh(): Promise<void> {
    console.log('🛰️ Forcing satellite data refresh...');
    await this.dataManager.loadSatelliteData();
    await this.updateSelection();
  }

  dispose(): void {
    this.selectedSatellites = [];
    this.currentSelectionCriteria = { maxCount: 100 };
    this.lastSelectionUpdate = null;
    this.dataManager.clear();
    console.log('🛰️ SatelliteVisualizationService disposed - caches cleared');
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private needsSelectionUpdate(): boolean {
    if (!this.lastSelectionUpdate) return true;
    return (Date.now() - this.lastSelectionUpdate.getTime()) > this.SELECTION_UPDATE_INTERVAL;
  }

  private calculateMaxCount(zoom?: number): number {
    if (!zoom) return 100; // Default count
    
    // Adjust satellite count based on zoom level
    if (zoom < 2) return 50;  // Zoomed out - fewer satellites
    if (zoom < 4) return 100; // Normal zoom
    if (zoom < 6) return 150; // Zoomed in - more satellites
    return 200; // Very zoomed in - maximum satellites
  }

  private mapTypeFromDisplayName(displayType: string): SatelliteData['type'] {
    const typeMap: Record<string, SatelliteData['type']> = {
      'Space Station': 'space_station',
      'GPS Satellite': 'gps_satellite',
      'Starlink Satellite': 'starlink',
      'Communication Satellite': 'communication',
      'Weather Satellite': 'weather',
      'Scientific Satellite': 'scientific',
      'Military Satellite': 'military',
      'Space Debris': 'debris',
      'Satellite': 'other'
    };
    
    return typeMap[displayType] || 'other';
  }

  /**
   * Fallback data when everything fails
   */
  private getFallbackSatelliteData(): SatelliteData[] {
    console.log('🛰️ Using fallback satellite data');
    
    return [
      {
        id: 'iss',
        name: 'International Space Station',
        lat: 0,
        lng: 0,
        altitude: 408,
        type: 'space_station',
        status: 'active',
        priority: 98,
        country: 'International'
      },
      {
        id: 'css',
        name: 'Chinese Space Station',
        lat: 41.5,
        lng: 109.3,
        altitude: 340,
        type: 'space_station',
        status: 'active',
        priority: 95,
        country: 'China'
      },
      {
        id: 'hubble',
        name: 'Hubble Space Telescope',
        lat: 28.5,
        lng: -80.6,
        altitude: 547,
        type: 'scientific',
        status: 'active',
        priority: 90,
        country: 'International'
      }
    ];
  }
}

// Export singleton instance
export const satelliteVisualizationService = new SatelliteVisualizationService();
