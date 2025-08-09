import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Web3LoginPanel from '../Web3LoginPanel';
import { UnifiedAuthContext } from '../../../security/context/AuthContext';

// Mock runtime config and relay service used inside the panel
vi.mock('../../../services/RelayNodeIPFSService', () => {
  return {
    RelayNodeIPFSService: {
      getInstance: () => ({
        getRelayNodeStatus: () => ({ available: false })
      })
    }
  };
});

vi.mock('../../../config/runtimeConfig', async () => {
  return {
    loadRuntimeConfig: async () => ({
      features: { serverlessPin: true },
      storage: { pinProvider: 'pinata' }
    })
  };
});

function renderWithAuth(ui: React.ReactElement, contextValue: any) {
  return render(
    <UnifiedAuthContext.Provider value={contextValue}>
      {ui}
    </UnifiedAuthContext.Provider>
  );
}

describe('Web3LoginPanel storage status and receipt link', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('shows Serverless Pin status when relay is unavailable and serverless is enabled', async () => {
    // Simulate healthy serverless pin
    localStorage.setItem('serverless_pin_ok', 'true');

    const ctx: any = {
      isAuthenticated: false,
      isLoading: false,
      address: null,
      session: null,
      connectionStatus: 'disconnected',
      expectedNetworkName: 'Devnet',
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      switchNetwork: vi.fn(),
      error: null,
    };

    renderWithAuth(<Web3LoginPanel />, ctx);

    const chip = await screen.findByText(/IPFS: Serverless Pin/i);
    expect(chip).toBeInTheDocument();
  });

  it('marks status as unhealthy when pre-check failed', async () => {
    localStorage.setItem('serverless_pin_ok', 'false');

    const ctx: any = {
      isAuthenticated: false,
      isLoading: false,
      address: null,
      session: null,
      connectionStatus: 'disconnected',
      expectedNetworkName: 'Devnet',
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      switchNetwork: vi.fn(),
      error: null,
    };

    renderWithAuth(<Web3LoginPanel />, ctx);

    const chip = await screen.findByText(/IPFS: Serverless Pin/i);
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveAttribute('title', expect.stringMatching(/unhealthy/i));
  });

  it('renders Last Login CID link when stored', async () => {
    localStorage.setItem('serverless_pin_ok', 'true');
    localStorage.setItem('last_login_cid', 'bafyreiaaaaaaaaaaaaaaaaaaaaaaaaa');

    const ctx: any = {
      isAuthenticated: true,
      isLoading: false,
      address: 'So1ana111111111111111111111111111111111111',
      session: null,
      connectionStatus: 'connected',
      expectedNetworkName: 'Devnet',
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      switchNetwork: vi.fn(),
      error: null,
    };

    renderWithAuth(<Web3LoginPanel />, ctx);

    // Open account info popup
    const addr = await screen.findByText(/So1ana/i);
    addr.click();

    const link = await screen.findByRole('link', { name: /bafyreia/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('ipfs.io/ipfs/'));
  });
});
