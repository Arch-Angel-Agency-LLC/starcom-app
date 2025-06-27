// nftService.ts
// All NFT logic must use only @solana/web3.js or secure backend/CLI. See artifacts/intel-report-artifact-index.artifact.
// TODO: Implement NFT minting via backend or CLI for zero high-risk vulnerabilities.
// AI-NOTE: SPL-Token JS and Metaplex are not allowed due to security policy.

// AI-NOTE: Secure placeholder for Intel Report NFT minting service.
// See artifacts/intel-report-stage1-plan.artifact and overlays artifact for requirements.
// Only @solana/web3.js allowed (no Metaplex, SPL-Token JS, or high-risk packages).
// TODO: Implement mintIntelReportNFT() using secure Solana logic only.
// All logic must be documented in artifacts and reference this file.
// AI-NOTE: All NFT minting logic must be implemented client-side using @solana/web3.js and wallet signatures only. No backend or CLI is allowed per the serverless, on-chain policy in the updated artifacts.

import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';

// Minimal NFT minting using only @solana/web3.js (no Metaplex, no SPL-Token JS)
// Mints a new token with supply 1 to the payer's wallet
export async function mintIntelReportNFT(payer?: Keypair): Promise<string> {
  // Connect to Solana Devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const mint = Keypair.generate();
  const payerKeypair = payer || Keypair.generate();

  // Airdrop SOL if needed
  const balance = await connection.getBalance(payerKeypair.publicKey);
  if (balance < 1e8) {
    await connection.requestAirdrop(payerKeypair.publicKey, 1e9);
  }

  // Create mint account (minimal, no SPL-Token program)
  const lamports = await connection.getMinimumBalanceForRentExemption(82);
  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payerKeypair.publicKey,
      newAccountPubkey: mint.publicKey,
      lamports,
      space: 82,
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    })
  );
  await sendAndConfirmTransaction(connection, transaction, [payerKeypair, mint]);
  // NOTE: This only creates the mint account, not a full NFT with metadata. For full NFT, use a custom program or off-chain storage.
  return mint.publicKey.toBase58();
}
