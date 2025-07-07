# Phase 4: Protocol Selection and User Settings

## Overview

This phase focuses on implementing protocol selection capabilities, user preferences, and identity management to provide users with control over their chat experience while ensuring communication remains reliable and secure.

## Current State

As of the completion of Phase 3, the Starcom dApp has:

1. A unified adapter architecture with implementations for Gun, Nostr, and other protocols
2. An enhanced chat context providing a centralized API for chat functionality
3. Protocol selection and fallback mechanisms to handle connection failures
4. Core components migrated to use the unified ChatContext

## Objectives for Phase 4

1. Implement user settings for chat protocol preferences
2. Create an identity management system to handle multiple identities across protocols
3. Develop a protocol configuration UI for users to customize protocol-specific settings
4. Ensure settings persistence across sessions
5. Add admin controls for organizational protocol policies

## Implementation Details

### 1. Chat Settings Service

**File**: `/src/services/ChatSettingsService.ts`

Create a service to manage user preferences for chat protocols:

```typescript
/**
 * ChatSettingsService.ts
 * 
 * Service for managing user preferences and settings related to chat functionality.
 */

import { LocalStorage } from '../utils/storage';
import { ChatProtocol } from '../lib/chat/ChatProtocolRegistry';

export interface ChatSettings {
  // Protocol preferences
  preferredProtocols: ChatProtocol[];
  protocolFallbackEnabled: boolean;
  fallbackTimeoutMs: number;
  
  // Identity
  displayName: string;
  avatarUrl?: string;
  protocolIdentities: Record<ChatProtocol, string>;
  
  // UI preferences
  notificationsEnabled: boolean;
  messageGrouping: boolean;
  showTimestamps: boolean;
  fontSize: 'small' | 'medium' | 'large';
  
  // Protocol-specific settings
  protocolConfigs: Record<ChatProtocol, Record<string, any>>;
}

// Default settings
const DEFAULT_SETTINGS: ChatSettings = {
  preferredProtocols: ['nostr', 'gun'],
  protocolFallbackEnabled: true,
  fallbackTimeoutMs: 5000,
  displayName: '',
  protocolIdentities: {
    nostr: '',
    gun: '',
    secure: '',
    matrix: ''
  },
  notificationsEnabled: true,
  messageGrouping: true,
  showTimestamps: true,
  fontSize: 'medium',
  protocolConfigs: {
    nostr: {
      relays: [
        'wss://relay.starcom.network',
        'wss://relay.damus.io',
        'wss://nostr-pub.wellorder.net'
      ]
    },
    gun: {
      peers: [
        'https://gun-starcom.herokuapp.com/gun',
        'https://gun-manhattan.herokuapp.com/gun'
      ]
    },
    secure: {
      encryptionLevel: 'high'
    },
    matrix: {
      homeserver: 'https://matrix.starcom.network'
    }
  }
};

export class ChatSettingsService {
  private static instance: ChatSettingsService | null = null;
  private settings: ChatSettings;
  private storage: LocalStorage;
  private listeners: Set<(settings: ChatSettings) => void>;
  
  private constructor() {
    this.storage = new LocalStorage('starcom-chat-settings');
    this.listeners = new Set();
    this.settings = this.loadSettings();
  }
  
  public static getInstance(): ChatSettingsService {
    if (!ChatSettingsService.instance) {
      ChatSettingsService.instance = new ChatSettingsService();
    }
    return ChatSettingsService.instance;
  }
  
  private loadSettings(): ChatSettings {
    const savedSettings = this.storage.get<ChatSettings>('settings');
    return savedSettings ? { ...DEFAULT_SETTINGS, ...savedSettings } : DEFAULT_SETTINGS;
  }
  
  private saveSettings(): void {
    this.storage.set('settings', this.settings);
    this.notifyListeners();
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.settings }));
  }
  
  // Public methods
  
  public getSettings(): ChatSettings {
    return { ...this.settings };
  }
  
  public updateSettings(partialSettings: Partial<ChatSettings>): void {
    this.settings = { ...this.settings, ...partialSettings };
    this.saveSettings();
  }
  
  public updateProtocolConfig(protocol: ChatProtocol, config: Record<string, any>): void {
    this.settings.protocolConfigs[protocol] = {
      ...this.settings.protocolConfigs[protocol],
      ...config
    };
    this.saveSettings();
  }
  
  public setPreferredProtocols(protocols: ChatProtocol[]): void {
    this.settings.preferredProtocols = [...protocols];
    this.saveSettings();
  }
  
  public setProtocolIdentity(protocol: ChatProtocol, identity: string): void {
    this.settings.protocolIdentities[protocol] = identity;
    this.saveSettings();
  }
  
  public subscribe(listener: (settings: ChatSettings) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  public reset(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }
}

export default ChatSettingsService.getInstance();
```

### 2. ChatContext Integration with Settings

**File**: `/src/context/EnhancedChatContext.tsx`

Enhance the chat context to use settings:

```typescript
// Add to imports
import chatSettingsService, { ChatSettings } from '../services/ChatSettingsService';

// Add to EnhancedChatContextValue interface
interface EnhancedChatContextValue extends ChatContextValue {
  // Existing properties
  
  // Settings-related properties
  settings: ChatSettings;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  setPreferredProtocols: (protocols: ChatProtocol[]) => void;
  updateProtocolConfig: (protocol: ChatProtocol, config: Record<string, any>) => void;
}

// Inside the context provider component
function EnhancedChatContextProvider({ children }: { children: ReactNode }) {
  // Existing state
  
  // Settings state
  const [settings, setSettings] = useState<ChatSettings>(
    chatSettingsService.getSettings()
  );
  
  // Subscribe to settings changes
  useEffect(() => {
    const unsubscribe = chatSettingsService.subscribe(updatedSettings => {
      setSettings(updatedSettings);
    });
    
    return unsubscribe;
  }, []);
  
  // Update protocol registry with user preferences
  useEffect(() => {
    if (settings.preferredProtocols.length > 0) {
      protocolRegistry.setPreferredProtocols(settings.preferredProtocols);
    }
    
    protocolRegistry.setFallbackEnabled(settings.protocolFallbackEnabled);
    protocolRegistry.setFallbackTimeout(settings.fallbackTimeoutMs);
    
    // Apply protocol-specific configurations
    Object.entries(settings.protocolConfigs).forEach(([protocol, config]) => {
      protocolRegistry.updateProtocolConfig(protocol as ChatProtocol, config);
    });
  }, [settings]);
  
  // Settings-related methods
  const updateSettings = useCallback((partialSettings: Partial<ChatSettings>) => {
    chatSettingsService.updateSettings(partialSettings);
  }, []);
  
  const setPreferredProtocols = useCallback((protocols: ChatProtocol[]) => {
    chatSettingsService.setPreferredProtocols(protocols);
  }, []);
  
  const updateProtocolConfig = useCallback((protocol: ChatProtocol, config: Record<string, any>) => {
    chatSettingsService.updateProtocolConfig(protocol, config);
  }, []);
  
  // Add to context value
  const contextValue: EnhancedChatContextValue = {
    // Existing properties
    
    // Settings
    settings,
    updateSettings,
    setPreferredProtocols,
    updateProtocolConfig
  };
  
  // Rest of the component
}
```

### 3. Chat Settings UI

**File**: `/src/components/Settings/ChatSettingsPanel.tsx`

Create a settings panel for chat configuration:

```tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Switch, 
  FormControlLabel, 
  Select, 
  MenuItem, 
  TextField, 
  Button, 
  Divider, 
  Slider,
  Chip,
  IconButton
} from '@mui/material';
import { 
  Settings as SettingsIcon, 
  Security as SecurityIcon, 
  Person as PersonIcon, 
  Notifications as NotificationIcon,
  DragIndicator as DragIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useChat } from '../../context/EnhancedChatContext';
import { ChatProtocol, PROTOCOL_INFO } from '../../lib/chat/ChatProtocolRegistry';

// Panel tabs
const TABS = {
  GENERAL: 0,
  PROTOCOLS: 1,
  IDENTITY: 2,
  ADVANCED: 3
};

export function ChatSettingsPanel() {
  const { 
    settings, 
    updateSettings, 
    setPreferredProtocols, 
    updateProtocolConfig 
  } = useChat();
  
  const [activeTab, setActiveTab] = useState(TABS.GENERAL);
  const [protocolOrder, setProtocolOrder] = useState<ChatProtocol[]>(
    settings.preferredProtocols
  );
  
  // Update local state when settings change
  useEffect(() => {
    setProtocolOrder(settings.preferredProtocols);
  }, [settings.preferredProtocols]);
  
  // Handle protocol order changes via drag and drop
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(protocolOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setProtocolOrder(items);
    setPreferredProtocols(items);
  };
  
  // Handle protocol relay/peer changes
  const handleProtocolConfigChange = (
    protocol: ChatProtocol, 
    key: string, 
    value: any
  ) => {
    updateProtocolConfig(protocol, { [key]: value });
  };
  
  // Add a new relay/peer to a protocol
  const handleAddEndpoint = (protocol: ChatProtocol, endpoint: string) => {
    const currentEndpoints = settings.protocolConfigs[protocol].relays || 
                           settings.protocolConfigs[protocol].peers || [];
    
    if (endpoint && !currentEndpoints.includes(endpoint)) {
      const endpointKey = protocol === 'nostr' ? 'relays' : 'peers';
      handleProtocolConfigChange(
        protocol, 
        endpointKey, 
        [...currentEndpoints, endpoint]
      );
    }
  };
  
  // Remove a relay/peer from a protocol
  const handleRemoveEndpoint = (protocol: ChatProtocol, index: number) => {
    const endpointKey = protocol === 'nostr' ? 'relays' : 'peers';
    const currentEndpoints = settings.protocolConfigs[protocol][endpointKey] || [];
    const newEndpoints = [...currentEndpoints];
    newEndpoints.splice(index, 1);
    
    handleProtocolConfigChange(protocol, endpointKey, newEndpoints);
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Chat Settings
      </Typography>
      
      <Tabs 
        value={activeTab} 
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab icon={<SettingsIcon />} label="General" />
        <Tab icon={<SecurityIcon />} label="Protocols" />
        <Tab icon={<PersonIcon />} label="Identity" />
        <Tab icon={<SettingsIcon />} label="Advanced" />
      </Tabs>
      
      {/* General Settings Tab */}
      {activeTab === TABS.GENERAL && (
        <Box>
          <Typography variant="h6" gutterBottom>
            UI Preferences
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.notificationsEnabled}
                onChange={(e) => 
                  updateSettings({ notificationsEnabled: e.target.checked })
                }
              />
            }
            label="Enable Notifications"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.messageGrouping}
                onChange={(e) => 
                  updateSettings({ messageGrouping: e.target.checked })
                }
              />
            }
            label="Group Consecutive Messages"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.showTimestamps}
                onChange={(e) => 
                  updateSettings({ showTimestamps: e.target.checked })
                }
              />
            }
            label="Show Message Timestamps"
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>Font Size</Typography>
            <Select
              value={settings.fontSize}
              onChange={(e) => 
                updateSettings({ fontSize: e.target.value as any })
              }
              fullWidth
            >
              <MenuItem value="small">Small</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="large">Large</MenuItem>
            </Select>
          </Box>
        </Box>
      )}
      
      {/* Protocols Tab */}
      {activeTab === TABS.PROTOCOLS && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Protocol Preferences
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            Drag to reorder protocols based on your preference. The top protocol will be used first.
          </Typography>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="protocols">
              {(provided) => (
                <Box
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{ mb: 3 }}
                >
                  {protocolOrder.map((protocol, index) => (
                    <Draggable 
                      key={protocol} 
                      draggableId={protocol} 
                      index={index}
                    >
                      {(provided) => (
                        <Paper
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          elevation={1}
                          sx={{ 
                            p: 2, 
                            mb: 1, 
                            display: 'flex', 
                            alignItems: 'center' 
                          }}
                        >
                          <Box {...provided.dragHandleProps} sx={{ mr: 2 }}>
                            <DragIcon />
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1">
                              {PROTOCOL_INFO[protocol].name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {PROTOCOL_INFO[protocol].description}
                            </Typography>
                          </Box>
                          <Chip 
                            label={index === 0 ? "Primary" : "Fallback"} 
                            color={index === 0 ? "primary" : "default"}
                            size="small"
                          />
                        </Paper>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.protocolFallbackEnabled}
                onChange={(e) => 
                  updateSettings({ protocolFallbackEnabled: e.target.checked })
                }
              />
            }
            label="Enable Protocol Fallback"
          />
          
          <Box sx={{ mt: 3 }}>
            <Typography gutterBottom>
              Fallback Timeout (ms): {settings.fallbackTimeoutMs}
            </Typography>
            <Slider
              value={settings.fallbackTimeoutMs}
              min={1000}
              max={15000}
              step={500}
              valueLabelDisplay="auto"
              onChange={(_, value) => 
                updateSettings({ fallbackTimeoutMs: value as number })
              }
            />
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {/* Protocol-specific configurations */}
          <Typography variant="h6" gutterBottom>
            Protocol Configurations
          </Typography>
          
          {protocolOrder.map((protocol) => (
            <Box key={protocol} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {PROTOCOL_INFO[protocol].name} Configuration
              </Typography>
              
              {/* Nostr-specific settings */}
              {protocol === 'nostr' && (
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Relays
                  </Typography>
                  
                  {settings.protocolConfigs.nostr.relays.map((relay, index) => (
                    <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                      <TextField 
                        value={relay}
                        fullWidth
                        size="small"
                        disabled
                      />
                      <IconButton 
                        onClick={() => handleRemoveEndpoint('nostr', index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  
                  <Box sx={{ display: 'flex', mt: 1 }}>
                    <TextField
                      placeholder="wss://relay.example.com"
                      size="small"
                      fullWidth
                      id="nostr-new-relay"
                    />
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => {
                        const input = document.getElementById('nostr-new-relay') as HTMLInputElement;
                        handleAddEndpoint('nostr', input.value);
                        input.value = '';
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                </Box>
              )}
              
              {/* Gun-specific settings */}
              {protocol === 'gun' && (
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Peers
                  </Typography>
                  
                  {settings.protocolConfigs.gun.peers.map((peer, index) => (
                    <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                      <TextField 
                        value={peer}
                        fullWidth
                        size="small"
                        disabled
                      />
                      <IconButton 
                        onClick={() => handleRemoveEndpoint('gun', index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  
                  <Box sx={{ display: 'flex', mt: 1 }}>
                    <TextField
                      placeholder="https://gun.example.com/gun"
                      size="small"
                      fullWidth
                      id="gun-new-peer"
                    />
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => {
                        const input = document.getElementById('gun-new-peer') as HTMLInputElement;
                        handleAddEndpoint('gun', input.value);
                        input.value = '';
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                </Box>
              )}
              
              {/* Other protocol settings */}
              {protocol === 'secure' && (
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Encryption Level
                  </Typography>
                  <Select
                    value={settings.protocolConfigs.secure.encryptionLevel}
                    onChange={(e) => handleProtocolConfigChange(
                      'secure', 
                      'encryptionLevel', 
                      e.target.value
                    )}
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="maximum">Maximum</MenuItem>
                  </Select>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
      
      {/* Identity Tab */}
      {activeTab === TABS.IDENTITY && (
        <Box>
          <Typography variant="h6" gutterBottom>
            User Identity
          </Typography>
          
          <TextField
            label="Display Name"
            value={settings.displayName}
            onChange={(e) => updateSettings({ displayName: e.target.value })}
            fullWidth
            margin="normal"
          />
          
          <TextField
            label="Avatar URL"
            value={settings.avatarUrl || ''}
            onChange={(e) => updateSettings({ avatarUrl: e.target.value })}
            fullWidth
            margin="normal"
          />
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Protocol Identities
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            Configure your identity for each protocol
          </Typography>
          
          {Object.keys(settings.protocolIdentities).map((protocol) => (
            <Box key={protocol} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {PROTOCOL_INFO[protocol as ChatProtocol]?.name || protocol}
              </Typography>
              
              <TextField
                label="Identity/Public Key"
                value={settings.protocolIdentities[protocol as ChatProtocol]}
                onChange={(e) => {
                  const newIdentities = { ...settings.protocolIdentities };
                  newIdentities[protocol as ChatProtocol] = e.target.value;
                  updateSettings({ protocolIdentities: newIdentities });
                }}
                fullWidth
                size="small"
                helperText={`Your public identity for ${protocol}`}
              />
            </Box>
          ))}
        </Box>
      )}
      
      {/* Advanced Tab */}
      {activeTab === TABS.ADVANCED && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Advanced Settings
          </Typography>
          
          <Button 
            variant="outlined" 
            color="error" 
            onClick={() => {
              if (window.confirm('Are you sure you want to reset all chat settings to default?')) {
                chatSettingsService.reset();
              }
            }}
            sx={{ mt: 2 }}
          >
            Reset to Defaults
          </Button>
          
          {/* Debug information */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle2">Current Configuration</Typography>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '1rem', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(settings, null, 2)}
            </pre>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
```

### 4. Protocol Identity Manager

**File**: `/src/lib/chat/ProtocolIdentityManager.ts`

Create a service to manage identities across protocols:

```typescript
/**
 * ProtocolIdentityManager.ts
 * 
 * Service for managing user identities across different chat protocols.
 * Handles key generation, storage, and retrieval for each protocol.
 */

import { ChatProtocol } from './ChatProtocolRegistry';
import chatSettingsService from '../../services/ChatSettingsService';
import { SecureStorage } from '../../utils/storage';

// Identity data for each protocol
interface ProtocolIdentity {
  publicKey: string;
  privateKey?: string;
  username?: string;
  metadata?: Record<string, any>;
}

// Identity manager options
interface IdentityManagerOptions {
  secureStorage?: boolean;
}

export class ProtocolIdentityManager {
  private static instance: ProtocolIdentityManager | null = null;
  private identities: Record<ChatProtocol, ProtocolIdentity | null>;
  private storage: SecureStorage;
  
  private constructor(options: IdentityManagerOptions = {}) {
    this.storage = new SecureStorage('starcom-identities');
    this.identities = {
      nostr: null,
      gun: null,
      secure: null,
      matrix: null
    };
    
    // Load existing identities
    this.loadIdentities();
  }
  
  public static getInstance(options?: IdentityManagerOptions): ProtocolIdentityManager {
    if (!ProtocolIdentityManager.instance) {
      ProtocolIdentityManager.instance = new ProtocolIdentityManager(options);
    }
    return ProtocolIdentityManager.instance;
  }
  
  private loadIdentities(): void {
    const savedIdentities = this.storage.get<Record<ChatProtocol, ProtocolIdentity | null>>('identities');
    
    if (savedIdentities) {
      this.identities = savedIdentities;
      
      // Update the public keys in settings
      const publicIdentities: Record<ChatProtocol, string> = {} as any;
      
      Object.entries(this.identities).forEach(([protocol, identity]) => {
        if (identity && identity.publicKey) {
          publicIdentities[protocol as ChatProtocol] = identity.publicKey;
        }
      });
      
      chatSettingsService.updateSettings({
        protocolIdentities: {
          ...chatSettingsService.getSettings().protocolIdentities,
          ...publicIdentities
        }
      });
    }
  }
  
  private saveIdentities(): void {
    this.storage.set('identities', this.identities);
  }
  
  // Generate a new identity for a protocol
  public async generateIdentity(protocol: ChatProtocol): Promise<ProtocolIdentity> {
    // Protocol-specific key generation logic
    let identity: ProtocolIdentity;
    
    switch (protocol) {
      case 'nostr':
        identity = await this.generateNostrIdentity();
        break;
      case 'gun':
        identity = await this.generateGunIdentity();
        break;
      case 'secure':
        identity = await this.generateSecureIdentity();
        break;
      case 'matrix':
        identity = await this.generateMatrixIdentity();
        break;
      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }
    
    // Save the identity
    this.identities[protocol] = identity;
    this.saveIdentities();
    
    // Update public key in settings
    const settings = chatSettingsService.getSettings();
    settings.protocolIdentities[protocol] = identity.publicKey;
    chatSettingsService.updateSettings({ protocolIdentities: settings.protocolIdentities });
    
    return identity;
  }
  
  // Protocol-specific identity generation methods
  private async generateNostrIdentity(): Promise<ProtocolIdentity> {
    // Use nostr-tools or similar library
    try {
      const { generatePrivateKey, getPublicKey } = await import('nostr-tools');
      const privateKey = generatePrivateKey();
      const publicKey = getPublicKey(privateKey);
      
      return {
        publicKey,
        privateKey,
        metadata: {
          created: Date.now()
        }
      };
    } catch (error) {
      console.error('Error generating Nostr identity:', error);
      throw error;
    }
  }
  
  private async generateGunIdentity(): Promise<ProtocolIdentity> {
    try {
      const GUN = (await import('gun')).default;
      const SEA = GUN.SEA;
      
      return new Promise((resolve, reject) => {
        SEA.pair((pair: any) => {
          if (!pair) {
            reject(new Error('Failed to generate Gun keypair'));
            return;
          }
          
          resolve({
            publicKey: pair.pub,
            privateKey: pair.priv,
            metadata: {
              created: Date.now(),
              pair
            }
          });
        });
      });
    } catch (error) {
      console.error('Error generating Gun identity:', error);
      throw error;
    }
  }
  
  private async generateSecureIdentity(): Promise<ProtocolIdentity> {
    // Use WebCrypto API for secure key generation
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        true,
        ['sign', 'verify']
      );
      
      const publicKey = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
      const privateKey = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
      
      return {
        publicKey: JSON.stringify(publicKey),
        privateKey: JSON.stringify(privateKey),
        metadata: {
          created: Date.now(),
          algorithm: 'ECDSA-P256'
        }
      };
    } catch (error) {
      console.error('Error generating Secure identity:', error);
      throw error;
    }
  }
  
  private async generateMatrixIdentity(): Promise<ProtocolIdentity> {
    // Simple placeholder for Matrix identity
    // In a real implementation, this would integrate with Matrix client library
    return {
      publicKey: `@user-${Date.now().toString(36)}:matrix.starcom.network`,
      metadata: {
        created: Date.now()
      }
    };
  }
  
  // Get identity for a protocol
  public getIdentity(protocol: ChatProtocol): ProtocolIdentity | null {
    return this.identities[protocol];
  }
  
  // Import identity from external source
  public importIdentity(protocol: ChatProtocol, data: ProtocolIdentity): void {
    this.identities[protocol] = data;
    this.saveIdentities();
    
    // Update public key in settings
    const settings = chatSettingsService.getSettings();
    settings.protocolIdentities[protocol] = data.publicKey;
    chatSettingsService.updateSettings({ protocolIdentities: settings.protocolIdentities });
  }
  
  // Export identity (with or without private keys)
  public exportIdentity(protocol: ChatProtocol, includePrivateKey: boolean = false): ProtocolIdentity | null {
    const identity = this.identities[protocol];
    
    if (!identity) {
      return null;
    }
    
    if (!includePrivateKey) {
      const { privateKey, ...publicData } = identity;
      return publicData;
    }
    
    return { ...identity };
  }
  
  // Delete an identity
  public deleteIdentity(protocol: ChatProtocol): void {
    this.identities[protocol] = null;
    this.saveIdentities();
    
    // Update settings
    const settings = chatSettingsService.getSettings();
    settings.protocolIdentities[protocol] = '';
    chatSettingsService.updateSettings({ protocolIdentities: settings.protocolIdentities });
  }
}

export default ProtocolIdentityManager.getInstance();
```

### 5. Protocol Adapter Integration with Identity Manager

**File**: `/src/lib/chat/adapters/NostrChatAdapter.ts` (Example)

Update the adapter to use the identity manager:

```typescript
// Add to imports
import identityManager from '../ProtocolIdentityManager';

// Inside the constructor
constructor(options?: NostrChatAdapterOptions) {
  super('NostrChatAdapter', options);
  
  this.userId = options?.userId || '';
  this.userName = options?.userName || '';
  
  // Check for Nostr identity
  const nostrIdentity = identityManager.getIdentity('nostr');
  if (nostrIdentity) {
    this.userId = nostrIdentity.publicKey;
    if (!this.userName && nostrIdentity.username) {
      this.userName = nostrIdentity.username;
    }
  }
  
  // Rest of constructor
}

// Add a method to sign messages with the identity's private key
private async signMessage(content: string): Promise<string> {
  const identity = identityManager.getIdentity('nostr');
  
  if (!identity || !identity.privateKey) {
    throw new Error('No Nostr identity found or private key not available');
  }
  
  try {
    const { signEvent } = await import('nostr-tools');
    const event = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content,
      pubkey: identity.publicKey
    };
    
    return signEvent(event, identity.privateKey);
  } catch (error) {
    console.error('Error signing Nostr message:', error);
    throw error;
  }
}
```

### 6. Admin Controls for Organizational Protocol Policies

**File**: `/src/components/Admin/ChatProtocolAdminPanel.tsx`

Create an admin panel for managing chat protocol policies:

```tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { ChatProtocol, PROTOCOL_INFO } from '../../lib/chat/ChatProtocolRegistry';
import { adminService } from '../../services/AdminService';

interface ProtocolPolicy {
  protocol: ChatProtocol;
  enabled: boolean;
  required: boolean;
  allowUserOverride: boolean;
  minimumSecurityLevel: 'low' | 'medium' | 'high';
  approvedEndpoints: string[];
}

const DEFAULT_POLICIES: Record<ChatProtocol, ProtocolPolicy> = {
  nostr: {
    protocol: 'nostr',
    enabled: true,
    required: true,
    allowUserOverride: false,
    minimumSecurityLevel: 'medium',
    approvedEndpoints: [
      'wss://relay.starcom.network',
      'wss://relay.damus.io'
    ]
  },
  gun: {
    protocol: 'gun',
    enabled: true,
    required: false,
    allowUserOverride: true,
    minimumSecurityLevel: 'medium',
    approvedEndpoints: [
      'https://gun-starcom.herokuapp.com/gun'
    ]
  },
  secure: {
    protocol: 'secure',
    enabled: true,
    required: true,
    allowUserOverride: false,
    minimumSecurityLevel: 'high',
    approvedEndpoints: []
  },
  matrix: {
    protocol: 'matrix',
    enabled: false,
    required: false,
    allowUserOverride: true,
    minimumSecurityLevel: 'medium',
    approvedEndpoints: []
  }
};

export function ChatProtocolAdminPanel() {
  const [policies, setPolicies] = useState<Record<ChatProtocol, ProtocolPolicy>>(DEFAULT_POLICIES);
  const [selectedProtocol, setSelectedProtocol] = useState<ChatProtocol>('nostr');
  const [isAddingEndpoint, setIsAddingEndpoint] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load policies from backend
  useEffect(() => {
    const loadPolicies = async () => {
      try {
        const orgPolicies = await adminService.getChatProtocolPolicies();
        setPolicies(orgPolicies || DEFAULT_POLICIES);
      } catch (error) {
        console.error('Error loading protocol policies:', error);
        // Fallback to defaults if loading fails
        setPolicies(DEFAULT_POLICIES);
      }
    };

    loadPolicies();
  }, []);

  const handlePolicyChange = (
    protocol: ChatProtocol,
    field: keyof ProtocolPolicy,
    value: any
  ) => {
    setPolicies({
      ...policies,
      [protocol]: {
        ...policies[protocol],
        [field]: value
      }
    });
    
    // Reset save status
    setSaveSuccess(false);
  };

  const handleAddEndpoint = () => {
    if (newEndpoint && !policies[selectedProtocol].approvedEndpoints.includes(newEndpoint)) {
      const updatedPolicies = { ...policies };
      updatedPolicies[selectedProtocol].approvedEndpoints.push(newEndpoint);
      setPolicies(updatedPolicies);
      setNewEndpoint('');
      setIsAddingEndpoint(false);
    }
  };

  const handleRemoveEndpoint = (protocol: ChatProtocol, index: number) => {
    const updatedPolicies = { ...policies };
    updatedPolicies[protocol].approvedEndpoints.splice(index, 1);
    setPolicies(updatedPolicies);
  };

  const handleSavePolicies = async () => {
    setIsSaving(true);
    try {
      await adminService.updateChatProtocolPolicies(policies);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving protocol policies:', error);
      alert('Failed to save protocol policies');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 900, mx: 'auto', my: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Chat Protocol Policies</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSavePolicies}
          disabled={isSaving}
        >
          Save Policies
        </Button>
      </Box>

      {saveSuccess && (
        <Box sx={{ mb: 2, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
          <Typography color="success.contrastText">
            <CheckIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Policies saved successfully
          </Typography>
        </Box>
      )}

      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Configure organization-wide policies for chat protocols
      </Typography>

      <TableContainer component={Paper} elevation={1} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Protocol</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Required</TableCell>
              <TableCell>User Override</TableCell>
              <TableCell>Security Level</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.values(policies).map((policy) => (
              <TableRow key={policy.protocol}>
                <TableCell>
                  <Typography variant="subtitle2">
                    {PROTOCOL_INFO[policy.protocol].name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={policy.enabled}
                        onChange={(e) => 
                          handlePolicyChange(policy.protocol, 'enabled', e.target.checked)
                        }
                      />
                    }
                    label={policy.enabled ? 'Enabled' : 'Disabled'}
                  />
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={policy.required}
                        onChange={(e) => 
                          handlePolicyChange(policy.protocol, 'required', e.target.checked)
                        }
                        disabled={!policy.enabled}
                      />
                    }
                    label={policy.required ? 'Required' : 'Optional'}
                  />
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={policy.allowUserOverride}
                        onChange={(e) => 
                          handlePolicyChange(
                            policy.protocol, 
                            'allowUserOverride', 
                            e.target.checked
                          )
                        }
                        disabled={!policy.enabled}
                      />
                    }
                    label={policy.allowUserOverride ? 'Allowed' : 'Restricted'}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={policy.minimumSecurityLevel}
                    size="small"
                    onChange={(e) => 
                      handlePolicyChange(
                        policy.protocol, 
                        'minimumSecurityLevel', 
                        e.target.value
                      )
                    }
                    disabled={!policy.enabled}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => setSelectedProtocol(policy.protocol)}
                    disabled={!policy.enabled}
                  >
                    Configure
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Protocol Details Section */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            {PROTOCOL_INFO[selectedProtocol].name} Configuration
          </Typography>
          <Chip 
            label={policies[selectedProtocol].enabled ? 'Enabled' : 'Disabled'} 
            color={policies[selectedProtocol].enabled ? 'success' : 'error'}
          />
        </Box>

        <Typography variant="body2" sx={{ mb: 3 }}>
          {PROTOCOL_INFO[selectedProtocol].description}
        </Typography>

        <Typography variant="subtitle1" gutterBottom>
          Approved Endpoints
        </Typography>

        {policies[selectedProtocol].approvedEndpoints.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No approved endpoints configured. Add endpoints to restrict users to specific servers.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Endpoint URL</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {policies[selectedProtocol].approvedEndpoints.map((endpoint, index) => (
                  <TableRow key={index}>
                    <TableCell>{endpoint}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveEndpoint(selectedProtocol, index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          size="small"
          onClick={() => setIsAddingEndpoint(true)}
          disabled={!policies[selectedProtocol].enabled}
          sx={{ mb: 3 }}
        >
          Add Approved Endpoint
        </Button>

        <Typography variant="subtitle1" gutterBottom>
          Protocol Policy Settings
        </Typography>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={policies[selectedProtocol].required}
                onChange={(e) => 
                  handlePolicyChange(selectedProtocol, 'required', e.target.checked)
                }
                disabled={!policies[selectedProtocol].enabled}
              />
            }
            label="Required for all organization users"
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
            When enabled, all users must use this protocol
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={policies[selectedProtocol].allowUserOverride}
                onChange={(e) => 
                  handlePolicyChange(selectedProtocol, 'allowUserOverride', e.target.checked)
                }
                disabled={!policies[selectedProtocol].enabled}
              />
            }
            label="Allow users to configure endpoints"
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
            When enabled, users can add their own endpoints beyond the approved list
          </Typography>
        </Box>
      </Paper>

      {/* Add Endpoint Dialog */}
      <Dialog open={isAddingEndpoint} onClose={() => setIsAddingEndpoint(false)}>
        <DialogTitle>Add Approved Endpoint</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Endpoint URL"
            fullWidth
            variant="outlined"
            value={newEndpoint}
            onChange={(e) => setNewEndpoint(e.target.value)}
            placeholder={
              selectedProtocol === 'nostr' 
                ? 'wss://relay.example.com' 
                : 'https://example.com/endpoint'
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddingEndpoint(false)}>Cancel</Button>
          <Button onClick={handleAddEndpoint} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
```

## Phase 4 Schedule

| Task | Duration | Description |
|------|----------|-------------|
| 4.1 | 1-2 days | Create ChatSettingsService |
| 4.2 | 2-3 days | Integrate settings with ChatContext |
| 4.3 | 3-4 days | Build ChatSettingsPanel UI |
| 4.4 | 2-3 days | Create ProtocolIdentityManager |
| 4.5 | 2-3 days | Update adapters to use identity manager |
| 4.6 | 2-3 days | Build admin controls for protocol policies |
| 4.7 | 2-3 days | Testing and refinement |

**Total Estimated Time**: 2-3 weeks

## Integration Points and Dependencies

1. **Identity Management**:
   - Requires nostr-tools library for Nostr identity management
   - Depends on Gun/SEA for Gun identity management
   - Needs secure storage implementation

2. **Protocol Configuration**:
   - Depends on the protocol registry from Phase 3
   - Requires protocol-specific implementation details

3. **UI Components**:
   - Depends on Material-UI for component styling
   - Requires react-beautiful-dnd for drag-and-drop reordering

4. **Admin Functionality**:
   - Depends on AdminService for persisting organization policies
   - Requires proper access control implementation

## Testing Plan

1. **Unit Tests**:
   - Test ChatSettingsService storage and retrieval
   - Test ProtocolIdentityManager key generation and management
   - Test settings integration with ChatContext

2. **Integration Tests**:
   - Test settings changes affecting protocol behavior
   - Test identity persistence across sessions
   - Test protocol fallback based on settings

3. **UI Testing**:
   - Test settings panel interactions
   - Test drag-and-drop protocol reordering
   - Test admin policy enforcement

## Rollout Strategy

1. Deploy settings infrastructure first (ChatSettingsService)
2. Add identity management capabilities
3. Integrate with existing chat components
4. Release user-facing settings UI
5. Add admin controls in a separate release
