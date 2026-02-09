# Ecological Disasters Visualization – Rollout Plan

## Strategy
- Feature-flag the EcologicalDisasters mode; default off until QA passes.
- Phased enablement: dev → staging → limited prod → full prod.

## Preflight Checklist (per env)
- Feeds reachable (USGS quake, volcano source/mock) with acceptable latency.
- Settings defaults verified (earthquakes/volcanoes ON, severity defaults correct).
- Legend colors match marker colors.
- Telemetry emitting fetch_success/failure and render.update.
- Resource monitor budgets set for EcoNatural.EcologicalDisasters.
- Version bump per pre-push hook requirement.

## Gate Criteria
- Tests: unit/contract/integration/snapshots pass in CI.
- Manual QA checklist (see testing doc) signed off.
- Performance: marker render within budget; no leaks after repeated refresh.
- Accessibility: contrast and keyboard focus validated on core flows.

## Rollout Steps
1) Enable flag in dev; validate with live feeds or fixtures.
2) Promote to staging; run smoke tests: mode switch, markers render, legend, tooltips, filters.
3) Limited prod: enable for internal users or small cohort; monitor telemetry for 24–48h.
4) Full prod: enable for all; keep rollback switch ready.

## Smoke Test Script (per deploy)
- Open app, select EcoNatural → EcologicalDisasters.
- Verify quakes appear, volcano markers visible (mock labeled), legend accurate.
- Toggle severity/timeRange; marker counts respond.
- Trigger an intentional fetch failure (dev via mock) and confirm stale badge/alert.
- Check right sidebar status tab shows last-updated time.

## Rollback Plan
- Disable feature flag to hide mode while leaving code intact.
- If flag unavailable, set hazard toggles default OFF; remove overlay activation.
- Communicate incident with summary of issue and expected recovery time.

## Communication
- Release notes summarizing new mode, data sources, and mock caveats.
- Known limitations: volcano feed mocked; wildfire/flood/hurricane not included in v1.
- Provide contact/ownership for escalation.

## Ownership
- Engineering owner: EcoNatural visualization feature lead.
- Ops owner: data pipeline/telemetry contact.
- QA owner: assigned tester for this mode.

## Monitoring Post-Launch
- Watch fetch failure rate, marker counts, render duration.
- Track user filter usage and mode entry rate.
- Alert thresholds set; review after first week.

## Configuration Points
- Feature flag key name (define in config): e.g., ecoNatural.ecologicalDisasters.enabled.
- Default settings: earthquakes=true, volcanoes=true, severity major/catastrophic, timeRange=7d.

## Dependencies
- Provider registry operational; geo-events endpoints accessible.
- Settings persistence working; visualizationMode context stable.
- Telemetry pipeline available.

## Open Questions
- Do we gate volcano markers separately behind a sub-flag until live feed? Consider yes.
- Do we need a per-environment banner when mock data is used? Probably yes for staging/prod until live feed.

## Feature Flag Details
- Flag name suggestion: ecoNatural.ecologicalDisasters.enabled
- Optional sub-flag: ecoNatural.ecologicalDisasters.volcanoes.enabled
- Default: false in prod until rollout; true in dev.

## Environment Matrix
- Dev: flag on; mock volcano feed allowed; telemetry optional.
- Staging: flag on for QA; telemetry required; mock banner visible if mock data used.
- Prod limited: flag on for internal users; monitor for 24–48h.
- Prod full: flag on for all after gates cleared.

## Release Comms Template
- Summary of new mode.
- Data sources and mock caveats.
- How to access (mode selector), known limitations.
- Contact/owner for issues.

## Rollback Execution Steps
- Toggle flag off in config/feature service.
- Clear any cached eco-disaster data if needed.
- Announce rollback with reason and expected next steps.

## Risk List
- Feed outage causing empty markers; mitigated by stale badge and fallback.
- Performance regression when markers spike; mitigated by thinning and budgets.
- User confusion over mock volcano data; mitigated by badges and comms.

## Additional Smoke Checks
- Verify right sidebar icon matches left (🌋) after changes.
- Verify settings defaults (hazards ON) after rollout flip.
- Verify telemetry events visible in dashboards post-deploy.

## Post-Launch Review
- 24h review: check metrics, user feedback, error logs.
- 7d review: evaluate performance and consider enabling additional hazards.

## Owner Matrix
- Engineering: EcoNatural visualization lead.
- QA: assigned tester.
- Ops/Telemetry: observability owner.
- Product/UX: mode sponsor.

## Post-Launch Tasks
- Confirm version bump satisfied pre-push hook and release tagging.
- Update documentation links in README or navigation if needed.
- Archive mock volcano notice once live feed launches (future action).
- Collect user feedback and prioritize next hazards.

## Metrics to Review After Launch
- Mode entry rate (% sessions that open EcologicalDisasters).
- Filter usage (timeRange adjustments, severity toggles).
- Fetch success/failure rate per endpoint.
- Render duration p95.
- Marker count distribution.

## Contingency Templates
- Outage notice text for feed failures.
- Mock data disclaimer for volcanoes.
- Performance degradation notice if thinning engages heavily.

## Coordination
- Align with SpaceWeather team to avoid sidebar conflicts when both modes active in same session.
- Align with ops on logging volume to avoid noise spikes on launch day.

## Long-Tail Tasks
- Add feature flag metrics to dashboard for adoption tracking.
- Schedule retrospective after first week to capture lessons.

## Additional Smoke Steps (repeatable checklist)
- Confirm globe renders markers after mode toggle with fresh cache.
- Confirm legend/tooltip shows mock badge for volcanoes while mock is active.
- Confirm right sidebar status tab shows last updated time and counts.
- Confirm settings toggles persist reload.
- Confirm collapse/expand of sidebars leaves eco content intact.
- Confirm no console errors in devtools during interaction.

## Training/Docs
- Update internal wiki with quickstart for enabling mode and interpreting markers.
- Provide short GIF or screenshot set demonstrating filters.

## Rollout Risks and Mitigations
- Performance spikes: mitigate with thinning and feature flag.
- Data outages: mitigate with stale badges, fallbacks, and flag.
- UX confusion over mock data: mitigate with clear badges and release notes.

## Coordination with Other Teams
- Align with incident response to ensure eco-disaster alerts (if any) route correctly.
- Align with design for final icon and color approval.
- Align with analytics for telemetry field naming consistency.
