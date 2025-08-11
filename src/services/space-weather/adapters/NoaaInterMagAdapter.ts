// Phase 1: NOAA InterMag Adapter (minimal stub)
// Wraps NOAADataProvider to expose InterMag electric field vectors via SourceAdapter contract.

import { SourceAdapter, AdapterFetchOptions, AdapterDataset, AdapterHealth, VectorFieldPoint } from './SourceAdapter';
import { NOAADataProvider } from '../../data-management/providers/NOAADataProvider';

// We assume the provider already knows how to fetch electric field data.
// This adapter only extracts the InterMag subset and normalizes metadata.

export class NoaaInterMagAdapter implements SourceAdapter {
  id = 'noaa-intermag';
  name = 'NOAA InterMag Adapter';
  private provider: NOAADataProvider;

  constructor(provider?: NOAADataProvider) {
    this.provider = provider || new NOAADataProvider();
  }

  async fetch(_options: AdapterFetchOptions = {}): Promise<AdapterDataset | null> {
    try {
      // Electric field dataset id (placeholder – adjust to real key when known)
      const electricFieldKey = 'electric-field-intermag';
      const data = await this.provider.fetchData(electricFieldKey) as unknown as {
        features?: Array<{ geometry?: { coordinates?: [number, number] }; properties?: { Ex?: number; Ey?: number; quality_flag?: number } }>;
        time_tag?: string;
      };
      if (!data) return null;

      // Minimal transformation – rely on later pipeline for enrichment.
      const vectors: VectorFieldPoint[] = (data.features || []).map(f => {
        const ex = f.properties?.Ex ?? 0;
        const ey = f.properties?.Ey ?? 0;
        const magnitude = Math.sqrt(ex * ex + ey * ey);
        const direction = Math.atan2(ey, ex) * (180 / Math.PI);
        return {
          latitude: f.geometry?.coordinates?.[1] ?? 0,
          longitude: f.geometry?.coordinates?.[0] ?? 0,
          ex, ey, magnitude, direction, quality: f.properties?.quality_flag ?? 1
        };
      });

      return {
        meta: {
          id: electricFieldKey,
          label: 'InterMag Electric Field',
          source: 'NOAA',
          description: 'InterMag + EarthScope processed electric field vectors',
          updated: data.time_tag || new Date().toISOString()
        },
        raw: data,
        vectors
      };
    } catch (err) {
      console.warn(`[${this.id}] fetch failed`, err);
      return null;
    }
  }

  async health(): Promise<AdapterHealth> {
    const start = performance.now();
    try {
      // Lightweight ping: attempt a HEAD or quick fetch of a known small endpoint in future.
      // For Phase 1 scaffold just return healthy.
      return { healthy: true, lastChecked: Date.now(), latencyMs: performance.now() - start };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown';
      return { healthy: false, lastChecked: Date.now(), error: message, latencyMs: performance.now() - start };
    }
  }
}

export const createNoaaInterMagAdapter = () => new NoaaInterMagAdapter();
