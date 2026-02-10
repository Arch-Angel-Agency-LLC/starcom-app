# Support Drive Funnel Tracking

1. Purpose
- Define events, payloads, storage, and guardrails for the funnel telemetry.

2. Principles
- Privacy-first: no PII; avoid GA for this funnel; prefer anonymous/cookieless analytics if used.
- Minimalism: only log what is necessary for funnel health and experiments.
- Resilience: if analytics unavailable, do not block UX.

3. Event list
- funnel_impression: modal displayed.
- cta_nostr_click: primary CTA to navcom.
- cta_fund_click: primary CTA to fundraiser.
- cta_learn_more: secondary learn-more action.
- copy_invite: copy/share link used.
- action_snooze: snooze set.
- action_dismiss: dismiss/hard opt-out.
- entry_open: user opens via persistent entry point.
- fallback_open_link: user uses inline fallback after pop-up blocked.
- variant_exposure: experiment variant shown (when applicable).

4. Payload fields (keep minimal)
- event: name.
- ts: timestamp ms.
- session_id: local generated session key (non-PII).
- variant: variant id if experiment active; else null.
- env: app env (dev/stage/prod).
- target: nostr|fund|learn|copy|snooze|dismiss|entry|fallback (where relevant).
- reason: optional for fallback/errors.

5. Storage options
- Local state: impressionSeen, snoozeUntil, dismissed stored locally (e.g., localStorage) with feature-key namespace.
- Analytics: optional anonymous endpoint (Matomo/Plausible/Nostr event). If disabled, skip network calls.

6. Naming conventions
- snake_case for events; keep consistent with copy-deck labels.
- target field mirrors CTA role for flexible grouping.

7. Sampling
- Default: no sampling (log all). If performance requires, add configurable sampling rate; document if changed.

8. Error handling
- Swallow/log errors; never block UI. Use console debug category if needed.

9. Data retention
- Local: snoozeUntil/dismiss retained until user clears or feature key changes.
- Remote (if any): align with analytics provider default; aim for minimal retention; no user identifiers.

10. Attribution/UTM
- If opening fundraiser/navcom links with tags, attach static label (e.g., ?src=app_modal). Avoid user-specific params.

11. Experiment support
- variant_exposure logged on impression when experiment flag active with variant id.
- All events include variant id when active.

12. PII avoidance checklist
- Do not capture emails/handles unless explicitly enabled and scoped elsewhere; this funnel spec avoids PII.
- Do not log wallet addresses.
- Do not log user agent unless required; if needed, truncate/normalize and document.

13. Performance considerations
- Batch or fire-and-forget; avoid blocking link opens.
- Guard against duplicate impressions (debounce by modal open instance).

14. Offline handling
- If offline: log locally; skip network sends; optional retry is out-of-scope.

15. QA checklist
- Events fire exactly once per action.
- variant id present when experiment enabled.
- Snooze/dismiss state persists across reloads (when storage available).
- Fallback link event fires when pop-up blocked path used.

16. Security
- No secrets in client payloads.
- Use HTTPS endpoints if any remote logging.

17. Change management
- Update this doc when events or payloads change; sync with ux-spec.md and implementation-notes.md.

18. Open questions
- Final decision on analytics provider (none vs Matomo/Plausible/Nostr-only).
- Whether to add simple counter widget fed by these events.

19. Changelog
- Add dated entries for schema or provider changes.
