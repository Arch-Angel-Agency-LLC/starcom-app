# Content Snapshot System - Design Notes

This document expands on architecture choices, trade-offs, and planned evolution beyond Phase 1.

## 1. Architectural Principles
- **Determinism:** Given same upstream feeds, identical snapshot output (ordering + hashing) for reproducibility.
- **Resilience via Layering:** Prefer structured sources (RSS/XML) first; later phases add OpenGraph / JSON-LD / heuristic DOM fallback.
- **Versioned Schema:** `specVersion` increments only for breaking changes; additive fields require no increment but are listed in changelog.
- **Client-Only Consumption:** No server API translation layer; snapshot JSON is final contract.
- **Graceful Degradation:** Partial upstream failure does not necessarily block snapshot if quality gates satisfied.

## 2. Adapter Strategy
Adapters encapsulate: discovery -> raw fetch -> extraction -> normalization.

Planned interface (simplified Phase 1):
```
interface SnapshotAdapter {
  id: string;                 // 'medium' | 'rss:generic'
  listTargets(config): Promise<AdapterTarget[]>; // e.g. feed URLs
  fetchAndExtract(target: AdapterTarget, ctx): Promise<ExtractedItem[]>; // parsed metadata items
}
```
Phase 2 expands into multi-layer extraction + per-field provenance.

## 3. ID Generation
Stable deterministic ID: `sha256(url)` truncated (first 32 hex chars). Prevents collisions while keeping payload light. Store hash algorithm in snapshot metadata.

## 4. Confidence Scoring (Future Model)
Per field: combine weighted contributions from sources. Example weights (subject to tuning):
- JSON-LD: 0.95
- OpenGraph meta: 0.9
- RSS Feed: 0.85
- oEmbed: 0.8
- Heuristic DOM: 0.65
- Slug Heuristic: 0.4

Aggregate item confidence = min(core fields: title, author, publishedAt). Phase 1 uses uniform baseline (0.85) while instrumentation for deeper scoring is built.

## 5. Drift Detection (Phase 2+)
For each adapter, maintain structural signature:
- Medium feed: set of top-level element names + presence of `<content:encoded>`.
- Article HTML (if fetched): CSS path signatures for title & author elements hashed.
If new signature Jaccard similarity < threshold vs last stored signature -> emit DRIFT alert.

## 6. Variant Sampling (Phase 2+)
Fetch same article with multiple User-Agent strings (desktop, mobile). For core fields, if inconsistent values appear, downgrade confidence and record variantDisagreement count.

## 7. Excerpt Handling
Excerpt derived by stripping HTML tags from `content:encoded` or description fields, normalizing whitespace, truncating to configured length (default 200 chars, boundary at word). Sanitized to avoid embedded scripts/styles.

## 8. Quality Gates
Quality gates prevent publishing degraded snapshots. Gate config (Phase 1):
```
minItemCount = 1
requiredFields = ['title','publishedAt']
minFieldCoverage = 0.9
minAvgConfidence = 0.75
```
Phase 2 introduces per-source minimum coverage and drift allowances.

## 9. Change Management
- Changelog tracked in `CHANGELOG.md` (to be added) with specVersion updates.
- Consumers expected to ignore unknown top-level fields (forward compatibility).

## 10. Performance Considerations
Target: Generation under 5s for 200 items.
Optimizations (Phase 2+):
- Conditional GET with If-Modified-Since.
- Parallel fetch with concurrency cap.
- Cache parsed feed ETags in `.cache/` directory.

## 11. Security & Compliance
- Only public metadata; no bulk reproduction of article bodies.
- Sanitization removes scripts/styles; future HTML subset (if stored) passes through an allowlist filter.
- Trusted allowlist of feeds prevents arbitrary host injection.

## 12. Extensibility Roadmap
Phase 1: Medium (user/publication/tag feeds) + generic RSS.
Phase 2: Add OpenGraph & fallback DOM parse (initial drift detection).
Phase 3: Additional platforms (Substack, Dev.to), structural metrics expansion.
Phase 4: IPFS publish + single-signer signature; optional encryption of feed allowlist if needed.
Phase 5: Multi-signer quorum & potential ENS pointer for latest snapshot CID.

## 13. Alerting Workflow (Phase 2+)
If drift or low coverage triggered, CI opens/updates `Snapshot Quality Monitor` GitHub issue with summary & diff of structural signature hashes.

## 14. Testing Approach
- Unit tests for parsing specific feed fixture edge cases.
- Golden snapshot test ensuring stable ordering & hashing across runs.
- Fuzz test: remove random XML elements to ensure resilience.
- Performance test: measured generation time (warn if threshold exceeded).

## 15. Open Issues / TBD
- Decide whether to include language detection (adds dependency) in Phase 1 or defer.
- Determine canonical set of Medium feeds for initial allowlist.
- Define retention policy for historical snapshots (maybe keep last 30 by timestamp).

---
Future edits will refine as implementation proceeds.
