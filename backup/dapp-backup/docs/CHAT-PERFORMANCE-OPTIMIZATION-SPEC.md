# Performance Optimization Specification for Chat System

## Overview

This document outlines performance optimization strategies and implementations needed to address scalability concerns in the unified chat system.

## Current Performance Issues

### 1. Message Management
- No pagination for message history
- Loading entire message history into memory
- No virtual scrolling for large message lists
- Re-rendering all messages on updates

### 2. State Management
- ChatContext re-subscribes to all channels on provider changes
- No selective updates or memoization
- Complex state updates trigger unnecessary re-renders

### 3. Network Efficiency
- No message caching
- Duplicate network requests
- No connection pooling or management

## Performance Optimization Strategy

### 1. Message Pagination and Virtual Scrolling

#### 1.1 Pagination Interface

```typescript
// src/lib/chat/pagination/MessagePagination.ts
export interface MessagePaginationOptions {
  limit: number;
  before?: string; // Message ID or timestamp
  after?: string;  // Message ID or timestamp
  direction: 'forward' | 'backward';
}

export interface PaginatedMessageResult {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
  totalCount?: number;
}

export interface MessagePaginationState {
  messages: ChatMessage[];
  isLoading: boolean;
  hasMoreBefore: boolean;
  hasMoreAfter: boolean;
  oldestCursor?: string;
  newestCursor?: string;
  totalCount?: number;
}
```

#### 1.2 Virtual Scrolling Implementation

```typescript
// src/components/Chat/VirtualMessageList.tsx
import { FixedSizeList as List } from 'react-window';
import { useMemo, useCallback, useRef } from 'react';

interface VirtualMessageListProps {
  messages: ChatMessage[];
  onLoadMore: (direction: 'up' | 'down') => void;
  hasMoreUp: boolean;
  hasMoreDown: boolean;
  isLoading: boolean;
}

export const VirtualMessageList: React.FC<VirtualMessageListProps> = ({
  messages,
  onLoadMore,
  hasMoreUp,
  hasMoreDown,
  isLoading
}) => {
  const listRef = useRef<List>(null);
  
  const itemCount = useMemo(() => {
    let count = messages.length;
    if (hasMoreUp) count += 1; // Loading indicator
    if (hasMoreDown) count += 1; // Loading indicator
    return count;
  }, [messages.length, hasMoreUp, hasMoreDown]);

  const getItemSize = useCallback((index: number) => {
    // Dynamic sizing based on message content
    const message = messages[index];
    if (!message) return 80; // Loading indicator height
    
    // Calculate based on content, attachments, etc.
    let height = 60; // Base message height
    if (message.attachments?.length) height += 100;
    if (message.content.length > 100) height += 20;
    
    return height;
  }, [messages]);

  const renderItem = useCallback(({ index, style }) => {
    // Handle loading indicators
    if (hasMoreUp && index === 0) {
      return (
        <div style={style} className="loading-indicator">
          Loading earlier messages...
        </div>
      );
    }
    
    if (hasMoreDown && index === itemCount - 1) {
      return (
        <div style={style} className="loading-indicator">
          Loading newer messages...
        </div>
      );
    }
    
    // Adjust index for loading indicators
    const messageIndex = hasMoreUp ? index - 1 : index;
    const message = messages[messageIndex];
    
    return (
      <div style={style}>
        <MessageComponent message={message} />
      </div>
    );
  }, [messages, hasMoreUp, hasMoreDown, itemCount]);

  const handleScroll = useCallback(({ scrollTop, scrollUpdateWasRequested }) => {
    if (scrollUpdateWasRequested) return;
    
    // Load more messages when near edges
    if (scrollTop < 100 && hasMoreUp && !isLoading) {
      onLoadMore('up');
    } else if (scrollTop > listRef.current.props.height - 100 && hasMoreDown && !isLoading) {
      onLoadMore('down');
    }
  }, [hasMoreUp, hasMoreDown, isLoading, onLoadMore]);

  return (
    <List
      ref={listRef}
      height={600} // Container height
      itemCount={itemCount}
      itemSize={getItemSize}
      onScroll={handleScroll}
    >
      {renderItem}
    </List>
  );
};
```

### 2. Intelligent Message Caching

#### 2.1 Cache Architecture

```typescript
// src/lib/chat/cache/MessageCache.ts
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheOptions {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  lru: boolean; // Least Recently Used eviction
}

export class MessageCache {
  private cache = new Map<string, CacheEntry<ChatMessage[]>>();
  private options: CacheOptions;
  
  constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      maxSize: 1000, // Max number of channel caches
      ttl: 5 * 60 * 1000, // 5 minutes
      lru: true,
      ...options
    };
  }

  set(channelId: string, messages: ChatMessage[], cursor?: string): void {
    const key = this.getCacheKey(channelId, cursor);
    const now = Date.now();
    
    const entry: CacheEntry<ChatMessage[]> = {
      data: messages,
      timestamp: now,
      expiresAt: now + this.options.ttl,
      accessCount: 1,
      lastAccessed: now
    };
    
    // Evict if necessary
    if (this.cache.size >= this.options.maxSize) {
      this.evictLeastUsed();
    }
    
    this.cache.set(key, entry);
  }

  get(channelId: string, cursor?: string): ChatMessage[] | null {
    const key = this.getCacheKey(channelId, cursor);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = Date.now();
    
    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = now;
    
    return entry.data;
  }

  invalidate(channelId: string): void {
    // Remove all cache entries for this channel
    for (const [key] of this.cache) {
      if (key.startsWith(channelId + ':')) {
        this.cache.delete(key);
      }
    }
  }

  private getCacheKey(channelId: string, cursor?: string): string {
    return cursor ? `${channelId}:${cursor}` : `${channelId}:latest`;
  }

  private evictLeastUsed(): void {
    if (!this.options.lru || this.cache.size === 0) return;
    
    let leastUsedKey = '';
    let leastUsedScore = Infinity;
    
    for (const [key, entry] of this.cache) {
      // LRU score based on access count and recency
      const score = entry.accessCount * (Date.now() - entry.lastAccessed);
      if (score < leastUsedScore) {
        leastUsedScore = score;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }
}
```

#### 2.2 Smart Cache Integration

```typescript
// src/lib/chat/cache/CachedChatProvider.ts
export class CachedChatProvider implements ChatProvider {
  private provider: ChatProvider;
  private messageCache: MessageCache;
  private requestDeduplicator: Map<string, Promise<any>>;

  constructor(provider: ChatProvider, cacheOptions?: Partial<CacheOptions>) {
    this.provider = provider;
    this.messageCache = new MessageCache(cacheOptions);
    this.requestDeduplicator = new Map();
  }

  async getMessages(
    channelId: string, 
    options?: MessagePaginationOptions
  ): Promise<PaginatedMessageResult> {
    const cacheKey = this.getCacheKey(channelId, options);
    
    // Check cache first
    const cached = this.messageCache.get(channelId, cacheKey);
    if (cached) {
      return {
        messages: cached,
        hasMore: cached.length === (options?.limit || 50),
        nextCursor: cached[cached.length - 1]?.id
      };
    }
    
    // Deduplicate concurrent requests
    const requestKey = `getMessages:${channelId}:${JSON.stringify(options)}`;
    if (this.requestDeduplicator.has(requestKey)) {
      return this.requestDeduplicator.get(requestKey)!;
    }
    
    // Make request
    const promise = this.provider.getMessages(channelId, options);
    this.requestDeduplicator.set(requestKey, promise);
    
    try {
      const result = await promise;
      
      // Cache the result
      this.messageCache.set(channelId, result.messages, cacheKey);
      
      return result;
    } finally {
      this.requestDeduplicator.delete(requestKey);
    }
  }

  async sendMessage(
    channelId: string, 
    content: string, 
    attachments?: File[]
  ): Promise<ChatMessage> {
    const message = await this.provider.sendMessage(channelId, content, attachments);
    
    // Invalidate cache for this channel since we have new messages
    this.messageCache.invalidate(channelId);
    
    return message;
  }

  private getCacheKey(channelId: string, options?: MessagePaginationOptions): string {
    if (!options) return 'latest';
    return `${options.before || ''}:${options.after || ''}:${options.limit || 50}`;
  }

  // Delegate all other methods to the underlying provider
  // ... (implement all ChatProvider methods)
}
```

### 3. Optimized State Management

#### 3.1 Selective Updates with Zustand

```typescript
// src/lib/chat/store/ChatStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface MessageState {
  messagesByChannel: Record<string, ChatMessage[]>;
  paginationState: Record<string, MessagePaginationState>;
  loadingStates: Record<string, boolean>;
}

interface ChannelState {
  channels: ChatChannel[];
  currentChannelId: string | null;
  channelUsers: Record<string, ChatUser[]>;
}

interface ProviderState {
  currentProvider: ChatProvider | null;
  providerType: ChatProviderType;
  isConnected: boolean;
}

interface ChatStoreState extends MessageState, ChannelState, ProviderState {
  // Actions
  setMessages: (channelId: string, messages: ChatMessage[]) => void;
  addMessage: (channelId: string, message: ChatMessage) => void;
  updateMessage: (channelId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  setCurrentChannel: (channelId: string) => void;
  setProvider: (provider: ChatProvider, type: ChatProviderType) => void;
  
  // Selectors (computed values)
  getCurrentChannelMessages: () => ChatMessage[];
  getChannelPagination: (channelId: string) => MessagePaginationState;
}

export const useChatStore = create<ChatStoreState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    messagesByChannel: {},
    paginationState: {},
    loadingStates: {},
    channels: [],
    currentChannelId: null,
    channelUsers: {},
    currentProvider: null,
    providerType: 'gun',
    isConnected: false,

    // Actions
    setMessages: (channelId, messages) =>
      set((state) => ({
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: messages
        }
      })),

    addMessage: (channelId, message) =>
      set((state) => ({
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: [...(state.messagesByChannel[channelId] || []), message]
        }
      })),

    updateMessage: (channelId, messageId, updates) =>
      set((state) => ({
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: state.messagesByChannel[channelId]?.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ) || []
        }
      })),

    setCurrentChannel: (channelId) =>
      set({ currentChannelId: channelId }),

    setProvider: (provider, type) =>
      set({ 
        currentProvider: provider, 
        providerType: type,
        isConnected: provider !== null 
      }),

    // Selectors
    getCurrentChannelMessages: () => {
      const state = get();
      return state.currentChannelId 
        ? state.messagesByChannel[state.currentChannelId] || []
        : [];
    },

    getChannelPagination: (channelId) => {
      const state = get();
      return state.paginationState[channelId] || {
        messages: [],
        isLoading: false,
        hasMoreBefore: true,
        hasMoreAfter: false
      };
    }
  }))
);

// Typed selectors for better performance
export const useCurrentChannelMessages = () => 
  useChatStore(state => state.getCurrentChannelMessages());

export const useChannelPagination = (channelId: string) =>
  useChatStore(state => state.getChannelPagination(channelId));

export const useIsChannelLoading = (channelId: string) =>
  useChatStore(state => state.loadingStates[channelId] || false);
```

#### 3.2 Connection Pooling and Management

```typescript
// src/lib/chat/connection/ConnectionManager.ts
export interface ConnectionConfig {
  maxConnections: number;
  connectionTimeout: number;
  keepAliveInterval: number;
  reconnectAttempts: number;
  reconnectDelay: number;
}

export class ConnectionManager {
  private connections = new Map<string, Connection>();
  private config: ConnectionConfig;
  private activeConnections = 0;
  
  constructor(config: Partial<ConnectionConfig> = {}) {
    this.config = {
      maxConnections: 5,
      connectionTimeout: 10000,
      keepAliveInterval: 30000,
      reconnectAttempts: 3,
      reconnectDelay: 1000,
      ...config
    };
  }

  async getConnection(providerId: string): Promise<Connection> {
    const existing = this.connections.get(providerId);
    if (existing && existing.isActive()) {
      return existing;
    }

    if (this.activeConnections >= this.config.maxConnections) {
      await this.evictOldestConnection();
    }

    const connection = await this.createConnection(providerId);
    this.connections.set(providerId, connection);
    this.activeConnections++;

    return connection;
  }

  private async createConnection(providerId: string): Promise<Connection> {
    // Implementation for creating provider-specific connections
    // with timeout, retry logic, etc.
  }

  private async evictOldestConnection(): Promise<void> {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, connection] of this.connections) {
      if (connection.lastActivity < oldestTime) {
        oldestTime = connection.lastActivity;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const connection = this.connections.get(oldestKey);
      await connection?.close();
      this.connections.delete(oldestKey);
      this.activeConnections--;
    }
  }
}
```

### 4. Component Optimization

#### 4.1 Memoized Message Components

```typescript
// src/components/Chat/OptimizedMessageComponent.tsx
import React, { memo, useMemo } from 'react';

interface MessageComponentProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showTimestamp: boolean;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}

export const MessageComponent = memo<MessageComponentProps>(({
  message,
  isOwnMessage,
  showTimestamp,
  onEdit,
  onDelete
}) => {
  const formattedTime = useMemo(() => {
    return new Date(message.timestamp).toLocaleTimeString();
  }, [message.timestamp]);

  const messageClasses = useMemo(() => {
    return `message ${isOwnMessage ? 'own' : 'other'} ${message.status}`;
  }, [isOwnMessage, message.status]);

  return (
    <div className={messageClasses}>
      <div className="message-content">{message.content}</div>
      {showTimestamp && (
        <div className="message-timestamp">{formattedTime}</div>
      )}
      {/* Render attachments, reactions, etc. */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.isOwnMessage === nextProps.isOwnMessage &&
    prevProps.showTimestamp === nextProps.showTimestamp
  );
});
```

## Performance Benchmarks and Targets

### Current Performance (Baseline)
- **Message Load Time**: 2-5 seconds for 1000 messages
- **Memory Usage**: ~50MB for 1000 messages
- **Re-render Time**: 100-300ms on state updates
- **Network Requests**: 5-10 per channel switch

### Target Performance
- **Message Load Time**: <500ms for any pagination load
- **Memory Usage**: <20MB for 10,000 messages (with virtual scrolling)
- **Re-render Time**: <50ms on state updates
- **Network Requests**: 1-2 per channel switch (with caching)
- **Time to Interactive**: <1 second for chat interface

### Implementation Timeline

#### Week 1: Message Pagination
- [ ] Implement pagination interfaces
- [ ] Add pagination to all adapters
- [ ] Update ChatContext to support pagination
- [ ] Basic testing

#### Week 2: Virtual Scrolling and Caching
- [ ] Implement VirtualMessageList component
- [ ] Create MessageCache system
- [ ] Integrate caching with providers
- [ ] Performance testing

#### Week 3: State Management Optimization
- [ ] Implement Zustand store
- [ ] Migrate components to use optimized store
- [ ] Add connection pooling
- [ ] Component memoization

#### Week 4: Testing and Optimization
- [ ] Comprehensive performance testing
- [ ] Memory leak detection and fixes
- [ ] Bundle size optimization
- [ ] Documentation and final integration

### Success Metrics
- [ ] 10x improvement in large message list rendering
- [ ] 50% reduction in memory usage
- [ ] 75% reduction in unnecessary network requests
- [ ] <100ms component update times
- [ ] Smooth scrolling with 60fps
- [ ] No memory leaks in 24-hour stress test

This specification provides a comprehensive approach to addressing the performance bottlenecks identified in the critical analysis while maintaining the architectural benefits of the unified chat system.
