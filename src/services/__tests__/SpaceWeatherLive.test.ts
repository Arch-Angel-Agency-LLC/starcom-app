import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { fetchLiveSolarWindSnapshot } from '../SpaceWeatherLive';

const makeFetchResponse = (payload: unknown) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(payload)
});

describe('SpaceWeatherLive.fetchLiveSolarWindSnapshot', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns live snapshot when NOAA plasma and mag data are valid', async () => {
    const plasma = [{ speed: 500, density: 8, time_tag: '2024-01-01T00:00:10Z' }];
    const mag = [{ bz_gsm: -5, time_tag: '2024-01-01T00:00:12Z' }];
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeFetchResponse(plasma))
      .mockResolvedValueOnce(makeFetchResponse(mag));

    // @ts-expect-error allow overriding global fetch for test
    global.fetch = fetchMock;

    const { snapshot, quality } = await fetchLiveSolarWindSnapshot();

    expect(quality).toBe('live');
    expect(snapshot.speedKmPerSec).toBe(500);
    expect(snapshot.densityPerCm3).toBe(8);
    expect(snapshot.bz).toBe(-5);
    expect(snapshot.timestamp).toBe('2024-01-01T00:00:10Z');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back to modeled snapshot when plasma data is malformed', async () => {
    const plasma = [{ speed: 'bad', density: 4, time_tag: '2024-01-01T00:00:10Z' }];
    const mag = [{ bz_gsm: -1, time_tag: '2024-01-01T00:00:12Z' }];
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeFetchResponse(plasma))
      .mockResolvedValueOnce(makeFetchResponse(mag));

    // @ts-expect-error allow overriding global fetch for test
    global.fetch = fetchMock;

    const { snapshot, quality } = await fetchLiveSolarWindSnapshot();

    expect(quality).toBe('fallback');
    expect(snapshot.speedKmPerSec).toBe(420);
    expect(snapshot.densityPerCm3).toBe(6);
    expect(snapshot.bz).toBe(-2);
  });
});
