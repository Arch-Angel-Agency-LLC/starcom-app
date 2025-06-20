import React, { useState, useCallback } from 'react';
import { AuthContext, AuthContextType } from './AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';

export const AuthProvider: React.FC<{ children: React.ReactNode; value?: AuthContextType }> = ({ children, value }) => {
  // Use Solana wallet adapter directly
  const solanaWallet = useWallet();
  
  const [authError, setAuthError] = useState<string | null>(null);

  // SIWE/localStorage session helpers for decentralized login
  const isSessionValid = useCallback(() => {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    if (!auth.signature || auth.expiry < Date.now()) return false;
    if (!solanaWallet.publicKey) return false;
    // For Solana, we'll implement signature verification later
    // For now, just check if wallet is connected and session exists
    return solanaWallet.connected && auth.address === solanaWallet.publicKey?.toString();
  }, [solanaWallet.publicKey, solanaWallet.connected]);

  const authenticate = useCallback(async () => {
    if (!solanaWallet.connected || !solanaWallet.publicKey) return false;
    setAuthError(null);
    try {
      // For MVP, we'll create a simple session without signature verification
      // TODO: Implement proper Solana message signing for authentication
      const sessionData = {
        address: solanaWallet.publicKey.toString(),
        signature: 'solana-session-placeholder', // TODO: Replace with real signature
        nonce: Math.floor(Math.random() * 1000000).toString(),
        expiry: Date.now() + 86400000 // 24 hours
      };
      localStorage.setItem('auth', JSON.stringify(sessionData));
      return true;
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
      return false;
    }
  }, [solanaWallet.connected, solanaWallet.publicKey]);

  function logout() {
    localStorage.removeItem('auth');
    setAuthError(null);
  }

  const expectedChainId = 101; // Solana mainnet (devnet would be different)
  const expectedNetworkName = 'Solana Devnet';

  const connectWalletHandler = useCallback(async () => {
    try {
      setAuthError(null);
      if (solanaWallet.connect) {
        await solanaWallet.connect();
        // Auto-authenticate after successful connection
        setTimeout(async () => {
          await authenticate();
        }, 1000);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setAuthError(error instanceof Error ? error.message : 'Connection failed');
    }
  }, [solanaWallet.connect, authenticate]);

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
  }, [solanaWallet.disconnect]);

  const switchNetworkHandler = useCallback(async () => {
    // Solana wallets typically don't support network switching
    // This would be handled in wallet settings
    setAuthError('Network switching must be done in your wallet settings');
  }, []);

  const contextValue: AuthContextType = {
    isAuthenticated: solanaWallet.connected && isSessionValid(),
    address: solanaWallet.publicKey?.toString() || null,
    provider: solanaWallet,
    signer: solanaWallet,
    connectWallet: connectWalletHandler,
    disconnectWallet: disconnectWalletHandler,
    isLoading: solanaWallet.connecting,
    error: authError,
    connectionStatus: solanaWallet.connected ? 'connected' : 
                     solanaWallet.connecting ? 'connecting' : 
                     authError ? 'error' : 'idle',
    switchNetwork: switchNetworkHandler,
    authenticate,
    logout,
    isSessionValid,
    authError,
    expectedChainId,
    expectedNetworkName,
    setError: setAuthError,
  };

  return (
    <AuthContext.Provider value={value || contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// AI-NOTE: EVM/ethers.js version archived in legacy-evm/AuthContext.tsx. Implement Solana logic here.
