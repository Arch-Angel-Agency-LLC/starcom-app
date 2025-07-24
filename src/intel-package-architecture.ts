/**
 * IntelReportPackage Architecture - Main Exports
 * 
 * This file exports all the components of the new IntelReportPackage architecture
 * for easy importing throughout the application.
 */

// Core Types
export * from './types/DataPack';
export * from './types/IntelReportDataPack';
export * from './types/IntelReportPackage';

// Services
export { VirtualFileSystemManager } from './services/VirtualFileSystemManager';
export { IntelReportPackageManager } from './services/IntelReportPackageManager';

// Enhanced Models (with package support)
export * from './models/IntelReportData';

// New unified architecture (specific exports to avoid conflicts)
export { 
  IntelReportMetadata,
  IntelReportConverter,
  MemorySafetyManager,
  MemorySafetyConfig,
  VersionCompatibilityManager,
  VersionInfo
} from './types/IntelReportArchitecture';

// Examples and Utilities
export { IntelPackageExamples } from './examples/IntelReportPackageExamples';

// Re-export key interfaces for convenience
export type {
  // Core package types
  IntelReportPackage,
  IntelReport,
  CreatePackageOptions,
  LoadPackageOptions,
  PackageValidationResult,
  
  // Marketplace
  MarketplaceMetadata,
  StorageLocation,
  DistributionMetadata,
  
  // Security
  PackageSignature,
  PackageEncryption,
  PackageAccessControl
} from './types/IntelReportPackage';

export type {
  // Data pack types
  IntelReportDataPack,
  ObsidianVaultStructure,
  ObsidianFile,
  ObsidianFrontmatter,
  IntelEntity,
  IntelRelationship,
  IntelCluster
} from './types/IntelReportDataPack';

export type {
  // Virtual filesystem
  DataPack,
  VirtualFileSystem,
  VirtualFile,
  VirtualDirectory
} from './types/DataPack';

/**
 * Quick Start Guide for IntelReportPackage Architecture
 * 
 * ## Basic Usage
 * 
 * ```typescript
 * import { 
 *   IntelReportPackageManager, 
 *   IntelReport,
 *   CreatePackageOptions 
 * } from '@/intel-package-architecture';
 * 
 * // Create a package manager
 * const packageManager = new IntelReportPackageManager();
 * 
 * // Create a package from existing IntelReportData
 * const options: CreatePackageOptions = {
 *   sourceIntelReport: existingReport,
 *   encryption: { enabled: true, password: 'secure-key' },
 *   storage: { primary: 'ipfs', pin: true },
 *   marketplace: { list: true, price: 100, currency: 'CREDITS' }
 * };
 * 
 * const package = await packageManager.createPackage(existingReport, options);
 * ```
 * 
 * ## For IntelWeb Graph Visualization
 * 
 * ```typescript
 * // Load package and extract graph data
 * const graphData = await packageManager.getPackageForIntelWeb(packageId);
 * 
 * // Use with D3.js force-directed graph
 * const nodes = graphData.entities.map(entity => ({
 *   id: entity.id,
 *   name: entity.name,
 *   type: entity.type,
 *   group: entity.type
 * }));
 * 
 * const links = graphData.relationships.map(rel => ({
 *   source: rel.source,
 *   target: rel.target,
 *   type: rel.type
 * }));
 * ```
 * 
 * ## For NFT Marketplace
 * 
 * ```typescript
 * // Convert package to NFT metadata
 * const nftMetadata = await packageManager.toNFTMetadata(package);
 * 
 * // List packages for sale
 * const availablePackages = await packageManager.listPackagesForMarketplace({
 *   classification: 'CONFIDENTIAL',
 *   minConfidence: 0.8,
 *   priceRange: { min: 50, max: 200 }
 * });
 * ```
 * 
 * ## Migration from Existing Reports
 * 
 * ```typescript
 * import { IntelReport } from '@/intel-package-architecture';
 * 
 * // Validate existing report
 * const validation = IntelReport.validateForPackaging(existingReport);
 * if (validation.valid) {
 *   const package = await packageManager.createPackage(existingReport, options);
 * }
 * ```
 */

/**
 * Architecture Benefits
 * 
 * 1. **NFT Marketplace Efficiency**
 *    - Lightweight metadata on-chain (200 bytes vs 200KB+)
 *    - Heavy content off-chain (IPFS/Arweave)
 *    - Reduced gas costs by 95%
 * 
 * 2. **IntelWeb Graph Visualization**
 *    - Obsidian vault compatibility
 *    - Automatic entity/relationship extraction
 *    - D3.js force-directed graph ready
 * 
 * 3. **Static Deployment Friendly**
 *    - Browser-based ZIP handling
 *    - IndexedDB caching
 *    - No server-side filesystem required
 * 
 * 4. **Security & Access Control**
 *    - Package-level encryption
 *    - Digital signatures
 *    - Granular access controls
 * 
 * 5. **Future-Proof**
 *    - Post-quantum cryptography support
 *    - Version management
 *    - Backward compatibility
 */
