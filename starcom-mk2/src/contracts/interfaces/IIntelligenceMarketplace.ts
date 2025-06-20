// src/contracts/interfaces/IIntelligenceMarketplace.ts
// Smart Contract Interfaces for Intelligence Exchange Marketplace
// SOCOM-compliant Web3 architecture with post-quantum security

import { PublicKey } from '@solana/web3.js';
import { QuantumSignature } from '../../services/crypto/PQCryptoService';

/**
 * Security Classification Levels (SOCOM Standard)
 */
export enum SecurityClassification {
  UNCLASSIFIED = 0,
  CONFIDENTIAL = 1,
  SECRET = 2,
  TOP_SECRET = 3,
  SCI = 4, // Sensitive Compartmented Information
}

/**
 * Intelligence Asset Types for Marketplace Trading
 */
export enum IntelAssetType {
  SIGINT = "signals_intelligence",
  HUMINT = "human_intelligence",
  OSINT = "open_source_intelligence", 
  CYBERINT = "cyber_intelligence",
  GEOINT = "geospatial_intelligence",
  FININT = "financial_intelligence",
  TECHINT = "technical_intelligence"
}

/**
 * Core Intelligence Asset for NFT Minting and Trading
 */
export interface IntelligenceAsset {
  // Unique Identifiers
  id: string;
  nftMint: PublicKey;
  
  // Intelligence Metadata
  type: IntelAssetType;
  classification: SecurityClassification;
  title: string;
  description: string;
  
  // Geospatial Data
  geolocation: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  
  // Temporal Data
  timestamp: number;
  validUntil?: number;
  
  // Provenance and Security
  author: PublicKey;
  quantumSignature: QuantumSignature;
  encryptedContent: string; // Post-quantum encrypted
  
  // Market Data
  price: number; // in SOL
  isListed: boolean;
  royalties: {
    creator: number; // percentage
    marketplace: number; // percentage
  };
  
  // Access Control
  requiredClearance: SecurityClassification;
  compartments: string[]; // SCI compartments
  accessList: PublicKey[]; // Authorized users
}

/**
 * Marketplace Transaction Record
 */
export interface MarketTransaction {
  id: string;
  transactionSignature: string;
  assetId: string;
  buyer: PublicKey;
  seller: PublicKey;
  price: number;
  timestamp: number;
  quantumProof: QuantumSignature;
}

/**
 * Bidding System for Intelligence Assets
 */
export interface AssetBid {
  id: string;
  assetId: string;
  bidder: PublicKey;
  amount: number;
  timestamp: number;
  expiresAt: number;
  quantumSignature: QuantumSignature;
}

/**
 * User Profile with Security Clearance
 */
export interface UserProfile {
  walletAddress: PublicKey;
  clearanceLevel: SecurityClassification;
  compartments: string[];
  verifiedBy: PublicKey; // Issuing authority
  issuedAt: number;
  expiresAt: number;
  quantumIdentity: string; // Post-quantum identity proof
}

/**
 * Marketplace Analytics and Metrics
 */
export interface MarketMetrics {
  totalAssets: number;
  totalTransactions: number;
  totalVolume: number; // in SOL
  averagePrice: number;
  activeListings: number;
  uniqueTraders: number;
  
  // By Asset Type
  assetTypeBreakdown: Record<IntelAssetType, {
    count: number;
    volume: number;
    averagePrice: number;
  }>;
  
  // By Classification
  classificationBreakdown: Record<SecurityClassification, {
    count: number;
    volume: number;
  }>;
}

/**
 * Search and Filter Options
 */
export interface SearchFilters {
  assetType?: IntelAssetType[];
  classification?: SecurityClassification[];
  priceRange?: {min: number, max: number};
  dateRange?: {start: number, end: number};
  geographicBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  keywords?: string[];
  author?: PublicKey;
}

/**
 * Main Marketplace Contract Interface
 */
export interface IIntelligenceMarketplace {
  // Asset Management
  listAsset(asset: IntelligenceAsset, price: number): Promise<string>;
  updateListing(assetId: string, newPrice: number): Promise<void>;
  delistAsset(assetId: string): Promise<void>;
  
  // Trading Operations
  purchaseAsset(assetId: string): Promise<MarketTransaction>;
  placeBid(assetId: string, amount: number, expiresAt: number): Promise<string>;
  acceptBid(assetId: string, bidId: string): Promise<MarketTransaction>;
  cancelBid(bidId: string): Promise<void>;
  
  // Asset Discovery
  searchAssets(filters: SearchFilters): Promise<IntelligenceAsset[]>;
  getAssetDetails(assetId: string): Promise<IntelligenceAsset>;
  getAssetHistory(assetId: string): Promise<MarketTransaction[]>;
  
  // Market Analytics
  getMarketMetrics(): Promise<MarketMetrics>;
  getTopAssets(limit: number): Promise<IntelligenceAsset[]>;
  getTrendingAssets(): Promise<IntelligenceAsset[]>;
  
  // User Management
  createUserProfile(profile: UserProfile): Promise<void>;
  updateUserProfile(updates: Partial<UserProfile>): Promise<void>;
  getUserProfile(walletAddress: PublicKey): Promise<UserProfile>;
  
  // Access Control
  validateAccess(user: PublicKey, assetId: string): Promise<boolean>;
  grantAccess(assetId: string, user: PublicKey): Promise<void>;
  revokeAccess(assetId: string, user: PublicKey): Promise<void>;
  
  // Security and Compliance
  auditTransaction(transactionId: string): Promise<AuditRecord>;
  reportSuspiciousActivity(details: SuspiciousActivityReport): Promise<void>;
  getComplianceReport(): Promise<ComplianceReport>;
}

/**
 * NFT Minting Interface for Intelligence Reports
 */
export interface IIntelReportNFT {
  // NFT Creation
  mintIntelReportNFT(
    report: IntelligenceAsset,
    metadataUri: string
  ): Promise<PublicKey>;
  
  // Metadata Management
  updateMetadata(nftMint: PublicKey, newMetadataUri: string): Promise<void>;
  freezeAsset(nftMint: PublicKey): Promise<void>;
  thawAsset(nftMint: PublicKey): Promise<void>;
  
  // Transfer and Ownership
  transferAsset(nftMint: PublicKey, to: PublicKey): Promise<string>;
  burnAsset(nftMint: PublicKey): Promise<void>;
  
  // Collection Management
  createCollection(name: string, description: string): Promise<PublicKey>;
  addToCollection(nftMint: PublicKey, collectionMint: PublicKey): Promise<void>;
  
  // Royalty Management
  setRoyalties(nftMint: PublicKey, royalties: RoyaltyInfo): Promise<void>;
  getRoyalties(nftMint: PublicKey): Promise<RoyaltyInfo>;
}

/**
 * Supporting Types
 */
export interface RoyaltyInfo {
  creators: Array<{
    address: PublicKey;
    percentage: number;
  }>;
  marketplaceFee: number;
}

export interface AuditRecord {
  transactionId: string;
  timestamp: number;
  action: string;
  user: PublicKey;
  assetId?: string;
  details: Record<string, string | number | boolean>;
  quantumProof: QuantumSignature;
}

export interface SuspiciousActivityReport {
  reportedBy: PublicKey;
  targetUser?: PublicKey;
  targetAsset?: string;
  description: string;
  evidence: string[];
  timestamp: number;
}

export interface ComplianceReport {
  reportPeriod: {start: number, end: number};
  totalTransactions: number;
  flaggedTransactions: number;
  resolvedIssues: number;
  pendingInvestigations: number;
  complianceScore: number; // 0-100
}

/**
 * Contract Event Types for Real-time Updates
 */
export interface MarketplaceEvents {
  AssetListed: {
    assetId: string;
    seller: PublicKey;
    price: number;
    timestamp: number;
  };
  
  AssetSold: {
    assetId: string;
    buyer: PublicKey;
    seller: PublicKey;
    price: number;
    timestamp: number;
  };
  
  BidPlaced: {
    assetId: string;
    bidder: PublicKey;
    amount: number;
    timestamp: number;
  };
  
  AccessGranted: {
    assetId: string;
    user: PublicKey;
    grantedBy: PublicKey;
    timestamp: number;
  };
  
  SecurityAlert: {
    alertType: string;
    details: string;
    timestamp: number;
  };
}

/**
 * Program Derived Address (PDA) Seeds
 */
export const PDA_SEEDS = {
  MARKETPLACE: 'marketplace',
  ASSET: 'asset',
  USER_PROFILE: 'user_profile', 
  BID: 'bid',
  TRANSACTION: 'transaction',
  AUDIT: 'audit'
} as const;

/**
 * Contract Constants
 */
export const MARKETPLACE_CONSTANTS = {
  MAX_ASSET_SIZE: 10 * 1024, // 10KB
  MAX_METADATA_SIZE: 4 * 1024, // 4KB
  MIN_BID_DURATION: 3600, // 1 hour in seconds
  MAX_BID_DURATION: 30 * 24 * 3600, // 30 days in seconds
  MARKETPLACE_FEE: 0.025, // 2.5%
  ROYALTY_CAP: 0.10, // 10% maximum royalty
} as const;
