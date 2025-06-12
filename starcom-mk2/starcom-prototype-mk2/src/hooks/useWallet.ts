import { useCallback, useEffect, useState } from 'react';
import { fetchWalletBalance, switchNetwork } from '../middleware/web3Middleware';

interface WalletState {
  balance: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    balance: null,
    isLoading: false,
    error: null,
  });

  const fetchBalance = useCallback(async (address: string) => {
    setWalletState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const balance = await fetchWalletBalance(address);
      setWalletState((prev) => ({ ...prev, balance, isLoading: false }));
    } catch (error) {
      setWalletState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch balance',
        isLoading: false,
      }));
    }
  }, []);

  const validateNetwork = useCallback(async (expectedChainId: number) => {
    try {
      await switchNetwork(expectedChainId);
    } catch (error) {
      setWalletState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to switch network',
      }));
    }
  }, []);

  return {
    ...walletState,
    fetchBalance,
    validateNetwork,
  };
};