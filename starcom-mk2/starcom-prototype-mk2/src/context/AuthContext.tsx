import React, { useState, useCallback, useEffect } from 'react';
import { connectToWallet, disconnectWallet, isWalletConnected } from '../utils/wallet';
import { verifyNetwork, switchNetwork } from '../middleware/web3Middleware';
import { AuthContext } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState(() => {
    const savedWallet = localStorage.getItem('wallet');
    return savedWallet ? JSON.parse(savedWallet) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWalletHandler = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const connection = await connectToWallet();
      await verifyNetwork(connection, 1); // Example: Validate Ethereum Mainnet
      setWallet(connection);
      localStorage.setItem('wallet', JSON.stringify(connection));
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnectWalletHandler = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await disconnectWallet();
      setWallet(null);
      localStorage.removeItem('wallet');
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchNetworkHandler = useCallback(async (targetChainId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!wallet) throw new Error('No wallet connected.');
      await switchNetwork(targetChainId);
    } catch (error) {
      console.error('Network switch failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    const checkConnection = async () => {
      if (await isWalletConnected()) {
        await connectWalletHandler();
      }
    };
    checkConnection();
  }, [connectWalletHandler]);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWalletHandler();
        } else if (accounts[0] !== wallet?.address) {
          connectWalletHandler();
        }
      };

      const handleChainChanged = () => {
        connectWalletHandler();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [connectWalletHandler, disconnectWalletHandler, wallet?.address]);

  const value = {
    isAuthenticated: !!wallet?.address,
    address: wallet?.address ?? null,
    provider: wallet?.provider ?? null,
    signer: wallet?.signer ?? null,
    connectWallet: connectWalletHandler,
    disconnectWallet: disconnectWalletHandler,
    switchNetwork: switchNetworkHandler,
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