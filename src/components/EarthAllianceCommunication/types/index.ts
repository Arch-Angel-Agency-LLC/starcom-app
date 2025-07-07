export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  priority: number;
  signature?: string;
  encryption?: string;
  attachments?: Attachment[];
  channelId: string;
}

export interface Attachment {
  id: string;
  type: string;
  url: string;
  name: string;
  size: number;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  securityLevel: number;
  participants: string[];
  isEncrypted: boolean;
  allowsAttachments: boolean;
  maxMessageSize: number;
}

export interface ChannelStatus {
  isActive: boolean;
  lastMessageTimestamp: number;
  unreadCount: number;
  participantCount: number;
  isTyping: string[];
}

export interface NostrConfig {
  endpoints: string[];
  fallbackEndpoints: string[];
  reconnectStrategy: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
  };
  batchSize: number;
  compressionLevel: number;
  encryptionAlgorithm: string;
  signatureAlgorithm: string;
}
