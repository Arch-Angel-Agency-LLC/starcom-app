// SpaceAssets Data Provider for the centralized data management system
// Migrates functionality from SpaceAssetsService.ts to the new provider pattern
// Supports satellite tracking, space debris, and orbital asset data

import { 
  DataProvider, 
  DataServiceObserver, 
  EndpointConfig, 
  FetchOptions 
} from '../interfaces';

// SpaceAssets Data Types
export interface SpaceAsset {
  id: string | number;
  lat: number;
  lng: number;
  type: string; // e.g., 'satellite', 'debris', 'station', 'rocket'
  name: string;
  altitude: number;
  timestamp?: string;
  velocity?: number;
  inclination?: number;
  eccentricity?: number;
  period?: number; // orbital period in minutes
  classification?: 'public' | 'military' | 'commercial' | 'scientific';
  status?: 'active' | 'inactive' | 'decayed' | 'unknown';
}

export interface CelesTrakTLE {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE: number;
  CLASSIFICATION_TYPE: string;
  NORAD_CAT_ID: number;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
}

export interface N2YOSatelliteData {
  info: {
    satname: string;
    satid: number;
    transactionscount: number;
  };
  positions: Array<{
    satlatitude: number;
    satlongitude: number;
    sataltitude: number;
    azimuth: number;
    elevation: number;
    ra: number;
    dec: number;
    timestamp: number;
  }>;
}

// Union type for all SpaceAssets data
export type SpaceAssetsDataTypes = 
  | SpaceAsset[] 
  | CelesTrakTLE[] 
  | N2YOSatelliteData;

export class SpaceAssetsDataProvider implements DataProvider<SpaceAssetsDataTypes> {
  public readonly id = 'space-assets';
  public readonly name = 'Space Assets Data Provider';
  
  public readonly endpoints: EndpointConfig[] = [
    // CelesTrak TLE data - authoritative source for satellite tracking
    {
      id: 'active-satellites',
      url: 'https://celestrak.com/NORAD/elements/gp.php?GROUP=active&FORMAT=json',
      method: 'GET'
    },
    {
      id: 'space-stations',
      url: 'https://celestrak.com/NORAD/elements/gp.php?GROUP=stations&FORMAT=json',
      method: 'GET'
    },
    {
      id: 'starlink',
      url: 'https://celestrak.com/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json',
      method: 'GET'
    },
    {
      id: 'gps-operational',
      url: 'https://celestrak.com/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=json',
      method: 'GET'
    },
    {
      id: 'debris-high-interest',
      url: 'https://celestrak.com/NORAD/elements/gp.php?GROUP=cosmos-2251-debris&FORMAT=json',
      method: 'GET'
    },
    // N2YO API for real-time satellite positions (requires API key)
    {
      id: 'iss-position',
      url: 'https://api.n2yo.com/rest/v1/satellite/positions/25544/0/0/0/1/',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    },
    // Legacy/fallback endpoint
    {
      id: 'space-assets-legacy',
      url: 'https://api.starcom.app/space-assets',
      method: 'GET'
    }
  ];

  private observer?: DataServiceObserver;

  async fetchData(key: string, options: FetchOptions = {}): Promise<SpaceAssetsDataTypes> {
    this.observer?.onFetchStart?.(key, this.id);
    console.debug('Fetching space assets data with options:', options);

    const endpoint = this.endpoints.find(e => e.id === key);
    if (!endpoint) {
      // Default to active satellites for backward compatibility
      return this.fetchCelesTrakData('active-satellites');
    }

    try {
      let result: SpaceAssetsDataTypes;

      switch (key) {
        case 'active-satellites':
        case 'space-stations':
        case 'starlink':
        case 'gps-operational':
        case 'debris-high-interest':
          result = await this.fetchCelesTrakData(key);
          break;
        case 'iss-position':
          result = await this.fetchN2YOData(key);
          break;
        case 'space-assets-legacy':
        default:
          result = await this.fetchLegacySpaceAssets();
          break;
      }

      this.observer?.onFetchEnd?.(key, 0, this.id); // Duration tracking could be added
      return result;
    } catch (error) {
      this.observer?.onError?.(key, error as Error, this.id);
      throw error;
    }
  }

  // Migrated from original SpaceAssetsService.ts with improvements
  private async fetchLegacySpaceAssets(): Promise<SpaceAsset[]> {
    const apiUrl = import.meta.env.VITE_SPACE_ASSETS_API_URL || 'https://api.starcom.app/space-assets';
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch space assets: ${response.status}`);
    }

    const data = await response.json();
    
    // Defensive: ensure array of assets
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.assets)) return data.assets;
    
    return [];
  }

  // New CelesTrak TLE data integration
  private async fetchCelesTrakData(key: string): Promise<CelesTrakTLE[]> {
    const endpoint = this.endpoints.find(e => e.id === key);
    if (!endpoint) {
      throw new Error(`CelesTrak endpoint not found: ${key}`);
    }

    console.log(`🌐 SpaceAssetsDataProvider: Fetching real data from CelesTrak: ${endpoint.url}`);
    const response = await fetch(endpoint.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch CelesTrak data: ${response.status}`);
    }

    const data = await response.json() as CelesTrakTLE[];
    
    // Validate CelesTrak TLE structure
    if (!Array.isArray(data)) {
      throw new Error('Invalid CelesTrak data format: expected array');
    }

    console.log(`✅ SpaceAssetsDataProvider: Successfully loaded ${data.length} real satellites from CelesTrak for '${key}'`);
    if (data.length > 0) {
      console.log(`📡 Sample satellite from CelesTrak: ${data[0].OBJECT_NAME} (ID: ${data[0].NORAD_CAT_ID})`);
    }

    return data;
  }

  // New N2YO API integration for real-time satellite positions
  private async fetchN2YOData(key: string): Promise<N2YOSatelliteData> {
    const endpoint = this.endpoints.find(e => e.id === key);
    if (!endpoint) {
      throw new Error(`N2YO endpoint not found: ${key}`);
    }

    const apiKey = import.meta.env.VITE_N2YO_API_KEY;
    if (!apiKey) {
      throw new Error('N2YO API key not configured');
    }

    const url = `${endpoint.url}&apiKey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch N2YO data: ${response.status}`);
    }

    const data = await response.json() as N2YOSatelliteData;
    
    // Validate N2YO data structure
    if (!data.info || !Array.isArray(data.positions)) {
      throw new Error('Invalid N2YO data format');
    }

    return data;
  }

  // Transform CelesTrak TLE data to our unified SpaceAsset format
  transformCelesTrakToSpaceAssets(tleData: CelesTrakTLE[]): SpaceAsset[] {
    return tleData.map(tle => ({
      id: tle.NORAD_CAT_ID,
      name: tle.OBJECT_NAME,
      lat: 0, // Position needs orbital calculation
      lng: 0, // Position needs orbital calculation
      altitude: this.calculateAltitudeFromMeanMotion(tle.MEAN_MOTION),
      type: this.classifySpaceAsset(tle.OBJECT_NAME, tle.CLASSIFICATION_TYPE),
      timestamp: tle.EPOCH,
      inclination: tle.INCLINATION,
      eccentricity: tle.ECCENTRICITY,
      period: 1440 / tle.MEAN_MOTION, // Convert mean motion to period in minutes
      classification: tle.CLASSIFICATION_TYPE === 'U' ? 'public' : 'military',
      status: 'active' // CelesTrak typically contains active objects
    }));
  }

  // Transform N2YO data to our unified SpaceAsset format
  transformN2YOToSpaceAssets(n2yoData: N2YOSatelliteData): SpaceAsset[] {
    return n2yoData.positions.map((pos, index) => ({
      id: `${n2yoData.info.satid}_${index}`,
      name: n2yoData.info.satname,
      lat: pos.satlatitude,
      lng: pos.satlongitude,
      altitude: pos.sataltitude,
      type: 'satellite',
      timestamp: new Date(pos.timestamp * 1000).toISOString(),
      status: 'active'
    }));
  }

  // Utility method to estimate altitude from mean motion
  private calculateAltitudeFromMeanMotion(meanMotion: number): number {
    // Simplified calculation: higher mean motion = lower altitude
    // Mean motion is revolutions per day
    const period = 1440 / meanMotion; // Period in minutes
    const semiMajorAxis = Math.pow((period * 60) / (2 * Math.PI), 2) * 3.986004418e14; // GM of Earth
    const radius = Math.pow(semiMajorAxis, 1/3);
    return (radius - 6371000) / 1000; // Altitude in km above Earth's surface
  }

  // Classify space assets based on name and type
  private classifySpaceAsset(name: string, classification: string): string {
    const nameUpper = name.toUpperCase();
    
    if (nameUpper.includes('STARLINK')) return 'satellite';
    if (nameUpper.includes('DEBRIS') || nameUpper.includes('DEB')) return 'debris';
    if (nameUpper.includes('STATION') || nameUpper.includes('ISS')) return 'station';
    if (nameUpper.includes('ROCKET') || nameUpper.includes('R/B')) return 'rocket';
    if (nameUpper.includes('GPS') || nameUpper.includes('GALILEO') || nameUpper.includes('GLONASS')) return 'satellite';
    
    return classification === 'U' ? 'satellite' : 'military';
  }

  subscribe(
    key: string,
    onData: (data: SpaceAssetsDataTypes) => void,
    options: { interval?: number } = {}
  ): () => void {
    const interval = options.interval || 60000; // Default 1 minute for space assets (they move fast!)
    
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

  validateData(data: unknown): data is SpaceAssetsDataTypes {
    if (Array.isArray(data)) {
      // Check if it's an array of SpaceAssets
      if (data.length === 0) return true; // Empty array is valid
      
      const firstItem = data[0];
      if ('lat' in firstItem && 'lng' in firstItem && 'altitude' in firstItem) {
        // SpaceAsset format
        return data.every(item => 
          typeof item === 'object' && 
          item !== null &&
          'lat' in item && 
          'lng' in item &&
          'altitude' in item &&
          typeof item.lat === 'number' &&
          typeof item.lng === 'number' &&
          typeof item.altitude === 'number'
        );
      }
      
      if ('OBJECT_NAME' in firstItem && 'NORAD_CAT_ID' in firstItem) {
        // CelesTrak TLE format
        return data.every(item => 
          typeof item === 'object' && 
          item !== null &&
          'OBJECT_NAME' in item && 
          'NORAD_CAT_ID' in item
        );
      }
    }
    
    // Check if it's N2YO format
    if (typeof data === 'object' && data !== null && 'info' in data && 'positions' in data) {
      const n2yoData = data as N2YOSatelliteData;
      return typeof n2yoData.info === 'object' && Array.isArray(n2yoData.positions);
    }
    
    return false;
  }

  transformData(rawData: unknown): SpaceAssetsDataTypes {
    if (!this.validateData(rawData)) {
      throw new Error('Invalid space assets data format');
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
