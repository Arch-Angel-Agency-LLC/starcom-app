# Support Drive Funnel Strategy

1. Purpose
- Define the goals, audiences, and constraints for the in-app support funnel to align product, design, engineering, and ops.

2. Objectives
- Primary objective: Grow decentralized community and readiness via nostr joins; ensure users can connect to navcom.app quickly.
- Secondary objectives: Capture contact (email/handle) if enabled; convert to pledges; then immediate donations for urgent liquidity.
- North-star KPI: Successful nostr join conversions (click-through confirmed open event or copy-share action).
- Supporting KPIs: Pledge conversions, immediate donation clicks, email/handle captures, funnel completion rate, dismiss vs snooze ratio.

3. Success ranking and rationale
- 1) Nostr joins (network growth and resilience; lowest friction; builds Earth Intelligence Network).
- 2) Email/handle capture (optional, for follow-up and segmentation).
- 3) Pledges (recurring support to avoid weak one-off positioning).
- 4) Immediate donations (liquidity, but secondary to community strength).

4. ICP recap (archetypes)
- Crypto-native activists: value sovereignty, anti-censorship, want heroic community; pain = central control, despair, no heroes.
- Open-source allies: value transparency, collaboration, recognition; pain = isolation, authoritarian pressure, doom fatigue.
- Humanitarian donors: value impact clarity and integrity; pain = chaos, exploitation fears, powerless feeling.

5. Messaging stance
- Tone: urgent and rallying; heroic, decentralized, anti-capture; strength-first, not a pity ask.
- Do: emphasize joining the alliance, fueling ops, uncaptured infrastructure, transparent impact.
- Don’t: use defeatist or pity framing; avoid surveillance-adjacent language; avoid overclaiming guarantees.

6. Brand/visual direction (high level)
- Bold, high-contrast, cyber-resistance aesthetic; neon/steel; purposeful typography (non-default stacks).
- Motion is purposeful and minimal; respect reduced-motion preferences.

7. Privacy and tracking constraints
- Prefer anonymous/cookieless analytics; avoid PII; do not ship GA for this funnel if privacy-sensitive.
- Local storage for state (impression, snooze, dismiss) by default; optional opt-in analytics.

8. Frequency and guardrails
- Show post-load; persist entry point for user-initiated open.
- Snooze: default 30 days; Dismiss: hard opt-out until user re-enables.
- Cap retries: do not re-show within snooze window; avoid nagging.

9. Disclosures and legal (placeholder until legal.md)
- Placeholder for jurisdiction/tax status, fundraiser classification, and any mandatory footer text.
- Avoid implying tax deductibility unless confirmed.

10. Dependencies on external properties
- Fundraiser site URL(s) with environment mapping (prod/stage).
- navcom.app nostr deep-link path or invite payload.
- Asset availability (logos, backgrounds, iconography).

11. Out-of-scope
- Build/UX of the fundraiser site itself.
- UX of navcom.app beyond deep-link correctness.

12. Risks and mitigations
- Risk: Fatigue from aggressive prompting. Mitigation: snooze/dismiss respected; entry point always available.
- Risk: Broken links. Mitigation: environment-configured URLs; health check before rollout.
- Risk: Privacy regressions. Mitigation: minimal payloads, no PII, optional analytics only.
- Risk: A11y failures. Mitigation: keyboard/focus testing; reduced-motion support; screen reader labels.
- Risk: Off-brand tone. Mitigation: copy approvals; tone rules in copy-deck.md.

13. Governance
- Approvals required: product, design, legal (once disclosures defined).
- Changes to triggers or URLs must be reflected in ux-spec.md, implementation-notes.md, and tracking.md.

14. Milestones
- M1: Finalize URLs, assets, disclosures.
- M2: UX spec locked; copy deck approved.
- M3: Implementation complete with tracking and tests.
- M4: Experiment slots defined; initial A/B (if any) launched.
- M5: Post-launch review; update strategy with learnings.

15. Future considerations
- Add regionalization if jurisdictional rules differ.
- Introduce lightweight in-modal learn-more accordion if no internal page exists.
- Add progressive profiling if email/handle capture is enabled later.

16. Changelog
- Add dated entries as strategy shifts (priority changes, KPI changes, new ICP nuances).
