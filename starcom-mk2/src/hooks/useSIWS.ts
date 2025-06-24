import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

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

const STORAGE_KEY = 'siws-session';
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
        const storedSession = localStorage.getItem(STORAGE_KEY);
        if (storedSession) {
          const parsed: SIWSSession = JSON.parse(storedSession);
          if (isSessionValidInternal(parsed)) {
            setSession(parsed);
            console.log('✅ Valid SIWS session restored from storage');
          } else {
            console.log('🗑️ Invalid or stale SIWS session detected, clearing storage');
            localStorage.removeItem(STORAGE_KEY);
            setSession(null);
            setError(null);
          }
        }
      } catch (err) {
        console.error('❌ Failed to load SIWS session, clearing corrupted data:', err);
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
        setError(null);
      }
    };

    loadSession();
  }, [publicKey]);

  // Clear session when wallet changes
  useEffect(() => {
    if (session && publicKey && session.publicKey !== publicKey.toBase58()) {
      console.log('🔄 Wallet changed, clearing old session');
      localStorage.removeItem(STORAGE_KEY);
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
        console.error('Invalid signature length:', signature.length);
        return false;
      }
      
      // Get the public key bytes (Ed25519 public keys are 32 bytes)
      const publicKeyBytes = publicKeyObj.toBytes();
      if (publicKeyBytes.length !== 32) {
        console.error('Invalid public key length:', publicKeyBytes.length);
        return false;
      }
      
      // Verify the signature using Ed25519
      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signature,
        publicKeyBytes
      );
      
      return isValid;
    } catch (err) {
      console.error('Signature verification failed:', err);
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
      
      console.log('🔐 Requesting wallet signature for SIWS authentication...');
      console.log('🔍 Message to sign:', messageText);
      console.log('🔍 Message bytes length:', messageBytes.length);
      console.log('🔍 Wallet adapter:', signMessage.constructor.name);
      
      const signature = await signMessage(messageBytes);
      console.log('✅ Signature received:', signature);
      
      // Verify the signature
      const isValid = verifySignature(messageText, signature, address);
      console.log('🔍 Signature verification result:', isValid);
      
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

      // Store session
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      setSession(newSession);
      
      return true;
    } catch (err) {
      let errorMessage = 'Authentication failed';
      
      console.error('🚨 Detailed SIWS error:', err);
      console.error('🚨 Error type:', typeof err);
      console.error('🚨 Error constructor:', err?.constructor?.name);
      console.error('🚨 Error message:', (err as Error)?.message);
      console.error('🚨 Error stack:', (err as Error)?.stack);
      
      if (err instanceof Error) {
        // Handle specific wallet errors with user-friendly messages
        if (err.message.includes('keyring request') || err.message.includes('unknown error')) {
          errorMessage = 'Wallet signing error. This may be due to wallet compatibility issues. Please try a different wallet or refresh the page.';
        } else if (err.message.includes('not been authorized') || err.message.includes('User rejected')) {
          errorMessage = 'Please authorize your wallet to sign messages for authentication. This is required for secure sign-in.';
        } else if (err.message.includes('User denied') || err.message.includes('rejected')) {
          errorMessage = 'Authentication was cancelled. Please try again and approve the signature request.';
        } else if (err.message.includes('Signature verification failed')) {
          errorMessage = 'Unable to verify your signature. Please try connecting your wallet again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      console.error('SIWS sign-in failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signMessage, createMessage]);

  // Sign out
  const signOut = useCallback((): void => {
    localStorage.removeItem(STORAGE_KEY);
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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const session: SIWSSession = JSON.parse(stored);
    const now = Date.now();
    
    if (now > session.expiresAt || !session.verified) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    return session;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

// Utility to check if address is authenticated
export function isAddressAuthenticated(address: string): boolean {
  const session = getSIWSSession();
  return session ? session.publicKey === address : false;
}
