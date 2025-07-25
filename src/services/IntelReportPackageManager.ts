/**
 * IntelReportPackageManager - Main service for managing IntelReportPackages
 * 
 * Handles:
 * - Package creation from existing IntelReportData
 * - Package loading and validation
 * - NFT marketplace integration
 * - Encryption/decryption
 * - IPFS storage
 */

import { 
  IntelReportPackage, 
  IntelReport, 
  CreatePackageOptions,
  LoadPackageOptions,
  PackageValidationResult,
  StorageLocation,
  MarketplaceMetadata
} from '../types/IntelReportPackage';
import { IntelReportDataPack } from '../types/IntelReportDataPack';
import { DataPack } from '../types/DataPack';
import { IntelReportData } from '../models/IntelReportData';
import { VirtualFileSystemManager } from './VirtualFileSystemManager';

/**
 * Main service for managing Intelligence Report Packages
 * 
 * This service orchestrates the creation, storage, and retrieval of
 * IntelReportPackages for use in both the marketplace and IntelWeb.
 */
export class IntelReportPackageManager {
  private vfsManager: VirtualFileSystemManager;
  private packages: Map<string, IntelReportPackage> = new Map();
  
  constructor() {
    this.vfsManager = new VirtualFileSystemManager();
  }
  
  /**
   * Create an IntelReportPackage from existing IntelReportData
   */
  async createPackage(
    sourceIntelReport: IntelReportData,
    options: CreatePackageOptions
  ): Promise<IntelReportPackage> {
    try {
      // 1. Create lightweight metadata (IntelReport) for blockchain/NFT
      const metadata = await this.createIntelReportMetadata(sourceIntelReport);
      
      // 2. Create IntelReportDataPack with Obsidian vault structure
      const dataPack = await this.createIntelReportDataPack(sourceIntelReport, options);
      
      // 3. Generate security signatures
      const signature = await this.generatePackageSignature(metadata, dataPack);
      
      // 4. Apply encryption if requested
      const encryption = options.encryption?.enabled 
        ? await this.generateEncryptionConfig(options.encryption)
        : undefined;
      
      // 5. Configure access control
      const accessControl = this.createAccessControl(options.accessControl);
      
      // 6. Setup distribution metadata
      const distribution = await this.setupDistribution(dataPack, options.storage);
      
      // 7. Create marketplace metadata if listing requested
      const marketplace = options.marketplace?.list 
        ? await this.createMarketplaceMetadata(options.marketplace)
        : undefined;
      
      // 8. Assemble the complete package
      const intelPackage: IntelReportPackage = {
        packageId: this.generatePackageId(),
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata,
        dataPack,
        signature,
        encryption,
        accessControl,
        distribution,
        marketplace
      };
      
      // 9. Store in local cache
      this.packages.set(intelPackage.packageId, intelPackage);
      
      // 10. Upload to IPFS/distributed storage
      if (options.storage.primary === 'ipfs') {
        await this.uploadToIPFS(intelPackage);
      }
      
      return intelPackage;
      
    } catch (error) {
      throw new Error(`Failed to create IntelReportPackage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Load an IntelReportPackage from storage
   */
  async loadPackage(
    packageId: string,
    options: LoadPackageOptions
  ): Promise<IntelReportPackage> {
    try {
      // Check local cache first
      let intelPackage = this.packages.get(packageId);
      
      if (!intelPackage) {
        // Load from distributed storage
        const loadedPackage = await this.loadFromStorage(packageId);
        if (!loadedPackage) {
          throw new Error(`Package not found: ${packageId}`);
        }
        intelPackage = loadedPackage;
      }
      
      // Validate the package
      const validation = await this.validatePackage(intelPackage, options);
      if (!validation.valid) {
        throw new Error(`Package validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }
      
      // Decrypt if necessary and authorized
      if (intelPackage.encryption && options.password) {
        await this.decryptPackage(intelPackage, options.password);
      }
      
      // Load virtual filesystem if requested
      if (!options.loadMetadataOnly) {
        const vfsResult = await this.vfsManager.loadDataPack(intelPackage.dataPack, options.password);
        if (!vfsResult.success) {
          throw new Error(`Failed to load virtual filesystem: ${vfsResult.errors?.join(', ')}`);
        }
      }
      
      return intelPackage;
      
    } catch (error) {
      throw new Error(`Failed to load IntelReportPackage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Convert IntelReportPackage to NFT metadata format
   */
  async toNFTMetadata(intelPackage: IntelReportPackage): Promise<Record<string, unknown>> {
    const metadata = intelPackage.metadata;
    
    return {
      name: metadata.title,
      description: metadata.summary,
      image: `https://starcom.app/api/intel-preview/${intelPackage.packageId}`,
      external_url: `https://starcom.app/intel/${intelPackage.packageId}`,
      
      attributes: [
        { trait_type: 'Classification', value: metadata.classification },
        { trait_type: 'Intelligence Type', value: metadata.intelligence.type },
        { trait_type: 'Priority', value: metadata.priority },
        { trait_type: 'Confidence', value: Math.round(metadata.intelligence.confidence * 100) },
        { trait_type: 'Entities Count', value: metadata.intelligence.entitiesCount },
        { trait_type: 'Relationships Count', value: metadata.intelligence.relationshipsCount },
        { trait_type: 'Region', value: metadata.location.region || 'Global' },
        { trait_type: 'Data Pack Size', value: `${Math.round(metadata.dataPackSize / 1024)}KB` },
        { trait_type: 'Package Version', value: intelPackage.version }
      ],
      
      properties: {
        category: 'Intelligence',
        subcategory: metadata.intelligence.type,
        
        // Package references
        packageId: intelPackage.packageId,
        dataPackHash: metadata.dataPackHash,
        dataPackLocation: metadata.dataPackLocation,
        
        // Access control
        encrypted: !!intelPackage.encryption,
        requiresAuth: intelPackage.accessControl.requiresWalletAuth,
        
        // Distribution
        primaryStorage: intelPackage.distribution.primaryLocation.type,
        availability: intelPackage.distribution.availabilityTarget,
        
        // Blockchain compatibility
        chainId: 'solana-mainnet',
        tokenStandard: 'SPL',
        
        // Legacy compatibility
        legacyIntelReportId: metadata.legacyId
      }
    };
  }
  
  /**
   * Get package for IntelWeb graph visualization
   */
  async getPackageForIntelWeb(packageId: string): Promise<{
    entities: any[];
    relationships: any[];
    metadata: IntelReport;
  }> {
    const intelPackage = await this.loadPackage(packageId, {
      cacheEnabled: true,
      preloadContent: true,
      loadMetadataOnly: false,
      verifySignature: true,
      verifyIntegrity: true
    });
    
    // Extract Obsidian graph structure
    const vfsResult = await this.vfsManager.loadDataPack(intelPackage.dataPack);
    if (!vfsResult.success || !vfsResult.virtualFileSystem) {
      throw new Error('Failed to load virtual filesystem for graph visualization');
    }
    
    const graph = await this.vfsManager.extractObsidianGraph(vfsResult.virtualFileSystem);
    
    return {
      entities: graph.entities,
      relationships: graph.relationships,
      metadata: intelPackage.metadata
    };
  }
  
  /**
   * List packages for marketplace
   */
  async listPackagesForMarketplace(filters?: {
    classification?: string;
    intelType?: string;
    minConfidence?: number;
    region?: string;
    priceRange?: { min: number; max: number };
  }): Promise<Array<{
    packageId: string;
    metadata: IntelReport;
    marketplace: MarketplaceMetadata;
    preview: string;
  }>> {
    const results: Array<{
      packageId: string;
      metadata: IntelReport;
      marketplace: MarketplaceMetadata;
      preview: string;
    }> = [];
    
    for (const [packageId, intelPackage] of this.packages) {
      // Apply filters
      if (filters) {
        if (filters.classification && intelPackage.metadata.classification !== filters.classification) continue;
        if (filters.intelType && intelPackage.metadata.intelligence.type !== filters.intelType) continue;
        if (filters.minConfidence && intelPackage.metadata.intelligence.confidence < filters.minConfidence) continue;
        if (filters.region && intelPackage.metadata.location.region !== filters.region) continue;
        
        if (filters.priceRange && intelPackage.marketplace?.price) {
          const price = intelPackage.marketplace.price.amount;
          if (price < filters.priceRange.min || price > filters.priceRange.max) continue;
        }
      }
      
      // Only include listed packages
      if (intelPackage.marketplace?.listed) {
        results.push({
          packageId,
          metadata: intelPackage.metadata,
          marketplace: intelPackage.marketplace,
          preview: intelPackage.metadata.summary
        });
      }
    }
    
    // Sort by popularity/price/date
    return results.sort((a, b) => {
      const aScore = a.marketplace.views + a.marketplace.favorites;
      const bScore = b.marketplace.views + b.marketplace.favorites;
      return bScore - aScore;
    });
  }
  
  // Private helper methods
  
  private async createIntelReportMetadata(sourceReport: IntelReportData): Promise<IntelReport> {
    return {
      id: sourceReport.id || this.generateReportId(),
      title: sourceReport.title,
      summary: sourceReport.content.substring(0, 500) + (sourceReport.content.length > 500 ? '...' : ''),
      classification: (sourceReport.classification as 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET') || 'UNCLASSIFIED',
      priority: (sourceReport.priority as 'ROUTINE' | 'PRIORITY' | 'IMMEDIATE' | 'FLASH') || 'ROUTINE',
      author: sourceReport.author,
      timestamp: sourceReport.timestamp,
      location: {
        lat: sourceReport.latitude,
        lng: sourceReport.longitude,
        region: this.getRegionFromCoordinates(sourceReport.latitude, sourceReport.longitude)
      },
      intelligence: {
        type: (sourceReport.sources?.[0] as 'OSINT' | 'SIGINT' | 'HUMINT' | 'GEOINT' | 'FININT' | 'TECHINT') || 'OSINT',
        confidence: (sourceReport.confidence || 80) / 100,
        entitiesCount: 0, // Will be calculated from DataPack
        relationshipsCount: 0, // Will be calculated from DataPack
        keyTags: sourceReport.tags.slice(0, 5)
      },
      dataPackHash: '', // Will be set after DataPack creation
      dataPackSize: 0, // Will be set after DataPack creation
      dataPackLocation: '', // Will be set after storage
      legacyId: sourceReport.id
    };
  }
  
  private async createIntelReportDataPack(
    sourceReport: IntelReportData, 
    options: CreatePackageOptions
  ): Promise<IntelReportDataPack> {
    // Create base DataPack structure
    const baseDataPack: DataPack = {
      id: this.generateDataPackId(),
      name: `Intel Data Pack: ${sourceReport.title}`,
      version: '1.0.0',
      format: 'zip',
      manifest: {
        totalFiles: 1,
        totalSize: sourceReport.content.length,
        directories: ['People/', 'Organizations/', 'Regions/', 'Events/'],
        files: [{
          path: '/report.md',
          name: 'report.md',
          extension: '.md',
          size: sourceReport.content.length,
          mimeType: 'text/markdown',
          encoding: 'utf-8',
          hash: await this.generateHash(sourceReport.content),
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        }]
      },
      content: sourceReport.content,
      manifestHash: '',
      contentHash: await this.generateHash(sourceReport.content),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: sourceReport.author,
      description: `Intelligence data pack for: ${sourceReport.title}`,
      tags: sourceReport.tags
    };
    
    // Create IntelReportDataPack with intelligence-specific metadata
    const intelDataPack: IntelReportDataPack = {
      ...baseDataPack,
      intelligence: {
        classification: (sourceReport.classification as 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET') || 'UNCLASSIFIED',
        sources: [{
          id: 'source-1',
          name: 'Original Intel Report',
          type: 'OSINT',
          reliability: 'B',
          accessDate: new Date().toISOString(),
          description: 'Converted from legacy IntelReportData'
        }],
        confidence: (sourceReport.confidence || 80) / 100,
        reliability: 'B',
        analysisType: 'OSINT',
        priority: (sourceReport.priority as 'ROUTINE' | 'PRIORITY' | 'IMMEDIATE' | 'FLASH') || 'ROUTINE',
        geographicScope: {
          regions: [this.getRegionFromCoordinates(sourceReport.latitude, sourceReport.longitude)],
          coordinates: {
            centerLat: sourceReport.latitude,
            centerLng: sourceReport.longitude,
            radiusKm: 50
          }
        },
        temporalScope: {
          collectionStart: new Date(sourceReport.timestamp).toISOString(),
          collectionEnd: new Date().toISOString()
        },
        entitiesCount: 0,
        relationshipsCount: 0,
        keyFindings: [],
        recommendations: []
      },
      obsidianVault: {
        folders: {
          'People/': {
            path: 'People/',
            files: [],
            subfolders: [],
            tags: ['person', 'entity'],
            entityType: 'person'
          },
          'Organizations/': {
            path: 'Organizations/',
            files: [],
            subfolders: [],
            tags: ['organization', 'entity'],
            entityType: 'organization'
          },
          'Regions/': {
            path: 'Regions/',
            files: [],
            subfolders: [],
            tags: ['location', 'region'],
            entityType: 'location'
          }
        },
        config: {
          plugins: [],
          themes: ['starcom-intel'],
          hotkeys: {},
          graph: {
            showTags: true,
            showAttachments: false,
            showExistingOnly: true,
            showOrphans: false,
            centerStrength: 0.5,
            repelStrength: 0.8,
            linkStrength: 0.6,
            linkDistance: 100,
            search: '',
            tags: [],
            colorGroups: [{
              query: 'tag:#person',
              color: '#4CAF50',
              name: 'People'
            }, {
              query: 'tag:#organization',
              color: '#2196F3',
              name: 'Organizations'
            }, {
              query: 'tag:#location',
              color: '#FF9800',
              name: 'Locations'
            }],
            showClassification: true,
            filterByConfidence: true,
            minConfidence: 0.5,
            showSources: true
          }
        },
        workspace: {
          leftSidebar: true,
          rightSidebar: true,
          activeView: 'graph',
          pinnedFiles: []
        }
      },
      legacyIntelReport: sourceReport
    };
    
    return intelDataPack;
  }
  
  private async generatePackageSignature(metadata: IntelReport, dataPack: IntelReportDataPack): Promise<any> {
    // TODO: Implement digital signature generation
    return {
      algorithm: 'ed25519',
      signature: 'placeholder-signature',
      publicKey: 'placeholder-public-key',
      signedAt: new Date().toISOString(),
      signedBy: metadata.author,
      contentHash: await this.generateHash(JSON.stringify({ metadata, dataPack }))
    };
  }
  
  private async generateEncryptionConfig(options: any): Promise<any> {
    // TODO: Implement encryption configuration
    return {
      algorithm: 'aes-256-gcm',
      keyDerivation: {
        algorithm: 'pbkdf2',
        salt: 'placeholder-salt',
        iterations: 10000
      },
      iv: 'placeholder-iv',
      encryptedAt: new Date().toISOString()
    };
  }
  
  private createAccessControl(options?: any): any {
    return {
      publicRead: options?.publicRead || false,
      publicDownload: options?.publicDownload || false,
      requiresWalletAuth: options?.requiresWalletAuth || true,
      requiresSubscription: options?.requiresSubscription || false,
      redistributionAllowed: options?.redistributionAllowed || false,
      commercialUseAllowed: options?.commercialUseAllowed || false
    };
  }
  
  private async setupDistribution(dataPack: IntelReportDataPack, storageOptions: any): Promise<any> {
    const primaryLocation: StorageLocation = {
      type: storageOptions.primary,
      address: 'placeholder-address',
      encryption: true,
      pinned: storageOptions.pin
    };
    
    return {
      primaryLocation,
      mirrors: [],
      cdnEnabled: false,
      cacheControl: {
        maxAge: 3600,
        public: false,
        immutable: true
      },
      replicationFactor: 3,
      availabilityTarget: 0.99,
      compressionEnabled: true,
      downloadCount: 0,
      popularityScore: 0.0
    };
  }
  
  private async createMarketplaceMetadata(options: any): Promise<MarketplaceMetadata> {
    return {
      listed: true,
      price: {
        amount: options.price || 100,
        currency: options.currency || 'CREDITS',
        priceHistory: []
      },
      tokenStandard: 'SPL',
      royalties: {
        percentage: options.royalties || 5,
        recipient: 'placeholder-wallet'
      },
      totalSales: 0,
      uniqueOwners: 1,
      views: 0,
      favorites: 0,
      shares: 0,
      verified: false
    };
  }
  
  private async validatePackage(intelPackage: IntelReportPackage, options: LoadPackageOptions): Promise<PackageValidationResult> {
    // TODO: Implement comprehensive package validation
    return {
      valid: true,
      errors: [],
      warnings: [],
      metadataValid: true,
      dataPackValid: true,
      signatureValid: true,
      integrityValid: true,
      accessAllowed: true,
      validationTime: 50,
      securityScore: 0.95,
      riskFactors: []
    };
  }
  
  private async decryptPackage(intelPackage: IntelReportPackage, password: string): Promise<void> {
    // TODO: Implement package decryption
  }
  
  private async loadFromStorage(packageId: string): Promise<IntelReportPackage | null> {
    // TODO: Implement loading from IPFS/distributed storage
    return null;
  }
  
  private async uploadToIPFS(intelPackage: IntelReportPackage): Promise<string> {
    // TODO: Implement IPFS upload
    return 'placeholder-ipfs-hash';
  }
  
  private getRegionFromCoordinates(lat: number, lng: number): string {
    // Simple region mapping - would use a proper geocoding service in production
    if (lat > 45 && lng > -30 && lng < 40) return 'Europe';
    if (lat > 25 && lat < 49 && lng > -125 && lng < -66) return 'North America';
    if (lat > -35 && lat < 35 && lng > -20 && lng < 55) return 'Africa';
    if (lat > -50 && lat < 70 && lng > 30 && lng < 180) return 'Asia';
    if (lat > -50 && lat < 10 && lng > 110 && lng < 180) return 'Oceania';
    if (lat > -60 && lat < 15 && lng > -85 && lng < -30) return 'South America';
    return 'Global';
  }
  
  private generatePackageId(): string {
    return 'pkg_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  private generateReportId(): string {
    return 'rpt_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  private generateDataPackId(): string {
    return 'dp_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  private async generateHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
