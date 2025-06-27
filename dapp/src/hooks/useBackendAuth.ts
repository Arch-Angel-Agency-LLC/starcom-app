// src/hooks/useBackendAuth.ts
// Hook for backend signature-based authentication (scaffold)

import { useState } from 'react';
import { requestBackendNonce, submitBackendSignature, BackendSession } from '../api/auth';
import { useAuth } from './useAuth';

export function useBackendAuth() {
  const { address, signer } = useAuth();
  const [backendSession, setBackendSession] = useState<BackendSession | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  async function authenticateWithBackend() {
    if (!address || !signer || !signer.signMessage) {
      setBackendError('Wallet not connected or does not support message signing');
      return;
    }
    setIsAuthenticating(true);
    setBackendError(null);
    try {
      const nonce = await requestBackendNonce(address);
      const messageBytes = new TextEncoder().encode(nonce);
      const signature = await signer.signMessage(messageBytes);
      const signatureBase58 = btoa(String.fromCharCode(...signature));
      const session = await submitBackendSignature(address, signatureBase58);
      setBackendSession(session);
    } catch (err: unknown) {
      setBackendError(err instanceof Error ? err.message : 'Backend authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  }

  return { backendSession, authenticateWithBackend, isAuthenticating, backendError };
}
