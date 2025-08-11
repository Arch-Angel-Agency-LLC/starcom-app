# IntelWeb Migrations

This document records breaking / structural changes affecting persistence, routing, and saved state for the IntelWeb application.

## 2025-08-08 – Identity & Persistence Namespace Migration (v1)

Summary: Transition from legacy `nodeweb` identity and un-namespaced storage keys to the unified `intelweb` id with versioned, vault-hashed key namespace and Saved Views schema v2.

### Changes
- Application id renamed `nodeweb` → `intelweb` (routes, enums, UI labels).
- Legacy `/nodeweb` route deprecated (redirect / archived component moved under `archives/legacy-nodeweb/`).
- Added vault-hash–scoped storage keys: `intelweb:v1:{vaultHash}:*`.
- Saved Views moved from global `intelweb.savedViews` to per-vault `intelweb:v1:{vaultHash}:views`.
- Added global pointer `intelweb:v1:lastView` to reapply last selected view per vault.
- Introduced Saved Views schema v2 including: `layoutFrozen`, `isolate`, `sizingMode`, `version:2`.
- Added isolate mode state (rootId, depth) & sizingMode to persistence (views v2).

### Migration Logic
On load:
1. If `intelweb.savedViews` (legacy) exists and no namespaced views present for current vault, copy JSON to `intelweb:v1:{vaultHash}:views`.
2. Mark `intelweb:v1:{vaultHash}:migratedViews=1` to avoid repeat.
3. In-memory upgrade: legacy view objects (no `version` field) mapped to v2 with defaults:
   - `sizingMode: 'degree'`
   - `layoutFrozen`: current frozen state
   - `isolate`: current isolate state if active else null
4. Persist when new view saved.

### SavedViewV2 Structure
```
{
  id: string;
  name: string;
  createdAt: number;
  filters: GraphFilters;
  physics: PhysicsSettings;
  layoutFrozen: boolean;
  isolate?: { rootId: string; depth: number } | null;
  sizingMode: 'degree' | 'confidence';
  version: 2;
}
```

### Vault Hashing
Purpose: Prevent cross-vault contamination & prepare for multi-vault usage.
Method: Stable hash of sorted file paths (MurmurHash preferred; fallback simple hash). Used to derive key prefix.

### Developer Actions
- Use helper (pending refactor) for vault hash derivation instead of ad-hoc generation.
- When introducing v3 schema (future), add explicit migration marker (e.g., `intelweb:v2:migrated=1`).

### Verification Checklist
- Console shows migration log once per vault.
- Reload preserves last selected saved view.
- Creating new view writes version:2 objects.
- Isolate + sizing mode re-applied when applying a v2 view.

## 2025-08-09 – Temporal Filtering & Isolate Enhancements

Summary: Introduced non-destructive temporal filtering (node dimming + edge fading) and BFS isolate performance instrumentation.

### Changes
- Removed hard exclusion of nodes outside time range (filter layer); nodes now dimmed (opacity drop) instead of removed.
- Edge temporal fading applies low opacity (0.05) to out-of-range edges; in-range edges scaled by confidence.
- Added BFS timing log if isolate extraction >1ms.
- Added SVG data attributes exposing label LOD constants for future tuning: `data-max-labels-zoomed-out`, `data-zoom-threshold-hide`.

### Verification Checklist
- Selecting a time range dims nodes outside the interval (instead of removal) while edges fade appropriately.
- Isolate BFS logs performance when over threshold.
- Applying saved view with isolate restores subgraph and depth.

## Pending / Upcoming
- Large graph performance banner & debounce (Phase 5).
- Worker interface spec & eventual off-main-thread layout / metrics.
- Vault hash utility refactor (shared module) before next schema version.

