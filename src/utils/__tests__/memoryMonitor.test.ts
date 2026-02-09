import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { memoryMonitor } from '../memoryMonitor';

const MB = 1_000_000;

const originalPerformance = globalThis.performance;

describe('memoryMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    memoryMonitor.resetForTests();
    (globalThis as any).performance = {
      memory: {
        usedJSHeapSize: 700 * MB,
        totalJSHeapSize: 1_400 * MB,
        jsHeapSizeLimit: 1_600 * MB
      }
    } as Performance;
  });

  afterEach(() => {
    memoryMonitor.resetForTests();
    vi.useRealTimers();
    if (originalPerformance) {
      (globalThis as any).performance = originalPerformance;
    }
  });

  it('shares a single interval across subscribers', () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    const unsubscribeA = memoryMonitor.subscribe(listenerA);
    const unsubscribeB = memoryMonitor.subscribe(listenerB);

    vi.advanceTimersByTime(16_000);

    expect(listenerA).toHaveBeenCalled();
    expect(listenerB).toHaveBeenCalled();
    expect(memoryMonitor.getDebugState().intervalStarts).toBe(1);

    unsubscribeA();
    unsubscribeB();
    expect(memoryMonitor.getDebugState().monitoring).toBe(false);
  });
});
