import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeoEventsDataProvider, type USGSEarthquakeData } from '../GeoEventsDataProvider';

const baseFeatureProps = {
  mag: 5,
  place: 'Test Place',
  time: 1_700_000_000_000,
  updated: 1_700_000_100_000,
  tz: 0,
  url: 'https://example.com',
  detail: 'detail',
  felt: null,
  cdi: null,
  mmi: null,
  alert: null,
  status: 'reviewed',
  tsunami: 0,
  sig: 500,
  net: 'us',
  code: 'abc',
  ids: 'abc',
  sources: 'us',
  types: 'earthquake',
  nst: null,
  dmin: null,
  rms: 1,
  gap: null,
  magType: 'mb',
  type: 'earthquake',
  title: 'M 5 - Test'
};

describe('GeoEventsDataProvider.transformUSGSToNaturalEvents', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  const provider = new GeoEventsDataProvider();

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('drops malformed features and logs errors while preserving valid events', () => {
    const payload: USGSEarthquakeData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'valid-1',
          geometry: { type: 'Point', coordinates: [-122.5, 37.5, 10] },
          properties: { ...baseFeatureProps, mag: 5.2, sig: 400, title: 'M 5.2 - Valid' }
        },
        {
          type: 'Feature',
          id: 'missing-geometry',
          geometry: { type: 'Point', coordinates: [] as unknown as [number, number, number] },
          properties: baseFeatureProps
        },
        {
          type: 'Feature',
          id: 'bad-coords',
          geometry: { type: 'Point', coordinates: [Number.NaN, Number.POSITIVE_INFINITY, 5] as [number, number, number] },
          properties: { ...baseFeatureProps, sig: 250 }
        }
      ]
    };

    const events = provider.transformUSGSToNaturalEvents(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: 'valid-1',
      lat: 37.5,
      lng: -122.5,
      source: 'USGS',
      intensity: 400,
      magnitude: 5.2
    });
    expect(new Date(events[0]?.timestamp ?? '').getUTCFullYear()).toBe(2023);
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });
});
