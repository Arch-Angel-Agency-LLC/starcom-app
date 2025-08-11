import { describe, it, expect } from 'vitest';

interface Edge { confidence: number; metadata?: any; }

function edgeOpacity(e: Edge, start: Date, end: Date): number {
  const m = e.metadata || {};
  const ts = m?.provenance?.timestamp || m?.timestamp || m?.time;
  if (!ts) return Math.max(0.15, Math.min(1, 0.3 + e.confidence * 0.7));
  const date = new Date(ts);
  const inRange = date >= start && date <= end;
  return inRange ? Math.max(0.4, Math.min(1, 0.4 + e.confidence * 0.6)) : 0.05;
}

describe('Temporal fading', () => {
  const now = Date.now();
  const start = new Date(now - 1000 * 60 * 60);
  const end = new Date(now + 1000 * 60 * 60);
  it('applies low opacity for out-of-range edge', () => {
    const e: Edge = { confidence: 0.9, metadata: { timestamp: new Date(now - 5 * 60 * 60 * 1000).toISOString() } };
    expect(edgeOpacity(e, start, end)).toBe(0.05);
  });
  it('applies scaled opacity for in-range edge', () => {
    const e: Edge = { confidence: 0.5, metadata: { timestamp: new Date(now).toISOString() } };
    const val = edgeOpacity(e, start, end);
    expect(val).toBeGreaterThan(0.4);
    expect(val).toBeLessThanOrEqual(1);
  });
});
