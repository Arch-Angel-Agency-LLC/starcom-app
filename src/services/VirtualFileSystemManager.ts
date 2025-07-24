/**
 * VirtualFileSystemManager - Manages DataPack unpacking and virtual filesystem
 * 
 * Handles:
 * - ZIP/TAR extraction to virtual filesystem
 * - Obsidian vault structure parsing
 * - Relationship graph construction
 * - Browser-based storage (IndexedDB)
 * - Password-protected packages
 */

import JSZip from 'jszip';
import { 
  DataPack, 
  VirtualFileSystem, 
  VirtualFile, 
  VirtualDirectory,
  DataPackLoadResult,
  DataPackError,
  DataPackErrorType,
  DataPackCacheConfig,
  DataPackManifest
} from '../types/DataPack';
import { IntelReportDataPack, IntelEntity, IntelRelationship } from '../types/IntelReportDataPack';

/**
 * Virtual File System Manager
 * 
 * Manages the unpacking and organization of DataPacks into a virtual filesystem
 * that can be used by IntelWeb for graph visualization.
 */
class VirtualFileSystemManager {
  private cache: Map<string, VirtualFileSystem> = new Map();
  private cacheConfig: DataPackCacheConfig;
  
  constructor(cacheConfig?: Partial<DataPackCacheConfig>) {
    this.cacheConfig = {
      backend: 'indexeddb',
      maxSize: 100 * 1024 * 1024, // 100MB default
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      evictionPolicy: 'lru',
      compressInCache: true,
      preloadStrategy: 'lazy',
      ...cacheConfig
    };
  }
  
  /**
   * Load and unpack a DataPack into a virtual filesystem
   */
  async loadDataPack(
    dataPack: DataPack | IntelReportDataPack,
    password?: string
  ): Promise<DataPackLoadResult> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(dataPack);
      const cached = await this.getCachedFileSystem(cacheKey);
      
      if (cached) {
        return {
          success: true,
          dataPack,
          virtualFileSystem: cached,
          loadTime: Date.now() - startTime,
          cacheHit: true
        };
      }
      
      // Validate DataPack
      const validation = await this.validateDataPack(dataPack);
      if (!validation.valid) {
        throw new DataPackError(
          DataPackErrorType.INVALID_FORMAT,
          `DataPack validation failed: ${validation.errors.join(', ')}`
        );
      }
      
      // Decrypt if necessary
      const decryptedContent = await this.decryptContent(dataPack, password);
      const decryptionTime = Date.now() - startTime;
      
      // Decompress if necessary
      const decompressedContent = await this.decompressContent(decryptedContent, dataPack);
      const decompressionTime = Date.now() - startTime - decryptionTime;
      
      // Unpack based on format
      const virtualFs = await this.unpackContent(decompressedContent, dataPack);
      
      // Parse Obsidian structure if it's an IntelReportDataPack
      if (this.isIntelReportDataPack(dataPack)) {
        await this.parseObsidianStructure(virtualFs, dataPack);
      }
      
      // Cache the result
      await this.cacheFileSystem(cacheKey, virtualFs);
      
      return {
        success: true,
        dataPack,
        virtualFileSystem: virtualFs,
        loadTime: Date.now() - startTime,
        decompressionTime,
        decryptionTime,
        cacheHit: false
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        loadTime: Date.now() - startTime,
        cacheHit: false
      };
    }
  }
  
  /**
   * Create a DataPack from a directory structure
   */
  async createDataPack(
    sourceDir: VirtualFileSystem | Map<string, string>,
    options: CreateDataPackOptions
  ): Promise<DataPack> {
    const _startTime = Date.now();
    
    try {
      // Build file manifest
      const manifest = await this.buildManifest(sourceDir);
      
      // Pack content based on format
      const content = await this.packContent(sourceDir, options.format);
      
      // Compress if requested
      const compressedContent = options.compression?.enabled 
        ? await this.compressContent(content, options.compression)
        : content;
      
      // Encrypt if requested
      const finalContent = options.encryption?.enabled
        ? await this.encryptContent(compressedContent, options.encryption)
        : compressedContent;
      
      // Generate hashes
      const contentHash = await this.generateHash(finalContent);
      const manifestHash = await this.generateHash(JSON.stringify(manifest));
      
      // Create DataPack with proper type compliance
      const dataPack: DataPack = {
        id: options.id || this.generateId(),
        name: options.name || 'Untitled DataPack',
        version: options.version || '1.0.0',
        format: options.format,
        manifest,
        content: finalContent,
        manifestHash,
        contentHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: options.author,
        description: options.description,
        tags: options.tags,
        // Convert options format to DataPack format
        compression: options.compression?.enabled ? {
          algorithm: options.compression.algorithm,
          level: options.compression.level,
          originalSize: 0, // Will be calculated
          compressedSize: 0 // Will be calculated
        } : undefined,
        encryption: options.encryption?.enabled ? {
          algorithm: options.encryption.algorithm,
          keyDerivation: 'pbkdf2',
          iv: 'placeholder',
          salt: 'placeholder',
          iterations: 10000
        } : undefined,
        accessControl: options.accessControl ? {
          requiresAuthentication: false,
          ...options.accessControl
        } : undefined
      };
      
      return dataPack;
      
    } catch (error) {
      throw new DataPackError(
        DataPackErrorType.COMPRESSION_FAILED,
        `Failed to create DataPack: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  /**
   * Extract Obsidian vault structure for graph visualization
   */
  async extractObsidianGraph(virtualFs: VirtualFileSystem): Promise<{
    entities: IntelEntity[];
    relationships: IntelRelationship[];
  }> {
    const entities: IntelEntity[] = [];
    const relationships: IntelRelationship[] = [];
    
    // Process each markdown file as a potential entity
    for (const [_path, file] of virtualFs.fileIndex) {
      if (file.extension === '.md') {
        const entity = await this.parseEntityFromMarkdown(file);
        if (entity) {
          entities.push(entity);
          
          // Extract relationships from wikilinks
          const entityRelationships = await this.extractRelationshipsFromEntity(entity, virtualFs);
          relationships.push(...entityRelationships);
        }
      }
    }
    
    return { entities, relationships };
  }
  
  /**
   * Search files in the virtual filesystem
   */
  searchFiles(
    virtualFs: VirtualFileSystem,
    query: string,
    _options?: SearchOptions
  ): VirtualFile[] {
    const results: VirtualFile[] = [];
    const searchTerms = query.toLowerCase().split(' ');
    
    for (const [_path, file] of virtualFs.fileIndex) {
      let relevanceScore = 0;
      
      // Search in filename
      if (file.name.toLowerCase().includes(query.toLowerCase())) {
        relevanceScore += 10;
      }
      
      // Search in content (if text file)
      if (typeof file.content === 'string') {
        const content = file.content.toLowerCase();
        for (const term of searchTerms) {
          const matches = (content.match(new RegExp(term, 'g')) || []).length;
          relevanceScore += matches;
        }
      }
      
      // Search in frontmatter
      if (file.frontmatter) {
        const frontmatterText = JSON.stringify(file.frontmatter).toLowerCase();
        for (const term of searchTerms) {
          if (frontmatterText.includes(term)) {
            relevanceScore += 5;
          }
        }
      }
      
      // Search in tags and wikilinks
      if (file.hashtags) {
        for (const tag of file.hashtags) {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            relevanceScore += 8;
          }
        }
      }
      
      if (relevanceScore > 0) {
        results.push({
          ...file,
          relevanceScore
        } as VirtualFile & { relevanceScore: number });
      }
    }
    
    // Sort by relevance
    return results.sort((a, b) => 
      ((b as VirtualFile & { relevanceScore: number }).relevanceScore || 0) - 
      ((a as VirtualFile & { relevanceScore: number }).relevanceScore || 0)
    );
  }
  
  // Private helper methods
  
  private async validateDataPack(dataPack: DataPack): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Basic validation
    if (!dataPack.id) errors.push('Missing DataPack ID');
    if (!dataPack.manifest) errors.push('Missing manifest');
    if (!dataPack.content) errors.push('Missing content');
    
    // Hash validation
    if (dataPack.manifestHash) {
      const expectedHash = await this.generateHash(JSON.stringify(dataPack.manifest));
      if (expectedHash !== dataPack.manifestHash) {
        errors.push('Manifest hash mismatch');
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  private async decryptContent(dataPack: DataPack, password?: string): Promise<string | ArrayBuffer> {
    if (!dataPack.encryption || dataPack.encryption.algorithm === 'none') {
      return dataPack.content as string | ArrayBuffer;
    }
    
    if (!password) {
      throw new DataPackError(
        DataPackErrorType.DECRYPTION_FAILED,
        'Password required for encrypted DataPack'
      );
    }
    
    // Implementation would depend on the encryption algorithm
    // For now, return content as-is
    // TODO: Implement actual decryption
    return dataPack.content as string | ArrayBuffer;
  }
  
  private async decompressContent(content: string | ArrayBuffer, dataPack: DataPack): Promise<string | ArrayBuffer> {
    if (!dataPack.compression || dataPack.compression.algorithm === 'none') {
      return content;
    }
    
    // Implementation would depend on the compression algorithm
    // TODO: Implement actual decompression
    return content;
  }
  
  private async unpackContent(content: string | ArrayBuffer, dataPack: DataPack): Promise<VirtualFileSystem> {
    const virtualFs: VirtualFileSystem = {
      root: {
        path: '/',
        name: '',
        children: [],
        files: [],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      },
      fileIndex: new Map(),
      directoryIndex: new Map(),
      relationshipGraph: []
    };
    
    if (dataPack.format === 'zip') {
      return await this.unpackZip(content, virtualFs);
    } else if (dataPack.format === 'json') {
      return await this.unpackJson(content, virtualFs);
    }
    
    throw new DataPackError(
      DataPackErrorType.INVALID_FORMAT,
      `Unsupported format: ${dataPack.format}`
    );
  }
  
  private async unpackZip(content: string | ArrayBuffer, virtualFs: VirtualFileSystem): Promise<VirtualFileSystem> {
    try {
      const zip = await JSZip.loadAsync(content);
      
      // ZIP bomb protection
      const MAX_FILES = 10000;
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
      
      const fileNames = Object.keys(zip.files);
      
      // Check file count
      if (fileNames.length > MAX_FILES) {
        throw new DataPackError(
          DataPackErrorType.INVALID_FORMAT,
          `ZIP contains too many files (${fileNames.length} > ${MAX_FILES}). Possible ZIP bomb.`
        );
      }
      
      const _totalUncompressedSize = 0;
      
      // Pre-scan for ZIP bomb indicators and path traversal
      for (const [_relativePath, zipObject] of Object.entries(zip.files)) {
        if (!zipObject.dir) {
          // Use available properties from JSZip
          const fileName = zipObject.name;
          
          // Check for suspicious file patterns (path traversal protection)
          if (fileName.includes('..') || fileName.startsWith('/') || fileName.includes('\\')) {
            throw new DataPackError(
              DataPackErrorType.INVALID_FORMAT,
              `Suspicious file path detected: ${fileName}. Possible directory traversal attack.`
            );
          }
        }
      }
      
      // Process each file in the ZIP
      for (const [relativePath, zipObject] of Object.entries(zip.files)) {
        if (zipObject.dir) {
          // It's a directory
          const directory: VirtualDirectory = {
            path: '/' + relativePath,
            name: relativePath.split('/').pop() || '',
            children: [],
            files: [],
            createdAt: zipObject.date?.toISOString() || new Date().toISOString(),
            modifiedAt: zipObject.date?.toISOString() || new Date().toISOString()
          };
          
          virtualFs.directoryIndex.set(directory.path, directory);
        } else {
          // It's a file
          const fileContent = await zipObject.async('string');
          
          // Additional safety check after extraction
          if (fileContent.length > MAX_FILE_SIZE) {
            throw new DataPackError(
              DataPackErrorType.INVALID_FORMAT,
              `Extracted file ${relativePath} is too large (${fileContent.length} bytes). Possible ZIP bomb.`
            );
          }
          
          const file: VirtualFile = {
            path: '/' + relativePath,
            name: relativePath.split('/').pop() || '',
            extension: '.' + (relativePath.split('.').pop() || ''),
            size: fileContent.length,
            mimeType: this.getMimeType(relativePath),
            encoding: 'utf-8',
            hash: await this.generateHash(fileContent),
            createdAt: zipObject.date?.toISOString() || new Date().toISOString(),
            modifiedAt: zipObject.date?.toISOString() || new Date().toISOString(),
            content: fileContent,
            relationships: []
          };
          
          // Parse markdown frontmatter and wikilinks
          if (file.extension === '.md') {
            const parsed = this.parseMarkdown(fileContent);
            file.frontmatter = parsed.frontmatter;
            file.wikilinks = parsed.wikilinks;
            file.hashtags = parsed.hashtags;
            file.backlinks = []; // Will be populated later
          }
          
          virtualFs.fileIndex.set(file.path, file);
        }
      }
      
      return virtualFs;
    } catch (error) {
      throw new DataPackError(
        DataPackErrorType.DECOMPRESSION_FAILED,
        `Failed to unpack ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  private async unpackJson(content: string | ArrayBuffer, virtualFs: VirtualFileSystem): Promise<VirtualFileSystem> {
    try {
      const _data = JSON.parse(content as string);
      
      // Implementation for JSON-based virtual filesystem
      // TODO: Implement JSON unpacking
      
      return virtualFs;
    } catch (error) {
      throw new DataPackError(
        DataPackErrorType.INVALID_FORMAT,
        `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  private isIntelReportDataPack(dataPack: DataPack): dataPack is IntelReportDataPack {
    return 'intelligence' in dataPack && 'obsidianVault' in dataPack;
  }
  
  private async parseObsidianStructure(_virtualFs: VirtualFileSystem, _dataPack: IntelReportDataPack): Promise<void> {
    // Parse Obsidian-specific structure
    // TODO: Implement Obsidian structure parsing
  }
  
  private async parseEntityFromMarkdown(file: VirtualFile): Promise<IntelEntity | null> {
    if (!file.frontmatter) return null;
    
    const entity: IntelEntity = {
      id: file.path,
      name: file.frontmatter.title as string || file.name,
      type: (file.frontmatter.entityType as 'person' | 'organization' | 'location' | 'event' | 'document' | 'asset') || 'document',
      filePath: file.path,
      content: file.content as string,
      frontmatter: file.frontmatter,
      outgoingLinks: [],
      incomingLinks: [],
      confidence: (file.frontmatter.confidence as number) || 1.0,
      sources: [],
      classification: (file.frontmatter.classification as string) || 'UNCLASSIFIED',
      verified: (file.frontmatter.verified as boolean) || false
    };
    
    return entity;
  }
  
  private async extractRelationshipsFromEntity(_entity: IntelEntity, _virtualFs: VirtualFileSystem): Promise<IntelRelationship[]> {
    const relationships: IntelRelationship[] = [];
    
    // Extract from wikilinks
    // TODO: Parse wikilinks and create relationships
    
    return relationships;
  }
  
  private parseMarkdown(content: string): {
    frontmatter?: Record<string, unknown>;
    wikilinks?: string[];
    hashtags?: string[];
  } {
    const result: {
      frontmatter?: Record<string, unknown>;
      wikilinks?: string[];
      hashtags?: string[];
    } = {};
    
    // Parse frontmatter (YAML between ---)
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      try {
        // Simple YAML parsing (would need a proper YAML parser for production)
        const yamlContent = frontmatterMatch[1];
        const lines = yamlContent.split('\n');
        const frontmatter: Record<string, unknown> = {};
        
        for (const line of lines) {
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            frontmatter[key] = value;
          }
        }
        
        result.frontmatter = frontmatter;
      } catch (error) {
        console.warn('Failed to parse frontmatter:', error);
      }
    }
    
    // Extract wikilinks [[Entity Name]]
    const wikilinkMatches = content.match(/\[\[([^\]]+)\]\]/g);
    if (wikilinkMatches) {
      result.wikilinks = wikilinkMatches.map(match => 
        match.replace(/\[\[|\]\]/g, '').split('|')[0]
      );
    }
    
    // Extract hashtags #tag
    const hashtagMatches = content.match(/#[a-zA-Z0-9_]+/g);
    if (hashtagMatches) {
      result.hashtags = hashtagMatches.map(match => match.substring(1));
    }
    
    return result;
  }
  
  private getMimeType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'md': 'text/markdown',
      'txt': 'text/plain',
      'json': 'application/json',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'pdf': 'application/pdf'
    };
    
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }
  
  private async generateHash(content: string | ArrayBuffer): Promise<string> {
    const encoder = new TextEncoder();
    const data = typeof content === 'string' ? encoder.encode(content) : content;
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  private generateId(): string {
    return 'dp_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  private generateCacheKey(dataPack: DataPack): string {
    return `${dataPack.id}_${dataPack.contentHash}`;
  }
  
  private async getCachedFileSystem(cacheKey: string): Promise<VirtualFileSystem | null> {
    // TODO: Implement IndexedDB cache lookup
    return this.cache.get(cacheKey) || null;
  }
  
  private async cacheFileSystem(cacheKey: string, virtualFs: VirtualFileSystem): Promise<void> {
    // TODO: Implement IndexedDB cache storage
    this.cache.set(cacheKey, virtualFs);
  }
  
  private async buildManifest(_sourceDir: VirtualFileSystem | Map<string, string>): Promise<DataPackManifest> {
    // TODO: Implement manifest building
    return {
      totalFiles: 0,
      totalSize: 0,
      directories: [],
      files: [],
      relationships: []
    };
  }
  
  private async packContent(_sourceDir: VirtualFileSystem | Map<string, string>, _format: string): Promise<string | ArrayBuffer> {
    // TODO: Implement content packing
    return '';
  }
  
  private async compressContent(content: string | ArrayBuffer, _compression: Record<string, unknown>): Promise<string | ArrayBuffer> {
    // TODO: Implement compression
    return content;
  }
  
  private async encryptContent(content: string | ArrayBuffer, _encryption: Record<string, unknown>): Promise<string | ArrayBuffer> {
    // TODO: Implement encryption
    return content;
  }
}

// Interfaces for the helper methods

interface CreateDataPackOptions {
  id?: string;
  name?: string;
  version?: string;
  format: 'zip' | 'tar' | 'json';
  author?: string;
  description?: string;
  tags?: string[];
  compression?: {
    enabled: boolean;
    algorithm: 'gzip' | 'brotli' | 'lz4';
    level?: number;
  };
  encryption?: {
    enabled: boolean;
    algorithm: 'aes-256-gcm' | 'chacha20-poly1305';
    password?: string;
  };
  accessControl?: {
    publicRead: boolean;
  };
}

interface SearchOptions {
  maxResults?: number;
  includeContent?: boolean;
  fileTypes?: string[];
}

export { VirtualFileSystemManager };
