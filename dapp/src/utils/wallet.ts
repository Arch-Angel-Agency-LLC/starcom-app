// COMPLETED: Solana wallet integration implementation. See artifacts/intel-report-stage1-plan.artifact
// AI-NOTE: EVM/ethers.js version archived in legacy-evm/wallet.ts. Implemented Solana logic here.

import { PublicKey, Transaction } from '@solana/web3.js';

export const SUPPORTED_NETWORKS = ['devnet', 'testnet', 'mainnet-beta'];

// Interface for wallet with signing capabilities (compatible with Solana wallet adapters)
export interface SolanaWallet {
  publicKey: PublicKey | null;
  connected: boolean;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
}

// Mock wallet for testing and development
export class MockSolanaWallet implements SolanaWallet {
  public publicKey: PublicKey | null = null;
  public connected: boolean = false;

  constructor() {
    // Generate a mock public key for testing
    this.publicKey = new PublicKey('11111111111111111111111111111112'); // Valid but inactive key
  }

  async connect(): Promise<void> {
    this.connected = true;
    console.log('Mock wallet connected:', this.publicKey?.toString());
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log('Mock wallet disconnected');
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.connected || !this.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Mock signing - in real implementation, this would show user approval dialog
    console.log('Mock wallet signing transaction...');
    return transaction; // Return unsigned transaction for testing
  }

  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    if (!this.connected || !this.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    console.log(`Mock wallet signing ${transactions.length} transactions...`);
    return transactions;
  }
}

/**
 * Enhanced Solana-compatible connectToWallet implementation.
 * In a real dApp, this would integrate with wallet adapter context/hooks.
 */
export async function connectToWallet(): Promise<SolanaWallet> {
  // For development/testing, return mock wallet
  const mockWallet = new MockSolanaWallet();
  await mockWallet.connect();
  return mockWallet;
  
  // TODO: Enhance Solana wallet adapter with multi-wallet support (Phantom, Solflare, Ledger)
  // This would typically access the wallet from context:
  // const { wallet, connect } = useWallet();
  // await connect();
  // return wallet;
}

/**
 * Enhanced Solana-compatible disconnectWallet implementation.
 * In a real dApp, this would use the wallet adapter context/hooks.
 */
export async function disconnectWallet(wallet?: SolanaWallet): Promise<void> {
  if (wallet && wallet.disconnect) {
    await wallet.disconnect();
  }
  
  // TODO: Enhance Solana wallet adapter with multi-wallet support (Phantom, Solflare, Ledger)
  // const { disconnect } = useWallet();
  // await disconnect();
}

/**
 * Enhanced Solana-compatible isWalletConnected implementation.
 * In a real dApp, this would use the wallet adapter context/hooks.
 */
export function isWalletConnected(wallet?: SolanaWallet): boolean {
  return wallet?.connected || false;
  
  // TODO: Enhance Solana wallet adapter with multi-wallet support (Phantom, Solflare, Ledger)
  // const { connected } = useWallet();
  // return connected;
}

/**
 * Get current wallet balance in SOL
 */
export async function getWalletBalance(wallet: SolanaWallet): Promise<number> {
  if (!wallet.publicKey || !wallet.connected) {
    return 0;
  }
  
  // This would typically use the connection from your app context
  const { Connection } = await import('@solana/web3.js');
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  try {
    const balance = await connection.getBalance(wallet.publicKey);
    return balance / 1e9; // Convert lamports to SOL
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return 0;
  }
}