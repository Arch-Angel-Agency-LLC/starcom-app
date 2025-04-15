import { createContext } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  address: string | null;
  provider: any;
  signer: any;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);