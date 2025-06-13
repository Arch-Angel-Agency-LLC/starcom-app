// GlobeEngine.test.ts
// Artifact-driven tests for GlobeEngine (see globe-testing-plan.artifact, globe-engine-api.artifact, globe-overlays.artifact)
import { GlobeEngine } from './GlobeEngine';
import { vi } from 'vitest';
import { beforeEach, afterEach } from 'vitest';

// Mock API services for artifact-driven integration tests
vi.mock('../services/WeatherDataService', () => ({
  fetchWeatherData: async (_lat: number, _lng: number) => ({
    location: 'Test City',
    temperature: 20,
    description: 'Clear',
    windSpeed: 5,
    humidity: 50,
  })
}));
vi.mock('../services/GeoEventsService', () => ({
  fetchNaturalEvents: async () => ([
    { id: 1, lat: 0, lng: 0, type: 'earthquake', magnitude: 5.5 },
    { id: 2, lat: 10, lng: 10, type: 'volcano', status: 'active' }
  ])
}));
vi.mock('../services/SpaceAssetsService', () => ({
  fetchSpaceAssets: async () => ([
    { id: 1, lat: 0, lng: 0, type: 'satellite', name: 'ISS', altitude: 400 },
    { id: 2, lat: 45, lng: 90, type: 'debris', name: 'Debris-123', altitude: 800 }
  ])
}));
// Mock fetch for borders/territories overlays
(globalThis as any).fetch = async (_url: string) => ({
  json: async () => ({
    features: [
      { properties: { name: 'TestBorder' }, geometry: { type: 'LineString', coordinates: [[0,0],[1,1]] } },
      { properties: { name: 'TestTerritory' }, geometry: { type: 'Polygon', coordinates: [[[0,0],[1,1],[1,0],[0,0]]] } }
    ]
  })
});

describe('GlobeEngine Overlay Logic', () => {
  it('should add overlays and cache overlay data', async () => {
    const engine = new GlobeEngine({ mode: 'CyberCommand' });
    engine.addOverlay('alerts');
    await new Promise((resolve) => setTimeout(resolve, 600));
    const data = engine.getOverlayData('alerts');
    expect(Array.isArray(data)).toBe(true);
    // Add again, should use cache
    engine.removeOverlay('alerts');
    engine.addOverlay('alerts');
    expect(engine.getOverlayData('alerts')).toEqual(data);
  });

  it('should reset overlays to mode defaults on setMode', async () => {
    const engine = new GlobeEngine({ mode: 'CyberCommand' });
    engine.addOverlay('weather');
    engine.setMode('EcoNatural');
    await new Promise((resolve) => setTimeout(resolve, 600));
    const overlays = engine.getOverlays();
    expect(overlays).toContain('weather');
    expect(overlays).toContain('naturalEvents');
    expect(overlays).toContain('markers');
    expect(overlays).not.toContain('alerts');
  });

  it('should emit overlayDataUpdated event', async () => {
    const engine = new GlobeEngine({ mode: 'CyberCommand' });
    await new Promise<void>((resolve) => {
      engine.on('overlayDataUpdated', ({ payload }) => {
        if (payload && typeof payload === 'object' && (payload as { overlay?: string }).overlay === 'alerts') {
          expect((payload as { data?: unknown }).data).toBeDefined();
          resolve();
        }
      });
      engine.addOverlay('alerts');
    });
  });
});

describe('GlobeEngine Integration (artifact-driven)', () => {
  it('should fetch and cache overlay data for weather and naturalEvents (mocked)', async () => {
    const engine = new GlobeEngine({ mode: 'EcoNatural' });
    engine.addOverlay('weather');
    engine.addOverlay('naturalEvents');
    await new Promise((resolve) => setTimeout(resolve, 700));
    const weather = engine.getOverlayData('weather');
    const events = engine.getOverlayData('naturalEvents');
    expect(Array.isArray(weather)).toBe(true);
    expect(Array.isArray(events)).toBe(true);
    engine.removeOverlay('weather');
    engine.addOverlay('weather');
    expect(engine.getOverlayData('weather')).toEqual(weather);
  });

  it('should allow toggling overlays and emit correct events', () => {
    const engine = new GlobeEngine({ mode: 'GeoPolitical' });
    let addCount = 0;
    let removeCount = 0;
    engine.on('overlayAdded', () => {
      addCount++;
    });
    engine.on('overlayRemoved', () => {
      removeCount++;
    });
    engine.addOverlay('borders');
    engine.removeOverlay('borders');
    engine.addOverlay('borders');
    expect(addCount).toBeGreaterThanOrEqual(2);
    expect(removeCount).toBeGreaterThanOrEqual(1);
  });

  it('should fetch and cache overlay data for spaceAssets (mocked)', async () => {
    const engine = new GlobeEngine({ mode: 'CyberCommand' });
    engine.addOverlay('spaceAssets');
    await new Promise((resolve) => setTimeout(resolve, 600));
    const data = engine.getOverlayData('spaceAssets');
    expect(Array.isArray(data)).toBe(true);
    expect((data as any[])[0]?.type).toBe('satellite');
  });

  it('should emit overlayDataLoading and overlayDataError for spaceAssets', async () => {
    const { fetchSpaceAssets } = await import('../services/SpaceAssetsService');
    const spy = vi.spyOn(await import('../services/SpaceAssetsService'), 'fetchSpaceAssets').mockRejectedValue(new Error('Test error'));
    const engine = new GlobeEngine({ mode: 'CyberCommand' });
    let loading = false;
    let error = false;
    engine.on('overlayDataLoading', ({ payload }) => {
      if ((payload as { overlay?: string })?.overlay === 'spaceAssets') loading = true;
    });
    engine.on('overlayDataError', ({ payload }) => {
      if ((payload as { overlay?: string; error?: string })?.overlay === 'spaceAssets' && (payload as { error?: string }).error === 'Test error') error = true;
    });
    engine.addOverlay('spaceAssets');
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(loading).toBe(true);
    expect(error).toBe(true);
    spy.mockRestore();
  });

  it('should periodically update spaceAssets overlay (artifact-driven, fake timers)', async () => {
    vi.useFakeTimers();
    const engine = new GlobeEngine({ mode: 'CyberCommand' });
    let updateCount = 0;
    engine.on('overlayDataUpdated', ({ payload }) => {
      if ((payload as { overlay?: string })?.overlay === 'spaceAssets') updateCount++;
    });
    engine.addOverlay('spaceAssets');
    // Initial fetch
    await vi.runOnlyPendingTimersAsync();
    // Simulate 2 more intervals (2 minutes)
    await vi.advanceTimersByTimeAsync(120000);
    expect(updateCount).toBeGreaterThanOrEqual(2);
    // Clean up interval
    engine.removeOverlay('spaceAssets');
    vi.useRealTimers();
  });
});
// Artifact references:
// - Test plan: globe-testing-plan.artifact
// - Overlay API/events: globe-engine-api.artifact, globe-overlays.artifact
