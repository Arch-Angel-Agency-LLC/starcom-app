# 🌐 Borders Data Pipeline Plan & Progress Tracker

Project: Starcom App  
Domain: GeoPolitical Visualization (NationalTerritories Focus)  
Author: GitHub Copilot  
Created: 2025-08-09  
Status: Iteration B (WS2) In-Progress

---
## 1. Overview
This document operationalizes the prioritized quick-win data engineering and runtime improvements for geopolitical borders. It complements `GEOPOITICAL_EXPANSION_PLAN.md` by focusing specifically on border & maritime datasets, normalization, integrity, and performance foundations required for advanced analytics and future submodes.

---
## 2. Objectives & Scope
High-impact, low-to-medium effort upgrades that:
- Standardize classification semantics (land + maritime) across LODs & perspectives.
- Shrink payload size via TopoJSON + shared topology.
- Fill inactive UI toggles (maritime EEZ) with real data.
- Provide reproducible, verifiable dataset provenance & integrity.
- Accelerate interaction (hover/pick) with spatial indexing.
- Establish stable arc/segment IDs and metrics to unlock analytics & deltas.

Out of Scope (for this phase): Label rendering, alliance overlays, dynamic dispute enrichment beyond basic classification tags.

---
## 3. Workstreams (WS)
| ID | Title | Goal | Deliverables | Exit Criteria |
|----|-------|------|-------------|---------------|
| WS1 | Classification Normalization & Recognition Matrix | Canonical enum + perspective matrix | `normalization.ts`, `normalized_borders_LOD*.json`, tests, stats report | <1% UNKNOWN; matrix JSON accessible at runtime |
| WS2 | TopoJSON Conversion & Shared Topology | Payload reduction & arc reuse | `topo-build.mjs`, `world-borders.topo.json`, arc index | ≥50% size reduction; reuse % logged |
| WS3 | Maritime EEZ Integration | Activate maritime toggle & overlaps | `eez_raw/`, `eez_topology.topo.json`, merged classification | EEZ renders; overlaps flagged & toggleable |
| WS4 | Provenance & Metadata Manifest | Reproducibility & integrity check | `manifest.json`, `verifyIntegrity.ts`, UI status | All datasets hash-verified; mismatch path tested |
| WS5 | Spatial Index for Interaction | Faster hover/pick | Precomputed R-tree / Flatbush data blob, loader integration | ≥60% hover perf improvement dense region |
| WS6 | Stable IDs & Segment Metrics | Deterministic analytics substrate | `metrics-build.mjs`, `border_metrics.json`, runtime attachment | 100% arcs stableID; length error <1% |

---
## 4. Canonical Classification Enum (Draft)
```
International
Disputed
LineOfControl
Indefinite
MaritimeEEZ
MaritimeOverlap
InternalPlaceholder
Unknown
```
Perspective recognition tokens mapped to: Recognized | Unrecognized | Verify | Admin1 | Blank.

---
## 5. Dependency Graph
WS1 → (WS2, WS3)  
WS2 → (WS5, WS6)  
WS3 → WS4 (manifest update)  
WS2 & WS3 → WS4  
WS2 → WS6  
WS4 independent of WS5/6 once artifacts exist.

---
## 6. Iteration Schedule (Target)
| Iteration | Days | Scope |
|-----------|------|-------|
| A | 1–2 | WS1 normalization + tests |
| B | 3–4 | WS2 topology build & loader refactor |
| C | 5 | WS3 maritime integration |
| D | 6 | WS4 manifest + integrity UI wiring |
| E | 7 | WS5 spatial index integration |
| F | 8 | WS6 stable IDs + metrics & regression tests |

Buffer (Day 9) for polish, validation & documentation.

---
## 7. Status Dashboard
| Workstream | Status | % | Notes |
|------------|--------|----|-------|
| WS1 Normalization | Complete | 100 | artifacts + loader fallback integrated |
| WS2 Topology | In-Progress | 90 | quantization error metrics added (mean rel 0.123%, max 2.29%) |
| WS3 Maritime | Deferred | 35 | Fetch blocked; manifest prioritized |
| WS4 Manifest | In-Progress | 10 | Manifest script + initial artifact hashes |
| WS5 Spatial Index | Planned | 0 | Algorithm choice: Flatbush (likely) |
| WS6 Stable IDs | Planned | 0 | Will hash quantized arcs (SHA1 -> first 8 hex) |

Legend: Planned / In-Progress / Blocked / Complete.

---
## 8. Metrics & Benchmarks (Baseline Placeholders)
| Metric | Baseline | Target | Measurement Method |
|--------|----------|--------|--------------------|
| Borders Payload (LOD0) | 393.6 KB raw / 60.9 KB gzip | -50% | Network panel gzip size |
| Topology Payload (All LODs) | 581.3 KB raw / 88.6 KB gzip | Informational | Network panel gzip size |
| Raw Borders (All LODs) | 1,163,821 B raw / 182,785 B gzip | - | Aggregated file read |
| Normalized Borders (All LODs) | 1,740,505 B raw / 192,144 B gzip | - | Aggregated file read |
| Topology vs Raw Reduction | bytes 48.9% / gzip 50.4% | ≥50% gzip | Benchmark script |
| Arc Reuse Ratio (avg refs per arc) | 1.156 | >1.35 | Benchmark reuse script |
| Unknown Classification Rate | 0% | <1% | Normalization report |
| Hover Frame Cost (dense) | TBD ms | -60% | Performance sample 120 frames |
| Integrity Verification Time | TBD ms | <300ms | Hash timing via performance.now() |
| Avg Arc Length Error Post-Quantization | mean 0.123% (max 2.29%) | <0.5% mean | Quantization error calc |

(To fill once WS1/WS2 produce artifacts.)

---
## 9. Detailed Task Logs
### Iteration A (WS1)
- Tasks: Build mapping table; implement parser; generate matrix; produce stats; unit tests; integrate loader fallback.
- Commits: (Scaffold added normalization regex + recognition matrix cache)
- Notes: Initial matrix built at runtime; next: persist stats & expand mapping table.
- Added: normalization/normalization.ts with canonical enum & stats generation.
- Added: generate-normalized-borders.ts build script.
- Run: geo:normalize produced normalized artifacts & summary (365 features, 0% unknown).
- Added: loader fallback to consume normalized artifacts when present.
- Risks: Coverage of rare FEATURECLA variants (monitor future datasets).

### Iteration B (WS2)
- Tasks: Build topology builder; quantization tuning; arc hashing; loader refactor; size benchmark.
- Progress: Initial topology built (quantization=1e5, arcs=947).
- Added: arcHashes + arcIds (sha1) stored in topology.
- Added: runtime topology loader consumption (preferred source).
- Benchmark: Raw all LODs 1,163,821 B (gzip 182,785 B); Topology 595,096 B (gzip 90,773 B) → Reduction vs raw (bytes 48.9%, gzip 50.4%).
- Reuse Metric: unique arcs 947; total arc refs 1,095; avg refs/arc 1.156 (needs improvement, suggests many single-use arcs).
- Quantization Error: mean rel 0.123%, max rel 2.29% (outliers to inspect; within mean target).
- Next: Optional arc merging to raise reuse; finalize WS2 report & close WS2.

### Iteration C (WS3)
- Tasks: Acquire EEZ dataset; simplify; integrate classification; overlap detection.
- Progress: Ingestion & processing scripts; turf installed; topology builder; service maritime loader & material classification; fetch automation script added (geo:eez:fetch).
- Next: Run geo:eez:fetch -> geo:eez:process -> geo:eez:topology; integrate runtime rendering & recompute arc reuse.

### Iteration D (WS4)
- Tasks: Manifest generation script; runtime verifier; UI status states; tamper test.
- Progress: Manifest script + initial artifact hashes.

### Iteration E (WS5)
- Tasks: Precompute bounding boxes; build Flatbush; adapt hover; benchmark.

### Iteration F (WS6)
- Tasks: Arc metrics (length, midpoint); ID assignment; metrics export; attach userData; regression tests.

---
## 10. Risk & Mitigation
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Over-aggressive quantization distorts borders | Medium | Medium | Hausdorff error guard & visual diff snapshot |
| EEZ licensing constraints | Low | High | Verify dataset license prior to inclusion; document in manifest |
| Spatial index memory overhead | Low | Medium | Use typed arrays; measure heap delta |
| Hash computation blocking UI | Low | Low | Offload to idle / requestIdleCallback |
| Multiple enum revisions causing churn | Medium | Low | Version enum; backward compatibility layer |

---
## 11. Integrity Verification Procedure (Planned)
1. Load manifest.json.  
2. For each dataset: fetch, stream hash (SHA-256), compare to manifest.  
3. Record status map {id: OK|MISMATCH|MISSING}.  
4. Expose UI indicator (green/amber/red) + re-verify button.  
5. If mismatch: log diagnostic (expected vs actual hash) and block advanced analytics (feature flag).  

---
## 12. Stable ID Strategy (Preview)
ArcID = `a_` + first 8 hex of SHA1(quantizedCoordSequence).  
Feature border stable ID = deterministic join of sorted arcIDs hashed again (prefix `f_`).  
Metrics: length (Vincenty or haversine segmented), number of arcs, classification, optional claimant codes (if available later).

---
## 13. Acceptance Gates per Workstream
| WS | Gate |
|----|------|
| 1 | Report JSON: countsPerClass, unknownPct, perspectivesMatrix size > 0 |
| 2 | Size report: original vs topo vs % reduction; arc reuse stats |
| 3 | Maritime toggle shows/hides EEZ lines within 150ms; overlap count > 0 where expected |
| 4 | UI integrity badge cycles through (pending → ok) automatically; tamper test triggers mismatch |
| 5 | Benchmark script logs pre vs post frame cost delta meeting target |
| 6 | metrics file present, random sample of 5 arcIDs stable across 2 rebuilds |

---
## 14. Update History
| Date | Change | Author |
|------|--------|--------|
| 2025-08-09 | Document created; plan scaffolded | GitHub Copilot |
| 2025-08-09 | WS1 scaffold + matrix extraction started | GitHub Copilot |
| 2025-08-09 | WS1 normalization module & stats added | GitHub Copilot |
| 2025-08-09 | WS1 generation script added | GitHub Copilot |
| 2025-08-09 | WS1 normalized artifacts generated | GitHub Copilot |
| 2025-08-09 | WS1 loader fallback integrated (WS1 complete) | GitHub Copilot |
| 2025-08-09 | WS2 topology initial build | GitHub Copilot |
| 2025-08-10 | WS2 arc hashing & ids added | GitHub Copilot |
| 2025-08-10 | WS2 runtime topology loader integrated | GitHub Copilot |
| 2025-08-10 | WS2 size benchmark logged | GitHub Copilot |
| 2025-08-13 | WS2 arc reuse benchmark scaffolded | GitHub Copilot |
| 2025-08-14 | WS2 quantization error metrics added | GitHub Copilot |
| 2025-08-14 | WS3 EEZ ingestion scaffold added | GitHub Copilot |
| 2025-08-15 | WS3 processing & overlap scaffold added | GitHub Copilot |
| 2025-08-17 | WS3 topology & service integration scaffold added | GitHub Copilot |
| 2025-08-30 | WS3 EEZ fetch automation added | GitHub Copilot |
| 2025-08-30 | WS4 manifest script + initial run | GitHub Copilot |

---
## 15. Next Immediate Action
Switch focus: expand manifest (add derived stats, optional gzip sizes), expose integrity check in UI, then baseline report (v1).
