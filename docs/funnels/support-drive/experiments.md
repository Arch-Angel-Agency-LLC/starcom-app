# Support Drive Experiments

1. Purpose
- Define how to run A/B tests on the funnel: variants, metrics, guardrails, and rollback.

2. Experiment policy
- Only run when traffic volume can reach significance without harming UX.
- Keep one primary experiment active at a time; avoid overlapping tests on the same surface.

3. Candidate experiment slots
- Layout: dual primary CTAs vs single primary (nostr-first) with secondary fund CTA.
- CTA ordering: nostr left vs fund left.
- Copy: headline variants (see copy-deck.md H1-A…H1-E).
- Accent color emphasis: accent on nostr vs accent on fund.
- Presence of impact stat: showing a short impact line vs none.
- Motion: subtle CTA glow vs no glow (disabled if reduced-motion).

4. Metrics
- Primary: click-through on target CTA(s) per variant (nostr/fund separately).
- Secondary: overall funnel completion (any primary), snooze/dismiss rates, learn-more clicks, copy_invite usage.
- Guardrails: dismiss rate should not exceed baseline by >X%; time-to-interact not degraded.

5. Variant exposure logging
- Log variant_exposure on impression with variant id.
- Include variant id on all subsequent events during that session/modal display.

6. Assignment
- Randomized client-side with stable session key to avoid flip-flop per session; seed by session_id.
- Ensure control group present for each experiment.

7. Duration and stopping rules
- Minimum run time: set based on traffic; do not stop early unless harming guardrails.
- Stop when significance reached or after fixed window; declare winner; remove loser from code or hide behind flag.

8. Rollback plan
- Ability to force control via feature flag.
- If metrics regress (e.g., dismiss spikes), revert to control immediately.

9. Implementation hooks
- Feature flag toggles experiments on/off.
- Variant ids defined centrally (e.g., layout_a, layout_b; copy_h1a, copy_h1b).
- Copy and style pulled from copy-deck/assets tokens to keep variants consistent.

10. QA checklist per experiment
- Correct variant assignment distribution.
- variant_exposure fires once per impression.
- CTA labels/styles match intended variant.
- Tracking events include variant id.

11. Data handling
- No PII; variant and session only.
- No user-based targeting beyond stable session assignment.

12. Reporting
- Simple table: variant, impressions, nostr CTR, fund CTR, dismiss rate, snooze rate, learn-more rate, copy rate.
- Note any anomalies (pop-up blocks, offline rates) if they skew counts.

13. Governance
- Approvals: product + design before launch; analytics signs off on event readiness.
- Post-mortem: add summary to this file when experiment ends with outcome and decision.

14. Future ideas (backlog)
- Add social proof snippet vs none.
- Include a tiny progress bar/thermometer vs none.
- Add optional “pledge later” lightweight capture vs no capture.

15. Changelog
- Record each experiment with id, variants, dates, owner, outcome.
