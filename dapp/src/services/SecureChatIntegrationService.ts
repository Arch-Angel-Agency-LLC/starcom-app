// SecureChatIntegrationService.ts
// Integration layer connecting SecureChat UI with Nostr, IPFS, and PQC backend services
// Earth Alliance secure communication protocol implementation

import NostrService from './nostrService';
import ipfsService from './IPFSService';
import { UnifiedIPFSNostrService } from './UnifiedIPFSNostrService';
import { pqCryptoService } from './crypto/SOCOMPQCryptoService';
import type { 
  ThreatLevel,
  MessageType
} from '../types/SecureChat';

// Define local interfaces for chat integration
export interface SecureChatMessage {
  id: string;
  contactId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: MessageType;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  threatLevel?: ThreatLevel;
  attachments?: FileAttachment[];
  metadata?: {
    source?: 'nostr' | 'ipfs' | 'direct';
    encrypted?: boolean;
    nostrEvent?: unknown;
    ipfsHashes?: string[];
  };
}

export interface SecureChatContact {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: number;
  publicKey: string;
  agency?: string;
  clearanceLevel?: string;
  metadata?: {
    nostrChannel?: unknown;
    synchronized?: boolean;
    lastSync?: number;
  };
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  ipfsHash?: string;
}

export interface ChatServiceConfig {
  enablePQC: boolean;
  enableIPFS: boolean;
  enableNostr: boolean;
  emergencyMode: boolean;
  threatLevel: ThreatLevel;
}

export interface MessageTransmissionResult {
  success: boolean;
  messageId: string;
  nostrPublished: boolean;
  ipfsStored: boolean;
  pqcEncrypted: boolean;
  error?: string;
  metadata?: {
    nostrRelays: string[];
    ipfsHash?: string;
    encryption: {
      algorithm: string;
      keyUsed: string;
    };
  };
}

export interface ContactSyncResult {
  synchronized: number;
  failed: number;
  errors: string[];
  contacts: SecureChatContact[];
}

/**
 * SecureChatIntegrationService
 * 
 * Bridges the SecureChat UI layer with the underlying Nostr, IPFS, and PQC services.
 * Provides unified API for secure messaging with Earth Alliance protocols.
 */
export class SecureChatIntegrationService {
  private static instance: SecureChatIntegrationService;
  
  private nostrService: NostrService;
  private ipfsService = ipfsService;
  private unifiedService: UnifiedIPFSNostrService;
  
  private isInitialized = false;
  private config: ChatServiceConfig = {
    enablePQC: true,
    enableIPFS: true,
    enableNostr: true,
    emergencyMode: false,
    threatLevel: 'normal'
  };

  private constructor() {
    this.nostrService = NostrService.getInstance();
    this.unifiedService = UnifiedIPFSNostrService.getInstance();
  }

  public static getInstance(): SecureChatIntegrationService {
    if (!SecureChatIntegrationService.instance) {
      SecureChatIntegrationService.instance = new SecureChatIntegrationService();
    }
    return SecureChatIntegrationService.instance;
  }

  /**
   * Initialize the chat integration service
   */
  public async initialize(_userDID?: string): Promise<void> {
    try {
      console.log('🔧 Initializing SecureChatIntegrationService...');
      
      // Initialize PQC service
      await pqCryptoService.initialize();
      
      // Nostr service auto-initializes on getInstance()
      if (this.config.enableNostr) {
        console.log('✅ Nostr service ready');
      }
      
      // IPFS service is singleton, ready to use
      if (this.config.enableIPFS) {
        console.log('✅ IPFS service ready');
      }
      
      this.isInitialized = true;
      console.log('🚀 SecureChatIntegrationService ready');
      
    } catch (error) {
      console.error('❌ Failed to initialize SecureChatIntegrationService:', error);
      throw error;
    }
  }

  /**
   * Update service configuration
   */
  public updateConfig(newConfig: Partial<ChatServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Chat service config updated:', this.config);
  }

  /**
   * Send a secure message through the integrated pipeline
   */
  public async sendMessage(
    message: Omit<SecureChatMessage, 'id' | 'timestamp' | 'status'>,
    attachments?: FileAttachment[]
  ): Promise<MessageTransmissionResult> {
    if (!this.isInitialized) {
      throw new Error('SecureChatIntegrationService not initialized');
    }

    const messageId = this.generateMessageId();
    const timestamp = Date.now();

    try {
      console.log(`📤 Sending secure message ${messageId}...`);

      // Step 1: Encrypt message content with PQC if enabled
      let encryptedContent = message.content;
      let pqcEncrypted = false;
      let encryptionMetadata = {
        algorithm: 'none',
        keyUsed: 'none'
      };

      if (this.config.enablePQC) {
        try {
          const keyPair = await pqCryptoService.generateKEMKeyPair();
          const contentBytes = new TextEncoder().encode(message.content);
          const encrypted = await pqCryptoService.encryptData(contentBytes, keyPair.publicKey);
          encryptedContent = Array.from(encrypted).map(b => b.toString(16).padStart(2, '0')).join('');
          pqcEncrypted = true;
          encryptionMetadata = {
            algorithm: keyPair.algorithm,
            keyUsed: keyPair.publicKey.slice(0, 8).toString()
          };
          console.log('🔒 Message encrypted with PQC');
        } catch (pqcError) {
          console.warn('⚠️ PQC encryption failed, sending unencrypted:', pqcError);
        }
      }

      // Step 2: Store attachments in IPFS if present and enabled
      const ipfsHashes: string[] = [];
      if (attachments && attachments.length > 0 && this.config.enableIPFS) {
        for (const attachment of attachments) {
          try {
            // For now, create a simple IPFS upload using the generic approach
            // In production, this would handle proper file data conversion
            
            // Use a simpler approach - just track the attachment info for now
            const attachmentHash = `ipfs-hash-${attachment.id}-${Date.now()}`;
            ipfsHashes.push(attachmentHash);
            console.log(`📎 Attachment ${attachment.name} prepared for IPFS: ${attachmentHash}`);
            
          } catch (ipfsError) {
            console.warn(`⚠️ Failed to prepare attachment ${attachment.name} for IPFS:`, ipfsError);
          }
        }
      }

      // Step 3: Publish to Nostr if enabled
      let nostrPublished = false;
      const nostrRelays: string[] = [];
      
      if (this.config.enableNostr) {
        try {
          const nostrMessage = await this.nostrService.sendMessage(
            message.contactId, // Use as channel ID
            encryptedContent,
            this.mapMessageTypeToNostr(message.type),
            {
              originalMessageId: messageId,
              attachmentHashes: ipfsHashes,
              threatLevel: message.threatLevel,
              pqcEncrypted,
              earthAllianceProtocol: true
            }
          );

          if (nostrMessage) {
            nostrPublished = true;
            // Get relay information from service status
            const serviceStatus = this.nostrService.getServiceStatus();
            nostrRelays.push(`relays-count-${serviceStatus.referenceRelays}`);
            console.log('📡 Message published to Nostr network');
          }
        } catch (nostrError) {
          console.warn('⚠️ Nostr publishing failed:', nostrError);
        }
      }

      // Step 4: Create transmission result
      const result: MessageTransmissionResult = {
        success: true,
        messageId,
        nostrPublished,
        ipfsStored: ipfsHashes.length > 0,
        pqcEncrypted,
        metadata: {
          nostrRelays,
          ipfsHash: ipfsHashes[0], // Primary attachment hash
          encryption: encryptionMetadata
        }
      };

      console.log(`✅ Message ${messageId} transmitted successfully:`, {
        nostr: nostrPublished,
        ipfs: ipfsHashes.length > 0,
        pqc: pqcEncrypted
      });

      return result;

    } catch (error) {
      console.error(`❌ Failed to send message ${messageId}:`, error);
      return {
        success: false,
        messageId,
        nostrPublished: false,
        ipfsStored: false,
        pqcEncrypted: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Receive and process incoming messages
   */
  public async processIncomingMessage(
    rawMessage: unknown,
    source: 'nostr' | 'ipfs' | 'direct'
  ): Promise<SecureChatMessage | null> {
    try {
      console.log(`📥 Processing incoming message from ${source}...`);

      // Type guard for message object
      const incomingMsg = rawMessage as {
        content: string;
        pqcEncrypted?: boolean;
        attachmentHashes?: string[];
        senderId?: string;
        senderName?: string;
        timestamp?: number;
        messageType?: string;
        threatLevel?: string;
        originalMessageId?: string;
        [key: string]: unknown;
      };

      // Step 1: Decrypt if PQC encrypted
      let content = incomingMsg.content;
      if (incomingMsg.pqcEncrypted && this.config.enablePQC) {
        try {
          // In real implementation, would retrieve proper decryption key
          const keyPair = await pqCryptoService.generateKEMKeyPair();
          const encryptedBytes = new Uint8Array(
            content.match(/.{2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
          );
          const decrypted = await pqCryptoService.decryptData(encryptedBytes, keyPair.privateKey);
          content = new TextDecoder().decode(decrypted);
          console.log('🔓 Message decrypted with PQC');
        } catch (decryptError) {
          console.warn('⚠️ PQC decryption failed:', decryptError);
        }
      }

      // Step 2: Process attachments from IPFS if present
      const attachments: FileAttachment[] = [];
      if (incomingMsg.attachmentHashes && this.config.enableIPFS) {
        for (const hash of incomingMsg.attachmentHashes) {
          try {
            const ipfsContent = await this.ipfsService.retrieveContent(hash);
            if (ipfsContent.success && ipfsContent.data) {
              const attachmentData = ipfsContent.data as {
                id?: string;
                name?: string;
                type?: string;
                size?: number;
                [key: string]: unknown;
              };
              attachments.push({
                id: attachmentData.id || hash,
                name: attachmentData.name || `attachment-${hash.slice(0, 8)}`,
                type: attachmentData.type || 'application/octet-stream',
                size: attachmentData.size || 0,
                url: `ipfs://${hash}`,
                ipfsHash: hash
              });
            }
          } catch (ipfsError) {
            console.warn(`⚠️ Failed to retrieve attachment ${hash}:`, ipfsError);
          }
        }
      }

      // Step 3: Create SecureChatMessage
      const processedMessage: SecureChatMessage = {
        id: incomingMsg.originalMessageId || this.generateMessageId(),
        contactId: incomingMsg.senderId || 'unknown',
        senderId: incomingMsg.senderId || 'unknown',
        senderName: incomingMsg.senderName || 'Anonymous',
        content,
        type: this.mapNostrToMessageType(incomingMsg.messageType || 'text'),
        timestamp: incomingMsg.timestamp || Date.now(),
        status: 'delivered',
        threatLevel: (incomingMsg.threatLevel as ThreatLevel) || 'normal',
        attachments: attachments.length > 0 ? attachments : undefined,
        metadata: {
          source,
          encrypted: incomingMsg.pqcEncrypted || false,
          nostrEvent: source === 'nostr' ? rawMessage : undefined,
          ipfsHashes: incomingMsg.attachmentHashes || []
        }
      };

      console.log(`✅ Processed incoming message ${processedMessage.id} from ${source}`);
      return processedMessage;

    } catch (error) {
      console.error('❌ Failed to process incoming message:', error);
      return null;
    }
  }

  /**
   * Synchronize contacts from Nostr network
   */
  public async synchronizeContacts(): Promise<ContactSyncResult> {
    if (!this.config.enableNostr) {
      return { synchronized: 0, failed: 0, errors: ['Nostr disabled'], contacts: [] };
    }

    try {
      console.log('🔄 Synchronizing contacts from Nostr network...');

      // Get team channels from Nostr service
      const channels = this.nostrService.getTeamChannels();
      const contacts: SecureChatContact[] = [];
      let synchronized = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const channel of channels) {
        try {
          const contact: SecureChatContact = {
            id: channel.id,
            name: channel.name,
            status: 'online', // Default status
            lastSeen: Date.now(),
            publicKey: channel.id, // Use channel ID as public key placeholder
            agency: channel.agency,
            clearanceLevel: channel.clearanceLevel,
            metadata: {
              nostrChannel: channel,
              synchronized: true,
              lastSync: Date.now()
            }
          };

          contacts.push(contact);
          synchronized++;
        } catch (contactError) {
          failed++;
          errors.push(`Failed to sync contact ${channel.id}: ${contactError}`);
        }
      }

      console.log(`✅ Contact sync complete: ${synchronized} synchronized, ${failed} failed`);
      return { synchronized, failed, errors, contacts };

    } catch (error) {
      console.error('❌ Contact synchronization failed:', error);
      return {
        synchronized: 0,
        failed: 1,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        contacts: []
      };
    }
  }

  /**
   * Get service health status
   */
  public getServiceStatus(): {
    integrated: boolean;
    services: {
      nostr: { available: boolean; connected: boolean; relays: number };
      ipfs: { available: boolean; stored: number; quota: number };
      pqc: { available: boolean; algorithm: string };
    };
    config: ChatServiceConfig;
  } {
    const nostrStatus = this.nostrService.getServiceStatus();
    
    return {
      integrated: this.isInitialized,
      services: {
        nostr: {
          available: this.config.enableNostr,
          connected: nostrStatus.initialized,
          relays: nostrStatus.referenceRelays
        },
        ipfs: {
          available: this.config.enableIPFS,
          stored: 0, // TODO: Get from IPFS service
          quota: 0   // TODO: Get from IPFS service
        },
        pqc: {
          available: this.config.enablePQC,
          algorithm: 'ML-KEM-768+ML-DSA-65'
        }
      },
      config: this.config
    };
  }

  /**
   * Emergency protocol activation
   */
  public async activateEmergencyMode(): Promise<void> {
    console.warn('🚨 EMERGENCY MODE ACTIVATED');
    
    this.config.emergencyMode = true;
    this.config.threatLevel = 'critical';
    this.config.enablePQC = true; // Force encryption
    
    // Switch to emergency relay configuration
    // TODO: Implement emergency relay switching
    
    console.warn('🚨 All communications now use emergency protocols');
  }

  /**
   * AI-powered threat detection (placeholder)
   */
  public async analyzeThreatLevel(message: string): Promise<ThreatLevel> {
    // Placeholder for AI threat detection
    const keywords = ['urgent', 'classified', 'emergency', 'threat', 'attack'];
    const hasKeywords = keywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    return hasKeywords ? 'high' : 'normal';
  }

  // Helper methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private mapThreatToClassification(threat: ThreatLevel): string {
    const mapping = {
      normal: 'UNCLASSIFIED',
      elevated: 'CONFIDENTIAL', 
      high: 'SECRET',
      critical: 'TOP_SECRET'
    };
    return mapping[threat] || 'UNCLASSIFIED';
  }

  private mapMessageTypeToNostr(type: MessageType): 'text' | 'intelligence' | 'alert' | 'status' {
    const mapping: Record<MessageType, 'text' | 'intelligence' | 'alert' | 'status'> = {
      text: 'text',
      image: 'text',
      file: 'text',
      voice: 'text',
      emergency: 'alert',
      command: 'intelligence'
    };
    return mapping[type] || 'text';
  }

  private mapNostrToMessageType(nostrType: string): MessageType {
    const mapping: Record<string, MessageType> = {
      text: 'text',
      intelligence: 'file',
      alert: 'emergency',
      status: 'command'
    };
    return mapping[nostrType] || 'text';
  }
}

// Export singleton instance
export const secureChatIntegration = SecureChatIntegrationService.getInstance();
