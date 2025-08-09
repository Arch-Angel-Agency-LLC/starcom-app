// ChainAdapter interface abstracts chain-specific operations.
// Initial minimal surface; expand as decentralization progresses.
export interface PaymentIntent {
  listingId: string;
  chain: string; // e.g., 'solana', 'stellar'
  amount: number;
  asset: string; // 'SOL', 'XLM', etc.
  memo?: string;
  instructions?: unknown; // chain-specific encoded details
}

export interface PaymentConfirmation {
  intentId: string;
  txSignature: string;
  confirmed: boolean;
}

export interface ChainAdapter {
  readonly chain: string;
  getPublicKey(): Promise<string | null>;
  createPaymentIntent(listingId: string, amount: number, asset?: string): Promise<PaymentIntent>;
  confirmPayment(intent: PaymentIntent, txSignature: string): Promise<PaymentConfirmation>;
}
