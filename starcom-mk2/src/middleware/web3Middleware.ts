import type { WalletConnection } from '../utils/wallet';

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

export const fetchWalletBalance = async (address: string): Promise<string> => {
  if (!address) {
    throw new Error('Wallet address is required to fetch balance.');
  }

  // Simulate fetching balance (replace with actual implementation)
  return '0.0';
};

export const verifyNetwork = (chainId: number, expectedChainId: number): void => {
  if (chainId !== expectedChainId) {
    throw new Error(`Incorrect network. Expected chainId ${expectedChainId}, got ${chainId}`);
  }
};

export const switchNetwork = async (chainId: number): Promise<void> => {
  if (!window.ethereum) {
    throw new Error('No Web3 provider detected. Please install MetaMask.');
  }

  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: `0x${chainId.toString(16)}` }],
  });
};

export const addNetwork = async (
  ethereumProvider: any, // Replace with a specific type if available
  networkParams: {
    chainId: number;
    chainName: string;
    rpcUrls: string[];
    nativeCurrency: { name: string; symbol: string; decimals: number };
    blockExplorerUrls?: string[];
  }
): Promise<void> => {
  if (!ethereumProvider || !ethereumProvider.request) {
    throw new Error('Ethereum provider does not support the `request` method.');
  }

  await ethereumProvider.request({
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
};