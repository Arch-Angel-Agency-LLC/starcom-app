import React, { useState, useCallback, useEffect } from 'react';
import { connectToWallet, disconnectWallet, isWalletConnected } from '../utils/wallet';
import { switchNetwork } from '../middleware/web3Middleware';
import { AuthContext } from './AuthContext';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: ethers.providers.ExternalProvider;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<{
    provider: ethers.providers.Web3Provider | null;
    address: string | null;
    signer: ethers.Signer | null;
  }>({ provider: null, address: null, signer: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWalletHandler = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const targetChainId = 1; // Example: Ethereum Mainnet
      const connection = await connectToWallet(targetChainId);
      setWallet(connection);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnectWalletHandler = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await disconnectWallet();
      setWallet({ provider: null, address: null, signer: null });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
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

  const value = {
    isAuthenticated: !!wallet.address,
    address: wallet.address,
    provider: wallet.provider,
    signer: wallet.signer,
    connectWallet: connectWalletHandler,
    disconnectWallet: disconnectWalletHandler,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};