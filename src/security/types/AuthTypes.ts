/**
 * Authentication Types - Unified Authentication Interface
 * 
 * Consolidates all authentication-related types from across the application
 * into a single, comprehensive type definition file.
 */

// TODO: Add support for authentication integration with external identity providers - PRIORITY: LOW
// TODO: Implement authentication risk assessment and adaptive security measures - PRIORITY: MEDIUM
// TODO: Add comprehensive authentication testing and security validation - PRIORITY: MEDIUM
// Re-export from SecurityHardening for compatibility
export type { SecurityClearance, ThreatLevel } from './SecurityHardening';
// Import for use within namespace
import type { SecurityClearance as SC } from './SecurityHardening';

// Core Authentication Types Namespace
export namespace AuthTypes {
  export interface User {
    id: string;
    address: string;
    did?: string;
    securityClearance: SC;
    lastLogin: Date;
    authMethod: string;
  }

  export interface WalletInfo {
    address: string;
    type: string;
    connected: boolean;
    name: string;
  }

  export interface Session {
    id: string;
    userId: string;
    walletAddress: string;
    createdAt: Date;
    expiresAt: Date;
    lastActivity: Date;
  }
}

// Advanced Security Metadata
export interface AuthSecurityMetadata {
  pqcAuthEnabled: boolean;
  didVerified: boolean;
  otkUsed?: string;
  tssSignature?: {
    threshold: number;
    totalShares: number;
    algorithm: string;
  };
  securityLevel: 'QUANTUM_SAFE' | 'CLASSICAL' | 'HYBRID';
  classificationLevel: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  threatLevel: 'normal' | 'elevated' | 'high' | 'critical';
  lastSecurityCheck: Date;
  auditTrail: SecurityAuditEvent[];
  encryptionContext: {
    algorithm: string;
    isQuantumSafe: boolean;
    keyRotationInterval: number;
  };
}

export interface SecurityAuditEvent {
  eventId: string;
  timestamp: number;
  eventType: 'DID_VERIFICATION' | 'PQC_AUTHENTICATION' | 'SECURITY_ROTATION' | 'SESSION_VALIDATION';
  userAddress: string;
  result: 'SUCCESS' | 'FAILURE' | 'PENDING';
  metadata?: Record<string, unknown>;
}

export interface DIDAuthState {
  did?: string;
  credentials: string[];
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  lastVerification?: number;
  trustScore: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthTypes.User | null;
  walletConnected: boolean;
  connectionType: WalletConnectionType | null;
  securityClearance: SC;
  sessionExpiry: Date | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType {
  // State
  authState: AuthState;
  
  // Authentication Actions
  connect: (walletType: WalletConnectionType) => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  verifySignature: (message: string, signature: string) => Promise<boolean>;
  
  // Session Management
  refreshSession: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  clearSession: () => void;
  
  // Security Operations
  updateSecurityClearance: (clearance: SC) => void;
  validateSecurityContext: () => Promise<boolean>;
}

// Wallet Connection Types
export type WalletConnectionType = 
  | 'phantom'
  | 'solflare'
  | 'ledger'
  | 'web3auth'
  | 'metamask';

// Progressive Authentication
export interface ProgressiveAuthState {
  level: AuthLevel;
  permissions: Permission[];
  restrictions: string[];
  lastEscalation: Date | null;
}

export type AuthLevel = 
  | 'anonymous'
  | 'basic'
  | 'verified'
  | 'authenticated'
  | 'secure'
  | 'classified';

export interface Permission {
  resource: string;
  action: string;
  level: AuthLevel;
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  type: 'time' | 'location' | 'device' | 'clearance';
  value: string;
  operator: 'equals' | 'greater' | 'less' | 'contains';
}

// Session Management
export interface AuthSessionData {
  sessionId: string;
  userId: string;
  walletAddress: string;
  securityClearance: SC;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  deviceFingerprint: string;
  ipAddress: string;
}

export interface SessionValidationResult {
  isValid: boolean;
  reason?: string;
  shouldRefresh: boolean;
  newExpiryTime?: Date;
}

// Authentication Events
export interface AuthEvent {
  type: AuthEventType;
  timestamp: Date;
  userId?: string;
  details: Record<string, any>;
  securityLevel: SC;
}

export type AuthEventType =
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'session_refresh'
  | 'session_expired'
  | 'wallet_connected'
  | 'wallet_disconnected'
  | 'permission_granted'
  | 'permission_denied'
  | 'security_escalation'
  | 'security_violation';

// DID (Decentralized Identity) Types
export interface DIDDocument {
  id: string;
  authentication: DIDAuthenticationMethod[];
  service: DIDService[];
  verificationMethod: DIDVerificationMethod[];
  created: Date;
  updated: Date;
}

export interface DIDAuthenticationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
}

export interface DIDService {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface DIDVerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase: string;
}

// Multi-Factor Authentication
export interface MFAConfig {
  enabled: boolean;
  methods: MFAMethod[];
  requiredMethods: number;
  backupCodes: string[];
}

export interface MFAMethod {
  type: MFAMethodType;
  enabled: boolean;
  verified: boolean;
  metadata: Record<string, any>;
}

export type MFAMethodType =
  | 'totp'
  | 'sms'
  | 'email'
  | 'hardware_key'
  | 'biometric'
  | 'backup_codes';

// Biometric Authentication
export interface BiometricConfig {
  enabled: boolean;
  supportedMethods: BiometricMethod[];
  enrolledMethods: BiometricMethod[];
  fallbackMethod: string;
}

export type BiometricMethod =
  | 'fingerprint'
  | 'face_recognition'
  | 'voice_recognition'
  | 'iris_scan';

// Hardware Security
export interface HardwareSecurityModule {
  available: boolean;
  type: string;
  attestation: string;
  keyStorage: boolean;
  secureElement: boolean;
}

// Earth Alliance Integration
export interface EarthAllianceIdentity {
  did: string;
  clearanceLevel: SC;
  organizationUnit: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDate: Date | null;
  attestationChain: string[];
}

// Authentication Configuration
export interface AuthConfig {
  // Session Settings
  sessionTimeout: number; // milliseconds
  refreshThreshold: number; // milliseconds before expiry
  maxConcurrentSessions: number;
  
  // Security Settings
  requireMFA: boolean;
  allowedWalletTypes: WalletConnectionType[];
  minimumSecurityClearance: SC;
  
  // Progressive Auth Settings
  enableProgressiveAuth: boolean;
  autoEscalatePermissions: boolean;
  permissionCacheTimeout: number;
  
  // Biometric Settings
  enableBiometrics: boolean;
  biometricFallback: boolean;
  
  // DID Settings
  requireDIDVerification: boolean;
  trustedDIDRegistries: string[];
}

// Error Types
export interface AuthError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  metadata?: Record<string, any>;
}

export type AuthErrorCode =
  | 'WALLET_NOT_CONNECTED'
  | 'SIGNATURE_VERIFICATION_FAILED'
  | 'SESSION_EXPIRED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'MFA_REQUIRED'
  | 'BIOMETRIC_FAILED'
  | 'DID_VERIFICATION_FAILED'
  | 'SECURITY_CLEARANCE_INSUFFICIENT'
  | 'HARDWARE_SECURITY_UNAVAILABLE'
  | 'PROGRESSIVE_AUTH_ESCALATION_REQUIRED';
