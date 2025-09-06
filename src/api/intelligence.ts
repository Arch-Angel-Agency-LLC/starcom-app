// AI-NOTE: Intelligence API integration for Solana-based Intelligence Exchange Marketplace
// Implements secure serverless architecture using @solana/web3.js
// See artifacts/intel-report-api-integration.artifact for migration plan and endpoint documentation.

import type { IntelReport } from '../models/IntelReport';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { IntelReportService } from '../services/IntelReportService';

/**
 * Get program ID from environment or use placeholder
 */
const PROGRAM_ID = String(import.meta.env.VITE_SOLANA_PROGRAM_ID || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

// Create service instance
const intelReportService = new IntelReportService(
  new Connection('https://api.devnet.solana.com', 'confirmed'),
  PROGRAM_ID
);

/**
 * Fetch intelligence reports directly from Solana accounts (serverless).
 * See artifacts/intel-report-api-integration.artifact for data flow and security policy.
 */
export async function fetchIntelReports(): Promise<IntelReport[]> {
  try {
    const reports = await intelReportService.fetchIntelReports();
    
    // Transform to IntelReport format
    return reports.map(report => ({
      lat: report.latitude,
      long: report.longitude,
      title: report.title,
      subtitle: '',
      date: new Date(report.timestamp).toISOString().split('T')[0],
      author: report.author,
      content: report.content,
      tags: report.tags,
      categories: [],
      metaDescription: report.content.substring(0, 100) + '...',
      pubkey: report.pubkey,
      latitude: report.latitude,
      longitude: report.longitude,
      timestamp: report.timestamp,
    }));
  } catch (error) {
    console.error('Error fetching intel reports:', error);
    throw new Error('Failed to fetch intelligence reports');
  }
}

/**
 * Submit a new intelligence report directly to Solana (serverless).
 * Requires wallet signature and on-chain program logic.
 */
export async function submitIntelReport(
  report: {
    title: string;
    content: string;
    tags: string[];
    latitude: number;
    longitude: number;
  },
  wallet: {
    publicKey: PublicKey | null;
    signTransaction?: (transaction: Transaction) => Promise<Transaction>;
  }
): Promise<string> {
  try {
    const signature = await intelReportService.submitIntelReport(
      {
        ...report,
        timestamp: Date.now(),
        pubkey: '', // Will be set by the service
        author: wallet.publicKey?.toString() || '',
      },
      wallet
    );
    
    return signature;
  } catch (error) {
    console.error('Error submitting intel report:', error);
    throw new Error('Failed to submit intelligence report');
  }
}