# Geopolitical Geometry Pipeline

This document outlines the evolving architecture for robust, high‑fidelity rendering of complex geopolitical polygons (countries, disputed areas, maritime zones) on a 3D globe using Three.js.

## Motivation
Large multi-part territories (Russia, USA, Canada), polar regions (Antarctica), and antimeridian‑spanning islands introduce pathological cases for naïve triangulation of raw lon/lat coordinates. Artifacts appear as extremely long rogue triangles, z‑fighting, or distorted coastlines. The pipeline modularizes ingestion → normalization → projection → validation → triangulation → extrusion → diagnostics to ensure correctness, performance, and testability.

## High-Level Flow
```
Raw GeoJSON Feature
  ↓ Ingest Adapter
  ↓ Normalization (dateline split, ring closure)
  ↓ Projection Strategy (tangent plane | polar | fallback)
  ↓ Hole Assignment / Ring Decomposition
  ↓ Validation & Repair (duplicates, collinear, intersections)
  ↓ Triangulation (earcut over stable local 2D)
  ↓ Extrusion / Reprojection to Sphere
  ↓ Optimization (merge, cache, index)
  ↓ Diagnostics & Metrics Export
  ↓ THREE.Mesh / Group Output
```

## Stages (Planned & Implemented)
| Stage | Status | Purpose | Key Outputs |
|-------|--------|---------|-------------|
| Unwrap / Basic Split | Initial | Remove huge 360° jumps via incremental unwrap | Adjusted ring coordinates |
| Dateline Split (Outer) | Initial | Break outer rings at ±180° seams | Multiple outer parts |
| Polar Detection | Initial | Avoid splitting Antarctica / polar cap features | Classification label |
| Tangent Plane Projection | Planned (Phase 1) | Reduce distortion for wide spans | Local 2D (u,v) coords |
| Polar Projection (Lambert) | Planned | Accurate polar geometry | Local 2D (x,y) stable near poles |
| Hole Reassignment Post-Split | Planned | Maintain correct hole→outer mapping | Part-specific hole lists |
| Hole Dateline Split | Planned | Handle crossing holes | Normalized hole parts |
| Validation (Edges / Intersections) | Planned | Catch / repair degenerate geometry | Metrics + repaired rings |
| Extrusion (Spherical + Projected) | In Progress | Depth walls + projected triangulation parity | Added hole side-wall extrusion (projected) |
| Caching (Hash + LRU) | Planned | Performance on reloads | Cache hit metrics |
| Diagnostics HUD / Probes | Partial | QA visibility (edge ratios, splits) | window.__geoPolyDiagEdges |

## Progress Tracker
| Item | Phase | Status | Last Update | Notes |
|------|-------|--------|-------------|-------|
| Basic unwrap & outer dateline split | 0 | Complete | 2025-09-26 | Implemented in `polygonNormalize.ts` |
| Polar heuristic (skip Antarctica split) | 0 | Complete | 2025-09-26 | Classification `polar` added |
| Tangent plane projection | 1 | In Progress | 2025-09-26 | `tangentPlane.ts` + integration flag `geoProj` |
| Polar Lambert projection | 1 | In Progress | 2025-09-26 | `polarLambert.ts` + auto selection for polar classification |
| Hole reassignment after split | 2 | In Progress | 2025-09-26 | Basic ray-cast assignment implemented |
| Hole dateline splitting | 2 | In Progress | 2025-09-26 | Implemented splitting & reassignment integration |
| Validation (duplicates/collinear) | 3 | In Progress | 2025-09-26 | Stub: removal + reporting integrated |
| Self-intersection detection | 3 | In Progress | 2025-09-26 | O(n^2) implementation + diagnostics |
| Edge metrics & ratio probe | 3 | In Progress | 2025-09-26 | Extended metrics: ratio, build time, counts |
| Modular pipeline stage refactor | 4 | In Progress | 2025-09-28 | normalizeStage wrapper added |
| Geometry cache (hash + LRU) | 5 | In Progress | 2025-09-26 | Key = featureId+hash+projection+extrude+version; stats exposed via flag |
| HUD overlay (`geoPolyHUD`) | 6 | Not Started | – | DOM overlay for live metrics |
| Playwright geom regression tests | 6 | Not Started | – | Russia, Antarctica, seams |
| Performance benchmark harness | 6 | In Progress | 2025-09-28 | Added script `geo:benchmark:pipeline` |
| Initial unit tests (geometry) | 3 | Planned | 2025-09-27 | Deferred until Jest/Vitest ESM alignment |
| Legacy path deprecation | 7 | Pending | – | After stable & acceptance met |

Legend: Complete | In Progress | Planned | Pending | Blocked


## Feature Flags
| Flag | Values | Description |
|------|--------|-------------|
| geoPolyNormalize | 0 / 1 | Enable normalization pipeline (default 1) |
| geoPolyDiag | (present) | Console logs classification, parts, span |
| geoProj | legacy / tangent / auto | Override projection strategy (future) |
| geoPolyHUD | 1 | Enable on-screen diagnostics overlay (future) |
| geoPolyDiagEdges | 1 | Enable edge length ratio logging |
| geoPolyDiagCache | 1 | Expose cache stats to window.__geoPolyCacheStats |
| geoPolyFallback | 1 | Enable edge-ratio triggered projection retry (legacy->tangent) |
| geoPolyHoleWallMinPerim | float | Override min hole perimeter (deg) to extrude walls |

## Normalization Details
### Dateline Splitting
A ring whose longitude span > 180° is segmented at antimeridian intersections. Intersection points are interpolated and duplicated as closure points for new parts. Each part is domain-normalized so its longitudes cluster near a median anchor to prevent large numeric ranges.

### Polar Classification
Heuristic:
- If span > 300° AND > 50% vertices have |lat| > 60° → classify `polar` (skip splitting).

### Current Limitations
- Holes are not yet split or reassigned after outer ring segmentation.
- Triangulation still uses lon/lat directly; tangent projection is scheduled next.
- Validation layer not yet enforcing no self-intersections.

## Projection Strategy (Planned)
| Strategy | When | Method |
|----------|------|--------|
| Tangent Plane | Default for large or split parts | Convert each vertex to 3D unit vector; derive local East/North basis at centroid; project via dot products to 2D. |
| Polar Lambert | Centroid |lat| > 60 | Use Lambert azimuthal equal-area or stereographic for stable polar geometry. |
| Legacy Equirectangular | Small span polygons | Direct (lon, lat) coordinates. |

## Validation Metrics (Targets)
| Metric | Definition | Target |
|--------|------------|--------|
| Max Edge Ratio | longestEdge / medianEdge | ≤ 12 (large features) |
| Degenerate Triangles | area < 1e-10 global area | 0 (removed) |
| Self-Intersections | Segment crossings count | 0 |
| Polar Visual Drift | Pixel diff vs baseline | < 2% |

## Diagnostics & QA
Planned instrumentation surfaces a per-feature object:
```
window.__geoPolyDiagEdges = {
  RUS: { parts: 5, maxEdgeRatio: 9.4, triangles: 18240 },
  USA: { parts: 6, maxEdgeRatio: 7.1, triangles: 20110 }
};
```
Visual tests (Playwright) will lock camera states for: Russia Far East, Bering Strait, Antarctica, Greenland seam.

## Caching Plan
Hash (FNV-1a) of flattened coordinates + pipeline version string → geometry build artifact. LRU capped by total vertex budget (e.g., 2M). Evictions logged when diagnostics flag is enabled.

## Rollout Strategy
1. Implement tangent plane projection guarded by `geoProj=tangent`.
2. Shadow mode: run new pipeline in parallel; compare edge metrics; fallback if regression.
3. Promote to `geoProj=auto` default after passing validation suite.
4. Remove legacy path after stable release & baseline approval.

### Projection Fallback (Edge Ratio)
When `?geoPolyFallback=1` is set, any part initially built with legacy projection that produces a cap edge length ratio > 12 is transparently rebuilt using tangent plane projection before caching. This mitigates rogue long triangles in marginal wide-span cases without forcing a global projection override.

## File / Module Layout (Future)
```
src/geopolitical/geometry/
  pipeline/
    index.ts
    stages/
      normalizeStage.ts
      projectionStage.ts
      holeAssignmentStage.ts
      validationStage.ts
      triangulationStage.ts
      extrusionStage.ts
      diagnosticsStage.ts
      cacheStage.ts
  projections/
    tangentPlane.ts
    polarLambert.ts
  validation/
    edgeMetrics.ts
    selfIntersection.ts
    cleanup.ts
  utils/
    latLon.ts
    hashing.ts
```

## Acceptance Checklist (Go/No-Go)
- [ ] Max edge ratio thresholds satisfied for top 10 largest polygons.
- [ ] No self-intersections post-validation.
- [ ] Antarctica baseline pixel diff < 2%.
- [ ] Cache hit rate ≥ 90% after initial warm.
- [ ] All geometry regression Playwright tests green.
- [ ] No unexpected console errors with `geoPolyDiag` enabled.

## Open Questions / Future Considerations
- Should we adopt a truly spherical triangulator to avoid planar projection entirely for extreme cases?
- Adaptive vertex densification near dateline seams for smoother walls?
- Off-thread (Worker) build of heavy features to keep main thread responsive?
- Metadata layering (ownership / claims) that may require dual geometry occupancy policies.

## Changelog
| Date | Change |
|------|--------|
| 2025-09-26 | Initial pipeline document created; captured current + planned architecture. |
| 2025-09-26 | Began Phase 1: tangent plane projection utility + integration (geoProj flag, edge diagnostics). |
| 2025-09-26 | Added polar Lambert projection path & auto selection logic. |
| 2025-09-26 | Implemented initial hole reassignment (ray casting) across split outer parts. |
| 2025-09-26 | Added validation stubs (duplicate & collinear pruning) with diagnostic reporting. |
| 2025-09-26 | Added hole dateline splitting & integration into reassignment. |
| 2025-09-26 | Implemented O(n^2) self-intersection detection with warnings. |
| 2025-09-26 | Added projected extrusion (tangent & lambert) parity for thick polygons. |
| 2025-09-26 | Expanded edge metrics (ratio, triangles, vertices, build time, warnings). |
| 2025-09-26 | Implemented geometry cache (LRU) + diagnostics stats flag `geoPolyDiagCache`. |
| 2025-09-26 | Added projected extrusion hole side-wall generation (inward normals). |
| 2025-09-27 | Added cache eviction logging under `geoPolyDiagCache` flag. |
| 2025-09-27 | Added hole side-wall suppression threshold (`geoPolyHoleWallMinPerim`). |

---
Maintainers: Update this document as stages land. Keep the Acceptance Checklist current, and prune flags once stabilized.
