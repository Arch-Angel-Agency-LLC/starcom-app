# OSINT Error Handling Technical Guide

**Project**: Starcom dApp - Earth Alliance OSINT Cyber Investigation Suite  
**Created**: July 4, 2025  
**Status**: Technical Guide  
**Last Updated**: July 4, 2025

## 1. Overview

This document provides technical guidance for implementing and using the standardized error handling system in the OSINT module. Following these patterns will ensure consistent error handling across the codebase and improve the user experience when errors occur.

## 2. Error Types and Utilities

### 2.1 Core Error Types

All error types are defined in `/src/pages/OSINT/types/errors.ts`:

```typescript
// Error severity levels
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

// Error categories
export type ErrorCategory = 
  | 'network'        // Network-related errors
  | 'authentication' // Authentication/authorization errors
  | 'data'           // Data-related errors
  | 'security'       // Security-related errors
  | 'api'            // API-related errors
  | 'timeout'        // Timeout errors
  | 'validation'     // Input validation errors
  | 'server'         // Server-side errors
  | 'client'         // Client-side errors
  | 'unknown';       // Unknown errors

// Error codes
export type ErrorCode = 
  | 'NETWORK_DISCONNECTED'
  | 'REQUEST_TIMEOUT'
  | 'SERVER_ERROR'
  | 'API_ERROR'
  | 'AUTHENTICATION_REQUIRED'
  | 'AUTHENTICATION_EXPIRED'
  | 'INVALID_DATA'
  | 'DATA_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMITED'
  | 'SECURITY_RISK'
  | 'UNEXPECTED_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'RETRY_FAILED'
  | 'OPERATION_ABORTED';

// Detailed error information
export interface ErrorDetail {
  message: string;            // Human-readable error message
  code?: ErrorCode;           // Error code
  category?: ErrorCategory;   // Error category
  severity?: ErrorSeverity;   // Error severity
  operation?: string;         // Operation that failed
  component?: string;         // Component where error occurred
  timestamp: string;          // When the error occurred
  originalError?: Error;      // Original error object
  stack?: string;             // Stack trace
  recoverable: boolean;       // Whether error is recoverable
  retryable: boolean;         // Whether operation can be retried
  retryCount?: number;        // Number of retry attempts
  retryAfter?: number;        // Milliseconds to wait before retry
  userActions?: string[];     // Suggested user actions
  context?: Record<string, unknown>; // Additional context
}
```

### 2.2 Error Utilities

The `ErrorUtils` object provides helper functions for working with errors:

```typescript
export const ErrorUtils = {
  // Get human-readable message from any error type
  getErrorMessage(error: unknown): string,
  
  // Determine error category from error
  getErrorCategory(error: unknown): ErrorCategory,
  
  // Create user-friendly message based on error
  createUserFriendlyMessage(error: unknown): string
};
```

### 2.3 Error Creation

Use the `createErrorDetail` function to create standardized error objects:

```typescript
// Create a detailed error object
export function createErrorDetail(
  message: string,
  options: Partial<Omit<ErrorDetail, 'message' | 'timestamp'>> = {}
): ErrorDetail;
```

## 3. Implementation Patterns

### 3.1 Service Layer Implementation

Services should implement error handling with retry logic:

```typescript
// Example service method with error handling
async function fetchData(id: string): Promise<DataType> {
  return executeWithRetry(
    async () => {
      try {
        const response = await api.get(`/data/${id}`);
        return response.data;
      } catch (error) {
        // Transform API errors to our error format
        if (axios.isAxiosError(error)) {
          const category = error.response?.status === 404 ? 'data' : 
                           error.response?.status === 401 ? 'authentication' : 
                           error.response?.status >= 500 ? 'server' : 'api';
                           
          throw createErrorDetail(
            error.response?.data?.message || error.message,
            {
              category,
              code: mapHttpStatusToErrorCode(error.response?.status),
              component: 'dataService',
              operation: 'fetchData',
              originalError: error,
              recoverable: error.response?.status !== 401,
              retryable: error.response?.status >= 500
            }
          );
        }
        
        // Rethrow other errors
        throw error;
      }
    },
    { 
      retries: 3, 
      baseDelay: 300, 
      operationName: 'fetchData' 
    }
  );
}
```

### 3.2 React Hook Implementation

Hooks should manage error state and provide error handling:

```typescript
function useDataHook() {
  const [data, setData] = useState<DataType | null>(null);
  const [error, setError] = useState<ErrorDetail | null>(null);
  const [loadingOperations, setLoadingOperations] = useState<Set<string>>(new Set());
  
  // Helper to set loading state for an operation
  const setOperationLoading = useCallback((operation: string, isLoading: boolean) => {
    setLoadingOperations(prev => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(operation);
      } else {
        newSet.delete(operation);
      }
      return newSet;
    });
  }, []);
  
  // Computed loading state
  const isLoading = loadingOperations.size > 0;
  
  // Error handling helper
  const handleError = useCallback((error: unknown, operation: string): ErrorDetail => {
    const errorDetail = createErrorDetail(
      ErrorUtils.getErrorMessage(error),
      {
        category: ErrorUtils.getErrorCategory(error),
        operation,
        component: 'useDataHook',
        originalError: error instanceof Error ? error : undefined,
        recoverable: true,
        retryable: true
      }
    );
    
    setError(errorDetail);
    return errorDetail;
  }, []);
  
  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Example data fetching function
  const fetchData = useCallback(async (id: string) => {
    setOperationLoading('fetchData', true);
    clearError();
    
    try {
      const result = await dataService.fetchData(id);
      setData(result);
      return result;
    } catch (error) {
      handleError(error, 'fetchData');
      return null;
    } finally {
      setOperationLoading('fetchData', false);
    }
  }, [clearError, handleError, setOperationLoading]);
  
  return {
    data,
    isLoading,
    error,
    clearError,
    fetchData
  };
}
```

### 3.3 UI Component Implementation

Components should render different states based on error and loading:

```tsx
function DataComponent() {
  const { data, isLoading, error, clearError, fetchData } = useDataHook();
  
  // Handle initial load
  useEffect(() => {
    fetchData('initial-id');
  }, [fetchData]);
  
  if (isLoading && !data) {
    return <LoadingSpinner message="Loading data..." />;
  }
  
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onDismiss={clearError}
        onRetry={() => error.retryable && fetchData('initial-id')}
      />
    );
  }
  
  if (!data) {
    return <EmptyState message="No data available" />;
  }
  
  return (
    <div>
      {/* Render data */}
      {isLoading && <BackgroundLoader message="Refreshing..." />}
    </div>
  );
}
```

## 4. Error Display Component

The `ErrorDisplay` component provides consistent error visualization:

```tsx
interface ErrorDisplayProps {
  error: ErrorDetail;
  onDismiss: () => void;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onDismiss, onRetry }) => {
  // Implementation details
  return (
    <div className={`${styles.errorContainer} ${getCategoryClass(error.category)}`}>
      <div className={styles.errorHeader}>
        {getIconForSeverity(error.severity)}
        <span className={styles.errorTitle}>
          {error.code || (error.category ? `${error.category.toUpperCase()} Error` : 'Error')}
        </span>
        <button className={styles.dismissButton} onClick={onDismiss}>
          <X size={14} />
        </button>
      </div>
      <div className={styles.errorMessage}>
        {error.message}
      </div>
      {error.userActions && error.userActions.length > 0 && (
        <div className={styles.errorActions}>
          <span className={styles.actionTitle}>Suggested Actions:</span>
          <ul className={styles.actionList}>
            {error.userActions.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
      )}
      {error.retryable && onRetry && (
        <div className={styles.retryContainer}>
          <button 
            className={styles.retryButton}
            onClick={onRetry}
          >
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
          {error.retryCount && error.retryCount > 0 && (
            <span className={styles.retryInfo}>
              Previous attempts: {error.retryCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
```

## 5. Retry Logic

The `executeWithRetry` utility implements exponential backoff:

```typescript
// Generic retry function for any async operation
export async function executeWithRetry<T>(
  operation: () => Promise<T>, 
  options: {
    retries?: number;
    baseDelay?: number;
    maxDelay?: number;
    operationName?: string;
  } = {}
): Promise<T> {
  const { 
    retries = 3, 
    baseDelay = 300, 
    maxDelay = 3000,
    operationName = 'unknown'
  } = options;
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt < retries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't wait on the last attempt
      if (attempt < retries) {
        const delay = Math.min(
          maxDelay,
          baseDelay * Math.pow(2, attempt) * (0.8 + Math.random() * 0.4)
        );
        
        console.warn(
          `[Retry] Operation ${operationName} failed, retrying in ${delay.toFixed(0)}ms ` +
          `(attempt ${attempt + 1}/${retries})`
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
```

## 6. HTTP Status Code Mapping

Map HTTP status codes to our standardized error codes:

```typescript
// Map HTTP status codes to error codes
export function mapHttpStatusToErrorCode(status?: number): ErrorCode {
  if (!status) return 'NETWORK_DISCONNECTED';
  
  switch (status) {
    case 400: return 'INVALID_DATA';
    case 401: return 'AUTHENTICATION_REQUIRED';
    case 403: return 'PERMISSION_DENIED';
    case 404: return 'DATA_NOT_FOUND';
    case 408: return 'REQUEST_TIMEOUT';
    case 429: return 'RATE_LIMITED';
    case 500: return 'SERVER_ERROR';
    case 502:
    case 503:
    case 504: return 'SERVICE_UNAVAILABLE';
    default: return 'API_ERROR';
  }
}
```

## 7. Testing Error Handling

### 7.1 Service Tests

Test error handling in services:

```typescript
describe('dataService', () => {
  it('should handle 404 errors correctly', async () => {
    // Mock API to return 404
    mockApiClient.get.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 404, data: { message: 'Not found' } }
    });
    
    try {
      await dataService.fetchData('non-existent');
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toHaveProperty('category', 'data');
      expect(error).toHaveProperty('code', 'DATA_NOT_FOUND');
      expect(error).toHaveProperty('recoverable', true);
    }
  });
  
  it('should retry on server errors', async () => {
    // Mock API to fail twice then succeed
    mockApiClient.get
      .mockRejectedValueOnce({ 
        isAxiosError: true, 
        response: { status: 500 } 
      })
      .mockRejectedValueOnce({ 
        isAxiosError: true, 
        response: { status: 500 } 
      })
      .mockResolvedValueOnce({ data: { id: '123', name: 'Test' } });
    
    const result = await dataService.fetchData('123');
    
    expect(result).toEqual({ id: '123', name: 'Test' });
    expect(mockApiClient.get).toHaveBeenCalledTimes(3);
  });
});
```

### 7.2 Hook Tests

Test error handling in hooks:

```typescript
describe('useDataHook', () => {
  it('should set error state when fetch fails', async () => {
    // Mock service to throw error
    mockDataService.fetchData.mockRejectedValueOnce(
      createErrorDetail('Data not found', { 
        code: 'DATA_NOT_FOUND', 
        category: 'data' 
      })
    );
    
    const { result } = renderHook(() => useDataHook());
    
    await act(async () => {
      await result.current.fetchData('123');
    });
    
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe('DATA_NOT_FOUND');
    expect(result.current.isLoading).toBe(false);
  });
  
  it('should clear error state', async () => {
    // Setup with error
    mockDataService.fetchData.mockRejectedValueOnce(
      createErrorDetail('Test error', { code: 'API_ERROR' })
    );
    
    const { result } = renderHook(() => useDataHook());
    
    await act(async () => {
      await result.current.fetchData('123');
    });
    
    expect(result.current.error).not.toBeNull();
    
    // Clear error
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });
});
```

### 7.3 Component Tests

Test error rendering in components:

```typescript
describe('DataComponent', () => {
  it('should render error display when error occurs', async () => {
    // Mock hook to return error
    mockUseDataHook.mockReturnValue({
      data: null,
      isLoading: false,
      error: createErrorDetail('Test error', { 
        code: 'API_ERROR',
        category: 'api',
        userActions: ['Try again later']
      }),
      clearError: jest.fn(),
      fetchData: jest.fn()
    });
    
    render(<DataComponent />);
    
    expect(screen.getByText('API Error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('Try again later')).toBeInTheDocument();
  });
  
  it('should call clearError when dismiss button clicked', async () => {
    const mockClearError = jest.fn();
    
    mockUseDataHook.mockReturnValue({
      data: null,
      isLoading: false,
      error: createErrorDetail('Test error', { code: 'API_ERROR' }),
      clearError: mockClearError,
      fetchData: jest.fn()
    });
    
    render(<DataComponent />);
    
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    
    expect(mockClearError).toHaveBeenCalledTimes(1);
  });
});
```

## 8. Best Practices

1. **Always use standardized error types**: Use `ErrorDetail` instead of string messages or generic Errors
2. **Include context in errors**: Add operation name, component, and relevant context
3. **Handle all promise rejections**: Never leave async operations without try/catch
4. **Add retry for recoverable operations**: Use `executeWithRetry` for network and server operations
5. **Show helpful user actions**: Include userActions in error details for clear next steps
6. **Log errors for debugging**: Use console.error in development mode
7. **Track error metrics**: Add analytics for error occurrence and resolution
8. **Test error paths**: Include unit tests for error handling
9. **Use operation-specific loading**: Track loading by operation name for better UX
10. **Provide user-friendly messages**: Use `ErrorUtils.createUserFriendlyMessage` for display

## 9. Common Error Scenarios

| Scenario | Error Category | Error Code | Retry? | User Actions |
|----------|---------------|------------|--------|--------------|
| Network disconnected | network | NETWORK_DISCONNECTED | Yes | Check connection, Try again |
| API timeout | timeout | REQUEST_TIMEOUT | Yes | Try again, Try simpler query |
| Authentication expired | authentication | AUTHENTICATION_EXPIRED | No | Log in again |
| Invalid input | validation | INVALID_DATA | No | Check input values |
| Server error | server | SERVER_ERROR | Yes | Try again later |
| Rate limited | api | RATE_LIMITED | Yes (with delay) | Wait and try again |

## 10. Error Boundary Usage

For critical UI sections, implement React Error Boundaries:

```tsx
class ErrorBoundary extends React.Component<{
  fallback: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  children: React.ReactNode;
}> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    
    return this.props.children;
  }
}

// Usage
<ErrorBoundary
  fallback={<ErrorFallback message="Something went wrong with the data display" />}
  onError={(error) => console.error('UI Error:', error)}
>
  <DataComponent />
</ErrorBoundary>
```

## Summary

Consistent error handling is crucial for a robust application, especially for OSINT operations that rely on external data sources. By following these patterns, you can create a more resilient application that gracefully handles errors and provides users with clear information about what went wrong and how to recover.

Always remember that good error handling is about more than just preventing crashes—it's about creating a seamless user experience even when things go wrong.
