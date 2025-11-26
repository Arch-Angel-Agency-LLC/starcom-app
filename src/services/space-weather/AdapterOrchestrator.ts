// Phase 1: Minimal Adapter Orchestrator
// Collects registered SourceAdapters, fetches them, aggregates vectors, and exposes simple telemetry.

import { SourceAdapter, AdapterDataset, VectorFieldPoint } from './adapters/SourceAdapter';
import { spaceWeatherDiagnostics } from './SpaceWeatherDiagnostics';

export interface OrchestratorResult {
  datasets: AdapterDataset[];
  vectors: { latitude: number; longitude: number; magnitude: number; direction: number; quality: number; ex?: number; ey?: number }[];
  metrics: {
    adapterCount: number;
    totalVectors: number;
    fetchMs: number;
    failures: number;
  };
  errors: { adapterId: string; error: string }[];
}

export class AdapterOrchestrator {
  private adapters: SourceAdapter[] = [];

  register(adapter: SourceAdapter) {
    this.adapters.push(adapter);
    return this;
  }

  clear() {
    this.adapters = [];
  }

  async fetchAll(): Promise<OrchestratorResult> {
    const start = performance.now();
    const datasets: AdapterDataset[] = [];
    const errors: { adapterId: string; error: string }[] = [];

    for (const adapter of this.adapters) {
      const adapterStart = performance.now();
      try {
        const ds = await adapter.fetch();
        if (ds) {
          datasets.push(ds);
          this.recordAdapterMetric(adapter.id, performance.now() - adapterStart, true, ds.vectors?.length || 0);
        } else {
          this.recordAdapterMetric(adapter.id, performance.now() - adapterStart, true, 0);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown';
        errors.push({ adapterId: adapter.id, error: message });
        this.recordAdapterMetric(adapter.id, performance.now() - adapterStart, false, 0, message);
      }
    }

  const vectors: VectorFieldPoint[] = datasets.flatMap(d => d.vectors || []);

    return {
      datasets,
  vectors: vectors.map(v => ({ latitude: v.latitude, longitude: v.longitude, magnitude: v.magnitude, direction: v.direction, quality: v.quality, ex: (v as unknown as { ex?: number }).ex, ey: (v as unknown as { ey?: number }).ey })),
      metrics: {
        adapterCount: this.adapters.length,
        totalVectors: vectors.length,
        fetchMs: performance.now() - start,
        failures: errors.length
      },
      errors
    };
  }

  private recordAdapterMetric(adapterId: string, durationMs: number, success: boolean, vectors: number, error?: string) {
    spaceWeatherDiagnostics.recordAdapterMetric({
      adapterId,
      durationMs,
      success,
      vectors,
      error,
      timestamp: Date.now()
    });
  }
}

export const createAdapterOrchestrator = () => new AdapterOrchestrator();
