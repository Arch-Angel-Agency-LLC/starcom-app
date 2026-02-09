import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SamplingTracer } from '../SamplingTracer';
import type { TraceEvent } from '../TracerTypes';

describe('SamplingTracer', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const buildEvent = (overrides: Partial<TraceEvent> = {}): TraceEvent => ({
    domain: 'system',
    type: 'test',
    timestamp: Date.now(),
    ...overrides,
  });

  it('caps buffer size and evicts oldest events', () => {
    const tracer = new SamplingTracer({ sampleRate: 1, bufferSize: 3 });
    tracer.emit(buildEvent({ type: 'a' }));
    tracer.emit(buildEvent({ type: 'b' }));
    tracer.emit(buildEvent({ type: 'c' }));
    tracer.emit(buildEvent({ type: 'd' }));

    const types = tracer.getBuffer().map(e => e.type);
    expect(types).toEqual(['b', 'c', 'd']);
  });

  it('respects sampling probability', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const tracerSkip = new SamplingTracer({ sampleRate: 0.0, bufferSize: 10 });
    tracerSkip.emit(buildEvent());
    expect(tracerSkip.getBuffer()).toHaveLength(0);

    const tracerKeep = new SamplingTracer({ sampleRate: 1.0, bufferSize: 10 });
    tracerKeep.emit(buildEvent({ type: 'accepted' }));
    expect(tracerKeep.getBuffer()).toHaveLength(1);
  });

  it('filters events below delta threshold', () => {
    const tracer = new SamplingTracer({ sampleRate: 1, bufferSize: 5, deltaFilterBytes: 100 });
    tracer.emit(buildEvent({ type: 'small', metrics: { deltaBytes: 50 } }));
    tracer.emit(buildEvent({ type: 'large', metrics: { deltaBytes: 150 } }));

    const types = tracer.getBuffer().map(e => e.type);
    expect(types).toEqual(['large']);
  });
});
