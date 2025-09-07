import type { Event } from '../adapters/eventsAdapter';

export type CooccurrencePair = { a: string; b: string; count: number };
export type PlaceCluster = { key: string; center: [number, number]; count: number };

function dayKey(ts: string) {
  return new Date(ts).toISOString().slice(0, 10);
}

export function computeAnomaliesByDay(events: Event[]): Set<string> {
  const counts = new Map<string, number>();
  for (const ev of events) {
    const key = dayKey(ev.timestamp);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const values = Array.from(counts.values());
  if (values.length === 0) return new Set();
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) * (b - mean), 0) / values.length;
  const std = Math.sqrt(variance);
  const threshold = mean + 2 * std;
  const anomalies = new Set<string>();
  for (const [key, count] of counts.entries()) {
    if (count >= threshold && count > 0) anomalies.add(key);
  }
  return anomalies;
}

export function computeCooccurrence(events: Event[]): CooccurrencePair[] {
  const pairCounts = new Map<string, number>();
  for (const ev of events) {
    const ents = (ev.entityRefs || []).slice().sort();
    for (let i = 0; i < ents.length; i++) {
      for (let j = i + 1; j < ents.length; j++) {
        const k = `${ents[i]}||${ents[j]}`;
        pairCounts.set(k, (pairCounts.get(k) || 0) + 1);
      }
    }
  }
  const pairs: CooccurrencePair[] = [];
  for (const [k, count] of pairCounts.entries()) {
    if (count >= 2) {
      const [a, b] = k.split('||');
      pairs.push({ a, b, count });
    }
  }
  pairs.sort((x, y) => y.count - x.count);
  return pairs.slice(0, 200);
}

export function computeTagCooccurrence(events: Event[]): CooccurrencePair[] {
  const pairCounts = new Map<string, number>();
  for (const ev of events) {
    const tags = (ev.tags || []).slice().sort();
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const k = `${tags[i]}||${tags[j]}`;
        pairCounts.set(k, (pairCounts.get(k) || 0) + 1);
      }
    }
  }
  const pairs: CooccurrencePair[] = [];
  for (const [k, count] of pairCounts.entries()) {
    if (count >= 2) {
      const [a, b] = k.split('||');
      pairs.push({ a, b, count });
    }
  }
  pairs.sort((x, y) => y.count - x.count);
  return pairs.slice(0, 200);
}

/**
 * Compute simple place clusters by binning lat/lon into a fixed grid.
 * binSizeDeg controls the grid size in degrees (default 1.0° ~ 111km at equator).
 */
export function computePlaceClusters(events: Event[], binSizeDeg = 1): PlaceCluster[] {
  if (binSizeDeg <= 0) binSizeDeg = 1;
  const bins = new Map<string, { count: number; sumLat: number; sumLon: number }>();
  for (const ev of events) {
    if (ev.lat == null || ev.lon == null) continue;
    const latBin = Math.floor(ev.lat / binSizeDeg);
    const lonBin = Math.floor(ev.lon / binSizeDeg);
    const key = `${latBin}:${lonBin}`;
    const rec = bins.get(key) || { count: 0, sumLat: 0, sumLon: 0 };
    rec.count += 1;
    rec.sumLat += ev.lat;
    rec.sumLon += ev.lon;
    bins.set(key, rec);
  }
  const clusters: PlaceCluster[] = [];
  for (const [key, v] of bins.entries()) {
    if (v.count >= 3) { // require at least 3 points to consider a cluster
      clusters.push({ key, center: [v.sumLon / v.count, v.sumLat / v.count], count: v.count });
    }
  }
  clusters.sort((a, b) => b.count - a.count);
  return clusters.slice(0, 200);
}
