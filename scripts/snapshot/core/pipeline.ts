import { ArticleMeta, Snapshot, SnapshotConfig, SnapshotMetrics, SnapshotSource } from './schema';
import { computeConfidence } from './scoring';
import { contentHash, idFromUrl } from './utils/hashing';
import { normalizeUrl, sanitizeExcerpt, sanitizeTags } from './utils/normalize';
import type { SnapshotAdapter, AdapterContext, AdapterResult, ExtractedItem } from '../adapters/types';

function toIso(d: Date): string { return d.toISOString(); }

function normalizeItem(e: ExtractedItem, adapterId: string, feedId: string | undefined, excerptMaxLen: number): ArticleMeta | null {
  try {
    const url = e.url;
    if (!url) return null;
    const canonicalUrl = normalizeUrl(url);
    const title = (e.title || '').trim() || slugToTitle(url);
    const author = (e.author || '').trim() || 'unknown';
    const publishedAt = e.publishedAt ? new Date(e.publishedAt).toISOString() : new Date(0).toISOString();
    const tags = sanitizeTags(e.tags);
    const excerpt = e.excerptHtml ? sanitizeExcerpt(e.excerptHtml, excerptMaxLen) : undefined;
    const image = e.image || null;
    const readingTimeMin = deriveReadingTime(excerpt);
    const confidence = computeConfidence({ hasAuthor: author !== 'unknown', hasExcerpt: !!excerpt });
    const id = idFromUrl(url);
    const hash = contentHash({ canonicalUrl, title, author, publishedAt, excerpt, image, readingTimeMin });
    const meta: ArticleMeta = {
      id,
      url,
      canonicalUrl,
      source: { adapterId, feedId },
      title,
      author,
      publishedAt,
      tags,
      excerpt,
      image,
      readingTimeMin,
      confidence,
      hash,
      meta: { extensions: {} },
    };
    return meta;
  } catch {
    return null;
  }
}

function slugToTitle(url: string): string {
  try {
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean).pop() || '';
    const parts = seg.split('-');
    // drop last token if looks like base36 id (length >= 10 and alnum)
    if (parts.length > 1 && /^[a-z0-9]{8,}$/.test(parts[parts.length - 1])) parts.pop();
    const title = parts.join(' ').trim();
    return title ? title.replace(/\b\w/g, (m) => m.toUpperCase()) : u.pathname;
  } catch {
    return url;
  }
}

function deriveReadingTime(excerpt?: string): number | undefined {
  if (!excerpt) return undefined;
  const words = excerpt.split(/\s+/).filter(Boolean).length;
  if (words === 0) return undefined;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return minutes;
}

export async function runPipeline(adapters: SnapshotAdapter[], config: SnapshotConfig, previous?: Snapshot): Promise<Snapshot> {
  const start = new Date();
  const sources: SnapshotSource[] = [];
  const extracted: { adapterId: string; feedId?: string; items: ExtractedItem[]; degraded: boolean; errors: string[] }[] = [];

  const ctx: AdapterContext = {
    now: start,
    config,
    logger: (evt) => {
      // eslint-disable-next-line no-console
      console.log(`[${evt.level}] [${evt.adapterId}] ${evt.code} ${evt.message}`);
    },
  };

  for (const adapter of adapters) {
    let degraded = false;
    let totalItems = 0;
    let errors: string[] = [];
    try {
      const targets = await adapter.listTargets(ctx);
      for (const t of targets) {
        const res: AdapterResult = await adapter.fetchAndExtract(t, ctx);
        extracted.push({ adapterId: adapter.id, feedId: t.id, items: res.items, degraded: res.degraded, errors: res.errors });
        totalItems += res.items.length;
        if (res.degraded) degraded = true;
        if (res.errors.length) errors = errors.concat(res.errors);
      }
      sources.push({ id: adapter.id, type: 'adapter', fetchedAt: start.toISOString(), itemCount: totalItems, degraded, errors });
    } catch (e: any) {
      sources.push({ id: adapter.id, type: 'adapter', fetchedAt: start.toISOString(), itemCount: 0, degraded: true, errors: ['ADAPTER_FATAL'] });
    }
  }

  // Normalize
  const excerptMaxLen = config.options?.excerptMaxLength ?? 200;
  const normalized: ArticleMeta[] = [];
  for (const batch of extracted) {
    for (const e of batch.items) {
      const n = normalizeItem(e, batch.adapterId, batch.feedId, excerptMaxLen);
      if (n) normalized.push(n);
    }
  }

  // Deduplicate by id (prefer first occurrence)
  const byId = new Map<string, ArticleMeta>();
  for (const it of normalized) {
    if (!byId.has(it.id)) byId.set(it.id, it);
  }
  const items = Array.from(byId.values());
  items.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const avgConfidence = items.length ? Math.round((items.reduce((s, i) => s + i.confidence, 0) / items.length) * 100) / 100 : 0;
  const minConfidence = items.length ? Math.min(...items.map((i) => i.confidence)) : 0;

  const metrics: SnapshotMetrics = {
    runDurationMs: Date.now() - start.getTime(),
    itemCount: items.length,
    avgConfidence,
    minConfidence,
    sourcesSucceeded: sources.filter((s) => !s.degraded).length,
    sourcesFailed: sources.filter((s) => s.degraded).length,
  };

  const snapshot: Snapshot = {
    specVersion: 1,
    generatorVersion: '0.1.0',
    generatedAt: toIso(new Date()),
    metrics,
    sources,
    items,
    alerts: [],
    meta: { extensions: {} },
  };

  return snapshot;
}
