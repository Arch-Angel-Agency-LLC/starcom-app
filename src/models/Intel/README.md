# Intelligence Domain Models

This directory contains the complete intelligence domain model implementation following industry best practices and the 6 recommended improvements for the Starcom platform.

## Domain Hierarchy

```
Intel (Raw Data) → Intelligence (Processed) → Reports (Structured Documents)
```

### Key Concepts

1. **Intel** - Raw, unprocessed intelligence data points from various sources
2. **Intelligence** - Processed, analyzed, and contextualized information derived from intel
3. **Intelligence Reports** - Structured documents containing intelligence with analysis and recommendations
4. **Assessments** - Specialized intelligence products (threat assessments, risk analysis)
5. **Requirements** - Collection tasking and intelligence needs
6. **Classifications** - Security classifications and handling instructions

## File Structure

```
src/models/Intel/
├── README.md                    # This documentation
├── Intel.ts                     # Raw intel data types (Improvement #1)
├── Intelligence.ts              # Processed intelligence types (Improvement #1)
├── IntelligenceReport.ts        # Enhanced report structures (Improvement #3)
├── Classification.ts            # Security classification types (Improvement #4)
├── Sources.ts                   # Intel source types (Improvement #1)
├── Requirements.ts              # Collection requirements
├── Assessments.ts               # Threat and risk assessments
├── Transformers.ts              # Data transformation utilities (Improvement #3)
├── Validators.ts                # Validation logic (Improvement #5)
├── Enhancements.md              # Documentation of all 6 improvements (Improvement #6)
└── index.ts                     # Barrel exports
```

## Usage Examples

### Raw Intel Collection
```typescript
import { Intel, IntelSource } from './Intel';

const rawIntel: Intel = {
  id: 'intel_001',
  source: 'OSINT',
  classification: 'UNCLASS',
  reliability: 'B',
  timestamp: Date.now(),
  collectedBy: 'sensor_alpha',
  data: { /* raw data payload */ },
  tags: ['surveillance', 'network'],
  latitude: 40.7128,
  longitude: -74.0060
};
```

### Intelligence Analysis
```typescript
import { Intelligence } from './Intelligence';

const processedIntel: Intelligence = {
  ...rawIntel,
  analysis: 'Network traffic indicates potential breach attempt',
  confidence: 85,
  significance: 'HIGH',
  processedBy: 'analyst_beta',
  processedAt: Date.now(),
  threats: [{ type: 'cyber', likelihood: 75, impact: 'HIGH' }]
};
```

### Intelligence Reports
```typescript
import { IntelligenceReportData } from './IntelligenceReport';

const report: IntelligenceReportData = {
  title: 'Network Security Assessment',
  content: 'Analysis of recent network activity...',
  intelligence: [processedIntel],
  classification: 'CONFIDENTIAL',
  author: 'analyst_gamma',
  // ... additional fields
};
```

## Intel → Report Transformation

### IntelFusion.ts - The Missing Piece

The `IntelFusionService` addresses the critical gap between raw Intel data and structured Intelligence Reports. This service implements sophisticated fusion logic that transforms multiple raw intel records into comprehensive intelligence products.

```typescript
import { IntelFusionService } from './IntelFusion';

// Transform multiple Intel records into comprehensive report
const report = IntelFusionService.fuseIntelIntoReport(
  [intel1, intel2, intel3], // Raw intel records
  {
    analystId: "analyst_001",
    reportTitle: "Regional Threat Assessment", 
    keyQuestions: ["What is the threat level?", "Are there patterns?"],
    timeframe: { start: startDate, end: endDate }
  }
);
```

**Key Transformation Features:**

1. **Multi-Source Intel Fusion**
   - Aggregates intel from multiple collection disciplines
   - Preserves source attribution and custody chains
   - Calculates composite reliability scores

2. **Reliability Aggregation**
   - Converts NATO reliability scale (A-F) to numeric scores (0-100)
   - Weights analysis based on source reliability
   - Accounts for source diversity bonus

3. **Classification Determination**
   - Automatically determines highest classification level
   - Maintains proper security markings
   - Ensures compartment handling

4. **Content Generation**
   - Creates structured report sections
   - Generates executive summaries
   - Identifies key findings and patterns

5. **Quality Metrics**
   - Calculates confidence levels
   - Assesses completeness against requirements
   - Evaluates timeliness of source data

6. **Intelligence Gap Analysis**
   - Identifies missing information
   - Highlights collection priorities
   - Recommends additional sources

**This transformation service is essential for converting raw intelligence data into actionable intelligence products that support decision-making and operational planning.**

## Security Considerations

- All intelligence data MUST be properly classified
- Access controls MUST be enforced based on clearance levels
- Data integrity MUST be maintained with cryptographic hashes
- Audit trails MUST be preserved for all intel operations

## Integration Points

- **Blockchain**: Intelligence reports stored on Solana blockchain
- **UI Components**: 3D visualization and map overlays
- **Services**: Analysis, validation, and synchronization services
- **APIs**: RESTful endpoints for intel operations
