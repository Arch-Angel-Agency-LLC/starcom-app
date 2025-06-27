// src/hooks/useOnChainRoles.ts
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { solanaWalletService } from '../services/wallet/SolanaWalletService';
import { getRoleConfig } from '../config/authConfig';

/**
 * Parse contract role data from account bytes
 * This is a placeholder that should be implemented based on your specific contract structure
 */
function parseContractRole(data: Buffer): { name: string; level: number; permissions: string[] } | null {
  try {
    // This is a simplified example - adjust based on your actual contract data structure
    if (data.length < 16) return null;
    
    // Example: First 8 bytes = discriminator, next 4 = role level, rest = role name
    const roleLevel = data.readUInt32LE(8);
    
    // Map role levels to names
    const roleMapping: Record<number, string> = {
      0: 'USER',
      1: 'ANALYST',
      2: 'MODERATOR',
      3: 'OPERATOR',
      4: 'ADMIN'
    };
    
    const roleName = roleMapping[roleLevel] || 'USER';
    
    return {
      name: roleName,
      level: roleLevel,
      permissions: [] // Could parse additional permissions from remaining bytes
    };
  } catch (error) {
    console.warn('Failed to parse contract role data:', error);
    return null;
  }
}

/**
 * Enhanced useOnChainRoles Hook
 * Provides robust on-chain role verification for Solana blockchain
 * Supports multiple role systems: NFT-based, token-based, and smart contract roles
 */

export interface OnChainRole {
  role: string; // e.g. 'ADMIN', 'USER', 'MODERATOR', 'OPERATOR', 'ANALYST'
  hasRole: boolean;
  source: 'nft' | 'token' | 'contract' | 'whitelist';
  metadata?: Record<string, unknown>;
}

export interface RoleConfig {
  nftCollections: string[]; // NFT collection addresses for role verification
  tokenMints: string[]; // SPL token addresses for role verification
  contractAddresses: string[]; // Smart contract addresses for role verification
  whitelistAddresses: string[]; // Whitelisted addresses for admin roles
  minimumTokenBalance: number; // Minimum token balance required
}

export function useOnChainRoles(
  address: string | null,
  config: Partial<RoleConfig> = {}
): {
  roles: OnChainRole[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [roles, setRoles] = useState<OnChainRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { connection } = useConnection();

  // Use the centralized config with environment-aware defaults
  const roleConfig = useMemo(() => {
    return getRoleConfig(config);
  }, [config]);

  // Check if address is whitelisted for admin access
  const checkWhitelistRoles = useCallback((checkAddress: string): OnChainRole[] => {
    const whitelistRoles: OnChainRole[] = [];
    
    if (roleConfig.whitelistAddresses.includes(checkAddress)) {
      whitelistRoles.push({
        role: 'ADMIN',
        hasRole: true,
        source: 'whitelist',
        metadata: { level: 'system_admin' }
      });
    }
    
    return whitelistRoles;
  }, [roleConfig.whitelistAddresses]);

  // Check NFT-based roles
  const checkNFTRoles = useCallback(async (checkAddress: string): Promise<OnChainRole[]> => {
    const nftRoles: OnChainRole[] = [];
    
    if (roleConfig.nftCollections.length === 0) return nftRoles;
    
    try {
      const publicKeyObj = new PublicKey(checkAddress);
      
      // Get all token accounts for the address
      const tokenAccounts = await connection.getTokenAccountsByOwner(publicKeyObj, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') // SPL Token Program
      });
      
      for (const tokenAccount of tokenAccounts.value) {
        const tokenAccountInfo = await connection.getAccountInfo(tokenAccount.pubkey);
        if (!tokenAccountInfo) continue;
        
        // Parse token account data
        const tokenData = tokenAccountInfo.data;
        if (tokenData.length >= 64) {
          // Check if this NFT belongs to a role-granting collection
          // This is a simplified check - in production you'd parse the full account data
          const hasNFT = roleConfig.nftCollections.some((collection: string) => {
            try {
              // Convert base58 string to buffer for comparison
              const collectionBytes = Buffer.from(collection);
              return tokenData.includes(collectionBytes);
            } catch {
              return false;
            }
          });
          
          if (hasNFT) {
            nftRoles.push({
              role: 'OPERATOR',
              hasRole: true,
              source: 'nft',
              metadata: { 
                tokenAccount: tokenAccount.pubkey.toBase58(),
                collection: 'intelligence_corps' 
              }
            });
          }
        }
      }
    } catch (err) {
      console.warn('NFT role check failed:', err);
    }
    
    return nftRoles;
  }, [connection, roleConfig.nftCollections]);

  // Check token-based roles
  const checkTokenRoles = useCallback(async (checkAddress: string): Promise<OnChainRole[]> => {
    const tokenRoles: OnChainRole[] = [];
    
    if (roleConfig.tokenMints.length === 0) return tokenRoles;
    
    try {
      const publicKeyObj = new PublicKey(checkAddress);
      
      for (const tokenMint of roleConfig.tokenMints) {
        try {
          const mintPublicKey = new PublicKey(tokenMint);
          
          // Get token accounts for this specific mint
          const tokenAccounts = await connection.getTokenAccountsByOwner(publicKeyObj, {
            mint: mintPublicKey
          });
          
          if (tokenAccounts.value.length > 0) {
            // Check token balance
            const tokenAccountInfo = await connection.getTokenAccountBalance(
              tokenAccounts.value[0].pubkey
            );
            
            const balance = tokenAccountInfo.value.uiAmount || 0;
            
            if (balance >= roleConfig.minimumTokenBalance) {
              let role = 'USER';
              
              // Determine role based on token balance
              if (balance >= 1000) role = 'ADMIN';
              else if (balance >= 100) role = 'MODERATOR';
              else if (balance >= 10) role = 'ANALYST';
              
              tokenRoles.push({
                role,
                hasRole: true,
                source: 'token',
                metadata: { 
                  balance,
                  tokenMint,
                  minimumRequired: roleConfig.minimumTokenBalance 
                }
              });
            }
          }
        } catch (err) {
          console.warn(`Token role check failed for mint ${tokenMint}:`, err);
        }
      }
    } catch (err) {
      console.warn('Token role check failed:', err);
    }
    
    return tokenRoles;
  }, [connection, roleConfig.tokenMints, roleConfig.minimumTokenBalance]);

  // Check smart contract-based roles
  const checkContractRoles = useCallback(async (checkAddress: string): Promise<OnChainRole[]> => {
    const contractRoles: OnChainRole[] = [];
    
    if (roleConfig.contractAddresses.length === 0) return contractRoles;
    
    try {
      const userPublicKey = new PublicKey(checkAddress);
      
      for (const contractAddress of roleConfig.contractAddresses) {
        try {
          const contractPublicKey = new PublicKey(contractAddress);
          const accountInfo = await connection.getAccountInfo(contractPublicKey);
          
          if (accountInfo) {
            // Check if this is a program (smart contract)
            if (accountInfo.executable) {
              // This is a deployed program - we could call methods on it
              // For now, we'll add a basic check and structure for future enhancement
              
              try {
                // Example: Check for a PDA that might store user roles
                // This would be specific to your smart contract implementation
                const [userRolePDA] = PublicKey.findProgramAddressSync(
                  [Buffer.from('user_role'), userPublicKey.toBuffer()],
                  contractPublicKey
                );
                
                const roleAccountInfo = await connection.getAccountInfo(userRolePDA);
                
                if (roleAccountInfo) {
                  // Parse role data from the account
                  // This is contract-specific and would need to match your program's data structure
                  const roleData = roleAccountInfo.data;
                  
                  if (roleData.length >= 8) { // Minimum size for a role account
                    // Example parsing - adjust based on your contract structure
                    const role = parseContractRole(roleData);
                    
                    if (role) {
                      contractRoles.push({
                        role: role.name,
                        hasRole: true,
                        source: 'contract',
                        metadata: { 
                          contractAddress,
                          roleLevel: role.level,
                          permissions: role.permissions
                        }
                      });
                    }
                  }
                } else {
                  // No role account found - user might have default role
                  contractRoles.push({
                    role: 'USER',
                    hasRole: true,
                    source: 'contract',
                    metadata: { contractAddress, default: true }
                  });
                }
              } catch (pdaError) {
                // If PDA calculation fails, fall back to basic user role
                console.warn(`PDA calculation failed for contract ${contractAddress}:`, pdaError);
                contractRoles.push({
                  role: 'USER',
                  hasRole: true,
                  source: 'contract',
                  metadata: { contractAddress, fallback: true }
                });
              }
            } else {
              // This is a data account, not a program
              console.warn(`Contract address ${contractAddress} is not an executable program`);
            }
          }
        } catch (err) {
          console.warn(`Contract role check failed for ${contractAddress}:`, err);
        }
      }
    } catch (err) {
      console.warn('Contract role check failed:', err);
    }
    
    return contractRoles;
  }, [connection, roleConfig.contractAddresses]);

  // Main role checking function
  const fetchRoles = useCallback(async (checkAddress: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate address
      if (!solanaWalletService.isValidAddress(checkAddress)) {
        throw new Error('Invalid Solana address');
      }
      
      // Check all role sources in parallel
      const [whitelistRoles, nftRoles, tokenRoles, contractRoles] = await Promise.all([
        Promise.resolve(checkWhitelistRoles(checkAddress)),
        checkNFTRoles(checkAddress),
        checkTokenRoles(checkAddress),
        checkContractRoles(checkAddress)
      ]);
      
      // Combine all roles and remove duplicates
      const allRoles = [...whitelistRoles, ...nftRoles, ...tokenRoles, ...contractRoles];
      const uniqueRoles = allRoles.reduce((acc, role) => {
        const existingRole = acc.find(r => r.role === role.role);
        if (!existingRole || role.source === 'whitelist') {
          // Whitelist roles take precedence
          return [...acc.filter(r => r.role !== role.role), role];
        }
        return acc;
      }, [] as OnChainRole[]);
      
      // Ensure every user has at least USER role if they have any role
      if (uniqueRoles.length > 0 && !uniqueRoles.some(r => r.role === 'USER')) {
        uniqueRoles.push({
          role: 'USER',
          hasRole: true,
          source: 'contract',
          metadata: { default: true }
        });
      }
      
      setRoles(uniqueRoles);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Role check failed';
      setError(errorMessage);
      console.error('Role fetching failed:', err);
      
      // Set default user role on error
      setRoles([{
        role: 'USER',
        hasRole: true,
        source: 'contract',
        metadata: { default: true, error: errorMessage }
      }]);
    } finally {
      setLoading(false);
    }
  }, [checkWhitelistRoles, checkNFTRoles, checkTokenRoles, checkContractRoles]);

  // Effect to fetch roles when address changes
  useEffect(() => {
    if (!address) {
      setRoles([]);
      setError(null);
      return;
    }
    
    fetchRoles(address);
  }, [address, fetchRoles]);

  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    if (address) {
      await fetchRoles(address);
    }
  }, [address, fetchRoles]);

  return { roles, loading, error, refetch };
}

// Utility function to check if user has specific role
export function hasRole(roles: OnChainRole[], targetRole: string): boolean {
  return roles.some(role => role.role === targetRole && role.hasRole);
}

// Utility function to get highest role level
export function getHighestRole(roles: OnChainRole[]): OnChainRole | null {
  const rolePriority = ['ADMIN', 'MODERATOR', 'OPERATOR', 'ANALYST', 'USER'];
  
  for (const roleLevel of rolePriority) {
    const role = roles.find(r => r.role === roleLevel && r.hasRole);
    if (role) return role;
  }
  
  return null;
}

// Export default roles for testing
export const DEFAULT_ROLES: OnChainRole[] = [
  { role: 'USER', hasRole: true, source: 'contract', metadata: { default: true } }
];
