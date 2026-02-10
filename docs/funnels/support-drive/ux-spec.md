# Support Drive Funnel UX Spec

1. Scope
- Defines UX for the in-app support funnel: modal, triggers, snooze/dismiss behavior, persistent entry point, and core interactions.

2. Trigger logic
- Show after app load completes (post-preloader).
- Do not show if dismissed (hard opt-out) unless user re-enables via settings/entry point.
- Snooze: default 30 days; store next eligible timestamp; do not show before expiry.
- Impression recorded only once per display.
- Fallback: if local storage unavailable, show once per session; respect dismiss during session.

3. Entry point (persistent)
- Visible control to reopen the funnel after dismiss/snooze (e.g., toolbar button, menu item, or badge).
- Accessible name: “Support the mission” (adjust per copy deck).
- Keyboard activatable; works without pointer.

4. Layout (modal)
- Sections: headline, subhead/body, primary CTA pair, secondary actions, optional impact note/thermometer, footer for disclosures.
- Primary CTAs side-by-side on desktop; stacked on mobile.
- Secondary actions beneath primaries: learn more, copy/share invite link, remind me later (snooze), dismiss/close.
- Close affordance: top-right close icon plus ESC support.

5. Responsive behavior
- Mobile: stack CTAs; ensure 44px touch targets; constrain width; body wraps cleanly.
- Desktop: max-width container; balanced spacing; avoid excessive height.
- Handle small viewports with internal scroll if needed; keep CTA region visible.

6. Accessibility
- Focus trap within modal; return focus to opener on close.
- Keyboard: TAB/SHIFT+TAB cycle; ENTER/SPACE on buttons; ESC closes.
- Aria labels: modal role=dialog, aria-modal=true, labelledby headline id.
- Reduced motion: honor prefers-reduced-motion; disable non-essential animations.
- Color contrast: meet WCAG AA for text/buttons.

7. States
- Default: content visible, CTAs enabled.
- Loading (if any async URL checks): show subtle spinner on affected CTA only.
- Success: CTA opens link in new tab; optionally mark as clicked.
- Error: if pop-up blocked, surface inline link to copy; if link missing, show fallback message.

8. Motion guidelines
- Entry: subtle fade/slide; keep under 200ms when motion allowed.
- CTA emphasis: gentle glow/pulse not exceeding 2s loop; disable under reduced-motion.
- No parallax or heavy animations; keep GPU overdraw minimal.

9. Content slots
- Headline: urgent, rallying (see copy-deck.md variants).
- Subhead/body: one short sentence; optional single-line impact stat.
- Primary CTA 1: Join Nostr/navcom.app.
- Primary CTA 2: Fund the mission (fundraiser site).
- Secondary: learn more (internal), copy/share invite, remind me later, dismiss.
- Footer: disclosure/legal line when provided.

10. Error handling
- Pop-up blocked: show inline text “Pop-up blocked—open link” with direct href.
- Missing URL config: hide CTA and show admin error note (dev/test only).
- Storage unavailable: degrade gracefully to session-scoped state.

11. Copy hooks (coordination with copy-deck.md)
- Allow dynamic headline variant selection (A/B slot) via prop or flag.
- CTA labels sourced from centralized copy to keep tracking consistent.

12. Visual direction (summary; see assets.md)
- High-contrast theme with neon/steel palette; dark base with vivid accent.
- Purposeful typography (avoid default system stack); consistent button shapes.
- Optional background art (grain/gradient) if performance allows.

13. Telemetry surfaces (see tracking.md)
- Impression logged on modal show.
- CTA clicks for both primaries; copy/share action; learn-more; snooze; dismiss; close.
- Variant exposure logged if experiments active.

14. Entry conditions and suppression
- Do not show if feature flag disabled.
- Do not show during critical blocking alerts (if any) to avoid stacking modals.
- Suppress when offline only if URLs require network; otherwise allow but warn.

15. Edge cases
- Private browsing: may not persist snooze/dismiss; expect re-prompt per session.
- No JS errors tolerated; modal must fail closed (do not block app render).
- If user already completed primary action in session (heuristic), may skip re-show (optional future enhancement).

16. Internationalization readiness
- Reserve space for longer strings; avoid hard-coded widths.
- Support RTL mirroring if app supports RTL globally.

17. Theming
- Use app theme tokens; allow dark/light parity if app themeable. If single-theme, ensure contrast in both modes of OS if applicable.

18. QA checklist
- Keyboard traversal order correct.
- Focus trap and return focus verified.
- Reduced-motion honored.
- CTAs open correct URLs in new tab.
- Snooze writes timestamp; dismiss sets permanent flag; entry point remains.
- Pop-up blocked fallback works.

19. Open questions (to resolve in implementation-notes.md)
- Exact mount location relative to PreloaderManager and ErrorBoundary.
- Placement of persistent entry point in UI chrome.
- Whether learn-more opens internal route or accordion.

20. Changelog
- Add dated entries as UX spec changes (triggers, layout, motion rules).
