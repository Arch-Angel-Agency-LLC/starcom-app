# Geographic Geometry Implementation Plan

## 1. Purpose
Provide a clear, reproducible path to complete land border & territory visualization on the 3D Globe (Primary & Secondary Modes), with integrity and future extensibility for maritime zones.

## 2. Scope
In-scope:
- Land border lines (multi-LOD, shared topology)
- Territory polygon fills
- LOD switching logic integration
- Integrity manifest linkage & validation badge
- Hover / (future) selection interactivity
- Performance safeguards
Out-of-scope (current phase):
- Maritime EEZ ingestion automation (deferred)
- Advanced spherical triangulation & antimeridian splitting
- Dispute perspective overlays

## 3. Mode Definitions
- Primary Mode: International borders (lines) with adaptive LOD + base styling.
- Secondary Mode: Primary + filled territories, hover highlight, legend, integrity badge.

## 4. Current State Summary
- Topology built: `public/geopolitical/topology/world-borders.topology.json`
- Normalized LOD artifacts present.
- Service + hook: `NationalTerritoriesService`, `useNationalTerritories3D` ready.
- Projection: Spherical for lines; polygons approximated then reprojected (acceptable MVP).
- Integrity manifest: `public/geopolitical/manifest/geopolitical-manifest.json` generated.
- Maritime phase deferred due to source fetch issues.

## 5. Phased Execution
### Phase A: Asset Verification
Checklist:
- [ ] Verify topology file loads (200 & JSON structure)
- [ ] Verify normalized LOD0–2 exist
- [ ] Verify territory polygon LOD0–2 exist or mark fills deferred
- [ ] Re-run manifest if new files added
Output: Asset inventory table.

### Phase B: Primary Mode Wiring
Steps:
1. Insert hook into globe component with default config.
2. Add UI toggle: Borders On/Off.
3. Validate LOD switching across zoom levels.
Exit Criteria: Borders render <1s; LOD swap smooth; no console errors.

### Phase C: Secondary Mode Wiring
Steps:
1. Enable territory fills (conditional on assets).
2. Add opacity slider + show/hide toggle.
3. Implement hover highlight (pointermove-driven).
4. Add legend (International / Disputed / Line of Control / Indefinite).
5. Add disputed toggle.
Exit Criteria: Interactivity stable; FPS impact <5% baseline.

### Phase D: Integrity & Provenance
Steps:
1. Fetch manifest; compute sha256 of topology client-side.
2. Compare -> badge (Verified / Mismatch).
3. Show artifact list (name, KB, short hash) in expandable panel.
Exit Criteria: Badge visible; mismatch tested (simulated).

### Phase E: Projection & Orientation Safeguards
Steps:
1. Dev-only diagnostic logging of key geocoordinates.
2. Config flag to disable X inversion if needed.
3. TODO markers for antimeridian + polar distortion.
Exit Criteria: Orientation confirmed or adjusted; TODOs documented.

### Phase F: Performance Hardening
Steps:
1. Measure line object count & FPS.
2. If >8k objects, batch merge by classification.
3. Throttle hover (only after pointermove event) + debounced raycast.
4. Memory leak check across 5 LOD swaps.
Exit Criteria: Stable FPS (>= target), no net memory growth.

### Phase G: Documentation & Release
Steps:
1. Update progress docs with completion statuses.
2. Record manifest hash (v1 tag) & limitations.
3. Add README section referencing this plan.
Exit Criteria: Release note & internal docs complete.

### Phase H: Maritime & Future (Deferred)
Placeholders:
- EEZ fetch automation (blocked — upstream access path changed)
- Add toggle placeholder: Maritime Zones (Coming Soon)
- Backlog: spherical triangulation upgrade, antimeridian splitting, selection analytics.

## 6. Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing territory polygons | Secondary Mode partial | Disable fills gracefully; note in badge panel |
| Orientation inversion mismatch | Mirrored map | Config switch invertX:false |
| Performance drop on hover | UX lag | Event-driven hover, batching |
| Asset tampering | Data trust | Manifest hash validation badge |
| Antimeridian polygon artifacts | Visual seams | Document + future splitting algorithm |

## 7. Metrics & Acceptance
| Metric | Target |
|--------|--------|
| Initial border render time | < 1000ms after globe ready |
| FPS (typical view) | >= 55 FPS desktop baseline |
| LOD switch latency | < 300ms perceived |
| Integrity check time | < 150ms after assets fetched |
| Memory delta after 5 LOD swaps | < 5% increase |

## 8. Implementation Notes
- Keep hook stateless regarding manifest; perform manifest validation once and cache result.
- Use SubtleCrypto for sha256 (fallback to JS hash if unsupported).
- Consider deferring territory fill build until first user toggle to save startup time.
- Future improvement: unify border + territory geometry instancing for GPU efficiency.

## 9. Backlog Tickets (Proposed)
- GEO-EEZ-AUTO: Implement robust EEZ WFS/GML paging ingestion.
- GEO-PROJ-ANT: Antimeridian polygon splitting utility.
- GEO-PROJ-POLAR: Polar region triangulation refinement.
- GEO-HOVER-OPT: Adaptive hover sampling rate.
- GEO-LEGEND-UI: Classification legend theming & dynamic counts.
- GEO-INTEGRITY-UI: Integrity panel enhancements (copy hashes, diff view).

## 10. Quick Start (Developer)
1. Run data scripts (already generated). If missing: `npm run geo:topology`.
2. Add hook to globe component: `const geo = useNationalTerritories3D({ enabled, scene, config });`
3. Implement borders toggle + optional fills toggle.
4. Add integrity badge component consuming manifest.

## 11. Done Definition
Feature is “Done” when: A user can toggle borders & territory fills on the 3D globe, see correct styling + hover highlight, integrity badge reports Verified, performance metrics meet targets, and documentation (this plan + progress doc + README section) is updated.

## 12. Appendix
- Manifest File: `public/geopolitical/manifest/geopolitical-manifest.json`
- Service: `src/geopolitical/services/NationalTerritoriesService.ts`
- Hook: `src/geopolitical/hooks/useNationalTerritories3D.ts`
- Geometry Utils: `src/geopolitical/geometry/geometryFactory.ts`, `src/geopolitical/utils/latLonToVector3.ts`

(End)

## 13. Progress Update (2025-09-01)
Phase A: Asset verification complete (topology + LOD0-2 borders & territories confirmed). Manifest present.
Phase B: Hook wired into `Globe.tsx`; borders render path active (pending runtime visual confirmation after broader build fixes). Toggle UI still pending.
Phase C (partial): Legend scaffold added in Globe overlay. Integrity badge placeholder inserted (status "pending"). Disputed toggle & hover highlight not yet implemented.
Next Immediate Tasks: (1) Implement manifest hash verification service + set badge state; (2) Add borders/fills toggles leveraging `useGeoPoliticalSettings` updates; (3) Hover highlight activation (raycast throttling); (4) Disputed visibility toggle.
Notes: Import path corrections applied for GeoPoliticalConfig type to fix earlier TypeScript resolution errors.
