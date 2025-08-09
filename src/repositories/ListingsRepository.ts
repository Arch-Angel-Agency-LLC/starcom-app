import { JsonFileStore } from './JsonFileStore';

export interface ListingRecord {
  id: string;
  cid: string;
  name: string;
  description?: string;
  price: number;
  tags?: string[];
  classification?: string;
  preview?: unknown;
  provenance?: unknown;
  createdAt: string;
}

export class ListingsRepository {
  private store = new JsonFileStore<ListingRecord>('listings.json');

  async create(data: Omit<ListingRecord, 'id' | 'createdAt'>): Promise<{ id: string; createdAt: string }> {
    const id = `listing-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const createdAt = new Date().toISOString();
    await this.store.put({ id, createdAt, ...data });
    return { id, createdAt };
  }

  async list(q?: string): Promise<ListingRecord[]> {
    const all = await this.store.all();
    if (!q) return all;
    const query = q.toLowerCase();
    return all.filter(l =>
      (l.name && l.name.toLowerCase().includes(query)) ||
      (l.description && l.description.toLowerCase().includes(query)) ||
      (Array.isArray(l.tags) && l.tags.some(t => (t||'').toLowerCase().includes(query)))
    );
  }

  // Test helper: not used in production runtime; clears underlying file store
  async __resetForTests(): Promise<void> {
    // overwrite file with empty array
    await this.store.replaceAll([]);
  }
}
