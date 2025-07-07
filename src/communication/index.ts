/**
 * 🗣️ COMMUNICATION MODULE - UNIFIED EXPORTS
 * Centralized exports for all communication-related functionality
 */

// Chat Context and Providers
export { SecureChatProvider } from './context/SecureChatContext';
export { useSecureChat } from './context/useSecureChat';
export type { SecureChatContextType } from './context/SecureChatContext';

// Communication Types
export * from './types/SecureChat';

// Communication Services
export { secureChatIntegration } from './services/SecureChatIntegrationService';

// Re-export commonly used types for compatibility
export type {
  EarthAllianceContact,
  SecureChatWindow,
  ThreatLevel,
  SecurityClearance,
  PQCAlgorithm,
  PQCSecurityLevel,
  MessageType
} from './types/SecureChat';
