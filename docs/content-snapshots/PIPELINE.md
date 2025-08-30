# Snapshot Generation Pipeline (MVP)

Purpose: Describe end-to-end execution flow producing `latest.json` from configured adapters.

## High-Level Steps
1. Load config
2. Initialize context (logger, timestamps)
3. Enumerate adapters -> collect all targets
4. For each target (sequential or limited concurrency): fetch & extract
5. Accumulate AdapterResults
6. Normalize all ExtractedItems -> ArticleMeta items
7. Compute metrics, confidence, hashes, ordering
8. Apply quality gates
9. If pass & diff -> write `public/content-snapshots/latest.json`
10. Exit with code (0 success / non-zero fatal)

## ASCII Flow
```
CONFIG -> ADAPTER REGISTRY -> TARGET QUEUE
  |                             |
  v                             v
FETCH+EXTRACT (per target) --> AdapterResults
  |                                |
  +--> NORMALIZE & DEDUPE ---------+
                |
        METRICS & GATES
                |
          WRITE SNAPSHOT
```

## Detailed Flow
| Step | Description | Output |
|------|-------------|--------|
| Load Config | Read JSON/TS config module | SnapshotConfig object |
| Register Adapters | Static import list | Adapter[] |
| listTargets | Flatten targets from all adapters | AdapterTarget[] |
| fetchAndExtract | Network fetch + parse | AdapterResult per target |
| Merge Results | Concatenate ExtractedItems | ExtractedItem[] |
| Normalize | Apply rules (IDs, excerpts, tags) | ArticleMeta[] |
| Metrics | Compute stats | metrics object |
| Gates | Validate coverage & confidence | pass/fail boolean |
| Diff | Compare new vs existing file | changed? |
| Write | Persist JSON (pretty or minified) | latest.json |

## Normalization Rules (MVP)
- id = trunc32(sha256(url))
- canonicalUrl = normalized url (strip utm_*, trailing slashes collapse)
- tags: lowercase, dedupe, sort
- excerpt: strip HTML tags, collapse whitespace, truncate at <=200 chars (last full word)
- readingTimeMin: if excerpt >= 200 chars or raw words present: ceil(words/200) else omit
- confidence: baseline 0.85 adjusted per SCHEMA rules
- hash: sha256 over canonical fields (see SCHEMA)

## Quality Gate Evaluation
| Gate | Logic | Action on Fail |
|------|-------|----------------|
| itemCount | items.length > 0 | Abort write |
| required coverage | >=90% items have title & publishedAt | Abort write |
| avgConfidence | metrics.avgConfidence >= 0.75 | Abort write |

## Diff Strategy
- If no existing snapshot: write.
- Else load previous JSON, remove volatile fields (generatedAt, metrics.runDurationMs) then deep compare.
- If identical: skip commit (exit 0).

## Logging Format
```
{ ts, level, adapterId?, code, message, data? }
```
- Emit summary lines: TOTAL_ITEMS, GATE_PASS/FAIL.
- On failure, include reason codes.

## Concurrency
- MVP: sequential targets acceptable (< few feeds).
- Config option `maxConcurrentTargets` reserved (default 2 future).

## File Writing
- Write to temp path: `public/content-snapshots/latest.tmp.json` then atomic rename to `latest.json`.
- Ensure directory exists.

## Error Handling
- Target errors increment degraded count; still proceed unless all targets fail.
- Fatal: unhandled exception in normalization or schema validation -> exit non-zero (CI fails, no overwrite).

## Determinism Guarantees
- Sorting: items sorted by id before metrics.
- No reliance on Date.now() outside `generatedAt`.
- Hashing uses normalized canonical fields only.

## Extensibility Hooks (Phase 2)
- After extraction: `applyProvenanceLayers(item)`
- Before write: `computeDriftAlerts(previousSnapshot)`
- After write: optional IPFS publish step.

## CLI Invocation (planned)
```
node scripts/snapshot/generateSnapshot.ts \
  --config scripts/snapshot/config/feeds.json \
  --out public/content-snapshots/latest.json \
  --pretty
```
Flags:
- `--pretty` pretty-print JSON (else minified)
- `--fixtures` use local fixtures directory (testing)

## Exit Codes
| Code | Meaning |
|------|---------|
| 0 | Success (write or skip) |
| 1 | Config load error |
| 2 | Adapter fatal (all failed) |
| 3 | Quality gate failure |
| 4 | Schema validation failure |
| 5 | Unexpected exception |

## Metrics Computation
```
metrics.itemCount = items.length
metrics.avgConfidence = sum(conf) / N (2 decimals)
metrics.minConfidence = min(conf)
metrics.sourcesSucceeded = sources.filter(!degraded).length
metrics.sourcesFailed = sources.filter(degraded).length
```

## Security Notes
- Only allow HTTPS URLs.
- Strip query params matching /^utm_/i.
- Reject items where host mismatches expected domain for adapter (Medium adapter whitelist medium.com & custom medium CDN host patterns if needed).

---
Pipeline changes that alter ordering or hashing MUST update SCHEMA.md and bump generatorVersion.
