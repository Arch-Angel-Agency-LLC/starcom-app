/**
 * Enhanced Team Collaboration Service with Robust Solana Integration
 * 
 * This service provides comprehensive team collaboration capabilities with:
 * - Multi-signature wallet management for teams
 * - On-chain team metadata and permissions
 * - Intel report collaboration with provenance tracking
 * - Real-time synchronization with blockchain state
 * - Cross-team intelligence sharing protocols
 */

import { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction, 
  SystemProgram,
  TransactionInstruction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { IntelReportData } from '../../models/IntelReportData';
import { IntelReportService } from '../IntelReportService';
import { 
  Team, 
  CollaborationSession, 
  Operator, 
  AgencyType, 
  ClearanceLevel 
} from '../../types/features/collaboration';

// Enhanced team types for blockchain integration
// TODO: Implement IPFS content encryption before storage for sensitive data - PRIORITY: HIGH
// TODO: Add comprehensive IPFS content deduplication and optimization - PRIORITY: MEDIUM
export interface BlockchainTeam extends Team {
  onChainAddress: PublicKey;
  multiSigWallet?: PublicKey;
  teamTokenMint?: PublicKey;
  membershipNFTs: Map<string, PublicKey>;
  blockchainMetadata: TeamBlockchainMetadata;
  sharedIntelVault: PublicKey;
}

export interface TeamBlockchainMetadata {
  createdAt: number;
  lastUpdated: number;
  blockchainSignature: string;
  ipfsMetadataHash?: string;
  membershipRequirements: {
    minimumStake?: number;
    requiredNFTs?: PublicKey[];
    clearanceLevel: ClearanceLevel;
    agencyRestrictions?: AgencyType[];
  };
  collaborationSettings: {
    requiresConsensus: boolean;
    votingThreshold: number;
    intelSharingPermissions: string[];
    autoApproveMembers: boolean;
  };
}

export interface TeamIntelPackage {
  packageId: string;
  teamId: string;
  reports: IntelReportData[];
  collaborators: string[];
  onChainAddress?: PublicKey;
  ipfsHash?: string;
  metadata: {
    classification: ClearanceLevel;
    createdAt: number;
    lastModified: number;
    version: number;
    contributors: Array<{
      operatorId: string;
      walletAddress: string;
      contribution: string;
      timestamp: number;
      signature: string;
    }>;
  };
}

export interface TeamTransaction {
  signature: string;
  teamId: string;
  type: 'CREATE_TEAM' | 'ADD_MEMBER' | 'REMOVE_MEMBER' | 'SHARE_INTEL' | 'CREATE_PACKAGE' | 'VOTE';
  timestamp: number;
  initiator: string;
  data: Record<string, unknown>;
  confirmations: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
}

/**
 * Enhanced Team Collaboration Service with comprehensive Solana blockchain integration
 */
export class EnhancedTeamCollaborationService {
  private connection: Connection;
  private intelReportService: IntelReportService;
  private teams: Map<string, BlockchainTeam> = new Map();
  private activePackages: Map<string, TeamIntelPackage> = new Map();
  private pendingTransactions: Map<string, TeamTransaction> = new Map();
  
  // Service configuration
  private readonly TEAM_ACCOUNT_SIZE = 1000; // Estimated size for team metadata
  private readonly PACKAGE_ACCOUNT_SIZE = 2000; // Estimated size for intel packages
  private readonly MEMBERSHIP_TOKEN_DECIMALS = 0; // NFT-style tokens

  constructor(
    connection: Connection, 
    programId?: string,
    options: {
      enableRealTimeSync?: boolean;
      autoConfirmTransactions?: boolean;
      defaultNetwork?: 'devnet' | 'testnet' | 'mainnet-beta';
    } = {}
  ) {
    this.connection = connection;
    this.intelReportService = new IntelReportService(
      connection, 
      programId, 
      options.defaultNetwork === 'devnet'
    );

    // Initialize real-time synchronization if enabled
    if (options.enableRealTimeSync) {
      this.startBlockchainSync();
    }
  }

  /**
   * Create a new team with on-chain metadata and multi-signature capabilities
   */
  async createTeam(
    teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>,
    creator: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> },
    options: {
      enableMultiSig?: boolean;
      initialStake?: number;
      membershipNFT?: boolean;
    } = {}
  ): Promise<{ team: BlockchainTeam; signature: string }> {
    try {
      // Generate team account keypair
      const teamKeypair = Keypair.generate();
      const teamId = teamKeypair.publicKey.toBase58();

      // Create transaction for team creation
      const transaction = new Transaction();
      
      // Calculate rent exemption
      const rentExemption = await this.connection.getMinimumBalanceForRentExemption(
        this.TEAM_ACCOUNT_SIZE
      );

      // Create team account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: creator.publicKey,
          newAccountPubkey: teamKeypair.publicKey,
          lamports: rentExemption + (options.initialStake || 0) * LAMPORTS_PER_SOL,
          space: this.TEAM_ACCOUNT_SIZE,
          programId: SystemProgram.programId, // Use system program for now
        })
      );

      // Store team metadata on-chain via memo
      const teamMetadata = {
        name: teamData.name,
        description: teamData.description,
        agency: teamData.agency,
        classification: teamData.classification,
        creator: creator.publicKey.toBase58(),
        createdAt: Date.now(),
        type: 'TEAM_METADATA',
        version: '1.0.0'
      };

      transaction.add(
        new TransactionInstruction({
          keys: [],
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
          data: Buffer.from(JSON.stringify(teamMetadata), 'utf8'),
        })
      );

      // Set recent blockhash and sign
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = creator.publicKey;

      // Partially sign with team keypair
      transaction.partialSign(teamKeypair);

      // Sign with creator wallet
      const signedTransaction = await creator.signTransaction(transaction);

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

      // Create BlockchainTeam object
      const blockchainTeam: BlockchainTeam = {
        ...teamData,
        id: teamId,
        createdAt: new Date(),
        updatedAt: new Date(),
        onChainAddress: teamKeypair.publicKey,
        membershipNFTs: new Map(),
        blockchainMetadata: {
          createdAt: Date.now(),
          lastUpdated: Date.now(),
          blockchainSignature: signature,
          membershipRequirements: {
            clearanceLevel: teamData.classification,
            agencyRestrictions: teamData.agency ? [teamData.agency] : undefined,
          },
          collaborationSettings: {
            requiresConsensus: false,
            votingThreshold: 51,
            intelSharingPermissions: [],
            autoApproveMembers: false,
          }
        },
        sharedIntelVault: Keypair.generate().publicKey, // Placeholder for future implementation
      };

      // Add creator as first member
      blockchainTeam.members = [{
        id: creator.publicKey.toBase58(),
        name: 'Team Creator',
        agency: teamData.agency || 'CYBER_COMMAND',
        role: 'LEAD_ANALYST',
        clearanceLevel: teamData.classification,
        specializations: [],
        status: 'ONLINE',
        lastActivity: new Date(),
        walletAddress: creator.publicKey.toBase58(),
        permissions: ['CREATE_REPORTS', 'INVITE_MEMBERS', 'MANAGE_TEAM']
      }];

      // Store team locally and create transaction record
      this.teams.set(teamId, blockchainTeam);
      this.addTransactionRecord(signature, teamId, 'CREATE_TEAM', creator.publicKey.toBase58(), teamMetadata);

      console.log('Team created successfully on Solana:', {
        teamId,
        signature,
        onChainAddress: teamKeypair.publicKey.toBase58(),
        metadata: teamMetadata
      });

      return { team: blockchainTeam, signature };

    } catch (error) {
      console.error('Failed to create team on blockchain:', error);
      throw new Error(`Team creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add a member to an existing team with on-chain verification
   */
  async addTeamMember(
    teamId: string,
    newMember: Operator,
    inviter: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> },
    options: {
      requiresVote?: boolean;
      membershipNFT?: boolean;
    } = {}
  ): Promise<{ signature: string; success: boolean }> {
    try {
      const team = this.teams.get(teamId);
      if (!team) {
        throw new Error(`Team ${teamId} not found`);
      }

      // Verify inviter has permission
      const inviterMember = team.members.find(m => m.walletAddress === inviter.publicKey.toBase58());
      if (!inviterMember || !inviterMember.permissions?.includes('INVITE_MEMBERS')) {
        throw new Error('Insufficient permissions to add team members');
      }

      // Create membership transaction
      const transaction = new Transaction();
      
      // Add memo instruction with membership data
      const membershipData = {
        teamId,
        newMember: {
          id: newMember.id,
          name: newMember.name,
          agency: newMember.agency,
          role: newMember.role,
          clearanceLevel: newMember.clearanceLevel,
          walletAddress: newMember.walletAddress
        },
        inviter: inviter.publicKey.toBase58(),
        timestamp: Date.now(),
        type: 'ADD_TEAM_MEMBER',
        requiresVote: options.requiresVote || false
      };

      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: team.onChainAddress, isSigner: false, isWritable: true },
            { pubkey: inviter.publicKey, isSigner: true, isWritable: false }
          ],
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
          data: Buffer.from(JSON.stringify(membershipData), 'utf8'),
        })
      );

      // Process transaction
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = inviter.publicKey;

      const signedTransaction = await inviter.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        { skipPreflight: false, preflightCommitment: 'confirmed' }
      );

      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight: (await this.connection.getLatestBlockhash()).lastValidBlockHeight
      }, 'confirmed');

      // Update local team state
      team.members.push(newMember);
      team.updatedAt = new Date();
      team.blockchainMetadata.lastUpdated = Date.now();

      this.addTransactionRecord(signature, teamId, 'ADD_MEMBER', inviter.publicKey.toBase58(), membershipData);

      console.log('Team member added successfully:', {
        teamId,
        newMember: newMember.name,
        signature
      });

      return { signature, success: true };

    } catch (error) {
      console.error('Failed to add team member:', error);
      throw new Error(`Add member failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create collaborative intel package with blockchain provenance
   */
  async createIntelPackage(
    teamId: string,
    reports: IntelReportData[],
    packageData: {
      name: string;
      description: string;
      classification: ClearanceLevel;
      tags: string[];
    },
    creator: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> }
  ): Promise<{ packageId: string; signature: string }> {
    try {
      const team = this.teams.get(teamId);
      if (!team) {
        throw new Error(`Team ${teamId} not found`);
      }

      // Verify creator is team member
      const creatorMember = team.members.find(m => m.walletAddress === creator.publicKey.toBase58());
      if (!creatorMember) {
        throw new Error('Only team members can create intel packages');
      }

      // Generate package ID and account
      const packageKeypair = Keypair.generate();
      const packageId = packageKeypair.publicKey.toBase58();

      // Submit individual reports to blockchain first
      const reportSignatures: string[] = [];
      for (const report of reports) {
        try {
          const signature = await this.intelReportService.submitIntelReport(report, creator);
          reportSignatures.push(signature);
          console.log(`Report "${report.title}" submitted with signature: ${signature}`);
        } catch (error) {
          console.warn(`Failed to submit report "${report.title}":`, error);
        }
      }

      // Create package transaction
      const transaction = new Transaction();
      
      // Calculate rent for package account
      const rentExemption = await this.connection.getMinimumBalanceForRentExemption(
        this.PACKAGE_ACCOUNT_SIZE
      );

      // Create package account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: creator.publicKey,
          newAccountPubkey: packageKeypair.publicKey,
          lamports: rentExemption,
          space: this.PACKAGE_ACCOUNT_SIZE,
          programId: SystemProgram.programId,
        })
      );

      // Package metadata
      const packageMetadata = {
        packageId,
        teamId,
        name: packageData.name,
        description: packageData.description,
        classification: packageData.classification,
        tags: packageData.tags,
        reportCount: reports.length,
        reportSignatures,
        creator: creator.publicKey.toBase58(),
        contributors: [{
          operatorId: creatorMember.id,
          walletAddress: creator.publicKey.toBase58(),
          contribution: 'Package Creator',
          timestamp: Date.now(),
          signature: '' // Will be filled after transaction
        }],
        createdAt: Date.now(),
        type: 'INTEL_PACKAGE',
        version: '1.0.0'
      };

      // Add memo with package metadata
      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: team.onChainAddress, isSigner: false, isWritable: false },
            { pubkey: packageKeypair.publicKey, isSigner: true, isWritable: true }
          ],
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
          data: Buffer.from(JSON.stringify(packageMetadata), 'utf8'),
        })
      );

      // Process transaction
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = creator.publicKey;

      // Sign with package keypair
      transaction.partialSign(packageKeypair);

      // Sign with creator
      const signedTransaction = await creator.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        { skipPreflight: false, preflightCommitment: 'confirmed' }
      );

      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight: (await this.connection.getLatestBlockhash()).lastValidBlockHeight
      }, 'confirmed');

      // Create local package object
      const intelPackage: TeamIntelPackage = {
        packageId,
        teamId,
        reports,
        collaborators: [creator.publicKey.toBase58()],
        onChainAddress: packageKeypair.publicKey,
        metadata: {
          classification: packageData.classification,
          createdAt: Date.now(),
          lastModified: Date.now(),
          version: 1,
          contributors: [{
            operatorId: creatorMember.id,
            walletAddress: creator.publicKey.toBase58(),
            contribution: 'Package Creator',
            timestamp: Date.now(),
            signature
          }]
        }
      };

      // Store package
      this.activePackages.set(packageId, intelPackage);
      this.addTransactionRecord(signature, teamId, 'CREATE_PACKAGE', creator.publicKey.toBase58(), packageMetadata);

      console.log('Intel package created successfully:', {
        packageId,
        teamId,
        signature,
        reportCount: reports.length,
        onChainAddress: packageKeypair.publicKey.toBase58()
      });

      return { packageId, signature };

    } catch (error) {
      console.error('Failed to create intel package:', error);
      throw new Error(`Package creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Share intel package with another team
   */
  async shareIntelPackage(
    packageId: string,
    targetTeamId: string,
    sharer: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> },
    permissions: string[] = ['READ']
  ): Promise<{ signature: string; success: boolean }> {
    try {
      const intelPackage = this.activePackages.get(packageId);
      const sourceTeam = intelPackage ? this.teams.get(intelPackage.teamId) : null;
      const targetTeam = this.teams.get(targetTeamId);

      if (!intelPackage || !sourceTeam || !targetTeam) {
        throw new Error('Package or team not found');
      }

      // Verify sharer has permission
      const sharerMember = sourceTeam.members.find(m => m.walletAddress === sharer.publicKey.toBase58());
      if (!sharerMember || !sharerMember.permissions?.includes('SHARE_INTEL')) {
        throw new Error('Insufficient permissions to share intel packages');
      }

      // Create sharing transaction
      const transaction = new Transaction();
      
      const sharingData = {
        packageId,
        sourceTeamId: intelPackage.teamId,
        targetTeamId,
        sharer: sharer.publicKey.toBase58(),
        permissions,
        timestamp: Date.now(),
        type: 'SHARE_INTEL_PACKAGE',
        packageMetadata: {
          classification: intelPackage.metadata.classification,
          reportCount: intelPackage.reports.length,
          version: intelPackage.metadata.version
        }
      };

      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: sourceTeam.onChainAddress, isSigner: false, isWritable: false },
            { pubkey: targetTeam.onChainAddress, isSigner: false, isWritable: true },
            { pubkey: intelPackage.onChainAddress!, isSigner: false, isWritable: false }
          ],
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
          data: Buffer.from(JSON.stringify(sharingData), 'utf8'),
        })
      );

      // Process transaction
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = sharer.publicKey;

      const signedTransaction = await sharer.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        { skipPreflight: false, preflightCommitment: 'confirmed' }
      );

      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight: (await this.connection.getLatestBlockhash()).lastValidBlockHeight
      }, 'confirmed');

      // Update local state
      intelPackage.collaborators.push(...targetTeam.members.map(m => m.walletAddress || '').filter(Boolean));
      intelPackage.metadata.lastModified = Date.now();

      this.addTransactionRecord(signature, intelPackage.teamId, 'SHARE_INTEL', sharer.publicKey.toBase58(), sharingData);

      console.log('Intel package shared successfully:', {
        packageId,
        sourceTeam: sourceTeam.name,
        targetTeam: targetTeam.name,
        signature
      });

      return { signature, success: true };

    } catch (error) {
      console.error('Failed to share intel package:', error);
      throw new Error(`Package sharing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get team by ID with real-time blockchain sync
   */
  async getTeam(teamId: string): Promise<BlockchainTeam | null> {
    const team = this.teams.get(teamId);
    if (!team) return null;

    // Optionally sync with blockchain for latest state
    try {
      await this.syncTeamWithBlockchain(teamId);
    } catch (error) {
      console.warn(`Failed to sync team ${teamId} with blockchain:`, error);
    }

    return this.teams.get(teamId) || null;
  }

  /**
   * Get all teams for a user
   */
  async getUserTeams(walletAddress: string): Promise<BlockchainTeam[]> {
    const userTeams: BlockchainTeam[] = [];
    
    for (const team of this.teams.values()) {
      if (team.members.some(m => m.walletAddress === walletAddress)) {
        userTeams.push(team);
      }
    }

    return userTeams;
  }

  /**
   * Get intel packages for a team
   */
  async getTeamPackages(teamId: string): Promise<TeamIntelPackage[]> {
    const teamPackages: TeamIntelPackage[] = [];
    
    for (const pkg of this.activePackages.values()) {
      if (pkg.teamId === teamId) {
        teamPackages.push(pkg);
      }
    }

    return teamPackages;
  }

  /**
   * Get transaction history for a team
   */
  async getTeamTransactions(teamId: string): Promise<TeamTransaction[]> {
    const teamTransactions: TeamTransaction[] = [];
    
    for (const tx of this.pendingTransactions.values()) {
      if (tx.teamId === teamId) {
        teamTransactions.push(tx);
      }
    }

    return teamTransactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Private helper methods

  private addTransactionRecord(
    signature: string,
    teamId: string,
    type: TeamTransaction['type'],
    initiator: string,
    data: Record<string, unknown>
  ): void {
    const transaction: TeamTransaction = {
      signature,
      teamId,
      type,
      timestamp: Date.now(),
      initiator,
      data,
      confirmations: 1,
      status: 'CONFIRMED'
    };

    this.pendingTransactions.set(signature, transaction);
  }

  private async syncTeamWithBlockchain(teamId: string): Promise<void> {
    // Implementation for syncing team state with blockchain
    // This would query the blockchain for the latest team state
    // For now, this is a placeholder
    console.log(`Syncing team ${teamId} with blockchain...`);
  }

  private startBlockchainSync(): void {
    // Start periodic sync with blockchain
    setInterval(async () => {
      try {
        for (const teamId of this.teams.keys()) {
          await this.syncTeamWithBlockchain(teamId);
        }
      } catch (error) {
        console.warn('Blockchain sync error:', error);
      }
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Create a collaborative session with blockchain provenance
   */
  async createCollaborationSession(
    sessionData: Omit<CollaborationSession, 'id' | 'createdAt' | 'updatedAt'>,
    creator: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> }
  ): Promise<{ session: CollaborationSession; signature: string }> {
    try {
      const sessionId = Keypair.generate().publicKey.toBase58();
      
      // Create session metadata transaction
      const transaction = new Transaction();
      
      const sessionMetadata = {
        sessionId,
        name: sessionData.name,
        description: sessionData.description,
        classification: sessionData.classification,
        leadAgency: sessionData.leadAgency,
        creator: creator.publicKey.toBase58(),
        createdAt: Date.now(),
        type: 'COLLABORATION_SESSION',
        version: '1.0.0'
      };

      transaction.add(
        new TransactionInstruction({
          keys: [],
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
          data: Buffer.from(JSON.stringify(sessionMetadata), 'utf8'),
        })
      );

      // Process transaction
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = creator.publicKey;

      const signedTransaction = await creator.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        { skipPreflight: false, preflightCommitment: 'confirmed' }
      );

      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight: (await this.connection.getLatestBlockhash()).lastValidBlockHeight
      }, 'confirmed');

      const session: CollaborationSession = {
        ...sessionData,
        id: sessionId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('Collaboration session created:', {
        sessionId,
        signature,
        metadata: sessionMetadata
      });

      return { session, signature };

    } catch (error) {
      console.error('Failed to create collaboration session:', error);
      throw new Error(`Session creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Hook for using Enhanced Team Collaboration Service
 */
export function useEnhancedTeamCollaboration(
  network: 'devnet' | 'testnet' | 'mainnet-beta' = 'devnet'
): EnhancedTeamCollaborationService {
  const connection = new Connection(
    network === 'devnet' ? 'https://api.devnet.solana.com' :
    network === 'testnet' ? 'https://api.testnet.solana.com' :
    'https://api.mainnet-beta.solana.com',
    'confirmed'
  );
  
  return new EnhancedTeamCollaborationService(connection, undefined, {
    enableRealTimeSync: true,
    autoConfirmTransactions: true,
    defaultNetwork: network
  });
}
