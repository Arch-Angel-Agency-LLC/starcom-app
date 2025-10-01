# Performance Metrics & Budgets

Targets (Desktop)
- 60 FPS steady in GeoPolitical mode
- Picking: < 3ms per move sample avg
- CPU time for highlight updates: < 1ms

Bench Harness
- Camera scripts for fixed orbits/zooms; record FPS and picking latency
- Perf HUD (dev only) to log frame time and sampling cost

Reporting
- Include charts for before/after Stage 1 and Stage 2
- Block rollout if regressions exceed 10% of targets
