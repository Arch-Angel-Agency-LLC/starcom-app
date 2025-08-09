import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Import modules to patch before importing the component
import { RelayNodeIPFSService } from '../../../src/services/RelayNodeIPFSService';
import * as runtimeCfg from '../../../src/config/runtimeConfig';
import { UnifiedAuthContext } from '../../../src/security/context/AuthContext';

// Component under test
import Web3LoginPanel from '../../../src/components/Auth/Web3LoginPanel';

describe('Web3LoginPanel: dApp integrations', () => {
  const relay = RelayNodeIPFSService.getInstance();

  const providerValue: any = {
    isAuthenticated: true,
    isLoading: false,
    user: null,
    wallet: null,
    session: null,
    error: null,
    securityMetadata: {
      pqcAuthEnabled: false,
      didVerified: false,
      securityLevel: 'CLASSICAL',
      classificationLevel: 'UNCLASSIFIED',
      auditTrail: [],
      threatLevel: 'normal',
      lastSecurityCheck: new Date(),
      encryptionContext: { algorithm: 'AES-256-GCM', isQuantumSafe: false, keyRotationInterval: 3600000 }
    },
    securityClearance: 'unclassified',
    didAuthState: { credentials: [], verificationStatus: 'PENDING', trustScore: 0 },
    signIn: async () => {},
    signOut: async () => {},
    refreshSession: async () => true,
    enableQuantumSafeAuth: async () => true,
    rotateSecurity: async () => {},
    validateSecurityLevel: async () => true,
    emergencyLockdown: async () => {},
    clearSecurityData: async () => {},
    address: 'AbCdEf0123456789abcdef0123456789',
    connectionStatus: 'connected',
    connectWallet: async () => {},
    disconnectWallet: async () => {},
    switchNetwork: async () => {},
    authenticate: async () => {},
    logout: async () => {},
    isSessionValid: true,
    authError: null,
    expectedChainId: null,
    expectedNetworkName: 'Devnet',
    setError: () => {},
    isSigningIn: false,
    provider: null,
    forceReset: () => {},
    enableAutoAuth: () => {},
    autoAuthDisabled: false,
    authFailureCount: 0,
    signer: null,
    openWalletModal: () => {}
  };

  let cfgSpy: ReturnType<typeof vi.spyOn> | null = null;
  let relaySpy: ReturnType<typeof vi.spyOn> | null = null;

  beforeEach(() => {
    // Reset localStorage and spies
    localStorage.clear();
    // Default: relay unavailable, serverless disabled
    relaySpy = vi.spyOn(relay as any, 'getRelayNodeStatus').mockReturnValue({ available: false });
    // Reset runtime config spy
    cfgSpy = vi.spyOn(runtimeCfg, 'loadRuntimeConfig').mockResolvedValue({
      features: { serverlessPin: false },
      storage: { pinProvider: 'none' }
    } as any);
  });

  afterEach(() => {
    cfgSpy?.mockRestore();
    relaySpy?.mockRestore();
  });

  it('shows IPFS: RelayNode when relay is available', async () => {
  relaySpy?.mockReturnValue({ available: true });

    render(
      <UnifiedAuthContext.Provider value={providerValue}>
        <Web3LoginPanel />
      </UnifiedAuthContext.Provider>
    );

    expect(await screen.findByText(/IPFS: RelayNode/i)).toBeInTheDocument();
  });

  it('shows IPFS: Serverless Pin when enabled and healthy', async () => {
    // Force serverless enabled
    cfgSpy?.mockResolvedValue({
      features: { serverlessPin: true },
      storage: { pinProvider: 'pinata' }
    } as any);
    localStorage.setItem('serverless_pin_ok', 'true');

    render(
      <UnifiedAuthContext.Provider value={providerValue}>
        <Web3LoginPanel />
      </UnifiedAuthContext.Provider>
    );

    expect(await screen.findByText(/IPFS: Serverless Pin/i)).toBeInTheDocument();
    const chip = await screen.findByTitle(/Storage: Serverless Pin/);
    expect(chip).toBeInTheDocument();
  });

  it('shows Last Login CID link in account info when present', async () => {
    const cid = 'bafyTestCidExample123456';
    localStorage.setItem('last_login_cid', cid);

    render(
      <UnifiedAuthContext.Provider value={providerValue}>
        <Web3LoginPanel />
      </UnifiedAuthContext.Provider>
    );

    // Click address to open account info popup
    const addr = providerValue.address as string;
    const label = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    fireEvent.click(await screen.findByText(label));

    // Assert CID link appears
    await waitFor(() => expect(screen.getByText(/Last Login CID:/i)).toBeInTheDocument());
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `https://ipfs.io/ipfs/${cid}`);
  });
});
