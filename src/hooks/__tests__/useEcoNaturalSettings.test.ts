import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import useEcoNaturalSettings from '../useEcoNaturalSettings';

const STORAGE_KEY = 'starcom-eco-natural-settings';

describe('useEcoNaturalSettings migrations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('migrates earthquakes and volcanoes defaults to ON for legacy storage', async () => {
    const legacyPayload = {
      version: 1,
      data: {
        ecologicalDisasters: {
          disasterTypes: {
            earthquakes: false,
            volcanoes: false,
            wildfires: false
          }
        }
      }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyPayload));

    const { result } = renderHook(() => useEcoNaturalSettings());

    await waitFor(() => {
      expect(result.current.config.ecologicalDisasters.disasterTypes.earthquakes).toBe(true);
      expect(result.current.config.ecologicalDisasters.disasterTypes.volcanoes).toBe(true);
    });

    // Ensure unrelated hazard values persist through migration
    expect(result.current.config.ecologicalDisasters.disasterTypes.wildfires).toBe(false);
  });
});

describe('useEcoNaturalSettings validation and persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clamps ecological disaster numeric fields on load', async () => {
    const legacyPayload = {
      version: 2,
      data: {
        ecologicalDisasters: {
          timeRange: 0,
          radiusOpacity: 150,
          severity: { showMinor: 'yes' },
          disasterTypes: { floods: 'truthy' }
        }
      }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyPayload));

    const { result } = renderHook(() => useEcoNaturalSettings());

    await waitFor(() => expect(result.current.config.ecologicalDisasters.timeRange).toBe(1));
    expect(result.current.config.ecologicalDisasters.radiusOpacity).toBe(100);
    expect(result.current.config.ecologicalDisasters.severity.showMinor).toBe(true);
    expect(result.current.config.ecologicalDisasters.disasterTypes.floods).toBe(true);
  });

  it('persists sanitized values when updating ecological disasters', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useEcoNaturalSettings());

    act(() => {
      result.current.updateEcologicalDisasters({ timeRange: 0, radiusOpacity: 150 });
    });

    act(() => {
      vi.advanceTimersByTime(600);
    });
    vi.useRealTimers();

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();
    const parsed = stored ? JSON.parse(stored) : { data: {} };
    expect(parsed.data.ecologicalDisasters.timeRange).toBe(1);
    expect(parsed.data.ecologicalDisasters.radiusOpacity).toBe(100);
  });

  it('restores persisted ecological settings on re-init (reload)', async () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useEcoNaturalSettings());

    act(() => {
      result.current.updateEcologicalDisasters({ timeRange: 3, radiusOpacity: 55, disasterTypes: { hurricanes: false } });
    });

    act(() => {
      vi.advanceTimersByTime(600);
    });

    unmount();
    vi.useRealTimers();

    const { result: rehydrated } = renderHook(() => useEcoNaturalSettings());

    await waitFor(() => expect(rehydrated.current.config.ecologicalDisasters.timeRange).toBe(3));
    expect(rehydrated.current.config.ecologicalDisasters.radiusOpacity).toBe(55);
    expect(rehydrated.current.config.ecologicalDisasters.disasterTypes.hurricanes).toBe(false);
  });
});
