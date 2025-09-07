/**
 * 🗣️ COMMUNICATION MODULE - UNIFIED EXPORTS
 * Centralized exports for all communication-related functionality
 */

// Chat Context and Providers (legacy) — fully removed
// (SecureChatProvider, useSecureChat, and SecureChatContextType were deleted)

// Communication Types
export * from './types/SecureChat';

// Communication Services (none; legacy duplicate removed)

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
