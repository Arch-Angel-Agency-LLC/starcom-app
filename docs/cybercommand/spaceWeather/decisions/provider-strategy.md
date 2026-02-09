# Decision: Provider Strategy (Legacy/Enterprise/Enhanced)

## Context
Manual provider toggles (Legacy/Enterprise/Enhanced) were exposed in the left sidebar to let operators fail over between feeds and see health badges. Auto-failover in context has improved, and the UI creates confusion.

## Decision (proposed)
- Remove manual provider switching from the UI; rely on automatic selection/failover in context.
- Keep provider health in passive telemetry (optional) only if ops still need visibility; otherwise drop it.

## Rationale
- Simplifies controls; aligns with “left = interactive, right = passive.”
- Reduces training/support overhead; avoids exposing internal adapter details.

## Implications
- Update `SpaceWeatherControlSurface` to remove selector/labels and any dependencies on manual switches.
- If health visibility is kept, surface it as read-only in right-rail cards; otherwise prune providerStatus/currentProvider fields.
- Adjust docs/bulletins and screenshots after removal.

## Status
Accepted (2026-01-11). Provider health remains as read-only telemetry in the right rail; manual switching removed from the left control surface.
