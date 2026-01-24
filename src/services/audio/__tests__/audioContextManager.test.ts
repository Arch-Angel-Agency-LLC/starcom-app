import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AudioContextManager } from '../audioContextManager';
import { emitAudioTelemetry } from '../audioTelemetry';

jest.mock('../audioTelemetry', () => ({ emitAudioTelemetry: jest.fn() }));

class MockAudioContext {
  public state: AudioContextState = 'running';
  public sampleRate = 48000;
  close = jest.fn().mockResolvedValue(undefined);
  resume = jest.fn().mockResolvedValue(undefined);
}

describe('AudioContextManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (emitAudioTelemetry as jest.Mock).mockClear();
    // @ts-expect-error override for tests
    window.AudioContext = MockAudioContext;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    // @ts-expect-error cleanup override
    delete window.AudioContext;
  });

  it('caps concurrent sources and emits rejection telemetry', () => {
    const manager = new AudioContextManager({ maxConcurrentSources: 1 });

    const first = manager.acquire();
    expect(first).not.toBeNull();

    const second = manager.acquire();
    expect(second).toBeNull();

    expect(emitAudioTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'source_rejected', reason: 'cap' })
    );

    first?.release();
  });

  it('closes context after idle timeout when last source released', async () => {
    const manager = new AudioContextManager({ idleCloseMs: 10 });

    const slot = manager.acquire();
    expect(slot).not.toBeNull();
    const contextInstance = (slot as NonNullable<typeof slot>).context as unknown as MockAudioContext;

    slot?.release();

    jest.advanceTimersByTime(10);
    await Promise.resolve();

    expect(contextInstance.close).toHaveBeenCalled();
    expect(emitAudioTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'context_closed', reason: 'idle' })
    );
  });
});
