import React, { useState, useCallback, useEffect } from 'react';
import { connectToWallet, disconnectWallet, isWalletConnected } from '../utils/wallet';
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
  async function authenticate() {
    if (!wallet.address || !wallet.signer) {
      setAuthError('Wallet not connected');
      return false;
    }
    setAuthError(null);
    try {
      const nonce = Math.floor(Math.random() * 1000000).toString();
      const message = `Sign this message to authenticate: ${nonce}`;
      const signature = await wallet.signer.signMessage(message);
      const recovered = verifyMessage(message, signature);
      if (recovered.toLowerCase() === wallet.address.toLowerCase()) {
        localStorage.setItem('auth', JSON.stringify({ address: wallet.address, signature, nonce, expiry: Date.now() + 86400000 }));
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

  const connectWalletHandler = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setConnectionStatus('connecting');
    try {
      const targetChainId = 1; // Example: Ethereum Mainnet
      const connection = await connectToWallet(targetChainId);
      setWallet(connection);
      setConnectionStatus('connected');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred.');
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnectWalletHandler = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setConnectionStatus('connecting');
    try {
      await disconnectWallet();
      setWallet({ provider: null, address: null, signer: null });
      setConnectionStatus('idle');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred.');
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchNetworkHandler = useCallback(async (targetChainId: number) => {
    try {
      await switchNetwork(targetChainId);
      setConnectionStatus('connected');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred.');
      setConnectionStatus('error');
    }
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      if (await isWalletConnected()) {
        await connectWalletHandler();
      }
    };
    checkConnection();
  }, [connectWalletHandler]);

  let contextValue = {
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
  };

  // If a value prop is provided (for testing), override the context value
  if (value) {
    contextValue = value;
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