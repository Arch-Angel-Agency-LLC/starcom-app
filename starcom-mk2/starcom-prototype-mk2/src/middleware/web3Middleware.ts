import { ethers } from 'ethers';
import { WalletConnection } from '../utils/wallet';

export const requireWalletConnection = async (
  wallet: WalletConnection | null,
  callback: (connection: WalletConnection) => Promise<any>
) => {
  if (!wallet || !wallet.address || !wallet.provider || !wallet.signer) {
    throw new Error('Wallet not connected. Please connect your wallet.');
  }
  try {
    return await callback(wallet);
  } catch (error) {
    console.error('Error during wallet operation:', error);
    throw error;
  }
};

export const fetchWalletBalance = async (
  wallet: WalletConnection | null
): Promise<string> => {
  return requireWalletConnection(wallet, async ({ provider, address }) => {
    try {
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      throw new Error('Failed to fetch wallet balance');
    }
  });
};

export const verifyNetwork = async (
  wallet: WalletConnection | null,
  expectedChainId: number
): Promise<void> => {
  return requireWalletConnection(wallet, async ({ provider }) => {
    try {
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== expectedChainId) {
        throw new Error(
          `Incorrect network. Expected chainId ${expectedChainId}, got ${network.chainId}`
        );
      }
    } catch (error) {
      console.error('Error verifying network:', error);
      throw error;
    }
  });
};

export const switchNetwork = async (
  wallet: WalletConnection | null,
  targetChainId: number
): Promise<void> => {
  return requireWalletConnection(wallet, async ({ provider }) => {
    try {
      const ethereum = provider.provider as any; // Access the raw provider
      if (!ethereum.request) {
        throw new Error('Ethereum provider does not support the `request` method.');
      }

      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error) {
      console.error('Error switching network:', error);
      throw new Error('Failed to switch network. Please try again.');
    }
  });
};

export const addNetwork = async (
  wallet: WalletConnection | null,
  networkParams: {
    chainId: number;
    chainName: string;
    rpcUrls: string[];
    nativeCurrency: { name: string; symbol: string; decimals: number };
    blockExplorerUrls?: string[];
  }
): Promise<void> => {
  return requireWalletConnection(wallet, async ({ provider }) => {
    try {
      const ethereum = provider.provider as any; // Access the raw provider
      if (!ethereum.request) {
        throw new Error('Ethereum provider does not support the `request` method.');
      }

      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${networkParams.chainId.toString(16)}`,
            chainName: networkParams.chainName,
            rpcUrls: networkParams.rpcUrls,
            nativeCurrency: networkParams.nativeCurrency,
            blockExplorerUrls: networkParams.blockExplorerUrls || [],
          },
        ],
      });
    } catch (error) {
      console.error('Error adding network:', error);
      throw new Error('Failed to add network. Please try again.');
    }
  });
};