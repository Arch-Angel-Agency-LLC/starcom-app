export type AudioTelemetryEvent =
  | { type: 'context_created'; sampleRate: number }
  | { type: 'context_closed'; reason: 'idle' | 'force' }
  | { type: 'source_started'; toneKey: string; activeSources: number }
  | { type: 'source_stopped'; toneKey: string; activeSources: number }
  | { type: 'source_rejected'; reason: 'cap'; activeSources: number };

let handler: ((event: AudioTelemetryEvent) => void) | null = null;

export const setAudioTelemetryHandler = (nextHandler: typeof handler): void => {
  handler = nextHandler;
};

export const clearAudioTelemetryHandler = (): void => {
  handler = null;
};

export const emitAudioTelemetry = (event: AudioTelemetryEvent): void => {
  handler?.(event);
};
