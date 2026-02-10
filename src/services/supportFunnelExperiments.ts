import { SupportFunnelConfig } from '../config/supportFunnelConfig';

const SESSION_KEY = 'support_funnel_session_v1';
let memorySessionId: string | null = null;

function randomId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 12);
}

function loadSessionId(): string {
  if (typeof window === 'undefined') {
    if (!memorySessionId) memorySessionId = randomId();
    return memorySessionId;
  }
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = randomId();
    window.localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    if (!memorySessionId) memorySessionId = randomId();
    return memorySessionId;
  }
}

function hashToIndex(id: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0; // force 32bit
  }
  return Math.abs(hash) % Math.max(length, 1);
}

export function getExperimentContext(config: Pick<SupportFunnelConfig, 'experimentEnabled' | 'experimentVariant' | 'experimentVariants'>) {
  const sessionId = loadSessionId();
  if (!config.experimentEnabled) {
    return { sessionId, variant: null };
  }
  const variants = config.experimentVariants.length > 0 ? config.experimentVariants : ['baseline_v1'];
  const chosen = config.experimentVariant || variants[hashToIndex(sessionId, variants.length)];
  return { sessionId, variant: chosen };
}
