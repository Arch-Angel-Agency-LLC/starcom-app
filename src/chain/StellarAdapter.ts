// Placeholder Stellar adapter scaffolding
// Transitional: not implemented. On resume, implement analogous logic to SolanaAdapter
// for payment intent creation & confirmation.
import { ChainAdapter, PaymentIntent, PaymentConfirmation } from './ChainAdapter';

export class StellarAdapter implements ChainAdapter {
  readonly chain = 'stellar';

  async getPublicKey(): Promise<string | null> {
    throw new Error('StellarAdapter.getPublicKey not implemented – see PARKING_LOT.md');
  }

  async createPaymentIntent(_listingId: string, _amount: number, _asset: string = 'XLM'): Promise<PaymentIntent> {
    throw new Error('StellarAdapter.createPaymentIntent not implemented – see PARKING_LOT.md');
  }

  async confirmPayment(_intent: PaymentIntent, _txSignature: string): Promise<PaymentConfirmation> {
    throw new Error('StellarAdapter.confirmPayment not implemented – see PARKING_LOT.md');
  }
}

export const stellarAdapter = new StellarAdapter();
