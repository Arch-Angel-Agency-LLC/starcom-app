// Alerts Data Provider for the centralized data management system
// Migrates functionality from AlertsService.ts to the new provider pattern

import { 
  DataProvider, 
  DataServiceObserver, 
  EndpointConfig, 
  FetchOptions 
} from '../interfaces';

export interface AlertData {
  id: string;
  type: 'security' | 'weather' | 'infrastructure' | 'geological' | 'space-weather';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    region?: string;
  };
  source: string;
  expiresAt?: string;
  affectedAreas?: string[];
}

export class AlertsDataProvider implements DataProvider<AlertData[]> {
  readonly id: string = 'alerts-data';
  readonly name: string = 'Alerts Data Provider';
  readonly endpoints: EndpointConfig[] = [
    {
      id: 'security-alerts',
      url: 'https://api.example.com/security-alerts', // Placeholder - would be real endpoint
      method: 'GET'
    },
    {
      id: 'weather-alerts',
      url: 'https://api.weather.gov/alerts/active', // Real NWS alerts API
      method: 'GET'
    },
    {
      id: 'geological-alerts',
      url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.geojson',
      method: 'GET'
    }
  ];

  private observer?: DataServiceObserver;

  async fetchData(key: string, _options: FetchOptions = {}): Promise<AlertData[]> {
    this.observer?.onFetchStart?.(key, this.id);
    const startTime = performance.now();

    try {
      let data: AlertData[];

      switch (key) {
        case 'security-alerts':
          data = await this.fetchSecurityAlerts();
          break;
        case 'weather-alerts':
          data = await this.fetchWeatherAlerts();
          break;
        case 'geological-alerts':
          data = await this.fetchGeologicalAlerts();
          break;
        case 'all-alerts':
          // Fetch all types and combine
          const [security, weather, geological] = await Promise.all([
            this.fetchSecurityAlerts(),
            this.fetchWeatherAlerts(),
            this.fetchGeologicalAlerts()
          ]);
          data = [...security, ...weather, ...geological];
          break;
        default:
          throw new Error(`Unknown alerts data key: ${key}`);
      }

      const duration = performance.now() - startTime;
      this.observer?.onFetchEnd?.(key, duration, this.id);

      return data;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.observer?.onFetchEnd?.(key, duration, this.id);
      this.observer?.onError?.(key, error as Error, this.id);
      throw error;
    }
  }

  private async fetchSecurityAlerts(): Promise<AlertData[]> {
    // Placeholder implementation - would integrate with real security alert sources
    // For MVP, return mock data or empty array
    return [
      {
        id: 'sec-001',
        type: 'security',
        severity: 'medium',
        title: 'Cyber Security Advisory',
        description: 'Elevated threat level for infrastructure systems',
        timestamp: new Date().toISOString(),
        source: 'CISA',
        affectedAreas: ['North America']
      }
    ];
  }

  private async fetchWeatherAlerts(): Promise<AlertData[]> {
    try {
      const response = await fetch('https://api.weather.gov/alerts/active');
      if (!response.ok) {
        throw new Error(`Weather alerts API failed: ${response.status}`);
      }

      const data = await response.json();
      
      return data.features?.map((feature: any) => ({
        id: feature.properties.id,
        type: 'weather' as const,
        severity: this.mapNWSSeverity(feature.properties.severity),
        title: feature.properties.event,
        description: feature.properties.description || feature.properties.headline,
        timestamp: feature.properties.sent,
        location: feature.geometry ? {
          latitude: feature.geometry.coordinates[0][1],
          longitude: feature.geometry.coordinates[0][0],
          region: feature.properties.areaDesc
        } : undefined,
        source: 'National Weather Service',
        expiresAt: feature.properties.expires,
        affectedAreas: feature.properties.areaDesc ? [feature.properties.areaDesc] : []
      })) || [];
    } catch (error) {
      console.warn('Failed to fetch weather alerts:', error);
      return [];
    }
  }

  private async fetchGeologicalAlerts(): Promise<AlertData[]> {
    try {
      const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.geojson');
      if (!response.ok) {
        throw new Error(`USGS API failed: ${response.status}`);
      }

      const data = await response.json();
      
      return data.features?.map((feature: any) => ({
        id: feature.id,
        type: 'geological' as const,
        severity: this.mapEarthquakeSeverity(feature.properties.mag),
        title: `Magnitude ${feature.properties.mag} Earthquake`,
        description: feature.properties.title,
        timestamp: new Date(feature.properties.time).toISOString(),
        location: {
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          region: feature.properties.place
        },
        source: 'USGS',
        affectedAreas: [feature.properties.place]
      })) || [];
    } catch (error) {
      console.warn('Failed to fetch geological alerts:', error);
      return [];
    }
  }

  subscribe(
    key: string,
    onData: (data: AlertData[]) => void,
    options: { interval?: number } = {}
  ): () => void {
    const interval = options.interval ?? 2 * 60 * 1000; // Default 2 minutes for alerts
    
    // Initial fetch
    this.fetchData(key)
      .then(onData)
      .catch(error => console.warn(`Initial alerts fetch failed for ${key}:`, error));
    
    // Set up periodic updates
    const intervalId = setInterval(async () => {
      try {
        const data = await this.fetchData(key);
        onData(data);
      } catch (error) {
        console.warn(`Alerts subscription update failed for ${key}:`, error);
      }
    }, interval);
    
    return () => clearInterval(intervalId);
  }

  setObserver(observer: DataServiceObserver): void {
    this.observer = observer;
  }

  validateData(data: unknown): data is AlertData[] {
    return Array.isArray(data) && data.every(item => 
      typeof item === 'object' && 
      item !== null && 
      'id' in item && 
      'type' in item && 
      'severity' in item &&
      'title' in item &&
      'timestamp' in item
    );
  }

  transformData(rawData: unknown): AlertData[] {
    if (this.validateData(rawData)) {
      return rawData;
    }
    throw new Error('Invalid data format for Alerts provider');
  }

  // Utility methods
  private mapNWSSeverity(nwsSeverity: string): AlertData['severity'] {
    switch (nwsSeverity?.toLowerCase()) {
      case 'extreme':
        return 'critical';
      case 'severe':
        return 'high';
      case 'moderate':
        return 'medium';
      case 'minor':
      default:
        return 'low';
    }
  }

  private mapEarthquakeSeverity(magnitude: number): AlertData['severity'] {
    if (magnitude >= 7.0) return 'critical';
    if (magnitude >= 6.0) return 'high';
    if (magnitude >= 5.0) return 'medium';
    return 'low';
  }

  // Static method to get all available data keys
  static getAvailableKeys(): string[] {
    return ['security-alerts', 'weather-alerts', 'geological-alerts', 'all-alerts'];
  }
}
