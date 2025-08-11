// Token shard & honey token configuration (light obfuscation only – not true security)
// Replace SHARD_* arrays with XOR'd char codes of your real token using the chosen XOR_KEY.
// Example to produce shards in a Node REPL:
//   const key=7; const t='123456789:REAL_TOKEN_EXAMPLE';
//   const codes=t.split('').map(c=>c.charCodeAt(0)^key);
//   // Optionally split codes into 3 roughly equal shard arrays.

export const XOR_KEY = 7; // rotate periodically

// Placeholder shards (currently encode 'PLACEHOLDER_TOKEN')
export const SHARD_A: number[] = [87,75,70,68,73,79];
export const SHARD_B: number[] = [77,73,81,73,77,70];
export const SHARD_C: number[] = [93,89,76,73,73,69];

// Decoy / honey tokens (never used legitimately). Pattern-matching scrapers may grab these.
// If you ever see traffic using these tokens, you know scraping occurred.
export const HONEY_TOKENS: string[] = [
  '111111111:FAKE_PLACEHOLDER_A',
  '222222222:FAKE_PLACEHOLDER_B'
];

let userInteractionFlag = false;
let interactionTimestamp = 0;
const interactionEvents = ['pointermove','keydown','touchstart','click'];

function markInteraction() {
  if (!userInteractionFlag) {
    userInteractionFlag = true;
    interactionTimestamp = performance.now();
    interactionEvents.forEach(evt => window.removeEventListener(evt, markInteraction));
  }
}

if (typeof window !== 'undefined') {
  interactionEvents.forEach(evt => window.addEventListener(evt, markInteraction, { passive: true }));
}

export function hasUserInteracted(): boolean { return userInteractionFlag; }
export function getInteractionTs(): number { return interactionTimestamp; }

export function decodeShardArray(shards: number[][], key: number): string {
  try {
    return shards.flat().map(n => String.fromCharCode(n ^ key)).join('');
  } catch { return ''; }
}

export interface DecodeOptions {
  earliestMs?: number;       // earliest perf.now() allowed to decode
  requireInteraction?: boolean; // gate on human interaction
  randomDelayRange?: [number, number]; // extra delay after interaction
}

// Lazy decode with gating & timing trap. Returns a promise of token (may be placeholder if gated not satisfied).
export async function gatedAssembleToken(shards: number[][], key: number, opts: DecodeOptions): Promise<{ token: string; honey: boolean; gated: boolean; }>{
  const { earliestMs = 120, requireInteraction = true, randomDelayRange = [150, 400] } = opts;
  const start = performance.now();
  // Wait for interaction if required
  if (requireInteraction && !userInteractionFlag) {
    await new Promise<void>(resolve => {
      const check = () => { if (userInteractionFlag) resolve(); else requestAnimationFrame(check); };
      check();
    });
  }
  // Enforce earliest decode time
  const nowAfterInteraction = performance.now();
  if (nowAfterInteraction < earliestMs) {
    // Timing trap -> return honey token
    return { token: HONEY_TOKENS[0], honey: true, gated: true };
  }
  // Random delay
  const [minD, maxD] = randomDelayRange;
  const extra = Math.random() * (maxD - minD) + minD;
  await new Promise(r => setTimeout(r, extra));
  const token = decodeShardArray(shards, key);
  const gated = (performance.now() - start) > 0; // trivial marker
  // If still placeholder, treat as gated
  if (!token || token.includes('PLACEHOLDER_TOKEN')) {
    return { token, honey: false, gated: true };
  }
  return { token, honey: false, gated };
}
