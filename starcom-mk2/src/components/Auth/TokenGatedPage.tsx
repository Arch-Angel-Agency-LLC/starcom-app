// src/components/Auth/TokenGatedPage.tsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useOnChainRoles } from '../../hooks/useOnChainRoles';
import { useTokenGate } from '../../hooks/useTokenGate';

// Example NFT address and required balance (replace with real values)
const NFT_ADDRESS = '0x0000000000000000000000000000000000000000';

const TokenGatedPage: React.FC = () => {
  const { address } = useAuth();
  const roles = useOnChainRoles(address || '');
  const isAdmin = roles.find(r => r.role === 'ADMIN')?.hasRole;
  const tokenGate = useTokenGate(address || '', NFT_ADDRESS); // Only 2 args

  if (!address) {
    return <p>Please connect your wallet to access this page.</p>;
  }

  if (!tokenGate.hasAccess) {
    return <p>Access denied: You need the NFT to view this page.</p>;
  }

  if (!isAdmin) {
    return <p>Access denied: Admins only.</p>;
  }

  return (
    <div>
      <h2>Protected Token-Gated Page</h2>
      <p>Welcome, admin! You have the required NFT/token.</p>
    </div>
  );
};

export default TokenGatedPage;

// AI-NOTE: This component is EVM/ethers.js-based and not compatible with the serverless, on-chain Solana architecture. Refactor or remove this file. All token/NFT gating should use Solana primitives and wallet-based access control, enforced on-chain and in the client per the updated artifacts.
