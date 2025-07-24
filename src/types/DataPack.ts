/**
 * DataPack - Universal File-Folder Structure for Static Deployment
 * 
 * A DataPack is a single-file container that can be unloaded into:
 * - Browser Cache (IndexedDB)
 * - Local Storage
 * - IPFS as folder structure
 * - Virtual filesystem for static deployment
 * 
 * Supports encryption, compression, and integrity verification.
 */

import { Buffer } from 'buffer';

/**
 * Core DataPack interface - Universal container format
 */
export interface DataPack {
  // Package identification
  id: string;
  name: string;
  version: string;
  
  // Format and encoding
  format: 'zip' | 'tar' | 'directory' | 'json';
  encoding?: 'base64' | 'hex' | 'binary';
  
  // Compression (applied before encryption)
  compression?: {
    algorithm: 'gzip' | 'brotli' | 'lz4' | 'none';
    level?: number; // 1-9 for gzip, 1-11 for brotli
    originalSize: number;
    compressedSize: number;
  };
  
  // Encryption (applied after compression)
  encryption?: {
    algorithm: 'aes-256-gcm' | 'chacha20-poly1305' | 'none';
    keyDerivation: 'pbkdf2' | 'scrypt' | 'argon2';
    iv: string; // Base64 encoded initialization vector
    salt: string; // Base64 encoded salt for key derivation
    iterations?: number; // For PBKDF2
    memory?: number; // For Argon2
    parallelism?: number; // For Argon2
  };
  
  // Integrity and verification
  manifestHash: string; // SHA-256 of the manifest (file structure)
  contentHash: string; // SHA-256 of the actual content
  signature?: string; // Digital signature for authenticity
  
  // Metadata
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  author?: string; // Creator identifier
  description?: string;
  tags?: string[];
  
  // Access control
  accessControl?: {
    publicRead: boolean;
    requiresAuthentication: boolean;
    authorizedUsers?: string[];
    expiresAt?: string; // ISO timestamp
  };
  
  // File structure manifest
  manifest: DataPackManifest;
  
  // Raw content (base64 encoded if encrypted/compressed)
  content: string | ArrayBuffer | Uint8Array;
}

/**
 * File structure manifest - describes the virtual filesystem
 */
export interface DataPackManifest {
  // Total file count and size
  totalFiles: number;
  totalSize: number;
  
  // Directory structure
  directories: string[];
  
  // File entries
  files: DataPackFileEntry[];
  
  // Relationships between files (for graph structures)
  relationships?: DataPackRelationship[];
}

/**
 * Individual file entry in the DataPack
 */
export interface DataPackFileEntry {
  // File identification
  path: string; // Relative path within the pack
  name: string; // Just the filename
  extension: string; // File extension (.md, .json, etc.)
  
  // File properties
  size: number; // Size in bytes
  mimeType: string;
  encoding: 'utf-8' | 'binary' | 'base64';
  
  // Content hashes
  hash: string; // SHA-256 of file content
  
  // Metadata
  createdAt: string;
  modifiedAt: string;
  
  // Content preview (for text files)
  preview?: string; // First 200 characters
  
  // Obsidian-specific metadata
  frontmatter?: Record<string, any>;
  wikilinks?: string[]; // [[Entity]] references
  hashtags?: string[]; // #tag references
  backlinks?: string[]; // Files that link to this one
}

/**
 * Relationship between files (for graph visualization)
 */
export interface DataPackRelationship {
  source: string; // Source file path
  target: string; // Target file path
  type: 'wikilink' | 'hashtag' | 'reference' | 'parent-child' | 'related';
  strength: number; // 0.0 - 1.0 relationship strength
  metadata?: Record<string, any>;
}

/**
 * Encryption/Decryption context
 */
export interface DataPackCrypto {
  password?: string;
  keyPair?: {
    publicKey: string;
    privateKey: string;
  };
  
  // Post-quantum cryptography support
  pqcKeyPair?: {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
    algorithm: 'ML-KEM-768' | 'ML-DSA-65';
  };
}

/**
 * Cache storage configuration
 */
export interface DataPackCacheConfig {
  // Storage backend
  backend: 'indexeddb' | 'localstorage' | 'memory' | 'ipfs';
  
  // Cache policies
  maxSize: number; // Maximum cache size in bytes
  ttl: number; // Time to live in milliseconds
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
  
  // Compression in cache
  compressInCache: boolean;
  
  // Preload strategies
  preloadStrategy: 'lazy' | 'eager' | 'on-demand';
}

/**
 * DataPack loading/processing result
 */
export interface DataPackLoadResult {
  success: boolean;
  dataPack?: DataPack;
  virtualFileSystem?: VirtualFileSystem;
  errors?: string[];
  warnings?: string[];
  
  // Performance metrics
  loadTime: number; // Time taken to load in milliseconds
  decompressionTime?: number;
  decryptionTime?: number;
  cacheHit: boolean;
}

/**
 * Virtual filesystem representation after unpacking
 */
export interface VirtualFileSystem {
  // Root directory mapping
  root: VirtualDirectory;
  
  // Quick file lookup
  fileIndex: Map<string, VirtualFile>;
  
  // Directory lookup
  directoryIndex: Map<string, VirtualDirectory>;
  
  // Graph representation for relationships
  relationshipGraph: DataPackRelationship[];
}

/**
 * Virtual directory in the filesystem
 */
export interface VirtualDirectory {
  path: string;
  name: string;
  parent?: string;
  children: string[]; // Paths to child files/directories
  files: string[]; // Paths to files in this directory
  
  // Metadata
  createdAt: string;
  modifiedAt: string;
  
  // Obsidian-specific
  indexFile?: string; // Path to index.md or README.md
  template?: string; // Directory template type
}

/**
 * Virtual file in the filesystem
 */
export interface VirtualFile {
  // From DataPackFileEntry
  path: string;
  name: string;
  extension: string;
  size: number;
  mimeType: string;
  encoding: 'utf-8' | 'binary' | 'base64';
  hash: string;
  createdAt: string;
  modifiedAt: string;
  
  // Content
  content: string | ArrayBuffer | Uint8Array;
  
  // Parsed content (for structured files)
  parsedContent?: any;
  
  // Obsidian-specific
  frontmatter?: Record<string, any>;
  wikilinks?: string[];
  hashtags?: string[];
  backlinks?: string[];
  
  // Relationships to other files
  relationships: DataPackRelationship[];
}

/**
 * Error types for DataPack operations
 */
export enum DataPackErrorType {
  INVALID_FORMAT = 'INVALID_FORMAT',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  COMPRESSION_FAILED = 'COMPRESSION_FAILED',
  DECOMPRESSION_FAILED = 'DECOMPRESSION_FAILED',
  INVALID_MANIFEST = 'INVALID_MANIFEST',
  HASH_MISMATCH = 'HASH_MISMATCH',
  SIGNATURE_INVALID = 'SIGNATURE_INVALID',
  CACHE_ERROR = 'CACHE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  ACCESS_DENIED = 'ACCESS_DENIED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED'
}

/**
 * DataPack operation error
 */
export class DataPackError extends Error {
  constructor(
    public type: DataPackErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DataPackError';
  }
}
