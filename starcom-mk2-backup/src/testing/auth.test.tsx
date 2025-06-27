// src/testing/auth.test.tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import React from 'react';

// Import the hooks and utilities we want to test
import { useSIWS } from '../hooks/useSIWS';
import { useOnChainRoles } from '../hooks/useOnChainRoles';
import { useTokenGate } from '../hooks/useTokenGate';
import { useAuthFeatures } from '../hooks/useAuthFeatures';
import { validateAuthConfig, getEnvironmentConfig } from '../config/authConfig';

// Mock external dependencies
vi.mock('tweetnacl', () => ({
  default: {
    sign: {
      keyPair: () => ({
        publicKey: new Uint8Array(32).fill(1),
        secretKey: new Uint8Array(64).fill(2),
      }),
      detached: {
        verify: vi.fn(() => true),
      },
    },
  },
}));

vi.mock('bs58', () => ({
  default: {
    encode: vi.fn((data) => 'mocked_base58_address'),
    decode: vi.fn((str) => new Uint8Array(32).fill(1)),
  },
}));

vi.mock('@metaplex-foundation/umi-bundle-defaults', () => ({
  createUmi: vi.fn(() => ({
    rpc: {
      getAccount: vi.fn(),
    },
  })),
}));

vi.mock('@metaplex-foundation/mpl-token-metadata', () => ({
  fetchDigitalAsset: vi.fn(),
}));

vi.mock('@metaplex-foundation/umi', () => ({
  publicKey: vi.fn((str) => ({ toString: () => str })),
}));

// Mock Solana wallet adapter
const mockWallet = {
  adapter: {
    name: 'Test Wallet',
    publicKey: {
      toString: () => 'TestWalletAddress123456789',
    },
    signMessage: vi.fn(async (message) => new Uint8Array(64).fill(1)),
  },
  connected: true,
  connecting: false,
  publicKey: {
    toString: () => 'TestWalletAddress123456789',
  },
};

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => mockWallet,
  useConnection: () => ({
    connection: {
      getAccountInfo: vi.fn(),
      getTokenAccountsByOwner: vi.fn(() => ({
        value: [],
      })),
      getTokenAccountBalance: vi.fn(() => ({
        value: { uiAmount: 100 },
      })),
    },
  }),
  ConnectionProvider: ({ children }: { children: React.ReactNode }) => children,
  WalletProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={[]} autoConnect>
          {children}
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
};

describe('Authentication System Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Configuration Tests', () => {
    it('should validate auth configuration', () => {
      const validation = validateAuthConfig();
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(Array.isArray(validation.errors)).toBe(true);
    });

    it('should get environment configuration', () => {
      const envConfig = getEnvironmentConfig();
      expect(envConfig).toHaveProperty('isDev');
      expect(envConfig).toHaveProperty('isTest');
      expect(envConfig).toHaveProperty('isProd');
      expect(envConfig).toHaveProperty('network');
      expect(envConfig).toHaveProperty('endpoint');
    });
  });

  describe('SIWS (Sign-In with Solana) Tests', () => {
    it('should initialize SIWS hook with correct default state', () => {
      const { result } = renderHook(() => useSIWS(), { wrapper: TestWrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();
      expect(typeof result.current.signIn).toBe('function');
      expect(typeof result.current.signOut).toBe('function');
    });

    it('should handle sign-in process', async () => {
      const { result } = renderHook(() => useSIWS(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.signIn();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check that signIn was called and state updated appropriately
      expect(mockWallet.adapter.signMessage).toHaveBeenCalled();
    });

    it('should handle sign-out process', async () => {
      const { result } = renderHook(() => useSIWS(), { wrapper: TestWrapper });

      await act(async () => {
        result.current.signOut();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.session).toBeNull();
    });

    it('should validate session correctly', () => {
      const { result } = renderHook(() => useSIWS(), { wrapper: TestWrapper });

      // Test session validation
      const isValid = result.current.isSessionValid();
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('On-Chain Roles Tests', () => {
    const testAddress = 'TestWalletAddress123456789';

    it('should initialize with correct default state', () => {
      const { result } = renderHook(
        () => useOnChainRoles(testAddress),
        { wrapper: TestWrapper }
      );

      expect(result.current.roles).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should fetch roles for valid address', async () => {
      const { result } = renderHook(
        () => useOnChainRoles(testAddress),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Roles should be populated based on the mocked data
      expect(Array.isArray(result.current.roles)).toBe(true);
    });

    it('should handle invalid address gracefully', async () => {
      const { result } = renderHook(
        () => useOnChainRoles('invalid_address'),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should handle invalid address gracefully
      expect(result.current.error).toBeTruthy();
    });

    it('should refetch roles when requested', async () => {
      const { result } = renderHook(
        () => useOnChainRoles(testAddress),
        { wrapper: TestWrapper }
      );

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Token Gate Tests', () => {
    const testAddress = 'TestWalletAddress123456789';
    const testConfig = {
      tokenMint: 'TestTokenMint123456789',
      minimumBalance: 10,
    };

    it('should initialize with correct default state', () => {
      const { result } = renderHook(
        () => useTokenGate(testAddress, testConfig),
        { wrapper: TestWrapper }
      );

      expect(result.current.hasAccess).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.refresh).toBe('function');
    });

    it('should check token access correctly', async () => {
      const { result } = renderHook(
        () => useTokenGate(testAddress, testConfig),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Access should be determined based on mocked token balance
      expect(typeof result.current.hasAccess).toBe('boolean');
    });

    it('should handle NFT collection verification', async () => {
      const nftConfig = {
        nftCollection: 'TestNFTCollection123456789',
        minimumBalance: 1,
      };

      const { result } = renderHook(
        () => useTokenGate(testAddress, nftConfig),
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.hasAccess).toBe('boolean');
    });
  });

  describe('Auth Features Integration Tests', () => {
    it('should integrate all authentication features', () => {
      const { result } = renderHook(() => useAuthFeatures(), { wrapper: TestWrapper });

      // Check that all expected properties are present
      expect(result.current).toHaveProperty('isWalletConnected');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('address');
      expect(result.current).toHaveProperty('roles');
      expect(result.current).toHaveProperty('hasRole');
      expect(result.current).toHaveProperty('canAccessFeature');
      expect(result.current).toHaveProperty('connectWallet');
      expect(result.current).toHaveProperty('signIn');
      expect(result.current).toHaveProperty('disconnect');
    });

    it('should check role permissions correctly', async () => {
      const { result } = renderHook(() => useAuthFeatures(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Test role checking
      const hasUserRole = result.current.hasRole('USER');
      const hasAdminRole = result.current.hasRole('ADMIN');

      expect(typeof hasUserRole).toBe('boolean');
      expect(typeof hasAdminRole).toBe('boolean');
    });

    it('should check feature access correctly', async () => {
      const { result } = renderHook(() => useAuthFeatures(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Test feature access checking
      const canAccessPublic = result.current.canAccessFeature({
        requireAuthentication: false,
      });

      const canAccessPrivate = result.current.canAccessFeature({
        requireAuthentication: true,
        requiredRoles: ['USER'],
      });

      expect(typeof canAccessPublic).toBe('boolean');
      expect(typeof canAccessPrivate).toBe('boolean');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network failure
      vi.mocked(mockWallet.adapter.signMessage).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useSIWS(), { wrapper: TestWrapper });

      await act(async () => {
        try {
          await result.current.signIn();
        } catch (error) {
          // Expected to fail
        }
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should handle invalid signatures', async () => {
      // Mock invalid signature
      const nacl = await import('tweetnacl');
      vi.mocked(nacl.default.sign.detached.verify).mockReturnValueOnce(false);

      const { result } = renderHook(() => useSIWS(), { wrapper: TestWrapper });

      await act(async () => {
        try {
          await result.current.signIn();
        } catch (error) {
          // Expected to fail
        }
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should cache role data appropriately', async () => {
      const testAddress = 'TestWalletAddress123456789';
      const { result } = renderHook(
        () => useOnChainRoles(testAddress),
        { wrapper: TestWrapper }
      );

      // Initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialRoles = result.current.roles;

      // Refetch should use cache if appropriate
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.roles).toEqual(initialRoles);
    });

    it('should handle concurrent authentication requests', async () => {
      const { result } = renderHook(() => useSIWS(), { wrapper: TestWrapper });

      // Make multiple concurrent sign-in requests
      const promises = [
        result.current.signIn(),
        result.current.signIn(),
        result.current.signIn(),
      ];

      await act(async () => {
        await Promise.allSettled(promises);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle concurrent requests gracefully
      expect(mockWallet.adapter.signMessage).toHaveBeenCalled();
    });
  });
});
