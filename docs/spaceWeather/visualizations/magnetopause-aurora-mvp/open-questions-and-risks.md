# Open Questions and Risks

## Purpose
- Capture unresolved decisions, data gaps, and technical risks for the MVP overlays.
- Assign owners and next steps to unblock implementation.

## Data Availability
- Are authoritative live oval polygons reliably accessible? If not, rely solely on Kp model.
- Is there a dependable feed for IMF Bz at required cadence, or will we omit Bz adjustments initially?
- Do we have an API for modeled magnetopause/bow shock, or must we rely on client-side equations only?

## Coordinate Alignment
- Upstream coordinate system for ovals and Bz: geomagnetic vs geographic. Confirm and define conversion or accept approximate mapping.
- Validation source: how will we verify lat/long output alignment on the globe (reference map or external tool)?

## Model Coefficients
- Select coefficients for standoff and bow shock relations; confirm literature source and acceptable error bounds.
- Should we include day-night asymmetry now or defer to a later phase?

## Performance Headroom
- Will low-end GPUs sustain shells plus aurora additive blending at 50+ FPS? If not, define LOD switches.
- Do we need adaptive geometry simplification per device capability flag?

## Error Handling Behavior
- UX stance on prolonged degraded mode: keep rendering fallback geometry or hide layer after long outages?
- Should we surface error badges prominently or keep subtle to avoid noise?

## Visual Design Choices
- Final color palette and opacity targets for shells and aurora; confirm with design.
- Do we need a legend or inline label for layers in MVP, or is HUD enough?

## Testing and Validation
- What ground truth will we use to validate oval placement and standoff distances during QA?
- Do we need synthetic time series to simulate storms for stress testing?

## Security and Licensing
- Any usage terms for NOAA or other feeds that constrain caching or redistribution?
- Are we allowed to proxy requests, or must clients hit public endpoints directly?

## Observability
- Which metrics are mandatory for launch vs nice-to-have? Confirm with SRE.
- How to sample logs without bloating storage while keeping enough signal during incidents?

## Ownership and Ops
- Who owns the space weather pipeline on-call? Define escalation path.
- Define SLA/SLO for data freshness and who responds when thresholds are breached.

## User Experience Boundaries
- Should toggles persist across sessions (localStorage) or reset per session for MVP?
- Should motion reduction be exposed at MVP, or only in later iterations?

## Dependencies
- Any upstream work needed in GlobeEngine for new overlay hooks or material additions?
- Do we need additional assets (textures) for aurora gradients, or will procedural colors suffice?

## Decision Log Template
- For each open question, track: context, options, decision, owner, date, rationale.
