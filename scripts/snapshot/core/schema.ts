// Snapshot Schema Types (specVersion 1)
// Aligns with docs/content-snapshots/SCHEMA.md

export interface Snapshot {
  specVersion: 1;
  generatorVersion: string;
  generatedAt: string; // ISO8601
  metrics: SnapshotMetrics;
  sources: SnapshotSource[];
  items: ArticleMeta[];
  alerts: SnapshotAlert[]; // empty in MVP
  meta?: { extensions?: Record<string, unknown> };
}

export interface SnapshotMetrics {
  runDurationMs: number;
  itemCount: number;
  avgConfidence: number;
  minConfidence: number;
  sourcesSucceeded: number;
  sourcesFailed: number;
}

export interface SnapshotSource {
  id: string; // adapterId
  type: 'adapter';
  configHash?: string;
  fetchedAt: string;
  itemCount: number;
  errors?: string[];
  degraded: boolean;
}

export interface SnapshotAlert {
  type: 'DRIFT' | 'LOW_CONFIDENCE' | 'VARIANT';
  severity: 'info' | 'warn' | 'error';
  sourceId: string;
  itemId?: string;
  detail: string;
  data?: Record<string, unknown>;
}

export interface ArticleMeta {
  id: string; // sha256(url) trunc32
  url: string;
  canonicalUrl: string;
  source: { adapterId: string; feedId?: string };
  title: string;
  subtitle?: string;
  author: string; // 'unknown' if missing
  publishedAt: string; // ISO8601
  tags?: string[];
  excerpt?: string;
  image?: string | null;
  readingTimeMin?: number;
  confidence: number; // 0..1
  hash: string; // sha256:<hex>
  meta?: { extensions?: Record<string, unknown> };
}

export interface SnapshotConfig {
  medium?: { feeds: { id: string; url: string }[] };
  rss?: { feeds: { id: string; url: string }[] };
  options?: {
    excerptMaxLength?: number;
    requestTimeoutMs?: number;
    userAgent?: string;
  };
}
