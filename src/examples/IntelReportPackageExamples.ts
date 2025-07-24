/**
 * IntelReportPackage Usage Examples
 * 
 * Demonstrates how to use the new IntelReportPackage architecture
 * for creating, storing, and using intelligence reports.
 */

import { IntelReportData, IntelReport } from '../models/IntelReportData';
import { IntelReportPackageManager } from '../services/IntelReportPackageManager';
import { CreatePackageOptions } from '../types/IntelReportPackage';

/**
 * Example: Create an IntelReportPackage from existing IntelReportData
 */
export async function createIntelPackageExample(): Promise<void> {
  // 1. Start with existing IntelReportData (your current format)
  const existingIntelReport: IntelReportData = {
    id: 'intel-001',
    title: 'Anomalous Network Activity in Sector 7G',
    content: `
# Intelligence Report: Network Anomaly Investigation

## Executive Summary
Detected unusual electromagnetic patterns in sector 7G suggesting artificial origin with periodic burst transmission every 47 minutes.

## Key Findings
- **Primary Entity**: [[Sector 7G Communication Hub]]
- **Related Organization**: [[Unknown Signal Source]]
- **Geographic Focus**: [[Northern Research Facility]]
- **Timeline**: 2025-07-23 to present

## Detailed Analysis
The signals exhibit characteristics consistent with #encrypted #communications using #advanced-crypto protocols. 

### Entity Analysis
- **[[Dr. Sarah Chen]]**: Lead researcher, last seen at facility
- **[[TechCorp Industries]]**: Facility operator, potential insider threat
- **[[Building 7G-North]]**: Primary signal origination point

### Relationships
- Dr. Sarah Chen → works at → TechCorp Industries
- TechCorp Industries → operates → Building 7G-North
- Building 7G-North → location of → Unknown Signal Source

## Recommendations
1. Conduct physical surveillance of Building 7G-North
2. Interview Dr. Sarah Chen regarding recent activities
3. Analyze TechCorp Industries security protocols

## Source Classification
- #SIGINT #ELECTROMAGNETIC #PATTERN_ANALYSIS
- Confidence: 85%
- Reliability: B (Usually reliable source)
    `,
    tags: ['SIGINT', 'ELECTROMAGNETIC', 'PATTERN_ANALYSIS', 'ENCRYPTION', 'SURVEILLANCE'],
    latitude: 40.7128,
    longitude: -74.0060,
    timestamp: Date.now(),
    author: 'agent-alpha-7',
    classification: 'CONFIDENTIAL',
    confidence: 85,
    priority: 'PRIORITY',
    categories: ['intelligence', 'network-security', 'investigation'],
    metaDescription: 'Investigation into anomalous electromagnetic signals detected in Sector 7G research facility'
  };

  // 2. Validate that the report is suitable for packaging
  const validation = IntelReport.validateForPackaging(existingIntelReport);
  if (!validation.valid) {
    console.error('Report validation failed:', validation.errors);
    return;
  }

  if (validation.warnings.length > 0) {
    console.warn('Validation warnings:', validation.warnings);
  }

  // 3. Preview what the package will contain
  const preview = IntelReport.generatePackagePreview(existingIntelReport);
  console.log('Package Preview:', {
    title: preview.title,
    summary: preview.summary,
    classification: preview.classification,
    estimatedSize: `${(preview.estimatedSize / 1024).toFixed(1)}KB`,
    entityCount: preview.entityCount
  });

  // 4. Extract Obsidian structure for graph visualization
  const obsidianStructure = IntelReport.extractObsidianStructure(existingIntelReport);
  console.log('Detected Entities:', obsidianStructure.entities);
  console.log('Detected Relationships:', obsidianStructure.relationships);

  // 5. Create the package with comprehensive options
  const packageManager = new IntelReportPackageManager();
  
  const createOptions: CreatePackageOptions = {
    // Source data
    sourceIntelReport: existingIntelReport,
    
    // Encryption settings (for sensitive intelligence)
    encryption: {
      enabled: true,
      password: 'secure-intel-access-2025',
      recipients: ['agent-alpha-7-wallet', 'intel-supervisor-wallet']
    },
    
    // Compression settings (for efficient storage)
    compression: {
      enabled: true,
      algorithm: 'gzip',
      level: 6
    },
    
    // Storage configuration
    storage: {
      primary: 'ipfs',
      mirrors: ['arweave'],
      pin: true
    },
    
    // Marketplace listing
    marketplace: {
      list: true,
      price: 150,
      currency: 'CREDITS',
      royalties: 5
    },
    
    // Access control
    accessControl: {
      publicRead: false,
      publicDownload: false,
      requiresWalletAuth: true,
      requiresSubscription: false,
      authorizedWallets: ['agent-alpha-7-wallet', 'intel-supervisor-wallet'],
      redistributionAllowed: false,
      commercialUseAllowed: false,
      clearanceLevel: 'CONFIDENTIAL'
    }
  };

  try {
    // 6. Create the complete IntelReportPackage
    const intelPackage = await packageManager.createPackage(existingIntelReport, createOptions);
    
    console.log('✅ IntelReportPackage created successfully!');
    console.log('Package ID:', intelPackage.packageId);
    console.log('Metadata Hash:', intelPackage.metadata.dataPackHash);
    console.log('Storage Location:', intelPackage.distribution.primaryLocation.address);
    
    // 7. Generate NFT metadata for marketplace
    const nftMetadata = await packageManager.toNFTMetadata(intelPackage);
    console.log('NFT Metadata:', JSON.stringify(nftMetadata, null, 2));
    
    return;
    
  } catch (error) {
    console.error('Failed to create package:', error);
  }
}

/**
 * Example: Load and use an IntelReportPackage
 */
export async function loadIntelPackageExample(): Promise<void> {
  const packageManager = new IntelReportPackageManager();
  
  try {
    // 1. Load the package with authentication
    const loadedPackage = await packageManager.loadPackage('pkg-example-123', {
      walletAddress: 'agent-alpha-7-wallet',
      password: 'secure-intel-access-2025',
      cacheEnabled: true,
      preloadContent: true,
      loadMetadataOnly: false,
      verifySignature: true,
      verifyIntegrity: true
    });
    
    console.log('✅ Package loaded successfully!');
    console.log('Title:', loadedPackage.metadata.title);
    console.log('Classification:', loadedPackage.metadata.classification);
    console.log('Entities:', loadedPackage.metadata.intelligence.entitiesCount);
    
    // 2. Extract graph data for IntelWeb visualization
    const graphData = await packageManager.getPackageForIntelWeb('pkg-example-123');
    
    console.log('Graph Data for IntelWeb:');
    console.log('- Entities:', graphData.entities.length);
    console.log('- Relationships:', graphData.relationships.length);
    console.log('- Metadata:', graphData.metadata.title);
    
    return;
    
  } catch (error) {
    console.error('Failed to load package:', error);
  }
}

/**
 * Example: Marketplace operations
 */
export async function marketplaceExample(): Promise<void> {
  const packageManager = new IntelReportPackageManager();
  
  try {
    // 1. List available packages in marketplace
    const availablePackages = await packageManager.listPackagesForMarketplace({
      classification: 'CONFIDENTIAL',
      intelType: 'SIGINT',
      minConfidence: 0.8,
      region: 'North America',
      priceRange: { min: 50, max: 200 }
    });
    
    console.log('Available Intelligence Packages:');
    availablePackages.forEach(pkg => {
      console.log(`- ${pkg.metadata.title}`);
      console.log(`  Price: ${pkg.marketplace.price?.amount} ${pkg.marketplace.price?.currency}`);
      console.log(`  Confidence: ${Math.round(pkg.metadata.intelligence.confidence * 100)}%`);
      console.log(`  Views: ${pkg.marketplace.views}, Favorites: ${pkg.marketplace.favorites}`);
      console.log('---');
    });
    
    return;
    
  } catch (error) {
    console.error('Failed to access marketplace:', error);
  }
}

/**
 * Example: Converting existing IntelReportData for new architecture
 */
export async function migrationExample(): Promise<void> {
  // Mock existing reports (what you currently have)
  const existingReports: IntelReportData[] = [
    {
      title: 'Cyber Threat Analysis - Banking Sector',
      content: 'Detailed analysis of recent APT activities targeting financial institutions...',
      tags: ['cyber', 'banking', 'apt', 'threat-intel'],
      latitude: 51.5074,
      longitude: -0.1278,
      timestamp: Date.now() - 86400000, // 1 day ago
      author: 'cyber-analyst-1',
      classification: 'SECRET',
      confidence: 92
    },
    {
      title: 'Geopolitical Intelligence Brief - Eastern Europe',
      content: 'Weekly intelligence summary covering political developments and security concerns...',
      tags: ['geopolitical', 'eastern-europe', 'security', 'politics'],
      latitude: 52.2297,
      longitude: 21.0122,
      timestamp: Date.now() - 172800000, // 2 days ago
      author: 'geoint-analyst-2',
      classification: 'CONFIDENTIAL',
      confidence: 78
    }
  ];

  const packageManager = new IntelReportPackageManager();
  const createdPackages: string[] = [];

  console.log('🔄 Starting migration of existing intel reports...');

  for (const report of existingReports) {
    try {
      // Validate compatibility
      if (!IntelReport.isPackageCompatible(report)) {
        console.warn(`⚠️ Skipping incompatible report: ${report.title}`);
        continue;
      }

      // Create package with default options
      const createOptions: CreatePackageOptions = {
        sourceIntelReport: report,
        encryption: { enabled: true },
        compression: { enabled: true, algorithm: 'gzip' },
        storage: { primary: 'ipfs', pin: true },
        marketplace: { list: false }, // Don't auto-list during migration
        accessControl: {
          publicRead: false,
          requiresWalletAuth: true,
          redistributionAllowed: false,
          commercialUseAllowed: false
        }
      };

      const intelPackage = await packageManager.createPackage(report, createOptions);
      createdPackages.push(intelPackage.packageId);

      console.log(`✅ Migrated: ${report.title} → Package ${intelPackage.packageId}`);

    } catch (error) {
      console.error(`❌ Failed to migrate: ${report.title}`, error);
    }
  }

  console.log(`\n🎉 Migration complete! Created ${createdPackages.length} packages:`);
  createdPackages.forEach(id => console.log(`  - ${id}`));
}

/**
 * Example: Integration with IntelWeb for graph visualization
 */
export async function intelWebIntegrationExample(): Promise<void> {
  const packageManager = new IntelReportPackageManager();
  
  try {
    // This is how IntelWeb would load and visualize a package
    const packageId = 'pkg-long-island-case-456';
    
    console.log('🌐 Loading package for IntelWeb graph visualization...');
    
    // 1. Get graph data optimized for D3.js visualization
    const graphData = await packageManager.getPackageForIntelWeb(packageId);
    
    // 2. Format for D3.js force-directed graph
    const d3GraphData = {
      nodes: graphData.entities.map(entity => ({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        confidence: entity.confidence,
        classification: entity.classification,
        verified: entity.verified,
        // Visual properties for D3.js
        group: entity.type,
        size: Math.max(10, entity.confidence * 20),
        color: getEntityColor(entity.type)
      })),
      
      links: graphData.relationships.map(rel => ({
        source: rel.source,
        target: rel.target,
        type: rel.type,
        strength: rel.strength,
        confidence: rel.confidence,
        // Visual properties for D3.js
        strokeWidth: Math.max(1, rel.strength * 5),
        strokeColor: getRelationshipColor(rel.type)
      }))
    };
    
    console.log('📊 Graph data prepared for IntelWeb:');
    console.log(`  - Nodes: ${d3GraphData.nodes.length}`);
    console.log(`  - Links: ${d3GraphData.links.length}`);
    console.log(`  - Classifications: ${[...new Set(d3GraphData.nodes.map(n => n.classification))].join(', ')}`);
    
    // 3. This would be passed to your D3.js visualization in IntelWeb
    return;
    
  } catch (error) {
    console.error('Failed to prepare graph data:', error);
  }
}

// Helper functions for visualization
function getEntityColor(type: string): string {
  const colors: Record<string, string> = {
    'person': '#4CAF50',      // Green
    'organization': '#2196F3', // Blue
    'location': '#FF9800',     // Orange
    'event': '#9C27B0',       // Purple
    'document': '#607D8B',    // Blue Grey
    'asset': '#F44336'        // Red
  };
  return colors[type] || '#757575';
}

function getRelationshipColor(type: string): string {
  const colors: Record<string, string> = {
    'works-for': '#4CAF50',
    'located-in': '#FF9800',
    'member-of': '#2196F3',
    'related': '#9E9E9E',
    'parent': '#795548',
    'child': '#CDDC39'
  };
  return colors[type] || '#BDBDBD';
}

// Export all examples
export const IntelPackageExamples = {
  createIntelPackageExample,
  loadIntelPackageExample,
  marketplaceExample,
  migrationExample,
  intelWebIntegrationExample
};
