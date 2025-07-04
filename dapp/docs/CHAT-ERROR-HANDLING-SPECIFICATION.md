# Technical Specification: Unified Error Handling and Adapter Improvements

## Overview

This document provides detailed technical specifications for implementing unified error handling and completing adapter implementations as identified in the critical action plan.

## 1. Unified Error Handling System

### 1.1 Error Type Hierarchy

```typescript
// src/lib/chat/errors/ChatErrorTypes.ts
export enum ChatErrorCode {
  // Connection errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  
  // Authentication errors
  AUTH_FAILED = 'AUTH_FAILED',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Feature support errors
  FEATURE_NOT_SUPPORTED = 'FEATURE_NOT_SUPPORTED',
  FEATURE_DEPRECATED = 'FEATURE_DEPRECATED',
  
  // Rate limiting
  RATE_LIMITED = 'RATE_LIMITED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Data validation
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  INVALID_CHANNEL = 'INVALID_CHANNEL',
  INVALID_USER = 'INVALID_USER',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Provider-specific errors
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ChatErrorSeverity {
  LOW = 'low',        // User can continue, log for debugging
  MEDIUM = 'medium',  // Show user notification, continue operation
  HIGH = 'high',      // Show error message, may need user action
  CRITICAL = 'critical' // System error, may need fallback or restart
}
```

### 1.2 Error Classes

```typescript
// src/lib/chat/errors/ChatError.ts
export interface ChatErrorContext {
  provider: string;
  operation: string;
  channelId?: string;
  messageId?: string;
  userId?: string;
  timestamp: number;
  userAgent?: string;
  networkStatus?: string;
}

export class ChatError extends Error {
  public readonly code: ChatErrorCode;
  public readonly severity: ChatErrorSeverity;
  public readonly recoverable: boolean;
  public readonly context: ChatErrorContext;
  public readonly originalError?: Error;
  public readonly retryAfter?: number; // For rate limiting

  constructor(
    code: ChatErrorCode,
    message: string,
    context: ChatErrorContext,
    options: {
      severity?: ChatErrorSeverity;
      recoverable?: boolean;
      originalError?: Error;
      retryAfter?: number;
    } = {}
  ) {
    super(message);
    this.name = 'ChatError';
    this.code = code;
    this.severity = options.severity ?? ChatErrorSeverity.MEDIUM;
    this.recoverable = options.recoverable ?? false;
    this.context = context;
    this.originalError = options.originalError;
    this.retryAfter = options.retryAfter;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      recoverable: this.recoverable,
      context: this.context,
      timestamp: Date.now(),
      stack: this.stack
    };
  }
}

// Specialized error classes
export class ChatConnectionError extends ChatError {
  constructor(message: string, context: ChatErrorContext, originalError?: Error) {
    super(ChatErrorCode.CONNECTION_FAILED, message, context, {
      severity: ChatErrorSeverity.HIGH,
      recoverable: true,
      originalError
    });
  }
}

export class ChatFeatureNotSupportedError extends ChatError {
  constructor(feature: string, provider: string, context: ChatErrorContext) {
    super(
      ChatErrorCode.FEATURE_NOT_SUPPORTED,
      `Feature '${feature}' is not supported by provider '${provider}'`,
      context,
      {
        severity: ChatErrorSeverity.LOW,
        recoverable: false
      }
    );
  }
}

export class ChatRateLimitError extends ChatError {
  constructor(message: string, context: ChatErrorContext, retryAfter: number) {
    super(ChatErrorCode.RATE_LIMITED, message, context, {
      severity: ChatErrorSeverity.MEDIUM,
      recoverable: true,
      retryAfter
    });
  }
}
```

### 1.3 Error Handler Interface

```typescript
// src/lib/chat/errors/ErrorHandler.ts
export interface ErrorHandler {
  handleError(error: ChatError): void;
  shouldRetry(error: ChatError): boolean;
  getRetryDelay(error: ChatError, attempt: number): number;
}

export class DefaultErrorHandler implements ErrorHandler {
  private logger: Logger;
  private maxRetries: number = 3;
  private baseRetryDelay: number = 1000; // 1 second

  constructor(logger: Logger) {
    this.logger = logger;
  }

  handleError(error: ChatError): void {
    switch (error.severity) {
      case ChatErrorSeverity.LOW:
        this.logger.debug('Chat error (low severity)', error.toJSON());
        break;
      case ChatErrorSeverity.MEDIUM:
        this.logger.warn('Chat error (medium severity)', error.toJSON());
        // Could trigger user notification here
        break;
      case ChatErrorSeverity.HIGH:
        this.logger.error('Chat error (high severity)', error.toJSON());
        // Should trigger user error message
        break;
      case ChatErrorSeverity.CRITICAL:
        this.logger.fatal('Critical chat error', error.toJSON());
        // Should trigger system error handling
        break;
    }
  }

  shouldRetry(error: ChatError): boolean {
    if (!error.recoverable) return false;
    
    switch (error.code) {
      case ChatErrorCode.RATE_LIMITED:
      case ChatErrorCode.CONNECTION_TIMEOUT:
      case ChatErrorCode.NETWORK_ERROR:
        return true;
      default:
        return false;
    }
  }

  getRetryDelay(error: ChatError, attempt: number): number {
    if (error.retryAfter) {
      return error.retryAfter * 1000; // Convert to milliseconds
    }
    
    // Exponential backoff with jitter
    const delay = this.baseRetryDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * delay;
    return delay + jitter;
  }
}
```

## 2. Provider Capability System

### 2.1 Capability Definitions

```typescript
// src/lib/chat/capabilities/ProviderCapabilities.ts
export interface MessageCapabilities {
  send: boolean;
  edit: boolean;
  delete: boolean;
  react: boolean;
  reply: boolean;
  forward: boolean;
  search: boolean;
}

export interface ChannelCapabilities {
  create: boolean;
  join: boolean;
  leave: boolean;
  invite: boolean;
  kick: boolean;
  ban: boolean;
  setPermissions: boolean;
  setMetadata: boolean;
}

export interface UserCapabilities {
  getProfile: boolean;
  updateProfile: boolean;
  block: boolean;
  report: boolean;
  getPresence: boolean;
  setPresence: boolean;
}

export interface AttachmentCapabilities {
  upload: boolean;
  download: boolean;
  preview: boolean;
  maxFileSize: number; // in bytes
  supportedTypes: string[]; // MIME types
}

export interface SecurityCapabilities {
  encryption: boolean;
  endToEndEncryption: boolean;
  postQuantumCrypto: boolean;
  messageVerification: boolean;
  identityVerification: boolean;
}

export interface ProviderCapabilities {
  messages: MessageCapabilities;
  channels: ChannelCapabilities;
  users: UserCapabilities;
  attachments: AttachmentCapabilities;
  security: SecurityCapabilities;
  
  // Provider metadata
  name: string;
  version: string;
  description: string;
  
  // Technical limitations
  maxMessageLength: number;
  maxChannelNameLength: number;
  maxChannelsPerUser: number;
  maxUsersPerChannel: number;
  
  // Network characteristics
  offline: boolean;
  realtime: boolean;
  persistent: boolean;
  decentralized: boolean;
}
```

### 2.2 Capability-Aware Base Adapter

```typescript
// src/lib/chat/adapters/BaseAdapter.ts
export abstract class BaseAdapter implements ChatProvider {
  protected errorHandler: ErrorHandler;
  protected logger: Logger;
  
  constructor(errorHandler: ErrorHandler, logger: Logger) {
    this.errorHandler = errorHandler;
    this.logger = logger;
  }

  abstract getCapabilities(): ProviderCapabilities;

  protected createContext(operation: string, details: Partial<ChatErrorContext> = {}): ChatErrorContext {
    return {
      provider: this.getCapabilities().name,
      operation,
      timestamp: Date.now(),
      ...details
    };
  }

  protected async executeWithErrorHandling<T>(
    operation: string,
    fn: () => Promise<T>,
    context: Partial<ChatErrorContext> = {}
  ): Promise<T> {
    const fullContext = this.createContext(operation, context);
    
    try {
      return await fn();
    } catch (error) {
      const chatError = this.mapError(error, fullContext);
      this.errorHandler.handleError(chatError);
      throw chatError;
    }
  }

  protected mapError(error: unknown, context: ChatErrorContext): ChatError {
    if (error instanceof ChatError) {
      return error;
    }

    if (error instanceof Error) {
      // Map common error patterns
      if (error.message.includes('network') || error.message.includes('connection')) {
        return new ChatConnectionError(error.message, context, error);
      }
      
      if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
        return new ChatRateLimitError(error.message, context, 60); // Default 60 second retry
      }
      
      return new ChatError(
        ChatErrorCode.PROVIDER_ERROR,
        error.message,
        context,
        { originalError: error }
      );
    }

    return new ChatError(
      ChatErrorCode.UNKNOWN_ERROR,
      'An unknown error occurred',
      context
    );
  }

  protected requireCapability(capability: string, featurePath: string): void {
    const caps = this.getCapabilities();
    const hasCapability = this.getNestedProperty(caps, featurePath);
    
    if (!hasCapability) {
      throw new ChatFeatureNotSupportedError(
        capability,
        caps.name,
        this.createContext(capability)
      );
    }
  }

  private getNestedProperty(obj: any, path: string): boolean {
    return path.split('.').reduce((current, key) => current?.[key], obj) ?? false;
  }

  // Default implementations that check capabilities
  async deleteMessage(messageId: string): Promise<void> {
    this.requireCapability('deleteMessage', 'messages.delete');
    return this.executeWithErrorHandling(
      'deleteMessage',
      () => this.deleteMessageImpl(messageId),
      { messageId }
    );
  }

  async editMessage(messageId: string, newContent: string): Promise<ChatMessage> {
    this.requireCapability('editMessage', 'messages.edit');
    return this.executeWithErrorHandling(
      'editMessage',
      () => this.editMessageImpl(messageId, newContent),
      { messageId }
    );
  }

  // Abstract methods that providers must implement
  protected abstract deleteMessageImpl(messageId: string): Promise<void>;
  protected abstract editMessageImpl(messageId: string, newContent: string): Promise<ChatMessage>;
}
```

## 3. Retry Mechanism

### 3.1 Retry Policy

```typescript
// src/lib/chat/retry/RetryPolicy.ts
export interface RetryPolicy {
  maxAttempts: number;
  shouldRetry: (error: ChatError, attempt: number) => boolean;
  getDelay: (error: ChatError, attempt: number) => number;
}

export class ExponentialBackoffRetryPolicy implements RetryPolicy {
  constructor(
    public maxAttempts: number = 3,
    private baseDelay: number = 1000,
    private maxDelay: number = 30000
  ) {}

  shouldRetry(error: ChatError, attempt: number): boolean {
    if (attempt >= this.maxAttempts) return false;
    
    switch (error.code) {
      case ChatErrorCode.RATE_LIMITED:
      case ChatErrorCode.CONNECTION_TIMEOUT:
      case ChatErrorCode.NETWORK_ERROR:
      case ChatErrorCode.SERVICE_UNAVAILABLE:
        return true;
      default:
        return false;
    }
  }

  getDelay(error: ChatError, attempt: number): number {
    if (error.retryAfter) {
      return Math.min(error.retryAfter * 1000, this.maxDelay);
    }
    
    const delay = this.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * delay;
    return Math.min(delay + jitter, this.maxDelay);
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  policy: RetryPolicy,
  errorHandler: ErrorHandler
): Promise<T> {
  let lastError: ChatError;
  
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!(error instanceof ChatError)) {
        throw error;
      }
      
      lastError = error;
      errorHandler.handleError(error);
      
      if (!policy.shouldRetry(error, attempt) || attempt === policy.maxAttempts) {
        throw error;
      }
      
      const delay = policy.getDelay(error, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
```

## 4. Testing Specifications

### 4.1 Error Handling Tests

```typescript
// src/lib/chat/errors/__tests__/ChatError.test.ts
describe('ChatError', () => {
  it('should create error with correct properties', () => {
    const context = {
      provider: 'test',
      operation: 'sendMessage',
      timestamp: Date.now()
    };
    
    const error = new ChatError(
      ChatErrorCode.FEATURE_NOT_SUPPORTED,
      'Test error',
      context,
      { severity: ChatErrorSeverity.HIGH }
    );
    
    expect(error.code).toBe(ChatErrorCode.FEATURE_NOT_SUPPORTED);
    expect(error.severity).toBe(ChatErrorSeverity.HIGH);
    expect(error.context).toEqual(context);
  });

  it('should serialize to JSON correctly', () => {
    const error = new ChatError(
      ChatErrorCode.CONNECTION_FAILED,
      'Connection failed',
      { provider: 'test', operation: 'connect', timestamp: Date.now() }
    );
    
    const json = error.toJSON();
    expect(json.code).toBe(ChatErrorCode.CONNECTION_FAILED);
    expect(json.message).toBe('Connection failed');
  });
});
```

### 4.2 Adapter Tests

```typescript
// src/lib/chat/adapters/__tests__/BaseAdapter.test.ts
describe('BaseAdapter', () => {
  let adapter: TestAdapter;
  let errorHandler: jest.Mocked<ErrorHandler>;

  beforeEach(() => {
    errorHandler = {
      handleError: jest.fn(),
      shouldRetry: jest.fn(),
      getRetryDelay: jest.fn()
    };
    adapter = new TestAdapter(errorHandler, mockLogger);
  });

  describe('capability checking', () => {
    it('should throw error for unsupported features', async () => {
      adapter.setCapabilities({
        messages: { delete: false }
      });

      await expect(adapter.deleteMessage('test')).rejects.toThrow(
        ChatFeatureNotSupportedError
      );
    });

    it('should allow supported features', async () => {
      adapter.setCapabilities({
        messages: { delete: true }
      });

      await expect(adapter.deleteMessage('test')).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle and rethrow errors', async () => {
      adapter.setCapabilities({
        messages: { send: true }
      });
      
      adapter.mockError(new Error('Network error'));

      await expect(adapter.sendMessage('channel', 'message')).rejects.toThrow(ChatError);
      expect(errorHandler.handleError).toHaveBeenCalled();
    });
  });
});
```

## 5. Implementation Checklist

### Phase 1: Error System (Week 1)
- [ ] Create error type definitions
- [ ] Implement ChatError classes
- [ ] Create ErrorHandler interface and default implementation
- [ ] Update ChatInterface to include error handling
- [ ] Write comprehensive tests for error system

### Phase 2: Capability System (Week 1-2)
- [ ] Define capability interfaces
- [ ] Implement BaseAdapter with capability checking
- [ ] Update existing adapters to extend BaseAdapter
- [ ] Add capability reporting to provider factory
- [ ] Write tests for capability system

### Phase 3: Retry Mechanism (Week 2)
- [ ] Implement retry policies
- [ ] Add retry mechanism to BaseAdapter
- [ ] Update providers to use retry mechanism
- [ ] Add configuration for retry policies
- [ ] Write tests for retry mechanism

### Phase 4: Integration (Week 2)
- [ ] Update ChatContext to use new error handling
- [ ] Update components to handle errors gracefully
- [ ] Add error reporting UI components
- [ ] Update documentation
- [ ] Performance testing and optimization

## Success Criteria

1. **Zero "Not supported" exceptions** in production logs
2. **All adapter methods** either work or fail gracefully
3. **95%+ test coverage** on error handling code
4. **Consistent error reporting** across all providers
5. **User-friendly error messages** in UI components
6. **Automatic retry** for recoverable errors
7. **Performance impact** <5% compared to current implementation

This specification provides the foundation for robust, reliable chat functionality that can gracefully handle the complexities of multiple chat providers with different capabilities.
