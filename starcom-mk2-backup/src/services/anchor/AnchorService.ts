import { AnchorProvider, Program, web3, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { IDL } from '../../types/data/intel_market';
import { IntelReportData } from '../../models/IntelReportData';

/**
 * Anchor service for interacting with the Intel Market smart contract
 * Provides type-safe interaction with the deployed Anchor program
 */
export class AnchorService {
  private connection: Connection;
  private programId: PublicKey;
  private program: Program | null = null;

  constructor(connection: Connection, programId: string) {
    this.connection = connection;
    try {
      this.programId = new PublicKey(programId);
    } catch {
      console.warn('Invalid program ID provided to AnchorService, using placeholder');
      // Create a placeholder public key for development
      this.programId = Keypair.generate().publicKey;
    }
  }

  /**
   * Initialize the Anchor program with a wallet provider
   */
  async initialize(wallet: any): Promise<void> {
    try {
      // Create an Anchor provider with the wallet and connection
      const provider = new AnchorProvider(
        this.connection,
        wallet,
        { commitment: 'confirmed' }
      );

      // Initialize the program with the IDL using the new syntax
      // Set the program ID in the provider
      const programWithId = { ...IDL, address: this.programId.toString() };
      this.program = new Program(
        programWithId,
        provider
      );

      console.log('AnchorService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AnchorService:', error);
      throw new Error(`AnchorService initialization failed: ${error}`);
    }
  }

  /**
   * Submit an intelligence report using the Anchor program
   */
  async createIntelReport(report: IntelReportData, authorWallet: web3.Keypair): Promise<string> {
    if (!this.program) {
      throw new Error('AnchorService not initialized. Call initialize() first.');
    }

    try {
      // Generate a new keypair for the intel report account
      const intelReportKeypair = Keypair.generate();

      // Use latitude and longitude directly from the report
      const latitude = report.latitude;
      const longitude = report.longitude;

      // Execute the create_intel_report instruction
      const signature = await (this.program.methods as any)
        .createIntelReport(
          report.title,
          report.content,
          report.tags,
          latitude,
          longitude,
          new BN(report.timestamp)
        )
        .accounts({
          intelReport: intelReportKeypair.publicKey,
          author: authorWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([intelReportKeypair, authorWallet])
        .rpc();

      console.log('Intel report created successfully:', signature);
      return signature;
    } catch (error) {
      console.error('Error creating intel report:', error);
      throw new Error(`Failed to create intel report: ${error}`);
    }
  }

  /**
   * Get the program instance
   */
  getProgram(): Program | null {
    return this.program;
  }
}