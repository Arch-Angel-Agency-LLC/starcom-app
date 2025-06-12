// src/hooks/useBackendAuth.ts
// Hook for backend signature-based authentication (scaffold)

import { useState } from 'react';
import { requestBackendNonce, submitBackendSignature, BackendSession } from '../api/auth';
import { useAuth } from '../context/AuthContext.tsx';

export function useBackendAuth() {
  const { address, signer } = useAuth();
  const [backendSession, setBackendSession] = useState<BackendSession | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  async function authenticateWithBackend() {
    if (!address || !signer) {
      setBackendError('Wallet not connected');
      return;
    }
    setIsAuthenticating(true);
    setBackendError(null);
    try {
      const nonce = await requestBackendNonce(address);
      const signature = await signer.signMessage(nonce);
      const session = await submitBackendSignature(address, signature);
      setBackendSession(session);
    } catch (err: unknown) {
      setBackendError(err instanceof Error ? err.message : 'Backend authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  }

  return { backendSession, authenticateWithBackend, isAuthenticating, backendError };
}
