/**
 * ChatProviderFactory.ts
 * 
 * Factory for creating chat provider instances based on configuration or capability requirements.
 */

import { ChatProviderInterface } from './interfaces/ChatProviderInterface';
import { ChatProviderType, ChatProviderConfig } from './types/ChatAdapterTypes';
import { ProtocolRegistry } from './ProtocolRegistry';
import { ProtocolSelectionCriteria, ProtocolSelectionResult } from './types/ProtocolTypes';
import { logger } from '../../utils';

// Map of protocols to provider types
const protocolToProviderMap: Record<string, ChatProviderType> = {
  'gun': 'gun',
  'nostr': 'nostr',
  'secure': 'secure',
  'unified': 'unified'
};

/**
 * Singleton instance of the protocol registry.
 */
const protocolRegistry = new ProtocolRegistry();

/**
 * Loads a chat adapter class based on the specified type.
 * 
 * @param type The chat provider type.
 * @returns A promise that resolves to the adapter class.
 */
async function loadChatAdapter(type: ChatProviderType): Promise<typeof BaseChatAdapter> {
  switch (type) {
    case 'gun':
      const { GunChatAdapter } = await import('./adapters/GunChatAdapter');
      return GunChatAdapter;
    case 'nostr':
      const { NostrChatAdapter } = await import('./adapters/NostrChatAdapter');
      return NostrChatAdapter;
    case 'secure':
      const { SecureChatAdapter } = await import('./adapters/SecureChatAdapter');
      return SecureChatAdapter;
    case 'unified':
      const { UnifiedChatAdapter } = await import('./adapters/UnifiedChatAdapter');
      return UnifiedChatAdapter;
    default:
      throw new Error(`Unknown chat provider type: ${type}`);
  }
}

/**
 * Creates a chat provider instance based on the specified configuration.
 * 
 * @param config The chat provider configuration.
 * @returns A promise that resolves to a chat provider instance.
 */
export async function createChatProvider(config: ChatProviderConfig): Promise<ChatProviderInterface> {
  const AdapterClass = await loadChatAdapter(config.type);
  return new AdapterClass(config.options);
}

/**
 * Creates a chat provider based on capability requirements.
 * 
 * @param criteria The selection criteria for choosing a provider.
 * @param options Options to pass to the selected provider.
 * @returns A promise that resolves to the best matching chat provider and selection result.
 */
export async function createChatProviderByCapabilities(
  criteria: ProtocolSelectionCriteria, 
  options = {}
): Promise<{ provider: ChatProviderInterface; result: ProtocolSelectionResult }> {
  // Select protocol based on criteria
  const result = protocolRegistry.selectProtocol(criteria);
  
  if (!result.selectedProtocol) {
    throw new Error(`No suitable chat provider found for the requested capabilities: ${criteria.requiredCapabilities.join(', ')}`);
  }
  
  // Map protocol ID to provider type
  const typeMap = protocolToProviderMap;
  
  const type = typeMap[result.selectedProtocol.id] || 'unified';
  
  // Create the provider
  const provider = await createChatProvider({
    type,
    options: {
      ...options,
      // Add any protocol-specific options from the selection result
      ...(result.metadata || {})
    }
  });
  
  return { provider, result };
}

/**
 * Determines if a specific feature is supported by a chat provider type.
 * 
 * @param type The chat provider type.
 * @param feature The feature to check support for.
 * @returns A promise that resolves to true if the feature is supported, false otherwise.
 */
export async function isFeatureSupported(type: ChatProviderType, feature: string): Promise<boolean> {
  try {
    const AdapterClass = await loadChatAdapter(type);
    const adapter = new AdapterClass();
    return adapter.hasFeature(feature);
  } catch (error: unknown) {
    return false;
  }
}

/**
 * Creates a chat provider instance based on the specified selection criteria.
 * Uses ProtocolRegistry to select the most appropriate provider.
 * 
 * @param criteria Selection criteria for choosing a provider.
 * @param options Additional options to pass to the provider.
 * @returns A promise that resolves to the chat provider and selection result.
 */
export async function createChatProviderByCriteria(
  criteria: ProtocolSelectionCriteria,
  options = {}
): Promise<{ provider: ChatProviderInterface; selection: ProtocolSelectionResult }> {
  // Ensure default protocols are registered
  registerDefaultProtocols();
  
  // Select protocol based on criteria
  const selection = protocolRegistry.selectProtocol(criteria);
  
  if (!selection.selectedProtocol) {
    throw new Error(`No suitable chat provider found for the specified criteria`);
  }
  
  // Map protocol ID to provider type
  const type = protocolToProviderMap[selection.selectedProtocol.id] || 'unified';
  
  // Create the provider
  const provider = await createChatProvider({
    type,
    options: {
      ...options,
      // Add any protocol-specific options from the selection result
      ...(selection.metadata || {})
    }
  });
  
  return { provider, selection };
}

/**
 * Default configuration for each provider type.
 */
export const defaultChatProviderConfigs: Record<ChatProviderType, Omit<ChatProviderConfig, 'type'>> = {
  gun: {
    options: {
      encryption: true,
      storageStrategy: 'persistent',
      endpoints: [
        'https://gun-manhattan.herokuapp.com/gun',
        'https://gun-us.herokuapp.com/gun',
        'https://gun-euro.herokuapp.com/gun'
      ]
    }
  },
  nostr: {
    options: {
      encryption: true,
      storageStrategy: 'persistent',
      endpoints: [
        'wss://relay.damus.io',
        'wss://relay.nostr.info',
        'wss://nostr-pub.wellorder.net'
      ]
    }
  },
  secure: {
    options: {
      encryption: true,
      storageStrategy: 'persistent',
      endpoints: []  // Will be determined by the SecureChatIntegrationService
    }
  },
  unified: {
    options: {
      encryption: true,
      storageStrategy: 'persistent',
      endpoints: []  // Will use defaults from the selected provider
    }
  }
};

/**
 * Gets the recommended chat provider type based on the application context.
 * 
 * @param context Additional context for determining the provider type.
 * @returns The recommended chat provider type.
 */
export function getRecommendedChatProviderType(context: Record<string, unknown> = {}): ChatProviderType {
  // Default to unified provider
  let recommendedType: ChatProviderType = 'unified';
  
  try {
    // Simple strategy: check if secure connections are required
    if (context.secureRequired === true) {
      recommendedType = 'secure';
    } 
    // Check for preferred provider in context
    else if (context.preferredProvider && typeof context.preferredProvider === 'string') {
      const preferred = context.preferredProvider as string;
      if (Object.keys(protocolToProviderMap).includes(preferred)) {
        recommendedType = protocolToProviderMap[preferred] as ChatProviderType;
      }
    }
    
    logger.debug(`Recommended chat provider type: ${recommendedType}`, { context });
    return recommendedType;
  } catch (error) {
    logger.error('Error determining recommended chat provider type', { error });
    return 'unified'; // Fallback to unified provider
  }
}

/**
 * Gets the recommended chat provider type based on the application context.
 * Alias for getRecommendedChatProviderType for backward compatibility.
 * 
 * @param context Additional context for determining the provider type.
 * @returns The recommended chat provider type.
 */
export function getRecommendedChatProvider(context: Record<string, unknown> = {}): ChatProviderType {
  return getRecommendedChatProviderType(context);
}

/**
 * Register the default protocols in the registry.
 */
function registerDefaultProtocols() {
  // Gun protocol
  protocolRegistry.registerProtocol({
    id: 'gun',
    name: 'Gun.js',
    adapterClass: 'GunChatAdapter',
    defaultEndpoints: [
      'https://gun-manhattan.herokuapp.com/gun',
      'https://gun-us.herokuapp.com/gun',
      'https://gun-euro.herokuapp.com/gun'
    ],
    defaultCapabilities: {
      messaging: true,
      channels: true,
      presence: true,
      attachments: true,
      reactions: false,
      threading: false,
      encryption: true,
      search: false,
      offline: true,
      editing: false,
      deletion: true,
      typing: true,
      read_receipts: false,
      mentions: false,
      p2p: true,
      e2e_encryption: false,
      forward_secrecy: false,
      pq_encryption: false,
      server_based: true,
      relay_based: true,
      message_expiry: false,
      persistent_history: true,
      anonymous_usage: false,
      sync: true
    },
    isEnabled: true,
    priority: 2
  });
  
  // Nostr protocol
  protocolRegistry.registerProtocol({
    id: 'nostr',
    name: 'Nostr',
    adapterClass: 'NostrChatAdapter',
    defaultEndpoints: [
      'wss://relay.damus.io',
      'wss://relay.nostr.info',
      'wss://nostr-pub.wellorder.net'
    ],
    defaultCapabilities: {
      messaging: true,
      channels: true,
      presence: false,
      attachments: true,
      reactions: true,
      threading: false,
      encryption: true,
      search: false,
      offline: true,
      editing: false,
      deletion: true,
      typing: false,
      read_receipts: false,
      mentions: true,
      p2p: false,
      e2e_encryption: true,
      forward_secrecy: false,
      pq_encryption: false,
      server_based: true,
      relay_based: true,
      message_expiry: false,
      persistent_history: true,
      anonymous_usage: false,
      sync: true
    },
    isEnabled: true,
    priority: 1
  });
  
  // Secure protocol (upgraded Gun or other secure implementation)
  protocolRegistry.registerProtocol({
    id: 'secure',
    name: 'Secure Chat',
    adapterClass: 'SecureChatAdapter',
    defaultEndpoints: [],  // Will be determined by the SecureChatIntegrationService
    defaultCapabilities: {
      messaging: true,
      channels: true,
      presence: true,
      attachments: true,
      reactions: false,
      threading: false,
      encryption: true,
      search: true,
      offline: true,
      editing: false,
      deletion: true,
      typing: true,
      read_receipts: true,
      mentions: false,
      p2p: true,
      e2e_encryption: true,
      forward_secrecy: true,
      pq_encryption: true,
      server_based: false,
      relay_based: false,
      message_expiry: true,
      persistent_history: true,
      anonymous_usage: false,
      sync: true
    },
    isEnabled: true,
    priority: 3
  });
}

// Import this at the end to avoid circular dependencies
import { BaseChatAdapter } from './adapters/BaseChatAdapter';

// Initialize default protocols
registerDefaultProtocols();
