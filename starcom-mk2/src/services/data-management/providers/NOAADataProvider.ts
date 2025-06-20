// NOAA Data Provider for the centralized data management system
// Migrates functionality from noaaSpaceWeather.ts to the new provider pattern
// Supports comprehensive NOAA space weather data endpoints

import { 
  DataProvider, 
  DataServiceObserver, 
  EndpointConfig, 
  FetchOptions 
} from '../interfaces';
import { 
  NOAAElectricFieldData, 
  SpaceWeatherAlert
} from '../../../types/spaceWeather';

// NOAA Space Weather Data Types
export interface NOAAGeomagneticData {
  time_tag: string;
  kp_index: number;
  storm_level: 'quiet' | 'unsettled' | 'active' | 'minor' | 'moderate' | 'strong' | 'severe' | 'extreme';
  dst_index: number;
}

export interface NOAASolarData {
  time_tag: string;
  solar_flux: number;
  sunspot_number: number;
  solar_flare_class: string;
  coronal_mass_ejection: boolean;
}

export interface NOAASolarWindData {
  time_tag: string;
  velocity: number; // km/s
  density: number;  // particles/cm³
  temperature: number; // K
  magnetic_field: {
    magnitude: number; // nT
    direction: { x: number; y: number; z: number };
  };
}

export interface NOAAParticleData {
  time_tag: string;
  proton_flux: number;
  electron_flux: number;
  alpha_particle_flux: number;
  energy_ranges: {
    low: { min: number; max: number };
    medium: { min: number; max: number };
    high: { min: number; max: number };
  };
}

// Union type for all NOAA data
export type NOAADataTypes = 
  | NOAAElectricFieldData 
  | NOAAGeomagneticData 
  | NOAASolarData 
  | NOAASolarWindData 
  | NOAAParticleData;

export class NOAADataProvider implements DataProvider<NOAADataTypes> {
  readonly id: string = 'noaa-space-weather';
  readonly name: string = 'NOAA Space Weather Data Provider';
  readonly endpoints: EndpointConfig[] = [
    // Electric Field Data (existing)
    {
      id: 'electric-field-intermag',
      url: 'https://services.swpc.noaa.gov/json/lists/rgeojson/InterMagEarthScope/',
      method: 'GET'
    },
    {
      id: 'electric-field-us-canada',
      url: 'https://services.swpc.noaa.gov/json/lists/rgeojson/US-Canada-1D/',
      method: 'GET'
    },
    // Geomagnetic Data (new)
    {
      id: 'geomagnetic-indices',
      url: 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
      method: 'GET'
    },
    {
      id: 'dst-index',
      url: 'https://services.swpc.noaa.gov/products/kyoto-dst.json',
      method: 'GET'
    },
    // Solar Activity (new)
    {
      id: 'solar-flux',
      url: 'https://services.swpc.noaa.gov/json/f10_7_cm_flux.json',
      method: 'GET'
    },
    {
      id: 'sunspot-number',
      url: 'https://services.swpc.noaa.gov/json/sunspot_number.json',
      method: 'GET'
    },
    {
      id: 'solar-flares',
      url: 'https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json',
      method: 'GET'
    },
    // Solar Wind (new)
    {
      id: 'solar-wind-plasma',
      url: 'https://services.swpc.noaa.gov/products/solar-wind/plasma-6-hour.json',
      method: 'GET'
    },
    {
      id: 'solar-wind-magnetic',
      url: 'https://services.swpc.noaa.gov/products/solar-wind/mag-6-hour.json',
      method: 'GET'
    },
    // Particle Environment (new)
    {
      id: 'particle-flux-protons',
      url: 'https://services.swpc.noaa.gov/json/goes/primary/integral-protons-6-hour.json',
      method: 'GET'
    },
    {
      id: 'particle-flux-electrons',
      url: 'https://services.swpc.noaa.gov/json/goes/primary/integral-electrons-6-hour.json',
      method: 'GET'
    }
  ];

  private observer?: DataServiceObserver;

  async fetchData(key: string, _options: FetchOptions = {}): Promise<NOAADataTypes> {
    this.observer?.onFetchStart?.(key, this.id);
    const startTime = performance.now();

    try {
      let data: NOAADataTypes;

      switch (key) {
        case 'electric-field-intermag':
          data = await this.fetchElectricFieldData('InterMag');
          break;
        case 'electric-field-us-canada':
          data = await this.fetchElectricFieldData('US-Canada');
          break;
        case 'geomagnetic-indices':
          data = await this.fetchGeomagneticData();
          break;
        case 'solar-activity':
          data = await this.fetchSolarData();
          break;
        case 'solar-wind':
          data = await this.fetchSolarWindData();
          break;
        case 'particle-environment':
          data = await this.fetchParticleData();
          break;
        default:
          throw new Error(`Unknown NOAA data key: ${key}`);
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

  // Migrated from original noaaSpaceWeather.ts
  private async fetchElectricFieldData(dataset: 'InterMag' | 'US-Canada'): Promise<NOAAElectricFieldData> {
    const baseUrl = dataset === 'InterMag' 
      ? 'https://services.swpc.noaa.gov/json/lists/rgeojson/InterMagEarthScope/'
      : 'https://services.swpc.noaa.gov/json/lists/rgeojson/US-Canada-1D/';

    // Get directory listing
    const dirResponse = await fetch(baseUrl);
    if (!dirResponse.ok) {
      throw new Error(`Failed to fetch NOAA directory: ${dirResponse.status}`);
    }

    const html = await dirResponse.text();
    
    // Extract JSON file links using more robust pattern
    const filePattern = dataset === 'InterMag'
      ? /href="(\d{8}T\d{6}-\d{2}-Efield-empirical-EMTF-[\d.-]+x[\d.-]+\.json)"/g
      : /href="(\d{8}T\d{6}-\d{2}-Efield-US-Canada\.json)"/g;
    
    const fileMatches = Array.from(html.matchAll(filePattern));
    if (fileMatches.length === 0) {
      throw new Error(`No electric field files found for dataset: ${dataset}`);
    }

    // Get the latest file (last in chronological order)
    const latestFilename = fileMatches[fileMatches.length - 1][1];

    // Fetch the actual data file
    const dataUrl = `${baseUrl}${latestFilename}`;
    const dataResponse = await fetch(dataUrl);
    if (!dataResponse.ok) {
      throw new Error(`Failed to fetch electric field data: ${dataResponse.status}`);
    }

    const data = await dataResponse.json() as NOAAElectricFieldData;
    return data;
  }

  // New NOAA data endpoints
  private async fetchGeomagneticData(): Promise<NOAAGeomagneticData> {
    const response = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch geomagnetic data: ${response.status}`);
    }

    const rawData = await response.json();
    
    // Transform NOAA format to our interface
    const latest = rawData[rawData.length - 1];
    return {
      time_tag: latest.time_tag,
      kp_index: parseFloat(latest.kp_index),
      storm_level: this.mapKpToStormLevel(parseFloat(latest.kp_index)),
      dst_index: 0 // Will be fetched separately
    };
  }

  private async fetchSolarData(): Promise<NOAASolarData> {
    const [fluxResponse, sunspotResponse, flareResponse] = await Promise.all([
      fetch('https://services.swpc.noaa.gov/json/f10_7_cm_flux.json'),
      fetch('https://services.swpc.noaa.gov/json/sunspot_number.json'),
      fetch('https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json')
    ]);

    if (!fluxResponse.ok || !sunspotResponse.ok || !flareResponse.ok) {
      throw new Error('Failed to fetch solar activity data');
    }

    const [fluxData, sunspotData, flareData] = await Promise.all([
      fluxResponse.json(),
      sunspotResponse.json(),
      flareResponse.json()
    ]);

    const latestFlux = fluxData[fluxData.length - 1];
    const latestSunspot = sunspotData[sunspotData.length - 1];
    const latestFlare = flareData[flareData.length - 1];

    return {
      time_tag: latestFlux.time_tag,
      solar_flux: parseFloat(latestFlux.flux),
      sunspot_number: parseInt(latestSunspot.ssn),
      solar_flare_class: this.determineFlareClas(latestFlare.flux),
      coronal_mass_ejection: false // Would need additional endpoint
    };
  }

  private async fetchSolarWindData(): Promise<NOAASolarWindData> {
    const [plasmaResponse, magResponse] = await Promise.all([
      fetch('https://services.swpc.noaa.gov/products/solar-wind/plasma-6-hour.json'),
      fetch('https://services.swpc.noaa.gov/products/solar-wind/mag-6-hour.json')
    ]);

    if (!plasmaResponse.ok || !magResponse.ok) {
      throw new Error('Failed to fetch solar wind data');
    }

    const [plasmaData, magData] = await Promise.all([
      plasmaResponse.json(),
      magResponse.json()
    ]);

    const latestPlasma = plasmaData[plasmaData.length - 1];
    const latestMag = magData[magData.length - 1];

    return {
      time_tag: latestPlasma.time_tag,
      velocity: parseFloat(latestPlasma.velocity),
      density: parseFloat(latestPlasma.density),
      temperature: parseFloat(latestPlasma.temperature),
      magnetic_field: {
        magnitude: parseFloat(latestMag.bt),
        direction: {
          x: parseFloat(latestMag.bx),
          y: parseFloat(latestMag.by),
          z: parseFloat(latestMag.bz)
        }
      }
    };
  }

  private async fetchParticleData(): Promise<NOAAParticleData> {
    const [protonResponse, electronResponse] = await Promise.all([
      fetch('https://services.swpc.noaa.gov/json/goes/primary/integral-protons-6-hour.json'),
      fetch('https://services.swpc.noaa.gov/json/goes/primary/integral-electrons-6-hour.json')
    ]);

    if (!protonResponse.ok || !electronResponse.ok) {
      throw new Error('Failed to fetch particle flux data');
    }

    const [protonData, electronData] = await Promise.all([
      protonResponse.json(),
      electronResponse.json()
    ]);

    const latestProton = protonData[protonData.length - 1];
    const latestElectron = electronData[electronData.length - 1];

    return {
      time_tag: latestProton.time_tag,
      proton_flux: parseFloat(latestProton.flux),
      electron_flux: parseFloat(latestElectron.flux),
      alpha_particle_flux: 0, // Would need additional endpoint
      energy_ranges: {
        low: { min: 0.1, max: 1.0 },
        medium: { min: 1.0, max: 10.0 },
        high: { min: 10.0, max: 100.0 }
      }
    };
  }

  subscribe(
    key: string,
    onData: (data: NOAADataTypes) => void,
    options: { interval?: number } = {}
  ): () => void {
    const interval = options.interval ?? 5 * 60 * 1000; // Default 5 minutes (NOAA update frequency)
    
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

  setObserver(observer: DataServiceObserver): void {
    this.observer = observer;
  }

  validateData(data: unknown): data is NOAADataTypes {
    // Basic validation - could be enhanced
    return typeof data === 'object' && data !== null && 'time_tag' in data;
  }

  transformData(rawData: unknown): NOAADataTypes {
    if (this.validateData(rawData)) {
      return rawData;
    }
    throw new Error('Invalid data format for NOAA provider');
  }

  // Utility methods
  private mapKpToStormLevel(kp: number): NOAAGeomagneticData['storm_level'] {
    if (kp < 3) return 'quiet';
    if (kp < 4) return 'unsettled';
    if (kp < 5) return 'active';
    if (kp < 6) return 'minor';
    if (kp < 7) return 'moderate';
    if (kp < 8) return 'strong';
    if (kp < 9) return 'severe';
    return 'extreme';
  }

  private determineFlareClas(flux: number): string {
    if (flux < 1e-6) return 'A';
    if (flux < 1e-5) return 'B';
    if (flux < 1e-4) return 'C';
    if (flux < 1e-3) return 'M';
    return 'X';
  }

  // Migrated utility functions from original service
  async generateSpaceWeatherAlerts(data: NOAAElectricFieldData): Promise<SpaceWeatherAlert[]> {
    const alerts: SpaceWeatherAlert[] = [];
    
    for (const feature of data.features) {
      const magnitude = Math.sqrt(
        feature.properties.Ex ** 2 + feature.properties.Ey ** 2
      );
      
      if (magnitude > 3000) { // High threshold in mV/km
        alerts.push({
          id: `electric-field-${feature.geometry.coordinates.join('-')}`,
          alertType: 'electric_field_anomaly',
          severity: 'high',
          timestamp: new Date().toISOString(),
          regions: ['global'], // Could be made more specific based on coordinates
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
    
    return alerts;
  }

  // Static method to get all available data keys
  static getAvailableKeys(): string[] {
    return [
      'electric-field-intermag',
      'electric-field-us-canada', 
      'geomagnetic-indices',
      'solar-activity',
      'solar-wind',
      'particle-environment'
    ];
  }
}
