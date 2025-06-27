// Unit tests for WalletStatus: rendering, UI states, connect/disconnect, banners, tooltips
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WalletStatus from './WalletStatus';
import { vi } from 'vitest';
import { AuthContextType } from '../../context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';
import { http } from 'wagmi';
// import userEvent from '@testing-library/user-event';
// import { Provider } from 'ethers';
import { TestAuthProvider } from '../../context/AuthContext.tsx';

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

function renderWithProviders(authValue: Partial<AuthContextType> = {}) {
  function Wrapper({ children }: { children?: React.ReactNode }) {
    const [error, setError] = React.useState(authValue.error ?? null);
    const mergedAuthValue = {
      ...defaultAuthValue,
      ...authValue,
      error,
      setError,
    };
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <RainbowKitProvider>
            <TestAuthProvider value={mergedAuthValue}>
              {children || <WalletStatus />}
            </TestAuthProvider>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    );
  }
  return render(<Wrapper />);
}

describe('WalletStatus (unit)', () => {
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

  it('shows success snackbar on connect', () => {
    renderWithProviders({ isAuthenticated: true, connectionStatus: 'connected' });
    expect(screen.getByText(/wallet connected/i)).toBeInTheDocument();
  });

  it('shows error snackbar on error', () => {
    renderWithProviders({ error: 'Something went wrong', connectionStatus: 'error' });
    expect(screen.getByText(/Error: Something went wrong/i)).toBeInTheDocument();
    const snackbars = screen.getAllByText(/something went wrong/i);
    expect(snackbars.length).toBeGreaterThanOrEqual(1);
    expect(snackbars.some(el => el.className.includes('snackbar'))).toBe(true);
  });

  it('shows network info banner', () => {
    const provider = {
      getNetwork: () => Promise.resolve({ name: 'Mainnet', chainId: 1 }),
    };
    renderWithProviders({
      isAuthenticated: true,
      address: '0x123',
      connectionStatus: 'connected',
      expectedChainId: 1,
      expectedNetworkName: 'Mainnet',
      provider: provider as unknown as import('ethers').Provider,
    });
    const mainnetEls = screen.getAllByText(/mainnet/i);
    expect(mainnetEls.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/connected to/i)).toBeInTheDocument();
  });

  it('shows tooltip on keyboard focus', async () => {
    renderWithProviders({ isAuthenticated: false, address: null, connectionStatus: 'idle' });
    const connectBtn = screen.getByRole('button', { name: /connect wallet/i });
    connectBtn.focus();
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(screen.queryByRole('tooltip')).toBeTruthy();
  });

  it('adapts UI for mobile viewport', () => {
    window.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));
    renderWithProviders({ isAuthenticated: false, address: null, connectionStatus: 'idle' });
    const btn = screen.getByRole('button', { name: /connect wallet/i });
    expect(btn).toBeVisible();
  });

  it('success snackbar dismisses automatically after timeout', async () => {
    vi.useFakeTimers();
    renderWithProviders({ isAuthenticated: true, connectionStatus: 'connected' });
    expect(screen.getByText(/wallet connected/i)).toBeInTheDocument();
    vi.advanceTimersByTime(3000); // Adjust timeout as needed
    await Promise.resolve();
    expect(screen.queryByText(/wallet connected/i)).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('success snackbar can be dismissed by user', async () => {
    renderWithProviders({ isAuthenticated: true, connectionStatus: 'connected' });
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByText(/wallet connected/i)).not.toBeInTheDocument();
    });
  });
});
