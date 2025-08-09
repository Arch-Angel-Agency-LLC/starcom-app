import { ChainAdapter, PaymentIntent, PaymentConfirmation } from './ChainAdapter';
import { solanaWalletService } from '../services/wallet/SolanaWalletService';

// Placeholder wallet public key retrieval (to be replaced with real wallet adapter integration)
async function getConnectedPublicKey(): Promise<string | null> {
  return null; // No wallet integration yet
}

export class SolanaAdapter implements ChainAdapter {
  readonly chain = 'solana';

  async getPublicKey(): Promise<string | null> {
    return await getConnectedPublicKey();
  }

  async createPaymentIntent(listingId: string, amount: number, asset: string = 'SOL'): Promise<PaymentIntent> {
    return {
      listingId,
      chain: this.chain,
      amount,
      asset,
      memo: `L:${listingId}`
    };
  }

  async confirmPayment(intent: PaymentIntent, txSignature: string): Promise<PaymentConfirmation> {
    const ok = await solanaWalletService.confirmTransaction(txSignature).catch(() => false);
    return { intentId: intent.listingId, txSignature, confirmed: ok };
  }
}

export const solanaAdapter = new SolanaAdapter();
