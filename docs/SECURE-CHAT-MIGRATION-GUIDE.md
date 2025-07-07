# Secure Chat Migration Guide

This guide explains how to migrate from the legacy SecureChat components to the new unified chat system.

## Overview

The Starcom dApp is consolidating all chat features into a unified, modular, decentralized chat system. This includes migrating the secure chat components that were previously using their own context and integration service.

The main changes are:

1. Replace `useSecureChat` hook with `useChat` from `../../context/ChatContext`
2. Use unified versions of components: `SecureChatWindow-unified`, `SecureChatContactList-unified`, and `SecureChatManager-unified`
3. Update props and state management to work with the unified chat API

## Migration Steps

### 1. Replace SecureChatWindow

```tsx
// BEFORE
import SecureChatWindow from '../components/SecureChat/SecureChatWindow';

// ...
<SecureChatWindow
  chatWindow={chatWindow}
  onClose={() => handleCloseWindow(chatWindow.id)}
  onMinimize={() => handleMinimizeWindow(chatWindow.id)}
  onMaximize={() => handleMaximizeWindow(chatWindow.id)}
/>

// AFTER
import SecureChatWindow from '../components/SecureChat/SecureChatWindow-unified';

// ...
<SecureChatWindow
  chatId={chatWindow.id}
  contactName={chatWindow.contactName}
  onClose={() => handleCloseWindow(chatWindow.id)}
  onMinimize={() => handleMinimizeWindow(chatWindow.id)}
  onMaximize={() => handleMaximizeWindow(chatWindow.id)}
  isActive={true}
  isMaximized={chatWindow.isMaximized}
  isMinimized={chatWindow.isMinimized}
  threatLevel={chatWindow.threatLevel}
/>
```

### 2. Replace SecureChatContactList

```tsx
// BEFORE
import SecureChatContactList from '../components/SecureChat/SecureChatContactList';

// ...
<SecureChatContactList
  isVisible={showContactList}
  onClose={() => setShowContactList(false)}
  onContactSelect={handleContactSelect}
/>

// AFTER
import SecureChatContactList from '../components/SecureChat/SecureChatContactList-unified';

// ...
<SecureChatContactList
  isVisible={showContactList}
  onClose={() => setShowContactList(false)}
  onContactSelect={handleContactSelect}
/>
```

### 3. Replace SecureChatManager

```tsx
// BEFORE
import SecureChatManager from '../components/SecureChat/SecureChatManager';

// ...
<SecureChatManager />

// AFTER
import SecureChatManager from '../components/SecureChat/SecureChatManager-unified';

// ...
<SecureChatManager />
```

### 4. Replace useSecureChat with useChat

```tsx
// BEFORE
import { useSecureChat } from '../../communication/context/useSecureChat';

const MyComponent: React.FC = () => {
  const { state, openSecureChat, closeSecureChat } = useSecureChat();
  
  // ...
};

// AFTER
import { useChat } from '../../context/ChatContext';

const MyComponent: React.FC = () => {
  const chat = useChat();
  const { 
    isConnected, 
    provider, 
    providerType, 
    setProviderType,
    sendMessage,
    joinChannel,
    // ...etc
  } = chat;
  
  // ...
};
```

## API Mapping

| Legacy SecureChatContext API | Unified ChatContext API |
|------------------------------|-------------------------|
| `state.activeWindows` | Manage this locally in your component |
| `state.verifiedContacts` | Use `channels` and `users` |
| `openSecureChat(contact)` | Use `setProviderType('secure')` and `joinChannel(contactId)` |
| `closeSecureChat(chatId)` | Use `leaveChannel(chatId)` |
| `addVerifiedContact(contact)` | Use `createChannel(name, 'direct', [])` |
| `sendSecureMessage(message)` | Use `sendMessage(content, attachments)` |

## Type Mapping

| Legacy Type | Unified Type |
|-------------|--------------|
| `EarthAllianceContact` | Continue using, but map to/from `ChatUser` |
| `SecureChatWindow` | Create your own window state management |
| `ThreatLevel` | Continue using |

## Testing Your Migration

After migrating, run the validation script to check for any remaining legacy code:

```bash
npm run validate:secure-chat
```

## Common Issues

1. **Type errors**: The unified API uses different property names. Use TypeScript to guide you.

2. **Missing methods**: The unified API might not have direct equivalents. Look for alternative approaches.

3. **State management**: The unified system doesn't manage window positions, sizes, etc. You'll need to handle this in your component.

## Additional Resources

- `src/lib/chat/ChatInterface.ts` - Core interfaces for the unified chat system
- `src/lib/chat/adapters/SecureChatAdapter.ts` - Adapter that connects to the SecureChatIntegrationService
- `src/context/ChatContext.tsx` - React context that wraps the unified chat API
