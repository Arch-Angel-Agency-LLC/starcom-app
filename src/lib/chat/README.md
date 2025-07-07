# Unified Chat System

This module provides a unified chat system for the Starcom application. It consolidates multiple chat implementations (Gun.js, Nostr, SecureChat) into a single, flexible system that provides a consistent API and UI.

## Architecture

The unified chat system consists of the following components:

1. **Unified Interface**: A common interface for all chat providers
2. **Enhanced Base Provider**: A base implementation with error handling and common functionality
3. **Provider Factory**: A factory to create the appropriate chat provider
4. **Adapters**: Implementation-specific adapters that conform to the unified interface
5. **Error Handling Utilities**: Standardized error handling mechanisms
6. **React Context**: A context and hook to provide chat state and actions to components
7. **Unified UI**: Components that use the chat context for a consistent user experience

## Key Features

- **Unified Interface**: Consistent API regardless of the underlying technology
- **Error Handling**: Standardized error types and handling mechanisms
- **Retry Logic**: Automatic retries with exponential backoff for transient errors
- **Circuit Breaker**: Prevents repeated calls to failing services
- **Feature Detection**: Graceful degradation for unsupported features
- **Type Safety**: Fully TypeScript typed for better development experience

## Project Structure

```
src/lib/chat/
├── ChatInterface.ts          # Base interface and types
├── EnhancedChatProvider.ts   # Enhanced base implementation
├── ChatProviderFactory.ts    # Factory for creating providers
├── adapters/                 # Concrete adapter implementations
│   ├── GunChatAdapter.ts
│   ├── NostrChatAdapter.ts
│   ├── SecureChatAdapter.ts
│   └── UnifiedChatAdapter.ts
├── utils/                    # Utility functions
│   ├── ChatErrorHandling.ts  # Error handling utilities
│   └── NostrAdapterUtils.ts  # Nostr-specific utilities
└── __tests__/               # Test files
    ├── ChatErrorHandling.test.ts
    ├── EnhancedChatProvider.test.ts
    ├── GunChatAdapter.test.ts
    └── ChatAdaptersCommon.test.ts
```

## Usage

### Basic Usage

```tsx
import { ChatContextProvider } from '../context/ChatContext';
import ChatWindow from '../components/Chat/ChatWindow';

function ChatPage() {
  return (
    <ChatContextProvider
      defaultConfig={{ type: 'gun' }}
      userId="user123"
      userName="John Doe"
    >
      <ChatWindow />
    </ChatContextProvider>
  );
}
```

### Using the Chat Hook

```tsx
import { useChat } from '../context/ChatContext';

function ChatControls() {
  const { 
    sendMessage, 
    createChannel, 
    channels, 
    currentChannel, 
    setCurrentChannel
  } = useChat();
  
  const handleSend = () => {
    sendMessage('Hello, world!');
  };
  
  return (
    <div>
      <select 
        value={currentChannel || ''} 
        onChange={e => setCurrentChannel(e.target.value)}
      >
        {channels.map(channel => (
          <option key={channel.id} value={channel.id}>
            {channel.name}
          </option>
        ))}
      </select>
      
      <button onClick={handleSend}>Send Message</button>
      
      <button onClick={() => createChannel('New Channel', 'team', [])}>
        Create Channel
      </button>
    </div>
  );
}
```

### Switching Providers

```tsx
import { useChat } from '../context/ChatContext';

function ProviderSelector() {
  const { providerType, setProviderType, connect, disconnect } = useChat();
  
  const handleProviderChange = async (type) => {
    if (providerType !== type) {
      await disconnect();
      setProviderType(type);
      await connect({ type });
    }
  };
  
  return (
    <div>
      <button 
        onClick={() => handleProviderChange('gun')}
        disabled={providerType === 'gun'}
      >
        Use Gun.js
      </button>
      
      <button 
        onClick={() => handleProviderChange('nostr')}
        disabled={providerType === 'nostr'}
      >
        Use Nostr
      </button>
      
      <button 
        onClick={() => handleProviderChange('secure')}
        disabled={providerType === 'secure'}
      >
        Use SecureChat
      </button>
    </div>
  );
}
```

## API Reference

### ChatProvider Interface

```typescript
interface ChatProvider {
  // Connection
  connect(options?: Partial<ChatProviderOptions>): Promise<void>;
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
  getUserById(userId: string): Promise<ChatUser | null>;
  subscribeToUserPresence(channelId: string, callback: (users: ChatUser[]) => void): () => void;
  
  // Utility
  markMessagesAsRead(channelId: string, messageIds: string[]): Promise<void>;
  searchMessages(query: string, channelId?: string): Promise<ChatMessage[]>;
  uploadAttachment(file: File): Promise<{ id: string; url: string; }>;
  
  // Encryption
  setEncryptionEnabled(enabled: boolean): void;
  isEncryptionEnabled(): boolean;
}
```

### useChat Hook

```typescript
interface ChatContextValue {
  // State
  provider: ChatProvider | null;
  messages: Record<string, ChatMessage[]>;
  users: Record<string, ChatUser[]>;
  channels: ChatChannel[];
  currentChannel: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  connect: (config?: ChatProviderConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  setCurrentChannel: (channelId: string) => void;
  createChannel: (name: string, type: 'direct' | 'team' | 'global', participants: string[]) => Promise<void>;
  joinChannel: (channelId: string) => Promise<void>;
  leaveChannel: (channelId: string) => Promise<void>;
  getUsers: (channelId: string) => Promise<void>;
  markAsRead: (messageIds: string[]) => Promise<void>;
  loadMoreMessages: (limit?: number, before?: number) => Promise<void>;
  
  // Settings
  providerType: ChatProviderType;
  setProviderType: (type: ChatProviderType) => void;
  isEncryptionEnabled: boolean;
  setEncryptionEnabled: (enabled: boolean) => void;
}
```

## Components

### ChatWindow

The `ChatWindow` component provides a complete chat UI including messages, input, and user list.

```tsx
<ChatWindow
  className="custom-class"
  showHeader={true}
  showChannelSelector={true}
  showUserList={true}
  maxHeight="600px"
/>
```

#### Props

- `className`: Additional CSS class for styling
- `showHeader`: Whether to show the header with channel name and status
- `showChannelSelector`: Whether to show the channel selector sidebar
- `showUserList`: Whether to show the user list sidebar
- `maxHeight`: Maximum height of the chat window

## Demo

A demo component showcasing the unified chat system is available at:
`src/components/Demo/UnifiedChatDemo.tsx`

To use the demo:

1. Import and render the `UnifiedChatDemo` component
2. Enter your user information
3. Select a chat provider
4. Connect to start chatting

## Extending

### Adding a New Provider

To add a new chat provider:

1. Create a new adapter class that implements the `ChatProvider` interface
2. Update the `ChatProviderType` type and `defaultChatProviderConfigs` in `ChatProviderFactory.ts`
3. Add the new adapter to the dynamic imports in `loadChatAdapter` function

```typescript
// 1. Create adapter
export class NewProviderAdapter extends BaseChatProvider {
  // Implement all required methods
}

// 2. Update types
export type ChatProviderType = 'gun' | 'nostr' | 'secure' | 'new-provider';

// 3. Add to factory
async function loadChatAdapter(type: ChatProviderType): Promise<any> {
  switch (type) {
    // ...existing cases
    case 'new-provider':
      return import('./adapters/NewProviderAdapter').then(m => m.NewProviderAdapter);
    default:
      throw new Error(`Unsupported chat provider type: ${type}`);
  }
}
```
