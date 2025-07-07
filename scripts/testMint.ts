// scripts/testMint.ts
// Test script for minting Intel tokens and Intel Report NFTs on Solana Devnet
// See: artifacts/intel-report-stage1-plan.artifact

import { Keypair } from '@solana/web3.js';
import { mintIntelToken } from '../src/services/tokenService';
import { mintIntelReportNFT } from '../src/services/nftService';
import fs from 'fs';

async function loadDevnetKeypair(): Promise<Keypair> {
  const secret = JSON.parse(fs.readFileSync('devnet-keypair.json', 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

async function main() {
  const payer = await loadDevnetKeypair();

  // Mint SPL Token
  try {
    const mint = await mintIntelToken(payer);
    console.log('SPL Token Minted:', mint);
  } catch (e) {
    console.error('Error minting SPL token:', e);
  }

  // Mint NFT
  try {
    const metadata = {
      uri: 'https://example.com/intel-report-metadata.json',
      name: 'Intel Report NFT',
    };
    const nft = await mintIntelReportNFT(metadata, payer);
    console.log('NFT Minted:', nft);
  } catch (e) {
    console.error('Error minting NFT:', e);
  }
}

main();
