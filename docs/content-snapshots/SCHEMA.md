# Snapshot Schema Specification (specVersion 1)

Purpose: Define the canonical JSON structure produced by the snapshot generator so clients and future automation can rely on deterministic, forward‑compatible metadata.

Status: MVP (stable core). Fields marked *provisional* MAY change semantics in a minor version update; others require major bump.

## Top-Level Object
```
{
  "specVersion": 1,                 // integer, MUST increase only on breaking change
  "generatorVersion": "0.1.0",     // semver of generator code
  "generatedAt": "2025-08-11T12:00:00Z", // ISO8601 UTC
  "metrics": { ... },               // run & quality metrics (see below)
  "sources": [ ... ],               // one entry per adapter/source run
  "items": [ ... ],                 // article metadata items (ordered deterministically)
  "alerts": [ ... ],                // (Phase 2+) drift / quality alerts (empty array in MVP)
  "meta": {                         // reserved for snapshot-level extensions
    "extensions": {}
  }
}
```

### Invariants
- `specVersion` MUST be an integer ≥ 1.
- `generatedAt` MUST be strictly increasing across committed snapshots.
- `items` MUST be sorted lexicographically by `id` (stable ordering requirement).
- `id` uniqueness MUST hold across all items in a snapshot.
- Clients MUST ignore unknown top-level keys for forward compatibility.

## sources[] Entry
```
{
  "id": "medium",               // adapterId
  "type": "adapter",            // reserved future discriminator
  "configHash": "sha256:...",   // hash of effective adapter config (allowlist subset) (MVP optional)
  "fetchedAt": "2025-08-11T12:00:00Z",
  "itemCount": 25,
  "errors": [],                  // array of source-scoped error codes (MVP may omit)
  "degraded": false              // true if partial/failed (gates may still pass)
}
```

## metrics Object
```
{
  "runDurationMs": 1432,          // total generation wall time
  "itemCount": 42,                // == items.length
  "avgConfidence": 0.85,          // arithmetic mean of item.confidence
  "minConfidence": 0.80,          // min across items
  "sourcesSucceeded": 2,
  "sourcesFailed": 0
}
```

## alerts[] (Empty in MVP)
Planned structure (Phase 2):
```
{
  "type": "DRIFT|LOW_CONFIDENCE|VARIANT",
  "severity": "info|warn|error",
  "sourceId": "medium",
  "itemId": "<id>",        // optional
  "detail": "Text summary",
  "data": { ... }            // machine-readable details
}
```

## items[] Entry (ArticleMeta)
```
{
  "id": "3e4c9d0f9a7b2c41d8f5a6b1e3a4c9d0", // sha256(url) first 32 hex chars
  "url": "https://medium.com/@user/post-slug-abcdef123456",
  "canonicalUrl": "https://medium.com/@user/post-slug-abcdef123456", // may differ after normalization
  "source": { "adapterId": "medium", "feedId": "@user" },
  "title": "Readable Title",                 // REQUIRED
  "subtitle": "Optional subtitle",           // OPTIONAL (Medium sometimes)
  "author": "@user",                         // REQUIRED if available else fallback slug heuristic
  "publishedAt": "2025-08-10T17:30:00Z",     // REQUIRED ISO8601
  "tags": ["tag1","tag2"],                  // lowercase strings (deduped)
  "excerpt": "First up to 200 chars…",        // sanitized, no newlines >1 consecutively
  "image": "https://miro.medium.com/v2/...jpg", // absolute URL or null
  "readingTimeMin": 4,                        // integer ≥1 (est), OPTIONAL
  "confidence": 0.85,                         // 0..1 inclusive
  "hash": "sha256:5b3d...",                   // stable content hash (see Hashing)
  "meta": { "extensions": {} }               // adapter or future fields
}
```

### Field Semantics & Validation
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | string | yes | 32 hex chars | Derived from sha256(url) trunc32 |
| url | string | yes | https URL | Original discovered URL |
| canonicalUrl | string | yes | https URL | After normalization (strip tracking) |
| source.adapterId | string | yes | /^[a-z0-9-]+$/ | Adapter unique id |
| source.feedId | string | no | free form | E.g. "@user" or feed tag |
| title | string | yes | 1..500 chars | Trim whitespace |
| subtitle | string | no | 1..500 chars | Optional |
| author | string | yes* | 1..200 chars | If missing set to "unknown" and reduce confidence |
| publishedAt | string | yes | ISO8601 UTC | Normalize to Z suffix |
| tags | string[] | no | each 1..50 chars, <=15 tags | Lowercase, dedupe, sort alpha |
| excerpt | string | no | <=200 chars | Word boundary truncation |
| image | string|null | no | https URL | Optional |
| readingTimeMin | number | no | int >=1 <=120 | Basic word count / 200 rounding |
| confidence | number | yes | 0.0–1.0 | MVP static baseline 0.85 (degrade if missing fields) |
| hash | string | yes | sha256: + hex | Hash alg prefix required |
| meta.extensions | object | no | JSON Obj | Namespaced keys future (e.g. medium.heroStyle) |

*Author may be unknown for generic feeds; treat as degraded (confidence drop formula below).

## Confidence (MVP)
```
base = 0.85
if author == 'unknown' base -= 0.10
if missing excerpt base -= 0.05 (do not go below 0.50)
confidence = round(base, 2)
```

## Hashing (Content Hash)
Purpose: Detect substantive metadata changes independent of ordering.
Input fields (concatenated with '\n'): canonicalUrl, title, author, publishedAt, excerpt (or ''), image (or ''), readingTimeMin (string or ''). Apply UTF-8 encoding, sha256 digest, full hex stored after prefix `sha256:`.

## Deterministic Ordering
Items sorted ascending by `id`. Rationale: stable across runs even if feed ordering differs; ensures minimal diff surface.

## Reserved / Future Fields
| Location | Field | Planned Use |
|----------|-------|-------------|
| item root | extractionLayers | Per-field provenance (Phase 2) |
| item root | variantConsensus | A/B sampling metrics |
| item meta.extensions | summary | Summarized text |
| top-level | alerts | Drift & quality issues |

## Example Minimal Snapshot
```
{
  "specVersion": 1,
  "generatorVersion": "0.1.0",
  "generatedAt": "2025-08-11T12:00:00Z",
  "metrics": {"runDurationMs":1200,"itemCount":1,"avgConfidence":0.85,"minConfidence":0.85,"sourcesSucceeded":1,"sourcesFailed":0},
  "sources": [ {"id":"medium","type":"adapter","fetchedAt":"2025-08-11T12:00:00Z","itemCount":1,"degraded":false} ],
  "items": [ {"id":"3e4c9d0f9a7b2c41d8f5a6b1e3a4c9d0","url":"https://medium.com/@user/post-slug-abcdef123456","canonicalUrl":"https://medium.com/@user/post-slug-abcdef123456","source":{"adapterId":"medium","feedId":"@user"},"title":"Readable Title","author":"@user","publishedAt":"2025-08-10T17:30:00Z","tags":["tag1","tag2"],"excerpt":"First 180 chars…","image":null,"readingTimeMin":4,"confidence":0.85,"hash":"sha256:5b3d...","meta":{"extensions":{}}} ],
  "alerts": [],
  "meta": {"extensions":{}}
}
```

## Validation Rules Summary
1. All required fields present.
2. URL fields start with https:// .
3. Arrays deduped; tags lowercase.
4. Confidence numeric in range.
5. id matches sha256(url) trunc32.
6. hash matches recomputed content hash.
7. No duplicate ids.

## Breaking Change Triggers
- Removing or renaming a required field.
- Changing hash input composition.
- Changing ordering of items.
- Altering confidence scale semantics.

## Non-Breaking Additions
- New optional item fields.
- New top-level keys (clients ignore unknown).
- Added extensions under meta.extensions.

---
Any adapter modifying or adding required fields MUST propose a specVersion bump with rationale.
