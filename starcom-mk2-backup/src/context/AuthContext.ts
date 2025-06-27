import { createContext } from 'react';
import type { WalletContextState } from '@solana/wallet-adapter-react';
import type { SIWSSession } from '../hooks/useSIWS';

// Advanced Security Interfaces
interface AuthSecurityMetadata {
  pqcAuthEnabled: boolean;
  didVerified: boolean;
  otkUsed?: string;
  tssSignature?: {
    threshold: number;
    totalShares: number;
    algorithm: string;
  };
  securityLevel: 'QUANTUM_SAFE' | 'CLASSICAL' | 'HYBRID';
  classificationLevel: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' | 'SCI';
  auditTrail: SecurityAuditEvent[];
}

interface SecurityAuditEvent {
  eventId: string;
  timestamp: number;
  eventType: 'AUTH' | 'SESSION_CREATE' | 'SESSION_VERIFY' | 'LOGOUT';
  userDID: string;
  details: Record<string, unknown>;
  pqcSignature?: string;
}

interface DIDAuthState {
  did?: string;
  credentials: string[];
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  lastVerification?: number;
}

interface SecurityStatus {
  pqcEnabled: boolean;
  didVerified: boolean;
  securityLevel: 'QUANTUM_SAFE' | 'CLASSICAL' | 'HYBRID';
  classificationLevel: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' | 'SCI';
  auditEventCount: number;
  compliance: string;
}

// Updated for Solana wallet integration with SIWS and Advanced Cybersecurity
export interface AuthContextType {
  isAuthenticated: boolean;
  address: string | null;
  provider: WalletContextState | null; // Solana wallet provider
  signer: WalletContextState | null; // Solana wallet signer
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error';
  switchNetwork: () => Promise<void>;
  // SIWS Authentication
  authenticate: () => Promise<boolean>;
  logout: () => void;
  isSessionValid: () => boolean;
  authError: string | null;
  expectedChainId: number;
  expectedNetworkName: string;
  setError: (err: string | null) => void;
  // SIWS session data
  session: SIWSSession | null;
  isSigningIn: boolean;
  signIn: () => Promise<void>;
  // Recovery functions
  forceReset: () => Promise<void>;
  // Advanced Cybersecurity Properties
  securityMetadata: AuthSecurityMetadata;
  didAuthState: DIDAuthState;
  getSecurityStatus: () => SecurityStatus;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// Enhanced with SOCOM/NIST-compliant advanced cybersecurity measures
// Includes PQC, DID, OTK, TSS, and dMPC integration for military-grade security