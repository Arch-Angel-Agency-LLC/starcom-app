import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useGeoEvents } from '../useGeoEvents';

const makeEvent = (overrides: Partial<ReturnType<typeof baseEvent>>) => ({
  ...baseEvent(),
  ...overrides
});

function baseEvent() {
  return {
    id: 'evt-1',
    lat: 10,
    lng: 10,
    type: 'earthquake',
    magnitude: 6,
    status: 'reviewed',
    timestamp: new Date().toISOString(),
    source: 'test'
  };
}

describe('useGeoEvents', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('applies time range, severity, bbox, and limit in order', async () => {
    const mockEvents = [
      makeEvent({ id: 'cat', lat: 12, lng: 12, magnitude: 6 }),
      makeEvent({ id: 'minor-outside-bbox', lat: 50, lng: 50, magnitude: 3 }),
      makeEvent({ id: 'old-event', timestamp: '2023-12-15T00:00:00Z', magnitude: 5 })
    ];

    const fetcher = vi.fn().mockResolvedValue(mockEvents);

    const { result } = renderHook(() =>
      useGeoEvents({
        enabled: true,
        fetcher,
        timeRangeDays: 10,
        severity: { showMinor: false, showMajor: true, showCatastrophic: true },
        bbox: { minLat: 0, maxLat: 20, minLng: 0, maxLng: 20 },
        limit: 1,
        refreshMinutes: 5
      })
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.status).toBe('success');
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].id).toBe('cat');
  });

  it('sets status lifecycle and surfaces errors', async () => {
    const errorFetcher = vi.fn().mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() =>
      useGeoEvents({
        enabled: true,
        fetcher: errorFetcher,
        refreshMinutes: 5
      })
    );

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error?.message).toBe('boom');
  });

  it('computes stale flag when data ages past threshold', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue([makeEvent({ id: 'stale-check' })]);

    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useGeoEvents({
          enabled,
          fetcher,
          refreshMinutes: 0.01 // ~0.6s base; disable polling to let stale timer fire
        }),
      { initialProps: { enabled: true } }
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.status).toBe('success');
    expect(result.current.stale).toBe(false);

    rerender({ enabled: false });
    act(() => {
      vi.advanceTimersByTime(1300);
    });

    expect(result.current.stale).toBe(true);
    vi.useRealTimers();
  });

  it('emits telemetry for fetch and render', async () => {
    const fetcher = vi.fn().mockResolvedValue([makeEvent({ id: 'telemetry' })]);
    const telemetry = vi.fn();

    const { result } = renderHook(() =>
      useGeoEvents({
        enabled: true,
        fetcher,
        refreshMinutes: 5,
        onTelemetry: telemetry,
        telemetryDebounceMs: 0,
        telemetrySampleRate: 1
      })
    );

    const refetchPromise = result.current.refetch();
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    await waitFor(() => expect(result.current.status).toBe('success'), { timeout: 5000 });

    const types = telemetry.mock.calls.map((call) => call[0].type);
    expect(types).toContain('fetch_start');
    expect(types).toContain('fetch_success');
    expect(types).toContain('render_update');
  });

  it('clears polling when disabled to avoid interval leaks', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue([makeEvent({ id: 'poll' })]);

    const { result, rerender, unmount } = renderHook(
      ({ enabled }) =>
        useGeoEvents({
          enabled,
          fetcher,
          refreshMinutes: 0.001, // ~60ms
          telemetryDebounceMs: 0
        }),
      { initialProps: { enabled: true } }
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.status).toBe('success');
    const callsBeforeDisable = fetcher.mock.calls.length;
    expect(callsBeforeDisable).toBeGreaterThanOrEqual(1);

    rerender({ enabled: false });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(fetcher).toHaveBeenCalledTimes(callsBeforeDisable);

    unmount();
    vi.useRealTimers();
  });

  it('thins over-cap payloads and emits thinning telemetry', async () => {
    const fetcher = vi.fn().mockResolvedValue([
      makeEvent({ id: 'cat', lat: 0.1, lng: 0.1, magnitude: 6 }),
      makeEvent({ id: 'major-1', lat: 0.2, lng: 0.2, magnitude: 5 }),
      makeEvent({ id: 'major-2', lat: 0.3, lng: 0.3, magnitude: 5 }),
      makeEvent({ id: 'minor-1', lat: 5, lng: 5, magnitude: 3 }),
      makeEvent({ id: 'minor-2', lat: 6, lng: 6, magnitude: 3 })
    ]);
    const telemetry = vi.fn();

    const { result } = renderHook(() =>
      useGeoEvents({
        enabled: true,
        fetcher,
        refreshMinutes: 5,
        thinning: { target: 3, warn: 3, cap: 4, gridSizeDeg: 1 },
        onTelemetry: telemetry,
        telemetrySampleRate: 1,
        telemetryDebounceMs: 0
      })
    );

    await waitFor(() => expect(result.current.status).toBe('success'), { timeout: 10_000 });
    expect(result.current.filtered.map((e) => e.id)).toEqual(['cat', 'minor-1']);

    const thinEvent = telemetry.mock.calls.find((call) => call[0].type === 'render_thin_applied');
    expect(thinEvent?.[0].metrics.before).toBe(5);
    expect(thinEvent?.[0].metrics.after).toBe(2);
    expect(thinEvent?.[0].metrics.dropped).toBe(3);
  });

  it('keeps thinning runtime within budget for large payloads', async () => {
    const bulk = Array.from({ length: 10_000 }, (_, i) =>
      makeEvent({
        id: `evt-${i}`,
        lat: -60 + (i % 120) * 0.5 + (i % 5) * 0.01,
        lng: -170 + (i % 120) * 0.5 + (i % 7) * 0.01,
        magnitude: 2 + (i % 6)
      })
    );
    const fetcher = vi.fn().mockResolvedValue(bulk);
    const telemetry = vi.fn();

    const { result, unmount } = renderHook(() =>
      useGeoEvents({
        enabled: true,
        fetcher,
        refreshMinutes: 5,
        thinning: { target: 500, warn: 700, cap: 900, gridSizeDeg: 0.5 },
        onTelemetry: telemetry,
        telemetrySampleRate: 1,
        telemetryDebounceMs: 0
      })
    );

    await waitFor(
      () => expect(telemetry.mock.calls.some((call) => call[0].type === 'render_thin_applied')).toBe(true),
      { timeout: 10_000 }
    );

    const thinEvent = telemetry.mock.calls.find((call) => call[0].type === 'render_thin_applied');
    expect(thinEvent).toBeDefined();
    expect(thinEvent?.[0].metrics.before).toBeGreaterThanOrEqual(10_000);
    expect(thinEvent?.[0].metrics.after).toBeLessThanOrEqual(900);
    expect(thinEvent?.[0].metrics.durationMs).toBeLessThan(250);

    unmount();
  }, 15000);

  it('keeps render thinning p95 under target across repeated large batches', async () => {
    const bulk = Array.from({ length: 2_500 }, (_, i) =>
      makeEvent({
        id: `evt-${i}`,
        lat: -60 + (i % 120) * 0.5 + (i % 5) * 0.01,
        lng: -170 + (i % 120) * 0.5 + (i % 7) * 0.01,
        magnitude: 2 + (i % 6)
      })
    );
    const fetcher = vi.fn().mockResolvedValue(bulk);
    const telemetry = vi.fn();

    const { result, unmount } = renderHook(() =>
      useGeoEvents({
        enabled: true,
        fetcher,
        refreshMinutes: 5,
        thinning: { target: 500, warn: 700, cap: 900, gridSizeDeg: 0.5 },
        onTelemetry: telemetry,
        telemetrySampleRate: 1,
        telemetryDebounceMs: 0
      })
    );

    await waitFor(
      () => expect(telemetry.mock.calls.some((call) => call[0].type === 'render_thin_applied')).toBe(true),
      { timeout: 5_000 }
    );

    const durations = telemetry.mock.calls
      .filter((call) => call[0].type === 'render_thin_applied')
      .map((call) => call[0].metrics.durationMs)
      .sort((a, b) => a - b);

    expect(durations.length).toBeGreaterThanOrEqual(1);
    const p95Index = Math.min(durations.length - 1, Math.floor(durations.length * 0.95));
    const p95 = durations[p95Index];
    expect(p95).toBeLessThan(20);

    unmount();
  }, 15000);

  it('keeps 10k+ fixture render p95 under frame budget and sustains FPS target', async () => {
    const bulk = Array.from({ length: 10_000 }, (_, i) =>
      makeEvent({
        id: `evt-${i}`,
        lat: -80 + (i % 160) * 0.5 + (i % 5) * 0.01,
        lng: -170 + (i % 160) * 0.5 + (i % 7) * 0.01,
        magnitude: 2 + (i % 6)
      })
    );
    const fetcher = vi.fn().mockResolvedValue(bulk);
    const telemetry = vi.fn();

    const { result, unmount } = renderHook(() =>
      useGeoEvents({
        enabled: true,
        fetcher,
        refreshMinutes: 5,
        thinning: { target: 500, warn: 700, cap: 900, gridSizeDeg: 0.5 },
        onTelemetry: telemetry,
        telemetrySampleRate: 1,
        telemetryDebounceMs: 0
      })
    );

    await waitFor(
      () => expect(telemetry.mock.calls.some((call) => call[0].type === 'render_thin_applied')).toBe(true),
      { timeout: 5_000 }
    );
    expect(result.current.filtered.length).toBeLessThanOrEqual(900);

    const durations = telemetry.mock.calls
      .filter((call) => call[0].type === 'render_thin_applied')
      .map((call) => call[0].metrics.durationMs)
      .sort((a, b) => a - b);

    expect(durations.length).toBeGreaterThan(3);
    const p95Index = Math.min(durations.length - 1, Math.floor(durations.length * 0.95));
    const p95 = durations[p95Index];
    expect(p95).toBeLessThan(60);

    const fpsAtP95 = 1000 / p95;
    expect(fpsAtP95).toBeGreaterThan(30);

    unmount();
  }, 8000);

  it('handles repeated large refreshes without growth or crash', async () => {
    const bulk = Array.from({ length: 1500 }, (_, i) =>
      makeEvent({
        id: `evt-${i}`,
        lat: -50 + (i % 50) * 0.5,
        lng: 100 + (i % 60) * 0.4,
        magnitude: 2 + (i % 5)
      })
    );

    const fetcher = vi.fn().mockResolvedValue(bulk);
    const telemetry = vi.fn();

    const { result, unmount } = renderHook(() =>
      useGeoEvents({
        enabled: true,
        fetcher,
        refreshMinutes: 5,
        thinning: { target: 500, warn: 700, cap: 900, gridSizeDeg: 1 },
        onTelemetry: telemetry,
        telemetrySampleRate: 1,
        telemetryDebounceMs: 0
      })
    );

    await waitFor(() => expect(result.current.status).toBe('success'), { timeout: 10_000 });
    expect(result.current.filtered.length).toBeLessThanOrEqual(900);

    for (let i = 0; i < 100; i += 1) {
      await act(async () => {
        await result.current.refetch();
      });
      expect(result.current.status).toBe('success');
      expect(result.current.filtered.length).toBeLessThanOrEqual(900);
    }

    const thinEvents = telemetry.mock.calls.filter((call) => call[0].type === 'render_thin_applied');
    expect(thinEvents.length).toBeGreaterThan(0);
    expect(thinEvents[thinEvents.length - 1][0].metrics.after).toBeLessThanOrEqual(900);

    unmount();
  }, 20000);

  it('does not accumulate timers across repeated refresh loop (memory proxy)', async () => {
    const nativeSetTimeout = global.setTimeout;
    const nativeClearTimeout = global.clearTimeout;
    const activeTimers = new Set<ReturnType<typeof setTimeout>>();

    const setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation(((fn: TimerHandler, delay?: number, ...args: any[]) => {
      const handle = nativeSetTimeout(fn, delay, ...args);
      activeTimers.add(handle);
      return handle;
    }) as typeof setTimeout);

    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout').mockImplementation(((handle: any) => {
      activeTimers.delete(handle);
      return nativeClearTimeout(handle);
    }) as typeof clearTimeout);

    try {
      const fetcher = vi.fn().mockResolvedValue([makeEvent({ id: 'steady' })]);
      const { result, unmount } = renderHook(() =>
        useGeoEvents({
          enabled: true,
          fetcher,
          refreshMinutes: 5,
          thinning: { target: 500, warn: 700, cap: 900, gridSizeDeg: 1 },
          telemetryDebounceMs: 0
        })
      );

      await waitFor(() => expect(result.current.status).toBe('success'));

      for (let i = 0; i < 50; i += 1) {
        await act(async () => {
          await result.current.refetch();
        });
      }

      // Timer count should stay bounded even after many refreshes (stale timer replaced, not leaked).
      expect(activeTimers.size).toBeLessThanOrEqual(3);

      await act(async () => {
        unmount();
      });

      await new Promise((resolve) => nativeSetTimeout(resolve, 10));
      expect(activeTimers.size).toBeLessThanOrEqual(1);

      expect(setTimeoutSpy).toHaveBeenCalled();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    } finally {
      activeTimers.forEach((handle) => nativeClearTimeout(handle));
      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    }
  }, 10000);

  it('cleans up timers and aborts in-flight fetches on disable/unmount to avoid leaks', async () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    let secondSignal: AbortSignal | undefined;
    let resolvePending: ((value: ReturnType<typeof makeEvent>[]) => void) | null = null;
    const pending = new Promise<ReturnType<typeof makeEvent>[]>((resolve) => {
      resolvePending = resolve;
    });
    const fetcher = vi.fn().mockResolvedValue([makeEvent({ id: 'initial' })]);

    const { result, rerender, unmount } = renderHook(
      ({ enabled }) =>
        useGeoEvents({
          enabled,
          fetcher,
          refreshMinutes: 0.001,
          telemetryDebounceMs: 0
        }),
      { initialProps: { enabled: true } }
    );

    await waitFor(() => expect(result.current.status).toBe('success'), { timeout: 5_000 });

    const initialCalls = fetcher.mock.calls.length;

    fetcher.mockImplementationOnce(({ signal }) => {
      secondSignal = signal;
      return pending;
    });

    const refetchPromise = result.current.refetch();
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(initialCalls + 1));

    expect(secondSignal?.aborted).toBeFalsy();
    await act(async () => {
      rerender({ enabled: false });
    });
    expect(secondSignal?.aborted).toBe(true);

    resolvePending?.([makeEvent({ id: 'cleanup' })]);
    await refetchPromise;
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(setTimeoutSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();

    unmount();
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  }, 12000);

  it('retains last-good data on failure and schedules backoff', async () => {
    // Default success to handle StrictMode double-invoke; inject failure explicitly later.
    const fetcher = vi.fn().mockResolvedValue([makeEvent({ id: 'first' })]);
    const telemetry = vi.fn();

    const { result } = renderHook(() =>
      useGeoEvents({
        enabled: true,
        fetcher,
        // Keep polling interval wide so automatic retries do not flip status mid-assertion.
        refreshMinutes: 5,
        onTelemetry: telemetry,
        telemetryDebounceMs: 0
      })
    );

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.filtered[0].id).toBe('first');

    fetcher.mockRejectedValueOnce(new Error('fail'));
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.filtered[0].id).toBe('first');
    expect(result.current.stale).toBe(true);

    const backoffEvent = telemetry.mock.calls.find((call) => call[0].type === 'backoff_scheduled');
    expect(backoffEvent?.[0].metrics.delayMs).toBeGreaterThan(0);
  });

  it('applies jitter to backoff scheduling', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const fetcher = vi.fn().mockResolvedValue([makeEvent({ id: 'first' })]);
    const telemetry = vi.fn();

    const { result, unmount } = renderHook(() =>
      useGeoEvents({
        enabled: true,
        fetcher,
        refreshMinutes: 0.001,
        onTelemetry: telemetry,
        telemetryDebounceMs: 0
      })
    );

    await waitFor(() => expect(result.current.status).toBe('success'));

    fetcher.mockRejectedValueOnce(new Error('fail'));
    await act(async () => {
      await result.current.refetch();
    });

    const backoffEvent = telemetry.mock.calls.find((call) => call[0].type === 'backoff_scheduled');
    expect(backoffEvent?.[0].metrics.jitterMs).toBeGreaterThan(0);
    expect(backoffEvent?.[0].metrics.delayMs).toBeGreaterThan(120);
    expect(backoffEvent?.[0].metrics.delayMs).toBeLessThan(150);

    randomSpy.mockRestore();
    unmount();
  });

  it('stops scheduling after max backoff attempts', async () => {
    const fetcher = vi.fn().mockResolvedValue([makeEvent({ id: 'first' })]);
    const telemetry = vi.fn();

    const { result, unmount } = renderHook(() =>
      useGeoEvents({
        enabled: true,
        fetcher,
        refreshMinutes: 0.001,
        onTelemetry: telemetry,
        telemetryDebounceMs: 0
      })
    );

    await waitFor(() => expect(result.current.status).toBe('success'));

    fetcher.mockRejectedValue(new Error('fail'));

    for (let i = 0; i < 5; i += 1) {
      await act(async () => {
        await result.current.refetch();
      });
    }

    const backoffEvent = telemetry.mock.calls.find((call) => call[0].type === 'backoff_exhausted');
    expect(backoffEvent?.[0].metrics.attempt).toBeGreaterThanOrEqual(5);

    const scheduledCount = telemetry.mock.calls.filter((call) => call[0].type === 'backoff_scheduled').length;
    expect(scheduledCount).toBeLessThanOrEqual(4);

    unmount();
  });
});
