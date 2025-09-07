# Inventory: Chat-Related Code

Legacy (removed)
- UI Components (deleted)
  - `src/components/SecureChat/SecureChatManager.tsx`
  - `src/components/SecureChat/SecureChatContactList.tsx`
  - `src/components/SecureChat/SecureChatWindow.tsx`
- Styles (retained for unified components)
  - `SecureChatManager.module.css`, `SecureChatContactList.module.css`, `SecureChatWindow.module.css`
- Barrel
  - `src/components/SecureChat/index.ts` (legacy exports removed in Stage 2)
- Context/Services
  - `src/communication/context/SecureChatContext.tsx` (deleted)
  - `src/communication/context/useSecureChat.ts` (deleted)
  - `src/communication/services/SecureChatIntegrationService.ts` (duplicate; deleted in Stage 4)

Active services (retained)
- `src/services/SecureChatIntegrationService.ts` (referenced by adapters/tests; keep)
  - `src/communication/services/SecureChatIntegrationService.ts`
  - Downstream services: `src/services/nostrService*`, `src/services/IPFSService`, `src/services/UnifiedIPFSNostrService`, `src/services/crypto/SOCOMPQCryptoService`
- Mount points (removed in Stage 1)
  - `src/pages/MainPage/MainPage.tsx`
  - `src/layouts/CyberCommandHUDLayout/CyberCommandHUDLayout.tsx`

Unified (not mounted by MainPage)
- UI Components
  - `src/components/SecureChat/SecureChatManager-unified.tsx`
  - `src/components/SecureChat/SecureChatContactList-unified.tsx`
  - `src/components/SecureChat/SecureChatWindow-unified.tsx`
- Context
  - `src/context/ChatContext.tsx` (useChat provider/hook)
- Consumers (examples)
  - `components/Collaboration/*` panels
  - `components/HUD/FloatingPanels/panels/ChatFloatingPanel.tsx`
  - `components/Demo/*Chat*` examples

References to look for during cleanup
- JSX usage of `<SecureChatManager />`
- Imports of `useSecureChat`, `SecureChatProvider`
- useChat (unified) in production routes
