// src/hooks/useTokenGate.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Connection } from '@solana/web3.js';
import { getTokenGateConfig } from '../config/authConfig';

// Safe types for Metaplex modules
type CreateUmiFunction = (endpoint: string) => unknown;
type FetchDigitalAssetFunction = (umi: unknown, publicKey: unknown) => Promise<unknown>;
type CreatePublicKeyFunction = (key: string) => unknown;

// Lazy imports for Metaplex to avoid initialization issues
let createUmi: CreateUmiFunction | null = null;
let fetchDigitalAsset: FetchDigitalAssetFunction | null = null;
let createPublicKey: CreatePublicKeyFunction | null = null;

const initializeMetaplexModules = async (): Promise<void> => {
  if (!createUmi) {
    try {
      const umiBundle = await import('@metaplex-foundation/umi-bundle-defaults');
      createUmi = umiBundle.createUmi as CreateUmiFunction;
      
      const tokenMetadata = await import('@metaplex-foundation/mpl-token-metadata');
      fetchDigitalAsset = tokenMetadata.fetchDigitalAsset as FetchDigitalAssetFunction;
      
      const umi = await import('@metaplex-foundation/umi');
      createPublicKey = umi.publicKey as CreatePublicKeyFunction;
    } catch (error) {
      console.warn('Failed to initialize Metaplex modules, using fallbacks:', error);
      // Fallback to mock implementations for browser compatibility
      createUmi = (endpoint: string) => ({ rpc: { getEndpoint: () => endpoint } });
      fetchDigitalAsset = async () => null;
      createPublicKey = (key: string) => key;
    }
  }
};

/**
 * Enhanced Token Gating Hook for Solana
 * Provides robust token-based access control for dApp features
 * Supports SPL tokens, NFTs, and custom verification logic
 */

export interface TokenGateConfig {
  tokenMint?: string; // SPL token mint address
  nftCollection?: string; // NFT collection address
  minimumBalance?: number; // Minimum token balance required
  requiredNFTs?: string[]; // Specific NFT mint addresses required
  customVerifier?: (address: string) => Promise<boolean>; // Custom verification function
  cacheTimeout?: number; // Cache timeout in milliseconds
}

export interface TokenGateResult {
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
  tokenBalance?: number;
  nftCount?: number;
  metadata?: Record<string, unknown>;
  refresh: () => Promise<void>;
}

const DEFAULT_CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function useTokenGate(
  address: string | null,
  config: TokenGateConfig
): TokenGateResult {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | undefined>(undefined);
  const [nftCount, setNftCount] = useState<number | undefined>(undefined);
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [lastCheck, setLastCheck] = useState<number>(0);

  const { connection } = useConnection();
  const { publicKey } = useWallet();

  // Use connected wallet if no address provided
  const checkAddress = address || publicKey?.toBase58() || null;

  // Check SPL token balance
  const checkTokenBalance = useCallback(async (walletAddress: string): Promise<number> => {
    if (!config.tokenMint) return 0;

    try {
      const walletPublicKey = new PublicKey(walletAddress);
      const mintPublicKey = new PublicKey(config.tokenMint);

      // Get token accounts for this wallet and mint
      const tokenAccounts = await connection.getTokenAccountsByOwner(walletPublicKey, {
        mint: mintPublicKey
      });

      if (tokenAccounts.value.length === 0) return 0;

      // Get balance of the first token account
      const tokenAccountInfo = await connection.getTokenAccountBalance(
        tokenAccounts.value[0].pubkey
      );

      return tokenAccountInfo.value.uiAmount || 0;
    } catch (err) {
      console.warn('Token balance check failed:', err);
      return 0;
    }
  }, [connection, config.tokenMint]);

  // Enhanced NFT ownership check with metadata verification
  const checkNFTOwnership = useCallback(async (walletAddress: string): Promise<number> => {
    if (!config.nftCollection && !config.requiredNFTs?.length) return 0;

    try {
      // Initialize Metaplex modules safely
      await initializeMetaplexModules();
      
      const walletPublicKey = new PublicKey(walletAddress);
      
      // Get all token accounts for the wallet
      const tokenAccounts = await connection.getTokenAccountsByOwner(walletPublicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') // SPL Token Program
      });

      let nftCount = 0;
      
      // Fallback to basic NFT detection if Metaplex fails
      if (!createUmi || !fetchDigitalAsset || !createPublicKey) {
        console.warn('Metaplex not available, using basic NFT detection');
        return tokenAccounts.value.length; // Simple count of token accounts
      }

      const umi = createUmi(connection.rpcEndpoint);

      for (const tokenAccount of tokenAccounts.value) {
        try {
          const tokenAccountInfo = await connection.getTokenAccountBalance(tokenAccount.pubkey);
          const balance = tokenAccountInfo.value.uiAmount || 0;
          const decimals = tokenAccountInfo.value.decimals;

          // NFTs typically have a balance of 1 and 0 decimals
          if (balance === 1 && decimals === 0) {
            // Parse token account data to get mint address
            const accountData = await connection.getAccountInfo(tokenAccount.pubkey);
            if (!accountData?.data) continue;
            
            // Token account data structure: mint (32 bytes) + owner (32 bytes) + amount (8 bytes) + ...
            const mintBytes = accountData.data.slice(0, 32);
            const mintAddress = new PublicKey(mintBytes).toBase58();
            
            try {
              // Fetch NFT metadata using Metaplex (with safe typing)
              const digitalAssetRaw = await fetchDigitalAsset(
                umi, 
                createPublicKey(mintAddress)
              );
              
              // Type guard for digital asset
              const digitalAsset = digitalAssetRaw as {
                metadata?: {
                  collection?: {
                    value?: {
                      verified?: boolean;
                      key?: string;
                    };
                  };
                };
              } | null;
              
              // Check if this NFT meets our requirements
              if (config.requiredNFTs?.length) {
                // Check if this is one of the specific required NFTs
                if (config.requiredNFTs.includes(mintAddress)) {
                  nftCount++;
                }
              } else if (config.nftCollection && digitalAsset) {
                // Check if this NFT belongs to the specified collection
                const collection = digitalAsset.metadata?.collection;
                if (collection && 
                    'value' in collection && 
                    collection.value?.verified && 
                    collection.value?.key === config.nftCollection) {
                  nftCount++;
                }
              }
            } catch (metadataError) {
              // If metadata fetch fails, fallback to basic checks
              console.warn('Failed to fetch NFT metadata for:', mintAddress, metadataError);
              
              // For required NFTs, we can still check by mint address
              if (config.requiredNFTs?.includes(mintAddress)) {
                nftCount++;
              }
            }
          }
        } catch (err) {
          console.warn('NFT check failed for account:', tokenAccount.pubkey.toBase58(), err);
        }
      }

      return nftCount;
    } catch (err) {
      console.warn('NFT ownership check failed:', err);
      return 0;
    }
  }, [connection, config.nftCollection, config.requiredNFTs]);

  // Main verification function
  const verifyAccess = useCallback(async (walletAddress: string): Promise<boolean> => {
    try {
      let accessGranted = false;
      const verificationMetadata: Record<string, unknown> = {};

      // Check token balance if token mint is specified
      if (config.tokenMint) {
        const balance = await checkTokenBalance(walletAddress);
        setTokenBalance(balance);
        verificationMetadata.tokenBalance = balance;

        const requiredBalance = config.minimumBalance || 1;
        if (balance >= requiredBalance) {
          accessGranted = true;
          verificationMetadata.tokenAccessGranted = true;
        }
      }

      // Check NFT ownership if NFT requirements are specified
      if (config.nftCollection || config.requiredNFTs?.length) {
        const nftCount = await checkNFTOwnership(walletAddress);
        setNftCount(nftCount);
        verificationMetadata.nftCount = nftCount;

        const requiredNFTs = config.requiredNFTs?.length || 1;
        if (nftCount >= requiredNFTs) {
          accessGranted = true;
          verificationMetadata.nftAccessGranted = true;
        }
      }

      // Run custom verifier if provided
      if (config.customVerifier) {
        const customResult = await config.customVerifier(walletAddress);
        verificationMetadata.customVerification = customResult;
        if (customResult) {
          accessGranted = true;
          verificationMetadata.customAccessGranted = true;
        }
      }

      // If no requirements specified, grant access by default
      if (!config.tokenMint && !config.nftCollection && !config.requiredNFTs?.length && !config.customVerifier) {
        accessGranted = true;
        verificationMetadata.defaultAccess = true;
      }

      setMetadata(verificationMetadata);
      return accessGranted;
    } catch (err) {
      console.error('Access verification failed:', err);
      return false;
    }
  }, [config, checkTokenBalance, checkNFTOwnership]);

  // Check if we need to refresh based on cache timeout
  const shouldRefresh = useCallback((): boolean => {
    const cacheTimeout = config.cacheTimeout || DEFAULT_CACHE_TIMEOUT;
    return Date.now() - lastCheck > cacheTimeout;
  }, [config.cacheTimeout, lastCheck]);

  // Main check function
  const checkAccess = useCallback(async () => {
    if (!checkAddress) {
      setHasAccess(false);
      setError('No wallet address provided');
      return;
    }

    // Skip if recently checked and cache is still valid
    if (!shouldRefresh() && lastCheck > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const access = await verifyAccess(checkAddress);
      setHasAccess(access);
      setLastCheck(Date.now());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Token gate check failed';
      setError(errorMessage);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [checkAddress, shouldRefresh, lastCheck, verifyAccess]);

  // Effect to check access when dependencies change
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setLastCheck(0); // Force refresh by resetting cache
    await checkAccess();
  }, [checkAccess]);

  return {
    hasAccess,
    loading,
    error,
    tokenBalance,
    nftCount,
    metadata,
    refresh,
  };
}

// Utility function for simple token balance check
export async function checkTokenBalance(
  connection: Connection,
  walletAddress: string,
  tokenMint: string
): Promise<number> {
  try {
    const walletPublicKey = new PublicKey(walletAddress);
    const mintPublicKey = new PublicKey(tokenMint);

    const tokenAccounts = await connection.getTokenAccountsByOwner(walletPublicKey, {
      mint: mintPublicKey
    });

    if (tokenAccounts.value.length === 0) return 0;

    const tokenAccountInfo = await connection.getTokenAccountBalance(
      tokenAccounts.value[0].pubkey
    );

    return tokenAccountInfo.value.uiAmount || 0;
  } catch {
    return 0;
  }
}

// Utility function for NFT ownership check
export async function checkNFTOwnership(
  connection: Connection,
  walletAddress: string,
  nftMints: string[]
): Promise<boolean> {
  try {
    for (const mintAddress of nftMints) {
      const walletPublicKey = new PublicKey(walletAddress);
      const mintPublicKey = new PublicKey(mintAddress);

      const tokenAccounts = await connection.getTokenAccountsByOwner(walletPublicKey, {
        mint: mintPublicKey
      });

      if (tokenAccounts.value.length > 0) {
        const tokenAccountInfo = await connection.getTokenAccountBalance(
          tokenAccounts.value[0].pubkey
        );

        if ((tokenAccountInfo.value.uiAmount || 0) >= 1) {
          return true; // Found required NFT
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Helper hook for using predefined token gate configurations
 * @param address - Wallet address to check
 * @param feature - Feature gate key from authConfig
 * @param overrides - Optional config overrides
 */
export function useFeatureGate(
  address: string | null,
  feature: 'premium' | 'marketplace' | 'analytics' | 'apiAccess',
  overrides?: Partial<TokenGateConfig>
): TokenGateResult {
  const config = useMemo(() => {
    return getTokenGateConfig(feature, overrides);
  }, [feature, overrides]);

  return useTokenGate(address, config);
}
