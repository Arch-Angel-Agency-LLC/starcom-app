import { emitAudioTelemetry } from './audioTelemetry';
import { getSingleton } from '../../utils/singleton';

export interface AudioSlot {
  context: AudioContext;
  release: () => void;
}

interface AudioContextManagerConfig {
  maxConcurrentSources?: number;
  idleCloseMs?: number;
}

export class AudioContextManager {
  private context: AudioContext | null = null;
  private activeSources = 0;
  private idleTimer: number | null = null;
  private readonly maxConcurrentSources: number;
  private readonly idleCloseMs: number;
  private capWarningIssued = false;

  constructor(config: AudioContextManagerConfig = {}) {
    this.maxConcurrentSources = config.maxConcurrentSources ?? 6;
    this.idleCloseMs = config.idleCloseMs ?? 15000;
  }

  acquire(): AudioSlot | null {
    const context = this.ensureContext();
    if (!context) return null;

    if (this.activeSources >= this.maxConcurrentSources) {
      if (!this.capWarningIssued) {
        console.warn('AudioContextManager: concurrent source cap reached', {
          maxConcurrentSources: this.maxConcurrentSources
        });
        this.capWarningIssued = true;
      }
      emitAudioTelemetry({ type: 'source_rejected', reason: 'cap', activeSources: this.activeSources });
      return null;
    }

    this.capWarningIssued = false;
    this.activeSources += 1;
    this.clearIdleTimer();

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      this.activeSources = Math.max(0, this.activeSources - 1);
      if (this.activeSources === 0) {
        this.scheduleIdleClose();
      }
    };

    return { context, release };
  }

  async forceClose(): Promise<void> {
    this.clearIdleTimer();
    this.activeSources = 0;

    if (this.context) {
      try {
        await this.context.close();
        emitAudioTelemetry({ type: 'context_closed', reason: 'force' });
      } catch (error) {
        console.warn('AudioContextManager: error closing context', error);
      }
    }

    this.context = null;
  }

  getActiveSources(): number {
    return this.activeSources;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.context || this.context.state === 'closed') {
      const AudioContextCtor =
        window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextCtor) {
        console.warn('AudioContextManager: AudioContext unavailable in this environment');
        return null;
      }

      this.context = new AudioContextCtor();
      emitAudioTelemetry({ type: 'context_created', sampleRate: this.context.sampleRate });
    }

    if (this.context.state === 'suspended') {
      void this.context.resume().catch(() => {
        // Some browsers require a user gesture; swallow errors to keep UI responsive.
      });
    }

    return this.context;
  }

  private scheduleIdleClose(): void {
    if (!this.context) return;

    this.clearIdleTimer();
    this.idleTimer = window.setTimeout(() => {
      if (this.activeSources === 0 && this.context) {
        void this.context.close().then(() => emitAudioTelemetry({ type: 'context_closed', reason: 'idle' })).catch(() => {});
        this.context = null;
      }
    }, this.idleCloseMs);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer !== null) {
      window.clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }
}

export const audioContextManager = getSingleton('audio-context-manager', () => new AudioContextManager(), {
  warnOnReuse: true
});
