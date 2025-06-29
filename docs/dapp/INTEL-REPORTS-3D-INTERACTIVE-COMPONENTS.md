# Intel Reports 3D - Interactive Components Documentation

## Overview

The Interactive Components module provides a complete suite of React components for the Intel Reports 3D system. These components are designed to work seamlessly with the HUD Panel integration and offer rich, interactive user experiences for managing intelligence data.

## Architecture

### Component Structure
```
Interactive/
├── IntelReportCard.tsx           # Individual report display
├── IntelReportCard.module.css
├── IntelReportList.tsx           # Virtualized report list  
├── IntelReportList.module.css
├── IntelFilterControls.tsx       # Advanced filtering UI
├── IntelFilterControls.module.css
├── IntelSearchBar.tsx            # Search with autocomplete
├── IntelSearchBar.module.css
├── IntelActionButtons.tsx        # Action controls
├── IntelActionButtons.module.css
├── IntelStatusIndicator.tsx      # Status display
├── IntelStatusIndicator.module.css
├── IntelMetricsDisplay.tsx       # Metrics dashboard
├── IntelMetricsDisplay.module.css
├── IntegrationExample.tsx        # Reference implementation
├── IntegrationExample.module.css
└── index.ts                      # Main exports
```

### Design Principles

1. **Modular Architecture**: Each component is self-contained with its own types, styles, and logic
2. **Type Safety**: Full TypeScript integration with comprehensive prop interfaces
3. **Performance**: Optimized for large datasets with virtualization and efficient rendering
4. **Accessibility**: WCAG 2.1 compliant with keyboard navigation and screen reader support
5. **Responsive Design**: Mobile-first approach with adaptive layouts
6. **Theme Integration**: Consistent with the overall Starcom design system

## Component Reference

### IntelReportCard

A component for displaying individual intelligence reports with interactive features.

**Features:**
- Expandable content with classification indicators
- Priority badges and status indicators
- Interactive selection and action buttons
- Keyboard navigation and accessibility
- Responsive layout with overflow handling

**Props:**
```typescript
interface IntelReportCardProps {
  report: IntelReport3DData;
  selected?: boolean;
  expanded?: boolean;
  onSelect?: (selected: boolean) => void;
  onExpand?: (expanded: boolean) => void;
  onAction?: (action: string) => void;
  showMetadata?: boolean;
  showActions?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
<IntelReportCard
  report={reportData}
  selected={selectedReports.has(reportData.id)}
  onSelect={(selected) => handleSelect(reportData.id, selected)}
  showMetadata={true}
  showActions={true}
/>
```

### IntelReportList

A virtualized list component for displaying multiple intelligence reports efficiently.

**Features:**
- Virtual scrolling for performance with large datasets
- Multi-select with bulk operations
- Loading, error, and empty states
- Sortable columns and filterable content
- Custom render functions for extended functionality

**Props:**
```typescript
interface IntelReportListProps {
  reports: IntelReport3DData[];
  loading?: boolean;
  error?: string | null;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  virtualized?: boolean;
  selectable?: boolean;
  showMetadata?: boolean;
  itemHeight?: number;
  className?: string;
}
```

**Usage:**
```tsx
<IntelReportList
  reports={reports}
  loading={isLoading}
  onSelectionChange={setSelectedReports}
  virtualized={true}
  selectable={true}
  itemHeight={120}
/>
```

### IntelFilterControls

Advanced filtering interface for intelligence reports with multiple filter types.

**Features:**
- Category, tag, priority, and classification filters
- Date range picker with preset options
- Confidence range slider
- Filter presets and advanced options
- Real-time filter application with debouncing

**Props:**
```typescript
interface IntelFilterControlsProps {
  filters: IntelFilters;
  onFiltersChange: (filters: IntelFilters) => void;
  showPresets?: boolean;
  showAdvanced?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
<IntelFilterControls
  filters={currentFilters}
  onFiltersChange={handleFilterChange}
  showPresets={true}
  showAdvanced={true}
/>
```

### IntelSearchBar

Search component with autocomplete, suggestions, and recent searches.

**Features:**
- Real-time search with configurable debouncing
- Autocomplete suggestions from report content
- Recent searches history with persistence
- Keyboard navigation and accessibility
- Search result highlighting

**Props:**
```typescript
interface IntelSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  maxSuggestions?: number;
  className?: string;
}
```

**Usage:**
```tsx
<IntelSearchBar
  query={searchQuery}
  onQueryChange={setSearchQuery}
  placeholder="Search intelligence reports..."
  showSuggestions={true}
  maxSuggestions={5}
/>
```

### IntelActionButtons

Action controls for single and batch operations on intelligence reports.

**Features:**
- Single and batch operation support
- Confirmation dialogs for destructive actions
- Multiple layout variants (horizontal, vertical, compact)
- Disabled states and loading indicators
- Customizable action sets

**Props:**
```typescript
interface IntelActionButtonsProps {
  selectedReports: string[];
  onAction: (action: string, reports: IntelReport3DData[]) => void;
  layout?: 'horizontal' | 'vertical' | 'compact';
  disabled?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
<IntelActionButtons
  selectedReports={selectedReportIds}
  onAction={handleAction}
  layout="horizontal"
  disabled={isProcessing}
/>
```

### IntelStatusIndicator

Real-time status display for connection, sync, and system health.

**Features:**
- Connection and data sync status indicators
- Animated state transitions
- Auto-hide functionality for healthy states
- Configurable positioning for floating display
- Click-to-expand detailed status information

**Props:**
```typescript
interface IntelStatusIndicatorProps {
  connectionStatus?: 'connected' | 'connecting' | 'disconnected' | 'error';
  syncStatus?: 'synced' | 'syncing' | 'pending' | 'error';
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
  autoHide?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
<IntelStatusIndicator
  connectionStatus="connected"
  syncStatus="synced"
  animated={true}
  autoHide={false}
/>
```

### IntelMetricsDisplay

Performance and analytics metrics display with multiple visualization options.

**Features:**
- System health and performance metrics
- Multiple display variants (dashboard, compact, overlay)
- Real-time updates with configurable refresh intervals
- Alert indicators for threshold breaches
- Expandable detailed metrics view

**Props:**
```typescript
interface IntelMetricsDisplayProps {
  refreshInterval?: number;
  size?: 'compact' | 'full' | 'dashboard';
  showAlerts?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
<IntelMetricsDisplay
  refreshInterval={5000}
  size="compact"
  showAlerts={true}
/>
```

## Integration Guide

### Basic Integration

The simplest way to integrate the Interactive components is to use them individually:

```tsx
import {
  IntelReportList,
  IntelFilterControls,
  IntelSearchBar
} from '@/components/IntelReports3D/Interactive';

function IntelDashboard() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="intel-dashboard">
      <IntelSearchBar
        query={searchQuery}
        onQueryChange={setSearchQuery}
      />
      <IntelFilterControls
        filters={filters}
        onFiltersChange={setFilters}
      />
      <IntelReportList
        reports={reports}
        virtualized={true}
        selectable={true}
      />
    </div>
  );
}
```

### Complete Integration Example

For a full-featured integration, refer to the `IntegrationExample` component:

```tsx
import { IntegrationExample } from '@/components/IntelReports3D/Interactive';

function FullIntelInterface() {
  return (
    <IntegrationExample
      layout="dashboard"
      componentsToShow={['search', 'filters', 'list', 'actions', 'status', 'metrics']}
    />
  );
}
```

### HUD Panel Integration

For integration with the main HUD system:

```tsx
import { useHUDContext } from '@/contexts/HUDContext';
import { IntelReportList, IntelStatusIndicator } from '@/components/IntelReports3D/Interactive';

function HUDIntelPanel() {
  const { intelReports, systemStatus } = useHUDContext();

  return (
    <div className="hud-intel-panel">
      <IntelStatusIndicator
        connectionStatus={systemStatus.connection}
        syncStatus={systemStatus.sync}
        size="small"
        autoHide={true}
      />
      <IntelReportList
        reports={intelReports}
        virtualized={true}
        itemHeight={80}
        showMetadata={false}
      />
    </div>
  );
}
```

## Styling and Theming

### CSS Modules

All components use CSS Modules for scoped styling:

```css
/* IntelReportCard.module.css */
.reportCard {
  background: var(--card-background);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius);
  transition: var(--transition-standard);
}

.reportCard:hover {
  border-color: var(--card-border-hover);
  box-shadow: var(--shadow-elevated);
}
```

### Theme Variables

Components respect the following CSS custom properties:

```css
:root {
  /* Colors */
  --background-primary: #0a0a0a;
  --background-secondary: #1a1a1a;
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --accent-primary: #00ff88;
  --accent-secondary: #0088ff;

  /* Borders */
  --border-primary: #333333;
  --border-secondary: #555555;
  --border-radius: 8px;

  /* Shadows */
  --shadow-standard: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-elevated: 0 4px 16px rgba(0, 0, 0, 0.4);

  /* Transitions */
  --transition-standard: all 0.2s ease;
  --transition-fast: all 0.1s ease;
}
```

## Performance Considerations

### Virtualization

The `IntelReportList` component uses virtualization for optimal performance:

```tsx
<IntelReportList
  reports={largeDataset} // Can handle 10,000+ items
  virtualized={true}
  itemHeight={120}
  overscan={5} // Render 5 extra items outside viewport
/>
```

### Memoization

Components use React.memo and useMemo for optimization:

```tsx
// Components are memoized automatically
const MemoizedReportCard = React.memo(IntelReportCard);

// Props are memoized where appropriate
const memoizedFilters = useMemo(() => ({
  categories: selectedCategories,
  dateRange: { start: startDate, end: endDate }
}), [selectedCategories, startDate, endDate]);
```

### Debouncing

Search and filter operations are debounced to reduce API calls:

```tsx
// Built-in debouncing in IntelSearchBar
<IntelSearchBar
  query={query}
  onQueryChange={debouncedHandleSearch} // Debounced automatically
  debounceMs={300} // Configurable delay
/>
```

## Accessibility Features

### Keyboard Navigation

All components support keyboard navigation:

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons and select items
- **Arrow Keys**: Navigate within lists and filter controls
- **Escape**: Close modals and cancel operations

### Screen Reader Support

Components include comprehensive ARIA attributes:

```tsx
<div
  role="listbox"
  aria-label="Intelligence Reports"
  aria-multiselectable="true"
>
  {reports.map(report => (
    <div
      key={report.id}
      role="option"
      aria-selected={selectedReports.has(report.id)}
      aria-describedby={`report-${report.id}-details`}
    >
      {/* Report content */}
    </div>
  ))}
</div>
```

### Color Contrast

All text meets WCAG 2.1 AA contrast requirements:

- Normal text: 4.5:1 contrast ratio minimum
- Large text: 3:1 contrast ratio minimum
- Interactive elements: Clear focus indicators

## Testing

### Unit Tests

Each component includes comprehensive unit tests:

```typescript
describe('IntelReportCard', () => {
  test('renders report data correctly', () => {
    render(<IntelReportCard report={mockReport} />);
    expect(screen.getByText(mockReport.title)).toBeInTheDocument();
  });

  test('handles selection correctly', () => {
    const onSelect = jest.fn();
    render(<IntelReportCard report={mockReport} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onSelect).toHaveBeenCalledWith(true);
  });
});
```

### Integration Tests

Integration tests verify component interactions:

```typescript
describe('Intel Dashboard Integration', () => {
  test('search filters report list', async () => {
    render(<IntegrationExample />);
    const searchInput = screen.getByPlaceholderText('Search intel reports...');
    fireEvent.change(searchInput, { target: { value: 'urgent' } });
    
    await waitFor(() => {
      expect(screen.getByText('Showing filtered results')).toBeInTheDocument();
    });
  });
});
```

## Migration from Legacy Components

### Mapping Legacy Props

Legacy components can be migrated using these prop mappings:

```typescript
// Legacy IntelReport component
<LegacyIntelReport
  data={reportData}
  selected={isSelected}
  onSelectionChange={handleSelect}
/>

// New IntelReportCard component
<IntelReportCard
  report={reportData} // data -> report
  selected={isSelected}
  onSelect={handleSelect} // onSelectionChange -> onSelect
/>
```

### Breaking Changes

1. **Props**: Some prop names have changed for consistency
2. **Styling**: CSS class names are now scoped with CSS modules
3. **Types**: TypeScript interfaces have been updated and strengthened
4. **Events**: Event handlers may have different signatures

### Migration Utility

A migration utility is available for automated updates:

```bash
npm run migrate:intel-components -- --path=src/components/legacy
```

## Contributing

### Development Setup

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Run tests: `npm test`
4. Check types: `npm run type-check`
5. Lint code: `npm run lint`

### Component Development Guidelines

1. **TypeScript First**: All components must be fully typed
2. **CSS Modules**: Use scoped styles with semantic class names
3. **Accessibility**: Include ARIA attributes and keyboard support
4. **Performance**: Consider virtualization for large datasets
5. **Testing**: Write unit tests for all functionality
6. **Documentation**: Update this documentation for new features

### Code Style

Follow the project's ESLint and Prettier configurations:

```typescript
// ✅ Good
interface ComponentProps {
  /** Description of the prop */
  data: DataType[];
  /** Callback when item is selected */
  onSelect?: (id: string) => void;
}

// ❌ Bad
interface ComponentProps {
  data: any;
  onSelect: Function;
}
```

## Troubleshooting

### Common Issues

1. **Performance**: Enable virtualization for large lists
2. **Styling**: Check CSS custom property definitions
3. **Types**: Ensure proper TypeScript configuration
4. **Memory**: Use React DevTools Profiler to identify leaks

### Debug Mode

Enable debug mode for additional logging:

```tsx
<IntelReportList
  reports={reports}
  debug={process.env.NODE_ENV === 'development'}
/>
```

## Changelog

### v1.0.0 (Current)
- ✅ Initial implementation of all Interactive components
- ✅ Complete TypeScript integration
- ✅ CSS Modules with responsive design
- ✅ Accessibility compliance (WCAG 2.1 AA)
- ✅ Performance optimization with virtualization
- ✅ Comprehensive documentation and examples

---

*This documentation is part of the Intel Reports 3D Development project. For questions or contributions, please refer to the main project documentation.*
