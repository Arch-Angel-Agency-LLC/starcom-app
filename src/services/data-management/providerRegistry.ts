// Centralized Provider Registry and Setup
// AI-NOTE: Single entry point to register all data providers with StarcomDataManager

import { StarcomDataManager } from './StarcomDataManager';
import { DataSource } from './interfaces';

// Import all providers
import { EIADataProvider } from './providers/EIADataProvider';
import { NOAADataProvider } from './providers/NOAADataProvider';
import { WeatherDataProvider } from './providers/WeatherDataProvider';
import { AlertsDataProvider } from './providers/AlertsDataProvider';
import { GeoEventsDataProvider } from './providers/GeoEventsDataProvider';
import { SpaceAssetsDataProvider } from './providers/SpaceAssetsDataProvider';
import { IntelDataProvider } from './providers/IntelDataProvider';

// Import cache services
import { EIADataCacheService } from '../eia/EIADataCacheService';
import { SpaceWeatherCacheService } from '../SpaceWeatherCacheService';

// Temporary basic cache implementation for other providers
// TODO: Implement Nostr relay load balancing and automatic failover - PRIORITY: HIGH
// TODO: Add support for Nostr event filtering and subscription optimization - PRIORITY: MEDIUM
class BasicCacheService {
  private cache = new Map<string, { value: unknown; expiresAt?: number }>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: unknown, ttl?: number): void {
    const expiresAt = ttl ? Date.now() + ttl : Date.now() + BasicCacheService.DEFAULT_TTL;
    this.cache.set(key, { value, expiresAt });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  getMetadata() {
    return null;
  }

  getSize(): number {
    return this.cache.size;
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Register all data providers with the StarcomDataManager
 * This is the central place to configure all data sources
 */
export async function setupDataProviders(manager: StarcomDataManager): Promise<void> {
  console.log('🚀 Setting up Starcom Data Providers...');

  try {
    // 1. EIA Data Provider (Energy Information Administration)
    const eiaProvider = new EIADataProvider();
    const eiaCache = new EIADataCacheService();
    
    const eiaSource: DataSource = {
      id: 'eia',
      name: 'Energy Information Administration',
      provider: eiaProvider,
      cache: eiaCache,
      category: 'energy',
      updateInterval: 300000, // 5 minutes
      priority: 'normal',
      metadata: {
        description: 'US Energy Information Administration data including electricity, natural gas, and petroleum',
        tags: ['energy', 'electricity', 'natural-gas', 'petroleum', 'eia'],
        dataTypes: ['time-series', 'regional', 'forecasts'],
        coverage: {
          geographic: 'United States',
          temporal: 'Real-time to historical',
          resolution: 'Hourly, Daily, Monthly'
        }
      }
    };
    
    await manager.registerDataSource(eiaSource);

    // 2. NOAA Data Provider (Space Weather)
    const noaaProvider = new NOAADataProvider();
    const noaaCache = new SpaceWeatherCacheService();
    
    const noaaSource: DataSource = {
      id: 'noaa',
      name: 'NOAA Space Weather Service',
      provider: noaaProvider,
      cache: noaaCache,
      category: 'space-weather',
      updateInterval: 300000, // 5 minutes
      priority: 'high',
      metadata: {
        description: 'NOAA Space Weather data including electric fields, geomagnetic conditions, and solar activity',
        tags: ['space-weather', 'geomagnetic', 'solar', 'electric-field', 'noaa'],
        dataTypes: ['real-time', 'electric-field-vectors', 'indices'],
        coverage: {
          geographic: 'Global and North America',
          temporal: '60-second cadence',
          resolution: 'Station-based measurements'
        }
      }
    };
    
    await manager.registerDataSource(noaaSource);

    // 3. Weather Data Provider
    const weatherProvider = new WeatherDataProvider();
    const weatherCache = new BasicCacheService();
    
    const weatherSource: DataSource = {
      id: 'weather',
      name: 'Weather Data Service',
      provider: weatherProvider,
      cache: weatherCache,
      category: 'weather',
      updateInterval: 600000, // 10 minutes
      priority: 'normal',
      metadata: {
        description: 'Current weather conditions, forecasts, and meteorological data',
        tags: ['weather', 'temperature', 'precipitation', 'forecast'],
        dataTypes: ['current-conditions', 'forecasts', 'historical'],
        coverage: {
          geographic: 'Global',
          temporal: 'Real-time and forecasts',
          resolution: 'City-level'
        }
      }
    };
    
    await manager.registerDataSource(weatherSource);

    // 4. Alerts Data Provider
    const alertsProvider = new AlertsDataProvider();
    const alertsCache = new BasicCacheService();
    
    const alertsSource: DataSource = {
      id: 'alerts',
      name: 'Alerts and Notifications Service',
      provider: alertsProvider,
      cache: alertsCache,
      category: 'other', // Use 'other' since 'alerts' is not in the enum
      updateInterval: 60000, // 1 minute for alerts
      priority: 'critical',
      metadata: {
        description: 'Emergency alerts, weather warnings, and system notifications',
        tags: ['alerts', 'warnings', 'emergency', 'notifications'],
        dataTypes: ['real-time-alerts', 'weather-warnings', 'system-alerts'],
        coverage: {
          geographic: 'Regional and Global',
          temporal: 'Real-time',
          resolution: 'Event-based'
        }
      }
    };
    
    await manager.registerDataSource(alertsSource);

    // 5. GeoEvents Data Provider
    const geoEventsProvider = new GeoEventsDataProvider();
    const geoEventsCache = new BasicCacheService();
    
    const geoEventsSource: DataSource = {
      id: 'geo-events',
      name: 'Natural Events and Disasters Service',
      provider: geoEventsProvider,
      cache: geoEventsCache,
      category: 'other', // Use 'other' since 'geo-events' is not in the enum
      updateInterval: 300000, // 5 minutes
      priority: 'high',
      metadata: {
        description: 'Natural disasters, earthquakes, volcanic activity, and environmental events',
        tags: ['earthquakes', 'volcanoes', 'wildfires', 'natural-disasters', 'usgs'],
        dataTypes: ['earthquake-data', 'volcanic-activity', 'wildfire-detection'],
        coverage: {
          geographic: 'Global',
          temporal: 'Real-time',
          resolution: 'Event-based with coordinates'
        }
      }
    };
    
    await manager.registerDataSource(geoEventsSource);

    // 6. Space Assets Data Provider
    const spaceAssetsProvider = new SpaceAssetsDataProvider();
    const spaceAssetsCache = new BasicCacheService();
    
    const spaceAssetsSource: DataSource = {
      id: 'space-assets',
      name: 'Satellite and Space Assets Service',
      provider: spaceAssetsProvider,
      cache: spaceAssetsCache,
      category: 'other', // Use 'other' since 'space-assets' is not in the enum
      updateInterval: 60000, // 1 minute for fast-moving objects
      priority: 'normal',
      metadata: {
        description: 'Satellite tracking, space debris monitoring, and orbital asset data',
        tags: ['satellites', 'space-debris', 'orbital-data', 'celestrak', 'n2yo'],
        dataTypes: ['tle-data', 'satellite-positions', 'orbital-elements'],
        coverage: {
          geographic: 'Global (orbital)',
          temporal: 'Real-time tracking',
          resolution: 'Individual objects'
        }
      }
    };
    
    await manager.registerDataSource(spaceAssetsSource);

    // 7. Intel Data Provider (Intelligence Reports)
    const intelProvider = new IntelDataProvider();
    const intelCache = new BasicCacheService();
    
    const intelSource: DataSource = {
      id: 'intel',
      name: 'Intelligence Reports Service',
      provider: intelProvider,
      cache: intelCache,
      category: 'intelligence',
      updateInterval: 300000, // 5 minutes
      priority: 'high',
      metadata: {
        description: 'Intelligence reports from Solana blockchain and other sources',
        tags: ['intelligence', 'sigint', 'humint', 'geoint', 'solana', 'blockchain'],
        dataTypes: ['intel-reports', 'intelligence-summaries', 'metrics'],
        coverage: {
          geographic: 'Global',
          temporal: 'Real-time submissions',
          resolution: 'Report-based'
        }
      }
    };
    
    await manager.registerDataSource(intelSource);

    console.log('✅ All data providers registered successfully');
    console.log(`📊 Total providers: ${manager.listDataSources().length}`);
    
    // Log provider categories
    const categories = [...new Set(manager.listDataSources().map(s => s.category))];
    console.log(`📋 Categories: ${categories.join(', ')}`);

  } catch (error) {
    console.error('❌ Failed to setup data providers:', error);
    throw error;
  }
}

/**
 * Get a pre-configured StarcomDataManager instance with all providers
 */
export async function createConfiguredDataManager(): Promise<StarcomDataManager> {
  const manager = new StarcomDataManager();
  await setupDataProviders(manager);
  return manager;
}

/**
 * Quick access to commonly used data fetching patterns
 */
export class DataManagerHelpers {
  constructor(private manager: StarcomDataManager) {}

  // Space weather data
  async getSpaceWeatherData() {
    return {
      interMag: await this.manager.fetchData('noaa', 'electric-field-intermag'),
      usCanada: await this.manager.fetchData('noaa', 'electric-field-us-canada'),
      geomagnetic: await this.manager.fetchData('noaa', 'geomagnetic-conditions'),
      solar: await this.manager.fetchData('noaa', 'solar-activity')
    };
  }

  // Natural events data
  async getNaturalEventsData() {
    return {
      earthquakes: await this.manager.fetchData('geo-events', 'earthquakes-recent'),
      wildfires: await this.manager.fetchData('geo-events', 'wildfires-viirs'),
      volcanoes: await this.manager.fetchData('geo-events', 'volcanoes')
    };
  }

  // Space assets data
  async getSpaceAssetsData() {
    return {
      activeSatellites: await this.manager.fetchData('space-assets', 'active-satellites'),
      spaceStations: await this.manager.fetchData('space-assets', 'space-stations'),
      starlink: await this.manager.fetchData('space-assets', 'starlink'),
      debris: await this.manager.fetchData('space-assets', 'debris-high-interest')
    };
  }

  // Intelligence data
  async getIntelligenceData() {
    return {
  reports: await this.manager.fetchData('intel', 'intel-ui'),
      summary: await this.manager.fetchData('intel', 'intel-summary'),
      metrics: await this.manager.fetchData('intel', 'intel-metrics')
    };
  }

  // Weather and alerts
  async getWeatherAndAlerts() {
    return {
      weather: await this.manager.fetchData('weather', 'current-conditions'),
      alerts: await this.manager.fetchData('alerts', 'active-alerts'),
      severe: await this.manager.fetchData('alerts', 'severe-weather')
    };
  }

  // Energy data
  async getEnergyData() {
    return {
      electricity: await this.manager.fetchData('eia', 'electricity-demand'),
      natural_gas: await this.manager.fetchData('eia', 'natural-gas-storage'),
      petroleum: await this.manager.fetchData('eia', 'petroleum-stocks')
    };
  }
}

export { StarcomDataManager };
