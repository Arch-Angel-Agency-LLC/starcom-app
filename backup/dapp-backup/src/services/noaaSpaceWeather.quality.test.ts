import { describe, it, expect } from 'vitest';
import { fetchLatestElectricFieldData, transformNOAAToIntelMarkers } from './noaaSpaceWeather';

// Data quality and Starcom integration tests

describe('NOAA Electric Field Data Quality', () => {
  it('should validate InterMag data has reasonable electric field values', async () => {
    const data = await fetchLatestElectricFieldData('InterMag');
    const sampleFeatures = data.features.slice(0, 10);
    for (const feature of sampleFeatures) {
      const { Ex, Ey } = feature.properties;
      expect(typeof Ex).toBe('number');
      expect(typeof Ey).toBe('number');
      expect(Ex).toBeGreaterThan(-10000);
      expect(Ex).toBeLessThan(10000);
      expect(Ey).toBeGreaterThan(-10000);
      expect(Ey).toBeLessThan(10000);
      const [lon, lat] = feature.geometry.coordinates;
      expect(lon).toBeGreaterThan(-180);
      expect(lon).toBeLessThan(180);
      expect(lat).toBeGreaterThan(-90);
      expect(lat).toBeLessThan(90);
    }
  }, 30000);
});

describe('NOAA to Starcom Intelligence Integration', () => {
  it('should transform NOAA electric field data into intelligence overlay markers', async () => {
    const noaaData = await fetchLatestElectricFieldData('InterMag');
    const intelMarkers = transformNOAAToIntelMarkers(noaaData, 'space-weather');
    expect(intelMarkers).toBeInstanceOf(Array);
    expect(intelMarkers.length).toBeGreaterThan(0);
    const firstMarker = intelMarkers[0];
    expect(firstMarker).toHaveProperty('pubkey');
    expect(firstMarker).toHaveProperty('title');
    expect(firstMarker).toHaveProperty('content');
    expect(firstMarker).toHaveProperty('tags');
    expect(firstMarker).toHaveProperty('latitude');
    expect(firstMarker).toHaveProperty('longitude');
    expect(firstMarker).toHaveProperty('timestamp');
    expect(firstMarker).toHaveProperty('author');
    expect(firstMarker.tags).toContain('SIGINT');
    expect(firstMarker.tags).toContain('space-weather');
    expect(firstMarker.title).toContain('Electric Field');
    expect(typeof firstMarker.latitude).toBe('number');
    expect(typeof firstMarker.longitude).toBe('number');
    expect(firstMarker.latitude).toBeGreaterThan(-90);
    expect(firstMarker.latitude).toBeLessThan(90);
    expect(firstMarker.longitude).toBeGreaterThan(-180);
    expect(firstMarker.longitude).toBeLessThan(180);
  }, 30000);
});
