type ComposeEventType = 'compose_started' | 'compose_validated' | 'compose_published' | 'compose_failed';

export interface ComposeTelemetry {
  type: ComposeEventType;
  timestamp: string;
  durationMs?: number;
  manifestId?: string;
  sizes?: { assets: number; blobBytes?: number };
  error?: string;
}

export function emitComposeEvent(evt: ComposeTelemetry) {
  // lightweight console + DOM event stub
  console.debug('[ExchangeTelemetry]', evt);
  try {
    window.dispatchEvent(new CustomEvent('exchange.compose', { detail: evt }));
  } catch {
    // ignore in non-DOM contexts
  }
}
