/**
 * Dynamic Role Loading System
 * Loads roles from NFT collections with intelligent caching and merging
 * Implements TDD Feature 5: Dynamic Role Loading
 */

import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
// import { Metaplex } from '@metaplex-foundation/js'; // Will add when package is available

export interface NFTRole {
  collection: string;
  tokenAddress: string;
  role: string;
  attributes: Record<string, unknown>;
  metadata: {
    name: string;
    description?: string;
    image?: string;
  };
  source: 'nft';
  priority: number;
}

export interface StaticRole {
  role: string;
  source: 'config';
  priority: number;
}

export interface RoleCache {
  roles: (NFTRole | StaticRole)[];
  timestamp: number;
  walletAddress: string;
  ttl: number;
}

export interface DynamicRoleState {
  roles: (NFTRole | StaticRole)[];
  loading: boolean;
  error: string | null;
  cacheStatus: 'fresh' | 'stale' | 'invalid' | 'empty';
  lastUpdated: number | null;
}

interface UseDynamicRoleLoadingReturn {
  roleState: DynamicRoleState;
  loadRolesFromNFT: (collectionAddress: string) => Promise<NFTRole[]>;
  mergeRoles: (sources: (NFTRole | StaticRole)[][]) => (NFTRole | StaticRole)[];
  refreshRoles: () => Promise<void>;
  clearCache: () => void;
  getCachedRoles: () => RoleCache | null;
  hasNFTRoles: boolean;
  roleCachingEnabled: boolean;
}

const ROLE_CACHE_KEY = 'dynamic-roles-cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_AGE = 30 * 60 * 1000; // 30 minutes max

// Supported NFT collections for role mapping
const ROLE_COLLECTIONS = {
  // Example collection mappings
  'DeGods': {
    address: 'DGods_Collection_Address',
    roles: ['vip', 'trader']
  },
  'BAYC': {
    address: 'BAYC_Collection_Address', 
    roles: ['premium', 'collector']
  }
};

export const useDynamicRoleLoading = (): UseDynamicRoleLoadingReturn => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [roleState, setRoleState] = useState<DynamicRoleState>({
    roles: [],
    loading: false,
    error: null,
    cacheStatus: 'empty',
    lastUpdated: null
  });

  // Mock Metaplex for now - will be replaced with actual implementation
  // const mockMetaplex = {
  //   nfts: () => ({
  //     findAllByOwner: async () => [],
  //     load: async () => null
  //   })
  // };

  const getCachedRoles = useCallback((): RoleCache | null => {
    try {
      const cached = localStorage.getItem(ROLE_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as RoleCache;
      }
    } catch (error) {
      console.error('[DynamicRoles] Failed to parse cached roles:', error);
    }
    return null;
  }, []);

  const loadRolesFromNFT = useCallback(async (collectionAddress: string): Promise<NFTRole[]> => {
    if (!wallet.publicKey || !connection) {
      return [];
    }

    try {
      // Mock NFT loading for now - will use actual Metaplex when available
      const roles: NFTRole[] = [];

      // Simulate finding NFTs in collection
      const hasNFTInCollection = Math.random() > 0.5; // Mock check
      
      if (hasNFTInCollection) {
        roles.push({
          collection: collectionAddress,
          tokenAddress: 'mock_token_address',
          role: 'nft_holder',
          attributes: { rarity: 'rare' },
          metadata: {
            name: 'Mock NFT',
            description: 'A mock NFT for testing',
            image: 'https://mock-image.com/nft.png'
          },
          source: 'nft',
          priority: 10
        });
      }

      return roles;
    } catch (error) {
      console.error('[DynamicRoles] Failed to load NFT roles:', error);
      throw error;
    }
  }, [wallet.publicKey, connection]);

  const mergeRoles = useCallback((sources: (NFTRole | StaticRole)[][]): (NFTRole | StaticRole)[] => {
    const flatRoles = sources.flat();
    const roleMap = new Map<string, (NFTRole | StaticRole)>();

    // Sort by priority (higher priority first)
    flatRoles.sort((a, b) => b.priority - a.priority);

    // Deduplicate by role name, keeping highest priority
    for (const role of flatRoles) {
      if (!roleMap.has(role.role)) {
        roleMap.set(role.role, role);
      }
    }

    return Array.from(roleMap.values());
  }, []);

  const loadRoles = useCallback(async (): Promise<void> => {
    if (!wallet.publicKey) return;

    setRoleState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check cache first
      const cached = getCachedRoles();
      const now = Date.now();

      if (cached && cached.walletAddress === wallet.publicKey.toString()) {
        const age = now - cached.timestamp;
        
        if (age < CACHE_TTL) {
          // Use fresh cache
          setRoleState({
            roles: cached.roles,
            loading: false,
            error: null,
            cacheStatus: 'fresh',
            lastUpdated: cached.timestamp
          });
          return;
        } else if (age < MAX_CACHE_AGE) {
          // Use stale cache while loading fresh data
          setRoleState(prev => ({
            ...prev,
            roles: cached.roles,
            cacheStatus: 'stale',
            loading: true
          }));
        }
      }

      // Load fresh roles
      const allRoles: (NFTRole | StaticRole)[] = [];

      // Load static config roles
      const configRoles: StaticRole[] = [
        { role: 'user', source: 'config', priority: 1 },
        { role: 'member', source: 'config', priority: 2 }
      ];
      allRoles.push(...configRoles);

      // Load NFT roles from each collection
      for (const [collectionName, config] of Object.entries(ROLE_COLLECTIONS)) {
        try {
          const nftRoles = await loadRolesFromNFT(config.address);
          allRoles.push(...nftRoles);
        } catch (error) {
          console.warn(`[DynamicRoles] Failed to load roles from ${collectionName}:`, error);
        }
      }

      // Merge and deduplicate roles
      const mergedRoles = mergeRoles([allRoles]);

      // Cache the results
      const newCache: RoleCache = {
        roles: mergedRoles,
        timestamp: now,
        walletAddress: wallet.publicKey.toString(),
        ttl: CACHE_TTL
      };
      localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(newCache));

      setRoleState({
        roles: mergedRoles,
        loading: false,
        error: null,
        cacheStatus: 'fresh',
        lastUpdated: now
      });

    } catch (error) {
      console.error('[DynamicRoles] Failed to load roles:', error);
      setRoleState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load roles'
      }));
    }
  }, [wallet.publicKey, getCachedRoles, loadRolesFromNFT, mergeRoles]);

  // Load roles on wallet change
  useEffect(() => {
    if (wallet.publicKey) {
      loadRoles();
    } else {
      // Clear roles when wallet disconnects
      setRoleState(prev => ({
        ...prev,
        roles: [],
        cacheStatus: 'empty'
      }));
    }
  }, [wallet.publicKey, loadRoles]);

  const clearCache = useCallback((): void => {
    localStorage.removeItem(ROLE_CACHE_KEY);
    setRoleState(prev => ({
      ...prev,
      cacheStatus: 'empty'
    }));
  }, []);

  const refreshRoles = useCallback(async (): Promise<void> => {
    // Clear cache and reload
    clearCache();
    await loadRoles();
  }, [loadRoles, clearCache]);

  // Computed properties
  const hasNFTRoles = roleState.roles.some(role => role.source === 'nft');
  const roleCachingEnabled = true; // Always enabled for this implementation

  return {
    roleState,
    loadRolesFromNFT,
    mergeRoles,
    refreshRoles,
    clearCache,
    getCachedRoles,
    hasNFTRoles,
    roleCachingEnabled
  };
};

/**
 * Helper to check if user has a specific role from any source
 */
export const hasRole = (roleName: string, roles: (NFTRole | StaticRole)[]): boolean => {
  return roles.some(role => role.role === roleName);
};

/**
 * Get roles by source type
 */
export const getRolesBySource = (
  roles: (NFTRole | StaticRole)[],
  source: 'nft' | 'config'
): (NFTRole | StaticRole)[] => {
  return roles.filter(role => role.source === source);
};

/**
 * Get highest priority role
 */
export const getHighestPriorityRole = (roles: (NFTRole | StaticRole)[]): (NFTRole | StaticRole) | null => {
  if (roles.length === 0) return null;
  return roles.reduce((highest, current) => 
    current.priority > highest.priority ? current : highest
  );
};
