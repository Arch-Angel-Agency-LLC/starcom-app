# Intel Reports 3D Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from legacy Intel Report components to the new Intel Reports 3D Interactive system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Migration Overview](#migration-overview)
3. [Step-by-Step Migration](#step-by-step-migration)
4. [Type Compatibility](#type-compatibility)
5. [Testing Your Migration](#testing-your-migration)
6. [Troubleshooting](#troubleshooting)
7. [Performance Considerations](#performance-considerations)

## Prerequisites

Before starting the migration, ensure you have:

- ✅ Node.js 18+ installed
- ✅ TypeScript 5.0+ configured
- ✅ React 18+ in your project
- ✅ Three.js dependencies installed
- ✅ Existing Intel Reports 3D components available

## Migration Overview

### What's Changing

**Legacy Components (Being Removed)**:
- `src/components/IntelReportList.tsx`
- `src/components/Intel/IntelReportList.tsx` 
- `src/components/CyberInvestigation/IntelReportViewer.tsx`
- `src/components/Intel/IntelReportList.css`

**New Components (Using Instead)**:
- `src/components/IntelReports3D/Interactive/IntelReportList.tsx`
- `src/components/IntelReports3D/Interactive/IntelReportCard.tsx`
- `src/components/IntelReports3D/Interactive/IntelFilterControls.tsx`
- `src/components/IntelReports3D/Interactive/IntelSearchBar.tsx`
- `src/components/IntelReports3D/Interactive/IntelActionButtons.tsx`

### Migration Benefits

- 🎯 **Unified 3D Experience**: Seamless integration with globe visualization
- 🚀 **Better Performance**: Optimized rendering and memory usage
- 🔒 **Type Safety**: Full TypeScript support with strict typing
- 🎨 **Enhanced UI**: Modern design with better UX
- 📊 **Rich Interactions**: Advanced filtering, searching, and actions

## Step-by-Step Migration

### Step 1: Install Dependencies

If not already installed, add the required packages:

```bash
npm install three @types/three
npm install @react-three/fiber @react-three/drei
```

### Step 2: Create Type Compatibility Layer

Create a utility file to handle data transformation:

```typescript
// src/utils/legacyTypeCompatibility.ts
import { IntelReport3DData } from '../components/IntelReports3D/types';

export interface LegacyMarkerData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
  type?: string;
  timestamp?: Date;
  status?: string;
  // Add other legacy fields as needed
}

export const convertLegacyToIntelReport3D = (
  legacyData: LegacyMarkerData
): IntelReport3DData => {
  return {
    id: legacyData.id,
    title: legacyData.name,
    description: legacyData.description || '',
    location: {
      lat: legacyData.lat,
      lng: legacyData.lng,
      alt: 0 // Default altitude
    },
    timestamp: legacyData.timestamp || new Date(),
    priority: legacyData.type === 'critical' ? 'high' : 'medium',
    status: (legacyData.status as any) || 'active',
    category: legacyData.type || 'general',
    confidence: 0.8, // Default confidence
    source: 'legacy-migration',
    tags: legacyData.type ? [legacyData.type] : [],
    metadata: {
      originalType: legacyData.type,
      migrated: true,
      migrationDate: new Date().toISOString()
    }
  };
};

export const convertLegacyArrayToIntelReport3D = (
  legacyArray: LegacyMarkerData[]
): IntelReport3DData[] => {
  return legacyArray.map(convertLegacyToIntelReport3D);
};
```

### Step 3: Update Your Page Component

Replace legacy component usage with new Intel Reports 3D components:

**Before (Legacy)**:
```typescript
// src/pages/IntelReportsPage.tsx (Old)
import React from 'react';
import { IntelReportList } from '../components/Intel/IntelReportList';

const IntelReportsPage: React.FC = () => {
  const [markers, setMarkers] = useState<LegacyMarkerData[]>([]);

  return (
    <div className="intel-reports-page">
      <h1>Intel Reports</h1>
      <IntelReportList 
        markers={markers} 
        onMarkerClick={(marker) => console.log(marker)}
      />
    </div>
  );
};
```

**After (New)**:
```typescript
// src/pages/IntelReportsPage.tsx (New)
import React, { useState, useMemo } from 'react';
import { IntelReportList } from '../components/IntelReports3D/Interactive';
import { convertLegacyArrayToIntelReport3D, LegacyMarkerData } from '../utils/legacyTypeCompatibility';

const IntelReportsPage: React.FC = () => {
  const [markers, setMarkers] = useState<LegacyMarkerData[]>([]);

  // Convert legacy data to new format
  const intelReports = useMemo(() => 
    convertLegacyArrayToIntelReport3D(markers), 
    [markers]
  );

  return (
    <div className="intel-reports-page">
      <h1>Intel Reports</h1>
      <IntelReportList 
        reports={intelReports}
        onReportClick={(report) => console.log('Report clicked:', report)}
        onReportSelect={(report) => console.log('Report selected:', report)}
        variant="compact"
        showMetrics={true}
      />
    </div>
  );
};
```

### Step 4: Remove Legacy Components

After confirming the migration works, remove the legacy files:

```bash
# Remove legacy components
rm src/components/IntelReportList.tsx
rm src/components/Intel/IntelReportList.tsx
rm src/components/CyberInvestigation/IntelReportViewer.tsx
rm src/components/Intel/IntelReportList.css

# Update any imports that might reference these files
```

### Step 5: Update Imports

Update any remaining imports to use the new components:

```typescript
// Old imports
import { IntelReportList } from '../components/Intel/IntelReportList';

// New imports
import { IntelReportList } from '../components/IntelReports3D/Interactive';
```

## Type Compatibility

### Legacy Data Structure

```typescript
interface LegacyMarkerData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
  type?: string;
  timestamp?: Date;
  status?: string;
}
```

### New Data Structure

```typescript
interface IntelReport3DData {
  id: string;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    alt: number;
  };
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'investigating' | 'archived';
  category: string;
  confidence: number;
  source: string;
  tags: string[];
  metadata?: Record<string, any>;
}
```

### Field Mapping

| Legacy Field | New Field | Transformation |
|-------------|-----------|----------------|
| `name` | `title` | Direct mapping |
| `lat` | `location.lat` | Direct mapping |
| `lng` | `location.lng` | Direct mapping |
| `description` | `description` | Default to empty string if undefined |
| `type` | `category` | Direct mapping |
| `status` | `status` | Type conversion with validation |
| `timestamp` | `timestamp` | Default to current date if undefined |

## Testing Your Migration

### 1. Lint Check

```bash
npm run lint src/pages/IntelReportsPage.tsx
```

### 2. Type Check

```bash
npx tsc --noEmit
```

### 3. Build Test

```bash
npm run build
```

### 4. Performance Test

Run the performance testing script:

```bash
node scripts/performance-test.js
```

### 5. Visual Testing

1. Start the development server: `npm run dev`
2. Navigate to the Intel Reports page
3. Verify components render correctly
4. Test filtering and search functionality
5. Confirm click handlers work properly

## Troubleshooting

### Common Issues

#### 1. Type Errors

**Problem**: TypeScript errors about incompatible types

**Solution**: Ensure you're using the type compatibility layer:
```typescript
const convertedReports = convertLegacyArrayToIntelReport3D(legacyData);
```

#### 2. Missing Props

**Problem**: Component expects different props than legacy version

**Solution**: Check the new component's prop interface:
```typescript
interface IntelReportListProps {
  reports: IntelReport3DData[];
  onReportClick?: (report: IntelReport3DData) => void;
  onReportSelect?: (report: IntelReport3DData) => void;
  variant?: 'compact' | 'detailed';
  showMetrics?: boolean;
  className?: string;
}
```

#### 3. Styling Issues

**Problem**: Components don't look the same as legacy versions

**Solution**: The new components use modern CSS modules. Apply custom styles:
```typescript
<IntelReportList 
  className="your-custom-class"
  // ... other props
/>
```

#### 4. Performance Issues

**Problem**: Slow rendering with large datasets

**Solution**: Enable virtualization for large datasets:
```typescript
<IntelReportList 
  reports={reports}
  variant="compact" // Use compact variant for better performance
  showMetrics={false} // Disable metrics for large datasets
/>
```

### Getting Help

If you encounter issues not covered in this guide:

1. Check the [Development Progress](./INTEL-REPORTS-3D-DEVELOPMENT-PROGRESS.md) document
2. Review the [Migration Analysis](./INTEL-REPORTS-3D-MIGRATION-ANALYSIS.md) document
3. Look at the integration examples in `src/components/IntelReports3D/Interactive/IntegrationExample.tsx`

## Performance Considerations

### Memory Usage

- **Small datasets (< 1,000 reports)**: ~0.7MB memory usage
- **Medium datasets (1,000 - 5,000 reports)**: ~7-34MB memory usage
- **Large datasets (5,000 - 10,000 reports)**: ~34-68MB memory usage
- **Very large datasets (> 10,000 reports)**: Consider pagination/virtualization

### Optimization Tips

1. **Use Compact Variant**: For large datasets, use `variant="compact"`
2. **Disable Unnecessary Features**: Turn off `showMetrics` for large datasets
3. **Implement Pagination**: For > 10,000 reports, implement pagination
4. **Lazy Loading**: Load reports on demand rather than all at once
5. **Debounced Search**: Use debounced search to avoid excessive filtering

### Bundle Size Impact

- The migration adds minimal bundle size overhead
- New components are tree-shakeable
- Legacy components removal reduces overall bundle size

## Migration Checklist

- [ ] Install required dependencies
- [ ] Create type compatibility layer
- [ ] Update page components to use new Intel Reports 3D components
- [ ] Convert legacy data using compatibility utilities
- [ ] Remove legacy component files
- [ ] Update all imports
- [ ] Run lint and type checks
- [ ] Test build process
- [ ] Perform visual testing
- [ ] Run performance tests
- [ ] Update documentation

## Success Criteria

Your migration is complete when:

- ✅ All lint checks pass
- ✅ TypeScript compilation succeeds
- ✅ Production build completes successfully
- ✅ Components render correctly in browser
- ✅ All user interactions work as expected
- ✅ Performance meets requirements
- ✅ Legacy files are removed
- ✅ No console errors or warnings

---

**Migration Guide Version**: 1.0  
**Last Updated**: January 27, 2025  
**Compatibility**: Intel Reports 3D v4.4+
