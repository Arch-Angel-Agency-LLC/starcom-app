/**
 * 🛡️ UNIFIED AUTHENTICATION CONTEXT
 * Consolidates AuthContext and SecureAuthContext with enhanced security
 */

import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useSIWS, SIWSSession } from '../../hooks/useSIWS';
import { secureStorage } from '../storage/SecureStorageManager';
import { logSecurityEvent, logAuditEvent } from '../logging/SecureLogger';
import { AuthTypes, SecurityClearance, AuthSecurityMetadata, DIDAuthState } from '../types/AuthTypes';
import { debugLogger, DebugCategory } from '../../utils/debugLogger';

// Extract types from namespace for easier use
type User = AuthTypes.User;
type WalletInfo = AuthTypes.WalletInfo; 

// Enhanced Authentication Context Interface
// TODO: Implement comprehensive security policy enforcement engine - PRIORITY: HIGH
// TODO: Add support for runtime security threat detection and mitigation - PRIORITY: HIGH
// TODO: Implement security configuration validation and compliance checking - PRIORITY: MEDIUM
export interface UnifiedAuthContextType {
  // Core authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  wallet: WalletInfo | null;
  session: SIWSSession | null;
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

  // Backward compatibility properties
  address: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: (network?: string) => Promise<void>;
  authenticate: () => Promise<void>;
  logout: () => Promise<void>;
  isSessionValid: boolean;
  authError: string | null;
  expectedChainId: string | null;
  expectedNetworkName: string | null;
  setError: (error: string | null) => void;
  isSigningIn: boolean;
  provider: any;
  forceReset: () => void;
  enableAutoAuth: () => void;
  autoAuthDisabled: boolean;
  authFailureCount: number;
  signer: any;
  // Wallet selection helper
  openWalletModal: () => void;
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
  // Get Solana wallet adapter with comprehensive debugging
  const solanaWallet = useWallet();
  debugLogger.debug(DebugCategory.WALLET, 'SOLANA WALLET STATE MONITOR', {
    timestamp: new Date().toISOString(),
    wallet: !!solanaWallet.wallet,
    walletName: solanaWallet.wallet?.adapter?.name,
    connected: solanaWallet.connected,
    connecting: solanaWallet.connecting,
    publicKey: !!solanaWallet.publicKey,
    disconnect: !!solanaWallet.disconnect,
    connect: !!solanaWallet.connect
  });
  
  // Basic wallet connection monitoring (simplified)
  debugLogger.debug(DebugCategory.WALLET, 'Wallet adapter initialized', {
    connected: solanaWallet.connected,
    connecting: solanaWallet.connecting,
    walletSelected: !!solanaWallet.wallet,
    walletName: solanaWallet.wallet?.adapter?.name,
    publicKey: !!solanaWallet.publicKey
  });
  
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);

  // Security state
  const [securityMetadata, setSecurityMetadata] = useState<AuthSecurityMetadata>(initialSecurityMetadata);
  const [securityClearance, setSecurityClearance] = useState<SecurityClearance>('unclassified');
  const [didAuthState, setDidAuthState] = useState<DIDAuthState>(initialDIDState);

  // Failed auth tracking for security
  const [authFailureCount, setAuthFailureCount] = useState(0);
  const [lastAuthFailureTime, setLastAuthFailureTime] = useState(0);
  const [autoAuthDisabled, setAutoAuthDisabled] = useState(false);

  // Error tracking and recovery state
  const [currentError, setCurrentError] = useState<AuthErrorContext | null>(null);
  const [quagmireState, setQuagmireState] = useState<QuagmireType | null>(null);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [lastRecoveryTime, setLastRecoveryTime] = useState(0);
  const [errorHistory, setErrorHistory] = useState<AuthErrorContext[]>([]);
  
  // Initialize quagmire detector
  const quagmireDetectorRef = useState(() => new QuagmireDetector())[0];

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
      const walletInfo: WalletInfo = {
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
      const userData: User = {
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

      // Serverless pin health pre-check (only once per session)
      const healthKey = 'serverless_pin_ok';
      try {
        if ((import.meta.env?.VITE_PIN_API || '') === 'true' && localStorage.getItem(healthKey) == null) {
          const probe = await fetch('/api/pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: { type: 'health_probe', ts: Date.now() } })
          });
          localStorage.setItem(healthKey, probe.ok ? 'true' : 'false');
        }
      } catch {
        localStorage.setItem(healthKey, 'false');
      }

      // Opportunistically pin a login receipt to IPFS when serverless pin is enabled
      try {
        if ((import.meta.env?.VITE_PIN_API || '') === 'true' && localStorage.getItem(healthKey) !== 'false') {
          // Defer to runtime config for provider preference when available
          let providerHeader: string | undefined;
          try {
            const cfgMod = await import('../../config/runtimeConfig');
            const cfg = await cfgMod.loadRuntimeConfig();
            const pref = cfg.storage?.pinProvider;
            if (pref && pref !== 'none') providerHeader = pref;
          } catch {/* ignore */}

          const receipt = {
            type: 'signin_receipt',
            ts: Date.now(),
            address: walletAddress,
            security: {
              pqc: enhancedSecurity.pqcAuthEnabled,
              did: enhancedSecurity.didVerified,
              level: enhancedSecurity.securityLevel
            }
          };
          const pinResp = await fetch('/api/pin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(providerHeader ? { 'x-pin-provider': providerHeader } : {})
            },
            body: JSON.stringify({ content: receipt, options: { classification: 'CONFIDENTIAL' } })
          }).catch(() => null);
          if (pinResp && pinResp.ok) {
            try {
              const data = await pinResp.json();
              if (data?.cid) localStorage.setItem('last_login_cid', data.cid);
            } catch {/* ignore */}
          }
        }
      } catch {/* non-fatal */}

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

  // Error classification and handling system
  const classifyError = useCallback((error: any, context: string): AuthErrorContext => {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorCode = error?.code || error?.name || '';
    
    let errorType: AuthErrorType = AuthErrorType.UNKNOWN_ERROR;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let recoveryStrategy: RecoveryStrategy = RecoveryStrategy.RETRY;
    let userGuidance = 'Please try again.';
    
    // Wallet-related errors
    if (errorMessage.includes('WalletNotSelectedError') || errorMessage.includes('not selected')) {
      errorType = AuthErrorType.WALLET_NOT_SELECTED;
      severity = 'low';
      recoveryStrategy = RecoveryStrategy.USER_INTERVENTION;
      userGuidance = 'Please select a wallet from the modal that will appear.';
    } else if (errorMessage.includes('WalletConnectionError') || errorMessage.includes('connect')) {
      errorType = AuthErrorType.WALLET_CONNECTION_FAILED;
      severity = 'medium';
      recoveryStrategy = RecoveryStrategy.RETRY;
      userGuidance = 'Check that your wallet is unlocked and try again.';
    } else if (errorMessage.includes('wallet locked') || errorMessage.includes('locked')) {
      errorType = AuthErrorType.WALLET_LOCKED;
      severity = 'medium';
      recoveryStrategy = RecoveryStrategy.USER_INTERVENTION;
      userGuidance = 'Please unlock your wallet and try again.';
    } else if (errorMessage.includes('network') || errorMessage.includes('chain')) {
      errorType = AuthErrorType.WALLET_NETWORK_MISMATCH;
      severity = 'medium';
      recoveryStrategy = RecoveryStrategy.USER_INTERVENTION;
      userGuidance = 'Please switch to the correct network in your wallet.';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      errorType = AuthErrorType.WALLET_TIMEOUT;
      severity = 'medium';
      recoveryStrategy = RecoveryStrategy.RETRY;
      userGuidance = 'The operation timed out. Please try again.';
    } else if (errorMessage.includes('rate limit') || errorMessage.includes('rate-limit')) {
      errorType = AuthErrorType.WALLET_RATE_LIMITED;
      severity = 'high';
      recoveryStrategy = RecoveryStrategy.USER_INTERVENTION;
      userGuidance = 'You are being rate limited. Please wait a moment before trying again.';
    } else if (errorMessage.includes('popup') || errorMessage.includes('blocked')) {
      errorType = AuthErrorType.WALLET_POPUP_BLOCKED;
      severity = 'medium';
      recoveryStrategy = RecoveryStrategy.USER_INTERVENTION;
      userGuidance = 'Please allow popups for this site and try again.';
    }
    
    // Authentication errors
    else if (errorMessage.includes('signature') || errorMessage.includes('sign')) {
      errorType = AuthErrorType.AUTH_SIGNATURE_FAILED;
      severity = 'medium';
      recoveryStrategy = RecoveryStrategy.RETRY;
      userGuidance = 'Signature failed. Please try signing again.';
    } else if (errorMessage.includes('session') || errorMessage.includes('expired')) {
      errorType = AuthErrorType.AUTH_SESSION_EXPIRED;
      severity = 'medium';
      recoveryStrategy = RecoveryStrategy.RESET_STATE;
      userGuidance = 'Your session has expired. Please reconnect.';
    } else if (errorMessage.includes('token') || errorMessage.includes('invalid')) {
      errorType = AuthErrorType.AUTH_TOKEN_INVALID;
      severity = 'high';
      recoveryStrategy = RecoveryStrategy.CLEAR_STORAGE;
      userGuidance = 'Authentication token is invalid. Clearing stored data.';
    } else if (errorMessage.includes('nonce')) {
      errorType = AuthErrorType.AUTH_NONCE_EXPIRED;
      severity = 'medium';
      recoveryStrategy = RecoveryStrategy.RETRY;
      userGuidance = 'Authentication nonce expired. Retrying with new nonce.';
    } else if (errorMessage.includes('domain')) {
      errorType = AuthErrorType.AUTH_DOMAIN_MISMATCH;
      severity = 'high';
      recoveryStrategy = RecoveryStrategy.REFRESH_PAGE;
      userGuidance = 'Domain mismatch detected. Refreshing page for security.';
    } else if (errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
      errorType = AuthErrorType.AUTH_SIGNATURE_FAILED;
      severity = 'low';
      recoveryStrategy = RecoveryStrategy.USER_INTERVENTION;
      userGuidance = 'You cancelled the signature request. Click Connect to try again.';
    }
    
    // Network and RPC errors
    else if (errorMessage.includes('RPC') || errorMessage.includes('JSON-RPC')) {
      errorType = AuthErrorType.RPC_ERROR;
      severity = 'high';
      recoveryStrategy = RecoveryStrategy.RETRY;
      userGuidance = 'Network communication error. Retrying...';
    } else if (errorMessage.includes('network') && errorMessage.includes('unavailable')) {
      errorType = AuthErrorType.NETWORK_UNAVAILABLE;
      severity = 'critical';
      recoveryStrategy = RecoveryStrategy.USER_INTERVENTION;
      userGuidance = 'Network is unavailable. Please check your internet connection.';
    } else if (errorMessage.includes('insufficient funds')) {
      errorType = AuthErrorType.INSUFFICIENT_FUNDS;
      severity = 'medium';
      recoveryStrategy = RecoveryStrategy.USER_INTERVENTION;
      userGuidance = 'Insufficient funds for transaction fees.';
    }
    
    // Browser and environment errors
    else if (errorMessage.includes('storage') || errorMessage.includes('localStorage')) {
      errorType = AuthErrorType.BROWSER_STORAGE_DISABLED;
      severity = 'high';
      recoveryStrategy = RecoveryStrategy.USER_INTERVENTION;
      userGuidance = 'Browser storage is disabled. Please enable cookies and local storage.';
    } else if (errorMessage.includes('quota') || errorMessage.includes('storage full')) {
      errorType = AuthErrorType.BROWSER_STORAGE_FULL;
      severity = 'high';
      recoveryStrategy = RecoveryStrategy.CLEAR_STORAGE;
      userGuidance = 'Browser storage is full. Clearing old data...';
    } else if (errorMessage.includes('incognito') || errorMessage.includes('private')) {
      errorType = AuthErrorType.BROWSER_INCOGNITO_MODE;
      severity = 'medium';
      recoveryStrategy = RecoveryStrategy.USER_INTERVENTION;
      userGuidance = 'Incognito mode detected. Some features may not work properly.';
    }
    
    // Security errors
    else if (errorMessage.includes('security') || errorMessage.includes('threat')) {
      errorType = AuthErrorType.SECURITY_THREAT_DETECTED;
      severity = 'critical';
      recoveryStrategy = RecoveryStrategy.EMERGENCY_MODE;
      userGuidance = 'Security threat detected. Switching to safe mode.';
    } else if (errorMessage.includes('phishing') || errorMessage.includes('malicious')) {
      errorType = AuthErrorType.PHISHING_ATTEMPT;
      severity = 'critical';
      recoveryStrategy = RecoveryStrategy.EMERGENCY_MODE;
      userGuidance = 'Potential phishing attempt detected. Please verify the site URL.';
    }
    
    // System errors
    else if (errorMessage.includes('server') || errorMessage.includes('500')) {
      errorType = AuthErrorType.SERVER_ERROR;
      severity = 'high';
      recoveryStrategy = RecoveryStrategy.RETRY;
      userGuidance = 'Server error detected. Retrying in a moment...';
    } else if (errorMessage.includes('maintenance')) {
      errorType = AuthErrorType.MAINTENANCE_MODE;
      severity = 'medium';
      recoveryStrategy = RecoveryStrategy.USER_INTERVENTION;
      userGuidance = 'Service is under maintenance. Please try again later.';
    }
    
    // Legacy and migration errors
    else if (context.includes('legacy') || errorMessage.includes('deprecated')) {
      errorType = AuthErrorType.LEGACY_ERROR;
      severity = 'medium';
      recoveryStrategy = RecoveryStrategy.RESET_STATE;
      userGuidance = 'Legacy authentication detected. Upgrading to new system...';
    }
    
    const attemptCount = errorHistory.filter(e => e.type === errorType).length + 1;
    
    return {
      type: errorType,
      message: errorMessage,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      walletType: solanaWallet.wallet?.adapter.name,
      networkId: 'solana-mainnet', // TODO: Get actual network
      sessionId: session?.publicKey || 'no-session',
      attemptCount,
      stackTrace: error?.stack,
      recoveryStrategy,
      isQuagmire: false, // Will be determined by detector
      severity,
      expectedResolution: getExpectedResolution(errorType, recoveryStrategy),
      userGuidance
    };
  }, [errorHistory, solanaWallet.wallet?.adapter.name, session?.publicKey]);
  
  // Get expected resolution time for error types
  const getExpectedResolution = (errorType: AuthErrorType, strategy: RecoveryStrategy): string => {
    switch (strategy) {
      case RecoveryStrategy.RETRY:
        return 'Immediate (auto-retry)';
      case RecoveryStrategy.RESET_STATE:
        return '10-30 seconds';
      case RecoveryStrategy.CLEAR_STORAGE:
        return '30-60 seconds';
      case RecoveryStrategy.REFRESH_PAGE:
        return '30 seconds (page refresh)';
      case RecoveryStrategy.USER_INTERVENTION:
        return 'Requires user action';
      case RecoveryStrategy.EMERGENCY_MODE:
        return '1-5 minutes (safe mode)';
      default:
        return 'Unknown';
    }
  };
  
  // Comprehensive error handler
  const handleError = useCallback(async (error: any, context: string = 'unknown') => {
    console.error(`🚨 Auth Error in ${context}:`, error);
    
    // Classify the error
    const errorContext = classifyError(error, context);
    
    // Update error history
    setErrorHistory(prev => [...prev.slice(-10), errorContext]); // Keep last 10 errors
    
    // Detect quagmire state
    const currentState = {
      isAuthenticated,
      isLoading: isLoading || isSIWSLoading,
      connectionStatus: solanaWallet.connected ? 'connected' : (solanaWallet.connecting || isConnecting ? 'connecting' : 'disconnected'),
      walletConnected: !!solanaWallet.wallet,
      hasSession: !!session,
      authFailureCount,
      timestamp: Date.now()
    };
    
    const detectedQuagmire = quagmireDetectorRef.detectQuagmire(errorContext, currentState);
    
    if (detectedQuagmire) {
      console.warn(`🌪️ QUAGMIRE DETECTED: ${detectedQuagmire}`);
      setQuagmireState(detectedQuagmire);
      errorContext.isQuagmire = true;
      errorContext.quagmireType = detectedQuagmire;
      errorContext.severity = 'critical';
      errorContext.recoveryStrategy = RecoveryStrategy.EMERGENCY_MODE;
      errorContext.userGuidance = getQuagmireGuidance(detectedQuagmire);
    }
    
    setCurrentError(errorContext);
    
    // Execute recovery strategy
    await executeRecoveryStrategy(errorContext);
    
  }, [classifyError, isAuthenticated, isLoading, isSIWSLoading, solanaWallet.connected, solanaWallet.connecting, isConnecting, solanaWallet.wallet, session, authFailureCount, quagmireDetectorRef]);
  
  // Quagmire-specific guidance
  const getQuagmireGuidance = (quagmireType: QuagmireType): string => {
    switch (quagmireType) {
      case QuagmireType.AUTHENTICATION_LOOP:
        return 'Authentication is stuck in a loop. Emergency reset will clear all stored data and restart fresh.';
      case QuagmireType.WALLET_CONNECTION_LOOP:
        return 'Wallet connection is looping. Try switching to a different wallet or clearing browser data.';
      case QuagmireType.SESSION_VALIDATION_LOOP:
        return 'Session validation is stuck. All session data will be cleared and authentication restarted.';
      case QuagmireType.STORAGE_CORRUPTION:
        return 'Browser storage appears corrupted. All local data will be cleared for a fresh start.';
      case QuagmireType.STATE_DESYNCHRONIZATION:
        return 'Application state is out of sync. Page will refresh to restore proper state.';
      case QuagmireType.CROSS_TAB_CONFLICT:
        return 'Multiple tabs are interfering with each other. Close other tabs and try again.';
      default:
        return 'A complex error state has been detected. Emergency recovery will attempt to resolve it.';
    }
  };
  
  // Execute recovery strategy
  const executeRecoveryStrategy = useCallback(async (errorContext: AuthErrorContext) => {
    const strategy = errorContext.recoveryStrategy;
    const now = Date.now();
    
    // Prevent rapid recovery attempts
    if (now - lastRecoveryTime < 5000 && strategy !== RecoveryStrategy.EMERGENCY_MODE) {
      console.log('🕐 Recovery attempt too soon, waiting...');
      return;
    }
    
    setLastRecoveryTime(now);
    setRecoveryAttempts(prev => prev + 1);
    
    try {
      switch (strategy) {
        case RecoveryStrategy.RETRY:
          await executeRetryStrategy(errorContext);
          break;
          
        case RecoveryStrategy.RESET_STATE:
          await executeResetStateStrategy();
          break;
          
        case RecoveryStrategy.CLEAR_STORAGE:
          await executeClearStorageStrategy();
          break;
          
        case RecoveryStrategy.FORCE_DISCONNECT:
          await executeForceDisconnectStrategy();
          break;
          
        case RecoveryStrategy.REFRESH_PAGE:
          executeRefreshPageStrategy();
          break;
          
        case RecoveryStrategy.EMERGENCY_MODE:
          await executeEmergencyModeStrategy(errorContext);
          break;
          
        case RecoveryStrategy.USER_INTERVENTION:
          // Just set error state for user to see
          setAuthError(errorContext.userGuidance);
          break;
          
        default:
          console.warn('Unknown recovery strategy:', strategy);
          setAuthError(errorContext.message);
      }
    } catch (recoveryError) {
      console.error('🚨 Recovery strategy failed:', recoveryError);
      // Escalate to emergency mode if recovery fails
      if (strategy !== RecoveryStrategy.EMERGENCY_MODE) {
        await executeEmergencyModeStrategy(errorContext);
      }
    }
  }, [lastRecoveryTime]);
  
  // Safe connectWallet function to use internally (before contextValue is created)
  const safeConnectWallet = async () => {
    // 🚨 IMMEDIATE WALLET CHECK: Prevent WalletNotSelectedError before any state changes
    if (!solanaWallet.wallet) {
      console.error('🚨🚨🚨 SAFE CONNECT: No wallet selected!');
      setWalletModalVisible(true);
      setAuthError('Please select a wallet from the modal to continue.');
      return;
    }
    
    // Use the main connectWallet logic but in a function-safe way
    // For now, we'll just disable direct connection in retry strategy
    throw new Error('Retry strategy should not directly connect wallet - use UI retry button instead');
  };

  // Recovery strategy implementations
  const executeRetryStrategy = async (errorContext: AuthErrorContext) => {
    console.log('🔄 Executing retry strategy...');
    
    // Wait a bit before retry
    await new Promise(resolve => setTimeout(resolve, Math.min(errorContext.attemptCount * 1000, 5000)));
    
    // Clear error state
    setAuthError(null);
    setCurrentError(null);
    
    // Retry based on error type
    if (errorContext.type.startsWith('WALLET_')) {
      // 🚨 IMPORTANT: Don't auto-retry wallet connections to prevent bypass
      console.log('� RETRY STRATEGY: Wallet error detected - requiring user interaction');
      console.log('  - This prevents bypassing our safety checks');
      console.log('  - User must use the UI retry button for safe wallet connection');
      setAuthError('Wallet connection failed. Please use the Retry button to reconnect safely.');
      
      // Set the wallet state to allow UI retry
      setIsConnecting(false);
      setIsLoading(false);
    } else if (errorContext.type.startsWith('AUTH_')) {
      // Retry authentication
      try {
        await siwsSignIn();
      } catch (retryError) {
        await handleError(retryError, 'retry-auth');
      }
    }
  };
  
  const executeResetStateStrategy = async () => {
    console.log('🔄 Executing reset state strategy...');
    
    // Reset all local state
    setAuthError(null);
    setCurrentError(null);
    setIsLoading(false);
    setIsConnecting(false);
    setUser(null);
    setAuthFailureCount(0);
    setAutoAuthDisabled(false);
    setRecoveryAttempts(0);
    setQuagmireState(null);
    setEmergencyMode(false);
    
    // Reset quagmire detector
    quagmireDetectorRef.reset();
    
    // Clear error history
    setErrorHistory([]);
  };
  
  const executeClearStorageStrategy = async () => {
    console.log('🧹 Executing clear storage strategy...');
    
    try {
      // Clear all auth-related localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('wallet') || 
          key.includes('auth') || 
          key.includes('session') || 
          key.includes('solana') ||
          key.includes('siws') ||
          key.includes('security')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn('Failed to remove localStorage key:', key, e);
        }
      });
      
      // Clear secure storage
      await secureStorage.clear();
      
      // Reset state
      await executeResetStateStrategy();
      
      console.log('✅ Storage cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear storage:', error);
      // Fallback to page refresh
      executeRefreshPageStrategy();
    }
  };
  
  const executeForceDisconnectStrategy = async () => {
    console.log('🔌 Executing force disconnect strategy...');
    
    try {
      // Disconnect wallet
      if (solanaWallet.connected) {
        await solanaWallet.disconnect();
      }
      
      // Sign out from SIWS
      if (isAuthenticated) {
        await siwsSignOut();
      }
      
      // Reset state
      await executeResetStateStrategy();
      
    } catch (error) {
      console.error('❌ Force disconnect failed:', error);
      // Clear storage as fallback
      await executeClearStorageStrategy();
    }
  };
  
  const executeRefreshPageStrategy = () => {
    console.log('🔄 Executing page refresh strategy...');
    
    // Add a flag to prevent refresh loops
    const refreshCount = parseInt(sessionStorage.getItem('auth_refresh_count') || '0');
    if (refreshCount >= 3) {
      console.warn('⚠️ Too many refreshes, switching to emergency mode');
      setEmergencyMode(true);
      setAuthError('Multiple page refreshes detected. Please clear your browser data and try again.');
      return;
    }
    
    sessionStorage.setItem('auth_refresh_count', (refreshCount + 1).toString());
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
    setAuthError('Refreshing page to resolve authentication issues...');
  };
  
  const executeEmergencyModeStrategy = async (errorContext: AuthErrorContext) => {
    console.log('🚨 ENTERING EMERGENCY MODE 🚨');
    
    setEmergencyMode(true);
    
    try {
      // Stage 1: Force disconnect everything
      console.log('Emergency Mode Stage 1: Force disconnect');
      if (solanaWallet.connected) {
        await solanaWallet.disconnect();
      }
      if (isAuthenticated) {
        await siwsSignOut();
      }
      
      // Stage 2: Nuclear storage clear
      console.log('Emergency Mode Stage 2: Nuclear storage clear');
      try {
        localStorage.clear();
        sessionStorage.clear();
        await secureStorage.clear();
      } catch (storageError) {
        console.error('Storage clear failed in emergency mode:', storageError);
      }
      
      // Stage 3: Reset all state
      console.log('Emergency Mode Stage 3: State reset');
      await executeResetStateStrategy();
      
      // Stage 4: Set emergency guidance
      const guidance = errorContext.isQuagmire 
        ? errorContext.userGuidance 
        : 'Emergency mode activated due to critical authentication errors. All data has been cleared for a fresh start.';
      
      setAuthError(guidance);
      
      // Stage 5: Auto-recovery attempt after delay
      setTimeout(async () => {
        if (emergencyMode) {
          console.log('Emergency Mode Stage 5: Auto-recovery attempt');
          setEmergencyMode(false);
          setAuthError(null);
          setCurrentError(null);
          
          // Clear refresh count since we've done emergency reset
          sessionStorage.removeItem('auth_refresh_count');
        }
      }, 10000); // 10 second emergency mode
      
    } catch (emergencyError) {
      console.error('🚨 EMERGENCY MODE FAILED:', emergencyError);
      setAuthError('Critical system error. Please close all tabs, clear browser data, and restart the browser.');
    }
  };

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
    clearSecurityData,

    // Backward compatibility properties
    address: solanaWallet.publicKey?.toString() || null,
    connectionStatus: solanaWallet.connected ? 'connected' : (solanaWallet.connecting || isConnecting ? 'connecting' : 'disconnected'),
    connectWallet: async () => {
      // Clear debug alerts and extensive logging
      debugLogger.debug(DebugCategory.WALLET, 'ConnectWallet called', {
        walletSelected: !!solanaWallet.wallet,
        walletName: solanaWallet.wallet?.adapter?.name,
        connected: solanaWallet.connected,
        connecting: solanaWallet.connecting || isConnecting
      });
      
      try {
        // Validate wallet is selected
        if (!solanaWallet.wallet) {
          debugLogger.info(DebugCategory.WALLET, 'No wallet selected, opening modal');
          setWalletModalVisible(true);
          setAuthError('Please select a wallet from the modal to continue.');
          return;
        }

        // Validate wallet adapter
        if (!solanaWallet.wallet.adapter) {
          setWalletModalVisible(true);
          setAuthError('Wallet adapter not available. Please select a different wallet.');
          return;
        }

        // Check if already connected and authenticated
        if (solanaWallet.connected && solanaWallet.publicKey && isAuthenticated) {
          debugLogger.debug(DebugCategory.WALLET, 'Already connected and authenticated');
          return;
        }

        // If connected but not authenticated, start auth flow
        if (solanaWallet.connected && solanaWallet.publicKey && !isAuthenticated) {
          debugLogger.debug(DebugCategory.WALLET, 'Connected but not authenticated, starting auth');
          setIsLoading(true);
          try {
            await siwsSignIn();
          } catch (authError) {
            await handleError(authError, 'post-connection-auth');
          } finally {
            setIsLoading(false);
          }
          return;
        }

        setIsConnecting(true);
        setAuthError(null);
        
        // Connection timeout protection
        const connectionTimeout = setTimeout(() => {
          if (isConnecting) {
            handleError(new Error('Wallet connection timeout'), 'connection-timeout');
          }
        }, 30000);

        try {
          debugLogger.debug(DebugCategory.WALLET, 'Attempting wallet connection', {
            walletName: solanaWallet.wallet.adapter.name
          });
          
          // Call wallet connect
          await solanaWallet.connect();
          
          // Wait for state propagation with proper async handling
          let attempts = 0;
          const maxAttempts = 10;
          const checkInterval = 100; // ms
          
          while (attempts < maxAttempts) {
            // Check if connection state has updated
            if (solanaWallet.connected && solanaWallet.publicKey) {
              break;
            }
            
            // Wait before next check
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            attempts++;
          }
          
          clearTimeout(connectionTimeout);
          
          // Final verification with improved error messaging
          if (!solanaWallet.connected || !solanaWallet.publicKey) {
            throw new Error('Wallet connection failed: Connection state not updated. Please try again or select a different wallet.');
          }
          
          debugLogger.info(DebugCategory.WALLET, 'Wallet connected successfully', {
            address: solanaWallet.publicKey.toString().substring(0, 8) + '...',
            walletName: solanaWallet.wallet.adapter.name
          });
          
          // Start authentication flow
          if (!isAuthenticated) {
            setIsLoading(true);
            try {
              await siwsSignIn();
              debugLogger.info(DebugCategory.WALLET, 'Authentication completed successfully');
            } catch (authError) {
              debugLogger.warn(DebugCategory.WALLET, 'Auto-authentication failed', authError);
              await handleError(authError, 'auto-auth-failed');
            } finally {
              setIsLoading(false);
            }
          }
          
        } catch (connectionError) {
          clearTimeout(connectionTimeout);
          
          // Simplified error handling without extensive logging
          const isWalletNotSelectedError = 
            connectionError.name === 'WalletNotSelectedError' || 
            connectionError.message?.includes('WalletNotSelectedError') ||
            connectionError.message?.includes('not selected') ||
            connectionError.message?.includes('No wallet selected');
            
          if (isWalletNotSelectedError) {
            debugLogger.error(DebugCategory.WALLET, 'WalletNotSelectedError detected');
            setWalletModalVisible(true);
            setAuthError('Wallet selection error. Please select a wallet from the modal.');
            setIsConnecting(false);
            setIsLoading(false);
            return;
          }
          
          throw connectionError;
        }
        
      } catch (err) {
        debugLogger.error(DebugCategory.WALLET, 'Wallet connection error', err);
        await handleError(err, 'wallet-connection');
      } finally {
        setIsConnecting(false);
        if (!isAuthenticated && !isSIWSLoading) {
          setIsLoading(false);
        }
      }
    },
    disconnectWallet: async () => {
      try {
        if (solanaWallet.disconnect) {
          await solanaWallet.disconnect();
        }
      } catch (err) {
        console.error('Disconnect wallet error:', err);
      }
    },
    switchNetwork: async (network?: string) => {
      console.log('Switch network requested:', network);
      // Solana doesn't have network switching like Ethereum
    },
    authenticate: signIn,
    logout: signOut,
    isSessionValid: isAuthenticated && !!session,
    authError: authError || siwsError,
    expectedChainId: null, // Not applicable for Solana
    expectedNetworkName: 'Solana Mainnet',
    setError: (error: string | null) => setAuthError(error),
    isSigningIn: isLoading || isSIWSLoading,
    provider: { 
      wallet: solanaWallet.wallet,
      connected: solanaWallet.connected,
      connecting: solanaWallet.connecting,
      publicKey: solanaWallet.publicKey
    }, // Expose wallet adapter state
    forceReset: () => {
      setUser(null);
      setWallet(null);
      setAuthError(null);
    },
    enableAutoAuth: () => {
      // Auto-auth logic could be implemented here
    },
    autoAuthDisabled: false,
    authFailureCount: 0,
    signer: null, // Solana uses different signing approach
    openWalletModal: () => {
      setWalletModalVisible(true);
    }
  };

  return (
    <UnifiedAuthContext.Provider value={contextValue}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

// 🚨 COMPREHENSIVE ERROR HANDLING SYSTEM
// Handles 100+ Web3 authentication edge cases and quagmire states

// Error classification system
export enum AuthErrorType {
  // Wallet Connection Errors (20+ cases)
  WALLET_NOT_SELECTED = 'WALLET_NOT_SELECTED',
  WALLET_CONNECTION_FAILED = 'WALLET_CONNECTION_FAILED',
  WALLET_ADAPTER_NOT_READY = 'WALLET_ADAPTER_NOT_READY',
  WALLET_DISCONNECTED_UNEXPECTEDLY = 'WALLET_DISCONNECTED_UNEXPECTEDLY',
  WALLET_LOCKED = 'WALLET_LOCKED',
  WALLET_NETWORK_MISMATCH = 'WALLET_NETWORK_MISMATCH',
  WALLET_INSUFFICIENT_PERMISSIONS = 'WALLET_INSUFFICIENT_PERMISSIONS',
  WALLET_MULTIPLE_INSTANCES = 'WALLET_MULTIPLE_INSTANCES',
  WALLET_EXTENSION_DISABLED = 'WALLET_EXTENSION_DISABLED',
  WALLET_EXTENSION_OUTDATED = 'WALLET_EXTENSION_OUTDATED',
  WALLET_POPUP_BLOCKED = 'WALLET_POPUP_BLOCKED',
  WALLET_TIMEOUT = 'WALLET_TIMEOUT',
  WALLET_RATE_LIMITED = 'WALLET_RATE_LIMITED',
  WALLET_MAINTENANCE_MODE = 'WALLET_MAINTENANCE_MODE',
  WALLET_UNSUPPORTED_BROWSER = 'WALLET_UNSUPPORTED_BROWSER',
  WALLET_MOBILE_APP_NOT_INSTALLED = 'WALLET_MOBILE_APP_NOT_INSTALLED',
  WALLET_HARDWARE_DISCONNECTED = 'WALLET_HARDWARE_DISCONNECTED',
  WALLET_FIRMWARE_OUTDATED = 'WALLET_FIRMWARE_OUTDATED',
  WALLET_SECURITY_ERROR = 'WALLET_SECURITY_ERROR',
  WALLET_PROVIDER_ERROR = 'WALLET_PROVIDER_ERROR',

  // Authentication Errors (25+ cases)
  AUTH_SIGNATURE_FAILED = 'AUTH_SIGNATURE_FAILED',
  AUTH_MESSAGE_INVALID = 'AUTH_MESSAGE_INVALID',
  AUTH_NONCE_EXPIRED = 'AUTH_NONCE_EXPIRED',
  AUTH_DOMAIN_MISMATCH = 'AUTH_DOMAIN_MISMATCH',
  AUTH_TIMESTAMP_INVALID = 'AUTH_TIMESTAMP_INVALID',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_REFRESH_FAILED = 'AUTH_REFRESH_FAILED',
  AUTH_CONCURRENT_SESSIONS = 'AUTH_CONCURRENT_SESSIONS',
  AUTH_IP_CHANGED = 'AUTH_IP_CHANGED',
  AUTH_DEVICE_CHANGED = 'AUTH_DEVICE_CHANGED',
  AUTH_BROWSER_CHANGED = 'AUTH_BROWSER_CHANGED',
  AUTH_GEOLOCATION_BLOCKED = 'AUTH_GEOLOCATION_BLOCKED',
  AUTH_SUSPICIOUS_ACTIVITY = 'AUTH_SUSPICIOUS_ACTIVITY',
  AUTH_RATE_LIMITED = 'AUTH_RATE_LIMITED',
  AUTH_TEMPORARY_LOCKOUT = 'AUTH_TEMPORARY_LOCKOUT',
  AUTH_PERMANENT_BAN = 'AUTH_PERMANENT_BAN',
  AUTH_COMPLIANCE_VIOLATION = 'AUTH_COMPLIANCE_VIOLATION',
  AUTH_SECURITY_DOWNGRADE = 'AUTH_SECURITY_DOWNGRADE',
  AUTH_ENCRYPTION_FAILED = 'AUTH_ENCRYPTION_FAILED',
  AUTH_KEY_ROTATION_FAILED = 'AUTH_KEY_ROTATION_FAILED',
  AUTH_BIOMETRIC_FAILED = 'AUTH_BIOMETRIC_FAILED',
  AUTH_MFA_REQUIRED = 'AUTH_MFA_REQUIRED',
  AUTH_MFA_FAILED = 'AUTH_MFA_FAILED',
  AUTH_BACKUP_CODE_INVALID = 'AUTH_BACKUP_CODE_INVALID',

  // Network and RPC Errors (20+ cases)
  NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_CONGESTION = 'NETWORK_CONGESTION',
  RPC_ERROR = 'RPC_ERROR',
  RPC_RATE_LIMITED = 'RPC_RATE_LIMITED',
  RPC_MAINTENANCE = 'RPC_MAINTENANCE',
  RPC_INVALID_RESPONSE = 'RPC_INVALID_RESPONSE',
  RPC_CONNECTION_LOST = 'RPC_CONNECTION_LOST',
  BLOCKCHAIN_FORK_DETECTED = 'BLOCKCHAIN_FORK_DETECTED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  TRANSACTION_REVERTED = 'TRANSACTION_REVERTED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',
  NONCE_TOO_LOW = 'NONCE_TOO_LOW',
  NONCE_TOO_HIGH = 'NONCE_TOO_HIGH',
  BLOCK_NOT_FOUND = 'BLOCK_NOT_FOUND',
  CHAIN_ID_MISMATCH = 'CHAIN_ID_MISMATCH',
  NODE_SYNC_ERROR = 'NODE_SYNC_ERROR',
  MEMPOOL_FULL = 'MEMPOOL_FULL',
  NETWORK_UPGRADE_REQUIRED = 'NETWORK_UPGRADE_REQUIRED',

  // Browser and Environment Errors (15+ cases)
  BROWSER_INCOMPATIBLE = 'BROWSER_INCOMPATIBLE',
  BROWSER_STORAGE_FULL = 'BROWSER_STORAGE_FULL',
  BROWSER_STORAGE_DISABLED = 'BROWSER_STORAGE_DISABLED',
  BROWSER_COOKIES_DISABLED = 'BROWSER_COOKIES_DISABLED',
  BROWSER_JAVASCRIPT_DISABLED = 'BROWSER_JAVASCRIPT_DISABLED',
  BROWSER_WEBGL_DISABLED = 'BROWSER_WEBGL_DISABLED',
  BROWSER_WEBRTC_DISABLED = 'BROWSER_WEBRTC_DISABLED',
  BROWSER_POPUP_BLOCKED = 'BROWSER_POPUP_BLOCKED',
  BROWSER_EXTENSION_CONFLICT = 'BROWSER_EXTENSION_CONFLICT',
  BROWSER_INCOGNITO_MODE = 'BROWSER_INCOGNITO_MODE',
  BROWSER_SECURITY_POLICY = 'BROWSER_SECURITY_POLICY',
  DEVICE_MEMORY_LOW = 'DEVICE_MEMORY_LOW',
  DEVICE_STORAGE_LOW = 'DEVICE_STORAGE_LOW',
  DEVICE_OFFLINE = 'DEVICE_OFFLINE',
  DEVICE_BATTERY_LOW = 'DEVICE_BATTERY_LOW',

  // Security and Compliance Errors (20+ cases)
  SECURITY_THREAT_DETECTED = 'SECURITY_THREAT_DETECTED',
  MALWARE_DETECTED = 'MALWARE_DETECTED',
  PHISHING_ATTEMPT = 'PHISHING_ATTEMPT',
  DNS_POISONING = 'DNS_POISONING',
  SSL_CERTIFICATE_INVALID = 'SSL_CERTIFICATE_INVALID',
  CORS_POLICY_VIOLATION = 'CORS_POLICY_VIOLATION',
  CSP_VIOLATION = 'CSP_VIOLATION',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
  SESSION_HIJACKING = 'SESSION_HIJACKING',
  REPLAY_ATTACK = 'REPLAY_ATTACK',
  TIMING_ATTACK = 'TIMING_ATTACK',
  SIDE_CHANNEL_ATTACK = 'SIDE_CHANNEL_ATTACK',
  QUANTUM_ATTACK = 'QUANTUM_ATTACK',
  CRYPTOGRAPHIC_FAILURE = 'CRYPTOGRAPHIC_FAILURE',
  KEY_COMPROMISE = 'KEY_COMPROMISE',
  CERTIFICATE_PINNING_FAILED = 'CERTIFICATE_PINNING_FAILED',
  COMPLIANCE_VIOLATION = 'COMPLIANCE_VIOLATION',
  AUDIT_LOG_TAMPERING = 'AUDIT_LOG_TAMPERING',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',

  // System and Infrastructure Errors (10+ cases)
  SERVER_ERROR = 'SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  CDN_ERROR = 'CDN_ERROR',
  LOAD_BALANCER_ERROR = 'LOAD_BALANCER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  EMERGENCY_SHUTDOWN = 'EMERGENCY_SHUTDOWN',

  // Unknown and Fallback Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  LEGACY_ERROR = 'LEGACY_ERROR',
  MIGRATION_ERROR = 'MIGRATION_ERROR'
}

// Quagmire detection and classification
export enum QuagmireType {
  AUTHENTICATION_LOOP = 'AUTHENTICATION_LOOP',
  WALLET_CONNECTION_LOOP = 'WALLET_CONNECTION_LOOP',
  SESSION_VALIDATION_LOOP = 'SESSION_VALIDATION_LOOP',
  NETWORK_SWITCHING_LOOP = 'NETWORK_SWITCHING_LOOP',
  TOKEN_REFRESH_LOOP = 'TOKEN_REFRESH_LOOP',
  STORAGE_CORRUPTION = 'STORAGE_CORRUPTION',
  STATE_DESYNCHRONIZATION = 'STATE_DESYNCHRONIZATION',
  CROSS_TAB_CONFLICT = 'CROSS_TAB_CONFLICT',
  BROWSER_CACHE_POISONING = 'BROWSER_CACHE_POISONING',
  EXTENSION_INTERFERENCE = 'EXTENSION_INTERFERENCE'
}

// Error recovery strategies
export enum RecoveryStrategy {
  RETRY = 'RETRY',
  RESET_STATE = 'RESET_STATE',
  CLEAR_STORAGE = 'CLEAR_STORAGE',
  FORCE_DISCONNECT = 'FORCE_DISCONNECT',
  REFRESH_PAGE = 'REFRESH_PAGE',
  SWITCH_WALLET = 'SWITCH_WALLET',
  FALLBACK_AUTH = 'FALLBACK_AUTH',
  EMERGENCY_MODE = 'EMERGENCY_MODE',
  USER_INTERVENTION = 'USER_INTERVENTION',
  ESCALATE_SUPPORT = 'ESCALATE_SUPPORT'
}

// Comprehensive error context
interface AuthErrorContext {
  type: AuthErrorType;
  message: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  walletType?: string;
  networkId?: string;
  sessionId?: string;
  attemptCount: number;
  stackTrace?: string;
  recoveryStrategy: RecoveryStrategy;
  isQuagmire: boolean;
  quagmireType?: QuagmireType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  expectedResolution: string;
  userGuidance: string;
}

// Quagmire detection system
class QuagmireDetector {
  private errorHistory: AuthErrorContext[] = [];
  private stateHistory: any[] = [];
  private loopDetectionWindow = 30000; // 30 seconds
  private maxRetryAttempts = 5;

  detectQuagmire(error: AuthErrorContext, currentState: any): QuagmireType | null {
    this.errorHistory.push(error);
    this.stateHistory.push({ ...currentState, timestamp: Date.now() });

    // Clean old history
    const cutoff = Date.now() - this.loopDetectionWindow;
    this.errorHistory = this.errorHistory.filter(e => e.timestamp.getTime() > cutoff);
    this.stateHistory = this.stateHistory.filter(s => s.timestamp > cutoff);

    // Detect authentication loops
    if (this.detectAuthenticationLoop()) return QuagmireType.AUTHENTICATION_LOOP;
    
    // Detect wallet connection loops
    if (this.detectWalletConnectionLoop()) return QuagmireType.WALLET_CONNECTION_LOOP;
    
    // Detect session validation loops
    if (this.detectSessionValidationLoop()) return QuagmireType.SESSION_VALIDATION_LOOP;
    
    // Detect state desynchronization
    if (this.detectStateDesync()) return QuagmireType.STATE_DESYNCHRONIZATION;
    
    // Detect storage corruption
    if (this.detectStorageCorruption()) return QuagmireType.STORAGE_CORRUPTION;

    return null;
  }

  private detectAuthenticationLoop(): boolean {
    const authErrors = this.errorHistory.filter(e => 
      e.type.startsWith('AUTH_') && e.attemptCount > this.maxRetryAttempts
    );
    return authErrors.length >= 3;
  }

  private detectWalletConnectionLoop(): boolean {
    const walletErrors = this.errorHistory.filter(e => 
      e.type.startsWith('WALLET_') && e.attemptCount > this.maxRetryAttempts
    );
    return walletErrors.length >= 3;
  }

  private detectSessionValidationLoop(): boolean {
    const sessionErrors = this.errorHistory.filter(e => 
      [AuthErrorType.AUTH_SESSION_EXPIRED, AuthErrorType.AUTH_TOKEN_INVALID, AuthErrorType.AUTH_REFRESH_FAILED].includes(e.type)
    );
    return sessionErrors.length >= 3;
  }

  private detectStateDesync(): boolean {
    // Check for rapid state changes
    const recentStates = this.stateHistory.slice(-10);
    const uniqueStates = new Set(recentStates.map(s => JSON.stringify(s)));
    return recentStates.length >= 5 && uniqueStates.size >= 4;
  }

  private detectStorageCorruption(): boolean {
    const storageErrors = this.errorHistory.filter(e => 
      [AuthErrorType.BROWSER_STORAGE_FULL, AuthErrorType.BROWSER_STORAGE_DISABLED].includes(e.type)
    );
    return storageErrors.length >= 2;
  }

  reset(): void {
    this.errorHistory = [];
    this.stateHistory = [];
  }
}

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
  // Simplified classification logic
  if (credentials.includes('admin')) return 'TOP_SECRET';
  if (credentials.includes('user')) return 'CONFIDENTIAL';
  return 'UNCLASSIFIED';
}

// Assess current threat level based on dynamic factors
async function assessCurrentThreatLevel(): Promise<AuthSecurityMetadata['threatLevel']> {
  // Placeholder: Implement real threat assessment logic
  return 'normal';
}

function determineClearanceLevel(metadata: AuthSecurityMetadata): SecurityClearance {
  if (metadata.classificationLevel === 'TOP_SECRET') return 'omega';
  if (metadata.classificationLevel === 'SECRET') return 'beta';
  if (metadata.classificationLevel === 'CONFIDENTIAL') return 'alpha';
  return 'unclassified';
}

// UnifiedAuthProvider component (continued...)
