# Support Drive FAQ

1. What is this funnel?
- An in-app modal plus persistent entry point prompting users to join the Nostr chat (navcom.app) and fund the mission.

2. How often will users see it?
- Shown after load if not snoozed or dismissed. Snooze hides it for the configured window (default 30 days). Dismiss hides it until user manually reopens via the entry point.

3. Can users reopen it after dismiss?
- Yes, the persistent entry point lets them reopen anytime.

4. What if storage is blocked (private browsing)?
- Snooze/dismiss persist only for the session; users may see it again next session.

5. How do we change the URLs?
- Update env config/flags (fundraiserUrl, nostrUrl) and verify in staging. Do not hardcode in components.

6. What happens if the pop-up is blocked?
- The modal shows a fallback inline link to click or copy, and we log a fallback event.

7. What if the fundraiser URL is missing?
- CTA is disabled and shows an inline admin warning in non-prod; users should not see a broken CTA.

8. Is any personal data collected?
- No PII by default. Events are minimal (impression/clicks). If analytics enabled, use anonymous/cookieless; avoid wallet addresses.

9. Why prioritize Nostr joins over immediate donations?
- Community resilience and network growth are strategic; funding is framed as power amplification, not desperation.

10. Can users opt out permanently?
- Dismiss acts as a hard opt-out until the user reopens via the entry point; no forced re-show.

11. Does reduced-motion apply?
- Yes. Animations are disabled or minimized when prefers-reduced-motion is on.

12. Are there accessibility guarantees?
- Focus trap, keyboard navigation, ESC close, aria labels, contrast compliance are required.

13. How is tracking handled?
- Events per tracking.md. If analytics disabled, events are local/no-op network. No blocking of UX on failure.

14. How are experiments handled?
- See experiments.md. Variant exposure logged on impression; variant id included on events.

15. How do we update copy?
- Edit copy-deck.md, coordinate with design and tracking (if labels affect event names), and update UX if layouts depend on text length.

16. What disclosures are shown?
- Placeholder until legal text is supplied; add to footer when available.

17. Where does the modal mount?
- Post-preloader within the app shell; see implementation-notes.md for integration details.

18. Can the funnel run offline?
- Modal can show; CTAs may fail without connectivity. Provide copy option and optionally warn when offline.

19. How do we test it?
- Unit and a11y tests per implementation-notes.md; manual QA for keyboard, reduced-motion, and URL correctness.

20. Who approves changes?
- Product + design; legal for disclosures; analytics for tracking changes. See strategy.md governance section.

21. How do we handle multiple tabs?
- State is local; multi-tab sync optional. Users might see it per tab; acceptable for now.

22. What if the user already joined/donated?
- Future enhancement: add heuristic to skip auto-show after confirmed completion; currently not implemented.

23. How is snooze length set?
- Default 30 days, configurable via flag/env. Update implementation-notes.md if changed.

24. Can we add a progress bar/thermometer?
- Not in current scope; would require assets and potentially an experiment; document in assets/experiments if added.

25. How do we localize later?
- Strings are centralized in copy-deck.md; implementation should pull from a mapping to enable future i18n.

26. What if analytics endpoint is down?
- Tracking should fail silently; no impact on modal function.

27. How do we keep brand alignment?
- Follow tone/visual rules in strategy.md, copy-deck.md, assets.md. Avoid off-brand colors or pity framing.

28. What about compliance/tax language?
- Add once legal provides text; see placeholder in copy-deck.md and strategy.md.

29. Are there rate limits on reminders?
- Snooze enforces the window; no additional mid-window prompts. Entry point is user-driven.

30. Changelog
- Add dated FAQ updates as behaviors or policies change.
