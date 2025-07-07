// NOAAGeomagneticService.ts
// Service for retrieving NOAA geomagnetic data for space weather monitoring

export interface APIResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface GeomagneticData {
  kIndex: number;
  timestamp: Date;
  activity: 'quiet' | 'unsettled' | 'active' | 'minor_storm' | 'major_storm' | 'severe_storm';
  source: 'NOAA';
}

export interface GeomagneticForecast {
  date: Date;
  predictedKIndex: number;
  confidence: number;
  activity: GeomagneticData['activity'];
}

export class NOAAGeomagneticService {
  private readonly baseUrl = 'https://services.swpc.noaa.gov/json';
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Get current geomagnetic conditions
   */
  async getCurrentConditions(): Promise<APIResponse<GeomagneticData>> {
    try {
      const cacheKey = 'current-conditions';
      const cached = this.getCachedData<GeomagneticData>(cacheKey);
      if (cached) {
        return { success: true, data: cached, error: null };
      }

      const response = await fetch(`${this.baseUrl}/planetary_k_index_1m.json`);
      if (!response.ok) {
        throw new Error(`NOAA API error: ${response.status}`);
      }

      const rawData = await response.json() as Array<{ time_tag: string; kp: string }>;
      const latest = rawData[rawData.length - 1];
      
      const data: GeomagneticData = {
        kIndex: parseFloat(latest.kp),
        timestamp: new Date(latest.time_tag),
        activity: this.classifyActivity(parseFloat(latest.kp)),
        source: 'NOAA'
      };

      this.setCachedData(cacheKey, data);
      return { success: true, data, error: null };
    } catch (error) {
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get 3-day geomagnetic forecast
   */
  async getForecast(): Promise<APIResponse<GeomagneticForecast[]>> {
    try {
      const cacheKey = 'forecast';
      const cached = this.getCachedData<GeomagneticForecast[]>(cacheKey);
      if (cached) {
        return { success: true, data: cached, error: null };
      }

      const response = await fetch(`${this.baseUrl}/3-day-forecast.json`);
      if (!response.ok) {
        throw new Error(`NOAA forecast API error: ${response.status}`);
      }

      const rawData = await response.json() as Array<{ DateStamp: string; K: string }>;
      const forecasts: GeomagneticForecast[] = rawData.map((item) => ({
        date: new Date(item.DateStamp),
        predictedKIndex: parseFloat(item.K) || 0,
        confidence: 0.8, // NOAA doesn't provide confidence, using default
        activity: this.classifyActivity(parseFloat(item.K) || 0)
      }));

      this.setCachedData(cacheKey, forecasts);
      return { success: true, data: forecasts, error: null };
    } catch (error) {
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check if current conditions indicate potential satellite or communication disruption
   */
  async getDisruptionRisk(): Promise<APIResponse<{ risk: 'low' | 'medium' | 'high'; description: string }>> {
    const conditions = await this.getCurrentConditions();
    if (!conditions.success || !conditions.data) {
      return { success: false, data: null, error: 'Failed to get current conditions' };
    }

    const { kIndex } = conditions.data;
    let risk: 'low' | 'medium' | 'high';
    let description: string;

    if (kIndex <= 3) {
      risk = 'low';
      description = 'Normal geomagnetic conditions. Minimal risk to satellite operations.';
    } else if (kIndex <= 5) {
      risk = 'medium';
      description = 'Elevated geomagnetic activity. Possible minor satellite disruptions.';
    } else {
      risk = 'high';
      description = 'High geomagnetic activity. Significant risk to satellite and communication systems.';
    }

    return { 
      success: true, 
      data: { risk, description }, 
      error: null 
    };
  }

  private classifyActivity(kIndex: number): GeomagneticData['activity'] {
    if (kIndex < 3) return 'quiet';
    if (kIndex < 4) return 'unsettled';
    if (kIndex < 5) return 'active';
    if (kIndex < 6) return 'minor_storm';
    if (kIndex < 7) return 'major_storm';
    return 'severe_storm';
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data as T;
    }
    return null;
  }

  private setCachedData(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const noaaGeomagneticService = new NOAAGeomagneticService();
