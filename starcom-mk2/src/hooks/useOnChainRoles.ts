// src/hooks/useOnChainRoles.ts
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import IntelligenceMarketABI from '../contracts/IntelligenceMarketABI.json';

const CONTRACT_ADDRESS = '0xYourContractAddressHere'; // TODO: Replace with real deployed address

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
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, IntelligenceMarketABI, provider);
        const owner = await contract.owner();
        setRoles([
          { role: 'USER', hasRole: true },
          { role: 'ADMIN', hasRole: owner && address ? owner.toLowerCase() === address.toLowerCase() : false },
        ]);
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
