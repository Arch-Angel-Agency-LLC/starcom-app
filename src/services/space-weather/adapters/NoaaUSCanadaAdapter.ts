// Phase 1: NOAA US/Canada Electric Field Adapter (minimal stub)
import { SourceAdapter, AdapterFetchOptions, AdapterDataset, AdapterHealth, VectorFieldPoint } from './SourceAdapter';
import { NOAADataProvider } from '../../data-management/providers/NOAADataProvider';

export class NoaaUSCanadaAdapter implements SourceAdapter {
  id = 'noaa-uscanada';
  name = 'NOAA US/Canada Adapter';
  private provider: NOAADataProvider;

  constructor(provider?: NOAADataProvider) {
    this.provider = provider || new NOAADataProvider();
  }

  async fetch(_options: AdapterFetchOptions = {}): Promise<AdapterDataset | null> {
    try {
      // Match the NOAA configuration id (see NOAADataConfig.ts)
      const electricFieldKey = 'electric-field-us-canada';
      const data = await this.provider.fetchData(electricFieldKey) as unknown as {
        features?: Array<{ geometry?: { coordinates?: [number, number] }; properties?: { Ex?: number; Ey?: number; quality_flag?: number } }>;
        time_tag?: string;
      };
      if (!data) return null;

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
          label: 'US/Canada Electric Field',
          source: 'NOAA',
          description: 'US/Canada 1D processed electric field vectors',
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
      return { healthy: true, lastChecked: Date.now(), latencyMs: performance.now() - start };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown';
      return { healthy: false, lastChecked: Date.now(), error: message, latencyMs: performance.now() - start };
    }
  }
}

export const createNoaaUSCanadaAdapter = () => new NoaaUSCanadaAdapter();
