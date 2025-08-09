# 🌍 GeoPolitical Visualization Expansion Plan

**Project:** Starcom App  
**Date:** August 9, 2025  
**Author:** AI Planning Module  
**Status:** Approved for Implementation (Progress: Infra-0 partial complete)  
**Scope:** Elevate GeoPolitical primary mode from single prototype layer to multi-layer strategic analysis system with scalable infrastructure.

---
## 1. Objectives
- Provide actionable geopolitical context (sovereignty, events, resources) inside the 3D globe.
- Reuse performance-optimized patterns from CyberCommand domain.
- Establish reusable infrastructure (layers, geometry, datasets, time context) before feature sprawl.
- Guarantee low overhead: <= 8ms CPU prep, minimal draw call inflation.

---
## 2. Current Baseline (Audit)
| Area | Status | Notes |
|------|--------|-------|
| Mode Switching | ✅ | Submodes: NationalTerritories, DiplomaticEvents, ResourceZones enumerated |
| Settings Hook | ✅ | `useGeoPoliticalSettings` complete with persistence |
| NationalTerritories Visual | ⚠️ | Prototype borders only; sample geojson; no settings link |
| DiplomaticEvents Visual | ❌ | Only config shell |
| ResourceZones Visual | ❌ | Only config shell |
| Borders Dataset | ⚠️ | Sample `/borders.geojson` (1 feature) |
| Territories Dataset | ⚠️ | Sample placeholder |
| GlobeEngine Overlays | 💤 | Fetches borders/territories but unused for rendering |
| Disposal / Registry | ✅ | Projection, disposal utils, LayerRegistry implemented (commit 993aee8) |
| Projection Utility | ✅ | `latLonToVector3` added |
| Geometry Utilities | 🚧 | GeometryFactory pending |
| Dataset Versioning | ❌ | No manifest/checksum |
| Label System | ❌ | Not implemented |
| Tests | ❌ | No geopolitics-specific tests |

Legend: ✅ Complete, ⚠️ Partial / Weak, ❌ Missing, 💤 Legacy / Unintegrated, 🚧 Needs Extraction

---
## 3. Guiding Principles
1. Single Source for geometry build & disposal (GeometryFactory).
2. Layer registration lifecycle must be deterministic & leak-free.
3. Dataset integrity (manifest + checksum) before rendering.
4. Incremental activation: each submode stands independently.
5. Settings apply without geometry rebuild when possible.
6. Visual clarity > simultaneous layer overload (adaptive opacity, focus-driven emphasis).

---
## 4. Foundational Infrastructure (Phase Infra-0)
| Component | Purpose | Deliverable | Status |
|-----------|---------|-------------|--------|
| ProjectionUtil | lat/lon → Vector3 | `latLonToVector3.ts` | ✅ |
| GreatCircleUtil | Arc segmentation + cache | `greatCircle.ts` | Pending |
| PolygonSimplifier | DP simplification + LOD tolerance | `polygonSimplifier.ts` | Pending |
| GeometryFactory | Create merged line & polygon meshes | `geometryFactory.ts` | Pending |
| LayerRegistry | Register/enable/order/cleanup groups | `LayerRegistry.ts` | ✅ |
| MaterialTheme | Resolve border/fill materials from settings | `materialTheme.ts` | Pending |
| DatasetManifest | Validate dataset metadata & checksum | `/public/geopolitical/manifest.json` | Pending |
| LabelManager (skeleton) | Future label overlay | `LabelManager.ts` | Pending |
| DisposalHelper | Dispose group children uniformly | `disposal.ts` | ✅ |

Execution Order (updated): GeometryFactory → MaterialTheme → NationalTerritories hook refactor → Dataset manifest.

---
## 5. Submode Expansion Roadmap
### 5.1 NationalTerritories (Stabilize)
- Replace sample borders with Natural Earth Admin 0 (50m simplified).
- Add polygon territory fills (optional toggle via settings).
- Apply settings: borderVisibility → opacity, borderThickness → line width (shader upgrade if LineBasic insufficient), color scheme mapping.
- Hover highlight (material color modulation).
- LOD simplification switching based on camera distance.

### 5.2 DiplomaticEvents
- Data Schema: `{ id, type, isoActors:string[], lat,lng, timestamp, importance }`.
- Temporal filtering (timeRange days) + importance filter.
- Marker instancing (THREE.InstancedMesh or merged billboards).
- Optional connection arcs between primary actors (throttle count; merge geometry).
- Animate events (pulse scale) if enabled.

### 5.3 ResourceZones
- Datasets: resource polygons (oil/gas/minerals/water/renewable), trade route endpoints.
- Zone opacity mapping from settings.
- Conflict highlight (blinking outline if conflictZones.highlightDisputed).
- Trade route intensity scaling (color or width attribute).

### 5.4 Optional Fast-Follow: Alliances & Blocs
- Static membership JSON; stacked outline solution (initial multi-line; later shader).
- Color-coded membership legend (defer UI until base 3 done).

---
## 6. Data & Versioning
`/public/geopolitical/manifest.json` example:
```json
{
  "datasets": [
    { "id": "world-borders", "version": "2025.08.01", "file": "world-borders.geojson", "sha256": "<checksum>", "license": "Public Domain (Natural Earth)", "updated": "2025-08-01" },
    { "id": "territories", "version": "2025.08.01", "file": "world-territories.geojson", "sha256": "<checksum>", "license": "Derived", "updated": "2025-08-01" }
  ]
}
```
Validation: fetch manifest → fetch dataset → compute hash (optional async) → warn + fallback if mismatch.

---
## 7. Layer Lifecycle States
1. Registered (metadata only)
2. Loaded (raw data cached)
3. Built (geometry created)
4. Active (group in scene)
5. Suspended (removed, geometry retained)
6. Disposed (geometry + materials freed)

Registry API (planned):
```ts
registerLayer(id, { order, build:()=>THREE.Group, dispose:(g)=>void });
activate(id); // attaches group
suspend(id);  // detaches, keeps geometry
dispose(id);  // full cleanup
updateOrder(id,newOrder);
```

---
## 8. Performance Design
- Merge line segments by country -> single BufferGeometry per country.
- Use attribute-based color variants where possible (Instanced / per-vertex color).
- Avoid per-frame dynamic allocations; reuse arrays.
- Settings changes: mutate material uniforms/props only.
- Provide `performanceMode` (low/medium/high) to cap: polygon detail, arc subdivisions, max connection lines.

Budget Targets:
| Metric | Target |
|--------|--------|
| Added Draw Calls (NationalTerritories) | < 40 |
| DiplomaticEvents Markers | 1 instanced mesh |
| ResourceZones Polygons | < 30 meshes (merged by type/region) |
| GC pressure | Negligible (no large transient arrays per frame) |

---
## 9. Testing Strategy
| Test Type | Scope |
|-----------|-------|
| Unit | projection, great-circle, simplifier tolerances |
| Unit | LayerRegistry lifecycle transitions |
| Integration | Submode switch adds/removes expected registry entries |
| Integration | Settings change updates material properties without rebuild |
| Snapshot | Material config derived from sample settings |
| Perf Smoke | Measure draw calls after enabling each submode |

---
## 10. Risk Matrix
| Risk | Impact | Mitigation |
|------|--------|------------|
| Dataset size slow parse | Medium | Pre-simplify offline; gzip; async load gating UI |
| Line width limitations (WebGL) | Medium | Custom shader or use fat lines (three/examples) later |
| Overlapping layers clutter | High | Adaptive opacity + focus mode |
| Memory leaks from orphan groups | High | Registry enforces dispose() on removal |
| Settings rebuild thrash | Medium | In-place material updates |
| Hash validation cost | Low | Defer full checksum to idle callback |

---
## 11. Implementation Timeline (Working Days)
Day 1: Projection + Disposal + LayerRegistry skeleton, refactor NationalTerritories registration  
Day 2: Natural Earth integration + GeometryFactory lines + settings hookup  
Day 3: Territory fills, LOD simplification, performance tuning  
Day 4: DiplomaticEvents service + instanced markers + temporal filter  
Day 5: DiplomaticEvents connection arcs + polishing + tests  
Day 6: ResourceZones dataset integration + zone polygons + opacity controls  
Day 7: Trade routes arcs + conflict highlight + tests  
Day 8: Optimization pass + alliance optional stub + manifest hash validation  
Day 9: Documentation, final QA, perf baselines

---
## 12. Deliverables Checklist
- [x] ProjectionUtil
- [x] DisposalHelper
- [x] LayerRegistry
- [ ] GeometryFactory (lines, polygons basic)
- [ ] MaterialTheme (borders/fills)
- [ ] NationalTerritories Hook + Service refactor
- [ ] Natural Earth borders dataset added
- [ ] Settings integration (opacity/thickness)
- [ ] Territory fills + LOD
- [ ] DiplomaticEvents Hook + Service
- [ ] Instanced markers + temporal filter
- [ ] ResourceZones Hook + Service
- [ ] Trade route arcs
- [ ] Manifest + checksum validation
- [ ] Tests (registry, projection, simplifier, hook integration)
- [ ] Docs update & performance report

---
## 13. Acceptance Criteria (MVP)
- Switching between the 3 GeoPolitical submodes updates globe visuals within 200ms.
- NationalTerritories reflects border thickness/opacity settings instantly.
- DiplomaticEvents markers filtered by timeRange with animated emphasis (if enabled).
- ResourceZones show at least two resource categories with opacity scaling.
- No memory growth after 5 rapid submode cycles.
- Draw call budget compliance verified via debug log.

---
## 14. Post-MVP Opportunities
- Alliance & Bloc overlays (stacked outlines shader)
- Migration/flow particle animation system
- Risk index composite halo layer
- LabelManager full implementation (quadtree + sprite atlas)
- Worker offload for polygon simplification

---
## 15. Go / No-Go
All prerequisites satisfied for Infra-0 start. Proceed with utility extraction and NationalTerritories refactor.

---
## 16. Progress Notes
Infra-0 partial: Projection + disposal + registry landed (commit 993aee8). Proceeding with GeometryFactory implementation next.

---
*End of Plan*
