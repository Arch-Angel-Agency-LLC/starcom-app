/**
 * Threat Zone Heat Map Service
 * Week 3 Day 3: Advanced heat map processing and threat zone analysis
 * 
 * Provides:
 * - Geographic threat density clustering
 * - Heat map zone generation with adaptive resolution
 * - Threat intensity calculations
 * - Regional threat analysis
 * - Temporal heat map evolution
 */

import type {
  CyberThreatData,
  ThreatHeatMapPoint,
  ThreatCategory,
  ConfidenceLevel
} from '../../types/CyberThreats';

import type {
  GeoCoordinate
} from '../../types/CyberCommandVisualization';

// =============================================================================
// INTERFACES
// =============================================================================

export interface EnhancedThreatHeatMapPoint extends ThreatHeatMapPoint {
  id: string;
  intensity: number; // 0-1 calculated intensity
  radius: number; // visualization radius
  confidence_average: number;
  last_updated: Date;
}

export interface ThreatZone {
  id: string;
  center: GeoCoordinate;
  radius: number; // in kilometers
  threatLevel: number; // 0-10 scale
  threatCount: number;
  primaryCategories: ThreatCategory[];
  averageConfidence: number;
  riskScore: number;
  lastUpdated: Date;
  threats: CyberThreatData[];
}

export interface HeatMapConfig {
  resolution: number; // Grid resolution (degrees)
  minRadius: number; // Minimum zone radius (km)
  maxRadius: number; // Maximum zone radius (km)
  intensityThreshold: number; // Minimum intensity to include
  temporalWeight: number; // How much to weight recent threats (0-1)
  confidenceWeight: number; // How much confidence affects intensity (0-1)
  severityWeight: number; // How much severity affects intensity (0-1)
}

export interface RegionalAnalysis {
  region: string;
  totalThreats: number;
  averageSeverity: number;
  dominantCategories: ThreatCategory[];
  riskTrend: 'increasing' | 'decreasing' | 'stable';
  zones: ThreatZone[];
  correlations: string[]; // Related threat patterns
}

export interface HeatMapEvolution {
  timestamp: Date;
  heatMapPoints: EnhancedThreatHeatMapPoint[];
  zones: ThreatZone[];
  globalMetrics: {
    totalThreats: number;
    averageIntensity: number;
    hottestZone: ThreatZone | null;
    emergingThreats: CyberThreatData[];
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_HEATMAP_CONFIG: HeatMapConfig = {
  resolution: 1.0, // 1 degree grid
  minRadius: 10,   // 10km minimum
  maxRadius: 200,  // 200km maximum
  intensityThreshold: 0.1,
  temporalWeight: 0.4,
  confidenceWeight: 0.3,
  severityWeight: 0.3
};

const GEOGRAPHIC_REGIONS = {
  'North America': { lat: [25, 75], lng: [-170, -50] },
  'Europe': { lat: [35, 75], lng: [-15, 45] },
  'Asia Pacific': { lat: [-50, 50], lng: [60, 180] },
  'Middle East': { lat: [15, 45], lng: [25, 70] },
  'Africa': { lat: [-35, 35], lng: [-20, 55] },
  'South America': { lat: [-60, 15], lng: [-85, -35] }
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate distance between two geographic coordinates using Haversine formula
 */
function calculateDistance(coord1: GeoCoordinate, coord2: GeoCoordinate): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLng = toRadians(coord2.longitude - coord1.longitude);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) * Math.cos(toRadians(coord2.latitude)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate temporal weight based on threat age
 */
function calculateTemporalWeight(threatDate: Date, config: HeatMapConfig): number {
  const now = new Date();
  const ageInHours = (now.getTime() - threatDate.getTime()) / (1000 * 60 * 60);
  const maxAge = 168; // 1 week in hours
  
  // Exponential decay with configurable weight
  const rawWeight = Math.exp(-ageInHours / (maxAge * config.temporalWeight));
  return Math.max(0.1, rawWeight); // Minimum 10% weight
}

/**
 * Calculate threat intensity based on multiple factors
 */
function calculateThreatIntensity(threat: CyberThreatData, config: HeatMapConfig): number {
  const severityComponent = (threat.severity / 10) * config.severityWeight;
  const confidenceComponent = getConfidenceValue(threat.confidence) * config.confidenceWeight;
  const temporalComponent = calculateTemporalWeight(threat.first_seen, config) * config.temporalWeight;
  
  return Math.min(1.0, severityComponent + confidenceComponent + temporalComponent);
}

function getConfidenceValue(confidence: ConfidenceLevel): number {
  switch (confidence) {
    case 'Low': return 0.25;
    case 'Medium': return 0.5;
    case 'High': return 0.75;
    case 'Confirmed': return 1.0;
    default: return 0.1;
  }
}

/**
 * Determine which geographic region a coordinate belongs to
 */
function getGeographicRegion(coord: GeoCoordinate): string {
  for (const [region, bounds] of Object.entries(GEOGRAPHIC_REGIONS)) {
    if (coord.latitude >= bounds.lat[0] && coord.latitude <= bounds.lat[1] &&
        coord.longitude >= bounds.lng[0] && coord.longitude <= bounds.lng[1]) {
      return region;
    }
  }
  return 'Other';
}

// =============================================================================
// MAIN SERVICE CLASS
// =============================================================================

export class ThreatZoneHeatMapService {
  private config: HeatMapConfig;
  private cachedZones: Map<string, ThreatZone[]> = new Map();
  private cachedHeatMaps: Map<string, EnhancedThreatHeatMapPoint[]> = new Map();
  private evolutionHistory: HeatMapEvolution[] = [];

  constructor(config: Partial<HeatMapConfig> = {}) {
    this.config = { ...DEFAULT_HEATMAP_CONFIG, ...config };
  }

  // =============================================================================
  // HEAT MAP GENERATION
  // =============================================================================

  /**
   * Generate threat heat map with adaptive resolution
   */
  generateAdvancedHeatMap(threats: CyberThreatData[]): EnhancedThreatHeatMapPoint[] {
    const cacheKey = this.generateCacheKey(threats);
    
    if (this.cachedHeatMaps.has(cacheKey)) {
      return this.cachedHeatMaps.get(cacheKey)!;
    }

    const heatMapPoints: EnhancedThreatHeatMapPoint[] = [];
    const gridSize = this.config.resolution;
    
    // Create spatial grid
    const grid = new Map<string, {
      threats: CyberThreatData[];
      totalIntensity: number;
      center: GeoCoordinate;
    }>();

    // Group threats by grid cells
    threats.forEach(threat => {
      if (!threat.location) return;

      const gridX = Math.floor(threat.location.longitude / gridSize) * gridSize;
      const gridY = Math.floor(threat.location.latitude / gridSize) * gridSize;
      const gridKey = `${gridX}_${gridY}`;

      if (!grid.has(gridKey)) {
        grid.set(gridKey, {
          threats: [],
          totalIntensity: 0,
          center: {
            latitude: gridY + gridSize / 2,
            longitude: gridX + gridSize / 2
          }
        });
      }

      const cell = grid.get(gridKey)!;
      cell.threats.push(threat);
      cell.totalIntensity += calculateThreatIntensity(threat, this.config);
    });

    // Convert grid cells to heat map points
    grid.forEach((cell, gridKey) => {
      if (cell.totalIntensity >= this.config.intensityThreshold) {
        const point: EnhancedThreatHeatMapPoint = {
          id: `heatmap_${gridKey}`,
          location: cell.center,
          intensity: Math.min(1.0, cell.totalIntensity / cell.threats.length),
          threat_density: cell.threats.length,
          radius: this.calculateAdaptiveRadius(cell.threats.length),
          threat_categories: this.extractDominantCategories(cell.threats),
          active_threats: cell.threats.length,
          avg_severity: cell.threats.reduce((sum, t) => sum + t.severity, 0) / cell.threats.length,
          confidence_average: this.calculateAverageConfidence(cell.threats),
          last_updated: new Date()
        };

        heatMapPoints.push(point);
      }
    });

    // Apply smoothing and interpolation
    const smoothedPoints = this.applySpatialSmoothing(heatMapPoints);
    
    this.cachedHeatMaps.set(cacheKey, smoothedPoints);
    return smoothedPoints;
  }

  /**
   * Generate threat zones with clustering analysis
   */
  generateThreatZones(threats: CyberThreatData[]): ThreatZone[] {
    const cacheKey = this.generateCacheKey(threats);
    
    if (this.cachedZones.has(cacheKey)) {
      return this.cachedZones.get(cacheKey)!;
    }

    // Use DBSCAN-like clustering
    const zones: ThreatZone[] = [];
    const processed = new Set<string>();
    
    threats.forEach(threat => {
      if (!threat.location || processed.has(threat.id)) return;

      const cluster = this.findCluster(threat, threats, processed);
      if (cluster.length >= 2) { // Minimum cluster size
        const zone = this.createThreatZone(cluster);
        zones.push(zone);
      }
    });

    // Sort zones by risk score
    zones.sort((a, b) => b.riskScore - a.riskScore);
    
    this.cachedZones.set(cacheKey, zones);
    return zones;
  }

  /**
   * Perform regional threat analysis
   */
  analyzeRegionalThreats(threats: CyberThreatData[]): RegionalAnalysis[] {
    const regionMap = new Map<string, CyberThreatData[]>();
    
    // Group threats by region
    threats.forEach(threat => {
      if (!threat.location) return;
      
      const region = getGeographicRegion(threat.location);
      if (!regionMap.has(region)) {
        regionMap.set(region, []);
      }
      regionMap.get(region)!.push(threat);
    });

    // Analyze each region
    const analyses: RegionalAnalysis[] = [];
    regionMap.forEach((regionThreats, region) => {
      const analysis = this.analyzeRegion(region, regionThreats);
      analyses.push(analysis);
    });

    return analyses.sort((a, b) => b.totalThreats - a.totalThreats);
  }

  /**
   * Track heat map evolution over time
   */
  trackHeatMapEvolution(threats: CyberThreatData[]): HeatMapEvolution {
    const heatMapPoints = this.generateAdvancedHeatMap(threats);
    const zones = this.generateThreatZones(threats);
    
    const evolution: HeatMapEvolution = {
      timestamp: new Date(),
      heatMapPoints,
      zones,
      globalMetrics: {
        totalThreats: threats.length,
        averageIntensity: this.calculateAverageIntensity(heatMapPoints),
        hottestZone: zones.length > 0 ? zones[0] : null,
        emergingThreats: this.identifyEmergingThreats(threats)
      }
    };

    // Keep evolution history (last 24 entries = 24 hours if updated hourly)
    this.evolutionHistory.push(evolution);
    if (this.evolutionHistory.length > 24) {
      this.evolutionHistory.shift();
    }

    return evolution;
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private calculateAdaptiveRadius(threatCount: number): number {
    const baseRadius = this.config.minRadius;
    const maxRadius = this.config.maxRadius;
    const scaleFactor = Math.log(threatCount + 1) / Math.log(100); // Log scale
    
    return Math.min(maxRadius, baseRadius + (maxRadius - baseRadius) * scaleFactor);
  }

  private extractDominantCategories(threats: CyberThreatData[]): ThreatCategory[] {
    const categoryCount = new Map<ThreatCategory, number>();
    
    threats.forEach(threat => {
      categoryCount.set(threat.category, (categoryCount.get(threat.category) || 0) + 1);
    });

    return Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);
  }

  private calculateAverageConfidence(threats: CyberThreatData[]): number {
    if (threats.length === 0) return 0;
    
    const totalConfidence = threats.reduce((sum, threat) => {
      return sum + getConfidenceValue(threat.confidence);
    }, 0);
    
    return totalConfidence / threats.length;
  }

  private applySpatialSmoothing(points: EnhancedThreatHeatMapPoint[]): EnhancedThreatHeatMapPoint[] {
    // Apply Gaussian smoothing to reduce noise
    return points.map(point => ({
      ...point,
      intensity: this.calculateSmoothedIntensity(point, points)
    }));
  }

  private calculateSmoothedIntensity(targetPoint: EnhancedThreatHeatMapPoint, allPoints: EnhancedThreatHeatMapPoint[]): number {
    let weightedSum = 0;
    let totalWeight = 0;
    const smoothingRadius = 2.0; // degrees

    allPoints.forEach(point => {
      const distance = calculateDistance(targetPoint.location, point.location);
      if (distance <= smoothingRadius * 111) { // Convert degrees to km (approx)
        const weight = Math.exp(-(distance * distance) / (2 * smoothingRadius * smoothingRadius));
        weightedSum += point.intensity * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? weightedSum / totalWeight : targetPoint.intensity;
  }

  private findCluster(centerThreat: CyberThreatData, allThreats: CyberThreatData[], processed: Set<string>): CyberThreatData[] {
    const cluster: CyberThreatData[] = [centerThreat];
    processed.add(centerThreat.id);
    const clusterRadius = 50; // 50km radius

    allThreats.forEach(threat => {
      if (processed.has(threat.id) || !threat.location || !centerThreat.location) return;

      const distance = calculateDistance(centerThreat.location, threat.location);
      if (distance <= clusterRadius) {
        cluster.push(threat);
        processed.add(threat.id);
      }
    });

    return cluster;
  }

  private createThreatZone(threats: CyberThreatData[]): ThreatZone {
    // Calculate centroid
    const center = this.calculateCentroid(threats);
    const maxDistance = Math.max(...threats.map(t => 
      t.location ? calculateDistance(center, t.location) : 0
    ));

    const averageSeverity = threats.reduce((sum, t) => sum + t.severity, 0) / threats.length;
    const averageConfidence = this.calculateAverageConfidence(threats);
    const riskScore = (averageSeverity / 10) * averageConfidence * Math.log(threats.length + 1);

    return {
      id: `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      center,
      radius: Math.max(this.config.minRadius, maxDistance),
      threatLevel: Math.min(10, averageSeverity),
      threatCount: threats.length,
      primaryCategories: this.extractDominantCategories(threats),
      averageConfidence,
      riskScore,
      lastUpdated: new Date(),
      threats
    };
  }

  private calculateCentroid(threats: CyberThreatData[]): GeoCoordinate {
    const validThreats = threats.filter(t => t.location);
    if (validThreats.length === 0) {
      return { latitude: 0, longitude: 0 };
    }

    const totalLat = validThreats.reduce((sum, t) => sum + t.location!.latitude, 0);
    const totalLng = validThreats.reduce((sum, t) => sum + t.location!.longitude, 0);

    return {
      latitude: totalLat / validThreats.length,
      longitude: totalLng / validThreats.length
    };
  }

  private analyzeRegion(region: string, threats: CyberThreatData[]): RegionalAnalysis {
    const zones = this.generateThreatZones(threats);
    const averageSeverity = threats.reduce((sum, t) => sum + t.severity, 0) / threats.length;
    
    return {
      region,
      totalThreats: threats.length,
      averageSeverity,
      dominantCategories: this.extractDominantCategories(threats),
      riskTrend: this.calculateRiskTrend(region),
      zones,
      correlations: this.findThreatCorrelations(threats)
    };
  }

  private calculateRiskTrend(_region: string): 'increasing' | 'decreasing' | 'stable' {
    // Simplified trend analysis - in real implementation, this would analyze historical data
    return 'stable';
  }

  private findThreatCorrelations(threats: CyberThreatData[]): string[] {
    // Simplified correlation analysis
    const correlations: string[] = [];
    const categoryGroups = new Map<ThreatCategory, number>();
    
    threats.forEach(threat => {
      categoryGroups.set(threat.category, (categoryGroups.get(threat.category) || 0) + 1);
    });

    if ((categoryGroups.get('Malware') || 0) > 5 && (categoryGroups.get('Phishing') || 0) > 3) {
      correlations.push('Coordinated malware distribution campaign');
    }

    return correlations;
  }

  private calculateAverageIntensity(points: EnhancedThreatHeatMapPoint[]): number {
    if (points.length === 0) return 0;
    return points.reduce((sum, p) => sum + p.intensity, 0) / points.length;
  }

  private identifyEmergingThreats(threats: CyberThreatData[]): CyberThreatData[] {
    const recentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    return threats.filter(threat => threat.first_seen > recentThreshold)
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 10);
  }

  private generateCacheKey(threats: CyberThreatData[]): string {
    // Simple cache key based on threat count and configuration
    const threatHash = threats.length.toString();
    const configHash = JSON.stringify(this.config);
    return `${threatHash}_${btoa(configHash).slice(0, 10)}`;
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  /**
   * Get heat map evolution history
   */
  getEvolutionHistory(): HeatMapEvolution[] {
    return [...this.evolutionHistory];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<HeatMapConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.clearCache();
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cachedZones.clear();
    this.cachedHeatMaps.clear();
  }

  /**
   * Get current configuration
   */
  getConfig(): HeatMapConfig {
    return { ...this.config };
  }
}
