import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { loadRuntimeConfig } from '../../config/runtimeConfig';

type ImportMetaWithEnv = { env?: Record<string, string> };
const metaEnv = (import.meta as unknown as ImportMetaWithEnv).env || {};
const SOLANA_DEBUG = metaEnv.VITE_SOLANA_DEBUG === 'true';
if (SOLANA_DEBUG) {
  console.log('🔍 SolanaWalletService.ts loaded - debug logging enabled');
}

/**
 * SolanaWalletService - Core service for interacting with Solana wallets
 * Provides balance checking, transaction utilities, and connection management
 */
export class SolanaWalletService {
  private connection: Connection;
  private endpoint: string;

  constructor(endpoint: string = 'https://api.devnet.solana.com') {
    console.log('🔍 SolanaWalletService constructor called:', { endpoint });
    this.endpoint = endpoint;
    this.connection = new Connection(endpoint, 'confirmed');
  }

  /**
   * Get SOL balance for a public key
   */
  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw new Error('Failed to fetch wallet balance');
    }
  }

  /**
   * Get connection to Solana RPC
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Check if address is valid Solana public key
   */
  isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current slot (latest block)
   */
  async getCurrentSlot(): Promise<number> {
    return await this.connection.getSlot();
  }

  /**
   * Get transaction confirmation status
   */
  async confirmTransaction(signature: string): Promise<boolean> {
    try {
      const confirmation = await this.connection.confirmTransaction(signature);
      return !confirmation.value.err;
    } catch (error) {
      console.error('Error confirming transaction:', error);
      return false;
    }
  }

  /**
   * Change RPC endpoint
   */
  setEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
    this.connection = new Connection(endpoint, 'confirmed');
  }

  /**
   * Get current endpoint
   */
  getEndpoint(): string {
    return this.endpoint;
  }
}

// Export singleton instance
export const solanaWalletService = new SolanaWalletService();

// Attempt to align RPC endpoint with runtime config (non-blocking)
(async () => {
  try {
    const cfg = await loadRuntimeConfig();
    const cluster = cfg.network?.solanaCluster || 'devnet';
    const endpoints = cfg.network?.rpcEndpoints || [];
    const preferred = endpoints[0] || (cluster === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : cluster === 'testnet'
        ? 'https://api.testnet.solana.com'
        : 'https://api.devnet.solana.com');
    if (preferred && preferred !== solanaWalletService.getEndpoint()) {
  if (SOLANA_DEBUG) console.log('🔧 SolanaWalletService applying runtime RPC endpoint:', preferred);
      solanaWalletService.setEndpoint(preferred);
    }
  } catch (e) {
    console.warn('SolanaWalletService: failed to apply runtime RPC endpoint, using default.', e);
  }
})();
