// Enhanced NOAA Data Provider for comprehensive space weather monitoring
// Supports priority-based data fetching: primary, secondary, and tertiary datasets
// Migrated and expanded from original noaaSpaceWeather.ts

import { 
  DataProvider, 
  DataServiceObserver, 
  EndpointConfig, 
  FetchOptions 
} from '../interfaces';
import { 
  SpaceWeatherAlert,
  ProcessedElectricFieldData
} from '../../../types';
import {
  NOAADataTypes,
  NOAASolarXRayData,
  NOAASolarFlareEvent,
  NOAAGeomagneticKpData,
  NOAAGeomagneticDstData,
  NOAASolarWindPlasmaData,
  NOAASolarWindMagneticData,
  NOAAMagnetometerData,
  NOAAIntegralParticleData,
  NOAADifferentialParticleData,
  NOAACosmicRayData,
  NOAAElectricFieldData,
  NOAAACEEPAMData,
  NOAASpaceWeatherSummary
} from './NOAADataTypes';
import {
  NOAA_DATA_PRIORITIES,
  NOAAEndpointConfig,
  getDatasetById,
  getDatasetsByPriority,
  getPriorityFetchOrder,
  getIndependentDatasets,
  getDependentDatasets
} from './NOAADataConfig';
import { spaceWeatherDiagnostics } from '../../space-weather/SpaceWeatherDiagnostics';

export class NOAADataProvider implements DataProvider<NOAADataTypes> {
  readonly id: string = 'noaa-space-weather';
  readonly name: string = 'NOAA Space Weather Data Provider';
  
  // Dynamic endpoints based on priority configuration
  readonly endpoints: EndpointConfig[] = [];
  
  private observer?: DataServiceObserver;
  private dataCache = new Map<string, { data: NOAADataTypes; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  constructor() {
    // Initialize endpoints from configuration
    this.initializeEndpoints();
  }

  private initializeEndpoints(): void {
    const allDatasets = [
      ...NOAA_DATA_PRIORITIES.primary,
      ...NOAA_DATA_PRIORITIES.secondary,
      ...NOAA_DATA_PRIORITIES.tertiary
    ];

    this.endpoints.length = 0; // Clear existing
    
    for (const dataset of allDatasets) {
      this.endpoints.push({
        id: dataset.id,
        url: dataset.url,
        method: 'GET'
      });
    }
  }

  async fetchData(key: string, options: FetchOptions = {}): Promise<NOAADataTypes> {
    this.observer?.onFetchStart?.(key, this.id);
    const startTime = performance.now();

    try {
      // Check cache first
      const cached = this.getCachedData(key);
      if (cached && !options.forceRefresh) {
        const duration = performance.now() - startTime;
        this.observer?.onFetchEnd?.(key, duration, this.id);
        this.recordProviderMetric(key, duration, true);
        return cached;
      }

      const dataset = getDatasetById(key);
      if (!dataset) {
        throw new Error(`Unknown NOAA dataset: ${key}`);
      }

      let data: NOAADataTypes;

      // Route to appropriate fetch method based on data type
      switch (dataset.dataType) {
        case 'solar_radiation':
          data = await this.fetchSolarRadiationData(key, dataset);
          break;
        case 'solar_events':
          data = await this.fetchSolarEventsData(key, dataset);
          break;
        case 'geomagnetic':
          data = await this.fetchGeomagneticData(key, dataset);
          break;
        case 'solar_wind':
          data = await this.fetchSolarWindData(key, dataset);
          break;
        case 'magnetosphere':
          data = await this.fetchMagnetosphereData(key, dataset);
          break;
        case 'particle_radiation':
          data = await this.fetchParticleRadiationData(key, dataset);
          break;
        case 'cosmic_rays':
          data = await this.fetchCosmicRayData(key, dataset);
          break;
        case 'electric_field':
          data = await this.fetchElectricFieldData(key, dataset);
          break;
        case 'particle_detailed':
          data = await this.fetchDetailedParticleData(key, dataset);
          break;
        default:
          throw new Error(`Unsupported data type: ${dataset.dataType}`);
      }

      // Cache the result
      this.setCachedData(key, data);

      const duration = performance.now() - startTime;
      this.observer?.onFetchEnd?.(key, duration, this.id);
      this.recordProviderMetric(key, duration, true);

      return data;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.observer?.onFetchEnd?.(key, duration, this.id);
      this.observer?.onError?.(key, error as Error, this.id);
      const message = error instanceof Error ? error.message : 'unknown error';
      this.recordProviderMetric(key, duration, false, message);
      throw error;
    }
  }

  // Priority-based fetch methods
  async fetchPrimaryData(options: FetchOptions = {}): Promise<Record<string, NOAADataTypes>> {
    const primaryKeys = getDatasetsByPriority('primary').map(d => d.id);
    return this.fetchMultipleDatasets(primaryKeys, options);
  }

  async fetchSecondaryData(options: FetchOptions = {}): Promise<Record<string, NOAADataTypes>> {
    const secondaryKeys = getDatasetsByPriority('secondary').map(d => d.id);
    return this.fetchMultipleDatasets(secondaryKeys, options);
  }

  async fetchTertiaryData(options: FetchOptions = {}): Promise<Record<string, NOAADataTypes>> {
    const tertiaryKeys = getDatasetsByPriority('tertiary').map(d => d.id);
    return this.fetchMultipleDatasets(tertiaryKeys, options);
  }

  async fetchAllData(options: FetchOptions = {}): Promise<Record<string, NOAADataTypes>> {
    const allKeys = getPriorityFetchOrder();
    return this.fetchMultipleDatasets(allKeys, options);
  }

  private async fetchMultipleDatasets(
    keys: string[], 
    options: FetchOptions = {}
  ): Promise<Record<string, NOAADataTypes>> {
    const results: Record<string, NOAADataTypes> = {};
    const independent = getIndependentDatasets();
    const dependent = getDependentDatasets();

    // Fetch independent datasets in parallel
    const independentKeys = keys.filter(key => independent.includes(key));
    const independentPromises = independentKeys.map(async (key) => {
      try {
        const data = await this.fetchData(key, options);
        results[key] = data;
      } catch (error) {
        console.warn(`Failed to fetch independent dataset ${key}:`, error);
      }
    });

    await Promise.all(independentPromises);

    // Fetch dependent datasets sequentially
    const dependentKeys = keys.filter(key => key in dependent);
    for (const key of dependentKeys) {
      try {
        // Check if dependencies are satisfied
        const dependencies = dependent[key];
        const dependenciesSatisfied = dependencies.every(dep => dep in results);
        
        if (dependenciesSatisfied) {
          const data = await this.fetchData(key, options);
          results[key] = data;
        } else {
          console.warn(`Skipping ${key} - dependencies not satisfied:`, dependencies);
        }
      } catch (error) {
        console.warn(`Failed to fetch dependent dataset ${key}:`, error);
      }
    }

    return results;
  }

  // Cache management
  private getCachedData(key: string): NOAADataTypes | null {
    const cached = this.dataCache.get(key);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.cacheTimeout) {
      this.dataCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCachedData(key: string, data: NOAADataTypes): void {
    this.dataCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private recordProviderMetric(datasetId: string, durationMs: number, success: boolean, error?: string) {
    spaceWeatherDiagnostics.recordProviderMetric({
      datasetId,
      durationMs,
      success,
      error,
      timestamp: Date.now()
    });
  }

  // Specialized fetch methods for each data type
  private async fetchSolarRadiationData(key: string, dataset: NOAAEndpointConfig): Promise<NOAASolarXRayData> {
    const response = await fetch(dataset.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch solar radiation data: ${response.status}`);
    }
    
    const rawData = await response.json();
    
    if (key === 'solar-xray-flux') {
      return this.transformXRayFluxData(rawData);
    }
    
    throw new Error(`Unsupported solar radiation dataset: ${key}`);
  }

  private async fetchSolarEventsData(key: string, dataset: NOAAEndpointConfig): Promise<NOAASolarFlareEvent> {
    const response = await fetch(dataset.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch solar events data: ${response.status}`);
    }
    
    const rawData = await response.json();
    
    if (key === 'solar-xray-flares') {
      return this.transformFlareEventData(rawData);
    }
    
    throw new Error(`Unsupported solar events dataset: ${key}`);
  }

  private async fetchGeomagneticData(key: string, dataset: NOAAEndpointConfig): Promise<NOAAGeomagneticKpData | NOAAGeomagneticDstData> {
    const response = await fetch(dataset.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch geomagnetic data: ${response.status}`);
    }
    
    const rawData = await response.json();
    
    if (key.includes('kp')) {
      return this.transformKpData(rawData);
    } else if (key.includes('dst')) {
      return this.transformDstData(rawData);
    }
    
    throw new Error(`Unsupported geomagnetic dataset: ${key}`);
  }

  private async fetchSolarWindData(key: string, dataset: NOAAEndpointConfig): Promise<NOAASolarWindPlasmaData | NOAASolarWindMagneticData> {
    const response = await fetch(dataset.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch solar wind data: ${response.status}`);
    }
    
    const rawData = await response.json();
    
    if (key.includes('plasma')) {
      return this.transformSolarWindPlasmaData(rawData);
    } else if (key.includes('magnetic')) {
      return this.transformSolarWindMagneticData(rawData);
    }
    
    throw new Error(`Unsupported solar wind dataset: ${key}`);
  }

  private async fetchMagnetosphereData(_key: string, dataset: NOAAEndpointConfig): Promise<NOAAMagnetometerData> {
    const response = await fetch(dataset.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch magnetosphere data: ${response.status}`);
    }
    
    const rawData = await response.json();
    return this.transformMagnetometerData(rawData);
  }

  private async fetchParticleRadiationData(key: string, dataset: NOAAEndpointConfig): Promise<NOAAIntegralParticleData | NOAADifferentialParticleData> {
    const response = await fetch(dataset.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch particle radiation data: ${response.status}`);
    }
    
    const rawData = await response.json();
    
    if (key.includes('integral')) {
      return this.transformIntegralParticleData(rawData, key);
    } else if (key.includes('differential')) {
      return this.transformDifferentialParticleData(rawData, key);
    }
    
    throw new Error(`Unsupported particle radiation dataset: ${key}`);
  }

  private async fetchCosmicRayData(_key: string, dataset: NOAAEndpointConfig): Promise<NOAACosmicRayData> {
    const response = await fetch(dataset.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch cosmic ray data: ${response.status}`);
    }
    
    const rawData = await response.json();
    return this.transformCosmicRayData(rawData);
  }

  private async fetchElectricFieldData(key: string, dataset: NOAAEndpointConfig): Promise<NOAAElectricFieldData> {
    // Handle dynamic directory listing for electric field data
    const baseUrl = dataset.url;
    
    if (!baseUrl.endsWith('/')) {
      throw new Error('Electric field URL must end with /');
    }

    const dirResponse = await fetch(baseUrl);
    if (!dirResponse.ok) {
      throw new Error(`Failed to fetch NOAA directory: ${dirResponse.status}`);
    }

    const html = await dirResponse.text();
    
    // Extract JSON file links
    const isInterMag = key.includes('intermag');
    const filePattern = isInterMag
      ? /href="(\d{8}T\d{6}-\d{2}-Efield-empirical-EMTF-[\d.-]+x[\d.-]+\.json)"/g
      : /href="(\d{8}T\d{6}-\d{2}-Efield-US-Canada\.json)"/g;
    
    const fileMatches = Array.from(html.matchAll(filePattern));
    if (fileMatches.length === 0) {
      throw new Error(`No electric field files found for dataset: ${key}`);
    }

    // Get the latest file
    const latestFilename = fileMatches[fileMatches.length - 1][1];
    const dataUrl = `${baseUrl}${latestFilename}`;
    
    const dataResponse = await fetch(dataUrl);
    if (!dataResponse.ok) {
      throw new Error(`Failed to fetch electric field data: ${dataResponse.status}`);
    }

    const data = await dataResponse.json() as NOAAElectricFieldData;
    return {
      ...data,
      network: isInterMag ? 'InterMag' : 'US-Canada',
      time_tag: new Date().toISOString()
    };
  }

  private async fetchDetailedParticleData(_key: string, dataset: NOAAEndpointConfig): Promise<NOAAACEEPAMData> {
    const response = await fetch(dataset.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch detailed particle data: ${response.status}`);
    }
    
    const rawData = await response.json();
    return this.transformACEEPAMData(rawData);
  }

  // Data transformation methods (with proper typing)
  private transformXRayFluxData(rawData: Record<string, unknown>[]): NOAASolarXRayData {
    const latest = rawData[rawData.length - 1];
    const flux = parseFloat(String(latest.flux));
    
    return {
      time_tag: String(latest.time_tag),
      satellite: String(latest.satellite || 'GOES-16'),
      flux,
      observed_flux: flux,
      electron_correction: parseFloat(String(latest.electron_correction || '0')),
      electron_contamination: latest.electron_contamination === 'true',
      energy: String(latest.energy || '0.1-0.8nm'),
      flux_class: this.determineFlareClass(flux),
      flux_scale: this.calculateFlareScale(flux),
      data_quality: 1,
      status_flag: 'nominal'
    };
  }

  private transformFlareEventData(rawData: Record<string, unknown>[]): NOAASolarFlareEvent {
    const latest = rawData[rawData.length - 1];
    
    return {
      time_tag: String(latest.time_tag),
      event_id: String(latest.event_id || `flare-${Date.now()}`),
      begin_time: String(latest.begin_time || latest.time_tag),
      max_time: String(latest.max_time || latest.time_tag),
      end_time: latest.end_time ? String(latest.end_time) : undefined,
      class_type: String(latest.class_type || this.determineFlareClass(parseFloat(String(latest.flux)))),
      location: latest.location ? String(latest.location) : undefined,
      peak_flux: parseFloat(String(latest.flux || latest.peak_flux)),
      integrated_flux: parseFloat(String(latest.integrated_flux || '0')),
      status: latest.end_time ? 'completed' : 'ongoing',
      data_quality: 1
    };
  }

  private transformKpData(rawData: Record<string, unknown>[]): NOAAGeomagneticKpData {
    const latest = rawData[rawData.length - 1];
    const kp = parseFloat(String(latest.kp_index || latest.kp));
    
    return {
      time_tag: String(latest.time_tag),
      kp_index: Math.floor(kp),
      kp_fraction: kp,
      storm_level: this.mapKpToStormLevel(kp),
      predicted: latest.predicted === 'true',
      confidence: parseFloat(String(latest.confidence || '0.8')),
      data_quality: 1
    };
  }

  private transformDstData(rawData: Record<string, unknown>[]): NOAAGeomagneticDstData {
    const latest = rawData[rawData.length - 1];
    const dst = parseFloat(String(latest.dst || latest.dst_index));
    
    return {
      time_tag: String(latest.time_tag),
      dst_index: dst,
      storm_phase: this.determineDstPhase(dst),
      predicted: latest.predicted === 'true',
      storm_intensity: this.mapDstToIntensity(dst),
      data_quality: 1
    };
  }

  private transformSolarWindPlasmaData(rawData: Record<string, unknown>[]): NOAASolarWindPlasmaData {
    const latest = rawData[rawData.length - 1];
    
    return {
      time_tag: String(latest.time_tag),
      velocity: parseFloat(String(latest.speed || latest.velocity)),
      density: parseFloat(String(latest.density || latest.dens)),
      temperature: parseFloat(String(latest.temperature)),
      dynamic_pressure: parseFloat(String(latest.pressure || '0')),
      thermal_speed: parseFloat(String(latest.thermal_speed || '0')),
      source: 'ACE',
      data_quality: parseFloat(String(latest.dsflag || '1'))
    };
  }

  private transformSolarWindMagneticData(rawData: Record<string, unknown>[]): NOAASolarWindMagneticData {
    const latest = rawData[rawData.length - 1];
    
    return {
      time_tag: String(latest.time_tag),
      bt: parseFloat(String(latest.bt)),
      bx_gsm: parseFloat(String(latest.bx_gsm || latest.bx)),
      by_gsm: parseFloat(String(latest.by_gsm || latest.by)),
      bz_gsm: parseFloat(String(latest.bz_gsm || latest.bz)),
      phi_angle: parseFloat(String(latest.phi || '0')),
      theta_angle: parseFloat(String(latest.theta || '0')),
      source: 'ACE',
      data_quality: parseFloat(String(latest.dsflag || '1'))
    };
  }

  private transformMagnetometerData(rawData: Record<string, unknown>[]): NOAAMagnetometerData {
    const latest = rawData[rawData.length - 1];
    
    return {
      time_tag: String(latest.time_tag),
      satellite: String(latest.satellite || 'GOES-16'),
      hp: parseFloat(String(latest.hp)),
      he: parseFloat(String(latest.he)),
      hn: parseFloat(String(latest.hn)),
      total: parseFloat(String(latest.ht || latest.total)),
      coordinate_system: 'ENP',
      data_quality: 1
    };
  }

  private transformIntegralParticleData(rawData: Record<string, unknown>[], key: string): NOAAIntegralParticleData {
    const latest = rawData[rawData.length - 1];
    const particleType = key.includes('proton') ? 'proton' : 'electron';
    
    return {
      time_tag: String(latest.time_tag),
      satellite: String(latest.satellite || 'GOES-16'),
      particle_type: particleType,
      energy_channel: String(latest.energy || '>10 MeV'),
      flux: parseFloat(String(latest.flux)),
      flux_uncertainty: parseFloat(String(latest.uncertainty || '0')),
      background_subtracted: true,
      data_quality: 1
    };
  }

  private transformDifferentialParticleData(rawData: Record<string, unknown>[], key: string): NOAADifferentialParticleData {
    const latest = rawData[rawData.length - 1];
    const particleType = key.includes('proton') ? 'proton' : 'electron';
    
    // Extract energy channels from the data structure
    const energyChannels = Object.keys(latest)
      .filter(k => k.startsWith('flux_') || k.includes('MeV'))
      .map((channelKey, index) => ({
        channel_id: channelKey,
        energy_min: index * 10, // Simplified - would need actual channel definitions
        energy_max: (index + 1) * 10,
        flux: parseFloat(String(latest[channelKey])),
        uncertainty: parseFloat(String(latest[`${channelKey}_uncertainty`] || '0'))
      }));
    
    return {
      time_tag: String(latest.time_tag),
      satellite: String(latest.satellite || 'GOES-16'),
      particle_type: particleType,
      energy_channels: energyChannels,
      data_quality: 1
    };
  }

  private transformCosmicRayData(rawData: Record<string, unknown>[]): NOAACosmicRayData {
    const latest = rawData[rawData.length - 1];
    
    return {
      time_tag: String(latest.time_tag),
      instrument: 'SIS',
      total_counts: parseFloat(String(latest.total_counts || '0')),
      count_rate: parseFloat(String(latest.count_rate || '0')),
      energy_channels: [
        {
          element: 'H',
          energy_range: '10-30 MeV',
          flux: parseFloat(String(latest.proton_flux || '0')),
          uncertainty: parseFloat(String(latest.proton_uncertainty || '0'))
        }
      ],
      solar_energetic_particles: latest.sep_event === 'true',
      data_quality: 1
    };
  }

  private transformACEEPAMData(rawData: Record<string, unknown>[]): NOAAACEEPAMData {
    const latest = rawData[rawData.length - 1];
    
    return {
      time_tag: String(latest.time_tag),
      instrument: 'EPAM',
      measurement_type: 'ion',
      energy_channels: [
        {
          channel_name: 'P1',
          energy_range: '47-65 keV',
          particle_flux: parseFloat(String(latest.p1_flux || '0')),
          geometric_factor: 0.397,
          efficiency: 0.95
        }
      ],
      data_quality: 1
    };
  }

  subscribe(
    key: string,
    onData: (data: NOAADataTypes) => void,
    options: { interval?: number } = {}
  ): () => void {
    const dataset = getDatasetById(key);
    const interval = options.interval ?? (dataset?.updateFrequency ?? 5) * 60 * 1000;
    
    // Initial fetch
    this.fetchData(key)
      .then(onData)
      .catch(error => console.warn(`Initial NOAA data fetch failed for ${key}:`, error));
    
    // Set up periodic updates
    const intervalId = setInterval(async () => {
      try {
        const data = await this.fetchData(key);
        onData(data);
      } catch (error) {
        console.warn(`NOAA data subscription update failed for ${key}:`, error);
      }
    }, interval);
    
    return () => clearInterval(intervalId);
  }

  // Priority-based subscription methods
  subscribeToPrimaryData(
    onData: (key: string, data: NOAADataTypes) => void,
    options: { interval?: number } = {}
  ): () => void {
    const primaryKeys = getDatasetsByPriority('primary').map(d => d.id);
    const unsubscribeFunctions = primaryKeys.map(key => 
      this.subscribe(key, (data) => onData(key, data), options)
    );
    
    return () => unsubscribeFunctions.forEach(unsub => unsub());
  }

  subscribeToSecondaryData(
    onData: (key: string, data: NOAADataTypes) => void,
    options: { interval?: number } = {}
  ): () => void {
    const secondaryKeys = getDatasetsByPriority('secondary').map(d => d.id);
    const unsubscribeFunctions = secondaryKeys.map(key => 
      this.subscribe(key, (data) => onData(key, data), options)
    );
    
    return () => unsubscribeFunctions.forEach(unsub => unsub());
  }

  subscribeToTertiaryData(
    onData: (key: string, data: NOAADataTypes) => void,
    options: { interval?: number } = {}
  ): () => void {
    const tertiaryKeys = getDatasetsByPriority('tertiary').map(d => d.id);
    const unsubscribeFunctions = tertiaryKeys.map(key => 
      this.subscribe(key, (data) => onData(key, data), options)
    );
    
    return () => unsubscribeFunctions.forEach(unsub => unsub());
  }

  setObserver(observer: DataServiceObserver): void {
    this.observer = observer;
  }

  validateData(data: unknown): data is NOAADataTypes {
    return typeof data === 'object' && data !== null && 'time_tag' in data;
  }

  transformData(rawData: unknown): NOAADataTypes {
    if (this.validateData(rawData)) {
      return rawData;
    }
    throw new Error('Invalid data format for NOAA provider');
  }

  // Enhanced space weather alert generation
  async generateSpaceWeatherAlerts(data: NOAADataTypes): Promise<SpaceWeatherAlert[]> {
    const alerts: SpaceWeatherAlert[] = [];
    
    // Electric field alerts
    if ('features' in data && Array.isArray(data.features)) {
      for (const feature of data.features) {
        const magnitude = Math.sqrt(
          feature.properties.Ex ** 2 + feature.properties.Ey ** 2
        );
        
        if (magnitude > 3000) {
          alerts.push({
            id: `electric-field-${feature.geometry.coordinates.join('-')}`,
            alertType: 'electric_field_anomaly',
            severity: 'high',
            timestamp: new Date().toISOString(),
            regions: ['global'],
            message: `Electric field magnitude of ${magnitude.toFixed(2)} mV/km detected`,
            electricFieldData: [{
              longitude: feature.geometry.coordinates[0],
              latitude: feature.geometry.coordinates[1],
              ex: feature.properties.Ex,
              ey: feature.properties.Ey,
              magnitude,
              direction: Math.atan2(feature.properties.Ey, feature.properties.Ex) * (180 / Math.PI),
              quality: feature.properties.quality_flag || 1,
              stationDistance: feature.properties.distance_nearest_station || 0
            }]
          });
        }
      }
    }

    // Solar flare alerts (mapped to infrastructure risk)
    if ('flux_class' in data && (data.flux_class === 'M' || data.flux_class === 'X')) {
      alerts.push({
        id: `solar-flare-${data.time_tag}`,
        alertType: 'infrastructure_risk',
        severity: data.flux_class === 'X' ? 'high' : 'moderate',
        timestamp: data.time_tag,
        regions: ['global'],
        message: `${data.flux_class}-class solar flare detected - potential infrastructure impacts`,
        electricFieldData: []
      });
    }

    // Geomagnetic storm alerts
    if ('storm_level' in data && ['strong', 'severe', 'extreme'].includes(data.storm_level)) {
      alerts.push({
        id: `geomagnetic-storm-${data.time_tag}`,
        alertType: 'geomagnetic_storm',
        severity: data.storm_level === 'extreme' ? 'extreme' : 'high',
        timestamp: data.time_tag,
        regions: ['global'],
        message: `${data.storm_level} geomagnetic storm conditions`,
        electricFieldData: []
      });
    }
    
    return alerts;
  }

  // Comprehensive space weather summary
  async generateSpaceWeatherSummary(): Promise<NOAASpaceWeatherSummary> {
    try {
      const primaryData = await this.fetchPrimaryData();
      
      // Extract key metrics from primary datasets
      const summary: NOAASpaceWeatherSummary = {
        timestamp: new Date().toISOString(),
        solar_activity: {
          xray_class: 'A',
          flare_count_24h: 0,
          background_flux: 1e-8
        },
        geomagnetic_activity: {
          kp_current: 0,
          dst_current: 0,
          storm_level: 'quiet'
        },
        solar_wind: {
          speed: 400,
          density: 5,
          magnetic_field: 5,
          dynamic_pressure: 2
        },
        particle_environment: {
          proton_flux_high: 0,
          electron_flux_high: 0,
          cosmic_ray_intensity: 0
        },
        alerts: {
          active_warnings: [],
          risk_level: 'low'
        }
      };

      // Populate from actual data
      for (const data of Object.values(primaryData)) {
        if ('flux_class' in data) {
          summary.solar_activity.xray_class = data.flux_class;
        }
        if ('kp_index' in data) {
          summary.geomagnetic_activity.kp_current = data.kp_index;
        }
        if ('dst_index' in data) {
          summary.geomagnetic_activity.dst_current = data.dst_index;
        }
        if ('storm_level' in data) {
          summary.geomagnetic_activity.storm_level = data.storm_level;
        }
        if ('velocity' in data) {
          summary.solar_wind.speed = data.velocity;
        }
        if ('density' in data) {
          summary.solar_wind.density = data.density;
        }
        if ('bt' in data) {
          summary.solar_wind.magnetic_field = data.bt;
        }
        if ('flux' in data && 'particle_type' in data) {
          if (data.particle_type === 'proton') {
            summary.particle_environment.proton_flux_high = data.flux;
          } else if (data.particle_type === 'electron') {
            summary.particle_environment.electron_flux_high = data.flux;
          }
        }
      }

      // Generate alerts for all data
      const allAlerts: SpaceWeatherAlert[] = [];
      for (const data of Object.values(primaryData)) {
        const alerts = await this.generateSpaceWeatherAlerts(data);
        allAlerts.push(...alerts);
      }

      summary.alerts.active_warnings = allAlerts.map(alert => alert.message);
      summary.alerts.risk_level = this.calculateOverallRiskLevel(allAlerts);

      return summary;
    } catch (error) {
      console.error('Failed to generate space weather summary:', error);
      throw error;
    }
  }

  private calculateOverallRiskLevel(alerts: SpaceWeatherAlert[]): 'low' | 'moderate' | 'high' | 'extreme' {
    if (alerts.length === 0) return 'low';
    
    const extremeSeverityCount = alerts.filter(a => a.severity === 'extreme').length;
    const highSeverityCount = alerts.filter(a => a.severity === 'high').length;
    const moderateSeverityCount = alerts.filter(a => a.severity === 'moderate').length;
    
    if (extremeSeverityCount >= 1) return 'extreme';
    if (highSeverityCount >= 2) return 'extreme';
    if (highSeverityCount >= 1) return 'high';
    if (moderateSeverityCount >= 2) return 'moderate';
    return 'low';
  }

  // Static methods for configuration access
  static getAvailableKeys(): string[] {
    return getPriorityFetchOrder();
  }

  static getPrimaryKeys(): string[] {
    return getDatasetsByPriority('primary').map(d => d.id);
  }

  static getSecondaryKeys(): string[] {
    return getDatasetsByPriority('secondary').map(d => d.id);
  }

  static getTertiaryKeys(): string[] {
    return getDatasetsByPriority('tertiary').map(d => d.id);
  }

  static getDatasetConfig(id: string): NOAAEndpointConfig | undefined {
    return getDatasetById(id);
  }

  // Utility methods for data classification and transformation
  private determineFlareClass(flux: number): 'A' | 'B' | 'C' | 'M' | 'X' {
    if (flux < 1e-7) return 'A';
    if (flux < 1e-6) return 'B';
    if (flux < 1e-5) return 'C';
    if (flux < 1e-4) return 'M';
    return 'X';
  }

  private calculateFlareScale(flux: number): number {
    const flareClass = this.determineFlareClass(flux);
    let baseFlux: number;
    
    switch (flareClass) {
      case 'A': baseFlux = 1e-8; break;
      case 'B': baseFlux = 1e-7; break;
      case 'C': baseFlux = 1e-6; break;
      case 'M': baseFlux = 1e-5; break;
      case 'X': baseFlux = 1e-4; break;
    }
    
    return flux / baseFlux;
  }

  private mapKpToStormLevel(kp: number): NOAAGeomagneticKpData['storm_level'] {
    if (kp < 3) return 'quiet';
    if (kp < 4) return 'unsettled';
    if (kp < 5) return 'active';
    if (kp < 6) return 'minor';
    if (kp < 7) return 'moderate';
    if (kp < 8) return 'strong';
    if (kp < 9) return 'severe';
    return 'extreme';
  }

  private determineDstPhase(dst: number): 'main' | 'recovery' | 'quiet' | 'initial' {
    if (dst > -20) return 'quiet';
    if (dst > -50) return 'initial';
    if (dst > -100) return 'main';
    return 'recovery';
  }

  private mapDstToIntensity(dst: number): 'weak' | 'moderate' | 'intense' | 'super' {
    if (dst > -50) return 'weak';
    if (dst > -100) return 'moderate';
    if (dst > -250) return 'intense';
    return 'super';
  }

  /**
   * Transform raw electric field data into processed format for visualization
   * Implements the same processing logic as legacy useSpaceWeatherData hook
   */
  private transformElectricFieldData(rawData: NOAAElectricFieldData): ProcessedElectricFieldData {
    // NOAA raw Ex/Ey currently interpreted as mV/km per provider docs (legacy ambiguity). Phase 0 enforces canonical mV/km.
    const vectors = rawData.features.map(feature => {
      const exRaw = feature.properties.Ex;
      const eyRaw = feature.properties.Ey;
      const magnitudeRaw = Math.sqrt(exRaw ** 2 + eyRaw ** 2);
      return {
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
        ex: exRaw,
        ey: eyRaw,
        magnitude: magnitudeRaw,
        direction: Math.atan2(feature.properties.Ey, feature.properties.Ex) * (180 / Math.PI),
        quality: feature.properties.quality_flag || 1,
        stationDistance: feature.properties.distance_nearest_station || 0,
        unit: 'mV/km' as const,
        ex_mVkm: exRaw,
        ey_mVkm: eyRaw,
        magnitude_mVkm: magnitudeRaw
      };
    });

    const latitudes = vectors.map(v => v.latitude);
    const longitudes = vectors.map(v => v.longitude);
    const magnitudes = vectors.map(v => v.magnitude);

    return {
      timestamp: rawData.time_tag || new Date().toISOString(),
      source: rawData.network === 'InterMag' ? 'InterMagEarthScope' : 'US-Canada-1D',
      vectors,
      unit: 'mV/km',
      coverage: {
        minLat: Math.min(...latitudes),
        maxLat: Math.max(...latitudes),
        minLon: Math.min(...longitudes),
        maxLon: Math.max(...longitudes)
      },
      statistics: {
        totalPoints: vectors.length,
        highQualityPoints: vectors.filter(v => v.quality >= 3).length,
        maxFieldStrength: Math.max(...magnitudes),
        avgFieldStrength: magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length
      }
    };
  }
}
