import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { secureStorage } from '../security/storage/SecureStorageManager';

/**
 * Sign-In with Solana (SIWS) Hook
 * Implements robust Web3 authentication using cryptographic message signing
 * 
 * Based on Sign-In with Ethereum (SIWE) standard, adapted for Solana
 * Provides verifiable authentication without server dependency
 */

export interface SIWSMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: '1';
  chainId: string;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

export interface SIWSSession {
  message: SIWSMessage;
  signature: string;
  publicKey: string;
  issuedAt: number;
  expiresAt: number;
  verified: boolean;
}

interface UseSIWSReturn {
  session: SIWSSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<boolean>;
  signOut: () => void;
  isSessionValid: () => boolean;
  refreshSession: () => Promise<boolean>;
}

const DEFAULT_STATEMENT = 'Sign in to Starcom MK2 - Decentralized Intelligence Platform';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function useSIWS(): UseSIWSReturn {
  const { publicKey, signMessage } = useWallet();
  const [session, setSession] = useState<SIWSSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const isSessionValidInternal = (sessionToCheck: SIWSSession): boolean => {
      if (!sessionToCheck || !sessionToCheck.verified) return false;
      
      const now = Date.now();
      if (now > sessionToCheck.expiresAt) return false;
      
      // Check if public key matches current wallet
      if (publicKey && sessionToCheck.publicKey !== publicKey.toBase58()) {
        return false;
      }
      
      // Enhanced validation for session integrity
      if (!sessionToCheck.signature || !sessionToCheck.message || !sessionToCheck.publicKey) {
        return false;
      }
      
      // Check if the session structure looks corrupted
      if (typeof sessionToCheck.issuedAt !== 'number' || 
          typeof sessionToCheck.expiresAt !== 'number' ||
          sessionToCheck.issuedAt <= 0 || 
          sessionToCheck.expiresAt <= sessionToCheck.issuedAt) {
        return false;
      }
      
      return true;
    };

    const loadSession = async () => {
      try {
        const parsed = await secureStorage.getItem<SIWSSession>('siws_session');
        if (parsed && isSessionValidInternal(parsed)) {
          setSession(parsed);
          // Remove console.log for production security
        } else {
          secureStorage.removeItem('siws_session');
          setSession(null);
          setError(null);
        }
      } catch {
        // Remove console logging to prevent data exposure
        secureStorage.removeItem('siws_session');
        setSession(null);
        setError(null);
      }
    };

    loadSession().catch(console.warn);
  }, [publicKey]);

  // Clear session when wallet changes
  useEffect(() => {
    if (session && publicKey && session.publicKey !== publicKey.toBase58()) {
      secureStorage.removeItem('siws_session');
      setSession(null);
      setError(null);
    }
  }, [publicKey, session]);

  // Generate nonce for message
  const generateNonce = (): string => {
    return Array.from({ length: 8 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  // Create SIWS message
  const createMessage = useCallback((address: string): SIWSMessage => {
    const now = new Date();
    const expirationTime = new Date(now.getTime() + SESSION_DURATION);

    return {
      domain: window.location.host,
      address,
      statement: DEFAULT_STATEMENT,
      uri: window.location.origin,
      version: '1',
      chainId: 'solana:devnet', // or mainnet in production
      nonce: generateNonce(),
      issuedAt: now.toISOString(),
      expirationTime: expirationTime.toISOString(),
    };
  }, []);

  // Format message for signing
  const formatMessage = (message: SIWSMessage): string => {
    const header = `${message.domain} wants you to sign in with your Solana account:`;
    const address = message.address;
    
    let body = '';
    if (message.statement) body += `\n\n${message.statement}`;
    
    const fields = [
      `URI: ${message.uri}`,
      `Version: ${message.version}`,
      `Chain ID: ${message.chainId}`,
      `Nonce: ${message.nonce}`,
      `Issued At: ${message.issuedAt}`,
    ];
    
    if (message.expirationTime) fields.push(`Expiration Time: ${message.expirationTime}`);
    if (message.notBefore) fields.push(`Not Before: ${message.notBefore}`);
    if (message.requestId) fields.push(`Request ID: ${message.requestId}`);
    if (message.resources?.length) {
      fields.push(`Resources:`);
      message.resources.forEach(resource => fields.push(`- ${resource}`));
    }
    
    body += `\n\n${fields.join('\n')}`;
    
    return `${header}\n${address}${body}`;
  };

  // Verify signature using Ed25519
  const verifySignature = (
    message: string, 
    signature: Uint8Array, 
    publicKeyStr: string
  ): boolean => {
    try {
      const messageBytes = new TextEncoder().encode(message);
      const publicKeyObj = new PublicKey(publicKeyStr);
      
      // Verify signature length (Ed25519 signatures are 64 bytes)
      if (signature.length !== 64) {
        return false;
      }
      
      // Get the public key bytes (Ed25519 public keys are 32 bytes)
      const publicKeyBytes = publicKeyObj.toBytes();
      if (publicKeyBytes.length !== 32) {
        return false;
      }
      
      // Verify the signature using Ed25519
      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signature,
        publicKeyBytes
      );
      
      return isValid;
    } catch {
      return false;
    }
  };

  // Check if session is valid
  const isSessionValidInternal = useCallback((sessionToCheck: SIWSSession): boolean => {
    if (!sessionToCheck || !sessionToCheck.verified) return false;
    
    const now = Date.now();
    if (now > sessionToCheck.expiresAt) return false;
    
    // Check if public key matches current wallet
    if (publicKey && sessionToCheck.publicKey !== publicKey.toBase58()) {
      return false;
    }
    
    // Enhanced validation for session integrity
    if (!sessionToCheck.signature || !sessionToCheck.message || !sessionToCheck.publicKey) {
      return false;
    }
    
    // Check if the session structure looks corrupted
    if (typeof sessionToCheck.issuedAt !== 'number' || 
        typeof sessionToCheck.expiresAt !== 'number' ||
        sessionToCheck.issuedAt <= 0 || 
        sessionToCheck.expiresAt <= sessionToCheck.issuedAt) {
      return false;
    }
    
    return true;
  }, [publicKey]);

  const isSessionValid = useCallback((): boolean => {
    return session ? isSessionValidInternal(session) : false;
  }, [session, isSessionValidInternal]);

  // Sign in with Solana
  const signIn = useCallback(async (): Promise<boolean> => {
    // Enhanced pre-flight validation with detailed error reporting
    if (!publicKey) {
      const error = new Error('SIWS_WALLET_NOT_CONNECTED: Wallet public key is not available. Please ensure your wallet is properly connected and unlocked.');
      setError(error.message);
      console.error('🚨 SIWS Sign-In Failed - No Public Key:', {
        publicKey,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
      throw error;
    }

    if (!signMessage) {
      const error = new Error('SIWS_SIGNING_NOT_SUPPORTED: Wallet does not support message signing. This wallet may not be compatible with Sign-In with Solana (SIWS) authentication.');
      setError(error.message);
      console.error('🚨 SIWS Sign-In Failed - No Signing Support:', {
        publicKey: publicKey.toBase58(),
        walletName: 'Unknown',
        timestamp: new Date().toISOString(),
        supportedFeatures: {
          signMessage: !!signMessage,
          signTransaction: typeof window !== 'undefined' && 'solana' in window
        }
      });
      throw error;
    }

    setIsLoading(true);
    setError(null);

    const address = publicKey.toBase58();
    console.log('🔐 Starting SIWS Authentication Process:', {
      address: address.substring(0, 8) + '...',
      timestamp: new Date().toISOString(),
      sessionDuration: SESSION_DURATION / 1000 / 60 + ' minutes'
    });

    try {
      // Step 1: Create authentication message
      let message;
      let messageText;
      let messageBytes;
      
      try {
        message = createMessage(address);
        messageText = formatMessage(message);
        messageBytes = new TextEncoder().encode(messageText);
        
        console.log('✅ SIWS Message Created Successfully:', {
          messageLength: messageText.length,
          addressInMessage: message.address,
          domain: message.domain,
          nonce: message.nonce
        });
      } catch (err) {
        const error = new Error(`SIWS_MESSAGE_CREATION_FAILED: Failed to create authentication message. ${err instanceof Error ? err.message : 'Unknown error during message creation.'}`);
        setError(error.message);
        console.error('🚨 SIWS Message Creation Failed:', {
          originalError: err,
          address,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      // Step 2: Request wallet signature with enhanced error handling
      let signature;
      try {
        console.log('📝 Requesting wallet signature...');
        signature = await signMessage(messageBytes);
        console.log('✅ Wallet signature obtained successfully:', {
          signatureLength: signature.length,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        // Enhanced wallet-specific error handling
        let enhancedError;
        const originalMessage = err instanceof Error ? err.message : 'Unknown signing error';
        
        if (originalMessage.includes('User declined') || originalMessage.includes('rejected') || originalMessage.includes('denied')) {
          enhancedError = new Error('SIWS_USER_REJECTED: User declined to sign the authentication message. Please try again and approve the signature request in your wallet.');
        } else if (originalMessage.includes('JSON-RPC') || originalMessage.includes('Internal error')) {
          enhancedError = new Error(`SIWS_WALLET_RPC_ERROR: Wallet communication error occurred during signing. This may be due to network issues, wallet server problems, or temporary connectivity issues. Original error: ${originalMessage}`);
        } else if (originalMessage.includes('WalletSignMessageError')) {
          enhancedError = new Error(`SIWS_WALLET_SIGNING_ERROR: Wallet failed to sign the message. This could be due to wallet lock state, insufficient permissions, or wallet malfunction. Original error: ${originalMessage}`);
        } else if (originalMessage.includes('timeout') || originalMessage.includes('Timeout')) {
          enhancedError = new Error('SIWS_SIGNING_TIMEOUT: Wallet signing request timed out. Please ensure your wallet is unlocked and responsive, then try again.');
        } else if (originalMessage.includes('not supported') || originalMessage.includes('unsupported')) {
          enhancedError = new Error('SIWS_FEATURE_UNSUPPORTED: Your wallet does not support the required signing features for SIWS authentication. Please try a different wallet or update your current wallet.');
        } else {
          enhancedError = new Error(`SIWS_SIGNING_UNKNOWN_ERROR: An unexpected error occurred during wallet signing. Original error: ${originalMessage}`);
        }

        setError(enhancedError.message);
        console.error('🚨 SIWS Wallet Signing Failed:', {
          originalError: err,
          errorName: err instanceof Error ? err.name : 'Unknown',
          errorMessage: originalMessage,
          enhancedErrorCode: enhancedError.message.split(':')[0],
          address,
          timestamp: new Date().toISOString(),
          walletState: {
            connected: !!publicKey,
            signingSupported: !!signMessage
          }
        });
        
        throw enhancedError;
      }

      // Step 3: Verify signature with enhanced validation
      let isValid;
      try {
        isValid = verifySignature(messageText, signature, address);
        console.log('🔍 Signature verification result:', {
          isValid,
          address: address.substring(0, 8) + '...',
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        const error = new Error(`SIWS_SIGNATURE_VERIFICATION_ERROR: Failed to verify the wallet signature. This may indicate a cryptographic issue or corrupted signature data. ${err instanceof Error ? err.message : 'Unknown verification error.'}`);
        setError(error.message);
        console.error('🚨 SIWS Signature Verification Failed:', {
          originalError: err,
          address,
          signatureLength: signature.length,
          messageLength: messageText.length,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
      
      if (!isValid) {
        const error = new Error('SIWS_SIGNATURE_INVALID: Wallet signature verification failed. The signature does not match the expected cryptographic proof for this wallet address. This could indicate a wallet malfunction or security issue.');
        setError(error.message);
        console.error('🚨 SIWS Signature Invalid:', {
          address,
          signatureLength: signature.length,
          messageText: messageText.substring(0, 100) + '...',
          timestamp: new Date().toISOString(),
          verificationAttempts: 1
        });
        throw error;
      }

      // Step 4: Create and store session with enhanced error handling
      let newSession;
      try {
        newSession = {
          message,
          signature: bs58.encode(signature),
          publicKey: address,
          issuedAt: Date.now(),
          expiresAt: Date.now() + SESSION_DURATION,
          verified: true,
        };

        console.log('💾 Creating secure session:', {
          address: address.substring(0, 8) + '...',
          expiresIn: SESSION_DURATION / 1000 / 60 + ' minutes',
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        const error = new Error(`SIWS_SESSION_CREATION_ERROR: Failed to create authentication session object. ${err instanceof Error ? err.message : 'Unknown session creation error.'}`);
        setError(error.message);
        console.error('🚨 SIWS Session Creation Failed:', {
          originalError: err,
          address,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      // Step 5: Store session securely with enhanced error handling
      try {
        await secureStorage.setItem('siws_session', newSession, { 
          encrypt: true, 
          classification: 'SECRET',
          ttl: SESSION_DURATION 
        });
        setSession(newSession);
        
        console.log('🎉 SIWS Authentication Completed Successfully:', {
          address: address.substring(0, 8) + '...',
          sessionDuration: SESSION_DURATION / 1000 / 60 + ' minutes',
          timestamp: new Date().toISOString(),
          securityLevel: 'SIWS_AUTHENTICATED'
        });
      } catch (err) {
        const error = new Error(`SIWS_SESSION_STORAGE_ERROR: Failed to store authentication session securely. This may be due to browser storage limitations or security restrictions. ${err instanceof Error ? err.message : 'Unknown storage error.'}`);
        setError(error.message);
        console.error('🚨 SIWS Session Storage Failed:', {
          originalError: err,
          address,
          timestamp: new Date().toISOString(),
          storageAvailable: typeof localStorage !== 'undefined'
        });
        throw error;
      }
      
      return true;
      
    } catch (err) {
      // Final error handling with comprehensive logging
      console.error('🚨 SIWS Sign-In Process Failed:', {
        error: err,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorName: err instanceof Error ? err.name : 'Unknown',
        address,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        walletContext: {
          publicKeyAvailable: !!publicKey,
          signMessageAvailable: !!signMessage,
          connected: !!publicKey
        }
      });
      
      // Ensure error is set for UI display
      const finalErrorMessage = err instanceof Error ? err.message : 'SIWS_UNKNOWN_ERROR: An unexpected error occurred during Sign-In with Solana authentication.';
      setError(finalErrorMessage);
      
      // Re-throw the original error to preserve error details for upstream handling
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signMessage, createMessage]);

  // Sign out
  const signOut = useCallback((): void => {
    secureStorage.removeItem('siws_session');
    setSession(null);
    setError(null);
  }, []);

  // Refresh session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!session || !isSessionValid()) {
      return await signIn();
    }
    return true;
  }, [session, isSessionValid, signIn]);

  return {
    session,
    isAuthenticated: isSessionValid(),
    isLoading,
    error,
    signIn,
    signOut,
    isSessionValid,
    refreshSession,
  };
}

// Utility function to get current session without hook
export async function getSIWSSession(): Promise<SIWSSession | null> {
  try {
    const session = await secureStorage.getItem<SIWSSession>('siws_session');
    if (!session) return null;
    
    const now = Date.now();
    
    if (now > session.expiresAt || !session.verified) {
      secureStorage.removeItem('siws_session');
      return null;
    }
    
    return session;
  } catch {
    secureStorage.removeItem('siws_session');
    return null;
  }
}

// Utility to check if address is authenticated
export async function isAddressAuthenticated(address: string): Promise<boolean> {
  const session = await getSIWSSession();
  return session ? session.publicKey === address : false;
}
