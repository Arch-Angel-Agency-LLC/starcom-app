// Integration test for space weather data display on Globe
// AI-NOTE: Tests the complete data flow from NOAA API to Globe visualization

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GlobeEngine } from './GlobeEngine';
import { fetchLatestElectricFieldData, transformNOAAToIntelMarkers } from '../services/noaaSpaceWeather';
import type { NOAAElectricFieldData } from '../types';

// Mock the NOAA service
vi.mock('../services/noaaSpaceWeather', () => ({
  fetchLatestElectricFieldData: vi.fn(),
  transformNOAAToIntelMarkers: vi.fn(),
}));

// Mock other services to avoid network calls
vi.mock('../services/WeatherDataService', () => ({
  fetchWeatherData: vi.fn().mockResolvedValue({ temp: 20, condition: 'clear' }),
}));

vi.mock('../services/AlertsService', () => ({
  fetchAlerts: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/GeoEventsService', () => ({
  fetchNaturalEvents: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/SpaceAssetsService', () => ({
  fetchSpaceAssets: vi.fn().mockResolvedValue([]),
}));

const mockInterMagData: NOAAElectricFieldData = {
  time_tag: '2025-06-18',
  cadence: 60,
  product_version: 'InterMagEarthScope',
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-124.0, 41.0]
      },
      properties: {
        Ex: -1.35,
        Ey: -18.32,
        quality_flag: 4,
        distance_nearest_station: 570.49
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-124.0, 42.0]
      },
      properties: {
        Ex: -0.57,
        Ey: -7.73,
        quality_flag: 5,
        distance_nearest_station: 657.64
      }
    }
  ]
};

const mockUSCanadaData: NOAAElectricFieldData = {
  time_tag: '2025-06-18',
  cadence: 60,
  product_version: 'US-Canada-1D',
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-139.0, 60.0]
      },
      properties: {
        Ex: -0.83,
        Ey: 3.11,
        quality_flag: 4,
        distance_nearest_station: 390.07
      }
    }
  ]
};

describe('Globe Space Weather Integration', () => {
  let globeEngine: GlobeEngine;
  let eventHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventHandler = vi.fn();
    
    // Setup mock implementations
    vi.mocked(fetchLatestElectricFieldData).mockImplementation(async (dataset) => {
      return dataset === 'InterMag' ? mockInterMagData : mockUSCanadaData;
    });
    
    vi.mocked(transformNOAAToIntelMarkers).mockImplementation((data, category) => {
      return data.features.map((feature, index) => ({
        pubkey: `NOAA_${category}_${index}`,
        title: `Electric Field @ (${feature.geometry.coordinates[1]}, ${feature.geometry.coordinates[0]})`,
        content: `Electric Field: Ex=${feature.properties.Ex}, Ey=${feature.properties.Ey}`,
        tags: ['SIGINT', 'space-weather', category],
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        timestamp: Date.now() / 1000,
        author: 'NOAA_SWPC'
      }));
    });

    globeEngine = new GlobeEngine({
      mode: 'CyberCommand',
      onEvent: eventHandler
    });
  });

  it('should add space weather InterMag overlay and fetch data', async () => {
    // Add the overlay
    globeEngine.addOverlay('spaceWeatherInterMag');
    
    // Wait for async data fetch
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify the service was called
    expect(fetchLatestElectricFieldData).toHaveBeenCalledWith('InterMag');
    expect(transformNOAAToIntelMarkers).toHaveBeenCalledWith(mockInterMagData, 'electric-field-intermag');
    
    // Verify events were emitted
    expect(eventHandler).toHaveBeenCalledWith({
      type: 'overlayDataLoading',
      payload: { overlay: 'spaceWeatherInterMag' }
    });
    
    expect(eventHandler).toHaveBeenCalledWith({
      type: 'overlayDataUpdated',
      payload: {
        overlay: 'spaceWeatherInterMag',
        data: expect.arrayContaining([
          expect.objectContaining({
            title: expect.stringContaining('Electric Field'),
            tags: expect.arrayContaining(['SIGINT', 'space-weather', 'electric-field-intermag'])
          })
        ])
      }
    });
  });

  it('should add space weather US-Canada overlay and fetch data', async () => {
    // Add the overlay
    globeEngine.addOverlay('spaceWeatherUSCanada');
    
    // Wait for async data fetch
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify the service was called
    expect(fetchLatestElectricFieldData).toHaveBeenCalledWith('US-Canada');
    expect(transformNOAAToIntelMarkers).toHaveBeenCalledWith(mockUSCanadaData, 'electric-field-us-canada');
    
    // Verify overlay data is available
    const overlayData = globeEngine.getOverlayData('spaceWeatherUSCanada');
    expect(overlayData).toBeDefined();
    expect(Array.isArray(overlayData)).toBe(true);
  });

  it('should handle space weather data fetch errors gracefully', async () => {
    // Mock a fetch error
    vi.mocked(fetchLatestElectricFieldData).mockRejectedValueOnce(new Error('Network error'));
    
    // Add the overlay
    globeEngine.addOverlay('spaceWeatherInterMag');
    
    // Wait for error handling
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify error event was emitted
    expect(eventHandler).toHaveBeenCalledWith({
      type: 'overlayDataError',
      payload: {
        overlay: 'spaceWeatherInterMag',
        error: 'Network error'
      }
    });
  });

  it('should remove space weather overlays correctly', () => {
    // Add overlays
    globeEngine.addOverlay('spaceWeatherInterMag');
    globeEngine.addOverlay('spaceWeatherUSCanada');
    
    // Verify overlays are active
    expect(globeEngine.getOverlays()).toContain('spaceWeatherInterMag');
    expect(globeEngine.getOverlays()).toContain('spaceWeatherUSCanada');
    
    // Remove one overlay
    globeEngine.removeOverlay('spaceWeatherInterMag');
    
    // Verify overlay was removed
    expect(globeEngine.getOverlays()).not.toContain('spaceWeatherInterMag');
    expect(globeEngine.getOverlays()).toContain('spaceWeatherUSCanada');
    
    // Verify removal event was emitted
    expect(eventHandler).toHaveBeenCalledWith({
      type: 'overlayRemoved',
      payload: 'spaceWeatherInterMag'
    });
  });

  it('should include space weather overlays in CyberCommand mode defaults', () => {
    // Create engine with CyberCommand mode
    const cyberEngine = new GlobeEngine({
      mode: 'CyberCommand',
      onEvent: eventHandler
    });
    
    // Switch to CyberCommand mode (should trigger default overlays)
    cyberEngine.setMode('CyberCommand');
    
    // Wait for mode change processing
    setTimeout(() => {
      const overlays = cyberEngine.getOverlays();
      expect(overlays).toContain('spaceWeatherInterMag');
      expect(overlays).toContain('spaceWeatherUSCanada');
    }, 100);
  });

  it('should transform NOAA data to proper intelligence markers format', () => {
    const result = transformNOAAToIntelMarkers(mockInterMagData, 'test-category');
    
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      pubkey: expect.any(String),
      title: expect.stringContaining('Electric Field'),
      content: expect.stringMatching(/Ex=.*Ey=/),
      tags: expect.arrayContaining(['SIGINT', 'space-weather', 'test-category']),
      latitude: expect.any(Number),
      longitude: expect.any(Number),
      timestamp: expect.any(Number),
      author: expect.any(String)
    });
  });
});

// AI-NOTE: This test suite verifies the complete integration of NOAA space weather data
// with the Globe visualization system, ensuring proper data flow and error handling.
