// Moved from src/__tests__/TokenGatedPage.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TokenGatedPage from './TokenGatedPage';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import { AuthProvider } from '../../context/AuthContext.tsx';
import { AuthContextType } from '../../context/AuthContext';
import { OnChainRole } from '../../hooks/useOnChainRoles';
import { TokenGate as TokenGateType } from '../../hooks/useTokenGate';

let mockRoles: OnChainRole[] = [];
let mockTokenGate: TokenGateType = { tokenAddress: '', requiredBalance: '', hasAccess: false };

const config = getDefaultConfig({
  appName: 'Starcom dApp',
  projectId: 'test',
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});
const queryClient = new QueryClient();
const defaultAuthValue: AuthContextType = {
  isAuthenticated: false,
  address: null,
  provider: null,
  signer: null,
  connectWallet: vi.fn(),
  disconnectWallet: vi.fn(),
  isLoading: false,
  error: null,
  connectionStatus: 'idle',
  switchNetwork: vi.fn(),
  authenticate: vi.fn(async () => true),
  logout: vi.fn(),
  isSessionValid: vi.fn(() => false),
  authError: null,
  expectedChainId: 1,
  expectedNetworkName: 'Mainnet',
  setError: vi.fn(),
};
const renderWithProviders = (authValue: Partial<AuthContextType> = {}) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          <AuthProvider value={{ ...defaultAuthValue, ...authValue }}>
            <TokenGatedPage />
          </AuthProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

// Keep these mocks:
vi.mock('../../hooks/useOnChainRoles', () => ({
  useOnChainRoles: () => mockRoles,
}));
vi.mock('../../hooks/useTokenGate', () => ({
  useTokenGate: () => mockTokenGate,
}));
vi.mock('../../hooks/useSIWEAuth', () => ({
  useSIWEAuth: () => ({
    authenticate: vi.fn(async () => true),
    isAuthenticated: vi.fn(() => true),
    isAuthenticating: false,
    authError: null,
    logout: vi.fn(),
    isSessionValid: vi.fn(() => true),
  }),
}));

describe('TokenGatedPage', () => {
  afterEach(() => {
    mockRoles = [];
    mockTokenGate = { tokenAddress: '', requiredBalance: '', hasAccess: false };
    vi.clearAllMocks();
  });

  it('prompts to connect wallet if not connected', () => {
    renderWithProviders({ address: null });
    expect(screen.getByText(/please connect your wallet/i)).toBeInTheDocument();
  });

  it('shows NFT access denied if user does not have NFT', () => {
    mockTokenGate = { tokenAddress: '0xNFT', requiredBalance: '1', hasAccess: false };
    renderWithProviders({ address: '0x123' });
    expect(screen.getByText(/access denied: you need the nft/i)).toBeInTheDocument();
  });

  it('shows admin access denied if user has NFT but not admin', () => {
    mockTokenGate = { tokenAddress: '0xNFT', requiredBalance: '1', hasAccess: true };
    mockRoles = [ { role: 'USER', hasRole: true }, { role: 'ADMIN', hasRole: false } ];
    renderWithProviders({ address: '0x123' });
    expect(screen.getByText(/access denied: admins only/i)).toBeInTheDocument();
  });

  it('shows protected content if user has NFT and admin role', () => {
    mockTokenGate = { tokenAddress: '0xNFT', requiredBalance: '1', hasAccess: true };
    mockRoles = [ { role: 'USER', hasRole: true }, { role: 'ADMIN', hasRole: true } ];
    renderWithProviders({ address: '0x123' });
    expect(screen.getByText(/protected token-gated page/i)).toBeInTheDocument();
    expect(screen.getByText(/welcome, admin/i)).toBeInTheDocument();
  });
});
