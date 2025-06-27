import { AnchorProvider, Program, web3, BN, Wallet } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';

// Inlined IDL definition to avoid module resolution issues on Vercel
const IDL = {
  version: "0.1.0",
  name: "intel_market",
  instructions: [
    {
      name: "createIntelReport",
      accounts: [
        {
          name: "intelReport",
          isMut: true,
          isSigner: false
        },
        {
          name: "author",
          isMut: true,
          isSigner: true
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "title",
          type: "string"
        },
        {
          name: "content",
          type: "string"
        },
        {
          name: "tags",
          type: {
            vec: "string"
          }
        },
        {
          name: "latitude",
          type: "f64"
        },
        {
          name: "longitude",
          type: "f64"
        },
        {
          name: "timestamp",
          type: "i64"
        }
      ]
    }
  ],
  accounts: [
    {
      name: "intelReport",
      type: {
        kind: "struct",
        fields: [
          {
            name: "title",
            type: "string"
          },
          {
            name: "content",
            type: "string"
          },
          {
            name: "tags",
            type: {
              vec: "string"
            }
          },
          {
            name: "latitude",
            type: "f64"
          },
          {
            name: "longitude",
            type: "f64"
          },
          {
            name: "timestamp",
            type: "i64"
          },
          {
            name: "author",
            type: "publicKey"
          }
        ]
      }
    }
  ]
} as const;

// Inlined IntelReportData interface to avoid module resolution issues on Vercel
interface IntelReportData {
  id?: string;
  title: string;
  content: string;
  tags: string[];
  latitude: number;
  longitude: number;
  timestamp: number;
  author: string;
  pubkey?: string;
  signature?: string;
  subtitle?: string;
  date?: string;
  categories?: string[];
  metaDescription?: string;
  lat?: number;
  long?: number;
}

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
  async initialize(wallet: Wallet): Promise<void> {
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
      const signature = await (this.program.methods as Program['methods'])
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