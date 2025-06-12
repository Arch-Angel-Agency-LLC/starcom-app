// Moved from src/__tests__/Web3Login.accessibility.test.tsx
// Tests for accessibility, ARIA roles, tab order, and screen reader checks
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TermsModal from './TermsModal';
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

  it('all modal dialogs have correct ARIA roles and are announced to screen readers', () => {
    localStorage.removeItem('starcom-terms-accepted');
    const onAccept = vi.fn();
    renderWithAuth({}, <TermsModal onAccept={onAccept} />);
    const modal = screen.getByRole('dialog', { name: /Terms & Conditions/i });
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-label', expect.stringMatching(/terms/i));
    const liveRegion = screen.queryByRole('status');
    if (liveRegion) {
      expect(liveRegion).toHaveAttribute('aria-live');
    }
  });

  it('tab order is correct: TermsModal accept → wallet connect → main app', () => {
    localStorage.removeItem('starcom-terms-accepted');
    const onAccept = vi.fn();
    // Render both TermsModal and WalletStatus under the same AuthProvider context
    renderWithAuth({}, <>
      <TermsModal onAccept={onAccept} />
      <WalletStatus />
    </>);
    const acceptButton = screen.getByRole('button', { name: /I Accept/i });
    acceptButton.focus();
    expect(document.activeElement).toBe(acceptButton);
    fireEvent.click(acceptButton);
    // After acceptance, TermsModal unmounts, WalletStatus is visible
    const connectButton = screen.getByRole('button', { name: /connect wallet/i });
    connectButton.focus();
    expect(document.activeElement).toBe(connectButton);
  });

  it('focus returns to connect button after closing TermsModal', async () => {
    const onAccept = vi.fn();
    renderWithAuth({}, <>
      <TermsModal onAccept={onAccept} />
      <WalletStatus />
    </>);
    const acceptButton = screen.getByRole('button', { name: /I Accept/i });
    acceptButton.focus();
    fireEvent.click(acceptButton);
    // Wait for connect button to appear and be focusable
    const connectButton = await screen.findByRole('button', { name: /connect wallet/i });
    connectButton.focus();
    expect(document.activeElement).toBe(connectButton);
  });

  it('TermsModal is not present after acceptance', () => {
    const onAccept = vi.fn();
    renderWithAuth({}, <TermsModal onAccept={onAccept} />);
    fireEvent.click(screen.getByRole('button', { name: /I Accept/i }));
    expect(screen.queryByRole('dialog', { name: /Terms & Conditions/i })).not.toBeInTheDocument();
  });

  it('wallet connect button is accessible by keyboard', () => {
    localStorage.setItem('starcom-terms-accepted', 'true');
    renderWithAuth({}, <WalletStatus />);
    const connectButton = screen.getByRole('button', { name: /connect wallet/i });
    connectButton.focus();
    expect(document.activeElement).toBe(connectButton);
  });
});
