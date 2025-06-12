import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WalletStatus from './WalletStatus';
import { vi } from 'vitest';
import { AuthContextType } from '../../context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';
import { http } from 'wagmi';

// Mock useAuth for all possible import paths
vi.mock('../../context/AuthContext.tsx', () => ({
  ...vi.importActual('../../context/AuthContext.tsx'),
  useAuth: () => mockAuthValue,
}));

let mockAuthValue: Partial<AuthContextType> = {};

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
};

const renderWithProviders = (authValue: Partial<AuthContextType> = {}) => {
  mockAuthValue = { ...defaultAuthValue, ...authValue };
  return render(
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          <WalletStatus />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

describe('WalletStatus (unit, artifact-driven)', () => {
  beforeEach(() => {
    mockAuthValue = { ...defaultAuthValue };
  });

  it('renders error state', () => {
    renderWithProviders({ error: 'MetaMask is not installed', connectionStatus: 'error' });
    expect(screen.getByText(/Error: MetaMask is not installed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('renders connected state', () => {
    renderWithProviders({ isAuthenticated: true, address: '0x123', connectionStatus: 'connected' });
    expect(screen.getByText(/Connected: 0x123/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
  });

  it('renders idle state (connect button)', () => {
    renderWithProviders({ isAuthenticated: false, address: null, connectionStatus: 'idle' });
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
  });
});
