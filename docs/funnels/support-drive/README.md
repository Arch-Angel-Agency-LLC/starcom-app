# Support Drive Funnel Docs Index

1. Purpose and scope
- This doc set defines the fundraiser click-funnel experience inside the Starcom app (post-load modal and persistent entry point) and ensures alignment across product, design, engineering, ops, and legal.
- It centralizes the plan to drive community growth (nostr) and funding without compromising privacy or brand stance.

2. Owners and accountability
- Product: TBD (assign a single decision maker).
- Design: TBD (owns UX spec, assets, and motion coherence).
- Engineering: TBD (frontend implementation + telemetry plumbing).
- Legal/Compliance: TBD (disclosures, jurisdictional notes).
- Analytics: TBD (event schemas, dashboards, experiment governance).
- Content: TBD (copy approvals and localization readiness).

3. Update cadence
- Living docs: update on every material change to triggers, CTAs, URLs, or disclosures.
- Quarterly review: confirm guardrails, privacy posture, and experiment slots.
- Experiment cycles: document each A/B test before launch and close with results.

4. Contents map
- strategy.md — goals, ICP recap, success ranking, constraints.
- ux-spec.md — triggers, layout, a11y, states, motion.
- copy-deck.md — headlines, CTA labels, variants, tone rules.
- flows.md — journey outlines and edge cases.
- tracking.md — events, payloads, storage, naming, retention.
- experiments.md — A/B slots, metrics, guardrails, rollback.
- implementation-notes.md — integration, state model, flags, tests.
- assets.md — palette, type, imagery, animation specs, usage rules.
- faq.md — privacy, frequency, updates, troubleshooting.
- (optional) legal.md — disclosures and required footers when provided.

5. How to use this folder
- New contributors start here, then read strategy.md and ux-spec.md.
- For copy changes, update copy-deck.md and sync with ux-spec.md and tracking.md if labels change.
- For implementation changes, update implementation-notes.md and tracking.md; reflect any new states in flows.md.
- For experiments, add a section in experiments.md before shipping and close the loop with results.

6. Scope boundaries
- In scope: in-app funnel modal, snooze/dismiss logic, persistent entry point, associated copy and tracking.
- Out of scope: the decentralized fundraiser site build itself, external payment processor flows, and navcom.app UX (only deep-link targets matter here).

7. Terminology
- Funnel: the in-app modal and persistent entry entry point leading to supporter actions.
- Supporter actions: nostr join, email capture (if used), pledge, immediate donation.
- Snooze: suppressing the modal for a time window (default 30 days unless revised).
- Dismiss: hard opt-out until user re-enables via settings or entry point.
- Entry point: always-available way to open the funnel after dismissal/snooze.

8. Current status snapshot
- Trigger intent: post-load after preloader completes.
- Priority actions: nostr join, email capture (if enabled), pledges, immediate donations.
- Tone: urgent and rallying; heroic, decentralized, anti-capture.
- Privacy: preference for anonymous/cookieless logging; avoid GA for this funnel.
- A11y: must pass keyboard and screen reader basics; respect reduced motion.

9. Decision log (add entries chronologically)
- Placeholder: fill with dates, decisions, owners, and rationale as changes happen.

10. Risks to watch
- Over-prompting fatigue if snooze/dismiss not respected.
- Privacy regressions if GA or PII sneaks into payloads.
- Broken deep-links to fundraiser or navcom.app.
- Visual or motion regressions harming accessibility.
- Legal exposure if disclosures are missing once fundraising status is clarified.

11. Next steps checklist
- Assign owners for each role above.
- Confirm fundraiser URL(s) and navcom.app deep-link path.
- Decide on storage/logging approach (local only vs anonymous analytics).
- Populate legal.md once disclosure text is available.

12. Change process
- Propose edits via PR referencing relevant doc sections.
- Keep this index aligned with added or removed files.
- Update decision log with every merged change affecting scope, triggers, URLs, or tracking.
