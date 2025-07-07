/**
 * ChatAdapterTypes.ts
 * 
 * Defines the core types used by the chat adapter system.
 * This includes the enhanced message types, connection status types,
 * and other shared interfaces used throughout the chat system.
 */

import { ChatProviderCapabilities } from './ProtocolTypes';

/**
 * Connection status of a chat provider.
 */
export type ConnectionStatus = 
  | 'disconnected'    // Not connected to any server/relay
  | 'connecting'      // Connection attempt in progress
  | 'connected'       // Successfully connected
  | 'reconnecting'    // Attempting to reconnect after a connection loss
  | 'disconnecting'   // Disconnection in progress
  | 'error';          // Connection error occurred

/**
 * Detailed connection information.
 */
export interface ConnectionDetails {
  status: ConnectionStatus;
  connectedAt?: number;      // Timestamp of when connection was established
  latency?: number;          // Connection latency in ms
  reconnectAttempt?: number; // Current reconnect attempt count
  errorMessage?: string;     // Error message if status is 'error'
  endpoint?: string;         // Current connected endpoint
  protocol?: string;         // Protocol being used (e.g., 'ws', 'http')
  encryptionEnabled?: boolean; // Whether encryption is enabled
  metadata?: Record<string, unknown>; // Additional protocol-specific details
}

/**
 * Enhanced message type with support for all protocols.
 */
export interface EnhancedChatMessage {
  id: string;                 // Unique identifier for the message
  senderId: string;           // ID of the sender
  senderName: string;         // Display name of the sender
  content: string;            // Message content
  timestamp: number;          // Timestamp of when the message was sent
  channelId: string;          // ID of the channel this message belongs to
  type?: MessageType;         // Type of message
  status?: MessageStatus;     // Current status of the message
  attachments?: Attachment[]; // File attachments
  metadata?: Record<string, unknown>; // Additional protocol-specific metadata
  
  // Enhanced fields
  replyTo?: string;           // ID of the message this is replying to
  reactions?: Reaction[];     // User reactions to this message
  edited?: boolean;           // Whether the message has been edited
  editTimestamp?: number;     // Timestamp of the last edit
  threadId?: string;          // ID of the thread this message belongs to
  mentions?: string[];        // User IDs mentioned in this message
  tags?: string[];            // Tags/keywords in this message
  priority?: MessagePriority; // Message priority level
  expiresAt?: number;         // Timestamp when this message expires/auto-deletes
  deliveredTo?: string[];     // User IDs this message has been delivered to
  readBy?: string[];          // User IDs that have read this message
}

/**
 * Types of messages that can be sent.
 */
export type MessageType = 
  | 'text'          // Plain text message
  | 'file'          // File attachment message
  | 'system'        // System notification
  | 'intelligence'  // Intelligence report
  | 'alert'         // Alert notification
  | 'audio'         // Audio message
  | 'video'         // Video message
  | 'location'      // Location share
  | 'code'          // Code snippet
  | 'command'       // Command execution
  | 'event';        // Event notification

/**
 * Current status of a message.
 */
export type MessageStatus = 
  | 'sending'    // Message is being sent
  | 'sent'       // Message has been sent
  | 'delivered'  // Message has been delivered
  | 'read'       // Message has been read
  | 'failed'     // Message failed to send
  | 'deleted';   // Message has been deleted

/**
 * Priority level of a message.
 */
export type MessagePriority = 
  | 'low'       // Low priority message
  | 'normal'    // Normal priority message
  | 'high'      // High priority message
  | 'urgent'    // Urgent priority message
  | 'critical'; // Critical priority message

/**
 * File attachment in a message.
 */
export interface Attachment {
  id: string;        // Unique identifier for the attachment
  name: string;      // File name
  url: string;       // URL to the file
  size: number;      // File size in bytes
  type: string;      // MIME type
  thumbnail?: string; // URL to a thumbnail image
  metadata?: Record<string, unknown>; // Additional metadata
}

/**
 * User reaction to a message.
 */
export interface Reaction {
  userId: string;    // ID of the user who reacted
  type: string;      // Type of reaction (e.g., 'like', 'heart', '👍')
  timestamp: number; // When the reaction was added
}

/**
 * Enhanced user profile.
 */
export interface EnhancedChatUser {
  id: string;                 // Unique identifier for the user
  name: string;               // Display name
  status: UserStatus;         // Current online status
  lastSeen?: number;          // Timestamp of when the user was last seen
  publicKey?: string;         // Public key for E2E encryption
  agency?: string;            // Agency/organization the user belongs to
  clearanceLevel?: string;    // Security clearance level
  metadata?: Record<string, unknown>; // Additional protocol-specific metadata
  
  // Enhanced fields
  avatar?: string;            // URL to user's avatar image
  role?: string;              // User's role in the system
  badges?: string[];          // Achievement/status badges
  customStatus?: string;      // Custom status message
  location?: string;          // Current location
  timezone?: string;          // User's timezone
  language?: string;          // Preferred language
  contactInfo?: ContactInfo;  // Additional contact information
  preferences?: UserPreferences; // User preferences
  profile?: UserProfile;      // Extended profile information
}

/**
 * User's online status.
 */
export type UserStatus = 
  | 'online'     // User is online and active
  | 'away'       // User is online but inactive/away
  | 'busy'       // User is online but busy/do not disturb
  | 'offline'    // User is offline
  | 'invisible'; // User appears offline but can receive messages

/**
 * Contact information for a user.
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  socials?: Record<string, string>; // Social media links
}

/**
 * User preferences.
 */
export interface UserPreferences {
  notifications?: boolean;
  theme?: 'light' | 'dark' | 'system';
  messageSounds?: boolean;
  language?: string;
  timezone?: string;
  privacy?: 'public' | 'private' | 'contacts-only';
}

/**
 * Extended user profile information.
 */
export interface UserProfile {
  bio?: string;
  company?: string;
  position?: string;
  skills?: string[];
  interests?: string[];
  joinedAt?: number;
}

/**
 * Enhanced chat channel.
 */
export interface EnhancedChatChannel {
  id: string;                 // Unique identifier for the channel
  name: string;               // Display name
  type: ChannelType;          // Type of channel
  participants: string[];     // User IDs participating in this channel
  lastMessage?: EnhancedChatMessage; // Last message in the channel
  unreadCount?: number;       // Number of unread messages
  metadata?: Record<string, unknown>; // Additional protocol-specific metadata
  
  // Enhanced fields
  description?: string;       // Channel description
  avatar?: string;            // URL to channel's avatar image
  createdAt?: number;         // Timestamp of when the channel was created
  createdBy?: string;         // ID of the user who created the channel
  modifiedAt?: number;        // Timestamp of when the channel was last modified
  pinned?: boolean;           // Whether the channel is pinned
  archived?: boolean;         // Whether the channel is archived
  muted?: boolean;            // Whether the channel is muted
  permissions?: ChannelPermissions; // Channel-specific permissions
  topic?: string;             // Channel topic/purpose
  tags?: string[];            // Tags/keywords for the channel
  messageCount?: number;      // Total number of messages in the channel
  pinnedMessages?: string[];  // IDs of pinned messages
  parentChannel?: string;     // ID of the parent channel if this is a thread/subchannel
  subchannels?: string[];     // IDs of subchannels
}

/**
 * Types of chat channels.
 */
export type ChannelType = 
  | 'direct'     // One-on-one direct message
  | 'group'      // Small group chat
  | 'team'       // Team channel
  | 'global'     // Global/organization-wide channel
  | 'broadcast'  // Broadcast-only channel
  | 'thread'     // Thread/conversation
  | 'encrypted'  // End-to-end encrypted channel
  | 'temporary'; // Temporary/ephemeral channel

/**
 * Channel-specific permissions.
 */
export interface ChannelPermissions {
  public?: boolean;           // Whether the channel is publicly visible
  joinable?: boolean;         // Whether users can join without invitation
  readOnly?: boolean;         // Whether the channel is read-only for most users
  moderated?: boolean;        // Whether messages require approval
  adminOnly?: string[];       // Actions that only admins can perform
  memberPermissions?: Record<string, boolean>; // Permissions for regular members
  moderatorPermissions?: Record<string, boolean>; // Permissions for moderators
  admins?: string[];          // User IDs of channel admins
  moderators?: string[];      // User IDs of channel moderators
  banned?: string[];          // User IDs banned from the channel
}

/**
 * Options for initializing a chat provider.
 */
export interface EnhancedChatProviderOptions {
  userId?: string;                // User ID for the current user
  userName?: string;              // Display name for the current user
  publicKey?: string;             // Public key for E2E encryption
  endpoints?: string[];           // Connection endpoints (servers, relays, etc.)
  encryption?: boolean;           // Whether to enable encryption
  encryptionEnabled?: boolean;    // Whether encryption is currently enabled
  pqcEnabled?: boolean;           // Whether post-quantum cryptography is enabled
  storageStrategy?: StorageStrategy; // How to store messages and state
  maxRetries?: number;            // Maximum number of retry attempts for operations
  retryBackoffMs?: number;        // Base delay for exponential backoff
  circuitBreakerMaxFailures?: number; // Max failures before circuit opens
  circuitBreakerResetTimeoutMs?: number; // Time before circuit resets
  autoReconnect?: boolean;        // Whether to automatically reconnect
  reconnectIntervalMs?: number;   // Interval between reconnect attempts
  preferredCapabilities?: ChatProviderCapabilities; // Preferred capabilities
  logLevel?: LogLevel;            // Logging verbosity level
  metadata?: Record<string, unknown>; // Additional provider-specific options
}

/**
 * Storage strategy for chat data.
 */
export type StorageStrategy = 
  | 'memory'      // In-memory only (lost on refresh/close)
  | 'local'       // Local storage (persistent across sessions)
  | 'session'     // Session storage (lost on close)
  | 'persistent'  // IndexedDB or similar (more robust than localStorage)
  | 'encrypted'   // Encrypted persistent storage
  | 'remote'      // Remote storage only (no local cache)
  | 'hybrid';     // Combination of local cache and remote storage

/**
 * Logging verbosity level.
 */
export type LogLevel = 
  | 'debug'  // Verbose debug information
  | 'info'   // Regular operational information
  | 'warn'   // Warnings and potential issues
  | 'error'  // Errors that need attention
  | 'none';  // No logging

