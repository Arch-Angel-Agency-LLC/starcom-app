// src/hooks/useOnChainRoles.ts
import { useEffect, useState } from 'react';
// TODO: Solana/Anchor/Metaplex version in progress. See artifacts/intel-report-stage1-plan.artifact
// AI-NOTE: EVM/ethers.js version archived in legacy-evm/useOnChainRoles.ts. Implement Solana logic here.

/**
 * useOnChainRoles
 * Returns a list of on-chain roles for the given address.
 *
 * @param address - The user's wallet address
 * @returns Array of { role, hasRole }
 *
 * See: artifacts/starcom-mk2-web3-login-api.artifact
 * See: docs/Decentralized Web3 dApp Development Guide.markdown
 */
export interface OnChainRole {
  role: string; // e.g. 'ADMIN', 'USER', 'MODERATOR'
  hasRole: boolean;
}

export function useOnChainRoles(address: string | null): OnChainRole[] {
  const [roles, setRoles] = useState<OnChainRole[]>([]);

  useEffect(() => {
    if (!address) {
      setRoles([]);
      return;
    }
    if (!window.ethereum) {
      setRoles([
        { role: 'USER', hasRole: true },
        { role: 'ADMIN', hasRole: false },
      ]);
      return;
    }
    async function fetchRoles() {
      try {
        // TODO: Implement Solana logic here
      } catch {
        setRoles([
          { role: 'USER', hasRole: true },
          { role: 'ADMIN', hasRole: false },
        ]);
      }
    }
    fetchRoles();
  }, [address]);

  return roles;
}

// Only one export for useOnChainRoles. Placeholder removed.
