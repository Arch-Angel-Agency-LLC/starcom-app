// Moved from src/__tests__/Web3Login.accessibility.test.tsx
// Tests for accessibility, ARIA roles, tab order, and screen reader checks
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WalletStatus from './WalletStatus';
import { TestAuthProvider } from '../../context/AuthContext.tsx';
import { AuthContextType } from '../../context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import { vi } from 'vitest';

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
// TODO: Add support for dynamic globe theming and visual customization - PRIORITY: LOW
const renderWithAuth = (authValue: Partial<AuthContextType>, children: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          <TestAuthProvider value={{
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
            {children}
          </TestAuthProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

describe('Web3Login Accessibility Flows', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('wallet connect button is accessible by keyboard', () => {
    localStorage.setItem('starcom-terms-accepted', 'true');
    renderWithAuth({}, <WalletStatus />);
    const connectButton = screen.getByRole('button', { name: /connect wallet/i });
    connectButton.focus();
    expect(document.activeElement).toBe(connectButton);
  });
});
