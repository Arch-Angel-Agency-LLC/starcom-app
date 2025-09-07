# Impact and Risks

Why removal is safe
- The legacy chat UI is already non-functional for end users because `verifiedContacts` is never populated.
- The visible elements (button + contact list) create UX confusion without providing value.
- Removal is scoped to unmounting the entry points only (Stage 1), so no data or storage paths change.

Potential impacts
- If any code relied on the presence of the button DOM node (for layout/hotkeys), remove those dependencies or gate them.
- Keyboard shortcuts (Ctrl/Cmd+Shift+C, Escape) registered by `SecureChatManager` will no longer be attached.
- QA scripts or visual tests expecting the button need updates.

Dependencies/Intersections
- Provider: `SecureChatProvider` was wrapping the app; removed from `App.tsx` in Stage 3 (no external consumers found).
- Layout: Legacy mounts removed in Stage 1 (MainPage.tsx and CyberCommandHUDLayout.tsx).
- Unified chat: Separate path; unaffected by Stage 1/3 changes.

Mitigations
- Choose feature flag gating for easier flip-back if risk tolerance is low.
- Add a one-line note in release notes: “Removed legacy chat toggle and contacts popup (non-functional).”
- Run typecheck/build and a small UI smoke test.

Rollback plan
- If feature flagged: set `VITE_FEATURE_LEGACY_CHAT=true`.
- If direct removal: revert the Stage 1 commit.

Test ideas
- Main shell renders without runtime errors.
- Hotkeys no-op; no global listener leaks.
- No `SecureChatManager` in DOM.
- Unified chat demos/collab panels still work (if retained).
