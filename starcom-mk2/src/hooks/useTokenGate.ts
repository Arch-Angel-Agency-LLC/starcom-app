// src/hooks/useTokenGate.ts
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import ERC20ABI from '../contracts/ERC20ABI.json';
const abi = ERC20ABI as any;

/**
 * useTokenGate
 * Checks if the given address has the required balance of a token (NFT/ERC-20).
 *
 * @param address - The user's wallet address
 * @param tokenAddress - The token contract address
 * @param requiredBalance - The minimum balance required (as string)
 * @returns { tokenAddress, requiredBalance, hasAccess }
 *
 * See: artifacts/starcom-mk2-web3-login-api.artifact
 * See: docs/Decentralized Web3 dApp Development Guide.markdown
 */
export interface TokenGate {
  tokenAddress: string;
  requiredBalance: string;
  hasAccess: boolean;
}

export function useTokenGate(
  address: string | null,
  tokenAddress: string,
  requiredBalance: string
): TokenGate {
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!address || !tokenAddress) {
      setHasAccess(false);
      return;
    }
    if (!window.ethereum) {
      setHasAccess(false);
      return;
    }
    async function checkBalance() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum as unknown as ethers.Eip1193Provider);
        const contract = new ethers.Contract(tokenAddress, abi, provider);
        const [balance, decimals] = await Promise.all([
          contract.balanceOf(address),
          contract.decimals(),
        ]);
        const required = ethers.parseUnits(requiredBalance, decimals);
        setHasAccess(balance >= required);
      } catch {
        setHasAccess(false);
      }
    }
    checkBalance();
  }, [address, tokenAddress, requiredBalance]);

  return { tokenAddress, requiredBalance, hasAccess };
}
