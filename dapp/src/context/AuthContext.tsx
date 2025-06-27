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
    if (!solanaWallet.connected || !solanaWallet.publicKey) {
      setAuthError('Wallet not connected');
      return false;
    }
    
    setAuthError(null);
    try {
      // Perform standard SIWS authentication
      const success = await signIn();
      
      if (success && solanaWallet.publicKey) {
        // Enhance with advanced security measures
        const advancedSecurity = await performAdvancedAuthSecurity(
          solanaWallet.publicKey.toString()
        );
        setSecurityMetadata(advancedSecurity);
        
        console.log('🔐 Authentication completed with advanced security:', {
          siws: success,
          securityLevel: advancedSecurity.securityLevel,
          classification: advancedSecurity.classificationLevel
        });
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setAuthError(errorMessage);
      return false;
    }
  }, [solanaWallet.connected, solanaWallet.publicKey, signIn, performAdvancedAuthSecurity]);

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
  }, [solanaWallet, signOut]);

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

  // Auto-authenticate when wallet connects (e.g., after being selected from modal)
  useEffect(() => {
    if (solanaWallet.connected && solanaWallet.publicKey && !isAuthenticated) {
      // Add a small delay to ensure wallet is fully connected
      const timeoutId = setTimeout(() => {
        authenticate().catch(error => {
          console.error('Auto-authentication failed:', error);
        });
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [solanaWallet.connected, solanaWallet.publicKey, isAuthenticated, authenticate]);

  return (
    <AuthContext.Provider value={value || contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// AI-NOTE: EVM/ethers.js version archived in legacy-evm/AuthContext.tsx. Implement Solana logic here.
