# Phase 2: Unified Message Store & Context Provider

**Project**: Starcom Multi-Protocol Chat System  
**Phase**: 2 - Unified Message Store & Context Provider  
**Date**: July 3, 2025  
**Status**: Planning

## Overview

This document outlines the development of a unified data layer that abstracts protocol details from UI components. Phase 2 builds on the adapter architecture established in Phase 1 by creating a robust message store and enhanced React context provider that enables seamless integration with UI components regardless of the underlying chat protocol.

## Current State Analysis

Based on the code examination, the current system has:

1. **Existing ChatContext**: In `/src/context/ChatContext.tsx`, provides basic chat functionality
2. **Direct Service Usage**: Many components use services directly instead of the context
3. **No Cross-Protocol Synchronization**: No mechanism for syncing messages across protocols
4. **Limited Error Handling**: Minimal error boundaries and fallback mechanisms

After Phase 1, we now have:
1. Robust adapter interfaces with capability detection
2. Protocol registry for adapter management
3. Complete adapter implementations for Gun DB and Nostr

## Technical Design

### 1. Unified Message Store

**File**: `/src/lib/chat/MessageStore.ts`

The message store will provide:
1. Protocol-agnostic message storage
2. Cross-protocol message synchronization
3. Conflict resolution for message ordering
4. Caching and persistence strategies

```typescript
export class MessageStore {
  private messages: Map<string, Map<string, ChatMessage>> = new Map(); // channelId -> messageId -> message
  private messageOrder: Map<string, string[]> = new Map(); // channelId -> ordered message IDs
  private syncState: Map<string, SyncState> = new Map(); // channelId -> sync state
  private persistenceStrategy: PersistenceStrategy;
  
  constructor(options?: MessageStoreOptions) {
    this.persistenceStrategy = options?.persistenceStrategy || new LocalStoragePersistence();
    this.loadPersistedMessages();
  }
  
  // Message CRUD operations
  addMessage(channelId: string, message: ChatMessage): void {
    // Add message to store and update order
  }
  
  getMessages(channelId: string, options?: MessageQueryOptions): ChatMessage[] {
    // Return messages for channel with optional filtering
  }
  
  updateMessage(channelId: string, messageId: string, updates: Partial<ChatMessage>): void {
    // Update existing message
  }
  
  deleteMessage(channelId: string, messageId: string): void {
    // Remove message from store
  }
  
  // Synchronization methods
  syncWithProvider(provider: ChatProvider, channelId: string): Promise<void> {
    // Sync messages from provider to store
  }
  
  mergeMessages(channelId: string, newMessages: ChatMessage[]): MergeResult {
    // Merge new messages with existing ones, resolving conflicts
  }
  
  // Persistence methods
  persist(): void {
    // Persist messages using strategy
  }
  
  loadPersistedMessages(): void {
    // Load messages from persistence
  }
}
```

### 2. Enhanced ChatContext Provider

**File**: `/src/context/EnhancedChatContext.tsx`

Enhance the existing ChatContext with:
1. Support for multiple simultaneous chat providers
2. Protocol-agnostic state management
3. Automatic protocol selection based on capabilities
4. Robust error handling and recovery

```typescript
interface EnhancedChatContextValue extends ChatContextValue {
  // Multi-provider support
  providers: Record<string, ChatProvider>;
  activeProvider: string;
  setActiveProvider: (providerId: string) => void;
  
  // Enhanced messaging
  sendMessageWithFallback: (content: string, attachments?: File[]) => Promise<void>;
  
  // Protocol capabilities
  getProviderCapabilities: (providerId?: string) => ChatProviderCapabilities;
  findProviderWithCapability: (capability: string) => string | null;
  
  // Error handling
  errors: Record<string, Error[]>;
  clearErrors: (providerId?: string) => void;
  
  // Additional state
  syncStatus: Record<string, SyncStatus>;
  connectionStatus: Record<string, ConnectionStatus>;
}

export function EnhancedChatProvider({ 
  children, 
  defaultProviders = ['gun'],
  userId,
  userName
}: EnhancedChatProviderProps) {
  // State for managing multiple providers
  const [providers, setProviders] = useState<Record<string, ChatProvider>>({});
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, Error[]>>({});
  
  // Initialize providers
  useEffect(() => {
    const initProviders = async () => {
      const registry = ProtocolRegistry.getInstance();
      const initializedProviders: Record<string, ChatProvider> = {};
      
      for (const providerId of defaultProviders) {
        try {
          const registration = registry.getProtocol(providerId);
          if (registration) {
            const provider = await createChatProvider({
              type: providerId as ChatProviderType,
              options: {
                userId,
                userName
              }
            });
            
            initializedProviders[providerId] = provider;
          }
        } catch (error) {
          // Handle initialization error
        }
      }
      
      setProviders(initializedProviders);
      if (Object.keys(initializedProviders).length > 0) {
        setActiveProvider(Object.keys(initializedProviders)[0]);
      }
    };
    
    initProviders();
  }, [defaultProviders, userId, userName]);
  
  // Enhanced context value with implementation of all methods
  // ...
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}
```

### 3. React Hooks for Chat Functionality

**File**: `/src/hooks/chat/index.ts`

Create specialized hooks for common chat operations:

```typescript
export function useChat() {
  const context = useContext(ChatContext);
  
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
}

export function useChatChannel(channelId: string) {
  const { 
    messages, 
    sendMessage, 
    markAsRead, 
    loadMoreMessages,
    errors 
  } = useChat();
  
  // Channel-specific state and methods
  const channelMessages = useMemo(() => messages[channelId] || [], [messages, channelId]);
  const channelErrors = useMemo(() => errors[channelId] || [], [errors, channelId]);
  
  const sendChannelMessage = useCallback(
    (content: string, attachments?: File[]) => sendMessage(channelId, content, attachments),
    [sendMessage, channelId]
  );
  
  return {
    messages: channelMessages,
    sendMessage: sendChannelMessage,
    markAsRead: (messageIds: string[]) => markAsRead(channelId, messageIds),
    loadMoreMessages: (limit?: number, before?: number) => 
      loadMoreMessages(channelId, limit, before),
    errors: channelErrors
  };
}

// Additional specialized hooks
export function useChatUsers(channelId: string) { /* ... */ }
export function useChatPresence(channelId: string) { /* ... */ }
export function useChatAttachments() { /* ... */ }
```

### 4. Error Boundary System

**File**: `/src/components/Chat/ChatErrorBoundary.tsx`

Create chat-specific error boundaries:

```tsx
interface ChatErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error) => void;
}

interface ChatErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ChatErrorBoundary extends React.Component<ChatErrorBoundaryProps, ChatErrorBoundaryState> {
  constructor(props: ChatErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ChatErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Chat component error:', error, errorInfo);
    this.props.onError?.(error);
  }
  
  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
  };
  
  render(): React.ReactNode {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error!, this.resetErrorBoundary);
      }
      
      return this.props.fallback || (
        <div className="chat-error-fallback">
          <h3>Something went wrong with the chat component</h3>
          <button onClick={this.resetErrorBoundary}>Try again</button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Implementation Plan

### 1. Design Unified Message Store

**Files to Create/Modify**:
- `/src/lib/chat/store/MessageStore.ts` - Core message store implementation
- `/src/lib/chat/store/types.ts` - Message store types and interfaces
- `/src/lib/chat/store/persistence/PersistenceStrategy.ts` - Persistence strategy interface
- `/src/lib/chat/store/persistence/LocalStoragePersistence.ts` - Local storage implementation
- `/src/lib/chat/store/persistence/IndexedDBPersistence.ts` - IndexedDB implementation

**Implementation Details**:

1. **Message CRUD Operations**:
   - Add, update, get, and delete messages
   - Support for filtering, sorting, and pagination
   - Efficient message indexing and lookup

2. **Synchronization Mechanism**:
   - Sync messages from providers to store
   - Handle message merging and conflict resolution
   - Track sync state per channel and provider

3. **Persistence Strategies**:
   - Define common persistence interface
   - Implement localStorage and IndexedDB strategies
   - Support for message expiration and storage limits

### 2. Develop Enhanced ChatContext Provider

**Files to Create/Modify**:
- `/src/context/EnhancedChatContext.tsx` - Enhanced context provider
- `/src/context/ChatContextTypes.ts` - Enhanced context types
- `/src/context/ChatContextState.ts` - State management utilities
- `/src/context/ChatContextHelpers.ts` - Helper functions

**Implementation Details**:

1. **Multi-Provider Support**:
   - Initialize and manage multiple chat providers
   - Support provider switching and fallbacks
   - Synchronize state across providers

2. **Enhanced State Management**:
   - Track connection and sync status per provider
   - Manage channel and user state
   - Track and expose errors per operation

3. **Context API**:
   - Extend existing ChatContext API
   - Add provider management methods
   - Implement capability-based provider selection

### 3. Migrate Core Components

**Files to Create/Modify**:
- `/src/components/Collaboration/GroupChatPanel.tsx` - Update to use ChatContext
- `/src/components/Collaboration/EarthAllianceCommunicationPanel.tsx` - Update to use ChatContext
- `/src/components/Teams/TeamCollaborationHub.tsx` - Update to use ChatContext
- `/src/components/Chat/ChatWindow.tsx` - Create shared chat UI component
- `/src/components/Chat/ChatInput.tsx` - Create shared chat input component
- `/src/components/Chat/ChatMessageList.tsx` - Create shared message list component

**Implementation Details**:

1. **GroupChatPanel**:
   - Replace direct NostrService usage with ChatContext
   - Add error handling with ChatErrorBoundary
   - Implement capability-based UI adjustments

2. **ChatWindow Component**:
   - Create reusable component for chat display
   - Support different message types and formats
   - Implement automatic protocol selection

3. **Shared Components**:
   - Create capability-aware UI components
   - Implement graceful degradation for missing features
   - Add fallback UI for disconnected states

### 4. Implement Error Boundary System

**Files to Create/Modify**:
- `/src/components/Chat/ChatErrorBoundary.tsx` - Chat-specific error boundary
- `/src/components/Chat/ErrorFallbacks.tsx` - Reusable fallback components
- `/src/lib/chat/utils/ErrorReporting.ts` - Error reporting utilities
- `/src/lib/chat/utils/ErrorRecovery.ts` - Error recovery strategies

**Implementation Details**:

1. **Error Boundaries**:
   - Create chat-specific error boundary component
   - Implement fallback UI components
   - Add error reset and recovery logic

2. **Error Reporting**:
   - Implement error telemetry collection
   - Create structured error reporting
   - Add error categorization and prioritization

3. **Recovery Strategies**:
   - Implement provider reset and reconnection
   - Add automatic fallback to alternative providers
   - Create error-specific recovery actions

## File Structure

```
src/
├── lib/
│   └── chat/
│       ├── store/
│       │   ├── MessageStore.ts
│       │   ├── types.ts
│       │   └── persistence/
│       │       ├── PersistenceStrategy.ts
│       │       ├── LocalStoragePersistence.ts
│       │       └── IndexedDBPersistence.ts
│       └── utils/
│           ├── ErrorReporting.ts
│           └── ErrorRecovery.ts
├── context/
│   ├── EnhancedChatContext.tsx
│   ├── ChatContextTypes.ts
│   ├── ChatContextState.ts
│   └── ChatContextHelpers.ts
├── hooks/
│   └── chat/
│       ├── index.ts
│       ├── useChat.ts
│       ├── useChatChannel.ts
│       ├── useChatUsers.ts
│       └── useChatPresence.ts
└── components/
    ├── Chat/
    │   ├── ChatWindow.tsx
    │   ├── ChatInput.tsx
    │   ├── ChatMessageList.tsx
    │   ├── ChatErrorBoundary.tsx
    │   └── ErrorFallbacks.tsx
    └── Collaboration/
        ├── GroupChatPanel.tsx (updated)
        └── EarthAllianceCommunicationPanel.tsx (updated)
```

## Testing Strategy

### Unit Tests

1. **MessageStore Tests**:
   - Test CRUD operations with mock data
   - Verify synchronization behavior
   - Test conflict resolution scenarios
   - Verify persistence strategies

2. **ChatContext Tests**:
   - Test provider initialization and switching
   - Verify state management across providers
   - Test error handling and recovery

3. **Hook Tests**:
   - Test all chat hooks with mock context
   - Verify correct behavior with different providers
   - Test error cases and boundary conditions

### Integration Tests

1. **Component Tests**:
   - Test migrated components with both Gun and Nostr adapters
   - Verify consistent behavior across protocols
   - Test error boundaries and fallback UI

2. **Cross-Protocol Tests**:
   - Test message synchronization between protocols
   - Verify seamless protocol switching
   - Test recovery from protocol failures

## Implementation Tasks and Timeline

| Task | Description | Time Estimate |
|------|-------------|---------------|
| 2.1 | Design and implement MessageStore | 4-5 days |
| 2.2 | Implement persistence strategies | 2-3 days |
| 2.3 | Develop EnhancedChatContext | 4-5 days |
| 2.4 | Create specialized chat hooks | 2-3 days |
| 2.5 | Implement ChatErrorBoundary | 1-2 days |
| 2.6 | Create shared chat components | 3-4 days |
| 2.7 | Migrate GroupChatPanel | 2-3 days |
| 2.8 | Migrate EarthAllianceCommunicationPanel | 2-3 days |
| 2.9 | Implement comprehensive tests | 3-4 days |

**Total Estimated Timeline: 2-3 weeks**

## Deliverables

1. **Unified Message Store**:
   - Complete `MessageStore` implementation
   - Persistence strategies for different storage methods
   - Synchronization and conflict resolution mechanisms

2. **Enhanced Chat Context**:
   - `EnhancedChatContext` provider with multi-protocol support
   - Specialized hooks for common chat operations
   - Protocol-agnostic state management

3. **Migrated Components**:
   - Updated versions of existing chat components
   - New shared components for common chat UI elements
   - Error boundaries and fallback components

4. **Comprehensive Tests**:
   - Unit tests for MessageStore and ChatContext
   - Integration tests for components with different protocols
   - Cross-protocol synchronization tests

## Success Criteria

1. UI components work with both Gun DB and Nostr adapters
2. Messages synchronize correctly across protocols where possible
3. Components gracefully handle protocol failures
4. Direct service references are eliminated from components
5. All tests pass with >90% coverage

## Dependencies

1. **Phase 1 Completion**: Unified adapter architecture must be complete
2. **React Context API**: For context implementation
3. **Storage APIs**: For persistence strategies (localStorage, IndexedDB)
4. **Testing Libraries**: For component and hook testing

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Sync conflicts | High | Medium | Robust conflict resolution strategies |
| Storage limitations | Medium | Medium | Implement storage limits and cleanup |
| Component migration complexity | High | Medium | Incremental migration with thorough testing |
| Performance issues with large message stores | Medium | Medium | Pagination and efficient indexing |
| UI inconsistencies between protocols | Medium | High | Capability-based UI adaptation |

## Conclusion

Phase 2 establishes a unified data layer that abstracts protocol details from UI components, allowing for seamless integration regardless of the underlying chat protocol. By implementing a robust message store, enhanced context provider, and error handling system, this phase enables the development of protocol-agnostic UI components that can work with any supported chat protocol.

The resulting architecture provides a solid foundation for the protocol selection and fallback system to be developed in Phase 3, while immediately improving the reliability and maintainability of the chat system in the Starcom dApp.
