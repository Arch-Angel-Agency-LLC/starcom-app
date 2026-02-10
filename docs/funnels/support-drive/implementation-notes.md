# Support Drive Implementation Notes

1. Purpose
- Practical guidance for engineers integrating the funnel into the app: mount points, state model, flags, tests, and dependencies.

2. Mount point
- After PreloaderManager completes and before/within App shell render; ensure ErrorBoundary already mounted.
- Modal component should be globally available; persistent entry point placed in app chrome (e.g., top bar button or side menu item labelled “Support”).

3. State model (local)
- impressionSeen: boolean per feature key.
- snoozeUntil: timestamp ms; default now + 30 days.
- dismissed: boolean hard opt-out.
- lastAction: enum (nostr, fund, learn, copy, snooze, dismiss, close).
- variantId: active experiment variant if any.

4. Storage
- Preferred: localStorage with namespaced key (e.g., support_funnel_*).
- Fallback: in-memory for session if storage unavailable.

5. Feature flags/env config
- enableSupportFunnel: master toggle.
- fundraiserUrl: env-specific.
- nostrUrl: env-specific (navcom.app path/invite).
- experimentVariant: optional; else assign client-side.
- snoozeDays: configurable; default 30.

6. Component responsibilities
- FunnelModal: renders UI, handles close, snooze, dismiss, CTA clicks, focus trap.
- FunnelState hook/store: reads/writes state, applies flags, provides eligibility.
- Tracking hook: fires events defined in tracking.md; no-ops if analytics disabled.
- EntryPointButton: always available control to reopen modal.

7. Error handling
- If URL missing, disable CTA and show inline dev warning (visible only in non-prod or behind debug flag).
- Pop-up blocked: show fallback link and copy action.

8. A11y implementation
- Use role="dialog" aria-modal="true"; headline id referenced by aria-labelledby.
- Focus trap via library or custom; return focus to opener on close.
- ESC closes; TAB cycle verified.
- Respect prefers-reduced-motion; gate animations.

9. Motion implementation
- Keep transitions under 200ms; use CSS transition/opacity/translate with will-change minimized.
- Disable glow/animation if reduced-motion.

10. Styling and theming
- Pull colors/typography from design tokens; avoid hard-coded colors except temporary defaults defined in assets.md.
- Ensure contrast meets WCAG AA.

11. URL handling
- Open primary CTAs in new tab (rel="noreferrer" if required).
- Append static source tag (e.g., ?src=app_modal) if approved.

12. Telemetry wiring
- Ensure tracking calls are fire-and-forget; avoid blocking default link behavior.
- Debounce impression to one per modal open.

13. Tests (minimum)
- Unit: eligibility logic (snooze/dismiss/flag), state persistence, variant selection, URL guard when missing.
- A11y: focus trap, ESC close, keyboard traversal order, reduced-motion branch.
- Interaction: CTA click logs event; snooze sets timestamp; dismiss sets flag; entry point reopens modal.
- Visual/snapshot (optional): modal layout sanity.

14. Performance considerations
- Lazy-load modal assets if heavy imagery used; keep bundle impact low.
- Avoid rerender thrash by memoizing static props/copy.

15. Internationalization readiness
- Strings pulled from copy-deck mapping; allow future i18n switch without layout breakage.

16. Offline handling
- If navigator.onLine false: show subtle warning near CTAs; allow copy; links may fail but should not crash.

17. Security/privacy
- No secrets in client; no PII in events; avoid wallet address logging.

18. Logging/debug
- Use existing debugLogger categories if available; keep logs quiet in production.

19. Deployment checklist
- Flags configured per env; URLs verified.
- Tests pass; lint/typecheck clean.
- A11y checklist run.
- Tracking smoke-tested in staging with analytics toggle on/off.

20. Maintenance
- Bump state key version if schema changes; handle migration by clearing/safely ignoring old keys.

21. Changelog
- Add entries for mount changes, flag changes, URL changes, or state model updates.
