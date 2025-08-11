# IntelWeb Consolidation & Enablement Plan

Date: 2025-08-08  
Owner: IntelWeb Evolution Initiative  
Status: In Progress (Phase 5 – Perf validation & docs)

## 1. Mission
Unify all graph / relationship visualization efforts under a single, coherent IntelWeb application with:
- Single routing identity (no legacy collisions)
- Clean OSINT-aligned data model (no classification remnants unless explicitly required elsewhere)
- Deterministic graph pipeline (source → integration → VFS → graph)
- Integrated UI (no duplicated panels, no placeholder affordances)
- Extensibility for advanced analytics (isolate mode, degree sizing, temporal/spatial overlays)

## 2. Current Snapshot (Key Findings)
| Area | Issue | Impact |
|------|-------|--------|
| Routing | App id 'nodeweb'; legacy NodeWebApplication still routable | User confusion / duplicate surfaces |
| Data Pipeline | IntegrationService builds graph but IntelGraph recomputes | Divergence risk / wasted cycles |
| Classification | Removed in graph UI, still present in demo content, sidebars & CSS | Conceptual inconsistency |
| UI Panels | Node/edge detail floating overlays vs right sidebar tabs | Fragmented UX |
| 3D Toggle | Shown but non-functional | Perceived broken feature |
| Timeline | Uses modifiedAt not semantic timestamp; edges not time-filtered | Inaccurate filtering semantics |
| Storage | Global localStorage keys; no versioning | Cross-vault contamination |
| Legacy Modules | EnhancedNodeWebAdapter + legacy docs | Cognitive overhead |
| Feature Gaps | Isolate mode, degree sizing, label LOD | Parity gap w/ roadmap |

## 3. Guiding Principles
1. **Single Source of Truth**: IntegrationService becomes canonical for VFS + base GraphData.  
2. **Progressive Enhancement**: Hide advanced affordances until implemented (e.g., 3D).  
3. **Deterministic IDs**: Stable node/edge ids across sessions enable persistence.  
4. **Stateless Transformations**: Graph derivation is pure; side effects (persistence, filtering) layered.  
5. **Namespaced Persistence**: Per-vault, versioned storage keys.  
6. **Clean Surface**: Remove vestigial classification unless retained for backward compatibility behind adapter.

## 4. Architecture Decisions (ADRs Inline)
| Decision | Rationale | Status |
|----------|-----------|--------|
| Rename application id to `intelweb` | Eliminate legacy naming ambiguity | Approved |
| Deprecate legacy NodeWebApplication (archive) | Reduce confusion | Approved |
| Hide 3D toggle until engine alpha exists | Avoid false affordance | Approved |
| Merge graph build paths (IntegrationService → IntelGraph) | Prevent drift | Approved |
| Introduce GraphContext provider | Centralize state & derived metrics | Approved |
| Use semantic timestamp precedence (frontmatter.timestamp > modifiedAt) | Temporal accuracy | Approved |
| Namespace storage: `intelweb:v1:{vaultHash}:{key}` | Avoid collisions / support migrations | Approved |
| Move detail panels into sidebar | UX consistency | Approved |
| Remove classification from demo + CSS (mark optional adapter) | OSINT alignment | Approved |

## 5. Phased Execution Plan
### Phase 0 – Identity & Safety (Day 1)
1. Rename id `nodeweb` → `intelweb` (router enum, MainBottomBar, docs).  
2. Remove /nodeweb legacy route; archive `NodeWebApplication.tsx` under `archives/legacy-nodeweb/`.  
3. Add migration shim: If localStorage has `intelweb.savedViews`, copy to `intelweb:v1:{defaultHash}:views` once.  
4. Hide/disable 3D toggle (replace with tooltip: "3D engine forthcoming").

### Phase 1 – Data & Model Cleanup (Day 1–2)
1. Strip classification fields from demo vault generation + left sidebar badges.  
2. Remove classification styles from `IntelWeb.css` (or guard behind `.intelweb-legacy-classification` opt-in class).  
3. Add semantic timestamp extraction: use `frontmatter.timestamp || modifiedAt`.  
4. Extend IntegrationService to output `graphData` with stable deterministic node IDs: `reports/{slug}`, `entities/{slug}`, etc.  
5. IntelGraph: accept optional `initialGraph` prop; bypass conversion when provided.

### Phase 2 – Persistence & Context (Day 2–3)
1. Implement `GraphContext` (providers for: rawGraph, filteredGraph, filters, physics, selection, metrics).  
2. Migrate localStorage keys: node positions, saved views, UI state to versioned namespace.  
3. Add version constant; migration routine logs executed actions.  
4. Persist selected view id & last filter set.

### Phase 3 – UI Consolidation (Day 3–4)
1. Move node & edge detail panels into right sidebar tabs: Tabs: Overview (Stats), Node, Edge, File, Metadata.  
2. Remove floating overlay components.  
3. Enhance stats panel: counts, degree distribution min/avg/max, top 5 nodes by degree.  
4. Add empty state upgrade messaging (bullet list of features & CTA to load demo).  
5. Add subtle header badge: "Data last built: <relative time>".

### Phase 4 – Core Enhancements (Parity Upgrades) (Day 4–5)
1. Degree-based node sizing (compute once on graph load; store in node.visual.degree).  
2. Label LOD: show labels only for (a) selected, (b) hovered, (c) top N degree when zoomed out.  
3. Isolate mode: depth slider (1–4); filtered subgraph computed incrementally; exit button.  
4. Time filter enhancement: apply to edges using provenance timestamp; fade out edges outside range.  
5. Save Views: include graphMode (for future), filters, physics, isolate state.

### Phase 5 – Performance Prep (Day 5–6)
1. Instrument metrics (render time, node count threshold).  
2. Add warning banner if node count > threshold (e.g., 1500) suggesting isolate or tighter filters.  
3. Debounce filter changes for large graphs.  
4. Prepare worker interface (spec only; no implementation yet).

### Phase 6 – Documentation & Cleanup (Day 6)
1. Update README + Surpass-Obsidian docs to reflect actual feature state.  
2. Add MIGRATIONS.md (nodeweb → intelweb).  
3. Remove obsolete classification references in docs (mark separate legacy doc).  
4. Archive EnhancedNodeWebAdapter docs or link as historical context.

## 6. Detailed Task Matrix
| Task ID | Phase | Title | Depends | Est | Acceptance Criteria |
|---------|-------|-------|---------|-----|---------------------|
| T0.1 | 0 | Rename app id | — | S | Clicking IntelWeb shows IntelGraph; no 'nodeweb' left in code except archive |
| T0.2 | 0 | Remove legacy route | T0.1 | S | /nodeweb direct navigation redirects /intelweb |
| T0.3 | 0 | Migration shim (saved views) | T0.1 | S | Console log: migratedViews=N |
| T0.4 | 0 | Hide 3D toggle | T0.1 | S | 3D toggle not visible in UI |
| T1.1 | 1 | Demo vault classification purge | T0.* | S | Demo frontmatter has no classification key |
| T1.2 | 1 | Strip classification UI | T1.1 | S | No `.classification` elements rendered |
| T1.3 | 1 | Semantic timestamp precedence | T1.1 | S | Timeline range matches frontmatter timestamp test case |
| T1.4 | 1 | IntegrationService deterministic IDs | T1.1 | M | Repeated build yields identical node ids |
| T1.5 | 1 | IntelGraph accept injected graphData | T1.4 | M | Provided graph bypasses internal conversion (log) |
| T2.1 | 2 | GraphContext provider | T1.5 | M | Components consume context; prop drilling reduced |
| T2.2 | 2 | Namespaced storage keys | T2.1 | S | Keys follow pattern `intelweb:v1:{hash}:` |
| T2.3 | 2 | Persist last selected view | T2.2 | S | Reload applies view automatically |
| T3.1 | 3 | Sidebar panel consolidation | T2.* | M | Node/Edge tabs show selection; overlays removed |
| T3.2 | 3 | Enhanced stats (degree metrics) | T3.1 | S | Stats panel lists top-degree nodes |
| T3.3 | 3 | Empty state enhancement | T0.* | S | Empty screen lists features + demo CTA |
| T4.1 | 4 | Degree-based sizing | T3.2 | S | Node radii proportional to degree bucket |
| T4.2 | 4 | Label LOD | T4.1 | M | Labels adapt on zoom; perf stable |
| T4.3 | 4 | Isolate mode + depth | T4.1 | M | Depth slider filters; exit restores full graph |
| T4.4 | 4 | Edge temporal filtering | T1.3 | M | Edges fade when outside selected time window |
| T4.5 | 4 | Saved Views extended schema | T4.1 | S | New views capture isolate + sizing mode |
| T5.1 | 5 | Metrics instrumentation | T4.* | S | Console + perf object logs metrics |
| T5.2 | 5 | Large graph warning banner | T5.1 | S | >1500 nodes triggers banner |
| T5.3 | 5 | Debounced filter updates | T5.1 | S | 200ms debounce observed |
| T6.1 | 6 | Update docs & MIGRATIONS | All | S | Docs reflect new id & feature set |
| T6.2 | 6 | Archive legacy artifacts | All | S | Legacy moved under `archives/` |

## 7. Implementation Notes
- **Vault Hashing**: Use stable join of sorted file paths + murmurhash (fallback simple hash) to namespace storage.
- **Degree Computation**: Single pass adjacency list build; store degree on node; define size scaling: `size = base + log2(degree+1)*k` with clamp (8–34); alternate sizingMode 'confidence' available.
- **Sizing Modes**: `degree` (default) or `confidence`; switch stored in context and persisted in Saved Views v2.
- **Isolate Mode**: BFS up to depth D from seed set (selected node or search result). Maintain `fullGraph` vs `activeGraph` in context. Global events: `intelweb:requestIsolate`, `intelweb:clearIsolate`, `intelweb:isolateStateChanged`. BFS perf logged when >1ms.
- **Label LOD**: Constants `MAX_LABELS_ZOOMED_OUT=30`, `ZOOM_THRESHOLD_HIDE=0.5` (exposed on SVG data attrs). Zoom handler perf logged if >1ms.
- **Temporal Edge Filter**: Edge opacity adjusted using metadata timestamp if within selected time range else faded; outside-range edges faded to low opacity.
- **Saved Views Schema v2**: `{ id, name, createdAt, filters, physics, layoutFrozen, isolate?: {rootId, depth}, sizingMode: 'degree'|'confidence', version: 2 }` (implemented with in-memory migration of legacy views; lastView pointer global).

## 8. Storage Key Scheme
```
intelweb:v1:{vaultHash}:views
intelweb:v1:{vaultHash}:positions
intelweb:v1:{vaultHash}:ui:panelOpen
intelweb:v1:{vaultHash}:ui:activeTab
intelweb:v1:lastView // global pointer
```
Migration: On load, scan for old keys; migrate then mark `intelweb:v1:migrated=1`.

## 9. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Breaking existing bookmarks (/nodeweb) | Add redirect route for one release cycle |
| User confusion over lost saved views | Migration + console/info banner |
| Performance regression with degree sizing | Cache degrees; recompute only on raw graph change |
| Inconsistent timestamps | Uniform extraction + fallback logging |
| Future 3D integration requiring different layout persistence | Abstract persistence to include dimension context later |

## 10. Testing Strategy
- **Smoke Tests**: Mount IntelWeb; verify header, gear, stats, graph nodes > 0 after demo load.
- **Unit**: Degree computation, isolate BFS correctness (expected node counts).  
- **Integration**: Saved View round-trip (create → reload → auto-apply).  
- **Temporal**: Edge filtering hides known out-of-range edges (fixture).  
- **Migration**: Pre-seed old keys; ensure new keys populated & old removed/flagged.

## 11. Acceptance Checklist (Go/No-Go)
- [x] No references to `nodeweb` outside archives / historical docs.  
- [x] 3D toggle hidden or clearly disabled.  
- [x] Demo vault loads with zero classification fields.  
- [x] Graph persists positions & saved views under versioned namespaced keys.  
- [x] Node/Edge details accessible via right sidebar tabs.  
- [x] Last selected saved view auto-applies per vault.  
- [x] Deterministic IDs path + injected graph bypass available.  
- [x] Degree metrics surfaced (min/avg/max, top nodes).  
- [x] Degree-based sizing & label LOD operational without performance warnings < 1k nodes.  
- [x] Isolate mode functions (enter, depth adjust, exit) with BFS timing instrumentation.  
- [x] Timeline affects edges (fading) & nodes (dimming).  
- [x] Docs updated & migration guide present.  
- [x] All tests (new + existing) green.

## 12. Execution Order (Condensed)
Phase 0 → Phase 1 → Phase 2 (context + persistence) → Phase 3 (UI consolidation) → Phase 4 (enhancements) → Phase 5 (perf instrumentation) → Phase 6 (docs & archive).

## 13. Rollback Plan
- Keep legacy NodeWeb archived for one release; feature flag `INTELWEB_NEW=on`.  
- If critical regression occurs, reinstate id `nodeweb` mapping temporarily (avoid if possible).

## 14. Open Questions
| Q | Resolution Needed By |
|---|----------------------|
| Keep classification optionally? | Before Phase 1 (decide adapter vs full removal) |
| Minimum 3D prototype scope? | Before enabling toggle post-plan |
| Edge directionality requirements? | Before temporal arrow work (later phase) |

## 15. Next Immediate Actions
1. Create `MIGRATIONS.md` + update README / docs; mark docs acceptance.
2. Implement unit/integration tests (degree calc, isolate BFS, label LOD gating, temporal fading, Saved Views migration) and mark tests acceptance.
3. Large graph UX: warning banner (>1500 nodes) + 200ms debounce for filter updates (instrument timings) then update risks section.
4. Worker interface spec draft (message schema for: degreeMetrics, bfsIsolate, layoutCompute, temporalFilter).
5. Vault hashing utility refactor into shared helper; update all call sites.
6. Archive remaining legacy docs and produce historical index page.

## 16. Legacy Artifacts Audit (To Archive or Refactor)
- NodeWebApplication (full MUI implementation) – archive under `archives/legacy-nodeweb/`
- EnhancedNodeWebAdapter tests referencing NodeWeb semantics – review and decide if replaced by IntegrationService tests
- IntelWebDevelopmentPlan.ts (legacy, classification-heavy) – marked deprecated
- README-Phase2.md classification references – update or move to legacy docs
- Classification CSS selectors – now inert; remove after one more iteration
- Any tests asserting classification badges – update or delete

## 17. Pending Refactors
- Replace inline vault hashing with shared utility (planned)
- Unify edge building using IntegrationService once deterministic IDs added
- Isolate BFS + auto-root selection refinement (in progress)
