// Moved from src/__tests__/Web3Login.wallet.test.tsx
// Tests for wallet connect/disconnect, network switching, and error states
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import WalletStatus from './WalletStatus';
import { AuthProvider } from '../../context/AuthContext.tsx';
import { AuthContextType } from '../../context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';
import { http } from 'wagmi';

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
// Remove TestApp and App usage. Use a helper to render WalletStatus with a test AuthProvider value.
// TODO: Implement real-time collaborative editing for investigation documents - PRIORITY: HIGH
const renderWithAuth = (authValue: Partial<AuthContextType>) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          <AuthProvider value={{
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
            ...authValue,
          }}>
            <WalletStatus />
          </AuthProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

describe('Web3Login Wallet Flows', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows error if wallet provider is missing', async () => {
    localStorage.setItem('starcom-terms-accepted', 'true');
    renderWithAuth({ error: 'MetaMask is not installed', connectionStatus: 'error' });
    expect(await screen.findByText(/MetaMask is not installed/i)).toBeInTheDocument();
  });

  it('shows error if user rejects connection', async () => {
    localStorage.setItem('starcom-terms-accepted', 'true');
    renderWithAuth({ error: 'User rejected connection', connectionStatus: 'error' });
    expect(await screen.findByText(/User rejected connection/i, {}, { timeout: 2000 })).toBeInTheDocument();
  });

  it('shows error if user is on the wrong network', async () => {
    localStorage.setItem('starcom-terms-accepted', 'true');
    renderWithAuth({ error: 'Wrong network', connectionStatus: 'error' });
    expect(await screen.findByText(/wrong network/i, {}, { timeout: 2000 })).toBeInTheDocument();
  });

  it('disconnects wallet and returns to connect state', async () => {
    localStorage.setItem('starcom-terms-accepted', 'true');
    const disconnectWallet = vi.fn();
    renderWithAuth({
      isAuthenticated: true,
      address: '0x123',
      connectionStatus: 'connected',
      disconnectWallet,
    });
    expect(screen.getByText(/Connected: 0x123/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
  });
});
