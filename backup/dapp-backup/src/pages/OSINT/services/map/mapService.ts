/**
 * OSINT Map Service
 * 
 * Provides geospatial intelligence services for the OSINT module.
 * Handles location data, map visualization, and spatial analysis.
 */

import { osintApi } from '../api/osintApi';
import osintEndpoints from '../api/endpoints';
import { createErrorDetail, ErrorDetail, ErrorUtils } from '../../types/errors';

/**
 * Geographic coordinate
 */
export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
}

/**
 * Map location with additional data
 */
export interface MapLocation {
  id: string;
  name: string;
  description: string;
  coordinates: GeoCoordinate;
  type: LocationType;
  entityIds: string[];
  confidence: number;
  activity: number; // 0-1 activity level
  events: number;   // Number of associated events
  category?: string;
  tags: string[];
}

/**
 * Location types
 */
export type LocationType = 
  | 'city'       // City or urban area
  | 'country'    // Country
  | 'region'     // Geographic region
  | 'address'    // Specific address
  | 'facility'   // Building or facility
  | 'network'    // Network infrastructure
  | 'custom';    // Custom location type

/**
 * Map layer types
 */
export type MapLayerType = 
  | 'satellite'  // Satellite imagery
  | 'terrain'    // Terrain/topography
  | 'political'  // Political boundaries
  | 'dark';      // Dark mode/night view

/**
 * Map visualization types
 */
export type MapVisualizationType = 
  | 'pins'       // Location pins
  | 'heatmap'    // Heat map visualization
  | 'connections' // Connection lines between locations
  | 'regions'    // Shaded regions
  | 'routes';    // Path routes

/**
 * Map configuration
 */
export interface MapConfig {
  center?: GeoCoordinate;
  zoom?: number;
  activeLayer: MapLayerType;
  visualizations: MapVisualizationType[];
  filters?: {
    types?: LocationType[];
    minActivity?: number;
    entityIds?: string[];
    categories?: string[];
    tags?: string[];
  };
}

/**
 * Map data result
 */
export interface MapData {
  locations: MapLocation[];
  connections: Array<{
    source: string; // Location ID
    target: string; // Location ID
    type: string;
    strength: number; // 0-1
  }>;
  boundingBox?: {
    southwest: GeoCoordinate;
    northeast: GeoCoordinate;
  };
}

/**
 * Map service for OSINT operations
 */
class MapService {
  /**
   * Get map location data
   */
  async getMapData(config: MapConfig): Promise<MapData | ErrorDetail> {
    try {
      // If in development and no real backend, return mock data
      if (process.env.NODE_ENV === 'development') {
        return this.getMockMapData(config);
      }
      
      const result = await osintApi.post<MapData>(osintEndpoints.map.locations, config);
      
      if (result.success && result.data) {
        return result.data;
      }
      
      return createErrorDetail(
        result.error || 'Failed to get map data',
        {
          code: 'API_ERROR',
          category: 'api',
          severity: 'error',
          operation: 'getMapData',
          component: 'MapService',
          recoverable: true,
          retryable: true,
          context: { config },
          userActions: [
            'Check your network connection',
            'Try with different map settings',
            'Refresh the page and try again'
          ]
        }
      );
    } catch (error) {
      console.error('Error fetching map data:', error);
      
      // In development, return empty data instead of error
      if (process.env.NODE_ENV === 'development') {
        return {
          locations: [],
          connections: []
        };
      }
      
      return createErrorDetail(
        ErrorUtils.createUserFriendlyMessage(error),
        {
          code: 'UNEXPECTED_ERROR',
          category: ErrorUtils.getErrorCategory(error),
          severity: 'error',
          operation: 'getMapData',
          component: 'MapService',
          originalError: error instanceof Error ? error : undefined,
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: true,
          retryable: true,
          context: { config },
          userActions: [
            'Check your network connection',
            'Try with different map settings',
            'Refresh the page and try again'
          ]
        }
      );
    }
  }
  
  /**
   * Search for locations
   */
  async searchLocations(query: string, config?: MapConfig): Promise<MapLocation[] | ErrorDetail> {
    try {
      // If in development and no real backend, return mock data
      if (process.env.NODE_ENV === 'development') {
        const mockData = this.getMockMapData(config || { activeLayer: 'satellite', visualizations: [] });
        return mockData.locations.filter(loc => 
          loc.name.toLowerCase().includes(query.toLowerCase()) ||
          loc.description.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      const result = await osintApi.post<MapLocation[]>(osintEndpoints.map.search, {
        query,
        config
      });
      
      if (result.success && result.data) {
        return result.data;
      }
      
      return createErrorDetail(
        result.error || `No locations found for "${query}"`,
        {
          code: 'API_ERROR',
          category: 'api',
          severity: 'warning',
          operation: 'searchLocations',
          component: 'MapService',
          recoverable: true,
          retryable: true,
          context: { query, config },
          userActions: [
            'Try a different search term',
            'Check for spelling errors',
            'Try a more general search term'
          ]
        }
      );
    } catch (error) {
      console.error('Error searching locations:', error);
      
      // In development, return empty array instead of error
      if (process.env.NODE_ENV === 'development') {
        return [];
      }
      
      return createErrorDetail(
        ErrorUtils.createUserFriendlyMessage(error),
        {
          code: 'UNEXPECTED_ERROR',
          category: ErrorUtils.getErrorCategory(error),
          severity: 'error',
          operation: 'searchLocations',
          component: 'MapService',
          originalError: error instanceof Error ? error : undefined,
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: true,
          retryable: true,
          context: { query, config },
          userActions: [
            'Check your network connection',
            'Try a different search term',
            'Refresh the page and try again'
          ]
        }
      );
    }
  }
  
  /**
   * Get details for a specific location
   */
  async getLocationDetails(locationId: string): Promise<MapLocation | ErrorDetail | null> {
    try {
      // If in development and no real backend, return mock data
      if (process.env.NODE_ENV === 'development') {
        const mockData = this.getMockMapData({ activeLayer: 'satellite', visualizations: [] });
        return mockData.locations.find(loc => loc.id === locationId) || null;
      }
      
      const result = await osintApi.get<MapLocation>(`${osintEndpoints.map.locations}/${locationId}`);
      
      if (result.success && result.data) {
        return result.data;
      }
      
      return createErrorDetail(
        result.error || `Location with ID "${locationId}" not found`,
        {
          code: 'DATA_NOT_FOUND',
          category: 'data',
          severity: 'warning',
          operation: 'getLocationDetails',
          component: 'MapService',
          recoverable: true,
          retryable: false,
          context: { locationId },
          userActions: [
            'Verify the location ID is correct',
            'Try a different location',
            'Return to the map view'
          ]
        }
      );
    } catch (error) {
      console.error('Error fetching location details:', error);
      
      // In development, return null instead of error
      if (process.env.NODE_ENV === 'development') {
        return null;
      }
      
      return createErrorDetail(
        ErrorUtils.createUserFriendlyMessage(error),
        {
          code: 'UNEXPECTED_ERROR',
          category: ErrorUtils.getErrorCategory(error),
          severity: 'error',
          operation: 'getLocationDetails',
          component: 'MapService',
          originalError: error instanceof Error ? error : undefined,
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: true,
          retryable: true,
          context: { locationId },
          userActions: [
            'Check your network connection',
            'Try a different location',
            'Refresh the page and try again'
          ]
        }
      );
    }
  }
  
  /**
   * Generate mock map data for development
   */
  private getMockMapData(config: MapConfig): MapData {
    // Create Earth Alliance themed mock locations
    const mockLocations: MapLocation[] = [
      {
        id: 'loc-1',
        name: 'Earth Alliance HQ',
        description: 'Main headquarters and command center',
        coordinates: { latitude: 38.8977, longitude: -77.0365 },
        type: 'facility',
        entityIds: ['entity-1', 'entity-2'],
        confidence: 0.99,
        activity: 0.9,
        events: 24,
        category: 'Command',
        tags: ['headquarters', 'command', 'secure']
      },
      {
        id: 'loc-2',
        name: 'Mars Colony Alpha',
        description: 'Primary Mars settlement and research station',
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        type: 'facility',
        entityIds: ['entity-3', 'entity-4'],
        confidence: 0.95,
        activity: 0.75,
        events: 17,
        category: 'Colony',
        tags: ['mars', 'research', 'settlement']
      },
      {
        id: 'loc-3',
        name: 'Lunar Defense Station',
        description: 'Orbital defense platform and monitoring station',
        coordinates: { latitude: 28.5728, longitude: -80.6490 },
        type: 'facility',
        entityIds: ['entity-5'],
        confidence: 0.92,
        activity: 0.85,
        events: 19,
        category: 'Defense',
        tags: ['lunar', 'defense', 'monitoring']
      },
      {
        id: 'loc-4',
        name: 'Pacific Research Center',
        description: 'Oceanographic research and development facility',
        coordinates: { latitude: 21.3069, longitude: -157.8583 },
        type: 'facility',
        entityIds: ['entity-6', 'entity-7'],
        confidence: 0.88,
        activity: 0.6,
        events: 12,
        category: 'Research',
        tags: ['ocean', 'research', 'development']
      },
      {
        id: 'loc-5',
        name: 'European Command',
        description: 'European regional command and operations center',
        coordinates: { latitude: 48.8566, longitude: 2.3522 },
        type: 'facility',
        entityIds: ['entity-8'],
        confidence: 0.94,
        activity: 0.7,
        events: 15,
        category: 'Command',
        tags: ['europe', 'command', 'operations']
      },
      {
        id: 'loc-6',
        name: 'Asian Intelligence Hub',
        description: 'Intelligence gathering and analysis center',
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        type: 'facility',
        entityIds: ['entity-9', 'entity-10'],
        confidence: 0.91,
        activity: 0.8,
        events: 18,
        category: 'Intelligence',
        tags: ['asia', 'intelligence', 'analysis']
      },
      {
        id: 'loc-7',
        name: 'Los Angeles Monitoring Station',
        description: 'West coast signal monitoring and interception',
        coordinates: { latitude: 34.0522, longitude: -118.2437 },
        type: 'facility',
        entityIds: ['entity-11'],
        confidence: 0.85,
        activity: 0.5,
        events: 12,
        category: 'Intelligence',
        tags: ['monitoring', 'signals', 'interception']
      }
    ];
    
    // Filter locations based on provided filters
    let filteredLocations = [...mockLocations];
    
    if (config.filters) {
      // Filter by types
      if (config.filters.types && config.filters.types.length > 0) {
        filteredLocations = filteredLocations.filter(loc => 
          config.filters!.types!.includes(loc.type)
        );
      }
      
      // Filter by minimum activity
      if (config.filters.minActivity !== undefined) {
        filteredLocations = filteredLocations.filter(loc => 
          loc.activity >= config.filters!.minActivity!
        );
      }
      
      // Filter by entity IDs
      if (config.filters.entityIds && config.filters.entityIds.length > 0) {
        filteredLocations = filteredLocations.filter(loc => 
          loc.entityIds.some(id => config.filters!.entityIds!.includes(id))
        );
      }
      
      // Filter by categories
      if (config.filters.categories && config.filters.categories.length > 0) {
        filteredLocations = filteredLocations.filter(loc => 
          loc.category && config.filters!.categories!.includes(loc.category)
        );
      }
      
      // Filter by tags
      if (config.filters.tags && config.filters.tags.length > 0) {
        filteredLocations = filteredLocations.filter(loc => 
          loc.tags.some(tag => config.filters!.tags!.includes(tag))
        );
      }
    }
    
    // Create mock connections between locations
    const mockConnections = [
      {
        source: 'loc-1', // Earth Alliance HQ
        target: 'loc-3', // Lunar Defense Station
        type: 'command',
        strength: 0.9
      },
      {
        source: 'loc-1', // Earth Alliance HQ
        target: 'loc-5', // European Command
        type: 'command',
        strength: 0.85
      },
      {
        source: 'loc-1', // Earth Alliance HQ
        target: 'loc-6', // Asian Intelligence Hub
        type: 'intelligence',
        strength: 0.8
      },
      {
        source: 'loc-1', // Earth Alliance HQ
        target: 'loc-2', // Mars Colony Alpha
        type: 'communication',
        strength: 0.75
      },
      {
        source: 'loc-3', // Lunar Defense Station
        target: 'loc-4', // Pacific Research Center
        type: 'research',
        strength: 0.7
      },
      {
        source: 'loc-5', // European Command
        target: 'loc-6', // Asian Intelligence Hub
        type: 'intelligence',
        strength: 0.85
      },
      {
        source: 'loc-4', // Pacific Research Center
        target: 'loc-7', // Los Angeles Monitoring Station
        type: 'research',
        strength: 0.65
      }
    ].filter(conn => 
      // Only include connections where both source and target are in filtered locations
      filteredLocations.some(loc => loc.id === conn.source) &&
      filteredLocations.some(loc => loc.id === conn.target)
    );
    
    // Calculate bounding box (if there are locations)
    let boundingBox = undefined;
    
    if (filteredLocations.length > 0) {
      const latitudes = filteredLocations.map(loc => loc.coordinates.latitude);
      const longitudes = filteredLocations.map(loc => loc.coordinates.longitude);
      
      boundingBox = {
        southwest: {
          latitude: Math.min(...latitudes),
          longitude: Math.min(...longitudes)
        },
        northeast: {
          latitude: Math.max(...latitudes),
          longitude: Math.max(...longitudes)
        }
      };
    }
    
    return {
      locations: filteredLocations,
      connections: mockConnections,
      boundingBox
    };
  }
}

// Create singleton instance
export const mapService = new MapService();

// Export types already declared above
