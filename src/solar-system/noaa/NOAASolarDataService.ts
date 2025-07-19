// NOAASolarDataService.ts - NOAA Solar Data Service Implementation
// Phase 2 Week 4: NOAA Data Service Architecture

import type {
  NOAASolarDataServiceConfig,
  SolarXrayFlux,
  SolarFlareEvent,
  SolarDataUpdateEvent,
  SolarDataError,
  SolarDataCache,
  PerformanceStats,
  SpaceWeatherSummary,
  DataUpdateHandler,
  ErrorHandler,
  SpaceWeatherChangeHandler,
  NOAAXrayResponse,
  NOAAFlareResponse,
  SolarDataQuality
} from './types';

export class NOAASolarDataService {
  private config: Required<NOAASolarDataServiceConfig>;
  private connected = false;
  private lastUpdate: Date | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private cache = new Map<string, unknown>();
  private cacheStats: SolarDataCache;
  private performanceStats: PerformanceStats;
  private usingFallback = false;
  
  // Event handlers
  private dataUpdateHandlers: DataUpdateHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private spaceWeatherChangeHandlers: SpaceWeatherChangeHandler[] = [];

  constructor(config: NOAASolarDataServiceConfig = {}) {
    this.config = {
      updateInterval: config.updateInterval ?? 60000,
      dataRetentionHours: config.dataRetentionHours ?? 24,
      enableCaching: config.enableCaching ?? true,
      fallbackMode: config.fallbackMode ?? true,
      apiTimeout: config.apiTimeout ?? 30000,
      apiEndpoints: {
        xrayFlux: 'https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json',
        solarFlares: 'https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json',
        solarWind: 'https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json',
        ...config.apiEndpoints
      }
    };

    this.cacheStats = {
      hits: 0,
      misses: 0,
      size: 0,
      memoryUsage: 0,
      oldestEntry: null,
      newestEntry: null
    };

    this.performanceStats = {
      averageResponseTime: 0,
      successRate: 0,
      errorRate: 0,
      requestCount: 0,
      lastRequestTime: null,
      connectionUptime: 0
    };
  }

  async connect(): Promise<void> {
    try {
      // Test connection with a simple request
      const response = await this.makeRequest(this.config.apiEndpoints.xrayFlux!);
      if (!response || !response.ok) {
        throw new Error(`HTTP ${response?.status || 'unknown'}: ${response?.statusText || 'unknown error'}`);
      }
      
      this.connected = true;
      this.lastUpdate = new Date();
      this.usingFallback = false;
      
      // Start update interval
      this.startUpdateInterval();
      
    } catch (error) {
      this.connected = false;
      if (this.config.fallbackMode) {
        this.usingFallback = true;
        // Allow connection in fallback mode
        return;
      } else {
        throw new Error(`Failed to connect to NOAA solar data service: ${error}`);
      }
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getLastUpdate(): Date | null {
    return this.lastUpdate;
  }

  getConfig(): Required<NOAASolarDataServiceConfig> {
    return { ...this.config };
  }

  async getXrayFlux(): Promise<SolarXrayFlux> {
    if (this.usingFallback) {
      return this.getFallbackXrayFlux();
    }

    const cacheKey = 'xray_flux';
    
    // Check cache first
    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      this.cacheStats.hits++;
      return this.cache.get(cacheKey) as SolarXrayFlux;
    }

    try {
      const startTime = Date.now();
      const response = await this.makeRequest(this.config.apiEndpoints.xrayFlux!);
      
      if (!response || !response.ok) {
        throw new Error(`HTTP ${response?.status || 'unknown'}: ${response?.statusText || 'unknown error'}`);
      }

      const rawData: NOAAXrayResponse = await response.json();
      
      // Validate data format
      if (!rawData.data || !Array.isArray(rawData.data) || rawData.data.length === 0) {
        throw new Error('Invalid X-ray flux data format');
      }

      const processedData = this.processXrayFluxData(rawData);
      
      // Update performance stats
      this.updatePerformanceStats(Date.now() - startTime, true);
      
      // Cache the result
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, processedData);
        this.updateCacheStats();
        this.cacheStats.misses++;
      }

      return processedData;

    } catch (error) {
      this.updatePerformanceStats(0, false);
      this.emitError({
        code: 'DATA_VALIDATION_ERROR',
        message: `Invalid data format: ${error}`,
        timestamp: new Date(),
        source: 'validation',
        retryable: true
      });
      
      // If fallback mode is enabled, return fallback data instead of throwing
      if (this.config.fallbackMode) {
        this.usingFallback = true;
        return this.getFallbackXrayFlux();
      }
      
      throw error;
    }
  }

  async getSolarFlares(): Promise<SolarFlareEvent[]> {
    if (this.usingFallback) {
      return [];
    }

    try {
      const response = await this.makeRequest(this.config.apiEndpoints.solarFlares!);
      
      if (!response || !response.ok) {
        throw new Error(`HTTP ${response?.status || 'unknown'}: ${response?.statusText || 'unknown error'}`);
      }

      const rawData: NOAAFlareResponse = await response.json();
      return this.processSolarFlareData(rawData);

    } catch (error) {
      this.emitError({
        code: 'API_ERROR',
        message: `Failed to fetch solar flares: ${error}`,
        timestamp: new Date(),
        source: 'api',
        retryable: true
      });
      
      // Return empty array instead of throwing if fallback mode is enabled
      if (this.config.fallbackMode) {
        return [];
      }
      
      throw error;
    }
  }

  async getSpaceWeatherSummary(): Promise<SpaceWeatherSummary> {
    const xrayFlux = await this.getXrayFlux();
    const flares = await this.getSolarFlares();

    return {
      timestamp: new Date(),
      solarActivity: {
        level: xrayFlux.current.intensityLevel,
        flareIntensity: xrayFlux.current.fluxShort,
        flareClass: xrayFlux.current.classification,
        activeFlares: flares.filter(f => f.isActive),
        trend: xrayFlux.trend.direction === 'rising' ? 'increasing' : 
               xrayFlux.trend.direction === 'falling' ? 'decreasing' : 'stable'
      },
      visualizationParams: {
        coronaIntensity: this.calculateCoronaIntensity(xrayFlux.current.fluxShort),
        coronaSize: this.calculateCoronaSize(xrayFlux.current.fluxShort),
        sunColor: xrayFlux.current.color,
        flareParticles: flares.some(f => f.isActive),
        pulseRate: this.calculatePulseRate(xrayFlux.current.fluxShort)
      },
      quality: xrayFlux.quality,
      dataAge: Math.floor((Date.now() - xrayFlux.current.timestamp.getTime()) / 1000)
    };
  }

  // Event handlers
  onDataUpdate(handler: DataUpdateHandler): void {
    this.dataUpdateHandlers.push(handler);
  }

  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  onSpaceWeatherChange(handler: SpaceWeatherChangeHandler): void {
    this.spaceWeatherChangeHandlers.push(handler);
  }

  // Cache management
  getCacheStats(): SolarDataCache {
    return { ...this.cacheStats };
  }

  getPerformanceStats(): PerformanceStats {
    return { ...this.performanceStats };
  }

  isUsingFallback(): boolean {
    return this.usingFallback;
  }

  dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.connected = false;
    this.cache.clear();
    this.dataUpdateHandlers = [];
    this.errorHandlers = [];
    this.spaceWeatherChangeHandlers = [];
  }

  // Private methods
  private async makeRequest(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.apiTimeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'starcom-app/1.0'
        }
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private processXrayFluxData(rawData: NOAAXrayResponse): SolarXrayFlux {
    const latest = rawData.data[rawData.data.length - 1];
    const timestamp = new Date(latest.timestamp);
    const classification = latest.classification;
    const fluxShort = latest.flux_short;
    const fluxLong = latest.flux_long;

    // Determine data quality
    const dataAge = Date.now() - timestamp.getTime();
    const quality: SolarDataQuality = dataAge > 3600000 ? 'stale' : 'good';

    return {
      current: {
        timestamp,
        fluxShort,
        fluxLong,
        classification,
        intensityLevel: this.classifyIntensity(classification),
        color: this.getColorForClass(classification)
      },
      trend: this.calculateTrend(rawData.data),
      quality,
      qualityScore: quality === 'stale' ? 0.5 : 0.9,
      warnings: quality === 'stale' ? ['Data is older than 1 hour'] : []
    };
  }

  private processSolarFlareData(rawData: NOAAFlareResponse): SolarFlareEvent[] {
    return rawData.events.map(event => ({
      id: event.id,
      startTime: new Date(event.start_time),
      peakTime: new Date(event.peak_time),
      endTime: event.end_time ? new Date(event.end_time) : null,
      classification: event.classification,
      location: event.location,
      peakFlux: event.peak_flux,
      isActive: !event.end_time,
      duration: event.end_time ? 
        Math.floor((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 1000) : 
        Math.floor((Date.now() - new Date(event.start_time).getTime()) / 1000)
    }));
  }

  private getFallbackXrayFlux(): SolarXrayFlux {
    return {
      current: {
        timestamp: new Date(),
        fluxShort: 1e-9,
        fluxLong: 5e-10,
        classification: 'A0.0',
        intensityLevel: 'quiet',
        color: '#FFFF00'
      },
      trend: {
        direction: 'stable',
        rate: 0,
        confidence: 0
      },
      quality: 'fallback'
    };
  }

  private classifyIntensity(classification: string): 'quiet' | 'low' | 'moderate' | 'high' | 'extreme' {
    const level = classification.charAt(0);
    switch (level) {
      case 'A': return 'quiet';
      case 'B': return 'low';
      case 'C': return 'moderate';
      case 'M': return 'high';
      case 'X': return 'extreme';
      default: return 'quiet';
    }
  }

  private getColorForClass(classification: string): string {
    const level = classification.charAt(0);
    switch (level) {
      case 'A': return '#FFFF00'; // Yellow
      case 'B': return '#00FF00'; // Green
      case 'C': return '#FFA500'; // Orange
      case 'M': return '#FF0000'; // Red
      case 'X': return '#FF00FF'; // Magenta
      default: return '#FFFF00';
    }
  }

  private calculateTrend(data: NOAAXrayResponse['data']): SolarXrayFlux['trend'] {
    if (data.length < 2) {
      return { direction: 'stable', rate: 0, confidence: 0 };
    }

    const recent = data.slice(-5); // Last 5 measurements
    const values = recent.map(d => d.flux_short);
    const trend = values[values.length - 1] - values[0];

    return {
      direction: trend > 0.1e-6 ? 'rising' : trend < -0.1e-6 ? 'falling' : 'stable',
      rate: trend / (recent.length - 1),
      confidence: 0.8
    };
  }

  private calculateCoronaIntensity(flux: number): number {
    // Map flux to corona intensity (1.0 = normal, 2.0 = maximum)
    return Math.min(2.0, 1.0 + Math.log10(flux / 1e-8));
  }

  private calculateCoronaSize(flux: number): number {
    // Map flux to corona size multiplier
    return Math.min(2.0, 1.0 + Math.log10(flux / 1e-8) * 0.5);
  }

  private calculatePulseRate(flux: number): number {
    // Map flux to pulse animation rate
    return Math.min(1.0, flux / 1e-4);
  }

  private startUpdateInterval(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        const summary = await this.getSpaceWeatherSummary();
        this.emitSpaceWeatherChange(summary);
      } catch (error) {
        console.warn('Failed to update space weather data:', error);
      }
    }, this.config.updateInterval);
  }

  private updatePerformanceStats(responseTime: number, success: boolean): void {
    this.performanceStats.requestCount++;
    this.performanceStats.lastRequestTime = new Date();
    
    if (success) {
      const totalTime = this.performanceStats.averageResponseTime * (this.performanceStats.requestCount - 1) + responseTime;
      this.performanceStats.averageResponseTime = totalTime / this.performanceStats.requestCount;
    }

    const successCount = this.performanceStats.successRate * (this.performanceStats.requestCount - 1) + (success ? 1 : 0);
    this.performanceStats.successRate = successCount / this.performanceStats.requestCount;
    this.performanceStats.errorRate = 1 - this.performanceStats.successRate;
  }

  private updateCacheStats(): void {
    this.cacheStats.size = this.cache.size;
    this.cacheStats.memoryUsage = JSON.stringify([...this.cache.entries()]).length;
    
    const timestamps = [...this.cache.values()]
      .filter(v => v && typeof v === 'object' && 'current' in v)
      .map(v => (v as SolarXrayFlux).current?.timestamp)
      .filter(t => t instanceof Date)
      .sort((a, b) => a.getTime() - b.getTime());
    
    this.cacheStats.oldestEntry = timestamps[0] || null;
    this.cacheStats.newestEntry = timestamps[timestamps.length - 1] || null;
  }

  private emitDataUpdate(event: SolarDataUpdateEvent): void {
    this.dataUpdateHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in data update handler:', error);
      }
    });
  }

  private emitError(error: SolarDataError): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    });
  }

  private emitSpaceWeatherChange(summary: SpaceWeatherSummary): void {
    this.spaceWeatherChangeHandlers.forEach(handler => {
      try {
        handler(summary);
      } catch (error) {
        console.error('Error in space weather change handler:', error);
      }
    });
  }
}
