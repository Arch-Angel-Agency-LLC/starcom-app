# Types Documentation

TypeScript type definitions provide comprehensive type safety and documentation for the NetRunner application. Types are organized by domain and functionality.

## Type Categories

### Crawler Types (`crawler.types.ts`)
Types related to web crawling and reconnaissance operations.

### Intelligence Types (`intelligence.types.ts`)
Types for intelligence data processing and analysis.

### Navigation Types (`navigation.types.ts`)
Types for target navigation and session management.

### AI Agent Types (`ai-agent.types.ts`)
Types for AI agent control and automation.

## Type System Architecture

### Core Type Patterns

#### Generic Response Type
```typescript
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error' | 'pending';
  message?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}
```

#### State Management Types
```typescript
interface StateManager<T> {
  current: T;
  previous: T | null;
  history: T[];
  update: (newState: Partial<T>) => void;
  reset: () => void;
}
```

#### Configuration Types
```typescript
interface ComponentConfig {
  id: string;
  name: string;
  version: string;
  settings: Record<string, any>;
  permissions: Permission[];
}
```

## Type Safety Strategy

### Strict Type Checking
- No `any` types in production code
- Comprehensive union types for states
- Proper null/undefined handling
- Generic type constraints

### Type Guards
```typescript
const isValidUrl = (url: unknown): url is string => {
  return typeof url === 'string' && /^https?:\/\//.test(url);
};

const isCrawlResult = (data: unknown): data is CrawlResult => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'targetUrl' in data &&
    'discoveredUrls' in data
  );
};
```

### Branded Types
```typescript
type TargetId = string & { readonly brand: unique symbol };
type SessionId = string & { readonly brand: unique symbol };
type AgentId = string & { readonly brand: unique symbol };
```

## Enumeration Strategy

### String Enums for External APIs
```typescript
enum ApiStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}
```

### Const Assertions for Internal Types
```typescript
const PriorityLevels = ['low', 'medium', 'high', 'critical'] as const;
type PriorityLevel = typeof PriorityLevels[number];
```

## Interface Design Patterns

### Extensible Interfaces
```typescript
interface BaseConfig {
  id: string;
  name: string;
}

interface CrawlerConfig extends BaseConfig {
  maxDepth: number;
  maxUrls: number;
}

interface ScannerConfig extends BaseConfig {
  timeout: number;
  retries: number;
}
```

### Conditional Types
```typescript
type ConfigurableComponent<T extends ComponentType> = 
  T extends 'crawler' ? CrawlerConfig :
  T extends 'scanner' ? ScannerConfig :
  BaseConfig;
```

### Utility Types
```typescript
// Make specific properties optional
type PartialConfig<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Extract specific property types
type ConfigValues<T> = T extends { settings: infer S } ? S : never;

// Create readonly versions
type ReadonlyConfig<T> = {
  readonly [K in keyof T]: T[K] extends object ? ReadonlyConfig<T[K]> : T[K];
};
```

## Type Documentation Standards

### JSDoc Integration
```typescript
/**
 * Represents a crawl target with priority and discovery metadata
 * @interface CrawlTarget
 * @property url - The target URL to crawl
 * @property priority - The priority level for processing
 * @property source - How this target was discovered
 * @example
 * ```typescript
 * const target: CrawlTarget = {
 *   url: 'https://example.com',
 *   priority: 'high',
 *   source: 'robots'
 * };
 * ```
 */
interface CrawlTarget {
  /** The target URL to crawl */
  url: string;
  /** The priority level for processing */
  priority: PriorityLevel;
  /** How this target was discovered */
  source: DiscoverySource;
}
```

### Type Validation
```typescript
// Runtime type validation
const validateCrawlTarget = (data: unknown): CrawlTarget => {
  if (!isCrawlTarget(data)) {
    throw new TypeError('Invalid CrawlTarget format');
  }
  return data;
};
```

## Migration Strategy

### Version Compatibility
```typescript
// Version-aware type definitions
interface CrawlResultV1 {
  version: '1.0';
  urls: string[];
}

interface CrawlResultV2 {
  version: '2.0';
  targets: CrawlTarget[];
  intelligence: IntelligenceData;
}

type CrawlResult = CrawlResultV1 | CrawlResultV2;
```

### Deprecation Handling
```typescript
/**
 * @deprecated Use CrawlTarget instead
 * @see CrawlTarget
 */
interface LegacyTarget {
  url: string;
}
```

## Testing Type Safety

### Type Testing
```typescript
// Test type inference
const testTypeInference = () => {
  const result = crawlService.getCrawlResult();
  // TypeScript should infer result as CrawlResult
  expectType<CrawlResult>(result);
};

// Test type guards
const testTypeGuards = () => {
  const data: unknown = { url: 'https://example.com' };
  if (isCrawlTarget(data)) {
    // data is now typed as CrawlTarget
    expectType<CrawlTarget>(data);
  }
};
```

### Runtime Validation
```typescript
describe('Type Validation', () => {
  test('should validate CrawlTarget correctly', () => {
    const validTarget = {
      url: 'https://example.com',
      priority: 'high' as const,
      source: 'robots' as const
    };
    
    expect(isCrawlTarget(validTarget)).toBe(true);
    expect(() => validateCrawlTarget(validTarget)).not.toThrow();
  });
  
  test('should reject invalid CrawlTarget', () => {
    const invalidTarget = { url: 123 };
    
    expect(isCrawlTarget(invalidTarget)).toBe(false);
    expect(() => validateCrawlTarget(invalidTarget)).toThrow();
  });
});
```

## Best Practices

### Naming Conventions
- Use PascalCase for types and interfaces
- Use camelCase for properties
- Use SCREAMING_SNAKE_CASE for constants
- Prefix interfaces with 'I' only when needed for disambiguation

### Type Organization
- Group related types in the same file
- Export only public types
- Use index files for public API
- Document complex type relationships

### Performance Considerations
- Avoid deep recursive types
- Use branded types sparingly
- Prefer interfaces over type aliases for objects
- Use conditional types judiciously
