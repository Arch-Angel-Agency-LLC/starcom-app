// Weather Data Provider for the centralized data management system
// Migrates functionality from WeatherDataService.ts to the new provider pattern

import { 
  DataProvider, 
  DataServiceObserver, 
  EndpointConfig, 
  FetchOptions 
} from '../interfaces';

export interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  windSpeed: number;
  humidity: number;
  pressure?: number;
  visibility?: number;
  uvIndex?: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export interface WeatherForecastData {
  dateTime: string;
  temperature: number;
  description: string;
  windSpeed: number;
  humidity: number;
  precipitationChance?: number;
}

export class WeatherDataProvider implements DataProvider<WeatherData | WeatherForecastData[]> {
  readonly id: string = 'weather-data';
  readonly name: string = 'Weather Data Provider';
  readonly endpoints: EndpointConfig[] = [
    {
      id: 'current-weather',
      url: 'https://api.openweathermap.org/data/2.5/weather',
      method: 'GET',
      params: {
        units: 'metric'
      }
    },
    {
      id: 'weather-forecast',
      url: 'https://api.openweathermap.org/data/2.5/forecast',
      method: 'GET',
      params: {
        units: 'metric'
      }
    }
  ];

  private observer?: DataServiceObserver;
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenWeatherMap API key not configured');
    }
  }

  async fetchData(key: string, options: FetchOptions = {}): Promise<WeatherData | WeatherForecastData[]> {
    this.observer?.onFetchStart?.(key, this.id);
    console.debug('Fetching weather data with options:', options);
    const startTime = performance.now();

    try {
      let data: WeatherData | WeatherForecastData[];

      if (key.startsWith('current-weather:')) {
        const coords = this.parseCoordinates(key);
        data = await this.fetchCurrentWeather(coords.lat, coords.lng);
      } else if (key.startsWith('weather-forecast:')) {
        const coords = this.parseCoordinates(key);
        data = await this.fetchWeatherForecast(coords.lat, coords.lng);
      } else {
        throw new Error(`Unknown weather data key: ${key}`);
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

  // Migrated from WeatherDataService.ts
  private async fetchCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    if (!this.apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    const url = new URL('https://api.openweathermap.org/data/2.5/weather');
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lng.toString());
    url.searchParams.set('units', 'metric');
    url.searchParams.set('appid', this.apiKey);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Weather API request failed: ${response.status} ${response.statusText}`);
    }

    const rawData = await response.json();

    return {
      location: rawData.name || `${lat}, ${lng}`,
      temperature: rawData.main.temp,
      description: rawData.weather[0].description,
      windSpeed: rawData.wind?.speed || 0,
      humidity: rawData.main.humidity,
      pressure: rawData.main.pressure,
      visibility: rawData.visibility ? rawData.visibility / 1000 : undefined, // Convert to km
      uvIndex: rawData.uvi,
      coordinates: {
        latitude: lat,
        longitude: lng
      },
      timestamp: new Date().toISOString()
    };
  }

  // Migrated from WeatherDataService.ts
  private async fetchWeatherForecast(lat: number, lng: number): Promise<WeatherForecastData[]> {
    if (!this.apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    const url = new URL('https://api.openweathermap.org/data/2.5/forecast');
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lng.toString());
    url.searchParams.set('units', 'metric');
    url.searchParams.set('appid', this.apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Weather forecast API request failed: ${response.status} ${response.statusText}`);
    }

    const rawData = await response.json();

    interface WeatherForecastEntry {
      dt_txt: string;
      main: {
        temp: number;
        humidity: number;
      };
      weather: Array<{ description: string }>;
      wind?: { speed: number };
      pop?: number; // Probability of precipitation
    }

    return rawData.list.map((entry: WeatherForecastEntry) => ({
      dateTime: entry.dt_txt,
      temperature: entry.main.temp,
      description: entry.weather[0].description,
      windSpeed: entry.wind?.speed || 0,
      humidity: entry.main.humidity,
      precipitationChance: entry.pop ? entry.pop * 100 : undefined // Convert to percentage
    }));
  }

  subscribe(
    key: string,
    onData: (data: WeatherData | WeatherForecastData[]) => void,
    options: { interval?: number } = {}
  ): () => void {
    const interval = options.interval ?? 10 * 60 * 1000; // Default 10 minutes
    
    // Initial fetch
    this.fetchData(key)
      .then(onData)
      .catch(error => console.warn(`Initial weather data fetch failed for ${key}:`, error));
    
    // Set up periodic updates
    const intervalId = setInterval(async () => {
      try {
        const data = await this.fetchData(key);
        onData(data);
      } catch (error) {
        console.warn(`Weather data subscription update failed for ${key}:`, error);
      }
    }, interval);
    
    return () => clearInterval(intervalId);
  }

  setObserver(observer: DataServiceObserver): void {
    this.observer = observer;
  }

  validateData(data: unknown): data is WeatherData | WeatherForecastData[] {
    if (Array.isArray(data)) {
      // Forecast data
      return data.every(item => 
        typeof item === 'object' && 
        item !== null && 
        'dateTime' in item && 
        'temperature' in item
      );
    } else {
      // Current weather data
      return typeof data === 'object' && 
             data !== null && 
             'location' in data && 
             'temperature' in data;
    }
  }

  transformData(rawData: unknown): WeatherData | WeatherForecastData[] {
    if (this.validateData(rawData)) {
      return rawData;
    }
    throw new Error('Invalid data format for Weather provider');
  }

  // Utility methods
  private parseCoordinates(key: string): { lat: number; lng: number } {
    // Expected format: "current-weather:lat,lng" or "weather-forecast:lat,lng"
    const parts = key.split(':');
    if (parts.length !== 2) {
      throw new Error(`Invalid weather key format: ${key}`);
    }

    const coords = parts[1].split(',');
    if (coords.length !== 2) {
      throw new Error(`Invalid coordinates format in key: ${key}`);
    }

    const lat = parseFloat(coords[0]);
    const lng = parseFloat(coords[1]);

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error(`Invalid coordinate values in key: ${key}`);
    }

    return { lat, lng };
  }

  // Static method to create key for current weather
  static createCurrentWeatherKey(lat: number, lng: number): string {
    return `current-weather:${lat},${lng}`;
  }

  // Static method to create key for weather forecast
  static createForecastKey(lat: number, lng: number): string {
    return `weather-forecast:${lat},${lng}`;
  }

  // Static method to get all available data types
  static getAvailableKeys(): string[] {
    return ['current-weather', 'weather-forecast'];
  }
}
