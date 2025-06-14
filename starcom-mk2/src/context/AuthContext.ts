import { createContext } from 'react';
import { Provider, Signer } from 'ethers';

export interface AuthContextType {
  isAuthenticated: boolean;
  address: string | null;
  provider: Provider | null;
  signer: Signer | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error';
  switchNetwork: () => Promise<void>;
  // Add SIWE/localStorage session helpers for decentralized login
  authenticate: () => Promise<boolean>;
  logout: () => void;
  isSessionValid: () => boolean;
  authError: string | null;
  expectedChainId: number;
  expectedNetworkName: string;
  setError: (err: string | null) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
export { useAuth } from './AuthContext.tsx';