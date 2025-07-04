/**
 * EnhancedChatProvider.ts
 * 
 * An enhanced version of BaseChatProvider that adds error handling, feature detection,
 * and other improvements to the base chat provider implementation.
 */

import { ChatMessage, ChatProviderOptions, ChatChannel, ChatUser } from './ChatInterface';
import { BaseChatProvider } from './BaseChatProvider';
import { 
  ChatErrorType, 
  createChatError, 
  ensureChatError,
  retryWithBackoff,
  CircuitBreaker,
  ChatLogger,
  FeatureDetector
} from './utils/ChatErrorHandling';
import { EventEmitter } from 'events';

/**
 * Enhanced base options for all chat providers.
 */
export interface EnhancedChatProviderOptions extends ChatProviderOptions {
  maxRetries?: number;
  retryBackoffMs?: number;
  circuitBreakerMaxFailures?: number;
  circuitBreakerResetTimeoutMs?: number;
  features?: string[];
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'none';
}

/**
 * Enhanced base provider with error handling, retries, circuit breaker, and more.
 */
export abstract class EnhancedChatProvider extends BaseChatProvider {
  protected logger: ChatLogger;
  protected featureDetector: FeatureDetector;
  protected circuitBreaker: CircuitBreaker;
  protected events: EventEmitter;
  protected maxRetries: number;
  protected retryBackoffMs: number;
  protected readonly providerName: string;
  protected connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error' = 'disconnected';
  
  constructor(providerName: string, options?: EnhancedChatProviderOptions) {
    super(options);
    
    this.providerName = providerName;
    
    // Initialize logger with appropriate level
    const logLevel = options?.logLevel || 'info';
    this.logger = new ChatLogger(providerName, {
      level: logLevel === 'none' ? 'error' : logLevel
    });
    
    // Initialize feature detector
    this.featureDetector = new FeatureDetector(providerName, options?.features || []);
    
    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker(
      options?.circuitBreakerMaxFailures || 5,
      options?.circuitBreakerResetTimeoutMs || 30000
    );
    
    // Initialize event emitter
    this.events = new EventEmitter();
    
    // Set retry options
    this.maxRetries = options?.maxRetries || 3;
    this.retryBackoffMs = options?.retryBackoffMs || 300;
    
    // Call setup for feature detection
    this.setupFeatureDetection();
    
    this.logger.debug('EnhancedChatProvider initialized', {
      provider: this.providerName,
      features: this.featureDetector.getFeatureList(),
      maxRetries: this.maxRetries,
      retryBackoffMs: this.retryBackoffMs
    });
  }
  
  /**
   * Sets up feature detection by registering supported features.
   * This should be overridden by subclasses to register their supported features.
   */
  protected setupFeatureDetection(): void {
    // Register core features that all enhanced providers support
    this.featureDetector.addFeature('connect');
    this.featureDetector.addFeature('disconnect');
    this.featureDetector.addFeature('sendMessage');
    this.featureDetector.addFeature('getMessages');
    this.featureDetector.addFeature('subscribeToMessages');
  }
  
  /**
   * Checks if a feature is supported by this provider.
   */
  supportsFeature(feature: string): boolean {
    return this.featureDetector.supportsFeature(feature);
  }
  
  /**
   * Gets a list of all supported features.
   */
  getSupportedFeatures(): string[] {
    return this.featureDetector.getFeatureList();
  }
  
  /**
   * Subscribe to provider events.
   */
  on(event: string, listener: (...args: any[]) => void): void {
    this.events.on(event, listener);
  }
  
  /**
   * Unsubscribe from provider events.
   */
  off(event: string, listener: (...args: any[]) => void): void {
    this.events.off(event, listener);
  }
  
  /**
   * Handles the case when a feature is not supported.
   * Logs the attempt and throws an appropriate error.
   */
  protected handleUnsupportedFeature(
    feature: string, 
    details?: Record<string, unknown>
  ): never {
    const context = {
      provider: this.providerName,
      feature,
      supportedFeatures: this.featureDetector.getFeatureList(),
      ...details
    };
    
    // Create an error
    const error = createChatError(
      `Unsupported feature: ${feature}`,
      ChatErrorType.FEATURE_NOT_SUPPORTED,
      'feature_not_supported',
      true, // recoverable
      details,
      context
    );
    
    // Add to the error log
    this.logger.error(`Attempted to use unsupported feature: ${feature}`, error, context);
    
    // Emit event
    this.events.emit('featureUnsupported', { 
      feature, 
      provider: this.providerName,
      supportedFeatures: this.featureDetector.getFeatureList(),
      details 
    });
    
    // For debugging in development, provide more helpful information
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      this.logger.debug(`Developer info: To use feature '${feature}', implement it in the provider class and register it with this.featureDetector.addFeature('${feature}') in setupFeatureDetection().`);
    }
    
    // Throw the error to stop execution
    throw error;
  }
  
  /**
   * Execute an operation with automatic retry and circuit breaker.
   * This is a utility method used by provider methods to implement
   * resilient operations.
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: {
      feature: string;
      retryCount?: number;
      retryDelayMs?: number;
      errorType?: ChatErrorType;
      errorCode?: string;
      recoverable?: boolean;
      context?: Record<string, unknown>;
    }
  ): Promise<T> {
    const {
      feature,
      retryCount = this.maxRetries,
      retryDelayMs = this.retryBackoffMs,
      errorType = ChatErrorType.UNKNOWN,
      errorCode = 'operation_failed',
      recoverable = true,
      context = {}
    } = options;
    
    // Check if the feature is supported
    if (!this.supportsFeature(feature)) {
      return this.handleUnsupportedFeature(feature, context);
    }
    
    // Execute with circuit breaker
    try {
      return await this.circuitBreaker.execute(async () => {
        try {
          // Execute with retry
          return await retryWithBackoff(operation, {
            maxAttempts: retryCount,
            backoffMs: retryDelayMs
          });
        } catch (error) {
          // Convert to ChatError and add context
          const chatError = ensureChatError(error);
          chatError.type = chatError.type || errorType;
          chatError.code = chatError.code || errorCode;
          chatError.recoverable = recoverable;
          chatError.context = { ...context, feature, provider: this.providerName };
          
          this.logger.error(`Operation '${feature}' failed`, chatError, context);
          this.events.emit('error', chatError);
          
          throw chatError;
        }
      });
    } catch (error) {
      // This is already a ChatError from the circuit breaker
      throw error;
    }
  }
  
  /**
   * Ensures that the provider is connected before executing an operation.
   */
  protected async ensureConnected<T>(
    operation: () => Promise<T>,
    feature: string,
    context?: Record<string, unknown>
  ): Promise<T> {
    if (!this.isConnected()) {
      const error = createChatError(
        `Provider not connected: ${this.providerName}`,
        ChatErrorType.CONNECTION,
        'not_connected',
        true,
        { feature, ...context },
        { provider: this.providerName }
      );
      
      this.logger.error(`Attempted to use ${feature} without being connected`, error);
      this.events.emit('error', error);
      throw error;
    }
    
    return operation();
  }
  
  /**
   * Common implementation of getMessages with error handling.
   */
  async getMessages(
    channelId: string, 
    limit?: number, 
    before?: number
  ): Promise<ChatMessage[]> {
    return this.executeWithRetry(
      () => this.ensureConnected(
        () => this._getMessages(channelId, limit, before),
        'getMessages',
        { channelId, limit, before }
      ),
      {
        feature: 'getMessages',
        errorType: ChatErrorType.NETWORK,
        errorCode: 'get_messages_failed',
        context: { channelId, limit, before }
      }
    );
  }
  
  /**
   * Implementation of getMessages that should be overridden by subclasses.
   */
  protected abstract _getMessages(
    channelId: string,
    limit?: number,
    before?: number
  ): Promise<ChatMessage[]>;
  
  /**
   * Common implementation of sendMessage with error handling.
   */
  async sendMessage(
    channelId: string,
    content: string,
    attachments?: File[]
  ): Promise<ChatMessage> {
    return this.executeWithRetry(
      () => this.ensureConnected(
        () => this._sendMessage(channelId, content, attachments),
        'sendMessage',
        { channelId, contentLength: content.length, hasAttachments: !!attachments }
      ),
      {
        feature: 'sendMessage',
        errorType: ChatErrorType.NETWORK,
        errorCode: 'send_message_failed',
        context: { 
          channelId, 
          contentLength: content.length, 
          hasAttachments: !!attachments,
          attachmentCount: attachments?.length
        }
      }
    );
  }
  
  /**
   * Implementation of sendMessage that should be overridden by subclasses.
   */
  protected abstract _sendMessage(
    channelId: string,
    content: string,
    attachments?: File[]
  ): Promise<ChatMessage>;
  
  /**
   * Common implementation of subscribeToMessages with error handling.
   */
  subscribeToMessages(
    channelId: string,
    callback: (message: ChatMessage) => void
  ): () => void {
    if (!this.isConnected()) {
      this.logger.warn(`Attempted to subscribe to messages for channel ${channelId} without being connected`);
    }
    
    if (!this.supportsFeature('subscribeToMessages')) {
      this.handleUnsupportedFeature('subscribeToMessages', { channelId });
      // This line is never reached due to handleUnsupportedFeature throwing,
      // but TypeScript requires a return value
      return () => {};
    }
    
    try {
      return this._subscribeToMessages(channelId, callback);
    } catch (error) {
      const chatError = ensureChatError(error);
      chatError.type = ChatErrorType.NETWORK;
      chatError.code = 'subscribe_messages_failed';
      chatError.context = { channelId, provider: this.providerName };
      
      this.logger.error(`Failed to subscribe to messages for channel ${channelId}`, chatError);
      this.events.emit('error', chatError);
      
      // Return a no-op unsubscribe function
      return () => {};
    }
  }
  
  /**
   * Implementation of subscribeToMessages that should be overridden by subclasses.
   */
  protected abstract _subscribeToMessages(
    channelId: string,
    callback: (message: ChatMessage) => void
  ): () => void;
  
  /**
   * Common implementation of getChannels with error handling.
   */
  async getChannels(): Promise<ChatChannel[]> {
    return this.executeWithRetry(
      () => this.ensureConnected(
        () => this._getChannels(),
        'getChannels',
        {}
      ),
      {
        feature: 'getChannels',
        errorType: ChatErrorType.NETWORK,
        errorCode: 'get_channels_failed'
      }
    );
  }
  
  /**
   * Implementation of getChannels that should be overridden by subclasses.
   */
  protected abstract _getChannels(): Promise<ChatChannel[]>;
  
  /**
   * Common implementation of connect with error handling.
   */
  async connect(options?: Partial<ChatProviderOptions>): Promise<void> {
    if (this.isConnected()) {
      this.logger.debug('Already connected, ignoring connect call');
      return;
    }
    
    this.connectionState = 'connecting';
    this.events.emit('connectionStateChanged', { state: this.connectionState });
    
    try {
      await this.executeWithRetry(
        () => this._connect(options),
        {
          feature: 'connect',
          errorType: ChatErrorType.CONNECTION,
          errorCode: 'connect_failed',
          context: { options }
        }
      );
      
      this.connected = true;
      this.connectionState = 'connected';
      this.events.emit('connected');
      this.events.emit('connectionStateChanged', { state: this.connectionState });
      
      this.logger.info(`Connected to ${this.providerName} chat provider`);
    } catch (error) {
      this.connected = false;
      this.connectionState = 'error';
      this.events.emit('connectionStateChanged', { state: this.connectionState });
      
      const chatError = ensureChatError(error);
      this.logger.error(`Failed to connect to ${this.providerName} chat provider`, chatError);
      this.events.emit('error', chatError);
      
      throw chatError;
    }
  }
  
  /**
   * Implementation of connect that should be overridden by subclasses.
   */
  protected abstract _connect(options?: Partial<ChatProviderOptions>): Promise<void>;
  
  /**
   * Common implementation of disconnect with error handling.
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected()) {
      this.logger.debug('Already disconnected, ignoring disconnect call');
      return;
    }
    
    this.connectionState = 'disconnected';
    
    try {
      await this._disconnect();
      
      this.connected = false;
      this.events.emit('disconnected');
      this.events.emit('connectionStateChanged', { state: this.connectionState });
      
      this.logger.info(`Disconnected from ${this.providerName} chat provider`);
    } catch (error) {
      const chatError = ensureChatError(error);
      this.logger.error(`Failed to disconnect from ${this.providerName} chat provider`, chatError);
      this.events.emit('error', chatError);
      
      // Still mark as disconnected even if there was an error
      this.connected = false;
      this.events.emit('connectionStateChanged', { state: this.connectionState });
      
      throw chatError;
    }
  }
  
  /**
   * Implementation of disconnect that should be overridden by subclasses.
   */
  protected abstract _disconnect(): Promise<void>;
}
