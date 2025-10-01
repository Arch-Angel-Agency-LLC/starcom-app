# Progress Tracker

Status Legend
- [ ] TODO — not started
- [~] In Progress — work underway
- [x] Done — implemented and verified
- [!] Blocked — external dependency or open issue

Update Rules
- Mark the parent step when all child tasks are complete.
- Add links to PRs, screenshots, and perf reports inline.
- Note owners in parentheses and add [!] with a 1–2 line reason if blocked.

Phase 1 — Stabilize Current Mesh Pipeline (Low Risk)
[x] Step 1: Rendering Safety (Epsilon, Depth Bias)
- [x] Task 1.1: Apply elevation epsilon to fills (default +0.3 at R=100)
	- [x] Subtask 1.1.a: Make epsilon configurable via flag (geo.fillElevationEpsilon) — Expose runtime slider for QA tuning
	- [x] Subtask 1.1.b: Verify no z-fighting or see-through at limb — Compare before/after screenshots
		- docs/assets/geopolitical/baseline/globe-limbNoBias-2025-09-10T10-33-36-353Z.png
		- docs/assets/geopolitical/baseline/globe-limbWithBias-2025-09-10T10-33-38-608Z.png
- [x] Task 1.2: Enable polygonOffset on fill materials
	- [x] Subtask 1.2.a: Set defaults (factor/units -1.5/-1.5) and document tuning ranges
	- [x] Subtask 1.2.b: Ensure depthTest=true, depthWrite=false, side=FrontSide — Confirm in code and docs
  
Note: Implemented in `geometryFactory.buildTerritoryPolygons` (FrontSide, epsilon=0.3, polygonOffset -1.5/-1.5).

[x] Step 2: Picking v1 (Fast Ship)
- [x] Task 2.1: Integrate three-mesh-bvh for territories
	- [x] Subtask 2.1.a: Build BVH per LOD and cache — Rebuild only on data/LOD change
	- [x] Subtask 2.1.b: Add teardown/disposal on layer toggle — Prevent memory leaks
- [x] Task 2.2: Border hover via spatial index
	- [x] Subtask 2.2.a: Build R-tree for border segments (lon/lat) — Store IDs for highlight mapping
	- [x] Subtask 2.2.b: Map ray→sphere hit to lon/lat and query — Debounce to ~60–90Hz

[~] Step 3: Interaction States
- [x] Task 3.1: Hover visuals
	- [x] Subtask 3.1.a: Fill brighten 10–20% + border glow — Tokens from designer
	- [x] Subtask 3.1.b: 120–200ms ease in/out — Debounced hover (75ms) to avoid flicker
- [x] Task 3.2: Selection visuals
	- [x] Subtask 3.2.a: Stronger fill + outline — Lock state on selection (baseline fill brighten implemented)
	- [x] Subtask 3.2.b: Dim neighbors ~30%; optional label pin — Dim applied; label pin deferred


[ ] Step 4: Alignment & QA Gate
	- [x] Subtask 4.1.a: Dev markers at (0°,0°), (0°,±90°), (±45°,0/90/180) — Implemented behind ?geoDebugOverlay=markers; screenshots captured via geoSnap
	- [x] Subtask 4.1.b: Capture baseline screenshots for regression review — See docs assets:
		- docs/assets/geopolitical/baseline/globe-seam0-2025-09-10T09-51-45-523Z.png
		- docs/assets/geopolitical/baseline/globe-seam0-2025-09-10T09-51-45-726Z.png
		- docs/assets/geopolitical/baseline/globe-eq90E-2025-09-10T09-51-48-257Z.png
		- docs/assets/geopolitical/baseline/globe-eq90E-2025-09-10T09-51-48-260Z.png
	- [x] Subtask 4.2.a: Antimeridian, poles, small islands — Visual integrity
		- Antimeridian: docs/assets/geopolitical/baseline/globe-anti180-2025-09-10T10-36-38-038Z.png
		- ±45° (Prime Meridian/Equator):
			- docs/assets/geopolitical/baseline/globe-pm45N-2025-09-10T10-36-39-990Z.png
			- docs/assets/geopolitical/baseline/globe-pm45S-2025-09-10T10-36-41-444Z.png
			- docs/assets/geopolitical/baseline/globe-lat45E-2025-09-10T10-36-42-985Z.png
			- docs/assets/geopolitical/baseline/globe-lat45W-2025-09-10T10-36-44-449Z.png
		- Poles:
			- docs/assets/geopolitical/baseline/globe-northPole-2025-09-10T10-36-45-913Z.png
			- docs/assets/geopolitical/baseline/globe-southPole-2025-09-10T10-36-47-385Z.png
		- Small islands:
			- docs/assets/geopolitical/baseline/globe-maldives-2025-09-10T10-36-48-969Z.png
			- docs/assets/geopolitical/baseline/globe-aegean-2025-09-10T10-36-50-541Z.png
			- docs/assets/geopolitical/baseline/globe-caribbean-2025-09-10T10-36-52-121Z.png
			- docs/assets/geopolitical/baseline/globe-pacificMicro-2025-09-10T10-36-53-680Z.png
	- [ ] Subtask 4.2.b: Disputed overlays style/order — Correct draw priority
		- Verified via automated Playwright test `tests/visual/geopolitical/overlay-order.spec.mjs`.
		- See QA notes: `docs/globe/geopoliticalGeometry/qa-overlay-order.md`.
		- [x] 4.2.b Disputed/maritime overlays draw above fills in correct order (QA + tests)

[x] Task 4.1: Seam/prime‑meridian verification overlay
	- Maritime borders layer: initial integration complete (separate registry layer, toggle via settings, participates in LOD rebuilds). Further QA and visual tuning pending.
	- Reduced‑motion toggle implemented; interactions respect it with snap transitions.

Phase 2 — Prototype Texture/SDF Path (Flagged)
[~] Step 5: GPU/ID Picking
 - [x] Task 5.1: ID map or GPU ID pass prototype (geo.idPicking)
 	- [x] Subtask 5.1.a: Offscreen target with unique nation IDs — Stable across frames (dev-only probe implemented)
 	- [x] Subtask 5.1.b: Sample pixel at ray–sphere center → ID via __geoIdPickProbe (basic test added)
 - [~] Task 5.2: Cursor-based ID sampling
 	- [x] Subtask 5.2.a: Wire pointermove to sample ID under cursor when ?geoIdPicking is set — normalized to canvas size
 	- [~] Subtask 5.2.b: Expose __geoIdPickProbe.sampleAtCursor/getLast for tests — add Playwright check (pending)
 	- [ ] Subtask 5.2.c: Map pick IDs to territory metadata and surface hover/selection events

[ ] Step 6: Tiled Overlay Compositor
- [ ] Task 6.1: Territory fill mask tiling and sampling (geo.textureOverlayPrototype)
	- [ ] Subtask 6.1.a: UV tiling with MIPs + anisotropy — Crisp results at oblique angles
	- [ ] Subtask 6.1.b: Blend in globe material — Single draw path preserved
- [ ] Task 6.2: SDF borders
	- [ ] Subtask 6.2.a: Generate SDF tiles from vector borders — Multi‑stroke styles supported
	- [ ] Subtask 6.2.b: Shader sampling with screen‑space width — Consistent thickness

[ ] Step 7: Dev/QA Tools
- [~] Task 7.1: ID debug overlay
	- [x] Subtask 7.1.a: Toggle view of nation ID under cursor — Dev panel (enable with ?geoIdPickingHud=1)
	- [ ] Subtask 7.1.b: Snapshot/tests for correctness — Deterministic camera shots
- [ ] Task 7.2: Perf benchmarks/report
	- [ ] Subtask 7.2.a: Scripted camera orbits and logs — FPS and picking latency
	- [ ] Subtask 7.2.b: Before/after charts — 10% regression gate

Phase 3 — Hardening & A11y
[ ] Step 8: Mesh Path Quality
- [ ] Task 8.1: Adaptive densification by angular edge length — Improve spherical conformity
- [ ] Task 8.2: Vertex‑shader spherical projection option — Compute on GPU, add tiny normal offset

[ ] Step 9: Streaming & Memory
- [ ] Task 9.1: Tile streaming and compression — Lower memory/bandwidth
- [ ] Task 9.2: Disposal audits and leak checks — CI check for retained objects

[ ] Step 10: Accessibility & Fit‑and‑Finish
- [ ] Task 10.1: Reduced‑motion toggle for transitions — Respect user preference
- [ ] Task 10.2: Visual polish passes and designer sign‑off — Screenshots + approval
