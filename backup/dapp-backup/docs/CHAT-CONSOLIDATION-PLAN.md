# Chat System Consolidation Plan

## Current State

The Starcom app currently has multiple chat implementations that need consolidation:

1. **Decentralized Chat System (Gun.js-based)**
   - `src/hooks/useDecentralizedChat.ts`
   - `src/components/Teams/DecentralizedChatWindow.tsx`
   - Uses Gun.js for P2P messaging
   - Uses IPFS for file attachments
   - Uses WebRTC for direct peer connections
   - Integrated with Solana wallet for identity

2. **Nostr-based Chat System**
   - `src/services/nostrService.ts`
   - Legacy implementation used in the original TeamCommunication component
   - Uses Nostr protocol for messaging

3. **Secure Chat Integration Service**
   - `src/services/SecureChatIntegrationService.ts`
   - More complex implementation integrating multiple protocols
   - Uses both Nostr and IPFS
   - Includes post-quantum cryptography

## Consolidation Strategy

### 1. Create a Unified Chat Interface

Create a common interface that all chat implementations must conform to. This allows for a consistent API regardless of the underlying technology.

```typescript
// src/lib/chat/ChatInterface.ts
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  channelId: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  metadata?: Record<string, any>;
}

export interface ChatUser {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: number;
  metadata?: Record<string, any>;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'direct' | 'team' | 'global';
  participants: string[]; // User IDs
  metadata?: Record<string, any>;
}

export interface ChatProvider {
  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Messages
  sendMessage(channelId: string, content: string, attachments?: File[]): Promise<ChatMessage>;
  getMessages(channelId: string, limit?: number, before?: number): Promise<ChatMessage[]>;
  subscribeToMessages(channelId: string, callback: (message: ChatMessage) => void): () => void;
  
  // Channels
  createChannel(name: string, type: 'direct' | 'team' | 'global', participants: string[]): Promise<ChatChannel>;
  joinChannel(channelId: string): Promise<void>;
  leaveChannel(channelId: string): Promise<void>;
  getChannels(): Promise<ChatChannel[]>;
  
  // Users
  getUsers(channelId: string): Promise<ChatUser[]>;
  subscribeToUserPresence(channelId: string, callback: (users: ChatUser[]) => void): () => void;
}
```

### 2. Implement Adapters for Each Technology

Create adapter classes that implement the `ChatProvider` interface for each technology:

1. **GunChatAdapter**: Wraps the Gun.js implementation
2. **NostrChatAdapter**: Wraps the Nostr implementation
3. **SecureChatAdapter**: Wraps the SecureChatIntegrationService

### 3. Create a ChatProviderFactory

Implement a factory to create the appropriate chat provider based on configuration:

```typescript
// src/lib/chat/ChatProviderFactory.ts
import { ChatProvider } from './ChatInterface';
import { GunChatAdapter } from './adapters/GunChatAdapter';
import { NostrChatAdapter } from './adapters/NostrChatAdapter';
import { SecureChatAdapter } from './adapters/SecureChatAdapter';

export type ChatProviderType = 'gun' | 'nostr' | 'secure';

export interface ChatProviderConfig {
  type: ChatProviderType;
  options?: Record<string, any>;
}

export function createChatProvider(config: ChatProviderConfig): ChatProvider {
  switch (config.type) {
    case 'gun':
      return new GunChatAdapter(config.options);
    case 'nostr':
      return new NostrChatAdapter(config.options);
    case 'secure':
      return new SecureChatAdapter(config.options);
    default:
      throw new Error(`Unsupported chat provider type: ${config.type}`);
  }
}
```

### 4. Create a React Context and Hook for Chat

Implement a React context and hook to provide chat functionality to components:

```typescript
// src/context/ChatContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChatProvider, ChatMessage, ChatUser, ChatChannel } from '../lib/chat/ChatInterface';
import { createChatProvider, ChatProviderConfig } from '../lib/chat/ChatProviderFactory';

interface ChatContextValue {
  provider: ChatProvider | null;
  messages: Record<string, ChatMessage[]>;
  users: Record<string, ChatUser[]>;
  channels: ChatChannel[];
  currentChannel: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  connect: (config: ChatProviderConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  setCurrentChannel: (channelId: string) => void;
  createChannel: (name: string, type: 'direct' | 'team' | 'global', participants: string[]) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children, defaultConfig }: { 
  children: React.ReactNode;
  defaultConfig?: ChatProviderConfig;
}) {
  // Implementation here
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
```

### 5. Create Unified UI Components

Implement unified UI components that use the chat context:

```typescript
// src/components/Chat/ChatWindow.tsx
import React from 'react';
import { useChat } from '../../context/ChatContext';

export function ChatWindow() {
  const { messages, currentChannel, sendMessage, isLoading, error } = useChat();
  // Implementation here
}

// src/components/Chat/ChatUserList.tsx
import React from 'react';
import { useChat } from '../../context/ChatContext';

export function ChatUserList() {
  const { users, currentChannel } = useChat();
  // Implementation here
}

// src/components/Chat/ChatChannelList.tsx
import React from 'react';
import { useChat } from '../../context/ChatContext';

export function ChatChannelList() {
  const { channels, currentChannel, setCurrentChannel } = useChat();
  // Implementation here
}
```

### 6. Migration Strategy

1. **Phase 1: Implementation**
   - Implement the unified chat interface and adapters
   - Create the context and hook
   - Implement the UI components

2. **Phase 2: Integration**
   - Update TeamCommunication to use the new system
   - Gradually replace uses of the old systems

3. **Phase 3: Deprecation**
   - Mark old implementations as deprecated
   - Provide migration guidance
   - Set timeline for removal

4. **Phase 4: Cleanup**
   - Remove deprecated implementations
   - Update documentation

## Advantages of This Approach

1. **Flexibility**: Components can use different chat providers interchangeably
2. **Maintainability**: Single API to maintain regardless of underlying technology
3. **Future-proofing**: New chat technologies can be added by implementing new adapters
4. **Consistency**: UI remains consistent regardless of the chat provider
5. **Phased Migration**: Allows for gradual adoption without breaking existing functionality

## Implementation Timeline

1. **Week 1**: Design and implement the unified chat interface and adapters ✅
2. **Week 2**: Implement the React context, hook, and UI components ✅
3. **Week 3**: Update existing components to use the new system 🔄
4. **Week 4**: Testing, bug fixes, and performance optimization ⏳

## Implementation Progress

### Completed
- ✅ Defined unified chat interface (`ChatInterface.ts`)
- ✅ Created provider factory (`ChatProviderFactory.ts`)
- ✅ Implemented Gun.js adapter (`GunChatAdapter.ts`)
- ✅ Implemented Nostr adapter (`NostrChatAdapter.ts`)
- ✅ Implemented SecureChat adapter (`SecureChatAdapter.ts`)
- ✅ Created React context and hook (`ChatContext.tsx`)
- ✅ Built unified UI component (`ChatWindow.tsx`)
- ✅ Created implementation documentation

### In Progress
- 🔄 Testing adapters with real data
- 🔄 Migrating existing components to use the new system
- 🔄 Fixing type issues and edge cases

### Pending
- ⏳ Performance optimization
- ⏳ End-to-end testing
- ⏳ Legacy code removal
- ⏳ Documentation updates

See [CHAT-CONSOLIDATION-IMPLEMENTATION.md](./CHAT-CONSOLIDATION-IMPLEMENTATION.md) for detailed implementation notes.
