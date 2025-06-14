// Integration tests for WalletStatus modal behavior: error modal, focus trap, keyboard, modal unmounting
import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WalletStatus from './WalletStatus';
import { vi } from 'vitest';
import { AuthContextType } from '../../context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import userEvent from '@testing-library/user-event';
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

describe('WalletStatus Modal (integration)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    vi.clearAllMocks();
  });

  function ModalTestWrapper({ initialError, children, ...extra }: { initialError: string | null, children?: React.ReactNode }) {
    const [error, setError] = React.useState<string | null>(initialError);
    useEffect(() => {}, [error]);
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <RainbowKitProvider>
            <TestAuthProvider value={{ ...defaultAuthValue, error, setError: (err: string | null) => setError(err), connectionStatus: 'error', ...extra }}>
              {children || <WalletStatus />}
            </TestAuthProvider>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    );
  }

  it('closes error modal when Close button is clicked', async () => {
    render(<ModalTestWrapper initialError="Test error" />);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('modal-close'));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes error modal when Retry button is clicked', async () => {
    render(<ModalTestWrapper initialError="Test error" />);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes error modal when Switch Network button is clicked (if present)', async () => {
    render(
      <ModalTestWrapper initialError="Please switch to the correct network (chainId: 1)">
        {/* Pass expectedChainId and expectedNetworkName as extra props to TestAuthProvider via ...extra */}
      </ModalTestWrapper>
    );
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /switch network/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('modal remains open if setError is not called', async () => {
    const NoOpWrapper = ({ initialError }: { initialError: string }) => (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <RainbowKitProvider>
            <TestAuthProvider value={{ ...defaultAuthValue, error: initialError, setError: () => {}, connectionStatus: 'error' }}>
              <WalletStatus />
            </TestAuthProvider>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    );
    render(<NoOpWrapper initialError="Test error" />);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('modal-close'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('modal does not render if error is null', () => {
    render(<ModalTestWrapper initialError={null} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('modal reopens if error is set again after closing', async () => {
    function ReopenWrapper() {
      const [error, setError] = React.useState<string | null>('Test error');
      return (
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <RainbowKitProvider>
              <TestAuthProvider value={{ ...defaultAuthValue, error, setError: (err: string | null) => setError(err), connectionStatus: 'error' }}>
                <WalletStatus />
                <button onClick={() => setError('Another error')}>Trigger Error</button>
              </TestAuthProvider>
            </RainbowKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
      );
    }
    render(<ReopenWrapper />);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('modal-close'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await userEvent.click(screen.getByText('Trigger Error'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('traps focus in modal and closes on Escape', async () => {
    const Wrapper = () => {
      const [error, setError] = React.useState<string | null>('Please switch to the correct network (chainId: 1)');
      return (
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <RainbowKitProvider>
              <TestAuthProvider
                value={{
                  ...defaultAuthValue,
                  error,
                  setError: (err: string | null) => setError(err),
                  connectionStatus: 'error',
                  expectedChainId: 1,
                  expectedNetworkName: 'Mainnet',
                }}
              >
                <WalletStatus />
              </TestAuthProvider>
            </RainbowKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
      );
    };
    render(<Wrapper />);
    const dialog = await screen.findByRole('dialog');
    const closeBtn = screen.getByTestId('modal-close');
    closeBtn.focus();
    expect(document.activeElement).toBe(closeBtn);
    await userEvent.keyboard('{Tab}');
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows disconnect confirmation dialog and handles confirm/cancel actions', async () => {
    const disconnectWallet = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <RainbowKitProvider>
            <TestAuthProvider value={{
              ...defaultAuthValue,
              isAuthenticated: true,
              address: '0x123',
              disconnectWallet,
              connectionStatus: 'connected',
            }}>
              <WalletStatus />
            </TestAuthProvider>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    );
    // Open disconnect confirmation dialog
    await userEvent.click(screen.getByRole('button', { name: /disconnect/i }));
    const dialog = await screen.findByRole('dialog', { name: /disconnect wallet confirmation/i });
    expect(dialog).toBeInTheDocument();
    // Cancel action
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /disconnect wallet confirmation/i })).not.toBeInTheDocument();
    });
    expect(disconnectWallet).not.toHaveBeenCalled();
    // Reopen and confirm
    await userEvent.click(screen.getByRole('button', { name: /disconnect/i }));
    await userEvent.click(screen.getByRole('button', { name: /yes, disconnect/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /disconnect wallet confirmation/i })).not.toBeInTheDocument();
    });
    expect(disconnectWallet).toHaveBeenCalledTimes(1);
  });
});
