import type { SnapshotConfig } from '../core/schema';

export interface AdapterContext {
  now: Date;
  logger: (evt: LogEvent) => void;
  config: SnapshotConfig;
}

export interface LogEvent {
  level: 'debug' | 'info' | 'warn' | 'error';
  adapterId: string;
  code: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface AdapterTarget {
  id: string;
  kind: 'feed';
  url: string;
}

export interface ExtractedItem {
  url: string;
  title?: string;
  author?: string;
  publishedAt?: string;
  tags?: string[];
  excerptHtml?: string;
  image?: string | null;
  readingTimeMin?: number;
  sourceMeta?: Record<string, unknown>;
}

export interface AdapterResult {
  target: AdapterTarget;
  items: ExtractedItem[];
  errors: string[];
  degraded: boolean;
}

export interface SnapshotAdapter {
  id: string;
  listTargets(ctx: AdapterContext): Promise<AdapterTarget[]>;
  fetchAndExtract(target: AdapterTarget, ctx: AdapterContext): Promise<AdapterResult>;
}
