# Intel Reports 3D API Documentation

## Overview

Complete API documentation for all Intel Reports 3D Interactive components, hooks, and utilities.

## Table of Contents

1. [Core Types](#core-types)
2. [Interactive Components](#interactive-components)
3. [HUD Components](#hud-components)
4. [Hooks](#hooks)
5. [Utilities](#utilities)
6. [Context Providers](#context-providers)

## Core Types

### IntelReport3DData

The primary data structure for intel reports in the 3D system.

```typescript
interface IntelReport3DData {
  id: string;                    // Unique identifier
  title: string;                 // Display title
  description: string;           // Detailed description
  location: {                    // Geographic location
    lat: number;                 // Latitude (-90 to 90)
    lng: number;                 // Longitude (-180 to 180)
    alt: number;                 // Altitude in meters
  };
  timestamp: Date;               // Report creation/update time
  priority: IntelPriority;       // Priority level
  status: IntelStatus;          // Current status
  category: string;             // Report category/type
  confidence: number;           // Confidence level (0-1)
  source: string;              // Data source identifier
  tags: string[];              // Searchable tags
  metadata?: Record<string, any>; // Additional data
}
```

### IntelPriority

```typescript
type IntelPriority = 'low' | 'medium' | 'high' | 'critical';
```

### IntelStatus

```typescript
type IntelStatus = 'active' | 'resolved' | 'investigating' | 'archived';
```

### IntelFilterOptions

```typescript
interface IntelFilterOptions {
  priority?: IntelPriority[];
  status?: IntelStatus[];
  category?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  location?: {
    center: { lat: number; lng: number };
    radius: number; // kilometers
  };
  tags?: string[];
  confidence?: {
    min: number;
    max: number;
  };
}
```

## Interactive Components

### IntelReportList

Primary component for displaying lists of intel reports.

```typescript
interface IntelReportListProps {
  reports: IntelReport3DData[];
  onReportClick?: (report: IntelReport3DData) => void;
  onReportSelect?: (report: IntelReport3DData) => void;
  selectedReports?: string[]; // Array of selected report IDs
  variant?: 'compact' | 'detailed';
  showMetrics?: boolean;
  className?: string;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  maxHeight?: string;
  virtualized?: boolean; // Enable for large datasets
}
```

**Usage Example**:
```tsx
<IntelReportList
  reports={reports}
  onReportClick={(report) => console.log('Clicked:', report)}
  onReportSelect={(report) => setSelectedReport(report)}
  variant="compact"
  showMetrics={true}
  virtualized={reports.length > 1000}
/>
```

### IntelReportCard

Individual report card component.

```typescript
interface IntelReportCardProps {
  report: IntelReport3DData;
  onClick?: (report: IntelReport3DData) => void;
  onSelect?: (report: IntelReport3DData) => void;
  selected?: boolean;
  variant?: 'compact' | 'detailed';
  showActions?: boolean;
  className?: string;
}
```

**Usage Example**:
```tsx
<IntelReportCard
  report={report}
  onClick={(report) => openDetails(report)}
  variant="detailed"
  showActions={true}
  selected={selectedId === report.id}
/>
```

### IntelFilterControls

Advanced filtering component.

```typescript
interface IntelFilterControlsProps {
  filters: IntelFilterOptions;
  onFiltersChange: (filters: IntelFilterOptions) => void;
  availableCategories?: string[];
  availableTags?: string[];
  showDateRange?: boolean;
  showLocationFilter?: boolean;
  showConfidenceRange?: boolean;
  className?: string;
}
```

**Usage Example**:
```tsx
<IntelFilterControls
  filters={currentFilters}
  onFiltersChange={setFilters}
  availableCategories={['threat', 'surveillance', 'intel']}
  showDateRange={true}
  showLocationFilter={true}
/>
```

### IntelSearchBar

Search and query component.

```typescript
interface IntelSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  showFilters?: boolean;
  onFiltersToggle?: () => void;
  className?: string;
}
```

**Usage Example**:
```tsx
<IntelSearchBar
  query={searchQuery}
  onQueryChange={setSearchQuery}
  onSearch={performSearch}
  placeholder="Search intel reports..."
  debounceMs={300}
  showFilters={true}
/>
```

### IntelActionButtons

Action buttons for report operations.

```typescript
interface IntelActionButtonsProps {
  selectedReports: IntelReport3DData[];
  onExport?: (reports: IntelReport3DData[]) => void;
  onDelete?: (reports: IntelReport3DData[]) => void;
  onArchive?: (reports: IntelReport3DData[]) => void;
  onShare?: (reports: IntelReport3DData[]) => void;
  showExport?: boolean;
  showDelete?: boolean;
  showArchive?: boolean;
  showShare?: boolean;
  className?: string;
}
```

**Usage Example**:
```tsx
<IntelActionButtons
  selectedReports={selectedReports}
  onExport={exportReports}
  onArchive={archiveReports}
  showExport={true}
  showArchive={true}
/>
```

### IntelStatusIndicator

Visual status indicator component.

```typescript
interface IntelStatusIndicatorProps {
  status: IntelStatus;
  priority?: IntelPriority;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}
```

**Usage Example**:
```tsx
<IntelStatusIndicator
  status="active"
  priority="high"
  size="medium"
  showLabel={true}
/>
```

### IntelMetricsDisplay

Metrics and statistics display component.

```typescript
interface IntelMetricsDisplayProps {
  reports: IntelReport3DData[];
  showTotalCount?: boolean;
  showStatusBreakdown?: boolean;
  showPriorityBreakdown?: boolean;
  showCategoryBreakdown?: boolean;
  showTimeRange?: boolean;
  className?: string;
}
```

**Usage Example**:
```tsx
<IntelMetricsDisplay
  reports={reports}
  showTotalCount={true}
  showStatusBreakdown={true}
  showPriorityBreakdown={true}
/>
```

## HUD Components

### IntelReportsPanel

Main HUD panel for intel reports.

```typescript
interface IntelReportsPanelProps {
  reports: IntelReport3DData[];
  selectedReport?: IntelReport3DData;
  onReportSelect: (report: IntelReport3DData) => void;
  showFilters?: boolean;
  showSearch?: boolean;
  showMetrics?: boolean;
  className?: string;
}
```

### IntelDetailPanel

Detailed view panel for selected reports.

```typescript
interface IntelDetailPanelProps {
  report?: IntelReport3DData;
  onClose?: () => void;
  onEdit?: (report: IntelReport3DData) => void;
  onDelete?: (report: IntelReport3DData) => void;
  className?: string;
}
```

### IntelFloatingPanel

Floating panel for quick intel access.

```typescript
interface IntelFloatingPanelProps {
  reports: IntelReport3DData[];
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  minimized?: boolean;
  onToggleMinimize?: () => void;
  className?: string;
}
```

### IntelBottomBarPanel

Bottom bar integration for intel reports.

```typescript
interface IntelBottomBarPanelProps {
  selectedReport?: IntelReport3DData;
  recentReports?: IntelReport3DData[];
  onReportSelect: (report: IntelReport3DData) => void;
  showQuickActions?: boolean;
  className?: string;
}
```

## Hooks

### useIntelReports3D

Main hook for intel reports data management.

```typescript
interface UseIntelReports3DOptions {
  filters?: IntelFilterOptions;
  query?: string;
  sortBy?: 'timestamp' | 'priority' | 'status' | 'confidence';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface UseIntelReports3DReturn {
  reports: IntelReport3DData[];
  filteredReports: IntelReport3DData[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  metrics: {
    total: number;
    byStatus: Record<IntelStatus, number>;
    byPriority: Record<IntelPriority, number>;
    byCategory: Record<string, number>;
  };
  // Actions
  addReport: (report: Omit<IntelReport3DData, 'id'>) => void;
  updateReport: (id: string, updates: Partial<IntelReport3DData>) => void;
  deleteReport: (id: string) => void;
  searchReports: (query: string) => void;
  filterReports: (filters: IntelFilterOptions) => void;
  exportReports: (format: 'json' | 'csv') => void;
}

const useIntelReports3D = (options?: UseIntelReports3DOptions): UseIntelReports3DReturn;
```

**Usage Example**:
```tsx
const {
  reports,
  filteredReports,
  loading,
  metrics,
  searchReports,
  filterReports
} = useIntelReports3D({
  sortBy: 'timestamp',
  sortOrder: 'desc',
  limit: 100
});
```

### useIntelSelection

Hook for managing report selection.

```typescript
interface UseIntelSelectionReturn {
  selectedReports: IntelReport3DData[];
  selectedIds: string[];
  selectReport: (report: IntelReport3DData) => void;
  deselectReport: (id: string) => void;
  toggleSelection: (report: IntelReport3DData) => void;
  selectAll: (reports: IntelReport3DData[]) => void;
  deselectAll: () => void;
  isSelected: (id: string) => boolean;
}

const useIntelSelection = (): UseIntelSelectionReturn;
```

### useIntelFilters

Hook for managing filter state.

```typescript
interface UseIntelFiltersReturn {
  filters: IntelFilterOptions;
  setFilters: (filters: IntelFilterOptions) => void;
  updateFilter: <K extends keyof IntelFilterOptions>(
    key: K, 
    value: IntelFilterOptions[K]
  ) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const useIntelFilters = (initialFilters?: IntelFilterOptions): UseIntelFiltersReturn;
```

### useIntelSearch

Hook for search functionality with debouncing.

```typescript
interface UseIntelSearchReturn {
  query: string;
  debouncedQuery: string;
  setQuery: (query: string) => void;
  clearQuery: () => void;
  isSearching: boolean;
}

const useIntelSearch = (debounceMs?: number): UseIntelSearchReturn;
```

## Utilities

### legacyTypeCompatibility

Utilities for converting legacy data formats.

```typescript
// Convert single legacy item
const convertLegacyToIntelReport3D = (
  legacyData: LegacyMarkerData
): IntelReport3DData;

// Convert array of legacy items
const convertLegacyArrayToIntelReport3D = (
  legacyArray: LegacyMarkerData[]
): IntelReport3DData[];

// Validate converted data
const validateIntelReport3D = (
  report: IntelReport3DData
): { valid: boolean; errors: string[] };
```

### filterUtils

Utilities for filtering intel reports.

```typescript
// Apply filters to report array
const applyFilters = (
  reports: IntelReport3DData[],
  filters: IntelFilterOptions
): IntelReport3DData[];

// Check if report matches filters
const matchesFilters = (
  report: IntelReport3DData,
  filters: IntelFilterOptions
): boolean;

// Get available filter values
const getAvailableFilterValues = (
  reports: IntelReport3DData[]
): {
  categories: string[];
  tags: string[];
  sources: string[];
};
```

### searchUtils

Utilities for searching intel reports.

```typescript
// Search reports by query
const searchReports = (
  reports: IntelReport3DData[],
  query: string
): IntelReport3DData[];

// Highlight search matches in text
const highlightSearchMatches = (
  text: string,
  query: string
): string;

// Get search suggestions
const getSearchSuggestions = (
  reports: IntelReport3DData[],
  partialQuery: string
): string[];
```

### exportUtils

Utilities for exporting intel reports.

```typescript
// Export to JSON
const exportToJSON = (
  reports: IntelReport3DData[]
): string;

// Export to CSV
const exportToCSV = (
  reports: IntelReport3DData[]
): string;

// Export to formatted report
const exportToReport = (
  reports: IntelReport3DData[],
  format: 'html' | 'pdf'
): string;
```

## Context Providers

### IntelReports3DProvider

Main context provider for intel reports.

```typescript
interface IntelReports3DContextValue {
  reports: IntelReport3DData[];
  selectedReport?: IntelReport3DData;
  filters: IntelFilterOptions;
  query: string;
  loading: boolean;
  error: string | null;
  // Actions
  setSelectedReport: (report?: IntelReport3DData) => void;
  updateFilters: (filters: IntelFilterOptions) => void;
  updateQuery: (query: string) => void;
  refreshReports: () => void;
}

const IntelReports3DProvider: React.FC<{
  children: React.ReactNode;
  initialReports?: IntelReport3DData[];
}>;
```

**Usage Example**:
```tsx
<IntelReports3DProvider initialReports={reports}>
  <YourComponents />
</IntelReports3DProvider>
```

## Integration Examples

### Basic List Integration

```tsx
import React from 'react';
import { IntelReportList } from '../components/IntelReports3D/Interactive';

const BasicExample: React.FC = () => {
  const [reports] = useState<IntelReport3DData[]>([]);

  return (
    <IntelReportList
      reports={reports}
      onReportClick={console.log}
      variant="compact"
      showMetrics={true}
    />
  );
};
```

### Advanced Filter Integration

```tsx
import React from 'react';
import { 
  IntelReportList, 
  IntelFilterControls, 
  IntelSearchBar 
} from '../components/IntelReports3D/Interactive';
import { useIntelFilters, useIntelSearch } from '../hooks';

const AdvancedExample: React.FC = () => {
  const { filters, setFilters } = useIntelFilters();
  const { query, setQuery } = useIntelSearch();
  const [reports] = useState<IntelReport3DData[]>([]);

  return (
    <div>
      <IntelSearchBar
        query={query}
        onQueryChange={setQuery}
      />
      <IntelFilterControls
        filters={filters}
        onFiltersChange={setFilters}
      />
      <IntelReportList
        reports={reports}
        onReportClick={console.log}
      />
    </div>
  );
};
```

### HUD Integration

```tsx
import React from 'react';
import { IntelReportsPanel } from '../components/IntelReports3D/HUD';

const HUDExample: React.FC = () => {
  const [reports] = useState<IntelReport3DData[]>([]);
  const [selectedReport, setSelectedReport] = useState<IntelReport3DData>();

  return (
    <IntelReportsPanel
      reports={reports}
      selectedReport={selectedReport}
      onReportSelect={setSelectedReport}
      showFilters={true}
      showSearch={true}
      showMetrics={true}
    />
  );
};
```

---

**API Documentation Version**: 1.0  
**Last Updated**: January 27, 2025  
**Compatibility**: Intel Reports 3D v4.4+
