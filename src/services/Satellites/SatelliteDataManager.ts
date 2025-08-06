// Satellite Data Manager - Phase 1 Implementation
// Centralized hub for all satellite data operations with smart curation
// Handles 21K+ CelesTrak satellites, selects ~100 for visualization

import { SpaceAssetsDataProvider, CelesTrakTLE } from '../data-management/providers/SpaceAssetsDataProvider';

export interface SatelliteData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  altitude: number;
  type: 'space_station' | 'gps_satellite' | 'starlink' | 'communication' | 'weather' | 'scientific' | 'military' | 'debris' | 'other';
  status: 'active' | 'inactive' | 'decayed' | 'unknown';
  priority: number; // 0-100, higher = more important for selection
  country?: string;
  launchDate?: Date;
  tle?: {
    meanMotion: number;
    inclination: number;
    eccentricity: number;
    epoch: string;
  };
}

export interface SatellitePosition {
  id: string;
  position: {
    x: number; // 3D coordinates for Three.js
    y: number;
    z: number;
  };
  altitude: number;
  velocity: number;
  lat: number;
  lng: number;
}

export interface SatelliteInfo {
  id: string;
  name: string;
  type: string;
  altitude: number;
  velocity: number;
  nextPass?: PassInfo;
  launchDate?: Date;
  country: string;
  description?: string;
}

export interface PassInfo {
  time: Date;
  duration: number; // minutes
  maxElevation: number; // degrees
}

export interface SelectionCriteria {
  maxCount?: number;
  types?: SatelliteData['type'][];
  minPriority?: number;
  region?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  includeAlways?: string[]; // Always include these satellite IDs
}

export class SatelliteDataManager {
  private spaceAssetsProvider: SpaceAssetsDataProvider;
  private satelliteCache: Map<string, SatelliteData> = new Map();
  private lastUpdate: Date | null = null;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache for TLE data

  // Hardcoded high-priority satellites (always include)
  private readonly HIGH_PRIORITY_SATELLITES = [
    'ZARYA', // ISS module
    'INTERNATIONAL SPACE STATION',
    'ISS',
    'HUBBLE SPACE TELESCOPE',
    'TIANGONG',
    'CSS', // Chinese Space Station
    'JAMES WEBB SPACE TELESCOPE',
    'CHANDRA',
    'SPITZER'
  ];

  // GPS constellation identifiers
  private readonly GPS_IDENTIFIERS = [
    'GPS BIIR', 'GPS BIIF', 'GPS BIII'
  ];

  constructor() {
    this.spaceAssetsProvider = new SpaceAssetsDataProvider();
  }

  /**
   * Load all satellite data from CelesTrak
   * This fetches the full 21K+ satellite dataset
   */
  async loadSatelliteData(): Promise<void> {
    console.log('🛰️ Loading satellite data from CelesTrak...');
    
    try {
      // Fetch multiple datasets in parallel
      const [activeSatellites, spaceStations, starlink, gpsOps] = await Promise.all([
        this.spaceAssetsProvider.fetchData('active-satellites'),
        this.spaceAssetsProvider.fetchData('space-stations'),
        this.spaceAssetsProvider.fetchData('starlink'),
        this.spaceAssetsProvider.fetchData('gps-operational')
      ]);

      // Clear existing cache
      this.satelliteCache.clear();

      // Process each dataset
      this.processSatelliteDataset(activeSatellites as CelesTrakTLE[], 'active');
      this.processSatelliteDataset(spaceStations as CelesTrakTLE[], 'stations');
      this.processSatelliteDataset(starlink as CelesTrakTLE[], 'starlink');
      this.processSatelliteDataset(gpsOps as CelesTrakTLE[], 'gps');

      this.lastUpdate = new Date();
      
      console.log(`🛰️ Loaded ${this.satelliteCache.size} satellites into cache`);
      console.log(`   - Cache breakdown:`);
      this.logCacheStats();

    } catch (error) {
      console.error('🛰️ Failed to load satellite data:', error);
      throw error;
    }
  }

  /**
   * Select interesting satellites based on criteria
   * This is the core intelligence of the system - choosing which ~100 to show
   */
  selectSatellites(criteria: SelectionCriteria = {}): string[] {
    const {
      maxCount = 100,
      types = [],
      minPriority = 0,
      region,
      includeAlways = []
    } = criteria;

    console.log(`🛰️ Selecting satellites with criteria:`, {
      maxCount,
      types: types.length > 0 ? types : 'all',
      minPriority,
      hasRegion: !!region
    });

    const selected: Set<string> = new Set();
    
    // 1. Always include high-priority satellites
    for (const id of includeAlways) {
      if (this.satelliteCache.has(id)) {
        selected.add(id);
      }
    }

    // 2. Always include our hardcoded high-priority satellites
    for (const [id, satellite] of this.satelliteCache) {
      if (this.isHighPriority(satellite.name)) {
        selected.add(id);
      }
    }

    // 3. Select representatives from each category
    const categoryTargets = this.calculateCategoryTargets(maxCount);
    
    for (const [category, target] of Object.entries(categoryTargets)) {
      if (target === 0) continue;
      
      const categoryIds = this.selectFromCategory(category as SatelliteData['type'], target, selected);
      categoryIds.forEach(id => selected.add(id));
    }

    // 4. Apply regional filtering if specified
    let finalSelection = Array.from(selected);
    if (region) {
      finalSelection = finalSelection.filter(id => {
        const satellite = this.satelliteCache.get(id);
        if (!satellite) return false;
        
        return satellite.lat >= region.minLat &&
               satellite.lat <= region.maxLat &&
               satellite.lng >= region.minLng &&
               satellite.lng <= region.maxLng;
      });
    }

    // 5. Apply type filtering if specified
    if (types.length > 0) {
      finalSelection = finalSelection.filter(id => {
        const satellite = this.satelliteCache.get(id);
        return satellite && types.includes(satellite.type);
      });
    }

    // 6. Apply priority filtering
    finalSelection = finalSelection.filter(id => {
      const satellite = this.satelliteCache.get(id);
      return satellite && satellite.priority >= minPriority;
    });

    // 7. Limit to maxCount
    const result = finalSelection.slice(0, maxCount);
    
    console.log(`🛰️ Selected ${result.length} satellites from ${this.satelliteCache.size} total`);
    this.logSelectionStats(result);

    return result;
  }

  /**
   * Get 3D positions for selected satellites at current time
   * MVP: Uses simplified position estimation
   * Production: Would use SGP4 orbital mechanics
   */
  getPositions(satelliteIds: string[], _time: Date = new Date()): SatellitePosition[] {
    return satelliteIds.map(id => {
      const satellite = this.satelliteCache.get(id);
      if (!satellite) {
        console.warn(`🛰️ Satellite not found: ${id}`);
        return null;
      }

      // Convert lat/lng/alt to 3D coordinates
      const position = this.convertToCartesian(satellite.lat, satellite.lng, satellite.altitude);
      
      return {
        id,
        position,
        altitude: satellite.altitude,
        velocity: this.estimateVelocity(satellite.altitude),
        lat: satellite.lat,
        lng: satellite.lng
      };
    }).filter((pos): pos is SatellitePosition => pos !== null);
  }

  /**
   * Get satellite metadata for UI display
   */
  getSatelliteInfo(id: string): SatelliteInfo | null {
    const satellite = this.satelliteCache.get(id);
    if (!satellite) return null;

    return {
      id: satellite.id,
      name: satellite.name,
      type: this.getTypeDisplayName(satellite.type),
      altitude: satellite.altitude,
      velocity: this.estimateVelocity(satellite.altitude),
      launchDate: satellite.launchDate,
      country: satellite.country || 'Unknown',
      description: this.generateDescription(satellite)
    };
  }

  /**
   * Check if cache needs refreshing
   */
  needsUpdate(): boolean {
    if (!this.lastUpdate) return true;
    return (Date.now() - this.lastUpdate.getTime()) > this.CACHE_DURATION;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { total: number; byType: Record<string, number>; lastUpdate: Date | null } {
    const byType: Record<string, number> = {};
    
    for (const satellite of this.satelliteCache.values()) {
      byType[satellite.type] = (byType[satellite.type] || 0) + 1;
    }

    return {
      total: this.satelliteCache.size,
      byType,
      lastUpdate: this.lastUpdate
    };
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private processSatelliteDataset(data: CelesTrakTLE[], source: string): void {
    if (!Array.isArray(data)) {
      console.warn(`🛰️ Invalid dataset from ${source}:`, typeof data);
      return;
    }

    console.log(`🔄 Processing ${data.length} real satellites from ${source} (CelesTrak)`);
    let processedCount = 0;

    for (const tle of data) {
      const satellite = this.transformTLEToSatelliteData(tle, source);
      this.satelliteCache.set(satellite.id, satellite);
      processedCount++;
    }

    console.log(`✅ Processed ${processedCount} real satellites from ${source} into cache`);
  }

  private transformTLEToSatelliteData(tle: CelesTrakTLE, source: string): SatelliteData {
    const type = this.classifySatellite(tle.OBJECT_NAME, source);
    const priority = this.calculatePriority(tle.OBJECT_NAME, type);
    
    // MVP: Simplified position calculation
    // Production would use SGP4 to calculate real-time positions
    const { lat, lng } = this.estimatePosition(tle, Date.now());
    const altitude = this.calculateAltitudeFromMeanMotion(tle.MEAN_MOTION);

    return {
      id: tle.NORAD_CAT_ID.toString(),
      name: tle.OBJECT_NAME,
      lat,
      lng,
      altitude,
      type,
      status: 'active', // CelesTrak typically contains active objects
      priority,
      country: this.guessCountry(tle.OBJECT_NAME),
      tle: {
        meanMotion: tle.MEAN_MOTION,
        inclination: tle.INCLINATION,
        eccentricity: tle.ECCENTRICITY,
        epoch: tle.EPOCH
      }
    };
  }

  private classifySatellite(name: string, source: string): SatelliteData['type'] {
    const nameUpper = name.toUpperCase();
    
    // Explicit source-based classification
    if (source === 'starlink') return 'starlink';
    if (source === 'gps') return 'gps_satellite';
    if (source === 'stations') return 'space_station';

    // Name-based classification
    if (nameUpper.includes('STARLINK')) return 'starlink';
    if (nameUpper.includes('GPS') || nameUpper.includes('GALILEO') || nameUpper.includes('GLONASS')) return 'gps_satellite';
    if (nameUpper.includes('STATION') || nameUpper.includes('ISS') || nameUpper.includes('ZARYA') || nameUpper.includes('TIANGONG')) return 'space_station';
    if (nameUpper.includes('WEATHER') || nameUpper.includes('NOAA') || nameUpper.includes('GOES')) return 'weather';
    if (nameUpper.includes('HUBBLE') || nameUpper.includes('WEBB') || nameUpper.includes('CHANDRA') || nameUpper.includes('SPITZER')) return 'scientific';
    if (nameUpper.includes('COSMO') || nameUpper.includes('IRIDIUM') || nameUpper.includes('INTELSAT')) return 'communication';
    if (nameUpper.includes('DEBRIS') || nameUpper.includes('DEB')) return 'debris';
    if (nameUpper.includes('ROCKET') || nameUpper.includes('R/B')) return 'debris';

    return 'other';
  }

  private calculatePriority(name: string, type: SatelliteData['type']): number {
    // Base priority by type
    const typePriorities = {
      space_station: 95,
      scientific: 85,
      gps_satellite: 70,
      weather: 60,
      communication: 50,
      starlink: 30,
      military: 40,
      other: 20,
      debris: 10
    };

    let priority = typePriorities[type] || 20;

    // Boost for high-priority names
    if (this.isHighPriority(name)) {
      priority = Math.max(priority, 98);
    }

    return priority;
  }

  private isHighPriority(name: string): boolean {
    const nameUpper = name.toUpperCase();
    return this.HIGH_PRIORITY_SATELLITES.some(hp => nameUpper.includes(hp));
  }

  private calculateCategoryTargets(maxCount: number): Record<SatelliteData['type'], number> {
    // Smart distribution of selection budget
    const alwaysIncludeCount = 20; // High-priority satellites
    const remaining = maxCount - alwaysIncludeCount;

    return {
      space_station: 10,
      scientific: 8,
      gps_satellite: Math.floor(remaining * 0.3), // ~24
      weather: Math.floor(remaining * 0.15), // ~12
      communication: Math.floor(remaining * 0.15), // ~12
      starlink: Math.floor(remaining * 0.25), // ~20
      military: Math.floor(remaining * 0.1), // ~8
      other: Math.floor(remaining * 0.05), // ~4
      debris: 2 // Just a few for education
    };
  }

  private selectFromCategory(category: SatelliteData['type'], target: number, alreadySelected: Set<string>): string[] {
    const candidates = Array.from(this.satelliteCache.entries())
      .filter(([id, satellite]) => satellite.type === category && !alreadySelected.has(id))
      .sort(([, a], [, b]) => b.priority - a.priority) // Sort by priority descending
      .slice(0, target)
      .map(([id]) => id);

    return candidates;
  }

  private estimatePosition(tle: CelesTrakTLE, timeMs: number): { lat: number; lng: number } {
    // MVP: Simplified position estimation
    // Production would use SGP4 orbital mechanics library
    
    const timeHours = timeMs / (1000 * 60 * 60);
    const orbitalPeriod = 24 / tle.MEAN_MOTION; // hours per orbit
    const orbitalProgress = (timeHours % orbitalPeriod) / orbitalPeriod; // 0-1

    // Distribute based on inclination and orbital progress
    const maxLat = Math.min(tle.INCLINATION, 85);
    const lat = maxLat * Math.sin(orbitalProgress * 2 * Math.PI) * (Math.random() > 0.5 ? 1 : -1);
    const lng = (orbitalProgress * 360 - 180) + (Math.random() - 0.5) * 20; // Add some randomness

    return { lat, lng };
  }

  private calculateAltitudeFromMeanMotion(meanMotion: number): number {
    // Convert mean motion (revolutions per day) to altitude
    const period = 1440 / meanMotion; // Period in minutes
    const semiMajorAxis = Math.pow((period * 60) / (2 * Math.PI), 2) * 3.986004418e14; // GM of Earth
    const radius = Math.pow(semiMajorAxis, 1/3);
    return Math.max(100, (radius - 6371000) / 1000); // Altitude in km above Earth's surface
  }

  private convertToCartesian(lat: number, lng: number, altitude: number): { x: number; y: number; z: number } {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const earthRadius = 6371; // km
    const radius = earthRadius + altitude;

    return {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.cos(phi),
      z: radius * Math.sin(phi) * Math.sin(theta)
    };
  }

  private estimateVelocity(altitude: number): number {
    // Orbital velocity = sqrt(GM/r) where r = earth_radius + altitude
    const GM = 3.986004418e14; // m³/s²
    const earthRadius = 6371000; // m
    const radius = earthRadius + (altitude * 1000);
    return Math.sqrt(GM / radius) / 1000; // km/s
  }

  private guessCountry(name: string): string {
    const nameUpper = name.toUpperCase();
    if (nameUpper.includes('ISS') || nameUpper.includes('ZARYA')) return 'International';
    if (nameUpper.includes('TIANGONG') || nameUpper.includes('CSS')) return 'China';
    if (nameUpper.includes('PROGRESS') || nameUpper.includes('SOYUZ')) return 'Russia';
    if (nameUpper.includes('GPS') || nameUpper.includes('USA') || nameUpper.includes('GOES')) return 'USA';
    if (nameUpper.includes('GALILEO')) return 'Europe';
    if (nameUpper.includes('GLONASS')) return 'Russia';
    if (nameUpper.includes('STARLINK')) return 'USA';
    return 'Unknown';
  }

  private getTypeDisplayName(type: SatelliteData['type']): string {
    const displayNames = {
      space_station: 'Space Station',
      gps_satellite: 'GPS Satellite',
      starlink: 'Starlink Satellite',
      communication: 'Communication Satellite',
      weather: 'Weather Satellite',
      scientific: 'Scientific Satellite',
      military: 'Military Satellite',
      debris: 'Space Debris',
      other: 'Satellite'
    };
    return displayNames[type] || 'Satellite';
  }

  private generateDescription(satellite: SatelliteData): string {
    switch (satellite.type) {
      case 'space_station':
        return `Crewed space station orbiting at ${satellite.altitude.toFixed(0)} km altitude`;
      case 'gps_satellite':
        return `Global positioning satellite providing navigation services`;
      case 'starlink':
        return `Low Earth orbit internet constellation satellite`;
      case 'scientific':
        return `Scientific research satellite conducting space observations`;
      case 'weather':
        return `Weather monitoring satellite for Earth observation`;
      case 'communication':
        return `Communication satellite providing telecommunications services`;
      default:
        return `Satellite orbiting at ${satellite.altitude.toFixed(0)} km altitude`;
    }
  }

  private logCacheStats(): void {
    const stats = this.getCacheStats();
    for (const [type, count] of Object.entries(stats.byType)) {
      console.log(`     ${type}: ${count}`);
    }
  }

  private logSelectionStats(selectedIds: string[]): void {
    const typeBreakdown: Record<string, number> = {};
    
    for (const id of selectedIds) {
      const satellite = this.satelliteCache.get(id);
      if (satellite) {
        typeBreakdown[satellite.type] = (typeBreakdown[satellite.type] || 0) + 1;
      }
    }

    console.log(`   - Selection breakdown:`);
    for (const [type, count] of Object.entries(typeBreakdown)) {
      console.log(`     ${type}: ${count}`);
    }
  }
}
