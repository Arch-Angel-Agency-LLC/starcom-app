// NOAASolarDataService.test.ts - TDD specifications for NOAA Solar Data Service
// Phase 2 Week 4: NOAA Data Service Architecture

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NOAASolarDataService } from '../NOAASolarDataService';
import type { 
  SolarXrayFlux, 
  SolarFlareEvent, 
  SolarDataUpdateEvent,
  NOAASolarDataServiceConfig,
  SolarDataQuality 
} from '../types';

// Mock fetch for testing
global.fetch = vi.fn();

describe('NOAASolarDataService - TDD Specifications', () => {
  let service: NOAASolarDataService;
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.mocked(fetch);
    mockFetch.mockClear();
  });

  afterEach(() => {
    if (service) {
      service.dispose();
    }
    vi.clearAllTimers();
  });

  describe('Phase 2 Week 4 Day 1-2: Data Service Architecture', () => {
    it('should create NOAASolarDataService with default configuration', () => {
      service = new NOAASolarDataService();
      expect(service).toBeDefined();
      expect(service.isConnected()).toBe(false);
      expect(service.getLastUpdate()).toBeNull();
    });

    it('should create NOAASolarDataService with custom configuration', () => {
      const config: NOAASolarDataServiceConfig = {
        updateInterval: 30000, // 30 seconds
        dataRetentionHours: 48,
        enableCaching: true,
        fallbackMode: false,
        apiTimeout: 10000
      };

      service = new NOAASolarDataService(config);
      expect(service).toBeDefined();
      expect(service.getConfig()).toEqual(expect.objectContaining(config));
    });

    it('should implement X-ray flux data fetching', async () => {
      // Mock NOAA X-ray flux response
      const mockXrayData = {
        data: [{
          timestamp: '2025-07-14T13:30:00Z',
          flux_short: 1.2e-6,
          flux_long: 8.5e-7,
          classification: 'B1.2'
        }]
      };

      // Mock both connect and getXrayFlux calls
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockXrayData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockXrayData
        });

      service = new NOAASolarDataService({ fallbackMode: false });
      await service.connect();

      const xrayFlux = await service.getXrayFlux();
      expect(xrayFlux).toBeDefined();
      expect(xrayFlux.current.classification).toBe('B1.2');
      expect(xrayFlux.current.fluxShort).toBe(1.2e-6);
      expect(xrayFlux.current.fluxLong).toBe(8.5e-7);
    });

    it('should implement solar flare event detection', async () => {
      const mockFlareData = {
        events: [{
          id: 'flare_001',
          start_time: '2025-07-14T13:25:00Z',
          peak_time: '2025-07-14T13:30:00Z',
          end_time: '2025-07-14T13:35:00Z',
          classification: 'M2.5',
          location: 'N15E45',
          peak_flux: 2.5e-5
        }]
      };

      // Mock both connect and getSolarFlares calls
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }) // Connect call
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFlareData
        });

      service = new NOAASolarDataService({ fallbackMode: false });
      await service.connect();

      const flareEvents = await service.getSolarFlares();
      expect(flareEvents).toHaveLength(1);
      expect(flareEvents[0].classification).toBe('M2.5');
      expect(flareEvents[0].location).toBe('N15E45');
      expect(flareEvents[0].isActive).toBe(false); // Has end time
    });

    it('should implement data validation and error handling', async () => {
      // Test invalid data handling - disable fallback mode for this test
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'data' })
      });

      service = new NOAASolarDataService({ fallbackMode: false });
      await service.connect();

      await expect(service.getXrayFlux()).rejects.toThrow('Invalid X-ray flux data format');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      service = new NOAASolarDataService({ fallbackMode: false });
      
      await expect(service.connect()).rejects.toThrow('Failed to connect to NOAA solar data service');
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('Phase 2 Week 4 Day 3-4: Real-time Data Pipeline', () => {
    it('should implement update intervals and scheduling', async () => {
      vi.useFakeTimers();

      service = new NOAASolarDataService({
        updateInterval: 5000, // 5 seconds for testing
        fallbackMode: false
      });

      let updateCount = 0;
      const updatePromise = new Promise<void>((resolve) => {
        service.onDataUpdate((event: SolarDataUpdateEvent) => {
          updateCount++;
          if (updateCount === 2) {
            expect(event.type).toBeDefined();
            expect(event.timestamp).toBeDefined();
            resolve();
          }
        });
      });

      // Mock successful responses
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{
            timestamp: new Date().toISOString(),
            flux_short: 1.0e-6,
            flux_long: 5.0e-7,
            classification: 'B1.0'
          }]
        })
      });

      await service.connect();
      
      // Fast-forward time to trigger updates
      vi.advanceTimersByTime(10000);
      
      await updatePromise;
      vi.useRealTimers();
    });

    it('should implement data transformation and processing', async () => {
      const rawData = {
        data: [{
          timestamp: '2025-07-14T13:30:00Z',
          flux_short: 1.2e-6,
          flux_long: 8.5e-7,
          classification: 'B1.2'
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => rawData
      });

      service = new NOAASolarDataService();
      await service.connect();

      const processed = await service.getXrayFlux();
      
      // Verify data transformation
      expect(processed.current.timestamp).toBeInstanceOf(Date);
      expect(processed.current.intensityLevel).toBe('low'); // B-class
      expect(processed.current.color).toBe('#00FF00'); // Green for B-class
      expect(processed.trend).toBeDefined();
      expect(processed.quality).toBeDefined();
    });

    it('should create data change event system', async () => {
      service = new NOAASolarDataService();
      
      let eventReceived = false;
      service.onDataUpdate((event) => {
        expect(event.type).toBe('solar_flare');
        expect(event.data).toBeDefined();
        eventReceived = true;
      });

      // Simulate flare detection
      const flareEvent: SolarFlareEvent = {
        id: 'test_flare',
        startTime: new Date(),
        peakTime: new Date(),
        endTime: null,
        classification: 'M1.5',
        location: 'N10E20',
        peakFlux: 1.5e-5,
        isActive: true,
        duration: 600
      };

      // Trigger internal event (would normally come from data polling)
      (service as any).emitDataUpdate({
        type: 'solar_flare',
        timestamp: new Date(),
        data: flareEvent
      });

      expect(eventReceived).toBe(true);
    });

    it('should build comprehensive error handling', async () => {
      let errorHandled = false;
      
      // Create service but don't connect yet
      service = new NOAASolarDataService({ fallbackMode: false });
      
      service.onError((error) => {
        expect(error.code).toBe('DATA_VALIDATION_ERROR');
        expect(error.message).toContain('HTTP 500');
        errorHandled = true;
      });

      // Mock invalid response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      // Try to get data without connecting (should trigger error)
      await expect(service.getXrayFlux()).rejects.toThrow();
      expect(errorHandled).toBe(true);
    });
  });

  describe('Phase 2 Week 4 Day 5: Caching and Fallback', () => {
    it('should implement SolarDataCache system', async () => {
      service = new NOAASolarDataService({
        enableCaching: true,
        dataRetentionHours: 24
      });

      const mockData = {
        data: [{
          timestamp: '2025-07-14T13:30:00Z',
          flux_short: 1.2e-6,
          flux_long: 8.5e-7,
          classification: 'B1.2'
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      await service.connect();
      const firstFetch = await service.getXrayFlux();

      // Second call should use cache (no additional fetch)
      mockFetch.mockClear();
      const secondFetch = await service.getXrayFlux();

      expect(mockFetch).not.toHaveBeenCalled();
      expect(firstFetch.current.classification).toBe(secondFetch.current.classification);
      expect(service.getCacheStats().hits).toBe(1);
    });

    it('should add fallback data for offline scenarios', async () => {
      service = new NOAASolarDataService({
        fallbackMode: true
      });

      // Simulate network failure
      mockFetch.mockRejectedValue(new Error('Network unavailable'));

      await service.connect();
      const fallbackData = await service.getXrayFlux();

      expect(fallbackData.current.classification).toBe('A0.0');
      expect(fallbackData.quality).toBe('fallback');
      expect(service.isUsingFallback()).toBe(true);
    });

    it('should create data quality assessment', async () => {
      service = new NOAASolarDataService({ fallbackMode: false });

      const mockOldData = {
        data: [{
          timestamp: '2025-07-14T10:00:00Z', // 3+ hours old
          flux_short: 1.2e-6,
          flux_long: 8.5e-7,
          classification: 'B1.2'
        }]
      };

      // Mock both connect and getXrayFlux calls
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOldData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOldData
        });

      await service.connect();
      const xrayData = await service.getXrayFlux();

      expect(xrayData.quality).toBe('stale');
      expect(xrayData.qualityScore).toBeLessThan(0.8);
      expect(xrayData.warnings).toContain('Data is older than 1 hour');
    });

    it('should test data reliability and performance', async () => {
      service = new NOAASolarDataService({ fallbackMode: false });

      // Mock multiple rapid requests
      const promises: Promise<any>[] = [];
      for (let i = 0; i < 10; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{
              timestamp: new Date().toISOString(),
              flux_short: Math.random() * 1e-6,
              flux_long: Math.random() * 1e-7,
              classification: 'A1.0'
            }]
          })
        });
        promises.push(service.getXrayFlux());
      }

      const startTime = Date.now();
      await Promise.all(promises);
      const endTime = Date.now();

      const performanceStats = service.getPerformanceStats();
      expect(performanceStats.averageResponseTime).toBeGreaterThan(0);
      expect(performanceStats.successRate).toBeGreaterThan(0.5);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5s
    });
  });

  describe('Integration Requirements', () => {
    it('should integrate with existing SolarSystemManager', async () => {
      service = new NOAASolarDataService({ fallbackMode: false });

      const mockXrayData = {
        data: [{
          timestamp: '2025-07-14T13:30:00Z',
          flux_short: 2.5e-5, // M-class flare
          flux_long: 1.2e-5,
          classification: 'M2.5'
        }]
      };

      // Mock both connect and getSpaceWeatherSummary calls
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockXrayData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockXrayData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events: [] })
        });

      await service.connect();
      const solarData = await service.getSpaceWeatherSummary();

      // Verify data format compatible with SolarSystemManager
      expect(solarData.solarActivity.level).toBe('high');
      expect(solarData.solarActivity.flareIntensity).toBe(2.5e-5);
      expect(solarData.visualizationParams.coronaIntensity).toBeGreaterThan(1.0);
      expect(solarData.visualizationParams.sunColor).toBeDefined();
    });

    it('should provide data change notifications for real-time updates', async () => {
      service = new NOAASolarDataService({
        updateInterval: 1000,
        fallbackMode: false
      });

      const notificationPromise = new Promise<void>((resolve) => {
        service.onSpaceWeatherChange((summary) => {
          expect(summary.solarActivity.level).toBeDefined();
          expect(summary.timestamp).toBeInstanceOf(Date);
          resolve();
        });
      });

      // Mock data that should trigger notification
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{
            timestamp: new Date().toISOString(),
            flux_short: 5.0e-5, // X-class flare
            flux_long: 2.0e-5,
            classification: 'X5.0'
          }]
        })
      });

      await service.connect();
      await notificationPromise;
    });
  });
});
