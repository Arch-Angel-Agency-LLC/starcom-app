import { ethers } from 'ethers';

export interface WalletConnection {
  address: string;
  provider: ethers.BrowserProvider;
  signer: ethers.Signer;
}

// Updated type definition for Ethereum to match ethers' Eip1193Provider
interface Ethereum extends ethers.Eip1193Provider {
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: Ethereum;
  }
}

export const connectToWallet = async (): Promise<WalletConnection> => {
  try {
    if (!window.ethereum) {
      throw new Error('No Web3 provider detected. Please install MetaMask.');
    }

    const ethereum = window.ethereum;

    const provider = new ethers.BrowserProvider(ethereum);

    const accounts = (await ethereum.request({
      method: 'eth_requestAccounts',
    })) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found.');
    }

    const signer = await provider.getSigner();
    const address = accounts[0];

    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(1)) {
      throw new Error(`Please switch to Ethereum Mainnet. Detected chainId: ${network.chainId}`);
    }

    return { address, provider, signer };
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred while connecting to the wallet.');
    }
  }
};

export const disconnectWallet = async (): Promise<void> => {
  console.warn('MetaMask does not support programmatic disconnection.');
};

export const isWalletConnected = async (): Promise<boolean> => {
  try {
    if (!window.ethereum) {
      return false;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
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