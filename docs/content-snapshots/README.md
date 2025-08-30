# Content Snapshot System (MVP)

This folder documents the evolving multi-source snapshot system. Phase 1 targets Medium + generic RSS metadata aggregation with a stable, versioned JSON snapshot consumable entirely client-side (no custom server required).

## Objectives
- Produce scheduled JSON snapshots of article metadata.
- Support multiple adapters (start: Medium, generic RSS).
- Provide resilience against feed / minor structural changes.
- Include confidence metrics and basic quality gates.

## Non-Goals (Phase 1)
- Full article body storage.
- Real-time updates (< 15 min).
- Multi-signer cryptographic attestation.
- P2P distribution.

## High-Level Pipeline
1. Discover targets (feed URLs) via configured allowlist.
2. Fetch feeds (HTTP GET with polite headers, optional ETag/Last-Modified reuse in later phases).
3. Parse XML -> normalized items.
4. Derive per-item fields (title, url, publishedAt, author, tags, excerpt, image, readingTime estimate, id = sha256(url)).
5. Compute per-item confidence (Phase 1: static baseline = 0.85 for feed-only extraction).
6. Assemble snapshot manifest with metrics + items.
7. Compare against previous snapshot; commit if changed.
8. Expose at `public/content-snapshots/latest.json` for the client.

## File Layout (Planned)
```
scripts/snapshot/
  generateSnapshot.ts
  adapters/
    mediumAdapter.ts
    genericRssAdapter.ts
  core/
    schema.ts
    scoring.ts
    utils/
      fetch.ts
      parseRss.ts
public/content-snapshots/
  latest.json (committed by workflow)
```

## Snapshot Schema v1 (Draft)
```
{
  "specVersion": 1,
  "generatorVersion": "0.1.0",
  "generatedAt": "ISO8601",
  "metrics": {
    "itemCount": 42,
    "avgConfidence": 0.85,
    "sources": [
      { "id": "medium", "items": 30 },
      { "id": "rss", "items": 12 }
    ]
  },
  "items": [
    {
      "id": "<sha256-trunc32>",
      "url": "https://medium.com/@user/post-slug-abcdef123456",
      "canonicalUrl": "https://medium.com/@user/post-slug-abcdef123456",
      "source": { "adapterId": "medium", "feedId": "@user" },
      "title": "Readable Title",
      "author": "@user",
      "publishedAt": "2025-08-10T17:30:00Z",
      "tags": ["tag1","tag2"],
      "excerpt": "First 180 chars…",
      "image": "https://miro.medium.com/v2/resize:fit:1200/...jpg",
      "readingTimeMin": 4,
      "confidence": 0.85
    }
  ]
}
```

## Confidence (Phase 1 Simplification)
- Feed-derived entries get a static confidence baseline (0.85).
- If required fields missing -> degraded (0.5) and item excluded if below 0.6.

## Quality Gates (Phase 1)
- itemCount > 0
- >= 90% items have title + publishedAt
- avgConfidence >= 0.75
- If gates fail: do not overwrite previous snapshot.

## Extensibility Notes
- `extractionLayers` and `alerts` reserved for Phase 2 (drift & variant detection).
- Add `meta.extensions` object for future per-item optional data.

## Roadmap
Phase 1 (MVP): Feeds -> snapshot commit & client loader.
Phase 2: Drift detection + extractionLayers + variant sampling.
Phase 3: IPFS publish + optional signing.
Phase 4: Additional adapters (Substack, Dev.to, Mirror).

## Security & Compliance
- Only store public metadata (no full bodies > configured excerpt length, default 200 chars max).
- Sanitize excerpt (strip scripts/styles) before inclusion.

## Maintenance
- Update allowlisted feeds in `scripts/snapshot/config/feeds.json` (planned).
- Monitor CI workflow summary for failures.

## Open Questions
- Initial feed allowlist (TBD).
- Excerpt max length final value.
- Handling of localized dates (assume feed ISO; fallback parse heuristics if needed).

---
See `DESIGN_NOTES.md` in this folder for deeper architectural rationale (to be added).
