import { createContext } from 'react';
import type { WalletContextState } from '@solana/wallet-adapter-react';
import type { SIWSSession } from '../hooks/useSIWS';

// Updated for Solana wallet integration with SIWS
export interface AuthContextType {
  isAuthenticated: boolean;
  address: string | null;
  provider: WalletContextState | null; // Solana wallet provider
  signer: WalletContextState | null; // Solana wallet signer
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error';
  switchNetwork: () => Promise<void>;
  // SIWS Authentication
  authenticate: () => Promise<boolean>;
  logout: () => void;
  isSessionValid: () => boolean;
  authError: string | null;
  expectedChainId: number;
  expectedNetworkName: string;
  setError: (err: string | null) => void;
  // SIWS session data
  session: SIWSSession | null;
  isSigningIn: boolean;
  signIn: () => Promise<void>;
  // Recovery functions
  forceReset: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// TODO: Solana wallet context in progress. See artifacts/intel-report-stage1-plan.artifact
// AI-NOTE: EVM/ethers.js version archived in legacy-evm/AuthContext.ts. Implement Solana logic here.