# Intel Data Models and Marketplace Integration Specification

**Document Date**: July 10, 2025  
**Author**: GitHub Copilot  
**Status**: Draft  

## 1. Introduction

This document provides a comprehensive specification of the intelligence data models used throughout the Starcom application, with a particular focus on the integration between NetRunner's OSINT capabilities, the separate IntelAnalyzer application, and the Intelligence Exchange Marketplace. It serves as a detailed technical reference for the consolidation effort.

## 2. Application Boundaries

The intelligence processing flow involves three distinct applications:

1. **NetRunner**: Responsible for OSINT data collection
2. **IntelAnalyzer**: Separate application responsible for intelligence analysis and report generation
3. **MarketExchange**: Marketplace for trading intelligence reports

Each application has its own responsibilities and models, with defined integration points between them.

### 2.2 Intel Report Model

The `IntelReport` class in `/src/models/IntelReport.ts` serves as the basic intelligence report structure:

```typescript
export class IntelReport {
    constructor(
        public lat: number,
        public long: number,
        public title: string,
        public subtitle: string,
        public date: string,
        public author: string,
        public content: string,
        public tags: string[],
        public categories: string[],
        public metaDescription: string
    ) {}
}
```

### 2.3 Intel Report Data Model

The `IntelReportData` interface in `/src/models/IntelReportData.ts` provides a more comprehensive model that includes blockchain integration:

```typescript
export interface IntelReportData {
  // Unique identifier (account public key or generated ID)
  id?: string;
  
  // Blockchain fields (required for on-chain storage)
  title: string;
  content: string;
  tags: string[];
  latitude: number;
  longitude: number;
  timestamp: number;
  author: string; // Wallet address (base58)
  
  // Blockchain metadata (available after submission)
  pubkey?: string; // Solana account public key (base58)
  signature?: string; // Transaction signature
  
  // UI-specific fields (optional, used for display)
  subtitle?: string;
  date?: string; // ISO date string for display
  categories?: string[];
  metaDescription?: string;
  
  // Legacy compatibility fields (deprecated, use latitude/longitude)
  /** @deprecated Use latitude instead */
  lat?: number;
  /** @deprecated Use longitude instead */
  long?: number;
}
```

### 2.4 Blockchain-Specific Model

For blockchain storage, a specialized model is used:

```typescript
export interface BlockchainIntelReport {
  title: string;
  content: string;
  tags: string[];
  latitude: number;
  longitude: number;
  timestamp: number; // Unix timestamp as BN
  author: string; // PublicKey as base58 string
}
```

### 2.5 Intelligence Marketplace Models

The marketplace uses additional models for listing and trading intelligence:

```typescript
// Intelligence Marketplace Interface
interface IntelListing {
  id: string;
  title: string;
  description: string;
  category: 'osint' | 'sigint' | 'humint' | 'geoint' | 'finint';
  price: number;
  currency: 'USD' | 'BTC' | 'ETH' | 'CREDITS';
  seller: {
    id: string;
    name: string;
    rating: number;
    verified: boolean;
  };
  tags: string[];
  createdAt: string;
  expiresAt?: string;
  downloads: number;
  rating: number;
  reviews: number;
}
```

### 2.6 NetRunner Intel Analysis Models

The NetRunner Intel Analyzer uses specialized models for intelligence processing:

```typescript
// Intel processing stages
export type ProcessingStage = 
  | 'collection'      // Initial data collection
  | 'processing'      // Data processing
  | 'analysis'        // Data analysis
  | 'verification'    // Verification
  | 'reporting'       // Report generation
  | 'packaging'       // Packaging for exchange
  | 'published';      // Available on the marketplace

// Intel workflow
export interface IntelWorkflow {
  id: string;
  name: string;
  description: string;
  intelTypes: IntelType[];
  stages: WorkflowStage[];
  currentStage: number;
  intelId?: string;         // Associated Intel Report ID if available
  status: 'active' | 'completed' | 'failed' | 'paused';
  progress: number;         // 0-100 percentage
  created: string;          // ISO date string
  updated: string;          // ISO date string
  dueDate?: string;         // ISO date string
  assignedTo?: string;      // User ID
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  tags: string[];
}
```

## 3. Data Flow: Cross-Application Intelligence Pipeline

### 3.1 Complete Data Flow

The intelligence data flows through the system as follows:

1. **OSINT Collection** (NetRunner Application):
   - NetRunner tools collect raw intelligence data
   - Data is validated for basic structure
   - Raw data is logged and tracked with correlation IDs
   - Data is prepared for transfer to IntelAnalyzer

2. **Application Boundary Crossing**:
   - IntelAnalyzerAdapter formats data for transfer
   - API calls transfer data to IntelAnalyzer application
   - Transfer status and errors are logged

3. **Intelligence Processing** (IntelAnalyzer Application):
   - IntelAnalyzer receives raw data from NetRunner
   - Entities and relationships are extracted
   - Confidence scores are assigned
   - Processed data is validated

4. **Intel Report Creation** (IntelAnalyzer Application):
   - Processed intelligence is converted to IntelReportData
   - Report is validated using IntelReportValidationService
   - Required fields are checked
   - Geolocation data is validated

5. **Blockchain Anchoring** (IntelAnalyzer → Marketplace):
   - Intel Report is prepared for blockchain storage
   - BlockchainAnchorService handles the transaction
   - Blockchain metadata is added to the report
   - Transaction is monitored for confirmation

6. **Marketplace Listing** (MarketExchange Application):
   - Intel Report is packaged as a marketplace listing
   - Pricing and metadata are added
   - Listing is published to the marketplace
   - Listing is indexed for search

### 3.2 Data Transformation

The data transformation process involves multiple steps:

```typescript
// 1. Raw OSINT Data (from NetRunner tools)
const rawData = {
  query: "example.com",
  results: [
    { ip: "93.184.216.34", ports: [80, 443], hostnames: ["example.com"] }
  ]
};

// 2. Processed Intelligence (from IntelAnalyzer)
const processedData = {
  entities: [
    {
      id: "ent-1",
      type: "domain",
      name: "example.com",
      properties: { ip: "93.184.216.34", ports: [80, 443] },
      confidence: 0.95,
      sources: ["shodan"]
    }
  ],
  relationships: []
};

// 3. Intel Report (for storage and UI)
const intelReport: IntelReportData = {
  title: "Domain Analysis: example.com",
  content: "Detailed analysis of example.com infrastructure...",
  tags: ["domain", "web", "infrastructure"],
  latitude: 37.7749,
  longitude: -122.4194,
  timestamp: Date.now(),
  author: "wallet-address-123",
  subtitle: "Web infrastructure intelligence",
  date: new Date().toISOString(),
  categories: ["infrastructure", "network"],
  metaDescription: "Analysis of example.com web infrastructure and security posture"
};

// 4. Blockchain Report (for on-chain storage)
const blockchainReport: BlockchainIntelReport = {
  title: intelReport.title,
  content: intelReport.content,
  tags: intelReport.tags,
  latitude: intelReport.latitude,
  longitude: intelReport.longitude,
  timestamp: intelReport.timestamp,
  author: intelReport.author
};

// 5. Marketplace Listing (for trading)
const marketplaceListing: IntelListing = {
  id: "listing-123",
  title: intelReport.title,
  description: intelReport.metaDescription || "",
  category: "osint",
  price: 100,
  currency: "CREDITS",
  seller: {
    id: "user-123",
    name: "CyberIntel",
    rating: 4.8,
    verified: true
  },
  tags: intelReport.tags,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  downloads: 0,
  rating: 0,
  reviews: 0
};
```

## 4. Validation Framework

### 4.1 Intel Report Validation

The `IntelReportValidationService` provides comprehensive validation for Intel Reports:

```typescript
export class IntelReportValidationService {
  private validators: ValidatorMap;
  private requiredFields: (keyof IntelReportData)[];
  
  constructor() {
    this.requiredFields = [
      'title',
      'content',
      'tags',
      'latitude',
      'longitude',
      'timestamp',
      'author'
    ];
    
    this.validators = {
      title: [
        {
          validate: (value) => !!value && value.trim().length > 0,
          errorCode: IntelReportErrorCode.TITLE_REQUIRED,
          errorType: IntelReportErrorType.VALIDATION_ERROR,
          severity: IntelReportErrorSeverity.HIGH,
          message: 'Title is required'
        },
        {
          validate: (value) => !value || value.trim().length <= 100,
          errorCode: IntelReportErrorCode.TITLE_TOO_LONG,
          errorType: IntelReportErrorType.VALIDATION_ERROR,
          severity: IntelReportErrorSeverity.MEDIUM,
          message: 'Title must be 100 characters or less'
        }
      ],
      // Additional validators...
    };
  }
  
  public validateCreate(data: Partial<IntelReportData>): IntelReportValidationResult {
    // Implementation details...
  }
  
  public validateUpdate(data: Partial<IntelReportData>): IntelReportValidationResult {
    // Implementation details...
  }
  
  public validateForBlockchain(data: IntelReportData): IntelReportValidationResult {
    // Implementation details...
  }
  
  public validateForMarketplace(data: IntelReportData): IntelReportValidationResult {
    // Implementation details...
  }
}
```

### 4.2 Error Types

The system uses a comprehensive error handling framework:

```typescript
export type IntelReportErrorType = 
  | 'VALIDATION_ERROR'     // Data validation failures
  | 'NETWORK_ERROR'        // Network/API failures  
  | 'AUTHENTICATION_ERROR' // Auth/permission issues
  | 'STORAGE_ERROR'        // Local/remote storage issues
  | 'BLOCKCHAIN_ERROR'     // Web3/Solana transaction issues
  | 'SYNC_ERROR'          // Offline/online sync issues
  | 'RENDERING_ERROR'      // UI/3D rendering issues
  | 'PERFORMANCE_ERROR'    // Performance/timeout issues
  | 'UNKNOWN_ERROR';       // Uncategorized errors

export type IntelReportErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export const INTEL_REPORT_ERROR_CODES = {
  // Validation Errors (REP-V-001 to REP-V-099)
  VALIDATION_TITLE_REQUIRED: 'REP-V-001',
  VALIDATION_TITLE_TOO_LONG: 'REP-V-002',
  // Additional error codes...
};
```

## 5. Intelligence Exchange Marketplace

### 5.1 Marketplace Architecture

The Intelligence Exchange Marketplace (IEM) is a decentralized Web3 platform that enables secure, blockchain-based trading of intelligence reports as NFTs. Key components include:

1. **Frontend**: React + TypeScript interface for browsing, buying, and selling intelligence
2. **Web3 Integration**: Solana Wallet Adapter + Web3.js for blockchain integration
3. **Cryptography**: Post-quantum cryptography for enhanced security
4. **Blockchain**: Solana blockchain for smart contracts, NFTs, and tokens
5. **Storage**: Decentralized storage for intelligence data (IPFS + Arweave)

### 5.2 Intelligence Asset Types

The marketplace supports various types of intelligence assets:

```typescript
enum IntelAssetType {
  SIGINT = "signals_intelligence",
  HUMINT = "human_intelligence", 
  OSINT = "open_source_intelligence",
  CYBERINT = "cyber_intelligence",
  GEOINT = "geospatial_intelligence",
  FININT = "financial_intelligence"
}

interface IntelligenceAsset {
  id: string;
  type: IntelAssetType;
  classification: SecurityClassification;
  geolocation: {lat: number, lng: number};
  timestamp: number;
  author: PublicKey;
  content: EncryptedData;
  metadata: AssetMetadata;
  nftMint: PublicKey;
  price: number; // SOL
  royalties: RoyaltyInfo;
}
```

### 5.3 NetRunner Integration

The NetRunner integration with the marketplace involves several components:

1. **IntelAnalyzerIntegration**: Prepares intelligence reports for the marketplace
2. **BlockchainAnchorService**: Handles on-chain storage and NFT creation
3. **MarketExchangeApplication**: UI for marketplace interaction
4. **MarketDataProvider**: Data service for marketplace operations

## 6. Current Implementation Status

### 6.1 Implemented Components

1. **Intel Models**: `IntelReport`, `IntelReportData`, and related models
2. **Validation Service**: `IntelReportValidationService`
3. **Error Types**: Comprehensive error type definitions
4. **UI Components**: Basic marketplace UI in `MarketExchangeApplication`

### 6.2 Partial Implementations

1. **IntelAnalyzerIntegration**: Currently uses mock data
2. **BlockchainAnchorService**: Placeholder implementation
3. **MarketDataProvider**: Basic implementation without real blockchain integration

### 6.3 Missing Components

1. **Real Blockchain Integration**: Actual Solana program integration
2. **NFT Creation**: Creation of intelligence report NFTs
3. **Marketplace Operations**: Buying, selling, and trading intelligence
4. **Search and Discovery**: Advanced search for intelligence assets

## 7. Integration Recommendations

### 7.1 Model Standardization

1. **Consolidate Models**: Use `IntelReportData` as the canonical model
2. **Update References**: Update all references to use the canonical model
3. **Remove Duplicates**: Remove duplicate model files
4. **Add Documentation**: Add comprehensive JSDoc documentation

### 7.2 Workflow Implementation

1. **Complete IntelAnalyzerIntegration**: Implement real data processing
2. **Enhance Validation**: Implement comprehensive validation at each stage
3. **Add Error Handling**: Implement proper error handling throughout
4. **Implement Logging**: Add detailed logging for the entire process

### 7.3 Marketplace Integration

1. **Complete BlockchainAnchorService**: Implement real Solana integration
2. **Implement NFT Creation**: Add NFT creation for intelligence reports
3. **Enhance UI**: Complete the marketplace UI implementation
4. **Add Search**: Implement advanced search for intelligence assets

## 8. Conclusion

The intelligence data models and marketplace integration form a sophisticated system for intelligence collection, analysis, and trading. By implementing the recommendations in this document, we can create a robust, integrated system that provides significant value to users.

The current implementation has a solid foundation, but requires completion of several key components to realize its full potential. The consolidation effort should focus on standardizing models, completing real implementations, and ensuring proper integration between all components.

---

## Appendices

### Appendix A: Complete Model Schemas

Detailed schemas for all intelligence-related data models.

### Appendix B: API Specifications

Detailed specifications for all APIs used in the marketplace integration.

### Appendix C: Blockchain Integration Details

Technical details of the Solana blockchain integration.
