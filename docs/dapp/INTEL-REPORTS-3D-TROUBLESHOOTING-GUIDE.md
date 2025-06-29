# Intel Reports 3D Troubleshooting Guide

## Overview

This guide covers common issues, solutions, and best practices for working with Intel Reports 3D components.

## Table of Contents

1. [Common Migration Issues](#common-migration-issues)
2. [Component Issues](#component-issues)
3. [Performance Issues](#performance-issues)
4. [Build and Development Issues](#build-and-development-issues)
5. [Type and Lint Issues](#type-and-lint-issues)
6. [Integration Issues](#integration-issues)
7. [Best Practices](#best-practices)

## Common Migration Issues

### Issue: Legacy import errors after migration

**Symptoms**:
```
Module not found: Can't resolve '../components/Intel/IntelReportList'
```

**Solution**:
1. Update imports to use new components:
```typescript
// Old
import { IntelReportList } from '../components/Intel/IntelReportList';

// New
import { IntelReportList } from '../components/IntelReports3D/Interactive';
```

2. Ensure legacy files are properly removed:
```bash
find src -name "*IntelReportList*" -type f
```

### Issue: Type compatibility errors

**Symptoms**:
```
Type 'LegacyMarkerData[]' is not assignable to type 'IntelReport3DData[]'
```

**Solution**:
Use the type compatibility layer:
```typescript
import { convertLegacyArrayToIntelReport3D } from '../utils/legacyTypeCompatibility';

const intelReports = convertLegacyArrayToIntelReport3D(legacyMarkers);
```

### Issue: Missing required props

**Symptoms**:
```
Property 'reports' is missing in type but required
```

**Solution**:
Check the new component's prop interface and provide required props:
```typescript
<IntelReportList
  reports={reports} // Required
  onReportClick={handleClick} // Optional but recommended
/>
```

## Component Issues

### Issue: Components not rendering

**Symptoms**:
- Blank screen or empty container
- No error messages

**Solution**:
1. Check if reports data is properly provided:
```typescript
console.log('Reports data:', reports);
```

2. Verify data structure matches expected format:
```typescript
const isValidReport = (report: any): report is IntelReport3DData => {
  return report && 
         typeof report.id === 'string' &&
         typeof report.title === 'string' &&
         report.location &&
         typeof report.location.lat === 'number' &&
         typeof report.location.lng === 'number';
};
```

3. Add error boundaries to catch rendering errors:
```typescript
import { IntelReports3DErrorBoundary } from '../components/IntelReports3D/Core';

<IntelReports3DErrorBoundary>
  <IntelReportList reports={reports} />
</IntelReports3DErrorBoundary>
```

### Issue: Styling not applied correctly

**Symptoms**:
- Components look unstyled or different from expected
- CSS classes not working

**Solution**:
1. Import CSS modules correctly:
```typescript
import styles from './IntelReportList.module.css';
```

2. Apply custom styles:
```typescript
<IntelReportList 
  className="your-custom-class"
  reports={reports}
/>
```

3. Check CSS module configuration in Vite/Webpack:
```typescript
// vite.config.ts
export default {
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  }
}
```

### Issue: Click handlers not working

**Symptoms**:
- No response to clicks
- Console errors about undefined functions

**Solution**:
1. Ensure handlers are properly defined:
```typescript
const handleReportClick = useCallback((report: IntelReport3DData) => {
  console.log('Report clicked:', report);
  // Your logic here
}, []);

<IntelReportList
  reports={reports}
  onReportClick={handleReportClick}
/>
```

2. Check for event propagation issues:
```typescript
const handleClick = (report: IntelReport3DData, event: React.MouseEvent) => {
  event.stopPropagation();
  // Handle click
};
```

## Performance Issues

### Issue: Slow rendering with large datasets

**Symptoms**:
- Long loading times
- UI freezing
- High memory usage

**Solution**:
1. Enable virtualization for large datasets:
```typescript
<IntelReportList
  reports={reports}
  virtualized={reports.length > 1000}
  variant="compact"
/>
```

2. Implement pagination:
```typescript
const [currentPage, setCurrentPage] = useState(1);
const pageSize = 100;
const paginatedReports = reports.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
);
```

3. Use React.memo for expensive components:
```typescript
const MemoizedIntelReportCard = React.memo(IntelReportCard);
```

### Issue: Memory leaks

**Symptoms**:
- Increasing memory usage over time
- Browser becoming unresponsive

**Solution**:
1. Clean up subscriptions and event listeners:
```typescript
useEffect(() => {
  const subscription = intelService.subscribe(handleUpdate);
  return () => subscription.unsubscribe();
}, []);
```

2. Use proper dependency arrays in useEffect:
```typescript
useEffect(() => {
  // Effect logic
}, [specificDependency]); // Not empty array or missing deps
```

3. Implement proper data cleanup:
```typescript
const [reports, setReports] = useState<IntelReport3DData[]>([]);

const clearReports = useCallback(() => {
  setReports([]);
}, []);
```

### Issue: Slow filtering and searching

**Symptoms**:
- Delays when typing in search
- UI blocking during filter operations

**Solution**:
1. Use debounced search:
```typescript
import { useIntelSearch } from '../hooks';

const { query, debouncedQuery, setQuery } = useIntelSearch(300);
```

2. Optimize filter functions:
```typescript
const filteredReports = useMemo(() => {
  return reports.filter(report => {
    // Optimized filter logic
    if (filters.priority && !filters.priority.includes(report.priority)) {
      return false;
    }
    // ... other filters
    return true;
  });
}, [reports, filters]);
```

3. Use Web Workers for heavy computations:
```typescript
// For very large datasets, consider using Web Workers
const worker = new Worker('/path/to/filter-worker.js');
worker.postMessage({ reports, filters });
```

## Build and Development Issues

### Issue: Build fails with TypeScript errors

**Symptoms**:
```
error TS2322: Type 'X' is not assignable to type 'Y'
```

**Solution**:
1. Fix type mismatches:
```typescript
// Ensure proper typing
const reports: IntelReport3DData[] = convertedData;
```

2. Use type assertions when necessary (carefully):
```typescript
const report = legacyData as unknown as IntelReport3DData;
```

3. Update TypeScript configuration:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Issue: Module resolution errors

**Symptoms**:
```
Cannot resolve module '../components/IntelReports3D/Interactive'
```

**Solution**:
1. Check file paths and ensure files exist:
```bash
ls -la src/components/IntelReports3D/Interactive/
```

2. Verify index.ts exports:
```typescript
// src/components/IntelReports3D/Interactive/index.ts
export { IntelReportList } from './IntelReportList';
export { IntelReportCard } from './IntelReportCard';
// ... other exports
```

3. Check TypeScript path mapping:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Issue: CSS modules not working

**Symptoms**:
- Styles not applied
- Class names not resolved

**Solution**:
1. Ensure CSS modules are enabled:
```typescript
// vite.config.ts
export default {
  css: {
    modules: {
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    }
  }
}
```

2. Use correct import syntax:
```typescript
import styles from './Component.module.css';

<div className={styles.container}>
```

## Type and Lint Issues

### Issue: ESLint errors after migration

**Symptoms**:
- Unused variable warnings
- Import order issues
- React hooks warnings

**Solution**:
1. Fix unused imports:
```typescript
// Remove unused imports
import { IntelReportList } from '../components/IntelReports3D/Interactive';
```

2. Fix hooks rules violations:
```typescript
// Ensure hooks are called in correct order
const [reports, setReports] = useState<IntelReport3DData[]>([]);
const filteredReports = useMemo(() => filterReports(reports), [reports]);
```

3. Update ESLint configuration if needed:
```json
{
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

### Issue: Strict mode warnings

**Symptoms**:
- Development warnings about deprecated features
- Potential side effects in useEffect

**Solution**:
1. Fix useEffect dependencies:
```typescript
useEffect(() => {
  fetchReports();
}, []); // Add proper dependencies
```

2. Use cleanup functions:
```typescript
useEffect(() => {
  const controller = new AbortController();
  
  fetchReports(controller.signal);
  
  return () => controller.abort();
}, []);
```

## Integration Issues

### Issue: Context not available

**Symptoms**:
```
Cannot read properties of undefined (reading 'reports')
```

**Solution**:
1. Ensure context provider wraps components:
```typescript
<IntelReports3DProvider>
  <YourComponent />
</IntelReports3DProvider>
```

2. Use context hooks correctly:
```typescript
const { reports, loading } = useIntelReports3D();
```

### Issue: Props not passed correctly

**Symptoms**:
- Components not receiving expected data
- Callback functions not working

**Solution**:
1. Check prop drilling:
```typescript
// Parent
<ChildComponent 
  reports={reports}
  onReportClick={handleReportClick}
/>

// Child
interface ChildProps {
  reports: IntelReport3DData[];
  onReportClick: (report: IntelReport3DData) => void;
}
```

2. Use React DevTools to inspect props:
- Install React DevTools browser extension
- Check component props in the tree

## Best Practices

### Code Organization

1. **Component Structure**:
```
src/components/IntelReports3D/
├── Core/           # Base components and providers
├── Interactive/    # Interactive UI components
├── HUD/           # HUD integration components
├── Visualization/ # 3D visualization components
└── index.ts       # Main exports
```

2. **Hook Organization**:
```
src/hooks/
├── useIntelReports3D.ts
├── useIntelSelection.ts
├── useIntelFilters.ts
└── index.ts
```

3. **Utility Organization**:
```
src/utils/
├── legacyTypeCompatibility.ts
├── filterUtils.ts
├── searchUtils.ts
└── exportUtils.ts
```

### Performance Optimization

1. **Memoization**:
```typescript
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => 
    expensiveCalculation(data), [data]
  );
  
  return <div>{processedData}</div>;
});
```

2. **Lazy Loading**:
```typescript
const LazyIntelDetailPanel = React.lazy(() => 
  import('./IntelDetailPanel')
);
```

3. **Code Splitting**:
```typescript
// Route-based splitting
const IntelReportsPage = React.lazy(() => 
  import('../pages/IntelReportsPage')
);
```

### Error Handling

1. **Error Boundaries**:
```typescript
<IntelReports3DErrorBoundary>
  <IntelReportList reports={reports} />
</IntelReports3DErrorBoundary>
```

2. **Graceful Degradation**:
```typescript
const SafeIntelReportList: React.FC<Props> = ({ reports, ...props }) => {
  if (!reports || reports.length === 0) {
    return <EmptyState message="No reports available" />;
  }
  
  return <IntelReportList reports={reports} {...props} />;
};
```

3. **Error Logging**:
```typescript
const handleError = (error: Error, errorInfo: ErrorInfo) => {
  console.error('Intel Reports 3D Error:', error);
  // Send to error reporting service
};
```

### Testing

1. **Unit Tests**:
```typescript
import { render, screen } from '@testing-library/react';
import { IntelReportList } from './IntelReportList';

test('renders report list', () => {
  const mockReports = [/* mock data */];
  render(<IntelReportList reports={mockReports} />);
  
  expect(screen.getByText('Reports')).toBeInTheDocument();
});
```

2. **Integration Tests**:
```typescript
test('filtering works correctly', async () => {
  const { user } = renderWithProviders(<IntelReportsApp />);
  
  await user.type(screen.getByPlaceholderText('Search...'), 'test');
  
  expect(screen.getByText('Filtered results')).toBeInTheDocument();
});
```

## Getting Additional Help

If you encounter issues not covered in this guide:

1. **Check Documentation**:
   - [API Documentation](./INTEL-REPORTS-3D-API-DOCUMENTATION.md)
   - [Migration Guide](./INTEL-REPORTS-3D-MIGRATION-GUIDE.md)
   - [Development Progress](./INTEL-REPORTS-3D-DEVELOPMENT-PROGRESS.md)

2. **Debug Tools**:
   - React DevTools
   - Chrome DevTools Performance tab
   - TypeScript compiler with `--noEmit`

3. **Code Examples**:
   - Check `IntegrationExample.tsx` for working examples
   - Review test files for usage patterns

4. **Common Commands**:
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Run linting
npm run lint

# Build production version
npm run build

# Run performance test
node scripts/performance-test.js
```

---

**Troubleshooting Guide Version**: 1.0  
**Last Updated**: January 27, 2025  
**Compatibility**: Intel Reports 3D v4.4+
