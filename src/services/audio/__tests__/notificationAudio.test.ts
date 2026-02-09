import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { playNotificationTone, clearNotificationAudioResources } from '../notificationAudio';
import { audioContextManager } from '../audioContextManager';
import { sharedAudioBufferCache } from '../audioBufferCache';
import { setAudioTelemetryHandler, clearAudioTelemetryHandler, type AudioTelemetryEvent } from '../audioTelemetry';

class FakeGainNode {
  gain = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn()
  };
  connect = vi.fn();
  disconnect = vi.fn();
}

class FakeBufferSource {
  buffer: AudioBuffer | null = null;
  onended: (() => void) | null = null;
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn(() => {
    this.onended?.();
  });
}

class FakeAudioContext {
  sampleRate = 48000;
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  closed = false;

  createBuffer(_channels: number, length: number, _sampleRate: number): AudioBuffer {
    const bufferLike = {
      getChannelData: () => new Float32Array(length)
    } as AudioBuffer;
    return bufferLike;
  }

  createGain(): FakeGainNode {
    return new FakeGainNode();
  }

  createBufferSource(): FakeBufferSource {
    return new FakeBufferSource();
  }

  close = vi.fn(async () => {
    this.closed = true;
  });

  resume = vi.fn(async () => {});
}

declare global {
  // eslint-disable-next-line no-var
  var AudioContext: typeof FakeAudioContext;
}

describe('notificationAudio', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    (globalThis as typeof globalThis & { AudioContext: typeof FakeAudioContext }).AudioContext = FakeAudioContext;
    sharedAudioBufferCache.clear();
    clearAudioTelemetryHandler();
    await audioContextManager.forceClose();
  });

  afterEach(async () => {
    vi.useRealTimers();
    clearAudioTelemetryHandler();
    await clearNotificationAudioResources();
  });

  it('releases sources after repeated notifications and closes when idle', async () => {
    const telemetry: AudioTelemetryEvent[] = [];
    setAudioTelemetryHandler((evt) => telemetry.push(evt));

    for (let i = 0; i < 5; i += 1) {
      playNotificationTone({ frequency: 800, duration: 0.05 });
    }

    expect(audioContextManager.getActiveSources()).toBe(0);
    expect(sharedAudioBufferCache.size()).toBe(1);

    const startEvents = telemetry.filter((e) => e.type === 'source_started');
    const stopEvents = telemetry.filter((e) => e.type === 'source_stopped');
    expect(startEvents).toHaveLength(5);
    expect(stopEvents).toHaveLength(5);

    vi.runAllTimers();

    const idleCloseEvent = telemetry.find((e) => e.type === 'context_closed' && e.reason === 'idle');
    expect(idleCloseEvent).toBeTruthy();
  });
});
