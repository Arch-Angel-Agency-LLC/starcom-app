# 11 - Risk & Mitigation

| Risk | Impact | Likelihood | Mitigation | Phase |
|------|--------|-----------|------------|-------|
| Unit inconsistency persists | Misleading visual thresholds | Medium | Explicit unit fields & tests | 0 |
| Over-engineering before multi-source | Delayed delivery | Medium | Incremental phases; adapters early | 1 |
| Performance regression (LOD pipeline) | Frame drops | High | Perf tests + adaptive shedding | 3 |
| NOAA pattern change breaks fetch | Data outage | Medium | Multi-strategy fetch + health checks | 1 |
| Alert noise (false positives) | User distrust | Medium | Require persistence & percentile checks | 2 |
| Memory bloat (snapshot ring) | Browser instability | Low | Configurable retention + disposal | 2 |
| Complexity of worker comms | Debug difficulty | Medium | Structured message protocol + logging | 3 |
| Divergent legacy vs pipeline output | Confusion | Medium | Parallel diff metrics + gating | 1 |
| Adapter proliferation w/o governance | Maintenance burden | Low | Registry schema + lint rules | 4 |
| Spatial bias in sampling | Geographic blind spots | High | H3 aggregation fairness tests | 1 |
| Unbounded alert escalation | Alert fatigue | Medium | Cooldown windows & severity escalation rules | 2 |

## Monitoring Hooks
- Log anomalies in counts chain (unexpected drop > threshold).
- Track rolling fetch failure rate per adapter.

## Rollback Strategy
- Feature flag wraps pipeline; revert to legacy instantly if severe defect.

## Open Questions
- Exact NOAA update cadence variability tolerance? (Need empirical capture)
- Preferred H3 resolution defaults for global vs regional overlays?

