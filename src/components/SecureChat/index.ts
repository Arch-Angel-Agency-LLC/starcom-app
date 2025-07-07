// Earth Alliance Secure Chat System - Component Exports

export { default as SecureChatManager } from './SecureChatManager';
export { default as SecureChatWindow } from './SecureChatWindow';
export { default as SecureChatContactList } from './SecureChatContactList';

// Re-export the context and types for convenience
export { useSecureChat } from '../../communication/context/useSecureChat';
export { SecureChatProvider } from '../../communication/context/SecureChatContext';
export type {
  EarthAllianceContact,
  SecureChatWindow as SecureChatWindowType,
  SecureMessage,
  ThreatLevel,
  SecurityClearance,
  PQCAlgorithm,
  PQCSecurityLevel
} from '../../types/SecureChat';
