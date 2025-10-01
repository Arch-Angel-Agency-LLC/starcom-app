// cacheStage.ts
// Geometry build caching (Phase 5). Provides in-memory LRU keyed by feature id + hash + pipeline version.

import * as THREE from 'three';

export interface CacheKeyParts {
  featureId: string;
  hash: string; // hash of normalized + validated coordinate payload
  version: string; // pipeline version
}

export interface CachedGeometryRecord {
  key: string;
  mesh: THREE.Mesh;
  vertices: number;
  createdAt: number;
  lastAccess: number;
  sizeEstimate: number; // bytes (approx)
}

interface LRUNode {
  rec: CachedGeometryRecord;
  prev?: LRUNode;
  next?: LRUNode;
}

export class GeometryCacheLRU {
  private map = new Map<string, LRUNode>();
  private head?: LRUNode;
  private tail?: LRUNode;
  private _entries = 0;
  private _hits = 0;
  private _misses = 0;
  private _evictions = 0;
  private _vertexTotal = 0;
  constructor(private maxEntries: number, private maxVertexBudget: number) {}

  get(key: string): CachedGeometryRecord | undefined {
    const node = this.map.get(key);
    if (!node) { this._misses++; return; }
    node.rec.lastAccess = performance.now();
    this.touch(node);
    this._hits++;
    return node.rec;
  }

  set(rec: CachedGeometryRecord) {
    let node = this.map.get(rec.key);
    if (node) {
      // adjust vertex total (replace)
      this._vertexTotal -= node.rec.vertices;
      node.rec = rec;
      this._vertexTotal += rec.vertices;
      this.touch(node);
    } else {
      node = { rec };
      this.map.set(rec.key, node);
      this.insertFront(node);
      this._entries++;
      this._vertexTotal += rec.vertices;
    }
    this.enforceLimits();
  }

  private enforceLimits() {
    while (this._entries > this.maxEntries || this._vertexTotal > this.maxVertexBudget) {
      if (!this.tail) break;
      const evicted = this.tail.rec;
      this.map.delete(this.tail.rec.key);
      this._vertexTotal -= this.tail.rec.vertices;
      if (this.tail.prev) this.tail.prev.next = undefined;
      this.tail = this.tail.prev;
      this._entries--;
      this._evictions++;
      // Eviction diagnostics (optional)
      try {
        if (typeof window !== 'undefined') {
          const sp = new URLSearchParams(window.location.search);
            if (sp.has('geoPolyDiagCache')) {
              console.info('[geoPolyCache] evict', evicted.key, 'verts=', evicted.vertices);
            }
        }
      } catch(_err) { /* ignore */ }
    }
  }

  private touch(node: LRUNode) {
    if (node === this.head) return;
    // detach
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.tail) this.tail = node.prev;
    // insert front
    node.prev = undefined;
    node.next = this.head;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
  }

  private insertFront(node: LRUNode) {
    node.prev = undefined;
    node.next = this.head;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
  }

  getStats(): GeometryCacheStats {
    const totalLookups = this._hits + this._misses;
    return {
      entries: this._entries,
      vertices: this._vertexTotal,
      hits: this._hits,
      misses: this._misses,
      evictions: this._evictions,
      hitRate: totalLookups === 0 ? 0 : this._hits / totalLookups,
      maxEntries: this.maxEntries,
      maxVertexBudget: this.maxVertexBudget
    };
  }
}

// Diagnostics accessors
export interface GeometryCacheStats {
  entries: number;
  vertices: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
  maxEntries: number;
  maxVertexBudget: number;
}

// Utility: build cache key
export function buildCacheKey(parts: CacheKeyParts): string {
  return `${parts.featureId}|${parts.hash}|${parts.version}`;
}
