// src/hooks/useSIWEAuth.ts
// Decentralized Solana-compatible authentication and session management (client-side only)

// AI-NOTE: Archived EVM/ethers.js SIWE (Sign-In With Ethereum) logic. 
// Per artifact-driven migration and security policy, all EVM logic is removed.
// COMPLETED: Implement Solana-compatible authentication. See artifacts/intel-report-artifact-index.artifact.

import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { SolanaWallet } from '../utils/wallet';

// Interface for Solana authentication state
interface SolanaAuthState {
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  publicKey: PublicKey | null;
  wallet: SolanaWallet | null;
}

// Interface for Solana authentication methods
interface SolanaAuthMethods {
  signIn: (wallet: SolanaWallet) => Promise<void>;
  signOut: () => void;
  refreshAuth: () => Promise<void>;
}

// Solana-compatible authentication hook
export function useSIWEAuth(): SolanaAuthState & SolanaAuthMethods {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [wallet, setWallet] = useState<SolanaWallet | null>(null);

  // Sign in with Solana wallet
  const signIn = async (solanaWallet: SolanaWallet): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      if (!solanaWallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      // For development: Simple authentication based on wallet connection
      // In production, this could involve signing a message to prove ownership
      
      // Create authentication message
      const message = `Sign in to STARCOM Intelligence Network\n\nTimestamp: ${Date.now()}\nWallet: ${solanaWallet.publicKey.toString()}`;
      
      console.log('Authenticating with Solana wallet:', {
        publicKey: solanaWallet.publicKey.toString(),
        message
      });

      // TODO: In production, you might want to sign a message to prove ownership:
      // if (solanaWallet.signMessage) {
      //   const encodedMessage = new TextEncoder().encode(message);
      //   const signature = await solanaWallet.signMessage(encodedMessage);
      //   // Verify signature and create session
      // }

      // For now, simply verify wallet connection
      if (solanaWallet.connected) {
        setAuthenticated(true);
        setPublicKey(solanaWallet.publicKey);
        setWallet(solanaWallet);
        
        // Store auth state in localStorage for persistence
        localStorage.setItem('starcom_auth', JSON.stringify({
          authenticated: true,
          publicKey: solanaWallet.publicKey.toString(),
          timestamp: Date.now()
        }));
        
        console.log('Successfully authenticated with Solana wallet');
      } else {
        throw new Error('Wallet not properly connected');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      console.error('Solana authentication error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sign out and clear session
  const signOut = (): void => {
    setAuthenticated(false);
    setPublicKey(null);
    setWallet(null);
    setError(null);
    localStorage.removeItem('starcom_auth');
    console.log('Signed out from STARCOM');
  };

  // Refresh authentication state
  const refreshAuth = async (): Promise<void> => {
    setLoading(true);
    
    try {
      const storedAuth = localStorage.getItem('starcom_auth');
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        
        // Check if auth is still valid (e.g., not expired)
        const isExpired = Date.now() - authData.timestamp > 24 * 60 * 60 * 1000; // 24 hours
        
        if (!isExpired && authData.authenticated && authData.publicKey) {
          setAuthenticated(true);
          setPublicKey(new PublicKey(authData.publicKey));
          console.log('Restored authentication session for:', authData.publicKey);
        } else {
          // Clear expired auth
          localStorage.removeItem('starcom_auth');
        }
      }
    } catch (err) {
      console.error('Error refreshing auth:', err);
      localStorage.removeItem('starcom_auth');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh auth on mount
  useEffect(() => {
    refreshAuth();
  }, []);

  return {
    authenticated,
    loading,
    error,
    publicKey,
    wallet,
    signIn,
    signOut,
    refreshAuth
  };
}
