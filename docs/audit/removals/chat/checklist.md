# Execution Checklist — Legacy Chat Removal

Pre-checks
- [x] Confirm render of legacy button in dev build.
- [x] Verify mount points in `MainPage.tsx` and `CyberCommandHUDLayout.tsx`.

Stage 1 — Unmount UI
- [x] Remove imports/usages of `<SecureChatManager />` in both files (or gate with feature flag).
- [x] Build: `npm run build`.
- [x] Typecheck: `npx tsc --noEmit --project tsconfig.netrunner.json`.
- [ ] Dev run: verify no button/popup and no errors in console.

Stage 2 — Remove legacy UI code (optional, after Stage 1)
- [x] Delete legacy components (TSX files). Keep CSS modules (used by unified).
- [x] Update barrels.
- [x] Build + typecheck.

Stage 3 — Context/provider cleanup (optional)
- [x] Search for consumers of `SecureChatProvider` / `useSecureChat`.
- [x] Remove provider wiring in `App.tsx`.
- [x] Build + typecheck.
- [x] Remove context file if no consumers remain.

Stage 4 — Integrations cleanup (optional)
- [x] Remove duplicate legacy service at `src/communication/services/SecureChatIntegrationService.ts`.
- [x] Stop re-export in `src/communication/index.ts`.
- [ ] Evaluate removal of `src/services/SecureChatIntegrationService.ts` (currently referenced by adapters/tests).
- [x] Build + typecheck.

Verification
- [ ] No chat button visible in production routes.
- [ ] No “Earth Alliance Contacts” popup.
- [ ] No regressions in demos/collab panels if kept.

Rollback
- [ ] Revert Stage 1 commit or toggle feature flag to true.
