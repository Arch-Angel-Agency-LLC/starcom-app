# Utils Documentation

Utility functions provide reusable helper functions and algorithms for common operations throughout the NetRunner application. They are organized by functionality and designed for high performance and reliability.

## Utility Categories

### Prioritization Utils (`prioritization.utils.ts`)
Functions for calculating and managing priority scores and rankings.

### Classification Utils (`classification.utils.ts`)
Functions for categorizing and classifying intelligence data and targets.

### Formatting Utils (`formatting.utils.ts`)
Functions for data formatting, display, and user interface utilities.

## Utility Design Principles

### 1. **Pure Functions**
Utilities are implemented as pure functions with no side effects, making them predictable and testable.

### 2. **Performance**
Utilities are optimized for performance with efficient algorithms and data structures.

### 3. **Reusability**
Functions are designed to be reusable across different components and contexts.

### 4. **Type Safety**
Full TypeScript integration with comprehensive type definitions and validation.

### 5. **Error Handling**
Robust error handling with meaningful error messages and fallback behavior.

## Common Utility Patterns

### Error Handling Wrapper
```typescript
const safeExecute = <T, R>(
  fn: (input: T) => R,
  fallback: R
) => (input: T): R => {
  try {
    return fn(input);
  } catch (error) {
    console.warn('Utility function failed:', error);
    return fallback;
  }
};
```

### Memoization Helper
```typescript
const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};
```

### Validation Utility
```typescript
const createValidator = <T>(
  schema: ValidationSchema<T>
) => (data: unknown): data is T => {
  return validateAgainstSchema(data, schema);
};
```

## Performance Considerations

### Algorithm Selection
- Use appropriate data structures for each use case
- Implement efficient sorting and searching algorithms
- Optimize for common use cases
- Profile and benchmark utility functions

### Memory Management
- Avoid memory leaks in utility functions
- Use efficient data structures
- Clean up temporary resources
- Implement garbage collection friendly patterns

### Caching Strategy
- Implement intelligent caching for expensive operations
- Use appropriate cache invalidation strategies
- Balance memory usage with performance gains
- Provide cache configuration options

## Testing Strategy

### Unit Testing
```typescript
describe('prioritization utils', () => {
  test('should calculate priority correctly', () => {
    const target = { threatLevel: 0.8, value: 0.6 };
    const priority = calculatePriority(target);
    expect(priority).toBeGreaterThan(0);
    expect(priority).toBeLessThanOrEqual(1);
  });
  
  test('should handle edge cases', () => {
    expect(calculatePriority(null)).toBe(0);
    expect(calculatePriority({})).toBe(0);
  });
});
```

### Property-Based Testing
```typescript
import { fc } from 'fast-check';

describe('classification utils', () => {
  test('classification should be stable', () => {
    fc.assert(fc.property(
      fc.record({
        type: fc.string(),
        confidence: fc.float(0, 1)
      }),
      (data) => {
        const classification1 = classifyData(data);
        const classification2 = classifyData(data);
        expect(classification1).toEqual(classification2);
      }
    ));
  });
});
```

### Performance Testing
```typescript
describe('formatting utils performance', () => {
  test('should format large datasets efficiently', () => {
    const largeDataset = generateLargeDataset(10000);
    const startTime = performance.now();
    
    formatDataset(largeDataset);
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100); // 100ms max
  });
});
```

## Documentation Standards

### Function Documentation
```typescript
/**
 * Calculates the priority score for a target based on multiple factors
 * 
 * @param target - The target object containing factor values
 * @param weights - Optional weights for different factors
 * @returns Priority score between 0 and 1
 * 
 * @example
 * ```typescript
 * const priority = calculatePriority(
 *   { threatLevel: 0.8, value: 0.6 },
 *   { threat: 0.7, value: 0.3 }
 * );
 * console.log(priority); // 0.74
 * ```
 * 
 * @throws {ValidationError} When target data is invalid
 * @since 1.0.0
 */
export const calculatePriority = (
  target: TargetData,
  weights?: PriorityWeights
): number => {
  // Implementation
};
```

### Algorithm Documentation
```typescript
/**
 * Implements a weighted scoring algorithm for target prioritization
 * 
 * Algorithm:
 * 1. Normalize all input factors to 0-1 range
 * 2. Apply weights to each factor
 * 3. Calculate weighted sum
 * 4. Apply sigmoid function for smooth distribution
 * 
 * Time Complexity: O(n) where n is number of factors
 * Space Complexity: O(1)
 */
```

## Utility Organization

### File Structure
```
utils/
├── prioritization.utils.ts    # Priority calculation functions
├── classification.utils.ts    # Data classification functions
├── formatting.utils.ts        # Display and formatting functions
├── validation.utils.ts        # Data validation functions
├── performance.utils.ts       # Performance optimization utilities
├── string.utils.ts           # String manipulation functions
├── array.utils.ts            # Array processing functions
├── object.utils.ts           # Object manipulation functions
└── index.ts                  # Public API exports
```

### Export Strategy
```typescript
// index.ts - Public API
export * from './prioritization.utils';
export * from './classification.utils';
export * from './formatting.utils';

// Re-export with namespace for organization
export * as PriorityUtils from './prioritization.utils';
export * as ClassificationUtils from './classification.utils';
export * as FormatUtils from './formatting.utils';
```

## Best Practices

### Function Design
- Keep functions small and focused
- Use descriptive names
- Implement proper error handling
- Provide meaningful defaults
- Use TypeScript for type safety

### Performance
- Profile utility functions in realistic conditions
- Use benchmarks to validate optimizations
- Consider memory usage alongside execution time
- Implement caching where appropriate

### Maintainability
- Write comprehensive tests
- Document complex algorithms
- Use consistent coding patterns
- Implement proper error handling
- Provide usage examples
