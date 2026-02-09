import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { pollerRegistry } from '../pollerRegistry';

const flushAsync = async () => {
  await Promise.resolve();
};

describe('pollerRegistry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pollerRegistry.stopAll();
  });

  afterEach(() => {
    pollerRegistry.stopAll();
    vi.useRealTimers();
  });

  it('dedupes registrations by key', async () => {
    const fn = vi.fn();
    const handle1 = pollerRegistry.register('dedupe', fn, { intervalMs: 25 });
    const handle2 = pollerRegistry.register('dedupe', fn, { intervalMs: 25 });

    expect(handle1).toBe(handle2);

    await vi.runOnlyPendingTimersAsync();
    expect(fn).toHaveBeenCalled();
    handle1.stop();
  });

  it('prevents overlapping runs and records skips', async () => {
    let release: (() => void) | null = null;
    const fn = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );

    pollerRegistry.register('slow', fn, { intervalMs: 10, immediate: true });

    await vi.runOnlyPendingTimersAsync();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(15);
    await flushAsync();

    expect(fn).toHaveBeenCalledTimes(1);

    release?.();
    await vi.runOnlyPendingTimersAsync();

    const dump = pollerRegistry.debugDump();
    const entry = dump.find((d) => d.key === 'slow');
    expect((entry?.skips ?? 0) >= 1).toBe(true);

    pollerRegistry.stopAll();
  });

  it('stops all pollers in a scope', async () => {
    const fn = vi.fn();
    pollerRegistry.register('scoped-a', fn, { intervalMs: 50, scope: 'alpha', immediate: false });
    pollerRegistry.register('scoped-b', fn, { intervalMs: 50, scope: 'beta', immediate: false });

    await vi.runOnlyPendingTimersAsync();
    expect(fn).toHaveBeenCalledTimes(2);

    pollerRegistry.stopAll('alpha');
    vi.advanceTimersByTime(200);
    await flushAsync();

    expect(pollerRegistry.isActive('scoped-a')).toBe(false);
    expect(pollerRegistry.isActive('scoped-b')).toBe(true);

    pollerRegistry.stopAll();
  });

  it('stops pollers registered with multiple scopes when any scope is stopped', () => {
    const fn = vi.fn();
    pollerRegistry.register('scoped-multi', fn, { intervalMs: 25, scope: ['alpha', 'beta'] });

    expect(pollerRegistry.isActive('scoped-multi')).toBe(true);
    pollerRegistry.stopAll('beta');

    expect(pollerRegistry.isActive('scoped-multi')).toBe(false);
  });

  it('applies backoff delays after consecutive failures', () => {
    let runs = 0;
    pollerRegistry.register('backoff', () => {
      runs += 1;
      throw new Error('fail');
    }, {
      intervalMs: 10,
      backoff: { initialMs: 20, maxMs: 80, factor: 2 },
      jitterMs: 0,
      immediate: true,
    });

    expect(runs).toBe(1);

    vi.advanceTimersByTime(19);
    expect(runs).toBe(1);
    vi.advanceTimersByTime(1);
    expect(runs).toBe(2);

    vi.advanceTimersByTime(39);
    expect(runs).toBe(2);
    vi.advanceTimersByTime(1);
    expect(runs).toBe(3);

    pollerRegistry.stopAll();
  });

  it('applies slow-run penalties to stretch the next interval', async () => {
    vi.setSystemTime(3_000);
    let runs = 0;

    pollerRegistry.register(
      'slow-penalty',
      () => {
        runs += 1;
        vi.setSystemTime(Date.now() + 120);
      },
      {
        intervalMs: 200,
        slowThresholdMs: 50,
        slowBackoffMs: 40,
        jitterMs: 0,
        immediate: true,
      },
    );

    await flushAsync();
    expect(runs).toBe(1);
    const entry = pollerRegistry.debugDump().find((d) => d.key === 'slow-penalty');
    expect(entry?.lastDurationMs).toBeGreaterThanOrEqual(120);

    vi.advanceTimersByTime(239);
    expect(runs).toBe(1);

    vi.advanceTimersByTime(1);
    expect(runs).toBe(2);

    pollerRegistry.stopAll();
  });

  it('aborts long-running pollers on timeout and reschedules without overlap', async () => {
    const onError = vi.fn();
    let runs = 0;

    pollerRegistry.register(
      'timeout',
      (signal) => {
        runs += 1;
        return new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(new Error('timeout abort')));
          setTimeout(() => reject(new Error('late failure')), 1_000);
        });
      },
      { intervalMs: 30, timeoutMs: 20, immediate: true, onError },
    );

    expect(runs).toBe(1);
    vi.advanceTimersByTime(25);
    await flushAsync();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(pollerRegistry.isActive('timeout')).toBe(true);

    vi.advanceTimersByTime(30);
    await flushAsync();
    expect(runs).toBe(2);

    pollerRegistry.stopAll();
  });

  it('honors stop to prevent further scheduling', async () => {
    const fn = vi.fn();
    const handle = pollerRegistry.register('stopper', fn, { intervalMs: 5, immediate: true });

    expect(fn).toHaveBeenCalledTimes(1);

    handle.stop();
    vi.advanceTimersByTime(50);
    await flushAsync();

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
