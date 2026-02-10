# Support Drive Funnel Flows

1. Purpose
- Describe user journeys, states, and edge cases for the funnel experience.

2. Flow: first open
- App loads → preloader completes → feature flag enabled → check snooze/dismiss state → show modal.
- Log impression.
- User chooses an action (CTA, snooze, dismiss, learn more, copy invite, close).

3. Flow: CTA primary (nostr)
- User clicks "Join the Nostr Ops" → open navcom.app in new tab → log cta_nostr_click.
- If pop-up blocked, show inline fallback link; log fallback click.

4. Flow: CTA primary (fund)
- User clicks "Fund the Mission" → open fundraiser URL in new tab → log cta_fund_click.
- If pop-up blocked, show inline fallback link; log fallback click.

5. Flow: secondary learn more
- User clicks "Learn more" → open internal route or accordion → log cta_learn_more.

6. Flow: copy/share invite
- User clicks "Copy invite link" → copy to clipboard → show toast "Invite copied" → log copy_invite.

7. Flow: snooze
- User clicks "Remind me later" → set snooze timestamp (default +30d) → close modal → log action_snooze.
- Modal suppressed until after snooze expiry.

8. Flow: dismiss
- User clicks "No thanks" or close → set dismissed flag → close modal → log action_dismiss.
- Modal does not auto-show again; entry point remains for manual open.

9. Flow: reopen via entry point
- User clicks persistent "Support" entry → modal opens regardless of snooze/dismiss → log entry_open.
- Dismiss does not block manual open.

10. Flow: storage unavailable
- If local storage unavailable: treat snooze/dismiss as session-only; modal may reappear next session.

11. Flow: offline
- If offline and URLs require network: show modal but warn that links need connectivity; allow copy to share later.

12. Flow: blocked pop-ups
- On primary CTA click, if blocked: show inline fallback link and copy option.
- Ensure CTA still logs attempt; fallback logs separate event.

13. Flow: missing URL config (dev/test guard)
- If fundraiser URL missing: disable CTA, show inline admin warning.
- If navcom URL missing: same pattern; do not crash.

14. Flow: reduced motion
- If prefers-reduced-motion: disable entrance animations; keep instant open/close; no pulsing CTAs.

15. Flow: keyboard-only
- Open modal → focus trap cycles through controls → ESC closes → focus returns to opener/entry point.

16. Flow: screen reader
- Modal announces as dialog with label from headline; CTAs announced in order; close labeled.

17. Flow: experiment variant exposure
- When experiment active: log variant exposure on modal show; follow standard flows; ensure labels sourced per variant.

18. Flow: state transitions summary
- none → impression → action (CTA/snooze/dismiss/learn/copy/close) → closed.
- Snooze sets timer; dismiss sets persistent block; entry point bypasses block.

19. Edge cases summary
- Private browsing: state may not persist; expect re-prompt each session.
- Multi-tab: state sync optional; if unsynced, re-prompt possible; acceptable risk noted.
- Rapid open/close: debounce impression logging to avoid duplicates.

20. Metrics checkpoints (see tracking.md)
- Impression, CTA clicks, copy, learn more, snooze, dismiss, entry open, fallback clicks.

21. Changelog
- Add dated updates when flows change (e.g., new actions, changed snooze length, new error handling).
