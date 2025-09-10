# Feature Parity Matrix (IntelWeb → Analyzer)

| Area | IntelWeb | Analyzer (now) | Target (post-consolidation) |
|---|---|---|---|
| Saved Views | v2, namespaced, last pointer | none | v2-equivalent on workspaceHash |
| Layout | save/reset, vault-hash namespace | none | save/reset via fx/fy; workspaceHash |
| Isolate | BFS radius + events | none | BFS radius + clear; context-based |
| Physics | presets + tuning + freeze | minimal default | freeze + small subset if feasible |
| Sizing/LOD | degree-based sizing + label LOD | fixed | degree sizing + simple LOD |
| Temporal | dim outside time window | hard filter | keep hard filter; optional dim later |
| Classification/confidence | visuals + filters | confidence filter only | visuals when data available |
| Event bridge | window events | contexts | contexts only |
