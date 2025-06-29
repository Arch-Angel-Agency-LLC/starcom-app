# Intel Reports 3D - Developer Cheat Sheet

## 🚀 Quick Start Guide

### Import the Core Types
```typescript
// Core data structure
import { IntelReport3DData } from '@/types/intelligence/IntelReportTypes';

// Context-aware display
import { IntelReport3DContextState } from '@/types/intelligence/IntelContextTypes';

// Multi-context scenarios
import { IntelSplitScreenConfig } from '@/types/intelligence/IntelMultiContextTypes';

// Legacy compatibility
import { IntelCompatibilityAdapter } from '@/types/intelligence/IntelCompatibilityTypes';
```

### Create a New Intel Report
```typescript
const newIntelReport: IntelReport3DData = {
  id: 'intel-' + crypto.randomUUID(),
  title: 'Anomalous Signal Detection',
  classification: 'UNCLASSIFIED',
  source: 'Station-Alpha-7',
  timestamp: new Date(),
  
  location: {
    lat: 40.7128,
    lng: -74.0060,
    altitude: 100,
    region: 'North America'
  },
  
  content: {
    summary: 'Brief overview for tooltips',
    details: 'Detailed analysis and findings...',
    attachments: []
  },
  
  visualization: {
    markerType: 'priority',
    color: '#ff6b35',
    size: 1.3,
    opacity: 0.9,
    priority: 'high'
  },
  
  metadata: {
    tags: ['SIGINT', 'ELECTROMAGNETIC'],
    confidence: 0.85,
    reliability: 0.90,
    freshness: 1.0,
    category: 'cyber_threat'
  }
};
```

### Migrate Legacy Data
```typescript
// Auto-detect and migrate any legacy format
const legacyData = getSomeLegacyIntelData();
const modernReport = IntelCompatibilityAdapter.autoMigrate(legacyData);

// Batch migration
const legacyReports = getLegacyIntelReports();
const modernReports = IntelCompatibilityAdapter.batchMigrate(legacyReports);

// Manual migration (if you know the format)
import { IntelCompatibilityMigration } from '@/types/intelligence/IntelCompatibilityTypes';

const overlayData: LegacyIntelReportOverlay = { /* legacy data */ };
const modernData = IntelCompatibilityMigration.fromLegacyOverlay(overlayData);
```

### Context-Aware Display Configuration
```typescript
const contextState: IntelReport3DContextState = {
  // Current HUD state
  hudContext: {
    operationMode: 'PLANETARY',
    centerMode: '3D_GLOBE',
    activeLayers: ['intel-reports', 'geomagnetic-data'],
    selectedObject: null
  },
  
  // Display settings
  displayContext: {
    priority: 'primary', 
    visibility: 'full',
    adaptiveRendering: true
  },
  
  // Integration with other systems
  integrationState: {
    globeSync: true,
    timelineSync: false,
    networkSync: true,
    dataLayers: ['intel-reports']
  }
};
```

### Multi-Context Split-Screen Setup
```typescript
import { IntelSplitScreenConfig } from '@/types/intelligence/IntelMultiContextTypes';

const splitScreenConfig: IntelSplitScreenConfig = {
  layout: 'horizontal',
  contexts: [
    {
      id: 'context-1',
      size: 0.6,
      state: {
        hudContext: {
          operationMode: 'PLANETARY',
          centerMode: '3D_GLOBE',
          activeLayers: ['intel-reports'],
          selectedObject: null
        },
        displayContext: {
          priority: 'primary',
          visibility: 'full', 
          adaptiveRendering: true
        },
        integrationState: {
          globeSync: true,
          timelineSync: false,
          networkSync: true,
          dataLayers: ['intel-reports']
        }
      }
    },
    {
      id: 'context-2', 
      size: 0.4,
      state: {
        hudContext: {
          operationMode: 'SPACE',
          centerMode: 'TIMELINE',
          activeLayers: ['satellite-data'],
          selectedObject: null
        },
        displayContext: {
          priority: 'secondary',
          visibility: 'minimal',
          adaptiveRendering: false
        },
        integrationState: {
          globeSync: false,
          timelineSync: true,
          networkSync: false,
          dataLayers: ['satellite-data']
        }
      }
    }
  ],
  synchronization: {
    enabled: true,
    bidirectional: false,
    types: ['selection', 'time_range']
  }
};
```

## 🎯 Common Patterns

### Filtering and Querying
```typescript
// Filter by tags
const cyberReports = allReports.filter(report => 
  report.metadata.tags.includes('SIGINT') || 
  report.metadata.tags.includes('CYBER')
);

// Filter by threat level
const highThreatReports = allReports.filter(report => 
  report.metadata.threat_level === 'high' || 
  report.metadata.threat_level === 'critical'
);

// Filter by geographic region
const regionReports = allReports.filter(report => 
  report.location.region === 'North America'
);

// Filter by freshness (recent reports)
const recentReports = allReports.filter(report => 
  report.metadata.freshness > 0.7
);
```

### Visualization Customization
```typescript
// Priority-based visualization
const getVisualizationForPriority = (priority: IntelPriority): IntelVisualization => {
  switch (priority) {
    case 'critical':
      return {
        markerType: 'alert',
        color: '#ff4757',
        size: 1.5,
        opacity: 1.0,
        priority,
        animation: { type: 'pulse', duration: 1000, intensity: 0.5, loop: true }
      };
    case 'high':
      return {
        markerType: 'priority', 
        color: '#ff6b35',
        size: 1.3,
        opacity: 0.9,
        priority
      };
    default:
      return {
        markerType: 'standard',
        color: '#4ecdc4', 
        size: 1.0,
        opacity: 0.8,
        priority
      };
  }
};

// Classification-based styling
const getColorForClassification = (classification: IntelClassification): string => {
  switch (classification) {
    case 'TOP_SECRET': return '#8b0000';
    case 'SECRET': return '#ff6b35';
    case 'CONFIDENTIAL': return '#f39c12';
    default: return '#4ecdc4';
  }
};
```

### Relationship Management
```typescript
// Create relationships between reports
const createRelationship = (
  sourceId: string, 
  targetId: string, 
  type: IntelRelationshipType = 'related_to'
): IntelRelationship => ({
  id: `rel-${sourceId}-${targetId}`,
  type,
  target_intel_id: targetId,
  strength: 0.7,
  description: `Related via ${type}`,
  created_by: 'system',
  created_at: new Date()
});

// Find related reports
const getRelatedReports = (report: IntelReport3DData, allReports: IntelReport3DData[]): IntelReport3DData[] => {
  if (!report.relationships) return [];
  
  const relatedIds = report.relationships.map(rel => rel.target_intel_id);
  return allReports.filter(r => relatedIds.includes(r.id));
};
```

## 🔧 Service Integration Patterns

### Basic Service Usage (Phase 2)
```typescript
// This is the planned API for Phase 2 services
import { IntelReports3DService } from '@/services/intelligence/IntelReports3DService';

// Initialize service
const intelService = new IntelReports3DService(contextState);

// Subscribe to updates
intelService.subscribe('viewport', (reports) => {
  // Handle updated reports
  console.log('Received reports:', reports.length);
});

// Query reports
const viewportReports = await intelService.queryByViewport({
  bounds: { north: 45, south: 35, east: -70, west: -80 },
  zoom: 8,
  maxItems: 100
});

// Add new report
await intelService.addReport(newIntelReport);

// Update existing report
await intelService.updateReport(reportId, updatedReport);
```

### Context Management (Phase 2)
```typescript
// Planned API for context service
import { IntelContextService } from '@/services/intelligence/IntelContextService';

const contextService = new IntelContextService();

// Switch operation modes
await contextService.setOperationMode('SPACE');
await contextService.setCenterMode('TIMELINE');

// Manage layers
await contextService.activateLayer('satellite-data');
await contextService.deactivateLayer('intel-reports');

// Sync with HUD
contextService.syncWithHUD(hudState);
```

## 🐞 Common Pitfalls & Solutions

### ❌ Don't: Use legacy interfaces directly
```typescript
// DON'T DO THIS
const report: LegacyIntelReportOverlay = { /* ... */ };
someFunction(report); // Type errors with new components
```

### ✅ Do: Migrate first, then use
```typescript
// DO THIS
const legacyReport: LegacyIntelReportOverlay = { /* ... */ };
const modernReport = IntelCompatibilityAdapter.autoMigrate(legacyReport);
if (modernReport) {
  someFunction(modernReport); // Type-safe!
}
```

### ❌ Don't: Ignore context state
```typescript
// DON'T DO THIS
const service = new IntelReports3DService(); // Missing context
```

### ✅ Do: Always provide context
```typescript
// DO THIS  
const contextState = createIntelContextState();
const service = new IntelReports3DService(contextState);
```

### ❌ Don't: Hardcode visualization properties
```typescript
// DON'T DO THIS
const report = {
  // ...
  visualization: {
    markerType: 'standard',
    color: '#red', // Invalid color
    size: 5, // Too large
    opacity: 2 // Invalid opacity
  }
};
```

### ✅ Do: Use helper functions and validation
```typescript
// DO THIS
const report = {
  // ...
  visualization: getVisualizationForPriority('high') // Type-safe and consistent
};
```

## 📊 Performance Tips

### Memory Optimization
```typescript
// Use viewport culling
const visibleReports = allReports.filter(report => {
  const { lat, lng } = report.location;
  return lat >= bounds.south && lat <= bounds.north &&
         lng >= bounds.west && lng <= bounds.east;
});

// Limit dataset size
const limitedReports = visibleReports.slice(0, 1000);
```

### Rendering Optimization
```typescript
// Use LOD (Level of Detail) based on zoom
const getLODLevel = (zoom: number): 'high' | 'medium' | 'low' => {
  if (zoom > 10) return 'high';
  if (zoom > 5) return 'medium';
  return 'low';
};

// Adjust rendering based on LOD
const lodLevel = getLODLevel(currentZoom);
const simplifiedReports = reports.map(report => ({
  ...report,
  visualization: {
    ...report.visualization,
    size: lodLevel === 'low' ? 0.5 : report.visualization.size
  }
}));
```

## 🧪 Testing Helpers

### Type Guards for Testing
```typescript
import { IntelCompatibilityTypeGuards } from '@/types/intelligence/IntelCompatibilityTypes';

// Test if data is in expected format
const testData = getTestIntelData();
if (IntelCompatibilityTypeGuards.isLegacyOverlay(testData)) {
  // Handle as legacy overlay
} else {
  // Assume modern format
}
```

### Mock Data Generation
```typescript
// Generate test intel report
const createMockIntelReport = (overrides: Partial<IntelReport3DData> = {}): IntelReport3DData => ({
  id: 'mock-' + Math.random().toString(36),
  title: 'Mock Intel Report',
  classification: 'UNCLASSIFIED',
  source: 'Test-Source',
  timestamp: new Date(),
  location: { lat: 0, lng: 0 },
  content: { summary: 'Mock summary', details: 'Mock details' },
  visualization: { markerType: 'standard', color: '#4ecdc4', size: 1.0, opacity: 0.8, priority: 'medium' },
  metadata: { tags: ['TEST'], confidence: 0.5, reliability: 0.5, freshness: 1.0, category: 'operational' },
  ...overrides
});
```

---

## 📚 Reference Links

- **Phase 1 Complete**: All type definitions in `/src/types/intelligence/`
- **Phase 2 Planned**: Service layer in `/src/services/intelligence/` 
- **Phase 3 Planned**: Hooks in `/src/hooks/intelligence/`
- **Phase 4 Planned**: Components in `/src/components/intelligence/`

---

*This cheat sheet will be updated as each phase is completed.*  
*Last Updated: June 28, 2025 - Phase 1 Complete*
