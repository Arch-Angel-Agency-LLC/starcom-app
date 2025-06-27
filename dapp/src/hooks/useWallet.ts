import { useAuth } from './useAuth';
import { useCallback, useState } from 'react';
import { fetchWalletBalance } from '../middleware/web3Middleware';

export interface WalletState {
  balance: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useWallet = () => {
  const { address, provider } = useAuth();
  const [walletState, setWalletState] = useState<WalletState>({
    balance: null,
    isLoading: false,
    error: null,
  });

  const fetchBalance = useCallback(async () => {
    if (!address || !provider) return;
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
  }, [address, provider]);

  return {
    ...walletState,
    fetchBalance,
    address,
    provider,
  };
};