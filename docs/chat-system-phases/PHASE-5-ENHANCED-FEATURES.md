# Phase 5: Enhanced Chat Features

## Overview

This phase focuses on enhancing the multi-protocol chat system with advanced features that improve user experience, security, and functionality. Building on the solid foundation of the previous phases, we'll implement features like message encryption, file sharing, reactions, read receipts, and more.

## Current State

As of the completion of Phase 4, the Starcom dApp has:

1. A unified adapter architecture with implementations for Gun, Nostr, and other protocols
2. An enhanced chat context providing a centralized API for chat functionality
3. Protocol selection and fallback mechanisms to handle connection failures
4. User settings for protocol preferences and identity management

## Objectives for Phase 5

1. Implement end-to-end encryption across all supported protocols
2. Add file sharing capabilities with progress tracking and preview
3. Support for message reactions, replies, and threads
4. Implement read receipts and typing indicators
5. Add message search and filtering capabilities
6. Create a notification system for chat events

## Implementation Details

### 1. End-to-End Encryption Service

**File**: `/src/lib/chat/security/E2EEncryptionService.ts`

Create a service to handle end-to-end encryption:

```typescript
/**
 * E2EEncryptionService.ts
 * 
 * Service for providing end-to-end encryption capabilities to the chat system.
 * Supports encrypting/decrypting messages and files across all protocols.
 */

import { ChatMessage } from '../ChatInterface';
import { ChatProtocol } from '../ChatProtocolRegistry';
import identityManager from '../ProtocolIdentityManager';

// Encryption options
export interface EncryptionOptions {
  protocol: ChatProtocol;
  recipientPublicKeys: string[];
  encryptMetadata?: boolean;
  algorithm?: 'AES-GCM' | 'X25519-XSalsa20-Poly1305';
}

// Encrypted message format
export interface EncryptedData {
  iv: string;
  ephemPublicKey?: string;
  ciphertext: string;
  mac?: string;
  protocol: ChatProtocol;
  algorithm: string;
  version: string;
}

export class E2EEncryptionService {
  private static instance: E2EEncryptionService | null = null;
  private cryptoCache: Map<string, CryptoKey> = new Map();
  
  private constructor() {}
  
  public static getInstance(): E2EEncryptionService {
    if (!E2EEncryptionService.instance) {
      E2EEncryptionService.instance = new E2EEncryptionService();
    }
    return E2EEncryptionService.instance;
  }
  
  /**
   * Encrypts a message for one or more recipients
   */
  public async encryptMessage(
    message: string | ChatMessage,
    options: EncryptionOptions
  ): Promise<string> {
    const content = typeof message === 'string' ? message : message.content;
    
    // Get encryption strategy based on protocol
    switch (options.protocol) {
      case 'nostr':
        return this.encryptNostrMessage(content, options);
      case 'gun':
        return this.encryptGunMessage(content, options);
      case 'secure':
        return this.encryptSecureMessage(content, options);
      default:
        throw new Error(`Unsupported protocol for encryption: ${options.protocol}`);
    }
  }
  
  /**
   * Decrypts a message from sender
   */
  public async decryptMessage(
    encryptedContent: string,
    senderPublicKey: string,
    protocol: ChatProtocol
  ): Promise<string> {
    // Get decryption strategy based on protocol
    switch (protocol) {
      case 'nostr':
        return this.decryptNostrMessage(encryptedContent, senderPublicKey);
      case 'gun':
        return this.decryptGunMessage(encryptedContent, senderPublicKey);
      case 'secure':
        return this.decryptSecureMessage(encryptedContent, senderPublicKey);
      default:
        throw new Error(`Unsupported protocol for decryption: ${protocol}`);
    }
  }
  
  /**
   * Encrypts a file before upload
   */
  public async encryptFile(
    file: File,
    options: EncryptionOptions
  ): Promise<{ encryptedFile: Blob; key: string }> {
    // Generate a random encryption key
    const key = await this.generateRandomKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Read the file
    const fileBuffer = await file.arrayBuffer();
    
    // Encrypt the file content
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      fileBuffer
    );
    
    // Export the key for recipients
    const exportedKey = await window.crypto.subtle.exportKey('raw', key);
    const keyString = this.arrayBufferToBase64(exportedKey);
    
    // Create a new blob with the encrypted content
    const encryptedFile = new Blob([iv, encryptedBuffer], { type: 'application/octet-stream' });
    
    // The key will be encrypted for each recipient using their public key
    return { encryptedFile, key: keyString };
  }
  
  /**
   * Decrypts a file after download
   */
  public async decryptFile(
    encryptedBlob: Blob,
    decryptionKey: string,
    originalType: string
  ): Promise<Blob> {
    // Get the IV from the first 12 bytes
    const ivBuffer = await encryptedBlob.slice(0, 12).arrayBuffer();
    const iv = new Uint8Array(ivBuffer);
    
    // The rest is the encrypted content
    const encryptedContent = await encryptedBlob.slice(12).arrayBuffer();
    
    // Import the decryption key
    const keyData = this.base64ToArrayBuffer(decryptionKey);
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Decrypt the content
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encryptedContent
    );
    
    // Create a new blob with the decrypted content and original type
    return new Blob([decryptedBuffer], { type: originalType });
  }
  
  // Protocol-specific encryption methods
  
  private async encryptNostrMessage(
    content: string,
    options: EncryptionOptions
  ): Promise<string> {
    try {
      const { nip04 } = await import('nostr-tools');
      const identity = identityManager.getIdentity('nostr');
      
      if (!identity || !identity.privateKey) {
        throw new Error('No Nostr identity found or private key not available');
      }
      
      // For simplicity, we'll encrypt for the first recipient only
      // A complete implementation would handle multiple recipients
      const recipientPublicKey = options.recipientPublicKeys[0];
      
      return nip04.encrypt(identity.privateKey, recipientPublicKey, content);
    } catch (error) {
      console.error('Error encrypting Nostr message:', error);
      throw error;
    }
  }
  
  private async decryptNostrMessage(
    encryptedContent: string,
    senderPublicKey: string
  ): Promise<string> {
    try {
      const { nip04 } = await import('nostr-tools');
      const identity = identityManager.getIdentity('nostr');
      
      if (!identity || !identity.privateKey) {
        throw new Error('No Nostr identity found or private key not available');
      }
      
      return nip04.decrypt(identity.privateKey, senderPublicKey, encryptedContent);
    } catch (error) {
      console.error('Error decrypting Nostr message:', error);
      throw error;
    }
  }
  
  private async encryptGunMessage(
    content: string,
    options: EncryptionOptions
  ): Promise<string> {
    try {
      const GUN = (await import('gun')).default;
      const SEA = GUN.SEA;
      
      const identity = identityManager.getIdentity('gun');
      
      if (!identity || !identity.metadata?.pair) {
        throw new Error('No Gun identity found or key pair not available');
      }
      
      // Gun uses its own SEA encryption
      const pair = identity.metadata.pair;
      const recipientPublicKey = options.recipientPublicKeys[0];
      
      // Create a shared secret
      const secret = await SEA.secret(recipientPublicKey, pair);
      
      // Encrypt the message with the shared secret
      const encrypted = await SEA.encrypt(content, secret);
      
      return encrypted;
    } catch (error) {
      console.error('Error encrypting Gun message:', error);
      throw error;
    }
  }
  
  private async decryptGunMessage(
    encryptedContent: string,
    senderPublicKey: string
  ): Promise<string> {
    try {
      const GUN = (await import('gun')).default;
      const SEA = GUN.SEA;
      
      const identity = identityManager.getIdentity('gun');
      
      if (!identity || !identity.metadata?.pair) {
        throw new Error('No Gun identity found or key pair not available');
      }
      
      // Gun uses its own SEA encryption
      const pair = identity.metadata.pair;
      
      // Create a shared secret
      const secret = await SEA.secret(senderPublicKey, pair);
      
      // Decrypt the message with the shared secret
      const decrypted = await SEA.decrypt(encryptedContent, secret);
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting Gun message:', error);
      throw error;
    }
  }
  
  private async encryptSecureMessage(
    content: string,
    options: EncryptionOptions
  ): Promise<string> {
    // For the secure protocol, we use WebCrypto API directly
    try {
      // Convert the message to an ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      
      // Generate a random encryption key
      const key = await this.generateRandomKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the data
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        data
      );
      
      // Export the key and encrypt it for each recipient
      const exportedKey = await window.crypto.subtle.exportKey('raw', key);
      const encryptedKeys: Record<string, string> = {};
      
      // In a real implementation, we would encrypt the key for each recipient
      // using their public key. For simplicity, we'll just include the key directly.
      
      // Create the encrypted message object
      const encryptedData: EncryptedData = {
        iv: this.arrayBufferToBase64(iv),
        ciphertext: this.arrayBufferToBase64(encryptedBuffer),
        protocol: 'secure',
        algorithm: 'AES-GCM',
        version: '1.0'
      };
      
      // Serialize the encrypted data
      return JSON.stringify({
        encryptedData,
        encryptedKeys,
        keyExport: this.arrayBufferToBase64(exportedKey) // This would normally be encrypted
      });
    } catch (error) {
      console.error('Error encrypting Secure message:', error);
      throw error;
    }
  }
  
  private async decryptSecureMessage(
    encryptedContent: string,
    senderPublicKey: string
  ): Promise<string> {
    try {
      // Parse the encrypted message
      const { encryptedData, keyExport } = JSON.parse(encryptedContent);
      
      // Import the key
      const keyData = this.base64ToArrayBuffer(keyExport);
      const key = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      // Prepare the IV
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      
      // Decrypt the message
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData.ciphertext);
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(iv)
        },
        key,
        encryptedBuffer
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Error decrypting Secure message:', error);
      throw error;
    }
  }
  
  // Utility methods
  
  private async generateRandomKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
  
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
  
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export default E2EEncryptionService.getInstance();
```

### 2. File Sharing Service

**File**: `/src/lib/chat/FileUploadService.ts`

Create a service to handle file uploads and sharing:

```typescript
/**
 * FileUploadService.ts
 * 
 * Service for handling file uploads and sharing in the chat system.
 * Supports multiple storage backends and integrates with encryption.
 */

import { v4 as uuidv4 } from 'uuid';
import e2eEncryptionService, { EncryptionOptions } from './security/E2EEncryptionService';
import { ChatProtocol } from './ChatProtocolRegistry';
import chatSettingsService from '../services/ChatSettingsService';

// Storage provider types
export type StorageProvider = 'ipfs' | 'firebase' | 'local' | 's3';

// File upload options
export interface FileUploadOptions {
  file: File;
  channelId: string;
  senderId: string;
  storageProvider?: StorageProvider;
  encrypt?: boolean;
  encryptionOptions?: EncryptionOptions;
  onProgress?: (progress: number) => void;
  chunkSize?: number;
}

// File metadata
export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  storageProvider: StorageProvider;
  isEncrypted: boolean;
  encryptionKey?: string;
  thumbnailUrl?: string;
  uploadDate: number;
  expiresAt?: number;
}

// Progress event
export interface UploadProgressEvent {
  fileId: string;
  progress: number;
  bytesUploaded: number;
  totalBytes: number;
}

export class FileUploadService {
  private static instance: FileUploadService | null = null;
  private storageProviders: Map<StorageProvider, (file: File, options: any) => Promise<string>> = new Map();
  private activeUploads: Map<string, { 
    progress: number, 
    abort: () => void 
  }> = new Map();
  
  private constructor() {
    // Register default storage providers
    this.registerStorageProvider('ipfs', this.uploadToIPFS.bind(this));
    this.registerStorageProvider('firebase', this.uploadToFirebase.bind(this));
    this.registerStorageProvider('local', this.uploadToLocalStorage.bind(this));
  }
  
  public static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }
  
  /**
   * Register a new storage provider
   */
  public registerStorageProvider(
    providerName: StorageProvider | string,
    uploadFn: (file: File, options: any) => Promise<string>
  ): void {
    this.storageProviders.set(providerName as StorageProvider, uploadFn);
  }
  
  /**
   * Upload a file and get its metadata
   */
  public async uploadFile(options: FileUploadOptions): Promise<FileMetadata> {
    const { 
      file, 
      channelId, 
      senderId, 
      encrypt = false,
      encryptionOptions,
      onProgress,
      storageProvider = this.getDefaultStorageProvider()
    } = options;
    
    // Generate a unique ID for the file
    const fileId = uuidv4();
    
    // Initialize progress tracking
    this.activeUploads.set(fileId, { 
      progress: 0,
      abort: () => {} // Will be replaced with actual abort function
    });
    
    try {
      // Handle encryption if needed
      let fileToUpload = file;
      let encryptionKey: string | undefined;
      
      if (encrypt && encryptionOptions) {
        const encryptionResult = await e2eEncryptionService.encryptFile(
          file,
          encryptionOptions
        );
        
        fileToUpload = new File(
          [encryptionResult.encryptedFile], 
          `${file.name}.encrypted`,
          { type: 'application/octet-stream' }
        );
        
        encryptionKey = encryptionResult.key;
      }
      
      // Get the upload function for the selected provider
      const uploadFn = this.storageProviders.get(storageProvider);
      
      if (!uploadFn) {
        throw new Error(`Storage provider '${storageProvider}' not registered`);
      }
      
      // Create a progress handler
      const progressHandler = (progress: number) => {
        const upload = this.activeUploads.get(fileId);
        if (upload) {
          upload.progress = progress;
        }
        
        onProgress?.(progress);
      };
      
      // Upload the file
      const url = await uploadFn(fileToUpload, {
        fileId,
        channelId,
        senderId,
        onProgress: progressHandler
      });
      
      // Generate thumbnail if it's an image
      let thumbnailUrl: string | undefined;
      
      if (file.type.startsWith('image/') && !encrypt) {
        thumbnailUrl = await this.generateThumbnail(file);
      }
      
      // Create metadata
      const metadata: FileMetadata = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        storageProvider,
        isEncrypted: encrypt,
        encryptionKey,
        thumbnailUrl,
        uploadDate: Date.now()
      };
      
      // Clean up progress tracking
      this.activeUploads.delete(fileId);
      
      return metadata;
    } catch (error) {
      // Clean up progress tracking
      this.activeUploads.delete(fileId);
      console.error('Error uploading file:', error);
      throw error;
    }
  }
  
  /**
   * Download a file and decrypt if needed
   */
  public async downloadFile(metadata: FileMetadata): Promise<Blob> {
    try {
      // Fetch the file
      const response = await fetch(metadata.url);
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      
      const fileBlob = await response.blob();
      
      // Decrypt if needed
      if (metadata.isEncrypted && metadata.encryptionKey) {
        return e2eEncryptionService.decryptFile(
          fileBlob,
          metadata.encryptionKey,
          metadata.type
        );
      }
      
      return fileBlob;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
  
  /**
   * Cancel an active upload
   */
  public cancelUpload(fileId: string): boolean {
    const upload = this.activeUploads.get(fileId);
    
    if (upload) {
      upload.abort();
      this.activeUploads.delete(fileId);
      return true;
    }
    
    return false;
  }
  
  /**
   * Get the progress of an active upload
   */
  public getUploadProgress(fileId: string): number | null {
    const upload = this.activeUploads.get(fileId);
    return upload ? upload.progress : null;
  }
  
  /**
   * Get active uploads
   */
  public getActiveUploads(): { fileId: string; progress: number }[] {
    return Array.from(this.activeUploads.entries()).map(([fileId, data]) => ({
      fileId,
      progress: data.progress
    }));
  }
  
  // Storage provider implementations
  
  private async uploadToIPFS(
    file: File, 
    options: { 
      fileId: string; 
      onProgress?: (progress: number) => void 
    }
  ): Promise<string> {
    // Implementation depends on IPFS client library
    // This is a placeholder
    try {
      const { create } = await import('ipfs-http-client');
      
      // Connect to IPFS node
      const ipfs = create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https'
      });
      
      // Add the file to IPFS
      const { cid } = await ipfs.add(
        file,
        {
          progress: (bytes: number) => {
            const progress = Math.min(bytes / file.size * 100, 100);
            options.onProgress?.(progress);
          }
        }
      );
      
      // Return the IPFS URL
      return `ipfs://${cid}`;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw new Error('Failed to upload to IPFS');
    }
  }
  
  private async uploadToFirebase(
    file: File,
    options: {
      fileId: string;
      channelId: string;
      senderId: string;
      onProgress?: (progress: number) => void;
    }
  ): Promise<string> {
    // Implementation depends on Firebase SDK
    // This is a placeholder
    try {
      const { getStorage, ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      
      // Get Firebase storage
      const storage = getStorage();
      
      // Create a storage reference
      const storageRef = ref(storage, `chat-files/${options.channelId}/${options.fileId}-${file.name}`);
      
      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Register three observers:
      // 1. 'state_changed' observer, called any time the state changes
      // 2. Error observer, called on failure
      // 3. Completion observer, called on successful completion
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            options.onProgress?.(progress);
          },
          (error) => {
            reject(error);
          },
          async () => {
            // Upload completed successfully, get the download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
        
        // Store the abort function
        const upload = this.activeUploads.get(options.fileId);
        if (upload) {
          upload.abort = () => uploadTask.cancel();
        }
      });
    } catch (error) {
      console.error('Error uploading to Firebase:', error);
      throw new Error('Failed to upload to Firebase');
    }
  }
  
  private async uploadToLocalStorage(
    file: File,
    options: {
      fileId: string;
      onProgress?: (progress: number) => void;
    }
  ): Promise<string> {
    // Simulate a file upload with a local blob URL
    return new Promise((resolve) => {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        options.onProgress?.(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // Create a blob URL
          const blobUrl = URL.createObjectURL(file);
          resolve(blobUrl);
        }
      }, 100);
      
      // Store the abort function
      const upload = this.activeUploads.get(options.fileId);
      if (upload) {
        upload.abort = () => clearInterval(interval);
      }
    });
  }
  
  // Helper methods
  
  private getDefaultStorageProvider(): StorageProvider {
    // Get from settings, or use default
    const settings = chatSettingsService.getSettings();
    return (settings.protocolConfigs.secure.fileStorageProvider as StorageProvider) || 'ipfs';
  }
  
  private async generateThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Only generate thumbnails for images
      if (!file.type.startsWith('image/')) {
        resolve('');
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          // Create a canvas element
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set the thumbnail dimensions
          const MAX_WIDTH = 100;
          const MAX_HEIGHT = 100;
          
          let width = img.width;
          let height = img.height;
          
          // Calculate the thumbnail dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw the image on the canvas
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Get the data URL
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(thumbnailUrl);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image for thumbnail generation'));
        };
        
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };
      
      reader.readAsDataURL(file);
    });
  }
}

export default FileUploadService.getInstance();
```

### 3. Enhanced Message Types and Reactions

**File**: `/src/lib/chat/ChatInterface.ts`

Update the ChatInterface to support reactions and enhanced message types:

```typescript
// Add to ChatMessage interface
export interface ChatMessage {
  // Existing properties
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  channelId: string;
  type?: 'text' | 'file' | 'system' | 'intelligence' | 'alert';
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  
  // Enhanced properties
  replyTo?: string; // ID of the message being replied to
  reactions?: {
    [emoji: string]: string[]; // Map of emoji to array of user IDs
  };
  isEncrypted?: boolean;
  threadId?: string; // For threaded conversations
  attachments?: {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    thumbnailUrl?: string;
    isEncrypted?: boolean;
    encryptionKey?: string;
  }[];
  metadata?: Record<string, any>;
  editHistory?: {
    content: string;
    timestamp: number;
  }[];
  mentionedUsers?: string[]; // Array of user IDs mentioned in the message
}

// Add to ChatProvider interface
export interface ChatProvider {
  // Existing methods
  
  // Enhanced methods for reactions
  addReaction(messageId: string, emoji: string): Promise<void>;
  removeReaction(messageId: string, emoji: string): Promise<void>;
  
  // Methods for replies and threads
  replyToMessage(messageId: string, content: string, attachments?: File[]): Promise<ChatMessage>;
  getThreadMessages(threadId: string, limit?: number): Promise<ChatMessage[]>;
  
  // Methods for message status
  markMessageAsRead(messageId: string): Promise<void>;
  markMessagesAsRead(messageIds: string[]): Promise<void>;
  
  // Methods for typing indicators
  sendTypingIndicator(channelId: string): Promise<void>;
  subscribeToTypingIndicators(channelId: string, callback: (typingUsers: string[]) => void): () => void;
  
  // Methods for editing messages
  editMessage(messageId: string, newContent: string): Promise<ChatMessage>;
  deleteMessage(messageId: string): Promise<void>;
}
```

### 4. Enhanced ChatContext for Reactions and Threading

**File**: `/src/context/EnhancedChatContext.tsx`

Update the ChatContext to support reactions and threading:

```typescript
// Add to EnhancedChatContextValue interface
interface EnhancedChatContextValue extends ChatContextValue {
  // Existing properties
  
  // Reactions
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  
  // Threading
  replyToMessage: (messageId: string, content: string, attachments?: File[]) => Promise<ChatMessage>;
  getThreadMessages: (threadId: string, limit?: number) => Promise<ChatMessage[]>;
  activeThread: string | null;
  setActiveThread: (threadId: string | null) => void;
  
  // Typing indicators
  sendTypingIndicator: (channelId: string) => void;
  typingUsers: Record<string, string[]>;
  
  // Message status
  markMessageAsRead: (messageId: string) => Promise<void>;
  
  // File handling
  uploadFile: (file: File, channelId: string, encrypt?: boolean) => Promise<FileMetadata>;
  downloadFile: (metadata: FileMetadata) => Promise<Blob>;
  fileUploads: { fileId: string; progress: number }[];
  cancelUpload: (fileId: string) => boolean;
}

// Inside the context provider component
function EnhancedChatContextProvider({ children }: { children: ReactNode }) {
  // Existing state
  
  // New state for enhanced features
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [fileUploads, setFileUploads] = useState<{ fileId: string; progress: number }[]>([]);
  
  // Typing indicator throttle
  const typingThrottleRef = useRef<Record<string, NodeJS.Timeout>>({});
  
  // Typing indicator methods
  const sendTypingIndicator = useCallback((channelId: string) => {
    if (!provider || !channelId) return;
    
    // Throttle typing indicators to avoid spamming
    if (typingThrottleRef.current[channelId]) {
      clearTimeout(typingThrottleRef.current[channelId]);
    }
    
    typingThrottleRef.current[channelId] = setTimeout(() => {
      provider.sendTypingIndicator(channelId);
    }, 1000);
  }, [provider]);
  
  // Subscribe to typing indicators
  useEffect(() => {
    if (!provider || !currentChannel) return;
    
    const unsubscribe = provider.subscribeToTypingIndicators(
      currentChannel,
      (users) => {
        setTypingUsers(prev => ({
          ...prev,
          [currentChannel]: users
        }));
      }
    );
    
    return unsubscribe;
  }, [provider, currentChannel]);
  
  // Reaction methods
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!provider) throw new Error('No chat provider available');
    
    try {
      await provider.addReaction(messageId, emoji);
      
      // Update local message state
      setMessages(prev => {
        const newMessages = { ...prev };
        
        // Find the message in all channels
        Object.keys(newMessages).forEach(channelId => {
          const messageIndex = newMessages[channelId].findIndex(m => m.id === messageId);
          
          if (messageIndex !== -1) {
            const message = newMessages[channelId][messageIndex];
            const reactions = message.reactions || {};
            
            // Add user ID to the emoji's reactions
            const userIds = reactions[emoji] || [];
            if (!userIds.includes(userId)) {
              reactions[emoji] = [...userIds, userId];
            }
            
            // Update the message
            newMessages[channelId][messageIndex] = {
              ...message,
              reactions
            };
          }
        });
        
        return newMessages;
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }, [provider, userId]);
  
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!provider) throw new Error('No chat provider available');
    
    try {
      await provider.removeReaction(messageId, emoji);
      
      // Update local message state
      setMessages(prev => {
        const newMessages = { ...prev };
        
        // Find the message in all channels
        Object.keys(newMessages).forEach(channelId => {
          const messageIndex = newMessages[channelId].findIndex(m => m.id === messageId);
          
          if (messageIndex !== -1) {
            const message = newMessages[channelId][messageIndex];
            const reactions = message.reactions || {};
            
            // Remove user ID from the emoji's reactions
            if (reactions[emoji]) {
              reactions[emoji] = reactions[emoji].filter(id => id !== userId);
              
              // Remove the emoji if no users have reacted with it
              if (reactions[emoji].length === 0) {
                delete reactions[emoji];
              }
            }
            
            // Update the message
            newMessages[channelId][messageIndex] = {
              ...message,
              reactions
            };
          }
        });
        
        return newMessages;
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }, [provider, userId]);
  
  // Threading methods
  const replyToMessage = useCallback(async (messageId: string, content: string, attachments?: File[]) => {
    if (!provider) throw new Error('No chat provider available');
    
    try {
      const replyMessage = await provider.replyToMessage(messageId, content, attachments);
      
      // Update messages state
      setMessages(prev => {
        const channelId = replyMessage.channelId;
        const channelMessages = prev[channelId] || [];
        
        return {
          ...prev,
          [channelId]: [...channelMessages, replyMessage]
        };
      });
      
      return replyMessage;
    } catch (error) {
      console.error('Error replying to message:', error);
      throw error;
    }
  }, [provider]);
  
  const getThreadMessages = useCallback(async (threadId: string, limit?: number) => {
    if (!provider) throw new Error('No chat provider available');
    
    try {
      return await provider.getThreadMessages(threadId, limit);
    } catch (error) {
      console.error('Error getting thread messages:', error);
      throw error;
    }
  }, [provider]);
  
  // File handling methods
  const uploadFile = useCallback(async (file: File, channelId: string, encrypt = false) => {
    if (!provider) throw new Error('No chat provider available');
    
    try {
      // Create upload options
      const uploadOptions: FileUploadOptions = {
        file,
        channelId,
        senderId: userId,
        encrypt,
        onProgress: (progress) => {
          // Update progress state
          setFileUploads(prev => {
            const existingIndex = prev.findIndex(u => u.fileId === uploadOptions.fileId);
            
            if (existingIndex !== -1) {
              const updated = [...prev];
              updated[existingIndex] = { fileId: uploadOptions.fileId, progress };
              return updated;
            }
            
            return [...prev, { fileId: uploadOptions.fileId, progress }];
          });
        }
      };
      
      // Add encryption options if needed
      if (encrypt && currentChannel) {
        const channelUsers = await provider.getUsers(currentChannel);
        const recipientPublicKeys = channelUsers
          .filter(user => user.id !== userId)
          .map(user => user.publicKey || '');
        
        if (recipientPublicKeys.length > 0) {
          uploadOptions.encryptionOptions = {
            protocol: chatProviderType as ChatProtocol,
            recipientPublicKeys
          };
        }
      }
      
      // Upload the file
      const metadata = await FileUploadService.getInstance().uploadFile(uploadOptions);
      
      // Remove from uploads when complete
      setFileUploads(prev => prev.filter(u => u.fileId !== metadata.id));
      
      return metadata;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }, [provider, userId, currentChannel, chatProviderType]);
  
  const downloadFile = useCallback(async (metadata: FileMetadata) => {
    try {
      return await FileUploadService.getInstance().downloadFile(metadata);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }, []);
  
  const cancelUpload = useCallback((fileId: string) => {
    const result = FileUploadService.getInstance().cancelUpload(fileId);
    
    if (result) {
      setFileUploads(prev => prev.filter(u => u.fileId !== fileId));
    }
    
    return result;
  }, []);
  
  // Message status methods
  const markMessageAsRead = useCallback(async (messageId: string) => {
    if (!provider) throw new Error('No chat provider available');
    
    try {
      await provider.markMessageAsRead(messageId);
      
      // Update local message state
      setMessages(prev => {
        const newMessages = { ...prev };
        
        // Find the message in all channels
        Object.keys(newMessages).forEach(channelId => {
          const messageIndex = newMessages[channelId].findIndex(m => m.id === messageId);
          
          if (messageIndex !== -1) {
            // Update message status
            newMessages[channelId][messageIndex] = {
              ...newMessages[channelId][messageIndex],
              status: 'read'
            };
          }
        });
        
        return newMessages;
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }, [provider]);
  
  // Add to context value
  const contextValue: EnhancedChatContextValue = {
    // Existing properties
    
    // Reactions
    addReaction,
    removeReaction,
    
    // Threading
    replyToMessage,
    getThreadMessages,
    activeThread,
    setActiveThread,
    
    // Typing indicators
    sendTypingIndicator,
    typingUsers,
    
    // Message status
    markMessageAsRead,
    
    // File handling
    uploadFile,
    downloadFile,
    fileUploads,
    cancelUpload
  };
  
  // Rest of the component
}
```

### 5. Chat Notification Service

**File**: `/src/services/ChatNotificationService.ts`

Create a service to handle chat notifications:

```typescript
/**
 * ChatNotificationService.ts
 * 
 * Service for managing chat-related notifications, including browser
 * notifications, in-app alerts, and sound effects.
 */

import { ChatMessage, ChatUser } from '../lib/chat/ChatInterface';
import chatSettingsService from './ChatSettingsService';

// Notification types
export type NotificationType = 'message' | 'mention' | 'reaction' | 'system';

// Notification options
export interface NotificationOptions {
  type: NotificationType;
  message?: ChatMessage;
  channel?: { id: string; name: string };
  user?: ChatUser;
  title?: string;
  body?: string;
  icon?: string;
  clickAction?: () => void;
  playSound?: boolean;
}

export class ChatNotificationService {
  private static instance: ChatNotificationService | null = null;
  private hasPermission: boolean = false;
  private notificationSounds: Map<NotificationType, HTMLAudioElement> = new Map();
  private notificationQueue: NotificationOptions[] = [];
  private processingQueue: boolean = false;
  
  private constructor() {
    // Check for notification permission
    if ('Notification' in window) {
      this.hasPermission = Notification.permission === 'granted';
    }
    
    // Load notification sounds
    this.loadNotificationSounds();
  }
  
  public static getInstance(): ChatNotificationService {
    if (!ChatNotificationService.instance) {
      ChatNotificationService.instance = new ChatNotificationService();
    }
    return ChatNotificationService.instance;
  }
  
  /**
   * Request notification permission from the user
   */
  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    
    if (this.hasPermission) {
      return true;
    }
    
    try {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
  
  /**
   * Show a notification for a chat event
   */
  public async showNotification(options: NotificationOptions): Promise<void> {
    const settings = chatSettingsService.getSettings();
    
    // Check if notifications are enabled
    if (!settings.notificationsEnabled) {
      return;
    }
    
    // Add to queue and process
    this.notificationQueue.push(options);
    this.processNotificationQueue();
  }
  
  /**
   * Show a notification for a new message
   */
  public async notifyNewMessage(
    message: ChatMessage,
    channelName: string
  ): Promise<void> {
    // Prepare notification content
    const title = `New message from ${message.senderName}`;
    let body = message.content;
    
    // Truncate long messages
    if (body.length > 100) {
      body = body.substring(0, 97) + '...';
    }
    
    // Remove markdown or formatting
    body = body.replace(/[*_~`]/g, '');
    
    // Show notification
    await this.showNotification({
      type: 'message',
      message,
      channel: { id: message.channelId, name: channelName },
      title,
      body,
      playSound: true
    });
  }
  
  /**
   * Show a notification for a mention
   */
  public async notifyMention(
    message: ChatMessage,
    channelName: string
  ): Promise<void> {
    // Prepare notification content
    const title = `@Mention from ${message.senderName}`;
    let body = message.content;
    
    // Truncate long messages
    if (body.length > 100) {
      body = body.substring(0, 97) + '...';
    }
    
    // Show notification
    await this.showNotification({
      type: 'mention',
      message,
      channel: { id: message.channelId, name: channelName },
      title,
      body,
      playSound: true
    });
  }
  
  /**
   * Show a notification for a reaction
   */
  public async notifyReaction(
    message: ChatMessage,
    emoji: string,
    reactorName: string
  ): Promise<void> {
    // Prepare notification content
    const title = `${reactorName} reacted to your message`;
    let body = `${emoji} on: ${message.content}`;
    
    // Truncate long messages
    if (body.length > 100) {
      body = body.substring(0, 97) + '...';
    }
    
    // Show notification
    await this.showNotification({
      type: 'reaction',
      message,
      title,
      body,
      playSound: true
    });
  }
  
  /**
   * Process the notification queue
   */
  private async processNotificationQueue(): Promise<void> {
    if (this.processingQueue || this.notificationQueue.length === 0) {
      return;
    }
    
    this.processingQueue = true;
    
    try {
      // Process notifications one by one with a small delay
      while (this.notificationQueue.length > 0) {
        const options = this.notificationQueue.shift();
        
        if (options) {
          await this.processNotification(options);
        }
        
        // Small delay to avoid flooding
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } finally {
      this.processingQueue = false;
    }
  }
  
  /**
   * Process a single notification
   */
  private async processNotification(options: NotificationOptions): Promise<void> {
    // Play sound if requested
    if (options.playSound) {
      this.playNotificationSound(options.type);
    }
    
    // Show browser notification if permission granted
    if (this.hasPermission) {
      try {
        const notification = new Notification(options.title || 'New notification', {
          body: options.body,
          icon: options.icon || '/logo192.png'
        });
        
        // Handle click action
        if (options.clickAction) {
          notification.onclick = () => {
            window.focus();
            options.clickAction?.();
            notification.close();
          };
        }
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
    
    // Dispatch custom event for in-app notifications
    const event = new CustomEvent('chat-notification', {
      detail: options
    });
    
    window.dispatchEvent(event);
  }
  
  /**
   * Play a notification sound
   */
  private playNotificationSound(type: NotificationType): void {
    const sound = this.notificationSounds.get(type);
    
    if (sound) {
      // Reset and play
      sound.currentTime = 0;
      sound.play().catch(error => {
        console.error('Error playing notification sound:', error);
      });
    }
  }
  
  /**
   * Load notification sounds
   */
  private loadNotificationSounds(): void {
    // Create audio elements for each notification type
    const messageSound = new Audio('/sounds/message.mp3');
    const mentionSound = new Audio('/sounds/mention.mp3');
    const reactionSound = new Audio('/sounds/reaction.mp3');
    const systemSound = new Audio('/sounds/system.mp3');
    
    // Preload sounds
    messageSound.load();
    mentionSound.load();
    reactionSound.load();
    systemSound.load();
    
    // Store in map
    this.notificationSounds.set('message', messageSound);
    this.notificationSounds.set('mention', mentionSound);
    this.notificationSounds.set('reaction', reactionSound);
    this.notificationSounds.set('system', systemSound);
  }
}

export default ChatNotificationService.getInstance();
```

### 6. Message Search Service

**File**: `/src/lib/chat/MessageSearchService.ts`

Create a service for searching messages:

```typescript
/**
 * MessageSearchService.ts
 * 
 * Service for searching and indexing chat messages across all protocols.
 * Provides advanced search capabilities for the chat system.
 */

import { ChatMessage } from './ChatInterface';
import { ChatProtocol } from './ChatProtocolRegistry';
import { v4 as uuidv4 } from 'uuid';

// Search filters
export interface MessageSearchFilters {
  channelIds?: string[];
  senderIds?: string[];
  fromDate?: Date;
  toDate?: Date;
  hasAttachments?: boolean;
  onlyMentions?: boolean;
  protocol?: ChatProtocol;
}

// Search results
export interface MessageSearchResults {
  searchId: string;
  query: string;
  results: ChatMessage[];
  totalCount: number;
  hasMore: boolean;
  channels: {
    id: string;
    name: string;
    count: number;
  }[];
  senders: {
    id: string;
    name: string;
    count: number;
  }[];
}

// Search options
export interface MessageSearchOptions {
  filters?: MessageSearchFilters;
  limit?: number;
  offset?: number;
  sort?: 'newest' | 'oldest' | 'relevance';
}

export class MessageSearchService {
  private static instance: MessageSearchService | null = null;
  private messageIndex: Map<string, ChatMessage> = new Map();
  private activeSearches: Map<string, MessageSearchResults> = new Map();
  private searchHistory: { query: string; timestamp: number }[] = [];
  
  private constructor() {
    // Load search history from local storage
    this.loadSearchHistory();
  }
  
  public static getInstance(): MessageSearchService {
    if (!MessageSearchService.instance) {
      MessageSearchService.instance = new MessageSearchService();
    }
    return MessageSearchService.instance;
  }
  
  /**
   * Index a message for searching
   */
  public indexMessage(message: ChatMessage): void {
    this.messageIndex.set(message.id, message);
  }
  
  /**
   * Index multiple messages for searching
   */
  public indexMessages(messages: ChatMessage[]): void {
    messages.forEach(message => this.indexMessage(message));
  }
  
  /**
   * Remove a message from the index
   */
  public removeFromIndex(messageId: string): void {
    this.messageIndex.delete(messageId);
  }
  
  /**
   * Search for messages matching the query and filters
   */
  public async search(
    query: string,
    options: MessageSearchOptions = {}
  ): Promise<MessageSearchResults> {
    const {
      filters = {},
      limit = 20,
      offset = 0,
      sort = 'newest'
    } = options;
    
    // Add to search history
    this.addToSearchHistory(query);
    
    // Convert query to lowercase for case-insensitive search
    const lowerQuery = query.trim().toLowerCase();
    
    // Get all messages as array
    const allMessages = Array.from(this.messageIndex.values());
    
    // Apply filters
    let filteredMessages = allMessages.filter(message => {
      // Filter by channel
      if (filters.channelIds && filters.channelIds.length > 0) {
        if (!filters.channelIds.includes(message.channelId)) {
          return false;
        }
      }
      
      // Filter by sender
      if (filters.senderIds && filters.senderIds.length > 0) {
        if (!filters.senderIds.includes(message.senderId)) {
          return false;
        }
      }
      
      // Filter by date range
      if (filters.fromDate) {
        if (message.timestamp < filters.fromDate.getTime()) {
          return false;
        }
      }
      
      if (filters.toDate) {
        if (message.timestamp > filters.toDate.getTime()) {
          return false;
        }
      }
      
      // Filter by attachments
      if (filters.hasAttachments) {
        if (!message.attachments || message.attachments.length === 0) {
          return false;
        }
      }
      
      // Filter by mentions
      if (filters.onlyMentions) {
        if (!message.mentionedUsers || message.mentionedUsers.length === 0) {
          return false;
        }
      }
      
      // If there's a query, filter by content match
      if (lowerQuery) {
        return message.content.toLowerCase().includes(lowerQuery);
      }
      
      return true;
    });
    
    // Apply sorting
    filteredMessages.sort((a, b) => {
      if (sort === 'newest') {
        return b.timestamp - a.timestamp;
      } else if (sort === 'oldest') {
        return a.timestamp - b.timestamp;
      } else {
        // For relevance sorting, prioritize exact matches
        const aContent = a.content.toLowerCase();
        const bContent = b.content.toLowerCase();
        
        const aExactMatch = aContent === lowerQuery;
        const bExactMatch = bContent === lowerQuery;
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // Then prioritize by position of the match
        const aIndex = aContent.indexOf(lowerQuery);
        const bIndex = bContent.indexOf(lowerQuery);
        
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        // If one doesn't contain the query (shouldn't happen due to filtering)
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        
        // Default to newest
        return b.timestamp - a.timestamp;
      }
    });
    
    // Calculate total count before pagination
    const totalCount = filteredMessages.length;
    
    // Apply pagination
    const paginatedMessages = filteredMessages.slice(offset, offset + limit);
    
    // Calculate channel and sender statistics
    const channelCounts = new Map<string, { id: string; name: string; count: number }>();
    const senderCounts = new Map<string, { id: string; name: string; count: number }>();
    
    filteredMessages.forEach(message => {
      // Count by channel
      if (!channelCounts.has(message.channelId)) {
        channelCounts.set(message.channelId, {
          id: message.channelId,
          name: message.channelId, // We don't have channel names here
          count: 0
        });
      }
      
      const channelStat = channelCounts.get(message.channelId);
      if (channelStat) {
        channelStat.count += 1;
      }
      
      // Count by sender
      if (!senderCounts.has(message.senderId)) {
        senderCounts.set(message.senderId, {
          id: message.senderId,
          name: message.senderName,
          count: 0
        });
      }
      
      const senderStat = senderCounts.get(message.senderId);
      if (senderStat) {
        senderStat.count += 1;
      }
    });
    
    // Create search results
    const searchId = uuidv4();
    const results: MessageSearchResults = {
      searchId,
      query,
      results: paginatedMessages,
      totalCount,
      hasMore: offset + limit < totalCount,
      channels: Array.from(channelCounts.values()),
      senders: Array.from(senderCounts.values())
    };
    
    // Store search results for pagination
    this.activeSearches.set(searchId, results);
    
    return results;
  }
  
  /**
   * Get more results for a previous search
   */
  public async getMoreResults(
    searchId: string,
    limit: number = 20
  ): Promise<MessageSearchResults | null> {
    const previousSearch = this.activeSearches.get(searchId);
    
    if (!previousSearch) {
      return null;
    }
    
    // Calculate new offset
    const newOffset = previousSearch.results.length;
    
    // Re-run search with new offset
    return this.search(previousSearch.query, {
      filters: this.extractFiltersFromResults(previousSearch),
      limit,
      offset: newOffset,
      sort: 'newest' // Default to newest
    });
  }
  
  /**
   * Get recent search history
   */
  public getSearchHistory(limit: number = 10): { query: string; timestamp: number }[] {
    return this.searchHistory.slice(0, limit);
  }
  
  /**
   * Clear search history
   */
  public clearSearchHistory(): void {
    this.searchHistory = [];
    localStorage.removeItem('starcom-chat-search-history');
  }
  
  /**
   * Clear the message index
   */
  public clearIndex(): void {
    this.messageIndex.clear();
    this.activeSearches.clear();
  }
  
  // Helper methods
  
  private addToSearchHistory(query: string): void {
    if (!query.trim()) {
      return;
    }
    
    // Check if query already exists
    const existingIndex = this.searchHistory.findIndex(
      item => item.query.toLowerCase() === query.toLowerCase()
    );
    
    // Remove if exists
    if (existingIndex !== -1) {
      this.searchHistory.splice(existingIndex, 1);
    }
    
    // Add to beginning
    this.searchHistory.unshift({
      query,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.searchHistory.length > 20) {
      this.searchHistory = this.searchHistory.slice(0, 20);
    }
    
    // Save to local storage
    this.saveSearchHistory();
  }
  
  private saveSearchHistory(): void {
    try {
      localStorage.setItem(
        'starcom-chat-search-history',
        JSON.stringify(this.searchHistory)
      );
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }
  
  private loadSearchHistory(): void {
    try {
      const savedHistory = localStorage.getItem('starcom-chat-search-history');
      
      if (savedHistory) {
        this.searchHistory = JSON.parse(savedHistory);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }
  
  private extractFiltersFromResults(results: MessageSearchResults): MessageSearchFilters {
    // Extract channel IDs
    const channelIds = results.channels.map(channel => channel.id);
    
    // Extract sender IDs
    const senderIds = results.senders.map(sender => sender.id);
    
    // Create filters
    return {
      channelIds,
      senderIds
    };
  }
}

export default MessageSearchService.getInstance();
```

## Phase 5 Schedule

| Task | Duration | Description |
|------|----------|-------------|
| 5.1 | 1-2 weeks | Implement E2EEncryptionService |
| 5.2 | 1-2 weeks | Create FileUploadService and integration |
| 5.3 | 1 week | Enhance ChatInterface with reactions and threads |
| 5.4 | 1-2 weeks | Update ChatContext with enhanced features |
| 5.5 | 1 week | Build ChatNotificationService |
| 5.6 | 1 week | Implement MessageSearchService |
| 5.7 | 1-2 weeks | Testing and refinement |

**Total Estimated Time**: 4-6 weeks

## Integration Points and Dependencies

1. **End-to-End Encryption**:
   - Requires protocol-specific libraries for encryption (nostr-tools, Gun/SEA)
   - Depends on ProtocolIdentityManager from Phase 4
   - WebCrypto API for secure protocol

2. **File Sharing**:
   - IPFS integration for decentralized storage
   - Firebase Storage for traditional cloud storage
   - Integration with encryption service

3. **Message Enhancements**:
   - Updates to protocol adapters to support reactions and threading
   - UI components for displaying reactions and threads

4. **Notifications**:
   - Web Notifications API
   - Sound effects for different notification types
   - Integration with user settings

## Testing Plan

1. **Unit Tests**:
   - Test encryption/decryption across protocols
   - Test file upload and download with various providers
   - Test message search with different filters

2. **Integration Tests**:
   - Test end-to-end message flow with encryption
   - Test reaction and threading across protocols
   - Test notifications and search in different scenarios

3. **Security Tests**:
   - Validate encryption implementation
   - Test for information leakage
   - Verify proper key management

## Rollout Strategy

1. Deploy file sharing capabilities first
2. Add message reactions and replies
3. Implement end-to-end encryption
4. Add read receipts and typing indicators
5. Deploy search functionality
6. Integrate notification system
