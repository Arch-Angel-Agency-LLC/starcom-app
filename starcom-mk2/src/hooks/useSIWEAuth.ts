// src/hooks/useSIWEAuth.ts
// Decentralized SIWE-style authentication and session management (client-side only)

import { useState } from 'react';
import { verifyMessage } from 'ethers';
import { useAuth } from '../context/AuthContext.tsx';

export function useSIWEAuth() {
  const { address, signer } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  async function authenticate() {
    if (!address || !signer) {
      setAuthError('Wallet not connected');
      return false;
    }
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const nonce = Math.floor(Math.random() * 1000000).toString();
      const message = `Sign this message to authenticate: ${nonce}`;
      const signature = await signer.signMessage(message);
      const recovered = verifyMessage(message, signature);
      if (recovered.toLowerCase() === address.toLowerCase()) {
        localStorage.setItem('auth', JSON.stringify({ address, signature, nonce, expiry: Date.now() + 86400000 }));
        return true;
      } else {
        setAuthError('Signature verification failed');
        return false;
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }

  function isAuthenticated() {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    if (!auth.signature || auth.expiry < Date.now()) return false;
    const recovered = verifyMessage(`Sign this message to authenticate: ${auth.nonce}`, auth.signature);
    return recovered.toLowerCase() === auth.address?.toLowerCase();
  }

  function logout() {
    localStorage.removeItem('auth');
  }

  return { authenticate, isAuthenticated, logout, isAuthenticating, authError };
}
