// EIA Data Provider for the centralized data management system
// Migrates functionality from legacy EIAService to the new provider pattern

import { DataProvider, DataServiceObserver, EndpointConfig } from '../interfaces';

interface EIADataResponse {
  response: {
    data: Array<{
      period: string;
      value: number;
    }>;
  };
}

export class EIADataProvider implements DataProvider<number> {
  readonly id = 'eia-provider';
  readonly name = 'Energy Information Administration Data Provider';
  readonly endpoints: EndpointConfig[] = [
    {
      id: 'oil-price',
      url: 'https://api.eia.gov/v2/seriesid/PET.RWTC.W',
      method: 'GET',
      params: { api_key: import.meta.env.VITE_EIA_API_KEY || '' }
    },
    {
      id: 'gasoline-price',
      url: 'https://api.eia.gov/v2/seriesid/PET.EMM_EPM0_PTE_NUS_DPG.W',
      method: 'GET',
      params: { api_key: import.meta.env.VITE_EIA_API_KEY || '' }
    },
    {
      id: 'oil-inventory',
      url: 'https://api.eia.gov/v2/seriesid/PET.WCRSTUS1.W',
      method: 'GET',
      params: { api_key: import.meta.env.VITE_EIA_API_KEY || '' }
    },
    {
      id: 'natural-gas-storage',
      url: 'https://api.eia.gov/v2/seriesid/NG.NW2_EPG0_SWO_R48_BCF.W',
      method: 'GET',
      params: { api_key: import.meta.env.VITE_EIA_API_KEY || '' }
    }
  ];
  
  private observer?: DataServiceObserver;

  async fetchData(key: string): Promise<number> {
    this.observer?.onFetchStart?.(key, this.id);
    const startTime = Date.now();
    
    try {
      const endpointConfig = this.endpoints.find(e => e.id === key);
      if (!endpointConfig) {
        throw new Error(`Unknown EIA data key: ${key}. Available keys: ${this.endpoints.map(e => e.id).join(', ')}`);
      }
      
      const url = new URL(endpointConfig.url);
      if (endpointConfig.params) {
        Object.entries(endpointConfig.params).forEach(([paramKey, value]) => {
          url.searchParams.append(paramKey, value);
        });
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`EIA API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data: EIADataResponse = await response.json();
      const value = data?.response?.data?.[0]?.value;
      
      if (typeof value !== 'number') {
        throw new Error(`Invalid EIA data format for key: ${key}`);
      }
      
      const duration = Date.now() - startTime;
      this.observer?.onFetchEnd?.(key, duration, this.id);
      
      return value;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.observer?.onError?.(key, error as Error, this.id);
      this.observer?.onFetchEnd?.(key, duration, this.id);
      throw error;
    }
  }

  subscribe(
    key: string, 
    onData: (data: number) => void, 
    options: { interval?: number } = {}
  ): () => void {
    const interval = options.interval ?? 5 * 60 * 1000; // Default 5 minutes
    
    // Initial fetch
    this.fetchData(key)
      .then(onData)
      .catch(error => console.warn(`Initial EIA data fetch failed for ${key}:`, error));
    
    // Set up periodic updates
    const intervalId = setInterval(async () => {
      try {
        const data = await this.fetchData(key);
        onData(data);
      } catch (error) {
        console.warn(`EIA data subscription update failed for ${key}:`, error);
      }
    }, interval);
    
    // Return unsubscribe function
    return () => {
      clearInterval(intervalId);
    };
  }

  setObserver(observer: DataServiceObserver): void {
    this.observer = observer;
  }

  // Validation method to ensure data is a number
  validateData(data: unknown): data is number {
    return typeof data === 'number' && !isNaN(data);
  }

  // Data transformation (passthrough for numbers)
  transformData(rawData: unknown): number {
    if (this.validateData(rawData)) {
      return rawData;
    }
    throw new Error('Invalid data type for EIA provider - expected number');
  }

  // Static method to get all available data keys
  static getAvailableKeys(): string[] {
    return ['oil-price', 'gasoline-price', 'oil-inventory', 'natural-gas-storage'];
  }
}
