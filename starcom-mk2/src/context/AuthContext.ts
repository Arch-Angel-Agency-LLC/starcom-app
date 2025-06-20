import { createContext } from 'react';

// Updated for Solana wallet integration
export interface AuthContextType {
  isAuthenticated: boolean;
  address: string | null;
  provider: any | null; // Solana wallet provider
  signer: any | null; // Solana wallet signer
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

// TODO: Solana wallet context in progress. See artifacts/intel-report-stage1-plan.artifact
// AI-NOTE: EVM/ethers.js version archived in legacy-evm/AuthContext.ts. Implement Solana logic here.