import type { SnapshotAdapter, AdapterContext, AdapterTarget, AdapterResult, ExtractedItem } from './types';
import { parseRss } from '../core/utils/rss';

export const genericRssAdapter: SnapshotAdapter = {
  id: 'rss',
  async listTargets(ctx: AdapterContext): Promise<AdapterTarget[]> {
    const feeds = ctx.config.rss?.feeds || [];
    return feeds.map((f) => ({ id: f.id, kind: 'feed', url: f.url }));
  },

  async fetchAndExtract(target: AdapterTarget, ctx: AdapterContext): Promise<AdapterResult> {
    const headers: Record<string, string> = {
      'Accept': 'application/rss+xml, application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': ctx.config.options?.userAgent || 'StarcomSnapshotBot/0.1',
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ctx.config.options?.requestTimeoutMs || 10000);
    try {
      const res = await fetch(target.url, { headers, signal: controller.signal });
      if (!res.ok) {
        ctx.logger({ level: 'warn', adapterId: this.id, code: 'FEED_FETCH_FAILED', message: `${target.url} -> ${res.status}` });
        return { target, items: [], errors: ['FEED_FETCH_FAILED'], degraded: true };
      }
      const xml = await res.text();
      const feed = await parseRss(xml);
      const items: ExtractedItem[] = (feed.items || [])
        .map((it) => {
          const title = it.title?.[0];
          const link = it.link?.[0];
          if (!link) return null;
          const pubDate = it.pubDate?.[0];
          const categories = Array.isArray(it.category) ? it.category : (it.category ? [it.category] : []);
          const description = it.description?.[0] || '';
          const imgMatch = typeof description === 'string' ? description.match(/<img[^>]+src=\"([^\"]+)\"/i) : null;
          const extracted: ExtractedItem = {
            url: link,
            title,
            author: undefined,
            publishedAt: pubDate,
            tags: categories as string[],
            excerptHtml: typeof description === 'string' ? description : '',
            image: imgMatch ? imgMatch[1] : null,
          };
          return extracted;
        })
        .filter((e): e is ExtractedItem => !!e);
      items.sort((a, b) => (a.url! < b.url! ? -1 : a.url! > b.url! ? 1 : 0));
      return { target, items, errors: [], degraded: false };
    } catch (e: any) {
      const msg = e?.name === 'AbortError' ? 'timeout' : (e?.message || 'unknown');
      ctx.logger({ level: 'warn', adapterId: this.id, code: 'FEED_FETCH_FAILED', message: `${target.url} -> ${msg}` });
      return { target, items: [], errors: ['FEED_FETCH_FAILED'], degraded: true };
    } finally {
      clearTimeout(timeout);
    }
  },
};
