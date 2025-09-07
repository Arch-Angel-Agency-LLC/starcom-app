import { describe, it, expect } from 'vitest';
import { computePlaceClusters } from '../correlationUtils';

const mkEv = (id: string, lat: number, lon: number) => ({
  id, title: id, timestamp: new Date().toISOString(), category: 'GENERAL', tags: [], lat, lon, sourceType: 'REPORT' as const, sourceId: id, entityRefs: []
});

describe('computePlaceClusters', () => {
  it('bins points into clusters with count >= 3', () => {
    const events = [
      mkEv('a1', 37.77, -122.41), mkEv('a2', 37.76, -122.42), mkEv('a3', 37.75, -122.43), // cluster A
      mkEv('b1', 40.71, -74.01), mkEv('b2', 40.72, -74.00), // only 2, should be ignored
      mkEv('c1', 51.50, -0.12), mkEv('c2', 51.51, -0.11), mkEv('c3', 51.52, -0.13), mkEv('c4', 51.49, -0.10) // cluster C
    ];
    const clusters = computePlaceClusters(events, 1);
    // Expect at least two clusters (SF and London)
    expect(clusters.length).toBeGreaterThanOrEqual(2);
    // Counts should be >=3 each
    clusters.forEach(c => expect(c.count).toBeGreaterThanOrEqual(3));
  });
});
