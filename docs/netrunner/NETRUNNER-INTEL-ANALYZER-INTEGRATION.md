# NetRunner - IntelAnalyzer Integration Specification

**Date Created:** July 8, 2025  
**Last Updated:** July 8, 2025  
**Status:** Draft

## Overview

This document details the integration between the NetRunner system and the IntelAnalyzer component within the Starcom dApp. This integration enables the transformation of raw intelligence gathered by NetRunner tools and bots into structured, valuable intelligence reports that can be analyzed, shared, and traded on the Intelligence Exchange Marketplace.

## Integration Architecture

### System Components

1. **NetRunner**
   - Handles intelligence gathering via Power Tools and Bot Automation
   - Manages raw intelligence data storage
   - Provides UI for intelligence collection workflows

2. **IntelAnalyzer**
   - Processes and structures raw intelligence
   - Applies analytics and enrichment
   - Generates formal intelligence reports
   - Validates and scores intelligence quality

3. **Integration Layer**
   - Data transformation and format standardization
   - API endpoints for bidirectional communication
   - State management and synchronization
   - Security and access control

### Integration Flow Diagram

```
┌───────────────┐         ┌─────────────────┐         ┌────────────────┐
│   NetRunner   │         │  Integration    │         │  IntelAnalyzer │
│   System      │◄────────►  Layer          │◄────────►  System        │
└───────┬───────┘         └─────────────────┘         └────────┬───────┘
        │                                                      │
        │                                                      │
┌───────▼───────┐                                     ┌────────▼───────┐
│  Power Tools  │                                     │ Report Builder │
│  & Bot Data   │                                     │ & Enrichment   │
└───────────────┘                                     └────────────────┘
```

## Data Models

### Intelligence Data Transfer Object

```typescript
export interface IntelDataDTO {
  id: string;                // Unique identifier
  source: string;            // Tool or bot source
  timestamp: string;         // Collection time (ISO format)
  type: IntelType;           // Type of intelligence
  rawData: unknown;          // Unprocessed data
  metadata: {                // Contextual information
    confidence: number;      // Reliability score (0-1)
    classification: string;  // Security classification
    collectionMethod: string; // How it was collected
    targetId?: string;       // Related target
    geoData?: {              // Geographic context
      lat?: number;
      lon?: number;
      region?: string;
    }
  };
  hash: string;              // Integrity verification
}
```

### Analysis Request

```typescript
export interface AnalysisRequest {
  requestId: string;             // Unique request ID
  intelIds: string[];            // IDs of intelligence to analyze
  analysisParameters: {          // Analysis configuration
    depth: 'basic' | 'standard' | 'deep';
    focus: string[];             // Analysis focus areas
    contextualData?: unknown;    // Additional context
    outputFormat: 'summary' | 'detailed' | 'technical';
  };
  priority: 'low' | 'normal' | 'high';
  callbackEndpoint?: string;     // For async notifications
}
```

### Analysis Result

```typescript
export interface AnalysisResult {
  requestId: string;            // Original request ID
  timestamp: string;            // Analysis time
  status: 'completed' | 'partial' | 'failed';
  results: {                    // Analysis output
    summary: string;            // Text summary
    confidence: number;         // Overall confidence
    entities: Entity[];         // Extracted entities
    relationships: Relationship[]; // Entity relationships
    insights: string[];         // Key findings
    recommendations: string[];  // Suggested actions
    visualizationData?: unknown; // For UI rendering
  };
  reportId?: string;            // Generated report ID
}
```

## API Endpoints

### NetRunner → IntelAnalyzer

| Endpoint | Method | Description | Request Payload | Response |
|----------|--------|-------------|-----------------|----------|
| `/api/intel-analyzer/submit` | POST | Submit raw intelligence for analysis | `IntelDataDTO[]` | Analysis job ID |
| `/api/intel-analyzer/create-report` | POST | Generate formal intel report | Analysis parameters | Report metadata |
| `/api/intel-analyzer/enrich` | POST | Enrich existing intelligence | Intelligence ID + parameters | Enriched data |

### IntelAnalyzer → NetRunner

| Endpoint | Method | Description | Request Payload | Response |
|----------|--------|-------------|-----------------|----------|
| `/api/netrunner/intel-callback` | POST | Return analysis results | `AnalysisResult` | Acknowledgement |
| `/api/netrunner/fetch-raw-intel` | GET | Retrieve raw intelligence | Query parameters | Raw intelligence data |
| `/api/netrunner/update-intel-status` | PATCH | Update intelligence status | Status update | Updated record |

## UI Integration

### IntelReportBuilder Component

The `IntelReportBuilder` component in NetRunner serves as the primary UI bridge to IntelAnalyzer:

```typescript
// IntelReportBuilder.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Tabs, Tab, Card, CircularProgress } from '@mui/material';
import { intelTypes, IntelType } from '../tools/NetRunnerPowerTools';
import { SearchResult } from '../types/netrunner';
import { createAnalysisRequest, getAnalysisStatus } from '../integration/IntelAnalyzerIntegration';

interface IntelReportBuilderProps {
  selectedIntel: SearchResult[];
  onReportCreated: (reportId: string) => void;
}

const IntelReportBuilder: React.FC<IntelReportBuilderProps> = ({
  selectedIntel,
  onReportCreated
}) => {
  // Component implementation for UI integration
  // ...
};

export default IntelReportBuilder;
```

### Integration Points in the UI

1. **Intelligence Selection Interface**
   - Selection of gathered intelligence for analysis
   - Drag-and-drop interface for organizing intel
   - Filtering and sorting options

2. **Analysis Configuration Panel**
   - Selection of analysis depth and focus
   - Addition of contextual information
   - Selection of output format

3. **Report Preview and Generation**
   - Preview of automatically generated report
   - Manual editing capabilities
   - Publication and sharing options

4. **Analysis Results Visualization**
   - Interactive graphs and charts
   - Entity relationship diagrams
   - Geospatial mapping

## Implementation Guidelines

### State Management

Integration will use a dedicated context provider for managing the intelligence analysis state:

```typescript
// IntelAnalysisContext.tsx
import React, { createContext, useContext, useReducer } from 'react';
import { IntelDataDTO, AnalysisRequest, AnalysisResult } from '../types/intel';

interface IntelAnalysisState {
  pendingIntel: IntelDataDTO[];
  activeAnalysis: AnalysisRequest[];
  completedAnalysis: AnalysisResult[];
  selectedIntelIds: string[];
  error: string | null;
  loading: boolean;
}

// Reducer, context implementation, and provider component
// ...
```

### Error Handling

1. **Error Types**
   - Connection errors (API unavailable)
   - Validation errors (malformed data)
   - Processing errors (analysis failure)
   - Authorization errors (permissions)

2. **Error Recovery Strategies**
   - Automatic retry with exponential backoff
   - Data persistence for recovery
   - Graceful degradation to basic functionality
   - Manual intervention options

3. **User Feedback**
   - Clear error messages
   - Progress indicators
   - Recovery options

### Security Considerations

1. **Data Protection**
   - End-to-end encryption for sensitive intelligence
   - Secure API communication (TLS)
   - Input validation and sanitization

2. **Access Control**
   - Role-based permissions for analysis operations
   - Audit logging of all operations
   - Data classification enforcement

3. **Integrity Verification**
   - Cryptographic hashing of intelligence
   - Chain of custody tracking
   - Tamper detection

## Testing Strategy

### Integration Tests

1. **API Contract Tests**
   - Verify API endpoints match specifications
   - Test request/response formats
   - Validate error handling

2. **Data Flow Tests**
   - Test complete flows from intelligence gathering to analysis
   - Verify data transformation correctness
   - Test asynchronous processing

3. **Edge Cases**
   - Test with large data volumes
   - Test with malformed or incomplete data
   - Test failure recovery scenarios

### Performance Tests

1. **Latency Testing**
   - Measure response times for analysis operations
   - Test with varying data sizes

2. **Load Testing**
   - Test system under heavy concurrent requests
   - Verify degradation behavior

### User Acceptance Testing

1. **Workflow Testing**
   - Verify end-to-end user workflows
   - Test realistic intelligence analysis scenarios

2. **Usability Testing**
   - Evaluate UI for intuitive use
   - Test accessibility compliance

## Deployment Guidelines

1. **Dependency Management**
   - Ensure version compatibility between systems
   - Document external dependencies

2. **Configuration Management**
   - Environment-specific configuration
   - Feature flags for gradual rollout

3. **Monitoring and Alerting**
   - Key metrics to monitor
   - Alert thresholds and escalation procedures

## Milestones and Timeline

| Milestone | Description | Target Date |
|-----------|-------------|-------------|
| Architecture Review | Finalize integration architecture | July 15, 2025 |
| API Development | Implement API endpoints | July 22, 2025 |
| UI Integration | Implement UI components | July 29, 2025 |
| Testing | Complete integration and performance testing | August 5, 2025 |
| Documentation | Complete technical documentation | August 8, 2025 |
| Deployment | Deploy to production | August 12, 2025 |

## Appendices

### A. Related Documentation

- [NETRUNNER-DOCUMENTATION.md](./NETRUNNER-DOCUMENTATION.md)
- [NETRUNNER-ARCHITECTURE-OVERVIEW.md](./NETRUNNER-ARCHITECTURE-OVERVIEW.md)
- [NETRUNNER-INTEL-ANALYSIS-SPEC.md](./NETRUNNER-INTEL-ANALYSIS-SPEC.md)

### B. Technical Glossary

- **Intelligence**: Raw or processed information collected about entities or activities
- **IntelType**: Classification of intelligence by domain or source
- **Analysis**: Process of evaluating intelligence to extract insights
- **Report**: Formalized document containing analysis results and findings
