// Phase 1: SourceAdapter interface scaffold
// Provides a consistent contract for all space weather data source adapters
// Keep minimal to avoid premature complexity.

export interface AdapterFetchOptions {
  forceRefresh?: boolean;
  timeoutMs?: number;
}

export interface AdapterHealth {
  healthy: boolean;
  lastChecked: number;
  error?: string;
  latencyMs?: number;
}

export interface BaseDatasetMeta {
  id: string;            // stable internal id
  label: string;         // human-readable
  description?: string;
  source: string;        // e.g. 'NOAA'
  updated?: string;      // ISO timestamp
}

export interface VectorFieldPoint {
  latitude: number;
  longitude: number;
  ex: number;
  ey: number;
  magnitude: number;
  direction: number; // degrees
  quality: number;   // 1-5 (normalized)
}

export interface AdapterDataset<T = unknown> {
  meta: BaseDatasetMeta;
  raw: T;                  // original provider payload (opaque)
  vectors?: VectorFieldPoint[]; // optional electric field vectors when applicable
}

export interface SourceAdapter {
  id: string;
  name: string;
  // Fetch a primary dataset (or bundle) – returns minimal normalized wrapper.
  fetch(options?: AdapterFetchOptions): Promise<AdapterDataset | null>;
  // Health check (lightweight, should not stress provider).
  health(): Promise<AdapterHealth>;
  // Optional cleanup if adapter holds resources.
  dispose?(): void | Promise<void>;
}

export type SourceAdapterFactory = () => SourceAdapter;
