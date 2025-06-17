// TODO: Solana wallet integration in progress. See artifacts/intel-report-stage1-plan.artifact
// AI-NOTE: EVM/ethers.js version archived in legacy-evm/wallet.ts. Implement Solana logic here.

export const SUPPORTED_NETWORKS = ['devnet', 'testnet', 'mainnet-beta'];

/**
 * Minimal Solana-compatible connectToWallet stub.
 * In a real dApp, use the wallet adapter context/hooks for connection.
 */
export async function connectToWallet() {
  // This is a placeholder. Use wallet adapter UI/context in the app for real connections.
  throw new Error('connectToWallet is a placeholder. Use the Solana wallet adapter context/hooks in your components.');
}

/**
 * Minimal Solana-compatible disconnectWallet stub.
 * In a real dApp, use the wallet adapter context/hooks for disconnecting.
 */
export async function disconnectWallet() {
  // This is a placeholder. Use wallet adapter UI/context in the app for real disconnects.
  throw new Error('disconnectWallet is a placeholder. Use the Solana wallet adapter context/hooks in your components.');
}

/**
 * Minimal Solana-compatible isWalletConnected stub.
 * In a real dApp, use the wallet adapter context/hooks for connection state.
 */
export function isWalletConnected() {
  // This is a placeholder. Use wallet adapter context/hooks in your components for real state.
  return false;
}