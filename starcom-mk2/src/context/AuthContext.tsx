import React, { useState, useCallback, useEffect } from 'react';
import { connectToWallet, disconnectWallet, isWalletConnected, SUPPORTED_NETWORKS } from '../utils/wallet';
import { switchNetwork } from '../middleware/web3Middleware';
import { AuthContext, AuthContextType } from './AuthContext';
import { Provider, Signer } from 'ethers';
import { verifyMessage } from 'ethers';

export const AuthProvider: React.FC<{ children: React.ReactNode; value?: AuthContextType }> = ({ children, value }) => {
  // All hooks and logic must be called unconditionally
  const [wallet, setWallet] = useState<{
    provider: Provider | null;
    address: string | null;
    signer: Signer | null;
  }>({ provider: null, address: null, signer: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [authError, setAuthError] = useState<string | null>(null);

  // SIWE/localStorage session helpers for decentralized login
  function isSessionValid() {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    if (!auth.signature || auth.expiry < Date.now()) return false;
    if (!wallet.address) return false;
    try {
      const recovered = verifyMessage(`Sign this message to authenticate: ${auth.nonce}`, auth.signature);
      return recovered.toLowerCase() === wallet.address.toLowerCase();
    } catch {
      return false;
    }
  }
  async function authenticate(walletOverride?: typeof wallet) {
    const w = walletOverride || wallet;
    if (!w.address || !w.signer) {
      setAuthError('Wallet not connected');
      return false;
    }
    setAuthError(null);
    try {
      const nonce = Math.floor(Math.random() * 1000000).toString();
      const message = `Sign this message to authenticate: ${nonce}`;
      const signature = await w.signer.signMessage(message);
      const recovered = verifyMessage(message, signature);
      if (recovered.toLowerCase() === w.address.toLowerCase()) {
        localStorage.setItem('auth', JSON.stringify({ address: w.address, signature, nonce, expiry: Date.now() + 86400000 }));
        return true;
      } else {
        setAuthError('Signature verification failed');
        return false;
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
      return false;
    }
  }
  function logout() {
    localStorage.removeItem('auth');
  }

  // Read expected chain ID from environment variable
  const expectedChainId = Number(import.meta.env.VITE_EXPECTED_CHAIN_ID || 1);

  const connectWalletHandler = useCallback(async () => {
    console.log('[Auth] connectWalletHandler: start');
    setIsLoading(true);
    setError(null);
    setConnectionStatus('connecting');
    try {
      console.log('[Auth] Calling connectToWallet with chainId', expectedChainId);
      const connection = await connectToWallet(expectedChainId);
      console.log('[Auth] Wallet connected:', connection);
      setWallet(connection);
      // Authenticate using the fresh connection object
      const authSuccess = await authenticate(connection);
      if (!authSuccess) {
        setError('Authentication failed.');
        setConnectionStatus('error');
        setIsLoading(false);
        return;
      }
      setConnectionStatus('connected');
    } catch (error) {
      console.error('[Auth] connectWalletHandler error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred.');
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
      console.log('[Auth] connectWalletHandler: end');
    }
  }, [expectedChainId, authenticate]);

  const disconnectWalletHandler = useCallback(async () => {
    console.log('[Auth] disconnectWalletHandler: start');
    setIsLoading(true);
    setError(null);
    setConnectionStatus('connecting');
    try {
      await disconnectWallet();
      setWallet({ provider: null, address: null, signer: null });
      setConnectionStatus('idle');
      console.log('[Auth] Wallet disconnected');
    } catch (error) {
      console.error('[Auth] disconnectWalletHandler error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred.');
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
      console.log('[Auth] disconnectWalletHandler: end');
    }
  }, []);

  const switchNetworkHandler = useCallback(async () => {
    try {
      await switchNetwork(expectedChainId);
      setConnectionStatus('connected');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred.');
      setConnectionStatus('error');
    }
  }, [expectedChainId]);

  useEffect(() => {
    let didRun = false;
    const checkConnection = async () => {
      if (didRun) return;
      didRun = true;
      if (!wallet.address && !(!!wallet.address && isSessionValid())) {
        if (await isWalletConnected()) {
          await connectWalletHandler();
        }
      }
    };
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let contextValue: AuthContextType = {
    isAuthenticated: !!wallet.address && isSessionValid(),
    address: wallet.address,
    provider: wallet.provider,
    signer: wallet.signer,
    connectWallet: connectWalletHandler,
    disconnectWallet: disconnectWalletHandler,
    isLoading,
    error,
    connectionStatus,
    switchNetwork: switchNetworkHandler,
    authenticate,
    logout,
    isSessionValid,
    authError,
    expectedChainId,
    expectedNetworkName: SUPPORTED_NETWORKS[expectedChainId]?.name || `Chain ${expectedChainId}`,
    setError, // Expose setError for error modal actions
  };

  // If a value prop is provided (for testing), override the context value
  if (value) {
    contextValue = {
      ...contextValue,
      ...value,
      expectedChainId: (value as Partial<typeof contextValue>).expectedChainId ?? expectedChainId,
      expectedNetworkName: value?.expectedNetworkName ?? (SUPPORTED_NETWORKS[expectedChainId]?.name || `Chain ${expectedChainId}`),
    };
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const TestAuthProvider: React.FC<{ children: React.ReactNode; value: AuthContextType }> = ({ children, value }) => (
  <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};