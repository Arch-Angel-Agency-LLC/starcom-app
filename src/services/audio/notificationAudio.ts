import { audioContextManager } from './audioContextManager';
import { sharedAudioBufferCache } from './audioBufferCache';
import { emitAudioTelemetry } from './audioTelemetry';

type ToneType = OscillatorType;

export interface NotificationTone {
  frequency: number;
  duration: number; // seconds
  type?: ToneType;
  gain?: number;
}

const DEFAULT_GAIN = 0.08;

export const generateToneKey = ({ frequency, duration, type = 'sine' }: NotificationTone): string => {
  return `${type}:${frequency}:${duration}`;
};

const renderToneBuffer = (context: AudioContext, tone: NotificationTone): AudioBuffer => {
  const { frequency, duration, type = 'sine' } = tone;
  const sampleRate = context.sampleRate;
  const frameCount = Math.max(1, Math.ceil(sampleRate * duration));
  const buffer = context.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);
  const twoPiF = 2 * Math.PI * frequency;

  for (let i = 0; i < frameCount; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.max(0, 1 - t / duration);
    const raw = Math.sin(twoPiF * t);

    let sample = raw;
    if (type === 'square') {
      sample = raw >= 0 ? 1 : -1;
    } else if (type === 'sawtooth') {
      sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
    } else if (type === 'triangle') {
      sample = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
    }

    data[i] = sample * envelope;
  }

  return buffer;
};

export const playNotificationTone = (tone: NotificationTone): void => {
  const slot = audioContextManager.acquire();
  if (!slot) return;

  const { context, release } = slot;
  let buffer: AudioBuffer | null = null;
  const toneKey = generateToneKey(tone);

  try {
    buffer = sharedAudioBufferCache.get(toneKey);

    if (!buffer) {
      buffer = renderToneBuffer(context, tone);
      sharedAudioBufferCache.set(toneKey, buffer);
    }

    const gainNode = context.createGain();
    const source = context.createBufferSource();

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(context.destination);

    const now = context.currentTime;
    const gainValue = tone.gain ?? DEFAULT_GAIN;
    gainNode.gain.setValueAtTime(gainValue, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + tone.duration);

    emitAudioTelemetry({ type: 'source_started', toneKey, activeSources: audioContextManager.getActiveSources() });

    const cleanup = () => {
      source.onended = null;
      try {
        source.disconnect();
        gainNode.disconnect();
      } catch {
        // Disconnect errors can occur on rapid teardown; safe to ignore.
      }
      release();
      emitAudioTelemetry({ type: 'source_stopped', toneKey, activeSources: audioContextManager.getActiveSources() });
    };

    source.onended = cleanup;
    source.start();
    source.stop(now + tone.duration + 0.05);
  } catch (error) {
    console.warn('Notification tone playback failed', error);
    if (buffer) {
      try {
        release();
      } catch {
        // no-op
      }
    } else {
      release();
    }
    emitAudioTelemetry({ type: 'source_stopped', toneKey, activeSources: audioContextManager.getActiveSources() });
  }
};

export const clearNotificationAudioResources = async (): Promise<void> => {
  sharedAudioBufferCache.clear();
  await audioContextManager.forceClose();
};
