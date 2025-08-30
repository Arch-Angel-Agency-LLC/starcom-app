# Adapters Contract (MVP)

Purpose: Define how source-specific logic plugs into the snapshot generator. Adapters encapsulate discovery + extraction for a content origin (e.g., Medium).

## Goals
- Uniform lifecycle (list targets -> fetch & extract -> normalized items).
- Isolation: adapter-specific errors do not crash the pipeline unless all adapters fail.
- Determinism: given same inputs, output order & values stable.

## Interface (Phase 1 Simplified)
```ts
export interface AdapterContext {
  now: Date;               // generation start timestamp
  logger: (evt: LogEvent) => void;
  config: SnapshotConfig;  // global config (allowlists, limits)
}

export interface LogEvent {
  level: 'debug'|'info'|'warn'|'error';
  adapterId: string;
  code: string;    // machine-readable (e.g., FEED_FETCH_FAILED)
  message: string; // human readable summary
  data?: Record<string, unknown>;
}

export interface AdapterTarget {
  id: string;          // stable id for target (e.g., '@user' or feed URL hash)
  kind: 'feed';        // future: 'article','api'
  url: string;         // fetch URL
}

export interface ExtractedItem {  // intermediate before normalization to ArticleMeta
  url: string;
  title?: string;
  author?: string;
  publishedAt?: string; // raw date string
  tags?: string[];
  excerptHtml?: string; // raw fragment for excerpt derivation
  image?: string;
  readingTimeMin?: number;
  sourceMeta?: Record<string, unknown>; // adapter internal fields
}

export interface AdapterResult {
  target: AdapterTarget;
  items: ExtractedItem[];
  errors: string[];        // adapter-level error codes
  degraded: boolean;       // true if partial extraction
}

export interface SnapshotAdapter {
  id: string;  // unique lowercase id (e.g., 'medium')
  listTargets(ctx: AdapterContext): Promise<AdapterTarget[]>;
  fetchAndExtract(target: AdapterTarget, ctx: AdapterContext): Promise<AdapterResult>;
}
```

## Responsibilities
| Method | Responsibility | Failure Handling |
|--------|----------------|------------------|
| listTargets | Return configured target set | Throw -> adapter skipped, logged |
| fetchAndExtract | Fetch & parse one target | Return degraded:true with errors on partial issues |

## Adapter Output to Normalization
Normalization (pipeline) maps `ExtractedItem` -> `ArticleMeta` applying:
- URL normalization & canonical equality fallback.
- Title fallback: slug heuristic if missing.
- Author fallback: 'unknown'.
- Tag cleanup: lowercase, dedupe, sort.
- Excerpt: sanitize + truncate from excerptHtml.
- image validation: https protocol else null.
- ID & hash derivation.
- Confidence scoring rules (MVP baseline).

## Error Codes (Suggested Set)
| Code | Meaning | Suggested Action |
|------|---------|------------------|
| FEED_FETCH_FAILED | HTTP error fetching feed | Mark degraded; continue |
| FEED_PARSE_ERROR | XML parse failed | degraded |
| ITEM_MALFORMED | Missing critical fields | skip item |
| RATE_LIMIT | Upstream rate limited | retry later (Phase 2) |
| UNKNOWN | Unclassified error | degrade |

## Medium Adapter (Phase 1)
- Targets: user / publication / tag feeds (configured list).
- Fetch: GET feed URL with Accept: application/rss+xml.
- Parse: xml2js (lenient); ignore unknown nodes.
- Items: map RSS <item> fields; prefer `<content:encoded>` for excerptHtml.

## Generic RSS Adapter
- Accepts arbitrary feed URLs in config.rss.feeds.
- Similar extraction minus Medium-specific logic (no hero image heuristics beyond first <img> extraction).

## Logging Guidelines
- Avoid excessive debug noise; one info per target success, warn per target error.
- Use machine codes; UI can summarize later.

## Determinism Requirements
- Sort `items` within a single AdapterResult by `url` before returning (pre-normalization) to ensure stable merge order.
- Do not embed timestamps inside item fields (only publishedAt from feed).

## Performance Budget (MVP)
- One network request per feed target.
- Hard timeout per request (default 10s). Timeout -> FEED_FETCH_FAILED.

## Adding a New Adapter (Checklist)
1. Choose unique id.
2. Implement `SnapshotAdapter` in `scripts/snapshot/adapters/<id>Adapter.ts`.
3. Update adapter registry (central export array).
4. Add config section & document in CONFIG.md.
5. Provide at least one fixture file + unit test.
6. Run `npm run test` + snapshot generation locally.

## DO / DO NOT
- DO sanitize and validate URLs.
- DO handle network errors gracefully.
- DO keep dependencies minimal.
- DO NOT perform uncontrolled concurrency explosions.
- DO NOT store personally identifiable non-public data.
- DO NOT mutate global state outside adapter scope.

## Example Skeleton (Medium Adapter Snippet)
```ts
export const mediumAdapter: SnapshotAdapter = {
  id: 'medium',
  async listTargets(ctx) {
    return ctx.config.medium.feeds.map(f => ({ id: f.id, kind: 'feed', url: f.url }));
  },
  async fetchAndExtract(target, ctx) {
    const res = await fetch(target.url, { headers: { 'Accept': 'application/rss+xml' } });
    if (!res.ok) {
      ctx.logger({ level:'warn', adapterId:this.id, code:'FEED_FETCH_FAILED', message:`${target.url} -> ${res.status}` });
      return { target, items: [], errors:['FEED_FETCH_FAILED'], degraded:true };
    }
    const xml = await res.text();
    // parse xml -> items (omitted)
    return { target, items: parsedItems, errors: [], degraded:false };
  }
};
```

## Future Extensions (Phase 2+)
- Multi-layer extraction pipeline per item (provenance in `extractionLayers`).
- Variant sampling (multiple fetch patterns per target).
- Adaptive retry & backoff.

---
Adapters altering the interface MUST update this document and increment `generatorVersion` accordingly.
