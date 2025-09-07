# Removal Plan: Legacy Secure Chat UI

Goals
- Remove the non-functional legacy chat button and “Earth Alliance Contacts” popup from production routes.
- Keep risk low by only unmounting at entry points first, then clean up internals in later stages.

Assumptions
- The live UI path mounts the legacy `SecureChatManager`.
- Unified chat paths are not part of production routing for the button (demos/collaboration panels may still use unified chat). 

Stage 0 — Verify current state
- Confirm the legacy button renders in production routes.
- Confirm `SecureChatManager` is mounted in:
  - `src/pages/MainPage/MainPage.tsx`
  - `src/layouts/CyberCommandHUDLayout/CyberCommandHUDLayout.tsx` (guarded by `!isEmbedded`)

Stage 1 — Remove/hide the UI mounts (minimal risk)
Option A: Direct removal (preferred for clarity)
- In `MainPage.tsx`: remove the import and `<SecureChatManager />` usage.
- In `CyberCommandHUDLayout.tsx`: remove the import and usage guarded by `!isEmbedded`.

Option B: Feature flag (if you want quick toggle/rollback without code diffs)
- Introduce `VITE_FEATURE_LEGACY_CHAT=false` in `.env`.
- Gate both mounts with `import.meta.env.VITE_FEATURE_LEGACY_CHAT`.
- Default the flag to false in all environments.

Post-Stage 1 checks
- Build: `npm run build` (or task: NetRunner: Build Check)
- Typecheck: `npx tsc --noEmit --project tsconfig.netrunner.json` (task exists)
- Quick smoke: run dev and verify the button/popup no longer appear.

Stage 2 — Remove dead legacy UI code (safe once Stage 1 is merged)
 - Delete legacy TSX components (unified path retains CSS modules):
  - `src/components/SecureChat/SecureChatManager.tsx` (deleted)
  - `src/components/SecureChat/SecureChatContactList.tsx` (deleted)
  - `src/components/SecureChat/SecureChatWindow.tsx` (deleted)
 - Keep CSS modules: shared by unified components
  - `SecureChatManager.module.css`, `SecureChatContactList.module.css`, `SecureChatWindow.module.css` (retained for unified chat)
 - Update any `index.ts` barrels accordingly.

Stage 3 — Provider/context cleanup (only after confirming no consumers)
- Search for `SecureChatProvider`, `useSecureChat`, or reducer actions.
- If unused after Stage 2, remove `src/communication/context/SecureChatContext.tsx` and any provider wiring in `App.tsx`.
- Build/typecheck after each removal; if anything references the provider, pause and re-evaluate.

Stage 4 — Integration/service cleanup (if now unused)
- Review and remove unused integration code:
  - `src/communication/services/SecureChatIntegrationService.ts`
  - Any dedicated service wiring that no longer has call sites (`nostrService`, `IPFSService`, `UnifiedIPFSNostrService` paths specifically used by legacy context).

Stage 5 — Unified chat review (optional)
- If desired, decide to keep unified chat for demos/collab or remove if unused in production routes.

Rollback
- Stage 1 direct removal: revert the commit that removed imports/usages, or flip the feature flag to true (if Option B used).
- Later stages: restore deleted files via git revert; avoid partial rollbacks that re-introduce only some files—prefer full revert of the stage commit.

Acceptance criteria
- No circular button in bottom-right on any production route.
- No “Earth Alliance Contacts” popup reachable.
- Build + typecheck pass; no unused import/type errors.
- No regressions reported in collaboration/demo panels (if unified paths retained).

Status
- Stage 1 Completed: SecureChatManager unmounted from MainPage and CyberCommandHUDLayout; build + typecheck passed.
- Stage 2 Progress: Barrel de-exported (index.ts) to prevent new imports; physical TSX file deletion pending (CSS modules retained for unified).
- Stage 3 Completed: Removed SecureChatProvider/context and useSecureChat hook files; pruned exports; build + typecheck passed.
