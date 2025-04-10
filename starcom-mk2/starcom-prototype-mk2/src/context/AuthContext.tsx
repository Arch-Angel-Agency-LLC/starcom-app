import React, { createContext, useState, useCallback } from 'react';
import { ethers } from 'ethers';

interface AuthContextType {
  isAuthenticated: boolean;
  address: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  address: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) throw new Error('No Web3 wallet detected. Install MetaMask.');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      setAddress(userAddress);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error; // Let components handle the error
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
  }, []);

  const value = {
    isAuthenticated: !!address,
    address,
    connectWallet,
    disconnectWallet,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => React.useContext(AuthContext);