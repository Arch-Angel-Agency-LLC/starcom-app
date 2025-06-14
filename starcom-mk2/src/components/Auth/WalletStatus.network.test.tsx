// Tests for WalletStatus network switching, banners, and network-related UI
import React from 'react';
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
import userEvent from '@testing-library/user-event';
import { Provider } from 'ethers';
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

describe('WalletStatus Network', () => {
  it('updates network info banner on network change', async () => {
    const provider: Provider & { getNetwork: ReturnType<typeof vi.fn> } = {
      getNetwork: vi.fn().mockResolvedValue({ name: 'Mainnet', chainId: 1 }),
    } as any;
    render(
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <RainbowKitProvider>
            <TestAuthProvider value={{
              ...defaultAuthValue,
              isAuthenticated: true,
              address: '0x123',
              connectionStatus: 'connected',
              expectedChainId: 1,
              expectedNetworkName: 'Mainnet',
              provider,
            }}>
              <WalletStatus />
            </TestAuthProvider>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    );
    expect(screen.getAllByText(/mainnet/i).length).toBeGreaterThanOrEqual(1);
    provider.getNetwork.mockResolvedValueOnce({ name: 'Sepolia', chainId: 11155111 });
    render(
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <RainbowKitProvider>
            <TestAuthProvider value={{
              ...defaultAuthValue,
              isAuthenticated: true,
              address: '0x123',
              connectionStatus: 'connected',
              expectedChainId: 11155111,
              expectedNetworkName: 'Sepolia',
              provider,
            }}>
              <WalletStatus />
            </TestAuthProvider>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    );
    expect(screen.getAllByText(/sepolia/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows confirmation dialog before switch network', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <RainbowKitProvider>
            <TestAuthProvider value={{ isAuthenticated: true, address: '0x123', connectionStatus: 'connected', ...defaultAuthValue }}>
              <WalletStatus />
            </TestAuthProvider>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    );
    const btn = screen.getByRole('button', { name: /switch network/i });
    userEvent.click(btn);
    expect(await screen.findByText(/are you sure you want to switch/i)).toBeInTheDocument();
  });
});
