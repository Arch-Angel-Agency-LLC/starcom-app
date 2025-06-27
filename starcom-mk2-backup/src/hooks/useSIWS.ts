import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { secureStorage } from '../utils/secureStorage';

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

    const loadSession = () => {
      try {
        const parsed = secureStorage.getSecureSession<SIWSSession>();
        if (parsed && isSessionValidInternal(parsed)) {
          setSession(parsed);
          // Remove console.log for production security
        } else {
          secureStorage.clearSecureSession();
          setSession(null);
          setError(null);
        }
      } catch {
        // Remove console logging to prevent data exposure
        secureStorage.clearSecureSession();
        setSession(null);
        setError(null);
      }
    };

    loadSession();
  }, [publicKey]);

  // Clear session when wallet changes
  useEffect(() => {
    if (session && publicKey && session.publicKey !== publicKey.toBase58()) {
      secureStorage.clearSecureSession();
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
    if (!publicKey || !signMessage) {
      setError('Wallet not connected or does not support message signing');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const address = publicKey.toBase58();
      const message = createMessage(address);
      const messageText = formatMessage(message);
      const messageBytes = new TextEncoder().encode(messageText);
      
      const signature = await signMessage(messageBytes);
      
      // Verify the signature
      const isValid = verifySignature(messageText, signature, address);
      
      if (!isValid) {
        throw new Error('Signature verification failed');
      }

      const newSession: SIWSSession = {
        message,
        signature: bs58.encode(signature),
        publicKey: address,
        issuedAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION,
        verified: true,
      };

      // Store session securely
      secureStorage.setSecureSession(newSession);
      setSession(newSession);
      
      return true;
    } catch {
      setError('Authentication failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signMessage, createMessage]);

  // Sign out
  const signOut = useCallback((): void => {
    secureStorage.clearSecureSession();
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
export function getSIWSSession(): SIWSSession | null {
  try {
    const session = secureStorage.getSecureSession<SIWSSession>();
    if (!session) return null;
    
    const now = Date.now();
    
    if (now > session.expiresAt || !session.verified) {
      secureStorage.clearSecureSession();
      return null;
    }
    
    return session;
  } catch {
    secureStorage.clearSecureSession();
    return null;
  }
}

// Utility to check if address is authenticated
export function isAddressAuthenticated(address: string): boolean {
  const session = getSIWSSession();
  return session ? session.publicKey === address : false;
}
