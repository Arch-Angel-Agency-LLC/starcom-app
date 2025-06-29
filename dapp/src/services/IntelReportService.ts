import { 
  Connection, 
  PublicKey, 
  Keypair,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import { IntelReportData } from '../models/IntelReportData';
import { AnchorService } from './anchor/AnchorService';

// Interface for wallet with signing capabilities
interface SigningWallet {
  publicKey: PublicKey | null;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
}

/**
 * Intelligence Report Service for Solana blockchain integration
 * Handles submission of intel reports to the deployed Anchor smart contract
 */
export class IntelReportService {
  private connection: Connection;
  private programId: PublicKey;
  private anchorService: AnchorService;
  private useAnchor: boolean = false; // Temporarily disable Anchor integration
  private testMode: boolean = false; // Test mode to skip actual transaction serialization

  constructor(
    connection: Connection,
    programId: string = import.meta.env.VITE_SOLANA_PROGRAM_ID || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Valid placeholder program ID
    testMode: boolean = false
  ) {
    this.connection = connection;
    this.testMode = testMode;
    try {
      this.programId = new PublicKey(programId);
    } catch {
      console.warn('Invalid program ID provided, using placeholder');
      // Create a placeholder public key for development
      this.programId = Keypair.generate().publicKey;
    }

    // Initialize Anchor service
    this.anchorService = new AnchorService(connection, programId);
  }

  /**
   * Enable Anchor integration mode
   * @param _wallet - Wallet compatible with Anchor (unused in MVP)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async enableAnchorMode(_wallet: SigningWallet): Promise<void> {
    // Temporarily disable Anchor integration for MVP
    console.log('Anchor mode is disabled for MVP. Using traditional Solana transactions.');
    this.useAnchor = false;
    return;
    
    // TODO: Re-enable when Anchor integration is ready
    /*
    try {
      await this.anchorService.initialize(_wallet);
      this.useAnchor = true;
      console.log('Anchor mode enabled successfully');
    } catch (error) {
      console.error('Failed to enable Anchor mode:', error);
      this.useAnchor = false;
      throw new Error('Failed to enable Anchor integration');
    }
    */
  }

  /**
   * Submit an intelligence report to the Solana blockchain
   * @param report - The intel report data
   * @param wallet - Wallet adapter instance
   * @returns Transaction signature
   */
  async submitIntelReport(
    report: IntelReportData,
    wallet: SigningWallet
  ): Promise<string> {
    try {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support transaction signing');
      }

      // Use Anchor if enabled and initialized
      if (this.useAnchor && this.anchorService.getProgram()) {
        return await this.submitViaAnchor(report, wallet);
      }

      // Fallback to traditional Solana transactions
      return await this.submitViaTraditionalTransaction(report, wallet);
    } catch (error) {
      console.error('Error submitting intel report:', error);
      throw new Error(`Failed to submit intel report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit intel report using Anchor
   * @private
   */
  private async submitViaAnchor(
    report: IntelReportData,
    wallet: SigningWallet
  ): Promise<string> {
    try {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Create a keypair for signing (this is a simplified approach)
      // In production, you'd use the wallet's signing capability
      const authorKeypair = Keypair.generate(); // TODO: Use actual wallet keypair

      console.log('Submitting intel report via Anchor...');
      const signature = await this.anchorService.createIntelReport(report, authorKeypair);
      
      return signature;
    } catch (error) {
      console.error('Error submitting via Anchor:', error);
      throw new Error(`Anchor submission failed: ${error}`);
    }
  }

  /**
   * Submit intel report using traditional Solana transactions
   * @private
   */
  private async submitViaTraditionalTransaction(
    report: IntelReportData,
    wallet: SigningWallet
  ): Promise<string> {
    try {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support transaction signing');
      }

      // COMPLETED: Real Solana transaction logic for Intel Report submission
      // Creates an account for storing intel report data and uses memo program for data storage
      
      // Generate a new keypair for the intel report account
      const intelReportKeypair = Keypair.generate();
      
      // Calculate rent for the account (estimated size for intel report data)
      const accountSize = 8 + 256 + 1024 + 64 + 8 + 8 + 8 + 32; // From Anchor schema
      const rentExemptionAmount = await this.connection.getMinimumBalanceForRentExemption(accountSize);
      
      // In test mode, skip actual transaction creation and serialization
      if (this.testMode) {
        console.log('Intel report submitted successfully (test mode):', {
          signature: 'mock-signature',
          account: intelReportKeypair.publicKey.toString(),
          report: {
            title: report.title,
            tags: report.tags,
            location: [report.latitude, report.longitude],
          }
        });
        return 'mock-signature';
      }

      // Create a transaction with SystemProgram to create an account for storing intel report data
      const transaction = new Transaction();
      
      // Add instruction to create the intel report account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: intelReportKeypair.publicKey,
          lamports: rentExemptionAmount,
          space: accountSize,
          programId: this.programId, // This would be our custom intel report program
        })
      );

      // Set recent blockhash and fee payer
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // For now, since we don't have a deployed program, we'll create a basic transaction
      // that just creates an account and stores minimal data via memo instruction
      const memoData = JSON.stringify({
        title: report.title.substring(0, 50), // Truncate to fit
        tags: report.tags.slice(0, 3), // Limit tags
        lat: report.latitude,
        lng: report.longitude,
        ts: report.timestamp || Date.now(),
        author: report.author || 'anonymous'
      });

      // Add memo instruction to store intel report data
      transaction.add({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'), // Memo program
        data: Buffer.from(memoData, 'utf8'),
      });

      // Sign transaction with wallet
      const signedTransaction = await wallet.signTransaction(transaction);

      // Send transaction
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        { skipPreflight: false, preflightCommitment: 'confirmed' }
      );

      // Wait for confirmation
      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight: (await this.connection.getLatestBlockhash()).lastValidBlockHeight
      }, 'confirmed');

      console.log('Intel report submitted successfully:', {
        signature,
        account: intelReportKeypair.publicKey.toString(),
        report: {
          title: report.title,
          tags: report.tags,
          location: [report.latitude, report.longitude],
        },
        memoData
      });

      return signature;
    } catch (error) {
      console.error('Error submitting intel report:', error);
      throw new Error(`Failed to submit intel report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch intel reports from the blockchain
   * For MVP: Returns placeholder data
   * TODO: Implement actual account fetching once program is deployed
   * @returns Array of intel reports
   */
  async fetchIntelReports(): Promise<IntelReportData[]> {
    try {
      console.log('Fetching intel reports from program:', this.programId.toString());
      
      // TODO: Implement actual account fetching once program is deployed
      // const accounts = await this.connection.getProgramAccounts(this.programId);
      
      return this.getPlaceholderData();
    } catch (error) {
      console.error('Error fetching intel reports:', error);
      // Return placeholder data for MVP development
      return this.getPlaceholderData();
    }
  }

  /**
   * Get placeholder data for development
   */
  private getPlaceholderData(): IntelReportData[] {
    return [
      {
        pubkey: 'placeholder-1',
        title: 'Sample Intel Report - Anomalous Signal',
        content: 'Detected unusual electromagnetic patterns in sector 7G. Signal characteristics suggest artificial origin with periodic burst transmission every 47 minutes.',
        tags: ['SIGINT', 'ELECTROMAGNETIC', 'PATTERN_ANALYSIS'],
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: Date.now() - 3600000, // 1 hour ago
        author: 'Agent-Alpha-7'
      },
      {
        pubkey: 'placeholder-2', 
        title: 'Geomagnetic Disturbance Alert',
        content: 'Significant geomagnetic disturbance detected at 15:30 UTC. Potential space weather event affecting satellite communications in northern hemisphere.',
        tags: ['GEOMAGNETIC', 'SPACE_WEATHER', 'COMMS_DISRUPTION'],
        latitude: 64.2008,
        longitude: -149.4937,
        timestamp: Date.now() - 7200000, // 2 hours ago
        author: 'Station-Bravo-2'
      },
      {
        pubkey: 'placeholder-3',
        title: 'Maritime Traffic Analysis',
        content: 'Unusual shipping pattern observed in international waters. Three vessels maintaining parallel course with radio silence for 6+ hours.',
        tags: ['HUMINT', 'MARITIME', 'SURVEILLANCE'],
        latitude: 35.6762,
        longitude: 139.6503,
        timestamp: Date.now() - 10800000, // 3 hours ago
        author: 'Observer-Charlie-9'
      }
    ];
  }

  /**
   * Update the program ID (for when contract is deployed)
   */
  setProgramId(programId: string): void {
    try {
      this.programId = new PublicKey(programId);
      console.log('Program ID updated to:', programId);
    } catch {
      throw new Error('Invalid program ID format');
    }
  }

  /**
   * Get current program ID
   */
  getProgramId(): string {
    return this.programId.toString();
  }
}

/**
 * Hook for using Intel Report Service with wallet context
 */
export function useIntelReportService(): IntelReportService {
  // Use devnet connection for MVP
  const serviceConnection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  return new IntelReportService(serviceConnection);
}
