/**
 * 🛡️ UNIFIED AUTHENTICATION CONTEXT
 * Consolidates AuthContext and SecureAuthContext with enhanced security
 */

import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useSIWS } from '../../hooks/useSIWS';
import { secureStorage } from '../storage/SecureStorageManager';
import { logSecurityEvent, logAuditEvent } from '../logging/SecureLogger';
import { AuthTypes, SecurityClearance, AuthSecurityMetadata, DIDAuthState } from '../types/AuthTypes';

// Enhanced Authentication Context Interface
export interface UnifiedAuthContextType {
  // Core authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthTypes['User'] | null;
  wallet: AuthTypes['WalletInfo'] | null;
  session: AuthTypes['Session'] | null;
  error: string | null;

  // Security metadata
  securityMetadata: AuthSecurityMetadata;
  securityClearance: SecurityClearance;
  didAuthState: DIDAuthState;

  // Authentication methods
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  
  // Advanced security methods
  enableQuantumSafeAuth: () => Promise<boolean>;
  rotateSecurity: () => Promise<void>;
  validateSecurityLevel: () => Promise<boolean>;
  
  // Emergency methods
  emergencyLockdown: () => Promise<void>;
  clearSecurityData: () => Promise<void>;
}

// Security configuration
const AUTH_SECURITY_CONFIG = {
  PQC_AUTH_REQUIRED: true,
  DID_VERIFICATION_REQUIRED: true,
  OTK_SESSION_KEYS: true,
  TSS_MULTI_PARTY_AUTH: true,
  ZERO_TRUST_VALIDATION: true,
  QUANTUM_SAFE_SESSIONS: true,
  BIOMETRIC_ENHANCEMENT: false,
  COMPLIANCE_STANDARDS: ['NIST-CSF-2.0', 'STIG', 'CNSA-2.0']
};

// Create the context
export const UnifiedAuthContext = createContext<UnifiedAuthContextType | null>(null);

// Initial security metadata
const initialSecurityMetadata: AuthSecurityMetadata = {
  pqcAuthEnabled: false,
  didVerified: false,
  securityLevel: 'CLASSICAL',
  classificationLevel: 'UNCLASSIFIED',
  auditTrail: [],
  threatLevel: 'normal',
  lastSecurityCheck: new Date(),
  encryptionContext: {
    algorithm: 'AES-256-GCM',
    isQuantumSafe: false,
    keyRotationInterval: 3600000 // 1 hour
  }
};

const initialDIDState: DIDAuthState = {
  credentials: [],
  verificationStatus: 'PENDING',
  trustScore: 0
};

/**
 * Unified Authentication Provider
 */
export const UnifiedAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Solana wallet integration
  const solanaWallet = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  
  // SIWS integration
  const { 
    session, 
    isAuthenticated, 
    isLoading: isSIWSLoading, 
    error: siwsError, 
    signIn: siwsSignIn, 
    signOut: siwsSignOut 
  } = useSIWS();

  // Authentication state
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<AuthTypes['User'] | null>(null);
  const [wallet, setWallet] = useState<AuthTypes['WalletInfo'] | null>(null);

  // Security state
  const [securityMetadata, setSecurityMetadata] = useState<AuthSecurityMetadata>(initialSecurityMetadata);
  const [securityClearance, setSecurityClearance] = useState<SecurityClearance>('unclassified');
  const [didAuthState, setDidAuthState] = useState<DIDAuthState>(initialDIDState);

  // Failed auth tracking for security
  const [authFailureCount, setAuthFailureCount] = useState(0);
  const [lastAuthFailureTime, setLastAuthFailureTime] = useState(0);
  const [autoAuthDisabled, setAutoAuthDisabled] = useState(false);

  // Initialize security monitoring
  useEffect(() => {
    const initializeSecurity = async () => {
      try {
        // Load persisted security state
        const persistedSecurity = await secureStorage.getItem<AuthSecurityMetadata>('auth_security_metadata');
        if (persistedSecurity) {
          setSecurityMetadata(persistedSecurity);
        }

        // Load security clearance
        const clearance = await secureStorage.getItem<SecurityClearance>('security_clearance');
        if (clearance) {
          setSecurityClearance(clearance);
        }

        logSecurityEvent('AUTH_SYSTEM_INITIALIZED', 'SUCCESS', {
          component: 'UnifiedAuthProvider',
          classification: 'CONFIDENTIAL'
        });

      } catch (error) {
        console.error('Failed to initialize security:', error);
        logSecurityEvent('AUTH_SYSTEM_INIT_FAILED', 'FAILURE', {
          component: 'UnifiedAuthProvider',
          classification: 'SECRET'
        }, { error: String(error) });
      }
    };

    initializeSecurity();
  }, []);

  // Monitor wallet connection changes
  useEffect(() => {
    if (solanaWallet.publicKey) {
      const walletInfo: AuthTypes['WalletInfo'] = {
        address: solanaWallet.publicKey.toString(),
        type: 'solana',
        connected: solanaWallet.connected,
        name: solanaWallet.wallet?.adapter.name || 'Unknown'
      };
      setWallet(walletInfo);

      logSecurityEvent('WALLET_CONNECTED', 'SUCCESS', {
        component: 'UnifiedAuthProvider',
        classification: 'CONFIDENTIAL',
        userId: walletInfo.address
      });
    } else {
      setWallet(null);
    }
  }, [solanaWallet.publicKey, solanaWallet.connected, solanaWallet.wallet]);

  // Advanced security authentication process
  const performAdvancedAuthSecurity = useCallback(async (
    walletAddress: string
  ): Promise<AuthSecurityMetadata> => {
    const auditTrail: AuthSecurityMetadata['auditTrail'] = [];
    
    try {
      setIsLoading(true);

      // 1. DID Verification
      let didVerified = false;
      if (AUTH_SECURITY_CONFIG.DID_VERIFICATION_REQUIRED) {
        const didResult = await verifyUserDID(walletAddress);
        didVerified = didResult.verified;
        
        setDidAuthState(prev => ({
          ...prev,
          did: didResult.did,
          credentials: didResult.credentials,
          verificationStatus: didVerified ? 'VERIFIED' : 'FAILED',
          lastVerification: Date.now(),
          trustScore: didVerified ? 0.8 : 0.2
        }));
        
        auditTrail.push({
          eventId: `did-auth-${Date.now()}`,
          timestamp: Date.now(),
          eventType: 'DID_VERIFICATION',
          userAddress: walletAddress,
          result: didVerified ? 'SUCCESS' : 'FAILURE',
          metadata: { credentials: didResult.credentials }
        });
      }

      // 2. Post-Quantum Cryptography Enhancement
      let pqcAuthEnabled = false;
      let otkUsed: string | undefined;
      if (AUTH_SECURITY_CONFIG.PQC_AUTH_REQUIRED) {
        const pqcResult = await enhanceWithPQCAuth(walletAddress);
        pqcAuthEnabled = pqcResult.enabled;
        otkUsed = pqcResult.otkId;
        
        auditTrail.push({
          eventId: `pqc-auth-${Date.now()}`,
          timestamp: Date.now(),
          eventType: 'PQC_AUTHENTICATION',
          userAddress: walletAddress,
          result: pqcAuthEnabled ? 'SUCCESS' : 'FAILURE',
          metadata: { algorithm: 'ML-DSA-65', otkUsed }
        });
      }

      // 3. Determine security levels
      const securityLevel = determineSecurityLevel(pqcAuthEnabled, didVerified);
      const classificationLevel = determineClassificationLevel(didAuthState.credentials);
      const threatLevel = await assessCurrentThreatLevel();

      const metadata: AuthSecurityMetadata = {
        pqcAuthEnabled,
        didVerified,
        otkUsed,
        securityLevel,
        classificationLevel,
        auditTrail,
        threatLevel,
        lastSecurityCheck: new Date(),
        encryptionContext: {
          algorithm: pqcAuthEnabled ? 'ML-KEM-768' : 'AES-256-GCM',
          isQuantumSafe: pqcAuthEnabled,
          keyRotationInterval: pqcAuthEnabled ? 1800000 : 3600000 // 30min vs 1hr
        }
      };

      // Persist security metadata
      await secureStorage.setItem('auth_security_metadata', metadata, {
        classification: 'SECRET',
        ttl: 3600000 // 1 hour
      });

      return metadata;
      
    } catch (error) {
      logSecurityEvent('ADVANCED_AUTH_FAILED', 'FAILURE', {
        component: 'UnifiedAuthProvider',
        classification: 'SECRET',
        userId: walletAddress
      }, { error: String(error) });

      // Return secure fallback
      return {
        ...initialSecurityMetadata,
        auditTrail,
        lastSecurityCheck: new Date()
      };
    } finally {
      setIsLoading(false);
    }
  }, [didAuthState.credentials]);

  // Sign in with enhanced security
  const signIn = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setAuthError(null);

      // Check for auth lockout
      if (autoAuthDisabled) {
        throw new Error('Authentication temporarily disabled due to security concerns');
      }

      // Ensure wallet is connected
      if (!solanaWallet.connected || !solanaWallet.publicKey) {
        setWalletModalVisible(true);
        return;
      }

      const walletAddress = solanaWallet.publicKey.toString();

      // Perform SIWS authentication
      await siwsSignIn();

      // Perform advanced security checks
      const enhancedSecurity = await performAdvancedAuthSecurity(walletAddress);
      setSecurityMetadata(enhancedSecurity);

      // Determine security clearance
      const clearance = determineClearanceLevel(enhancedSecurity);
      setSecurityClearance(clearance);
      await secureStorage.setItem('security_clearance', clearance);

      // Create user object
      const userData: AuthTypes['User'] = {
        id: walletAddress,
        address: walletAddress,
        did: didAuthState.did,
        securityClearance: clearance,
        lastLogin: new Date(),
        authMethod: 'wallet_siws'
      };
      setUser(userData);

      // Reset failure count on success
      setAuthFailureCount(0);

      logAuditEvent('USER_SIGNIN', walletAddress, 'SUCCESS', {
        component: 'UnifiedAuthProvider',
        classification: 'SECRET'
      }, {
        securityLevel: enhancedSecurity.securityLevel,
        clearance,
        pqcEnabled: enhancedSecurity.pqcAuthEnabled
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthError(errorMessage);
      
      // Track failures for security
      const newFailureCount = authFailureCount + 1;
      setAuthFailureCount(newFailureCount);
      setLastAuthFailureTime(Date.now());

      // Auto-disable after too many failures
      if (newFailureCount >= 5) {
        setAutoAuthDisabled(true);
        setTimeout(() => setAutoAuthDisabled(false), 300000); // 5 minute lockout
      }

      logSecurityEvent('USER_SIGNIN_FAILED', 'FAILURE', {
        component: 'UnifiedAuthProvider',
        classification: 'SECRET',
        threatLevel: newFailureCount >= 3 ? 'elevated' : 'normal'
      }, {
        error: errorMessage,
        failureCount: newFailureCount,
        autoLockout: newFailureCount >= 5
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [solanaWallet, siwsSignIn, performAdvancedAuthSecurity, authFailureCount, autoAuthDisabled, setWalletModalVisible, didAuthState.did]);

  // Clear security data helper
  const clearSecurityData = useCallback(async (): Promise<void> => {
    try {
      await secureStorage.removeItem('auth_security_metadata');
      await secureStorage.removeItem('security_clearance');
      await secureStorage.removeItem('did_credentials');
    } catch (error) {
      console.error('Failed to clear security data:', error);
    }
  }, []);

  // Validate current security level
  const validateSecurityLevel = useCallback(async (): Promise<boolean> => {
    try {
      const currentTime = Date.now();
      const lastCheck = securityMetadata.lastSecurityCheck.getTime();
      const timeSinceCheck = currentTime - lastCheck;

      // Require security refresh every hour
      if (timeSinceCheck > 3600000) {
        return false;
      }

      // Check threat level escalation
      const currentThreatLevel = await assessCurrentThreatLevel();
      if (currentThreatLevel === 'critical' && securityMetadata.threatLevel !== 'critical') {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Security validation failed:', error);
      return false;
    }
  }, [securityMetadata]);

  // Sign out with secure cleanup
  const signOut = useCallback(async (): Promise<void> => {
    try {
      const userId = user?.id || 'unknown';

      // Clear session
      await siwsSignOut();
      
      // Clear local state
      setUser(null);
      setSecurityMetadata(initialSecurityMetadata);
      setSecurityClearance('unclassified');
      setDidAuthState(initialDIDState);
      setAuthError(null);
      setAuthFailureCount(0);

      // Clear secure storage
      await clearSecurityData();

      logAuditEvent('USER_SIGNOUT', userId, 'SUCCESS', {
        component: 'UnifiedAuthProvider',
        classification: 'CONFIDENTIAL'
      });

    } catch (error) {
      console.error('Error during sign out:', error);
      logSecurityEvent('USER_SIGNOUT_FAILED', 'FAILURE', {
        component: 'UnifiedAuthProvider',
        classification: 'SECRET'
      }, { error: String(error) });
    }
  }, [user, siwsSignOut, clearSecurityData]);

  // Refresh session with security validation
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      if (!isAuthenticated || !wallet) {
        return false;
      }

      // Validate current security state
      const isSecurityValid = await validateSecurityLevel();
      if (!isSecurityValid) {
        await signOut();
        return false;
      }

      // Refresh session data
      const refreshedSecurity = await performAdvancedAuthSecurity(wallet.address);
      setSecurityMetadata(refreshedSecurity);

      return true;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }, [isAuthenticated, wallet, validateSecurityLevel, signOut, performAdvancedAuthSecurity]);

  // Enable quantum-safe authentication
  const enableQuantumSafeAuth = useCallback(async (): Promise<boolean> => {
    try {
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      const pqcResult = await enhanceWithPQCAuth(wallet.address);
      
      if (pqcResult.enabled) {
        setSecurityMetadata(prev => ({
          ...prev,
          pqcAuthEnabled: true,
          securityLevel: 'QUANTUM_SAFE',
          encryptionContext: {
            ...prev.encryptionContext,
            algorithm: 'ML-KEM-768',
            isQuantumSafe: true
          }
        }));

        logSecurityEvent('QUANTUM_SAFE_AUTH_ENABLED', 'SUCCESS', {
          component: 'UnifiedAuthProvider',
          classification: 'TOP_SECRET',
          userId: wallet.address
        });

        return true;
      }

      return false;
    } catch (error) {
      logSecurityEvent('QUANTUM_SAFE_AUTH_FAILED', 'FAILURE', {
        component: 'UnifiedAuthProvider',
        classification: 'SECRET'
      }, { error: String(error) });
      return false;
    }
  }, [wallet]);

  // Rotate security credentials
  const rotateSecurity = useCallback(async (): Promise<void> => {
    try {
      // Rotate storage encryption keys
      secureStorage.rotateEncryptionKeys();

      // Update security metadata
      setSecurityMetadata(prev => ({
        ...prev,
        lastSecurityCheck: new Date(),
        auditTrail: [
          ...prev.auditTrail,
          {
            eventId: `security-rotation-${Date.now()}`,
            timestamp: Date.now(),
            eventType: 'SECURITY_ROTATION',
            userAddress: wallet?.address || 'system',
            result: 'SUCCESS',
            metadata: { rotationType: 'full_rotation' }
          }
        ]
      }));

      logSecurityEvent('SECURITY_ROTATION', 'SUCCESS', {
        component: 'UnifiedAuthProvider',
        classification: 'SECRET'
      });

    } catch (error) {
      logSecurityEvent('SECURITY_ROTATION_FAILED', 'FAILURE', {
        component: 'UnifiedAuthProvider',
        classification: 'SECRET'
      }, { error: String(error) });
      throw error;
    }
  }, [wallet]);

  // Emergency lockdown
  const emergencyLockdown = useCallback(async (): Promise<void> => {
    try {
      // Immediately sign out
      await signOut();

      // Clear all secure storage
      secureStorage.clear();

      // Disable auto-auth for extended period
      setAutoAuthDisabled(true);

      logSecurityEvent('EMERGENCY_LOCKDOWN', 'SUCCESS', {
        component: 'UnifiedAuthProvider',
        classification: 'TOP_SECRET',
        threatLevel: 'critical'
      });

    } catch (error) {
      logSecurityEvent('EMERGENCY_LOCKDOWN_FAILED', 'FAILURE', {
        component: 'UnifiedAuthProvider',
        classification: 'TOP_SECRET'
      }, { error: String(error) });
    }
  }, [signOut]);

  // Context value
  const contextValue: UnifiedAuthContextType = {
    // Core state
    isAuthenticated,
    isLoading: isLoading || isSIWSLoading,
    user,
    wallet,
    session,
    error: authError || siwsError,

    // Security state
    securityMetadata,
    securityClearance,
    didAuthState,

    // Methods
    signIn,
    signOut,
    refreshSession,
    enableQuantumSafeAuth,
    rotateSecurity,
    validateSecurityLevel,
    emergencyLockdown,
    clearSecurityData
  };

  return (
    <UnifiedAuthContext.Provider value={contextValue}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

// Helper functions (simplified implementations)
async function verifyUserDID(_walletAddress: string) {
  // Placeholder for DID verification
  return {
    verified: false,
    did: `did:solana:${_walletAddress}`,
    credentials: ['basic_user']
  };
}

async function enhanceWithPQCAuth(_walletAddress: string) {
  // Placeholder for PQC authentication
  return {
    enabled: Math.random() > 0.5, // Simulate 50% success rate
    otkId: `otk_${Date.now()}`
  };
}

function determineSecurityLevel(pqcEnabled: boolean, didVerified: boolean): AuthSecurityMetadata['securityLevel'] {
  if (pqcEnabled && didVerified) return 'QUANTUM_SAFE';
  if (pqcEnabled || didVerified) return 'HYBRID';
  return 'CLASSICAL';
}

function determineClassificationLevel(credentials: string[]): AuthSecurityMetadata['classificationLevel'] {
  if (credentials.includes('top_secret')) return 'TOP_SECRET';
  if (credentials.includes('secret')) return 'SECRET';
  if (credentials.includes('confidential')) return 'CONFIDENTIAL';
  return 'UNCLASSIFIED';
}

function determineClearanceLevel(metadata: AuthSecurityMetadata): SecurityClearance {
  if (metadata.classificationLevel === 'TOP_SECRET') return 'omega';
  if (metadata.classificationLevel === 'SECRET') return 'beta';
  if (metadata.classificationLevel === 'CONFIDENTIAL') return 'alpha';
  return 'unclassified';
}

async function assessCurrentThreatLevel(): Promise<AuthSecurityMetadata['threatLevel']> {
  // Placeholder for threat assessment
  return 'normal';
}

export default UnifiedAuthContext;
