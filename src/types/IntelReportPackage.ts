/**
 * IntelReportPackage - Complete Intelligence Report Container
 * 
 * Combines lightweight metadata (for NFT/blockchain) with heavy content (DataPack)
 * Optimized for marketplace efficiency and graph visualization.
 */

import { IntelReportData } from '../models/IntelReportData';
import { IntelReportDataPack } from './IntelReportDataPack';

/**
 * Complete Intelligence Report Package
 * 
 * Architecture:
 * - IntelReport: Lightweight metadata (stored on-chain in NFT)
 * - IntelReportDataPack: Heavy content (stored off-chain, encrypted)
 */
export interface IntelReportPackage {
  // Package identification
  packageId: string;
  version: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  
  // Lightweight metadata (suitable for NFT/blockchain storage)
  metadata: IntelReport;
  
  // Heavy content (off-chain storage)
  dataPack: IntelReportDataPack;
  
  // Package integrity and security
  signature: PackageSignature;
  encryption?: PackageEncryption;
  
  // Access control
  accessControl: PackageAccessControl;
  
  // Distribution metadata
  distribution: DistributionMetadata;
  
  // Marketplace metadata (for NFT trading)
  marketplace?: MarketplaceMetadata;
}

/**
 * Lightweight IntelReport metadata (on-chain storage)
 * 
 * This is what gets stored in the NFT and on the blockchain.
 * Keep this minimal to reduce gas costs.
 */
export interface IntelReport {
  // Core identification
  id: string;
  title: string;
  summary: string; // Brief description (max 500 chars)
  
  // Classification and security
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  priority: 'ROUTINE' | 'PRIORITY' | 'IMMEDIATE' | 'FLASH';
  
  // Basic metadata
  author: string; // Wallet address or pseudonym
  timestamp: number; // Unix timestamp
  expiresAt?: number; // Unix timestamp
  
  // Geographic context (for quick filtering)
  location: {
    lat: number;
    lng: number;
    region?: string; // e.g., "North America", "Europe"
  };
  
  // Content summary
  intelligence: {
    type: 'OSINT' | 'SIGINT' | 'HUMINT' | 'GEOINT' | 'FININT' | 'TECHINT';
    confidence: number; // 0.0 - 1.0
    entitiesCount: number;
    relationshipsCount: number;
    keyTags: string[]; // Top 5 most important tags
  };
  
  // Data pack reference
  dataPackHash: string; // SHA-256 of the data pack
  dataPackSize: number; // Size in bytes
  dataPackLocation: string; // IPFS hash, URL, or storage reference
  
  // Compatibility with existing IntelReportData
  legacyId?: string; // Maps to existing IntelReportData.id
}

/**
 * Digital signature for package integrity
 */
export interface PackageSignature {
  // Standard cryptographic signature
  algorithm: 'ecdsa-secp256k1' | 'ed25519' | 'rsa-pss';
  signature: string; // Base64 encoded signature
  publicKey: string; // Base64 encoded public key
  
  // Post-quantum cryptography (future-proof)
  pqcSignature?: {
    algorithm: 'ML-DSA-65' | 'ML-DSA-87';
    signature: string; // Base64 encoded PQC signature
    publicKey: string; // Base64 encoded PQC public key
  };
  
  // Verification metadata
  signedAt: string; // ISO timestamp
  signedBy: string; // Signer identifier
  
  // Hash of signed content
  contentHash: string; // SHA-256 of metadata + data pack
}

/**
 * Package encryption configuration
 */
export interface PackageEncryption {
  // Encryption algorithm
  algorithm: 'aes-256-gcm' | 'chacha20-poly1305';
  
  // Key derivation
  keyDerivation: {
    algorithm: 'pbkdf2' | 'scrypt' | 'argon2';
    salt: string; // Base64 encoded
    iterations?: number; // For PBKDF2
    memory?: number; // For Argon2 (KB)
    parallelism?: number; // For Argon2
  };
  
  // Encryption metadata
  iv: string; // Base64 encoded initialization vector
  encryptedAt: string; // ISO timestamp
  
  // Hybrid encryption (for multiple recipients)
  recipients?: EncryptionRecipient[];
  
  // Post-quantum encryption
  pqcEncryption?: {
    algorithm: 'ML-KEM-768' | 'ML-KEM-1024';
    encapsulatedKey: string; // Base64 encoded
    ciphertext: string; // Base64 encoded
  };
}

/**
 * Encryption recipient (for hybrid encryption)
 */
export interface EncryptionRecipient {
  recipientId: string; // Wallet address or identifier
  publicKey: string; // Base64 encoded public key
  encryptedKey: string; // Base64 encoded encrypted symmetric key
  algorithm: 'rsa-oaep' | 'ecdh-es';
}

/**
 * Access control configuration
 */
export interface PackageAccessControl {
  // Public access
  publicRead: boolean;
  publicDownload: boolean;
  
  // Authentication requirements
  requiresWalletAuth: boolean;
  requiresSubscription: boolean;
  
  // Authorized entities
  authorizedWallets?: string[]; // Wallet addresses
  authorizedRoles?: string[]; // Role-based access
  
  // Temporal restrictions
  availableFrom?: string; // ISO timestamp
  availableUntil?: string; // ISO timestamp
  
  // Geographic restrictions
  geoRestrictions?: {
    allowedCountries?: string[]; // ISO country codes
    blockedCountries?: string[]; // ISO country codes
    allowedRegions?: string[];
  };
  
  // Usage restrictions
  maxDownloads?: number;
  maxViews?: number;
  redistributionAllowed: boolean;
  commercialUseAllowed: boolean;
  
  // Compliance requirements
  clearanceLevel?: string; // Required security clearance
  needToKnow?: string[]; // Need-to-know categories
}

/**
 * Distribution and storage metadata
 */
export interface DistributionMetadata {
  // Primary storage
  primaryLocation: StorageLocation;
  
  // Backup/mirror locations
  mirrors?: StorageLocation[];
  
  // Content delivery
  cdnEnabled: boolean;
  cacheControl: {
    maxAge: number; // Seconds
    public: boolean;
    immutable: boolean;
  };
  
  // Redundancy and availability
  replicationFactor: number; // Number of copies
  availabilityTarget: number; // 0.99, 0.999, etc.
  
  // Bandwidth and performance
  maxBandwidth?: number; // Bytes per second
  compressionEnabled: boolean;
  
  // Distribution tracking
  downloadCount: number;
  lastAccessed?: string; // ISO timestamp
  popularityScore: number; // 0.0 - 1.0
}

/**
 * Storage location specification
 */
export interface StorageLocation {
  type: 'ipfs' | 'arweave' | 'storj' | 'filecoin' | 'aws' | 'custom';
  address: string; // Hash, URL, or identifier
  
  // Storage metadata
  pinned?: boolean; // For IPFS
  permanent?: boolean; // For Arweave
  
  // Access configuration
  accessKey?: string;
  encryption: boolean;
  
  // Performance metrics
  averageLatency?: number; // Milliseconds
  availability?: number; // 0.0 - 1.0
  bandwidth?: number; // Bytes per second
}

/**
 * NFT Marketplace metadata
 */
export interface MarketplaceMetadata {
  // Listing information
  listingId?: string;
  listed: boolean;
  price?: {
    amount: number;
    currency: 'SOL' | 'USDC' | 'ETH' | 'CREDITS';
    priceHistory?: PriceHistoryEntry[];
  };
  
  // NFT details
  nftMint?: string; // Solana mint address
  tokenStandard: 'SPL' | 'ERC-721' | 'ERC-1155';
  royalties: {
    percentage: number; // 0-100
    recipient: string; // Wallet address
  };
  
  // Trading metadata
  totalSales: number;
  uniqueOwners: number;
  floorPrice?: number;
  lastSalePrice?: number;
  lastSaleDate?: string; // ISO timestamp
  
  // Marketplace analytics
  views: number;
  favorites: number;
  shares: number;
  
  // Collection information
  collectionId?: string;
  collectionName?: string;
  collectionFloorPrice?: number;
  
  // Verification status
  verified: boolean;
  verifiedBy?: string;
  verificationDate?: string; // ISO timestamp
}

/**
 * Price history entry
 */
export interface PriceHistoryEntry {
  price: number;
  currency: string;
  date: string; // ISO timestamp
  buyer?: string; // Wallet address
  seller?: string; // Wallet address
  transactionHash?: string;
}

/**
 * Package creation options
 */
export interface CreatePackageOptions {
  // Source data
  sourceIntelReport: IntelReportData; // Existing format
  obsidianVaultPath?: string; // Path to Obsidian vault
  additionalFiles?: Array<{
    path: string;
    content: string | ArrayBuffer;
    mimeType: string;
  }>;
  
  // Encryption settings
  encryption?: {
    enabled: boolean;
    password?: string;
    recipients?: string[]; // Wallet addresses
  };
  
  // Compression settings
  compression?: {
    enabled: boolean;
    algorithm: 'gzip' | 'brotli' | 'lz4';
    level?: number;
  };
  
  // Storage preferences
  storage: {
    primary: 'ipfs' | 'arweave' | 'storj';
    mirrors?: ('ipfs' | 'arweave' | 'storj')[];
    pin: boolean;
  };
  
  // Marketplace settings
  marketplace?: {
    list: boolean;
    price?: number;
    currency?: 'SOL' | 'USDC' | 'ETH' | 'CREDITS';
    royalties?: number; // Percentage
  };
  
  // Access control
  accessControl?: Partial<PackageAccessControl>;
}

/**
 * Package loading options
 */
export interface LoadPackageOptions {
  // Authentication
  walletAddress?: string;
  signature?: string;
  
  // Decryption
  password?: string;
  privateKey?: string;
  
  // Performance
  cacheEnabled: boolean;
  preloadContent: boolean;
  
  // Content filtering
  loadMetadataOnly: boolean;
  includeFiles?: string[]; // Specific file paths to load
  excludeFiles?: string[]; // File paths to exclude
  
  // Verification
  verifySignature: boolean;
  verifyIntegrity: boolean;
}

/**
 * Package validation result
 */
export interface PackageValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  
  // Detailed validation results
  metadataValid: boolean;
  dataPackValid: boolean;
  signatureValid: boolean;
  integrityValid: boolean;
  accessAllowed: boolean;
  
  // Performance metrics
  validationTime: number; // Milliseconds
  
  // Security assessment
  securityScore: number; // 0.0 - 1.0
  riskFactors: string[];
}

/**
 * Validation error
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'critical' | 'major' | 'minor';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  recommendation?: string;
}
