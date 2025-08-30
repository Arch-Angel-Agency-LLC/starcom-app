# Testing Strategy (MVP)

Purpose: Ensure snapshot generation correctness, determinism, and resilience.

## Test Layers
| Layer | Goal | Tools |
|-------|------|------|
| Unit | Adapter parsing correctness | Vitest + fixtures |
| Normalization | Field derivation (IDs, excerpt) | Vitest |
| Golden Snapshot | Output stability (diff) | Vitest + golden file |
| Failure Injection | Error handling paths | Vitest + mocks |
| Performance (light) | Basic runtime guard | Script timing |

## Fixtures Directory
`scripts/snapshot/tests/fixtures/`
| File | Scenario |
|------|----------|
| medium_feed_basic.xml | Standard feed with content:encoded |
| medium_feed_missing_images.xml | Some items missing images |
| medium_feed_malformed.xml | Broken XML structure |
| generic_rss_basic.xml | Generic RSS variant |

## Naming Conventions
- Adapter fixture prefix: `<adapter>_feed_...`.
- Article HTML (Phase 2): `<adapter>_article_variantA.html`.

## Golden Snapshot Test
1. Load fixtures using mock fetch.
2. Run pipeline with deterministic time (freeze Date).
3. Produce snapshot JSON.
4. Remove volatile fields: generatedAt, metrics.runDurationMs.
5. Compare against stored golden (pretty JSON).
6. If diff: test fails; update golden intentionally via `UPDATE_GOLDEN=1` env var.

## Determinism Checks
- Re-run generation twice with same fixtures -> identical JSON hash.
- Hash assigned to snapshot file (optional future) to verify integrity.

## Validation Tests
- Schema: attempt to validate deliberately invalid item (missing title) -> expect failure.
- Tag normalization: mixed-case tags -> all lowercase sorted.
- Excerpt: longer than max -> truncated at word boundary.

## Failure Injection Examples
```ts
// Mock fetch returning 500
fetchMock.once(Promise.resolve(new Response('err', { status:500 })));
```

## Performance Guard (Optional)
- Measure pipeline runtime for N=100 synthetic items; warn > 5s.

## CI Integration
- Run `npm run test` before snapshot generation commit step.
- Add separate `npm run test:snapshot` if isolating tests.

## Coverage (Future)
- Minimum lines / branches threshold for snapshot modules (e.g., 80%).

## Linting & Type Safety
- Snapshot scripts included in TypeScript project (tsconfig.node.json). Build must pass with no errors.

## Potential Future Tests
- Drift detection: mutated DOM signatures.
- Variant sampling: conflicting titles across variant fixtures.
- Confidence scoring: multi-layer provenance weights.

---
Keep fixtures small & representative. Add a new fixture for each upstream anomaly discovered.
