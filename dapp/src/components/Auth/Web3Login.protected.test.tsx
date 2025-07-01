// Tests for protected route, token-gated, and denial/fallback UI
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TokenGatedPage from './TokenGatedPage';
import { AuthProvider } from '../../context/AuthContext.tsx';
import { AuthContextType } from '../../context/AuthContext';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import * as useTokenGateModule from '../../hooks/useTokenGate';
import * as useOnChainRolesModule from '../../hooks/useOnChainRoles';

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
// TODO: Implement globe bookmarking and saved viewpoints functionality - PRIORITY: MEDIUM
const renderWithAuth = (authValue: Partial<AuthContextType>, children: React.ReactNode) => {
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
            {children}
          </AuthProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

describe('TokenGatedPage Protected Route Flows', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('denies access to protected route and shows fallback UI if not authenticated', () => {
    renderWithAuth({ isAuthenticated: false, address: null }, <TokenGatedPage />);
    expect(screen.getByText(/please connect your wallet/i)).toBeInTheDocument();
    expect(screen.queryByText(/protected token-gated page/i)).not.toBeInTheDocument();
  });

  it('protected route shows denial UI if user lacks required token or role', () => {
    // Mock useTokenGate and useOnChainRoles as needed
    renderWithAuth({ isAuthenticated: true, address: '0x123' }, <TokenGatedPage />);
    expect(screen.queryByText(/access denied|connect your wallet/i)).toBeInTheDocument();
  });

  it('shows protected content if user is authenticated and has access', () => {
    // Mock useTokenGate and useOnChainRoles to grant access
    vi.spyOn(useTokenGateModule, 'useTokenGate').mockReturnValue({ hasAccess: true, loading: false, error: null });
    vi.spyOn(useOnChainRolesModule, 'useOnChainRoles').mockReturnValue([{ role: 'ADMIN', hasRole: true }]);
    renderWithAuth({ isAuthenticated: true, address: '0x123' }, <TokenGatedPage />);
    expect(screen.queryByText(/access denied|connect your wallet/i)).not.toBeInTheDocument();
    expect(screen.getByText(/protected token-gated page/i)).toBeInTheDocument();
  });
});
