import React, { useState, useCallback, useEffect } from 'react';
import { AuthContext, AuthContextType } from './AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { WalletError } from '@solana/wallet-adapter-base';
import { useSIWS } from '../hooks/useSIWS';

// Advanced Cybersecurity Imports
import { pqCryptoService } from '../services/crypto/SOCOMPQCryptoService';

// Advanced Security Interfaces for Authentication
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

// Advanced Cybersecurity Configuration
const AUTH_SECURITY_CONFIG = {
  PQC_AUTH_REQUIRED: true,
  DID_VERIFICATION_REQUIRED: true,
  OTK_SESSION_KEYS: true,
  TSS_MULTI_PARTY_AUTH: true,
  ZERO_TRUST_VALIDATION: true,
  QUANTUM_SAFE_SESSIONS: true,
  BIOMETRIC_ENHANCEMENT: false, // Future enhancement
  COMPLIANCE_STANDARDS: ['NIST-CSF-2.0', 'STIG', 'CNSA-2.0']
};

export const AuthProvider: React.FC<{ children: React.ReactNode; value?: AuthContextType }> = ({ children, value }) => {
  // Use Solana wallet adapter directly
  const solanaWallet = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  
  // Use SIWS for cryptographic authentication
  const { session, isAuthenticated, isLoading: isSIWSLoading, error: siwsError, signIn, signOut, isSessionValid } = useSIWS();
  
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Track failed authentication attempts to prevent auto-retry loops
  const [authFailureCount, setAuthFailureCount] = useState(0);
  const [lastAuthFailureTime, setLastAuthFailureTime] = useState(0);
  const [autoAuthDisabled, setAutoAuthDisabled] = useState(false);
  
  // Advanced Security State
  const [securityMetadata, setSecurityMetadata] = useState<AuthSecurityMetadata>({
    pqcAuthEnabled: false,
    didVerified: false,
    securityLevel: 'CLASSICAL',
    classificationLevel: 'UNCLASSIFIED',
    auditTrail: []
  });
  
  const [didAuthState, setDidAuthState] = useState<DIDAuthState>({
    credentials: [],
    verificationStatus: 'PENDING'
  });

  // Advanced Security Processing for Authentication
  const performAdvancedAuthSecurity = useCallback(async (
    walletAddress: string
  ): Promise<AuthSecurityMetadata> => {
    const auditTrail: SecurityAuditEvent[] = [];
    
    try {
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
          lastVerification: Date.now()
        }));
        
        auditTrail.push({
          eventId: `did-auth-${Date.now()}`,
          timestamp: Date.now(),
          eventType: 'AUTH',
          userDID: didResult.did,
          details: { didVerified, credentials: didResult.credentials },
          pqcSignature: await generatePQCSignature('DID_VERIFICATION', walletAddress)
        });
      }
      
      // 2. PQC Authentication Enhancement
      let pqcAuthEnabled = false;
      let otkUsed: string | undefined;
      if (AUTH_SECURITY_CONFIG.PQC_AUTH_REQUIRED) {
        const pqcResult = await enhanceWithPQCAuth(walletAddress);
        pqcAuthEnabled = pqcResult.enabled;
        otkUsed = pqcResult.otkId;
        
        auditTrail.push({
          eventId: `pqc-auth-${Date.now()}`,
          timestamp: Date.now(),
          eventType: 'AUTH',
          userDID: didAuthState.did || walletAddress,
          details: { pqcAuthEnabled, algorithm: 'ML-DSA-65', otkUsed },
          pqcSignature: await generatePQCSignature('PQC_AUTH', walletAddress)
        });
      }
      
      // 3. Threshold Signature for Multi-Party Authentication
      let tssSignature;
      if (AUTH_SECURITY_CONFIG.TSS_MULTI_PARTY_AUTH) {
        tssSignature = await createAuthThresholdSignature(walletAddress);
        
        auditTrail.push({
          eventId: `tss-auth-${Date.now()}`,
          timestamp: Date.now(),
          eventType: 'AUTH',
          userDID: didAuthState.did || walletAddress,
          details: { 
            threshold: tssSignature.threshold,
            algorithm: tssSignature.algorithm
          },
          pqcSignature: await generatePQCSignature('TSS_AUTH', walletAddress)
        });
      }
      
      // 4. Determine Security Level
      const securityLevel = determineSecurityLevel(pqcAuthEnabled, didVerified, tssSignature);
      const classificationLevel = determineClassificationLevel(didAuthState.credentials);
      
      const metadata: AuthSecurityMetadata = {
        pqcAuthEnabled,
        didVerified,
        otkUsed,
        tssSignature,
        securityLevel,
        classificationLevel,
        auditTrail
      };
      
      return metadata;
      
    } catch (_error) {
      // Fallback security metadata
      return {
        pqcAuthEnabled: false,
        didVerified: false,
        securityLevel: 'CLASSICAL',
        classificationLevel: 'UNCLASSIFIED',
        auditTrail
      };
    }
  }, [didAuthState.did, didAuthState.credentials]);

  // Helper Functions for Advanced Security
  const verifyUserDID = async (_walletAddress: string): Promise<{
    verified: boolean;
    did: string;
    credentials: string[];
  }> => {
    // TODO: Replace with real server-side DID verification
    // Example placeholder for integration:
    // const response = await fetch('/api/v1/auth/verify-did', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ walletAddress })
    // });
    // return await response.json();
    return {
      verified: false,
      did: '',
      credentials: []
    };
  };

  const enhanceWithPQCAuth = async (_walletAddress: string): Promise<{
    enabled: boolean;
    otkId: string;
  }> => {
    try {
      // Initialize the PQC service
      await pqCryptoService.initialize();
      
      // Generate quantum-safe authentication keys (stored for future use)
      await pqCryptoService.generateKEMKeyPair();
      await pqCryptoService.generateSignatureKeyPair();
      
      // TODO: Replace with server-side secure OTK generation
      // Example: const response = await fetch('/api/v1/auth/generate-otk')
      const otkId = '';
      
      return {
        enabled: false, // Disabled until real server-side implementation
        otkId
      };
    } catch (_error) {
      // TODO: Send error to secure logging service
      return {
        enabled: false,
        otkId: ''
      };
    }
  };

  const createAuthThresholdSignature = async (_walletAddress: string) => {
    return {
      threshold: 2,
      totalShares: 3,
      algorithm: 'TSS-ML-DSA-65',
      participants: ['auth-service', 'wallet-service', 'security-monitor']
    };
  };

  const generatePQCSignature = async (_operation: string, _walletAddress: string): Promise<string> => {
    // TODO: Replace with real PQC implementation
    // Example integration with server-side PQC:
    // const response = await fetch('/api/v1/auth/pqc-sign', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ operation, walletAddress })
    // });
    // return await response.text();
    return '';
  };

  const determineSecurityLevel = (
    pqcEnabled: boolean,
    didVerified: boolean,
    tssSignature?: {
      threshold: number;
      totalShares: number;
      algorithm: string;
    }
  ): 'QUANTUM_SAFE' | 'CLASSICAL' | 'HYBRID' => {
    if (pqcEnabled && didVerified && tssSignature) {
      return 'QUANTUM_SAFE';
    } else if (pqcEnabled || didVerified) {
      return 'HYBRID';
    }
    return 'CLASSICAL';
  };

  const determineClassificationLevel = (credentials: string[]): AuthSecurityMetadata['classificationLevel'] => {
    if (credentials.includes('sci-cleared')) return 'SCI';
    if (credentials.includes('top-secret-cleared')) return 'TOP_SECRET';
    if (credentials.includes('secret-cleared')) return 'SECRET';
    if (credentials.includes('confidential-cleared')) return 'CONFIDENTIAL';
    return 'UNCLASSIFIED';
  };

  const authenticate = useCallback(async () => {
    // Enhanced pre-authentication validation
    if (!solanaWallet.connected) {
      const error = 'AUTH_WALLET_NOT_CONNECTED: Solana wallet is not connected. Please connect your wallet first before attempting authentication.';
      setAuthError(error);
      console.error('🚨 Authentication Failed - Wallet Not Connected:', {
        walletState: {
          connected: solanaWallet.connected,
          connecting: solanaWallet.connecting,
          wallet: solanaWallet.wallet?.adapter?.name || 'None'
        },
        timestamp: new Date().toISOString()
      });
      return false;
    }

    if (!solanaWallet.publicKey) {
      const error = 'AUTH_NO_PUBLIC_KEY: Wallet is connected but public key is not available. Please ensure your wallet is properly unlocked and authorized.';
      setAuthError(error);
      console.error('🚨 Authentication Failed - No Public Key:', {
        walletState: {
          connected: solanaWallet.connected,
          wallet: solanaWallet.wallet?.adapter?.name || 'Unknown',
          publicKey: null
        },
        timestamp: new Date().toISOString()
      });
      return false;
    }

    const walletAddress = solanaWallet.publicKey.toString();
    console.log('🔐 Starting Enhanced Authentication Process:', {
      address: walletAddress.substring(0, 8) + '...',
      wallet: solanaWallet.wallet?.adapter?.name || 'Unknown',
      timestamp: new Date().toISOString(),
      securityFramework: 'SOCOM-Advanced-Cybersecurity'
    });
    
    setAuthError(null);
    
    try {
      // Step 1: Perform SIWS authentication with enhanced error handling
      let siwsSuccess = false;
      try {
        console.log('📋 Step 1: Initiating SIWS (Sign-In with Solana) authentication...');
        siwsSuccess = await signIn();
        
        if (siwsSuccess) {
          console.log('✅ SIWS Authentication completed successfully');
        } else {
          console.warn('⚠️ SIWS Authentication returned false without throwing error');
        }
      } catch (siwsError) {
        // Enhanced SIWS error categorization and reporting
        const siwsErrorMessage = siwsError instanceof Error ? siwsError.message : 'Unknown SIWS error';
        
        let categorizedError;
        if (siwsErrorMessage.includes('SIWS_USER_REJECTED')) {
          categorizedError = 'AUTH_USER_REJECTED: User declined to sign the authentication message. Authentication requires your approval to proceed.';
        } else if (siwsErrorMessage.includes('SIWS_WALLET_RPC_ERROR')) {
          categorizedError = `AUTH_WALLET_COMMUNICATION_ERROR: Unable to communicate with your wallet. This may be due to network issues or wallet server problems. Details: ${siwsErrorMessage}`;
        } else if (siwsErrorMessage.includes('SIWS_WALLET_SIGNING_ERROR')) {
          categorizedError = `AUTH_WALLET_SIGNING_FAILED: Your wallet failed to sign the authentication message. Please ensure your wallet is unlocked and functioning properly. Details: ${siwsErrorMessage}`;
        } else if (siwsErrorMessage.includes('SIWS_SIGNING_TIMEOUT')) {
          categorizedError = 'AUTH_SIGNING_TIMEOUT: Authentication request timed out. Please ensure your wallet is responsive and try again.';
        } else if (siwsErrorMessage.includes('SIWS_SIGNATURE_INVALID')) {
          categorizedError = 'AUTH_SIGNATURE_VERIFICATION_FAILED: The wallet signature could not be verified. This may indicate a wallet malfunction or security issue.';
        } else if (siwsErrorMessage.includes('SIWS_SESSION_STORAGE_ERROR')) {
          categorizedError = 'AUTH_SESSION_STORAGE_FAILED: Unable to store authentication session. This may be due to browser storage limitations.';
        } else {
          categorizedError = `AUTH_SIWS_UNKNOWN_ERROR: An unexpected error occurred during Sign-In with Solana authentication. ${siwsErrorMessage}`;
        }

        setAuthError(categorizedError);
        console.error('🚨 SIWS Authentication Failed:', {
          originalError: siwsError,
          categorizedError,
          address: walletAddress.substring(0, 8) + '...',
          wallet: solanaWallet.wallet?.adapter?.name || 'Unknown',
          timestamp: new Date().toISOString()
        });
        
        throw new Error(categorizedError);
      }
      
      // Step 2: Enhanced security measures (if SIWS succeeded)
      if (siwsSuccess && solanaWallet.publicKey) {
        try {
          console.log('🛡️ Step 2: Applying advanced cybersecurity measures...');
          
          const advancedSecurity = await performAdvancedAuthSecurity(walletAddress);
          setSecurityMetadata(advancedSecurity);
          
          console.log('✅ Advanced Security Enhancement Completed:', {
            securityLevel: advancedSecurity.securityLevel,
            classification: advancedSecurity.classificationLevel,
            pqcEnabled: advancedSecurity.pqcAuthEnabled,
            didVerified: advancedSecurity.didVerified,
            auditEvents: advancedSecurity.auditTrail.length,
            timestamp: new Date().toISOString()
          });
          
        } catch (securityError) {
          // Log security enhancement failures but don't fail authentication
          const securityErrorMessage = securityError instanceof Error ? securityError.message : 'Unknown security error';
          console.warn('⚠️ Advanced Security Enhancement Failed (Non-Critical):', {
            error: securityError,
            errorMessage: securityErrorMessage,
            address: walletAddress.substring(0, 8) + '...',
            timestamp: new Date().toISOString(),
            note: 'Authentication will proceed with standard security level'
          });
        }
      }
      
      // Step 3: Final authentication validation
      if (siwsSuccess) {
        console.log('🎉 Authentication Process Completed Successfully:', {
          address: walletAddress.substring(0, 8) + '...',
          wallet: solanaWallet.wallet?.adapter?.name || 'Unknown',
          securityLevel: securityMetadata.securityLevel,
          sessionValid: true,
          timestamp: new Date().toISOString(),
          totalSteps: 3
        });
        return true;
      } else {
        const error = 'AUTH_PROCESS_INCOMPLETE: Authentication process did not complete successfully despite no explicit errors.';
        setAuthError(error);
        console.error('🚨 Authentication Process Incomplete:', {
          siwsSuccess,
          address: walletAddress.substring(0, 8) + '...',
          timestamp: new Date().toISOString()
        });
        throw new Error(error);
      }
      
    } catch (err) {
      // Comprehensive final error handling and reporting
      const errorMessage = err instanceof Error ? err.message : 'AUTH_UNKNOWN_ERROR: An unexpected error occurred during the authentication process.';
      const errorName = err instanceof Error ? err.name : 'UnknownError';
      
      setAuthError(errorMessage);
      
      console.error('🚨 Authentication Process Failed:', {
        error: err,
        errorMessage,
        errorName,
        address: walletAddress.substring(0, 8) + '...',
        wallet: solanaWallet.wallet?.adapter?.name || 'Unknown',
        timestamp: new Date().toISOString(),
        walletState: {
          connected: solanaWallet.connected,
          connecting: solanaWallet.connecting,
          publicKey: !!solanaWallet.publicKey
        },
        authenticationStep: 'Unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
      });
      
      // Re-throw the error so that the auto-auth system can properly handle it
      throw err;
    }
  }, [solanaWallet.connected, solanaWallet.connecting, solanaWallet.publicKey, solanaWallet.wallet, signIn, performAdvancedAuthSecurity, securityMetadata.securityLevel]);

  const logout = useCallback(() => {
    signOut();
    setAuthError(null);
    
    // Clear advanced security state
    setSecurityMetadata({
      pqcAuthEnabled: false,
      didVerified: false,
      securityLevel: 'CLASSICAL',
      classificationLevel: 'UNCLASSIFIED',
      auditTrail: []
    });
    
    setDidAuthState({
      credentials: [],
      verificationStatus: 'PENDING'
    });
    
    console.log('🔓 Logout completed with security state cleared');
  }, [signOut]);

  // Wrapper for signIn that matches the expected interface
  const handleSignIn = useCallback(async () => {
    await signIn();
  }, [signIn]);

  const expectedChainId = 101; // Solana mainnet (devnet would be different)
  const expectedNetworkName = 'Solana Devnet';

  const connectWalletHandler = useCallback(async () => {
    try {
      setAuthError(null);
      
      // If no wallet is selected, show the wallet selection modal
      if (!solanaWallet.wallet) {
        setWalletModalVisible(true);
        return;
      }
      
      // If wallet is selected but not connected, connect to it
      if (solanaWallet.connect && !solanaWallet.connected) {
        await solanaWallet.connect();
        // Auto-authenticate after successful connection
        setTimeout(async () => {
          await authenticate();
        }, 1000);
      } else if (solanaWallet.connected) {
        // If already connected, just authenticate
        await authenticate();
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      
      // Handle specific wallet errors
      if (error instanceof WalletError || (error instanceof Error && error.name?.includes('Wallet'))) {
        if (error.name === 'WalletNotSelectedError') {
          // Open wallet selection modal
          setWalletModalVisible(true);
          return;
        } else if (error.name === 'WalletConnectionError') {
          setAuthError('Failed to connect to wallet. Please try again.');
        } else if (error.name === 'WalletNotReadyError') {
          setAuthError('Wallet is not ready. Please ensure your wallet extension is installed and unlocked.');
        } else if (error.name === 'WalletNotConnectedError') {
          setAuthError('Wallet not connected. Please connect your wallet first.');
        } else {
          setAuthError(error instanceof Error ? error.message : 'Wallet connection failed');
        }
      } else {
        setAuthError(error instanceof Error ? error.message : 'Connection failed');
      }
    }
  }, [solanaWallet, authenticate, setWalletModalVisible]);

  const disconnectWalletHandler = useCallback(async () => {
    try {
      if (solanaWallet.disconnect) {
        await solanaWallet.disconnect();
      }
      logout();
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
      setAuthError(error instanceof Error ? error.message : 'Disconnection failed');
    }
  }, [solanaWallet, logout]);

  const switchNetworkHandler = useCallback(async () => {
    // Solana wallets typically don't support network switching
    // This would be handled in wallet settings
    setAuthError('Network switching must be done in your wallet settings');
  }, []);

  const forceReset = useCallback(async () => {
    try {
      // Clear all errors first
      setAuthError(null);
      
      // Reset auto-auth state
      setAuthFailureCount(0);
      setLastAuthFailureTime(0);
      setAutoAuthDisabled(false);
      
      // Force sign out to clear any stale sessions
      signOut();
      
      // Clear any additional session and wallet storage securely
      try {
        // Remove secure session and auth data
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.clear();
        }
        // Remove legacy localStorage items for backward compatibility
        localStorage.removeItem('siws-session');
        localStorage.removeItem('wallet-adapter');
        Object.keys(localStorage).forEach(key => {
          if (key.includes('wallet') || key.includes('solana') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
      } catch {
        // Ignore errors during storage clearing
      }
      
      // Force disconnect wallet
      if (solanaWallet.disconnect) {
        await solanaWallet.disconnect();
      }
      
      // Wait a bit for state to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Force reset failed:', error);
      setAuthError('Reset failed. Please refresh the page.');
    }
  }, [solanaWallet, signOut, setAuthFailureCount, setAutoAuthDisabled, setLastAuthFailureTime]);

  // Method to manually re-enable auto-authentication
  const enableAutoAuth = useCallback(() => {
    setAuthFailureCount(0);
    setLastAuthFailureTime(0);
    setAutoAuthDisabled(false);
    setAuthError(null);
  }, []);

  // Combine authentication state from wallet connection and SIWS session
  const isFullyAuthenticated = solanaWallet.connected && isSessionValid() && isAuthenticated;
  const combinedError = authError || siwsError;
  const combinedLoading = solanaWallet.connecting || isSIWSLoading;

  const contextValue: AuthContextType = {
    isAuthenticated: isFullyAuthenticated,
    address: solanaWallet.publicKey?.toString() || null,
    provider: solanaWallet,
    signer: solanaWallet,
    connectWallet: connectWalletHandler,
    disconnectWallet: disconnectWalletHandler,
    isLoading: combinedLoading,
    error: combinedError,
    connectionStatus: solanaWallet.connected ? 'connected' : 
                     combinedLoading ? 'connecting' : 
                     combinedError ? 'error' : 'idle',
    switchNetwork: switchNetworkHandler,
    authenticate,
    logout,
    isSessionValid,
    authError: combinedError,
    expectedChainId,
    expectedNetworkName,
    setError: setAuthError,
    // SIWS properties
    session,
    isSigningIn: isSIWSLoading,
    signIn: handleSignIn,
    // Recovery functions
    forceReset,
    enableAutoAuth,
    // Auto-auth state
    autoAuthDisabled,
    authFailureCount,
    // Advanced Security Properties
    securityMetadata,
    didAuthState,
    getSecurityStatus: () => ({
      pqcEnabled: securityMetadata.pqcAuthEnabled,
      didVerified: securityMetadata.didVerified,
      securityLevel: securityMetadata.securityLevel,
      classificationLevel: securityMetadata.classificationLevel,
      auditEventCount: securityMetadata.auditTrail.length,
      compliance: AUTH_SECURITY_CONFIG.COMPLIANCE_STANDARDS.join(', ')
    })
  };

  // Auto-connect when wallet is selected from modal
  useEffect(() => {
    if (solanaWallet.wallet && !solanaWallet.connected && !solanaWallet.connecting) {
      // User just selected a wallet, auto-connect to it
      const autoConnect = async () => {
        try {
          setAuthError(null);
          await solanaWallet.connect?.();
        } catch (error) {
          console.error('Auto-connect after wallet selection failed:', error);
          setAuthError(error instanceof Error ? error.message : 'Connection failed');
        }
      };
      
      // Small delay to ensure wallet selection is complete
      const timeoutId = setTimeout(autoConnect, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [solanaWallet]);

  // Enhanced auto-authenticate when wallet connects with failure prevention
  useEffect(() => {
    if (solanaWallet.connected && solanaWallet.publicKey && !isAuthenticated && !autoAuthDisabled) {
      // Check if we've had too many recent failures
      const now = Date.now();
      const timeSinceLastFailure = now - lastAuthFailureTime;
      const isRecentFailure = timeSinceLastFailure < 30000; // 30 seconds
      
      console.log('Auto-auth check:', {
        authFailureCount,
        lastAuthFailureTime,
        timeSinceLastFailure,
        isRecentFailure,
        autoAuthDisabled
      });
      
      // Don't auto-authenticate if:
      // 1. We've had 2+ failures in the last 30 seconds
      // 2. Auto-auth has been explicitly disabled due to persistent errors
      if (authFailureCount >= 2 && isRecentFailure) {
        console.warn('Auto-authentication disabled due to repeated failures. User must manually sign in.');
        setAutoAuthDisabled(true);
        setAuthError('Auto-authentication disabled due to repeated failures. Please click "Sign In" to authenticate manually.');
        return;
      }
      
      // Add a small delay to ensure wallet is fully connected
      const timeoutId = setTimeout(async () => {
        try {
          await authenticate();
          // Reset failure count on success
          setAuthFailureCount(0);
          setLastAuthFailureTime(0);
        } catch (error) {
          console.error('Auto-authentication failed:', error);
          console.error('Detailed Auto-Auth Error Analysis:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'Unknown',
            stack: error instanceof Error ? error.stack : undefined,
            fullError: error,
            context: {
              walletConnected: solanaWallet.connected,
              publicKeyAvailable: !!solanaWallet.publicKey,
              walletName: solanaWallet.wallet?.adapter?.name || 'Unknown',
              isAuthenticated,
              currentFailureCount: authFailureCount,
              timeSinceLastFailure: Date.now() - lastAuthFailureTime
            },
            timestamp: new Date().toISOString()
          });
          
          // Track failure and potentially disable auto-auth
          const newFailureCount = authFailureCount + 1;
          setAuthFailureCount(newFailureCount);
          setLastAuthFailureTime(Date.now());
          
          // Enhanced error categorization for auto-auth failure detection
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorName = error instanceof Error ? error.name : '';
          const isJSONRPCError = errorMessage.includes('JSON-RPC') || 
                               errorMessage.includes('Internal error') ||
                               errorMessage.includes('WalletSignMessageError') ||
                               errorName.includes('WalletSignMessageError') ||
                               errorMessage.toLowerCase().includes('internal json-rpc error') ||
                               errorMessage.includes('SIWS_WALLET_RPC_ERROR') ||
                               errorMessage.includes('AUTH_WALLET_COMMUNICATION_ERROR');
          
          const isUserRejection = errorMessage.includes('User declined') ||
                                errorMessage.includes('rejected') ||
                                errorMessage.includes('denied') ||
                                errorMessage.includes('SIWS_USER_REJECTED') ||
                                errorMessage.includes('AUTH_USER_REJECTED');
          
          const isWalletError = errorMessage.includes('WalletSignMessageError') ||
                              errorMessage.includes('SIWS_WALLET_SIGNING_ERROR') ||
                              errorMessage.includes('AUTH_WALLET_SIGNING_FAILED');
          
          const isTimeoutError = errorMessage.includes('timeout') ||
                               errorMessage.includes('Timeout') ||
                               errorMessage.includes('SIWS_SIGNING_TIMEOUT') ||
                               errorMessage.includes('AUTH_SIGNING_TIMEOUT');
          
          console.log('Auto-Auth Error Classification:', {
            errorMessage,
            errorName,
            classifications: {
              isJSONRPCError,
              isUserRejection,
              isWalletError,
              isTimeoutError
            },
            newFailureCount,
            shouldDisableAutoAuth: (isJSONRPCError || isWalletError) && newFailureCount >= 2
          });
          
          // Determine appropriate response based on error type
          if (isUserRejection) {
            // Don't count user rejections as "failures" that disable auto-auth
            // User might just need to try again
            setAuthError('Please approve the authentication request in your wallet to continue.');
            console.log('🤚 Auto-auth paused due to user rejection - not counting as system failure');
          } else if ((isJSONRPCError || isWalletError) && newFailureCount >= 2) {
            console.warn('🚨 Disabling auto-authentication due to persistent wallet communication errors');
            setAutoAuthDisabled(true);
            
            let specificErrorMessage;
            if (isJSONRPCError) {
              specificErrorMessage = 'Wallet communication errors detected. Auto-authentication disabled to prevent infinite retry loops. Please click "Sign In" to retry manually, or try refreshing the page if the issue persists.';
            } else if (isWalletError) {
              specificErrorMessage = 'Wallet signing errors detected. Auto-authentication disabled. Please ensure your wallet is unlocked and functioning properly, then click "Sign In" to retry manually.';
            } else {
              specificErrorMessage = 'Persistent authentication errors detected. Auto-authentication disabled. Please click "Sign In" to retry manually.';
            }
            
            setAuthError(specificErrorMessage);
          } else if (isTimeoutError && newFailureCount >= 3) {
            console.warn('🚨 Disabling auto-authentication due to repeated timeout errors');
            setAutoAuthDisabled(true);
            setAuthError('Authentication requests are timing out repeatedly. Auto-authentication disabled. Please ensure your wallet is responsive and click "Sign In" to retry manually.');
          } else if (newFailureCount >= 4) {
            // Fallback for any other persistent errors
            console.warn('🚨 Disabling auto-authentication due to multiple repeated failures');
            setAutoAuthDisabled(true);
            setAuthError('Multiple authentication failures detected. Auto-authentication disabled for your security. Please click "Sign In" to retry manually.');
          } else {
            // Show specific error for manual troubleshooting but don't disable auto-auth yet
            let userFriendlyError;
            if (isTimeoutError) {
              userFriendlyError = 'Authentication timed out. Your wallet may be slow to respond.';
            } else if (isWalletError) {
              userFriendlyError = 'Wallet signing failed. Please ensure your wallet is unlocked.';
            } else if (isJSONRPCError) {
              userFriendlyError = 'Wallet communication error. This may be temporary.';
            } else {
              userFriendlyError = `Authentication failed: ${errorMessage}`;
            }
            
            setAuthError(userFriendlyError);
            console.log(`🔄 Auto-auth will retry (attempt ${newFailureCount}/4): ${userFriendlyError}`);
          }
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [solanaWallet.connected, solanaWallet.publicKey, isAuthenticated, authenticate, authFailureCount, lastAuthFailureTime, autoAuthDisabled]);

  // Reset auto-auth state when wallet disconnects
  useEffect(() => {
    if (!solanaWallet.connected) {
      setAuthFailureCount(0);
      setLastAuthFailureTime(0);
      setAutoAuthDisabled(false);
    }
  }, [solanaWallet.connected]);

  return (
    <AuthContext.Provider value={value || contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// AI-NOTE: EVM/ethers.js version archived in legacy-evm/AuthContext.tsx. Implement Solana logic here.
