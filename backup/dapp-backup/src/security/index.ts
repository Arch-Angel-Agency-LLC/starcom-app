/**
 * 🛡️ SECURITY MODULE - UNIFIED EXPORTS
 * Centralized exports for all security-related functionality
 */

// Core Security Types
export * from './types/SecurityHardening';
export * from './types/AuthTypes';

// Storage & Logging
export { SecureStorageManager, secureStorage } from './storage/SecureStorageManager';
export { SecureLogger, secureLogger, logSecurityEvent, logAuditEvent } from './logging/SecureLogger';

// Advanced Security Service
export { AdvancedSecurityService } from './core/AdvancedSecurityService';

// Authentication Context
export { UnifiedAuthProvider } from './context/AuthContext';
export { useUnifiedAuth } from './context/useUnifiedAuth';
export type { UnifiedAuthContextType } from './context/AuthContext';

// Re-export commonly used types for compatibility
export type {
  SecurityClearance,
  ThreatLevel,
  AuthSecurityMetadata,
  DIDAuthState,
  SecurityAuditEvent,
  AuthTypes
} from './types/AuthTypes';
