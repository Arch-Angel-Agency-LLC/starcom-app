// src/config/authConfig.ts
import type { RoleConfig } from '../hooks/useOnChainRoles';
import type { TokenGateConfig } from '../hooks/useTokenGate';

/**
 * Comprehensive Authentication Configuration
 * 
 * This file contains all authentication-related configuration for the
 * Starcom MK2 application, including roles, tokens, and access requirements.
 */

// Environment configuration
export const AUTH_CONFIG = {
  // SIWS Configuration
  siws: {
    domain: 'starcom-dapp.vercel.app', // Replace with your domain
    statement: 'Sign in to Starcom MK2 - Decentralized Intelligence Platform',
    version: '1' as const,
    chainId: process.env.NODE_ENV === 'production' ? 'mainnet-beta' : 'devnet',
    sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Solana Network Configuration
  network: {
    endpoint: process.env.NODE_ENV === 'production' 
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com',
    commitment: 'confirmed' as const,
  },
  
  // Role-based Access Control
  roles: {
    // Admin whitelist (replace with actual admin addresses)
    adminAddresses: [
      // Add production admin addresses here
      'YourAdminAddress1111111111111111111111111111',
      'YourAdminAddress2222222222222222222222222222',
    ],
    
    // Intelligence Corps NFT Collection
    intelligenceCorpsNFT: {
      collection: 'YourNFTCollectionAddress1111111111111111111', // Replace with real collection
      roles: {
        'ANALYST': 1, // Minimum 1 NFT required
        'OPERATOR': 3, // Minimum 3 NFTs required
        'ADMIN': 5, // Minimum 5 NFTs required
      }
    },
    
    // STAR Token Requirements
    starToken: {
      mint: 'YourSTARTokenMintAddress111111111111111111111', // Replace with real token mint
      roles: {
        'USER': 1, // 1 STAR token
        'ANALYST': 100, // 100 STAR tokens
        'MODERATOR': 1000, // 1,000 STAR tokens
        'ADMIN': 10000, // 10,000 STAR tokens
      }
    },
    
    // Governance Token Requirements
    governanceToken: {
      mint: 'YourGovernanceTokenMintAddress1111111111111111', // Replace with real governance token
      roles: {
        'VOTER': 1,
        'PROPOSER': 1000,
        'VALIDATOR': 10000,
      }
    }
  },
  
  // Token Gate Configurations
  tokenGates: {
    // Premium features
    premium: {
      tokenMint: 'YourSTARTokenMintAddress111111111111111111111',
      minimumBalance: 50,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
    } as TokenGateConfig,
    
    // Intelligence marketplace
    marketplace: {
      nftCollection: 'YourNFTCollectionAddress1111111111111111111',
      minimumBalance: 1,
      cacheTimeout: 10 * 60 * 1000, // 10 minutes
    } as TokenGateConfig,
    
    // Advanced analytics
    analytics: {
      tokenMint: 'YourSTARTokenMintAddress111111111111111111111',
      minimumBalance: 500,
      cacheTimeout: 15 * 60 * 1000, // 15 minutes
    } as TokenGateConfig,
    
    // API access
    apiAccess: {
      requiredNFTs: [
        'SpecificNFTMintAddress1111111111111111111111111',
        'SpecificNFTMintAddress2222222222222222222222222',
      ],
      minimumBalance: 1,
      cacheTimeout: 30 * 60 * 1000, // 30 minutes
    } as TokenGateConfig,
  },
  
  // Default role configuration for useOnChainRoles
  defaultRoleConfig: {
    nftCollections: [
      'YourNFTCollectionAddress1111111111111111111', // Intelligence Corps NFT
    ],
    tokenMints: [
      'YourSTARTokenMintAddress111111111111111111111', // STAR token
      'YourGovernanceTokenMintAddress1111111111111111', // Governance token
    ],
    contractAddresses: [
      // Add deployed smart contract addresses here
    ],
    whitelistAddresses: [
      // Admin addresses (same as above)
      'YourAdminAddress1111111111111111111111111111',
      'YourAdminAddress2222222222222222222222222222',
    ],
    minimumTokenBalance: 1,
  } as RoleConfig,
} as const;

// Feature Requirements Presets
export const FEATURE_GATES = {
  // Public access (no requirements)
  PUBLIC: {
    requireAuthentication: false,
  },
  
  // Basic authentication required
  AUTHENTICATED: {
    requireAuthentication: true,
  },
  
  // Premium features
  PREMIUM: {
    requireAuthentication: true,
    requiredTokens: [AUTH_CONFIG.tokenGates.premium],
  },
  
  // Intelligence marketplace
  MARKETPLACE: {
    requireAuthentication: true,
    requiredRoles: ['ANALYST', 'OPERATOR'],
    requiredTokens: [AUTH_CONFIG.tokenGates.marketplace],
    requireAll: false, // Either role OR token access
  },
  
  // Admin panel
  ADMIN: {
    requireAuthentication: true,
    requiredRoles: ['ADMIN'],
    requireAll: true,
  },
  
  // Advanced analytics
  ANALYTICS: {
    requireAuthentication: true,
    requiredRoles: ['ANALYST', 'MODERATOR', 'ADMIN'],
    requiredTokens: [AUTH_CONFIG.tokenGates.analytics],
    requireAll: false, // Either role OR token access
  },
  
  // API access
  API_ACCESS: {
    requireAuthentication: true,
    requiredTokens: [AUTH_CONFIG.tokenGates.apiAccess],
    requireAll: true,
  },
  
  // Governance participation
  GOVERNANCE: {
    requireAuthentication: true,
    requiredRoles: ['VOTER', 'PROPOSER', 'VALIDATOR'],
    requireAll: false, // Any governance role
  },
} as const;

// Helper functions for configuration
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV;
  const isDev = env === 'development';
  const isTest = env === 'test';
  const isProd = env === 'production';
  
  return {
    isDev,
    isTest,
    isProd,
    network: isDev || isTest ? 'devnet' : 'mainnet-beta',
    endpoint: AUTH_CONFIG.network.endpoint,
  };
};

// Get role config for a specific environment
export const getRoleConfig = (overrides?: Partial<RoleConfig>): RoleConfig => {
  const env = getEnvironmentConfig();
  
  // In development, use placeholder addresses
  if (env.isDev || env.isTest) {
    return {
      ...AUTH_CONFIG.defaultRoleConfig,
      nftCollections: ['DevNFTCollection1111111111111111111111111111'],
      tokenMints: ['DevSTARToken11111111111111111111111111111111'],
      whitelistAddresses: ['DevAdmin1111111111111111111111111111111111111'],
      ...overrides,
    };
  }
  
  return {
    ...AUTH_CONFIG.defaultRoleConfig,
    ...overrides,
  };
};

// Get token gate config for a specific feature
export const getTokenGateConfig = (
  feature: keyof typeof AUTH_CONFIG.tokenGates,
  overrides?: Partial<TokenGateConfig>
): TokenGateConfig => {
  const baseConfig = AUTH_CONFIG.tokenGates[feature];
  const env = getEnvironmentConfig();
  
  // In development, use placeholder addresses
  if (env.isDev || env.isTest) {
    return {
      ...baseConfig,
      tokenMint: baseConfig.tokenMint ? 'DevSTARToken11111111111111111111111111111111' : undefined,
      nftCollection: baseConfig.nftCollection ? 'DevNFTCollection1111111111111111111111111111' : undefined,
      requiredNFTs: baseConfig.requiredNFTs ? ['DevNFT1111111111111111111111111111111111111'] : undefined,
      ...overrides,
    };
  }
  
  return {
    ...baseConfig,
    ...overrides,
  };
};

// Validation helpers
export const validateAuthConfig = () => {
  const errors: string[] = [];
  const env = getEnvironmentConfig();
  
  // In production, validate that placeholder addresses aren't used
  if (env.isProd) {
    if (AUTH_CONFIG.roles.adminAddresses.some(addr => addr.includes('YourAdmin'))) {
      errors.push('Production admin addresses not configured');
    }
    
    if (AUTH_CONFIG.roles.starToken.mint.includes('YourSTAR')) {
      errors.push('Production STAR token mint not configured');
    }
    
    if (AUTH_CONFIG.roles.intelligenceCorpsNFT.collection.includes('YourNFT')) {
      errors.push('Production NFT collection not configured');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Export type for external use
export type AuthConfiguration = typeof AUTH_CONFIG;
export type FeatureGates = typeof FEATURE_GATES;
