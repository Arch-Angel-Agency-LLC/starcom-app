# Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Performance regressions on large graphs | Medium | High | Thresholds, progressive features, profiling |
| Persistence collisions across workspaces | Low | Medium | Use workspaceHash in keys; validate |
| User confusion between deep-links and views | Medium | Medium | Clear UX copy; keep deep-link independent |
| Incomplete parity vs IntelWeb | Medium | Medium | Parity matrix; acceptance criteria gating |
| Layout freeze side-effects | Low | Medium | Explicit toggle, visual affordance |
| Test gaps lead to regressions | Medium | Medium | Add unit/integration tests; QA checklist |
