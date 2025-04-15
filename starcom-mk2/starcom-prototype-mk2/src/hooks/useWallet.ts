import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { fetchWalletBalance, verifyNetwork } from '../middleware/web3Middleware';

interface WalletState {
  balance: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useWallet = () => {
  const { isAuthenticated, address, provider, signer, connectWallet, disconnectWallet } = useAuth();
  const [walletState, setWalletState] = useState<WalletState>({
    balance: null,
    isLoading: false,
    error: null,
  });

  const fetchBalance = useCallback(async () => {
    if (!provider || !address) return;
    setWalletState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const balance = await fetchWalletBalance({ provider, address, signer });
      setWalletState((prev) => ({
        ...prev,
        balance,
        isLoading: false,
      }));
    } catch (error) {
      setWalletState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch balance',
        isLoading: false,
      }));
    }
  }, [provider, address, signer]);

  const validateNetwork = useCallback(async (expectedChainId: number) => {
    if (!provider) {
      throw new Error('No provider available to validate network.');
    }
    try {
      await verifyNetwork({ provider, address, signer }, expectedChainId);
    } catch (error) {
      console.error('Network validation failed:', error);
      throw error;
    }
  }, [provider, address, signer]);

  useEffect(() => {
    if (isAuthenticated && address) {
      fetchBalance();
    }
  }, [isAuthenticated, address, fetchBalance]);

  return {
    ...walletState,
    isAuthenticated,
    address,
    connectWallet,
    disconnectWallet,
    refreshBalance: fetchBalance,
    validateNetwork,
  };
};