// GeoEvents Data Provider for the centralized data management system
// Migrates functionality from GeoEventsService.ts to the new provider pattern
// Supports natural events data (earthquakes, volcanoes, etc.)

import { 
  DataProvider, 
  DataServiceObserver, 
  EndpointConfig, 
  FetchOptions 
} from '../interfaces';

// GeoEvents Data Types
export interface NaturalEvent {
  id: string | number;
  lat: number;
  lng: number;
  type: string; // e.g., 'earthquake', 'volcano', 'wildfire', 'flood'
  magnitude?: number;
  intensity?: number;
  status?: string;
  timestamp?: string;
  description?: string;
  source?: string;
}

export interface USGSEarthquakeData {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      mag: number;
      place: string;
      time: number;
      updated: number;
      tz: number;
      url: string;
      detail: string;
      felt: number | null;
      cdi: number | null;
      mmi: number | null;
      alert: string | null;
      status: string;
      tsunami: number;
      sig: number;
      net: string;
      code: string;
      ids: string;
      sources: string;
      types: string;
      nst: number | null;
      dmin: number | null;
      rms: number;
      gap: number | null;
      magType: string;
      type: string;
      title: string;
    };
    geometry: {
      type: 'Point';
      coordinates: [number, number, number]; // [lng, lat, depth]
    };
    id: string;
  }>;
}

export interface VolcanicEvent {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevation: number;
  type: string;
  status: 'active' | 'dormant' | 'extinct';
  last_eruption?: string;
  country: string;
  region: string;
}

// Union type for all GeoEvents data
export type GeoEventsDataTypes = 
  | NaturalEvent[] 
  | USGSEarthquakeData 
  | VolcanicEvent[];

export class GeoEventsDataProvider implements DataProvider<GeoEventsDataTypes> {
  public readonly id = 'geo-events';
  public readonly name = 'GeoEvents Data Provider';
  
  public readonly endpoints: EndpointConfig[] = [
    // USGS Earthquake data - real-time
    {
      id: 'earthquakes-recent',
      url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
      method: 'GET'
    },
    {
      id: 'earthquakes-major',
      url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
      method: 'GET'
    },
    {
      id: 'earthquakes-all',
      url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
      method: 'GET'
    },
    // NASA FIRMS - Fire Information for Resource Management System (wildfires)
    {
      id: 'wildfires-viirs',
      url: 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/viirs/csv/VNP14IMGTDL_NRT_Global_24h.csv',
      method: 'GET'
    },
    // Legacy/fallback endpoint
    {
      id: 'natural-events-legacy',
      url: 'https://api.starcom.app/natural-events',
      method: 'GET'
    }
  ];

  private observer?: DataServiceObserver;

  async fetchData(key: string, options: FetchOptions = {}): Promise<GeoEventsDataTypes> {
    this.observer?.onFetchStart?.(key, this.id);
    console.debug('Fetching geo events data with options:', options);

    const endpoint = this.endpoints.find(e => e.id === key);
    if (!endpoint) {
      // Default to earthquakes for backward compatibility
      return this.fetchUSGSEarthquakes('earthquakes-recent');
    }

    try {
      let result: GeoEventsDataTypes;

      switch (key) {
        case 'earthquakes-recent':
        case 'earthquakes-major':
        case 'earthquakes-all':
          result = await this.fetchUSGSEarthquakes(key);
          break;
        case 'wildfires-viirs':
          result = await this.fetchWildfireData();
          break;
        case 'volcanoes':
          result = await this.fetchVolcanicData();
          break;
        case 'natural-events-legacy':
        default:
          result = await this.fetchLegacyNaturalEvents();
          break;
      }

      this.observer?.onFetchEnd?.(key, 0, this.id); // Duration tracking could be added
      return result;
    } catch (error) {
      this.observer?.onError?.(key, error as Error, this.id);
      throw error;
    }
  }

  // Migrated from original GeoEventsService.ts with improvements
  private async fetchLegacyNaturalEvents(): Promise<NaturalEvent[]> {
    const apiUrl = import.meta.env.VITE_GEO_EVENTS_API_URL || 'https://api.starcom.app/natural-events';
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch natural events: ${response.status}`);
    }

    const data = await response.json();
    
    // Defensive: ensure array of events
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.events)) return data.events;
    
    return [];
  }

  // New USGS earthquake data integration
  private async fetchUSGSEarthquakes(key: string): Promise<USGSEarthquakeData> {
    const endpoint = this.endpoints.find(e => e.id === key);
    if (!endpoint) {
      throw new Error(`Earthquake endpoint not found: ${key}`);
    }

    const response = await fetch(endpoint.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch USGS earthquake data: ${response.status}`);
    }

    const data = await response.json() as USGSEarthquakeData;
    
    // Validate USGS GeoJSON structure
    if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      throw new Error('Invalid USGS earthquake data format');
    }

    return data;
  }

  // New wildfire data integration (NASA FIRMS)
  private async fetchWildfireData(): Promise<NaturalEvent[]> {
    const endpoint = this.endpoints.find(e => e.id === 'wildfires-viirs');
    if (!endpoint) {
      throw new Error('Wildfire endpoint not configured');
    }

    const response = await fetch(endpoint.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch wildfire data: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    const events: NaturalEvent[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;
      
      const lat = parseFloat(values[0]);
      const lng = parseFloat(values[1]);
      const brightness = parseFloat(values[2]);
      const confidence = parseFloat(values[8]);
      
      if (!isNaN(lat) && !isNaN(lng) && confidence > 30) { // Filter low confidence detections
        events.push({
          id: `fire_${i}_${Date.now()}`,
          lat,
          lng,
          type: 'wildfire',
          intensity: brightness,
          timestamp: values[5], // scan time
          description: `Wildfire detection (confidence: ${confidence}%)`,
          source: 'NASA FIRMS VIIRS'
        });
      }
    }

    return events;
  }

  // New volcanic activity data
  private async fetchVolcanicData(): Promise<VolcanicEvent[]> {
    // Using Smithsonian's Global Volcanism Program API (if available)
    // For now, return mock data - can be expanded to real volcanic activity feeds
    return [
      {
        id: 'kilauea',
        name: 'Kilauea',
        lat: 19.421,
        lng: -155.287,
        elevation: 1247,
        type: 'Shield',
        status: 'active',
        last_eruption: '2023-09-10',
        country: 'United States',
        region: 'Hawaii'
      },
      {
        id: 'etna',
        name: 'Mount Etna',
        lat: 37.734,
        lng: 15.004,
        elevation: 3350,
        type: 'Stratovolcano',
        status: 'active',
        last_eruption: '2023-12-01',
        country: 'Italy',
        region: 'Sicily'
      }
    ];
  }

  // Transform USGS data to our unified NaturalEvent format
  transformUSGSToNaturalEvents(usgsData: USGSEarthquakeData): NaturalEvent[] {
    return usgsData.features.reduce<NaturalEvent[]>((events, feature, index) => {
      const coords = feature?.geometry?.coordinates;
      const props = feature?.properties;

      if (!Array.isArray(coords) || coords.length < 2) {
        console.error('Invalid USGS feature geometry; dropping feature.', { id: feature?.id, index });
        return events;
      }

      const [lng, lat] = coords;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        console.error('Invalid USGS feature coordinates; dropping feature.', { id: feature?.id, index });
        return events;
      }

      events.push({
        id: feature.id,
        lat,
        lng,
        type: 'earthquake',
        magnitude: props?.mag,
        intensity: props?.sig, // Significance
        status: props?.status,
        timestamp: props?.time ? new Date(props.time).toISOString() : undefined,
        description: props?.title,
        source: 'USGS'
      });

      return events;
    }, []);
  }

  subscribe(
    key: string,
    onData: (data: GeoEventsDataTypes) => void,
    options: { interval?: number } = {}
  ): () => void {
    const interval = options.interval || 300000; // Default 5 minutes for geo events
    
    // Initial fetch
    this.fetchData(key).then(onData).catch(error => {
      this.observer?.onError?.(key, error, this.id);
    });

    // Set up polling
    const intervalId = setInterval(async () => {
      try {
        const data = await this.fetchData(key);
        onData(data);
      } catch (error) {
        this.observer?.onError?.(key, error as Error, this.id);
      }
    }, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  setObserver(observer: DataServiceObserver): void {
    this.observer = observer;
  }

  validateData(data: unknown): data is GeoEventsDataTypes {
    if (Array.isArray(data)) {
      // Check if it's an array of NaturalEvents or VolcanicEvents
      return data.every(item => 
        typeof item === 'object' && 
        item !== null &&
        'lat' in item && 
        'lng' in item &&
        typeof item.lat === 'number' &&
        typeof item.lng === 'number'
      );
    }
    
    // Check if it's USGS GeoJSON format
    if (typeof data === 'object' && data !== null && 'type' in data) {
      const geoData = data as USGSEarthquakeData;
      return geoData.type === 'FeatureCollection' && Array.isArray(geoData.features);
    }
    
    return false;
  }

  transformData(rawData: unknown): GeoEventsDataTypes {
    if (!this.validateData(rawData)) {
      throw new Error('Invalid geo events data format');
    }
    return rawData;
  }

  // Utility methods
  getEndpointConfig(key: string): EndpointConfig | undefined {
    return this.endpoints.find(e => e.id === key);
  }

  getSupportedEndpoints(): string[] {
    return this.endpoints.map(e => e.id);
  }
}
