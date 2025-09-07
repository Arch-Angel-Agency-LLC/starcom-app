# Chat Removal Audit

Purpose: document the audit and a safe, staged plan to remove the non-functional chat button and the "Earth Alliance Contacts" popup.

- Scope: legacy SecureChat UI (button/popup/windows), provider, and related mounts. Unified chat code is documented but not removed in Stage 1.
- Current status: Stage 1 complete — legacy chat UI unmounted (build/typecheck pass). Stage 2 complete — legacy TSX components deleted and de-exported; CSS modules retained for unified chat. Stage 3 complete — legacy SecureChatProvider/context and hook fully removed; build/typecheck pass.

Quick summary
- What users see: a bottom-right circular chat button that opens an "Earth Alliance Contacts" popup.
- Root cause: contact list reads `verifiedContacts` from `SecureChatContext`, but nothing populates it; sync is not wired.
- Minimal removal: remove `<SecureChatManager />` mounts in `MainPage` and `CyberCommandHUDLayout`.

Navigation
- Findings → `findings.md`
- Inventory → `inventory.md`
- Staged removal plan → `removal-plan.md`
- Impact, risks, and rollback → `impact-and-risks.md`
- Execution checklist → `checklist.md`
