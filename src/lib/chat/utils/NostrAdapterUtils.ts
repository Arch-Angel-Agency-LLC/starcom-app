/**
 * NostrAdapterUtils.ts
 * 
 * Utility functions to help map between NostrService types and the unified ChatInterface types.
 * This helps ensure type safety and consistent mapping between the two systems.
 */

import { 
  ChatMessage, 
  ChatUser, 
  ChatChannel 
} from '../ChatInterface';

import { 
  NostrMessage, 
  NostrTeamChannel
} from '../../../services/nostrService';
import { Event } from 'nostr-tools';

// Interface for presence data from Nostr
export interface NostrPresence {
  pubkey: string;
  name?: string;
  presence?: 'online' | 'offline' | 'away';
  lastSeen?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Convert a Nostr Event to a NostrMessage
 */
export function eventToNostrMessage(event: Event, channelId: string): NostrMessage {
  // Extract team ID from tags if available
  const teamId = event.tags?.find(tag => tag[0] === 'team')?.[1] || 'unknown-team';
  
  // Create a NostrMessage from the Event
  return {
    id: event.id,
    teamId,
    channelId,
    senderId: event.pubkey.substring(0, 10),
    senderDID: `did:nostr:${event.pubkey}`,
    senderAgency: 'CYBER_COMMAND',
    content: event.content,
    clearanceLevel: 'CONFIDENTIAL',
    messageType: 'text',
    timestamp: event.created_at * 1000, // Convert to milliseconds
    encrypted: false,
    pqcEncrypted: false,
    metadata: {}
  };
}

/**
 * Convert a NostrMessage to a unified ChatMessage
 */
export function nostrMessageToChatMessage(nostrMsg: NostrMessage): ChatMessage {
  return {
    id: nostrMsg.id,
    senderId: nostrMsg.senderId,
    senderName: nostrMsg.senderDID.split(':').pop() || nostrMsg.senderId,
    content: nostrMsg.content,
    timestamp: nostrMsg.timestamp,
    channelId: nostrMsg.channelId,
    type: mapNostrMessageTypeToChatType(nostrMsg.messageType),
    status: 'sent', // NostrService doesn't track message status in the same way
    metadata: {
      ...nostrMsg.metadata,
      clearanceLevel: nostrMsg.clearanceLevel,
      senderAgency: nostrMsg.senderAgency,
      senderDID: nostrMsg.senderDID,
      encrypted: nostrMsg.encrypted,
      pqcEncrypted: nostrMsg.pqcEncrypted,
      evidenceHash: nostrMsg.evidenceHash,
      truthScore: nostrMsg.truthScore,
      verificationStatus: nostrMsg.verificationStatus,
      resistanceCell: nostrMsg.resistanceCell,
      operativeLevel: nostrMsg.operativeLevel
    }
  };
}

/**
 * Convert a ChatMessage to a NostrMessage
 */
export function chatMessageToNostrMessage(chatMsg: ChatMessage, additionalData?: {
  senderDID?: string;
  senderAgency?: string;
  clearanceLevel?: string;
  teamId?: string;
}): NostrMessage {
  return {
    id: chatMsg.id,
    teamId: additionalData?.teamId || chatMsg.channelId.replace('team-', ''),
    channelId: chatMsg.channelId,
    senderId: chatMsg.senderId,
    senderDID: additionalData?.senderDID || `did:ea:${chatMsg.senderId}`,
    senderAgency: 'CYBER_COMMAND', // Default value
    content: chatMsg.content,
    clearanceLevel: 'CONFIDENTIAL', // Default value
    messageType: mapChatTypeToNostrMessageType(chatMsg.type),
    timestamp: chatMsg.timestamp,
    encrypted: chatMsg.metadata?.encrypted as boolean || false,
    pqcEncrypted: chatMsg.metadata?.pqcEncrypted as boolean || false,
    evidenceHash: chatMsg.metadata?.evidenceHash as string,
    truthScore: chatMsg.metadata?.truthScore as number,
    verificationStatus: 'unverified',
    resistanceCell: chatMsg.metadata?.resistanceCell as string,
    operativeLevel: 'civilian',
    metadata: chatMsg.metadata || {}
  };
}

/**
 * Convert a NostrTeamChannel to a unified ChatChannel
 */
export function nostrChannelToChatChannel(nostrChannel: NostrTeamChannel): ChatChannel {
  return {
    id: nostrChannel.id,
    name: nostrChannel.name,
    type: 'team',
    participants: nostrChannel.participants || [],
    metadata: {
      teamId: nostrChannel.teamId,
      description: nostrChannel.description,
      clearanceLevel: nostrChannel.clearanceLevel,
      isEncrypted: !!nostrChannel.encryptionKey,
      isPQCEnabled: !!nostrChannel.pqcKey,
      createdAt: nostrChannel.createdAt,
      participants: nostrChannel.participants || []
    }
  };
}

/**
 * Map NostrMessage message types to ChatMessage types
 */
function mapNostrMessageTypeToChatType(
  nostrType: string
): 'text' | 'file' | 'system' | 'intelligence' | 'alert' {
  switch (nostrType) {
    case 'file':
      return 'file';
    case 'intelligence':
      return 'intelligence';
    case 'alert':
      return 'alert';
    case 'status':
      return 'system';
    default:
      return 'text';
  }
}

/**
 * Map ChatMessage types to NostrMessage message types
 */
function mapChatTypeToNostrMessageType(
  chatType?: 'text' | 'file' | 'system' | 'intelligence' | 'alert'
): NostrMessage['messageType'] {
  switch (chatType) {
    case 'file':
      return 'file';
    case 'intelligence':
      return 'intelligence';
    case 'alert':
      return 'alert';
    case 'system':
      return 'status';
    default:
      return 'text';
  }
}

/**
 * Convert a user presence object from Nostr to a ChatUser
 */
export function nostrPresenceToChatUser(presence: NostrPresence): ChatUser {
  return {
    id: presence.pubkey,
    name: presence.name || presence.pubkey.substring(0, 8),
    status: (presence.presence || 'offline') as 'online' | 'offline' | 'away',
    lastSeen: presence.lastSeen,
    publicKey: presence.pubkey,
    metadata: {
      ...presence.metadata,
      online: presence.presence === 'online'
    }
  };
}
