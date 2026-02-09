import { beforeEach, afterEach, describe, expect, it, jest } from '@jest/globals';
import { emitCacheTrace, emitDiagnosticTrace, emitDisposalTrace } from '../traceEmitters';
import { defaultTracer } from '../SamplingTracer';

describe('traceEmitters', () => {
  beforeEach(() => {
    defaultTracer.clear();
    jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    defaultTracer.clear();
  });

  it('emits cache traces with metrics', () => {
    emitCacheTrace('asset_cache_miss', { key: 'model.glb', approxBytes: 1024 }, { sizeBytes: 1024 });
    const [event] = defaultTracer.getBuffer();

    expect(event.domain).toBe('cache');
    expect(event.type).toBe('asset_cache_miss');
    expect(event.metrics?.sizeBytes).toBe(1024);
    expect(event.data?.key).toBe('model.glb');
    expect(typeof event.timestamp).toBe('number');
  });

  it('emits diagnostic traces with severity overrides', () => {
    emitDiagnosticTrace('heap_pressure', { level: 'warning', usedBytes: 10_000_000 });
    emitDiagnosticTrace('heap_pressure_critical', { level: 'critical', usedBytes: 20_000_000 }, 'warn');

    const events = defaultTracer.getBuffer();
    expect(events).toHaveLength(2);
    expect(events[0].domain).toBe('diagnostic');
    expect(events[0].severity).toBe('info');
    expect(events[1].severity).toBe('warn');
  });

  it('emits disposal traces with payloads', () => {
    emitDisposalTrace('gltf_dispose', { nodes: 5, geometries: 3 }, { sizeBytes: 2048 });
    const [event] = defaultTracer.getBuffer();

    expect(event.domain).toBe('disposal');
    expect(event.type).toBe('gltf_dispose');
    expect(event.metrics?.sizeBytes).toBe(2048);
    expect(event.data?.nodes).toBe(5);
  });
});
