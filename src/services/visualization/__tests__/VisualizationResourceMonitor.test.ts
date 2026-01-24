import { describe, it, expect, vi } from 'vitest';
import { visualizationResourceMonitor, VisualizationResourceMonitorImpl, type ModeResourceSnapshot, type SnapshotTelemetryEvent } from '../VisualizationResourceMonitor';

const MODE = 'EcoNatural.EcologicalDisasters';

describe('VisualizationResourceMonitor', () => {
  it('clears snapshots to avoid orphaned resource entries', () => {
    visualizationResourceMonitor.setBudgets(MODE, { maxVectors: 1 });
    visualizationResourceMonitor.recordVectors(MODE, { count: 2 });
    const snapBefore = visualizationResourceMonitor.getSnapshot(MODE);
    expect(Array.isArray(snapBefore)).toBe(false);
    if (!Array.isArray(snapBefore)) {
      expect(snapBefore.vectors?.count).toBe(2);
      expect(snapBefore.warnings).toContain('vectors>1');
    }

    visualizationResourceMonitor.clearMode(MODE);
    const snapAfter = visualizationResourceMonitor.getSnapshot(MODE);
    if (!Array.isArray(snapAfter)) {
      expect(snapAfter.vectors).toBeUndefined();
      expect(snapAfter.warnings).toHaveLength(0);
    }
  });

  it('debounces warnings and requires heap delta before re-emitting', () => {
    vi.useFakeTimers();
    const monitor = new VisualizationResourceMonitorImpl({ warningDebounceMs: 10, heapWarningDeltaBytes: 10 });
    monitor.setBudgets(MODE, { maxHeapBytes: 100 });

    const emissions: ModeResourceSnapshot[] = [];
    const off = monitor.onWarning(snapshot => emissions.push(snapshot));

    monitor.recordHeap(MODE, 150);
    monitor.recordHeap(MODE, 155);

    vi.advanceTimersByTime(5);
    expect(emissions).toHaveLength(0);

    vi.advanceTimersByTime(10);
    expect(emissions).toHaveLength(1);

    monitor.recordHeap(MODE, 160);
    vi.advanceTimersByTime(10);
    expect(emissions).toHaveLength(1);

    monitor.recordHeap(MODE, 180);
    vi.advanceTimersByTime(10);
    expect(emissions).toHaveLength(2);

    off();
    vi.useRealTimers();
  });

  it('evicts oldest snapshots when cap is exceeded', () => {
    const monitor = new VisualizationResourceMonitorImpl({ snapshotCap: 1, snapshotTtlMs: 60_000 });
    monitor.recordVectors(MODE, { count: 2 });
    monitor.recordVectors('EcoNatural.SpaceWeather', { count: 3 });

    const snapshots = monitor.getSnapshot() as ModeResourceSnapshot[];
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].mode).toBe('EcoNatural.SpaceWeather');
  });

  it('emits telemetry when TTL evicts a snapshot and reports utilization', () => {
    vi.useFakeTimers();
    const events: SnapshotTelemetryEvent[] = [];
    const monitor = new VisualizationResourceMonitorImpl({
      snapshotTtlMs: 10,
      snapshotCap: 5,
      onSnapshotEvent: event => events.push(event)
    });

    monitor.recordVectors(MODE, { count: 1 });
    vi.advanceTimersByTime(15);
    monitor.recordVectors('EcoNatural.SpaceWeather', { count: 2 });

    const eviction = events.find(event => event.type === 'evict');
    expect(eviction?.reason).toBe('ttl');

    const sizeEvents = events.filter(event => event.type === 'size');
    expect(sizeEvents.at(-1)).toMatchObject({ active: 1, cap: 5 });
    vi.useRealTimers();
  });

  it('flags utilization warnings at or above the threshold', () => {
    const events: SnapshotTelemetryEvent[] = [];
    const monitor = new VisualizationResourceMonitorImpl({
      snapshotCap: 3,
      snapshotWarningThreshold: 0.9,
      onSnapshotEvent: event => events.push(event)
    });

    monitor.recordVectors(MODE, { count: 1 });
    monitor.recordVectors('EcoNatural.SpaceWeather', { count: 2 });
    monitor.recordVectors('EcoNatural.EarthWeather', { count: 3 });

    const sizeEvent = events.find(event => event.type === 'size');
    expect(sizeEvent).toBeDefined();
    if (sizeEvent && sizeEvent.type === 'size') {
      expect(sizeEvent.warning).toBe(true);
      expect(sizeEvent.utilization).toBeGreaterThanOrEqual(0.9);
    }
  });
});
