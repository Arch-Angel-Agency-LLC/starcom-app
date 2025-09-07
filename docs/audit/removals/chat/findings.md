# Findings: Legacy Chat UI Audit

Summary of what’s rendered, where it’s mounted, and why it doesn’t work.

What renders the circular button and popup
- Component: `src/components/SecureChat/SecureChatManager.tsx`
  - Fixed circular button using `SecureChatManager.module.css` (`.chatToggle` at bottom-right).
  - Opens modal contact list by toggling local `showContactList`.
  - Keyboard: Ctrl/Cmd+Shift+C opens; Escape closes.
- Popup: `src/components/SecureChat/SecureChatContactList.tsx`
  - Title: “Earth Alliance Contacts”.
  - Modal overlay with `SecureChatContactList.module.css`.

Where it is mounted
- `src/pages/MainPage/MainPage.tsx`: `<SecureChatManager />`
- `src/layouts/CyberCommandHUDLayout/CyberCommandHUDLayout.tsx`: `{!isEmbedded && <SecureChatManager />}`

Verification notes
- Exhaustive repo search confirms no other active mounts of `<SecureChatManager />` beyond the two above.
- Historical/backup files (e.g., `CyberCommandHUDLayout.backup.txt`, `CyberCommandHUDLayout.fixed.tsx`) contain references but are not active in the build.

Why it doesn’t work
- Contact list reads from `SecureChatContext.state.verifiedContacts` (a Map).
- No code populates `verifiedContacts` during initialization.
- `SecureChatIntegrationService.synchronizeContacts()` exists but is not wired into the context (`ADD_CONTACT` dispatch not called).

Other observations
- Legacy drag logic in `SecureChatManager` logs movement but doesn’t update positions in context (TODO comment).
- Possible double mount: both MainPage and HUD include the manager (HUD is gated by `isEmbedded`).
- Accessibility could be improved (aria-labels, focus trap), but removal is prioritized.
