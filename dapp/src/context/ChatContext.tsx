/**
 * ChatContext.tsx
 * 
 * React context and hook for providing unified chat functionality to components.
 * This context wraps the ChatProvider interface and manages chat state and actions.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  ChatProvider, 
  ChatMessage, 
  ChatUser, 
  ChatChannel, 
  ChatProviderOptions 
} from '../lib/chat/ChatInterface';
import { 
  createChatProvider, 
  ChatProviderType, 
  ChatProviderConfig, 
  defaultChatProviderConfigs,
  getRecommendedChatProvider
} from '../lib/chat/ChatProviderFactory';

/**
 * The context value provided by the ChatContext.
 */
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

/**
 * Properties for the ChatProvider component.
 */
interface ChatProviderProps {
  children: ReactNode;
  defaultConfig?: ChatProviderConfig;
  userId?: string;
  userName?: string;
}

// Create the context with a default value of null
const ChatContext = createContext<ChatContextValue | null>(null);

/**
 * Provider component for the ChatContext.
 */
export function ChatContextProvider({ 
  children, 
  defaultConfig,
  userId,
  userName
}: ChatProviderProps) {
  // State
  const [provider, setProvider] = useState<ChatProvider | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [users, setUsers] = useState<Record<string, ChatUser[]>>({});
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Settings
  const [providerType, setProviderType] = useState<ChatProviderType>(
    defaultConfig?.type || getRecommendedChatProvider()
  );
  const [isEncryptionEnabled, setEncryptionEnabled] = useState(true);
  
  // Message subscription cleanup functions
  const [messageSubscriptions, setMessageSubscriptions] = useState<Record<string, () => void>>({});
  
  // Connect to the chat provider
  const connect = useCallback(async (config?: ChatProviderConfig) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If already connected to a provider, disconnect first
      if (provider && isConnected) {
        await disconnect();
      }
      
      // Determine which provider to use
      const providerConfig = config || {
        type: providerType,
        options: {
          ...defaultChatProviderConfigs[providerType].options,
          userId,
          userName,
          encryption: isEncryptionEnabled
        }
      };
      
      // Create the provider
      const chatProvider = await createChatProvider(providerConfig);
      
      // Connect to the provider
      await chatProvider.connect();
      
      // Set encryption status
      chatProvider.setEncryptionEnabled(isEncryptionEnabled);
      
      // Load channels
      const channelList = await chatProvider.getChannels();
      
      // Set state
      setProvider(chatProvider);
      setChannels(channelList);
      setIsConnected(true);
      
      // If there are channels and no current channel is set, set the first one
      if (channelList.length > 0 && !currentChannel) {
        setCurrentChannel(channelList[0].id);
      }
      
      return chatProvider;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to connect to chat provider');
      setError(err);
      console.error('Failed to connect to chat provider:', error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [provider, isConnected, providerType, userId, userName, isEncryptionEnabled, currentChannel]);
  
  // Disconnect from the chat provider
  const disconnect = useCallback(async () => {
    if (!provider || !isConnected) return;
    
    try {
      setIsLoading(true);
      
      // Clean up message subscriptions
      Object.values(messageSubscriptions).forEach(unsubscribe => unsubscribe());
      setMessageSubscriptions({});
      
      // Disconnect from the provider
      await provider.disconnect();
      
      // Clear state
      setIsConnected(false);
      
    } catch (error) {
      console.error('Failed to disconnect from chat provider:', error);
      throw error instanceof Error ? error : new Error('Failed to disconnect from chat provider');
    } finally {
      setIsLoading(false);
    }
  }, [provider, isConnected, messageSubscriptions]);
  
  // Send a message to the current channel
  const sendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!provider || !isConnected || !currentChannel) {
      throw new Error('Not connected to a chat provider or no current channel');
    }
    
    try {
      setIsLoading(true);
      
      // Send the message
      const message = await provider.sendMessage(currentChannel, content, attachments);
      
      // Update the messages state
      setMessages(prev => {
        const channelMessages = prev[currentChannel] || [];
        return {
          ...prev,
          [currentChannel]: [...channelMessages, message]
        };
      });
      
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error instanceof Error ? error : new Error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [provider, isConnected, currentChannel]);
  
  // Create a new channel
  const createChannel = useCallback(async (name: string, type: 'direct' | 'team' | 'global', participants: string[]) => {
    if (!provider || !isConnected) {
      throw new Error('Not connected to a chat provider');
    }
    
    try {
      setIsLoading(true);
      
      // Create the channel
      const channel = await provider.createChannel(name, type, participants);
      
      // Update the channels state
      setChannels(prev => [...prev, channel]);
      
      // Set as current channel
      setCurrentChannel(channel.id);
      
    } catch (error) {
      console.error('Failed to create channel:', error);
      throw error instanceof Error ? error : new Error('Failed to create channel');
    } finally {
      setIsLoading(false);
    }
  }, [provider, isConnected]);
  
  // Join a channel
  const joinChannel = useCallback(async (channelId: string) => {
    if (!provider || !isConnected) {
      throw new Error('Not connected to a chat provider');
    }
    
    try {
      setIsLoading(true);
      
      // Join the channel
      await provider.joinChannel(channelId);
      
      // Load messages for the channel
      await loadMessages(channelId);
      
      // Set as current channel
      setCurrentChannel(channelId);
      
    } catch (error) {
      console.error('Failed to join channel:', error);
      throw error instanceof Error ? error : new Error('Failed to join channel');
    } finally {
      setIsLoading(false);
    }
  }, [provider, isConnected]);
  
  // Leave a channel
  const leaveChannel = useCallback(async (channelId: string) => {
    if (!provider || !isConnected) {
      throw new Error('Not connected to a chat provider');
    }
    
    try {
      setIsLoading(true);
      
      // Leave the channel
      await provider.leaveChannel(channelId);
      
      // Remove channel from state
      setChannels(prev => prev.filter(channel => channel.id !== channelId));
      
      // If the current channel is the one being left, set to null
      if (currentChannel === channelId) {
        setCurrentChannel(null);
      }
      
      // Clear messages for the channel
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[channelId];
        return newMessages;
      });
      
      // Clear users for the channel
      setUsers(prev => {
        const newUsers = { ...prev };
        delete newUsers[channelId];
        return newUsers;
      });
      
      // Remove message subscription
      if (messageSubscriptions[channelId]) {
        messageSubscriptions[channelId]();
        setMessageSubscriptions(prev => {
          const newSubs = { ...prev };
          delete newSubs[channelId];
          return newSubs;
        });
      }
      
    } catch (error) {
      console.error('Failed to leave channel:', error);
      throw error instanceof Error ? error : new Error('Failed to leave channel');
    } finally {
      setIsLoading(false);
    }
  }, [provider, isConnected, currentChannel, messageSubscriptions]);
  
  // Get users in a channel
  const getUsers = useCallback(async (channelId: string) => {
    if (!provider || !isConnected) {
      throw new Error('Not connected to a chat provider');
    }
    
    try {
      setIsLoading(true);
      
      // Get users in the channel
      const userList = await provider.getUsers(channelId);
      
      // Update the users state
      setUsers(prev => ({
        ...prev,
        [channelId]: userList
      }));
      
    } catch (error) {
      console.error('Failed to get users:', error);
      throw error instanceof Error ? error : new Error('Failed to get users');
    } finally {
      setIsLoading(false);
    }
  }, [provider, isConnected]);
  
  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!provider || !isConnected || !currentChannel) {
      throw new Error('Not connected to a chat provider or no current channel');
    }
    
    try {
      await provider.markMessagesAsRead(currentChannel, messageIds);
      
      // Update message status in state
      setMessages(prev => {
        const channelMessages = prev[currentChannel] || [];
        const updatedMessages = channelMessages.map(msg => 
          messageIds.includes(msg.id) 
            ? { ...msg, status: 'read' as const } 
            : msg
        );
        
        return {
          ...prev,
          [currentChannel]: updatedMessages
        };
      });
      
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw error instanceof Error ? error : new Error('Failed to mark messages as read');
    }
  }, [provider, isConnected, currentChannel]);
  
  // Load messages for a channel
  const loadMessages = useCallback(async (channelId: string, limit?: number) => {
    if (!provider || !isConnected) {
      throw new Error('Not connected to a chat provider');
    }
    
    try {
      // Get messages for the channel
      const messageList = await provider.getMessages(channelId, limit);
      
      // Update the messages state
      setMessages(prev => ({
        ...prev,
        [channelId]: messageList
      }));
      
      // Subscribe to new messages if not already subscribed
      if (!messageSubscriptions[channelId]) {
        const unsubscribe = provider.subscribeToMessages(channelId, (message) => {
          setMessages(prev => {
            const channelMessages = prev[channelId] || [];
            // Avoid duplicates by checking if message already exists
            if (!channelMessages.some(msg => msg.id === message.id)) {
              return {
                ...prev,
                [channelId]: [...channelMessages, message]
              };
            }
            return prev;
          });
        });
        
        // Store the unsubscribe function
        setMessageSubscriptions(prev => ({
          ...prev,
          [channelId]: unsubscribe
        }));
      }
      
      // Also load users for the channel
      await getUsers(channelId);
      
    } catch (error) {
      console.error('Failed to load messages:', error);
      throw error instanceof Error ? error : new Error('Failed to load messages');
    }
  }, [provider, isConnected, messageSubscriptions, getUsers]);
  
  // Load more messages (older ones)
  const loadMoreMessages = useCallback(async (limit = 20, before?: number) => {
    if (!provider || !isConnected || !currentChannel) {
      throw new Error('Not connected to a chat provider or no current channel');
    }
    
    try {
      setIsLoading(true);
      
      // Get the current oldest message timestamp
      const channelMessages = messages[currentChannel] || [];
      const oldestMessage = channelMessages.length > 0 
        ? channelMessages.reduce((oldest, msg) => 
            msg.timestamp < oldest.timestamp ? msg : oldest, 
            channelMessages[0]
          )
        : null;
      
      // Get older messages
      const olderMessages = await provider.getMessages(
        currentChannel, 
        limit, 
        before || (oldestMessage ? oldestMessage.timestamp : undefined)
      );
      
      // Update the messages state, prepending older messages
      setMessages(prev => {
        const channelMessages = prev[currentChannel] || [];
        
        // Filter out duplicates
        const newMessages = olderMessages.filter(
          newMsg => !channelMessages.some(msg => msg.id === newMsg.id)
        );
        
        return {
          ...prev,
          [currentChannel]: [...newMessages, ...channelMessages]
        };
      });
      
    } catch (error) {
      console.error('Failed to load more messages:', error);
      throw error instanceof Error ? error : new Error('Failed to load more messages');
    } finally {
      setIsLoading(false);
    }
  }, [provider, isConnected, currentChannel, messages]);
  
  // Effect to connect to the provider when the component mounts or providerType changes
  useEffect(() => {
    if (!provider && !isConnected && !isLoading) {
      connect().catch(err => {
        console.error('Failed to auto-connect to chat provider:', err);
      });
    }
  }, [provider, isConnected, isLoading, connect]);
  
  // Effect to load messages when the current channel changes
  useEffect(() => {
    if (provider && isConnected && currentChannel) {
      loadMessages(currentChannel).catch(err => {
        console.error('Failed to load messages for channel:', currentChannel, err);
      });
    }
  }, [provider, isConnected, currentChannel, loadMessages]);
  
  // Effect to update provider encryption setting
  useEffect(() => {
    if (provider && isConnected) {
      provider.setEncryptionEnabled(isEncryptionEnabled);
    }
  }, [provider, isConnected, isEncryptionEnabled]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clean up message subscriptions
      Object.values(messageSubscriptions).forEach(unsubscribe => unsubscribe());
      
      // Disconnect from provider
      if (provider && isConnected) {
        provider.disconnect().catch(err => {
          console.error('Failed to disconnect on unmount:', err);
        });
      }
    };
  }, [provider, isConnected, messageSubscriptions]);
  
  // Create the context value
  const contextValue: ChatContextValue = {
    // State
    provider,
    messages,
    users,
    channels,
    currentChannel,
    isConnected,
    isLoading,
    error,
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    setCurrentChannel,
    createChannel,
    joinChannel,
    leaveChannel,
    getUsers,
    markAsRead,
    loadMoreMessages,
    
    // Settings
    providerType,
    setProviderType,
    isEncryptionEnabled,
    setEncryptionEnabled
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

/**
 * Hook to use the ChatContext.
 */
export function useChat() {
  const context = useContext(ChatContext);
  
  if (!context) {
    throw new Error('useChat must be used within a ChatContextProvider');
  }
  
  return context;
}
