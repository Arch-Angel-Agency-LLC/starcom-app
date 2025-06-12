import { BrowserProvider, Signer, Eip1193Provider } from 'ethers';

export interface WalletConnection {
  address: string;
  provider: BrowserProvider;
  signer: Signer;
}

// Updated type definition for Ethereum to match ethers' Eip1193Provider
interface Ethereum extends Eip1193Provider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: Array<unknown> | object }) => Promise<unknown>;
}

declare global {
  interface Window {
    ethereum?: Ethereum;
  }
}

// Added index signature to SUPPORTED_NETWORKS type
export const SUPPORTED_NETWORKS: {
  [chainId: number]: {
    name: string;
    rpcUrls: string[];
    nativeCurrency: { name: string; symbol: string; decimals: number };
    blockExplorerUrls: string[];
  };
} = {
  1: {
    name: 'Ethereum Mainnet',
    rpcUrls: ['https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://etherscan.io'],
  },
  11155111: {
    name: 'Sepolia Testnet',
    rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID'],
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  // Add more networks as needed
};

export const connectToWallet = async (targetChainId: number): Promise<WalletConnection> => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }
  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);
  const network = await provider.getNetwork();
  // Convert network.chainId to number for comparison
  if (Number(network.chainId) !== targetChainId) {
    throw new Error(`Please switch to the correct network (chainId: ${targetChainId})`);
  }
  const signer = await provider.getSigner();
  return {
    address: accounts[0],
    provider,
    signer,
  };
};

export const disconnectWallet = async (): Promise<void> => {
  console.warn('MetaMask does not support programmatic disconnection.');
};

export const isWalletConnected = async (): Promise<boolean> => {
  try {
    if (!window.ethereum) {
      return false;
    }
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.listAccounts();
    return accounts.length > 0;
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return false;
  }
};

export const switchNetwork = async (chainId: number): Promise<void> => {
  try {
    if (!window.ethereum) {
      throw new Error('No Web3 provider detected. Please install MetaMask.');
    }

    const ethereum = window.ethereum;

    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error) {
    console.error('Error switching network:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred while switching networks.');
    }
  }
};

export const addNetwork = async (networkParams: {
  chainId: number;
  chainName: string;
  rpcUrls: string[];
  nativeCurrency: { name: string; symbol: string; decimals: number };
  blockExplorerUrls?: string[];
}): Promise<void> => {
  try {
    if (!window.ethereum) {
      throw new Error('No Web3 provider detected. Please install MetaMask.');
    }

    const ethereum = window.ethereum;

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
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred while adding the network.');
    }
  }
};