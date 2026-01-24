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
  private static readonly DEFAULT_TIMEOUT_MS = 12000;
  private static readonly DEFAULT_RETRIES = 1;
  private readonly lastGoodData = new Map<string, { data: GeoEventsDataTypes; timestamp: number }>();
  private readonly warnOnceTags = new Set<string>();
  
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
    // Volcanoes (mock/static) - keep a dedicated key to avoid accidental fallback
    {
      id: 'volcanoes',
      url: 'mock://volcanoes',
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
    const startTime = Date.now();
    this.observer?.onFetchStart?.(key, this.id);
    this.logInfo('Fetch start', key, { options });

    const timeoutMs = options.timeout ?? GeoEventsDataProvider.DEFAULT_TIMEOUT_MS;
    const retries = options.retries ?? GeoEventsDataProvider.DEFAULT_RETRIES;

    try {
      let result: GeoEventsDataTypes;

      switch (key) {
        case 'earthquakes-recent':
        case 'earthquakes-major':
        case 'earthquakes-all': {
          const endpoint = this.endpoints.find(e => e.id === key);
          if (!endpoint) {
            this.warnOnce(`missing-endpoint-${key}`, `Endpoint missing for ${key}; returning empty.`);
            result = [];
          } else {
            result = await this.fetchUSGSEarthquakes(key, { timeoutMs, retries });
          }
          break;
        }
        case 'wildfires-viirs':
          // Disable direct FIRMS fetch in browser (CORS). Return empty to avoid noisy errors.
          this.logInfo('Wildfire feed disabled in browser; returning empty set', key);
          result = [];
          break;
        case 'volcanoes':
          result = await this.fetchVolcanicData();
          break;
        case 'natural-events-legacy':
          result = await this.fetchLegacyNaturalEvents({ timeoutMs, retries });
          break;
        default: {
          this.warnOnce(`unknown-key-${key}`, `Unknown geo-events key '${key}' requested; falling back to earthquakes-recent.`);
          result = await this.fetchUSGSEarthquakes('earthquakes-recent', { timeoutMs, retries });
        }
      }

      const duration = Date.now() - startTime;
      this.recordGoodData(key, result);
      this.observer?.onFetchEnd?.(key, duration, this.id);
      this.logInfo('Fetch complete', key, { durationMs: duration, source: this.id });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.observer?.onError?.(key, error as Error, this.id);
      this.observer?.onFetchEnd?.(key, duration, this.id);
      this.logError('Fetch failed', key, error as Error, { durationMs: duration, timeoutMs, retries });

      const cached = this.lastGoodData.get(key);
      if (cached) {
        this.logWarn('Serving last known good data after failure', key, { ageMs: Date.now() - cached.timestamp });
        return cached.data;
      }

      throw error;
    }
  }

  // Migrated from original GeoEventsService.ts with improvements
  private async fetchLegacyNaturalEvents(opts: { timeoutMs: number; retries: number }): Promise<NaturalEvent[]> {
    const apiUrl = import.meta.env.VITE_GEO_EVENTS_API_URL || 'https://api.starcom.app/natural-events';
    const data = await this.fetchJsonWithDiagnostics('natural-events-legacy', apiUrl, opts);

    if (data !== undefined && !Array.isArray(data)) {
      this.logWarn('Legacy natural events payload is not an array; returning empty', 'natural-events-legacy', {
        receivedType: typeof data,
        sampleKeys: typeof data === 'object' && data ? Object.keys(data as Record<string, unknown>).slice(0, 5) : []
      });
      return [];
    }

    return Array.isArray(data) ? data : [];
  }

  // New USGS earthquake data integration
  private async fetchUSGSEarthquakes(key: string, opts: { timeoutMs: number; retries: number }): Promise<USGSEarthquakeData> {
    const endpoint = this.endpoints.find(e => e.id === key);
    if (!endpoint) {
      throw new Error(`Earthquake endpoint not found: ${key}`);
    }

    const data = await this.fetchJsonWithDiagnostics(key, endpoint.url, opts) as USGSEarthquakeData;

    // Validate USGS GeoJSON structure
    if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      this.logError('Invalid USGS earthquake data format', key, new Error('Invalid format'), {
        receivedType: data?.type,
        featureCount: Array.isArray(data?.features) ? data.features.length : 'n/a'
      });
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
    try {
      const response = await fetch(endpoint.url, { mode: 'cors' as RequestMode });
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
        
        if (!isNaN(lat) && !isNaN(lng) && confidence > 30) {
          events.push({
            id: `fire_${i}_${Date.now()}`,
            lat,
            lng,
            type: 'wildfire',
            intensity: brightness,
            timestamp: values[5],
            description: `Wildfire detection (confidence: ${confidence}%)`,
            source: 'NASA FIRMS VIIRS'
          });
        }
      }

      return events;
    } catch (error) {
      console.warn('Wildfire feed unavailable (likely CORS); returning empty wildfire set', error);
      return [];
    }
  }

  // New volcanic activity data
  private async fetchVolcanicData(): Promise<VolcanicEvent[]> {
    // Using Smithsonian's Global Volcanism Program API (if available)
    // For now, return mock data - can be expanded to real volcanic activity feeds
    this.logInfo('Volcanic data using mock dataset', 'volcanoes');
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

  private async fetchJsonWithDiagnostics(endpointId: string, url: string, opts: { timeoutMs: number; retries: number }): Promise<unknown> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= opts.retries; attempt++) {
      const start = Date.now();
      try {
        this.logInfo('Fetch attempt', endpointId, { url, attempt, timeoutMs: opts.timeoutMs });
        const response = await this.fetchWithTimeout(url, opts.timeoutMs);
        const duration = Date.now() - start;

        if (!response.ok) {
          lastError = new Error(`HTTP ${response.status}`);
          this.logWarn('Fetch received non-OK status', endpointId, { status: response.status, durationMs: duration, attempt });
          this.warnOnce(`non-ok-${endpointId}-${response.status}`, `Non-OK response for ${endpointId}: ${response.status}`, {
            url,
            statusText: response.statusText
          });
          continue;
        }

        const contentLength = Number(response.headers.get('content-length') || 0);
        const json = await response.json();
        this.logInfo('Fetch succeeded', endpointId, { durationMs: duration, contentLength, attempt });
        return json;
      } catch (error) {
        const duration = Date.now() - start;
        lastError = error;
        this.logError('Fetch attempt failed', endpointId, error as Error, { attempt, durationMs: duration });
      }
    }

    throw lastError ?? new Error(`Failed to fetch ${endpointId}`);
  }

  private async fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  private recordGoodData(key: string, data: GeoEventsDataTypes): void {
    this.lastGoodData.set(key, { data, timestamp: Date.now() });
  }

  private logInfo(message: string, key: string, extra?: Record<string, unknown>): void {
    console.info(`[GeoEvents] ${message}`, { key, ...extra });
  }

  private logWarn(message: string, key: string, extra?: Record<string, unknown>): void {
    console.warn(`[GeoEvents] ${message}`, { key, ...extra });
  }

  private logError(message: string, key: string, error: Error, extra?: Record<string, unknown>): void {
    console.error(`[GeoEvents] ${message}`, { key, error: error.message, stack: error.stack, ...extra });
  }

  private warnOnce(tag: string, message: string, extra?: Record<string, unknown>): void {
    if (this.warnOnceTags.has(tag)) return;
    this.warnOnceTags.add(tag);
    console.warn(`[GeoEvents] ${message}`, extra ?? {});
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
      this.logError('Subscription initial fetch failed', key, error as Error);
    });

    // Set up polling
    const intervalId = setInterval(async () => {
      try {
        const data = await this.fetchData(key);
        onData(data);
      } catch (error) {
        this.observer?.onError?.(key, error as Error, this.id);
        this.logError('Subscription poll failed', key, error as Error);
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
