# OSINT Error Handling Development Guide

## Introduction

This guide documents the standardized error handling patterns implemented in the OSINT Cyber Investigation Suite. Following these patterns ensures consistent error handling, improved user experience, and better debugging capabilities throughout the application.

## Error Types and Definitions

All error types are defined in `/dapp/src/pages/OSINT/types/errors.ts` and include:

### Core Types
- `ErrorSeverity`: 'info' | 'warning' | 'error' | 'critical'
- `ErrorCategory`: Categorizes the error (network, authentication, data, etc.)
- `ErrorCode`: Specific error codes for different scenarios
- `ErrorDetail`: The main error interface with comprehensive details

### ErrorDetail Structure

```typescript
interface ErrorDetail {
  // Basic error information
  message: string;            // Human-readable error message
  code?: ErrorCode;           // Error code
  category?: ErrorCategory;   // Error category
  severity?: ErrorSeverity;   // Error severity
  
  // Context information
  operation?: string;         // Operation that failed
  component?: string;         // Component where error occurred
  timestamp: string;          // When the error occurred
  
  // Debugging information
  originalError?: Error;      // Original error object
  stack?: string;             // Stack trace
  
  // Recovery information
  recoverable: boolean;       // Whether error is recoverable
  retryable: boolean;         // Whether operation can be retried
  retryCount?: number;        // Number of retry attempts
  retryAfter?: number;        // Milliseconds to wait before retry
  userActions?: string[];     // Suggested user actions
  
  // Additional data
  context?: Record<string, unknown>; // Additional context
}
```

## Implementation Patterns

### 1. Service Layer Pattern

Services should follow this pattern for error handling:

```typescript
async function serviceMethod(...args): Promise<{ data?: ResultType; error?: ErrorDetail }> {
  try {
    // Perform operation
    const result = await someAsyncOperation(...args);
    
    // Return success result
    return { data: result };
  } catch (error) {
    // Log error
    console.error('Error in serviceMethod:', error);
    
    // Return structured error
    return {
      error: createErrorDetail(
        ErrorUtils.getErrorMessage(error) || 'Default error message',
        {
          code: 'ERROR_CODE',
          category: 'error-category',
          severity: 'error',
          operation: 'serviceMethod',
          originalError: error instanceof Error ? error : undefined,
          retryable: true,
          userActions: [
            'Suggested action 1',
            'Suggested action 2'
          ]
        }
      )
    };
  }
}
```

### 2. React Hook Pattern

Hooks should manage loading states per operation and implement retry logic:

```typescript
const [loading, setLoading] = useState<Record<string, boolean>>({});
const [error, setError] = useState<ErrorDetail | null>(null);

const someOperation = useCallback(async (args, options: { retryCount?: number } = {}) => {
  const retryCount = options.retryCount || 0;
  const maxRetries = 3;
  
  // Set loading state for specific operation
  setLoading(prev => ({ ...prev, operationName: true }));
  setError(null);
  
  try {
    const response = await serviceMethod(args);
    
    if (response.error) {
      // Implement retry logic with exponential backoff
      if (response.error.retryable && retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Clear loading for this operation before retry
        setLoading(prev => ({ ...prev, operationName: false }));
        
        // Retry with incremented retry count
        return someOperation(args, { retryCount: retryCount + 1 });
      }
      
      // Set error if retries exhausted
      setError(response.error);
      return null;
    }
    
    return response.data;
  } catch (err) {
    console.error('Error in someOperation:', err);
    return null;
  } finally {
    // Always clear loading state
    setLoading(prev => ({ ...prev, operationName: false }));
  }
}, []);

// Helper function to check if any operation is loading
const isLoading = useCallback((operation?: string): boolean => {
  if (operation) {
    return loading[operation] || false;
  }
  return Object.values(loading).some(value => value);
}, [loading]);
```

### 3. UI Component Pattern

Components should use the ErrorDisplay component for consistent error presentation:

```tsx
// Import the error display component
import ErrorDisplay from '../common/ErrorDisplay';

// In your component render method
if (isLoading('operation')) {
  return <LoadingIndicator />;
}

if (error) {
  return (
    <ErrorDisplay
      error={error}
      onRetry={() => retryOperation(...)}
      onDismiss={() => clearError()}
    />
  );
}

// Render normal content
return <YourNormalContent />;
```

## Error Display Component

The `ErrorDisplay` component provides consistent error visualization:

- Displays error message, severity, and category
- Shows operation name that failed
- Provides retry button for retryable errors
- Lists suggested user actions
- Allows errors to be dismissed

## Retry Mechanism

Implement retry with exponential backoff for transient errors:

1. Start with a base delay (e.g., 1000ms)
2. For each retry, multiply delay by 2^retryCount
3. Cap maximum delay (e.g., 8000ms)
4. Track retry count to prevent infinite retries

## Testing Error Scenarios

When writing tests, be sure to test:

1. Happy path scenarios
2. Various error conditions
3. Retry behavior
4. Error state in UI components
5. Error recovery flows

## Guidelines for Adding New Components

1. Define possible errors in the service layer
2. Return structured error details
3. Handle errors appropriately in hooks
4. Display errors consistently in UI
5. Provide meaningful recovery actions

## Example Implementation

See the following files for reference implementations:

- Services:
  - `/dapp/src/pages/OSINT/services/darkweb/darkWebService.ts`
  - `/dapp/src/pages/OSINT/services/graph/graphService.ts`
  - `/dapp/src/pages/OSINT/services/blockchain/blockchainService.ts`
  - `/dapp/src/pages/OSINT/services/map/mapService.ts`
  - `/dapp/src/pages/OSINT/services/timeline/timelineService.ts`

- Hooks:
  - `/dapp/src/pages/OSINT/hooks/useDarkWebMonitoring.ts`
  - `/dapp/src/pages/OSINT/hooks/useEntityGraph.ts`
  - `/dapp/src/pages/OSINT/hooks/useBlockchainAnalysis.ts`
  - `/dapp/src/pages/OSINT/hooks/useMapData.ts`
  - `/dapp/src/pages/OSINT/hooks/useTimelineAnalysis.ts`

- UI Panels:
  - `/dapp/src/pages/OSINT/components/panels/DarkWebPanel.tsx`
  - `/dapp/src/pages/OSINT/components/panels/GraphPanel.tsx`
  - `/dapp/src/pages/OSINT/components/panels/BlockchainPanel.tsx`
  - `/dapp/src/pages/OSINT/components/panels/MapPanel.tsx`
  - `/dapp/src/pages/OSINT/components/panels/TimelinePanel.tsx`
  - `/dapp/src/pages/OSINT/components/panels/ResultsPanel.tsx`

## Recent Updates

The following components have been updated with the standardized error handling pattern:

- Graph visualization services and components
- Blockchain analysis services and components
- Map and geospatial services and components
- Results panel with improved filter indicators and error handling

### ResultsPanel Enhancements

The `ResultsPanel` component now features:

1. **Comprehensive Error Display**: Integrates the `ErrorDisplay` component to show detailed error information with retry options.
2. **Informative Filter Indicators**: Filter buttons now show result counts and tooltips for better usability.
3. **Enhanced Service Error Handling**: The search service now properly throws errors to be caught and handled by the hook.
4. **Operation-Specific Loading States**: Tracks loading states for different operations (search, loading history).
5. **Consistent Pattern**: Follows the same pattern as other panels for uniform user experience.

Reference implementation:
```tsx
// Inside ResultsPanel.tsx
{error ? (
  <div className={styles.errorWrapper}>
    <ErrorDisplay 
      error={error}
      onRetry={retryLastOperation}
      onDismiss={clearError}
    />
  </div>
) : loading ? (
  <div className={styles.loading}>
    <div className={styles.loadingSpinner}></div>
    <p>Searching intelligence sources...</p>
  </div>
) : (
  // Normal content rendering
)}
```
