/**
 * IntelReportPackageService - Folder-based Package Management Service
 * 
 * This service implements Phase 3 folder-based package management for organizing
 * related Intel reports, supporting Intel, and assets into coherent packages.
 * This complements the existing NFT-focused IntelReportPackage system.
 * 
 * @fileoverview Folder-based Intel Report Package management service
 * @version 1.0.0
 * @since Phase 3 - Advanced Features
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { DataVault } from '../types/DataVault';

// ============================================================================
// FOLDER-BASED PACKAGE INTERFACES
// ============================================================================

/**
 * Folder-based IntelReportPackage interface - represents a filesystem folder
 * containing related Intel reports, supporting Intel, and assets.
 */
export interface FolderIntelReportPackage {
  // Package Identity
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly version: string;
  readonly created: Date;
  readonly modified: Date;
  
  // Folder Structure
  readonly folderPath: string; // Root folder containing the package
  readonly packageManifest: FolderPackageManifest;
  
  // Package Contents (folder-based organization)
  readonly reports: string[]; // Paths to .intelReport files within package
  readonly supportingIntel: string[]; // Paths to related .intel files
  readonly assets: string[]; // Paths to supporting files (docs, images, etc.)
  readonly subPackages: string[]; // Paths to nested packages
  
  // Package Metadata
  readonly classification: InformationVisibility;
  readonly tags: string[];
  readonly contributors: string[];
  readonly lastAccessed: Date;
}

/**
 * Folder package manifest file (.intelPackage.json)
 */
export interface FolderPackageManifest {
  // Basic Information
  name: string;
  version: string;
  description: string;
  keywords: string[];
  
  // Package Structure
  main: string; // Primary report file
  files: string[]; // Included files pattern
  directories: FolderPackageDirectories;
  
  // Dependencies and Relations
  dependencies: FolderPackageDependency[];
  relatedPackages: string[];
  basePackage?: string; // For derived packages
  
  // Metadata
  author: string;
  contributors: string[];
  license: string;
  classification: InformationVisibility;
  
  // Package Configuration
  scripts: { [name: string]: string };
  config: FolderPackageConfig;
  
  // Timestamps
  created: string; // ISO date string
  modified: string; // ISO date string
  published?: string; // ISO date string
}

/**
 * Package directory structure specification
 */
export interface FolderPackageDirectories {
  reports: string; // Folder for .intelReport files
  intel: string; // Folder for supporting .intel files
  assets: string; // Folder for supporting documents/media
  docs: string; // Folder for documentation
  temp: string; // Folder for temporary/working files
  archive: string; // Folder for archived content
}

/**
 * Package dependency specification
 */
export interface FolderPackageDependency {
  name: string;
  version: string;
  type: 'package' | 'intel' | 'asset';
  source: 'local' | 'remote' | 'vault';
  location: string;
  required: boolean;
}

/**
 * Package configuration options
 */
export interface FolderPackageConfig {
  // Export Settings
  defaultExportFormat: 'vault' | 'zip' | 'folder';
  includeAssets: boolean;
  compressionLevel: number;
  
  // Access Control
  accessRestrictions: AccessRestriction[];
  requireAuthentication: boolean;
  
  // Validation Rules
  validationRules: ValidationRule[];
  autoValidation: boolean;
  
  // Performance
  maxSize: number; // Maximum package size in bytes
  cacheStrategy: 'none' | 'aggressive' | 'selective';
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export type InformationVisibility = 
  | 'public' 
  | 'internal' 
  | 'confidential' 
  | 'restricted' 
  | 'top-secret';

export type AssetType = 
  | 'document' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'data' 
  | 'code' 
  | 'reference'
  | 'template'
  | 'unknown';

export interface AccessRestriction {
  type: 'user' | 'role' | 'group' | 'clearance';
  value: string;
  permission: 'read' | 'write' | 'delete' | 'export';
  expiry?: Date;
}

export interface ValidationRule {
  name: string;
  type: 'structure' | 'content' | 'metadata' | 'security';
  rule: string;
  required: boolean;
  message: string;
}

export interface PackageSize {
  totalBytes: number;
  reportBytes: number;
  intelBytes: number;
  assetBytes: number;
  fileCount: number;
  folderCount: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  manifestValid: boolean;
  structureValid: boolean;
  contentValid: boolean;
  validationTime: number;
}

export interface ValidationError {
  code: string;
  message: string;
  path: string;
  severity: 'error' | 'warning' | 'info';
  fixSuggestion?: string;
}

export interface ValidationWarning extends ValidationError {
  severity: 'warning';
  canIgnore: boolean;
}

export interface ExportOptions {
  format: 'vault' | 'zip' | 'folder';
  includeAssets: boolean;
  includeDependencies: boolean;
  destination?: string;
}

// ============================================================================
// MAIN SERVICE IMPLEMENTATION
// ============================================================================

/**
 * Folder-based Intel Report Package Service
 * 
 * Manages filesystem-based packages containing related Intel reports,
 * supporting Intel files, and assets organized in folder structures.
 */
export class FolderIntelReportPackageService {
  constructor(
    private workspaceRoot: string = './intel-packages'
  ) {}

  // ============================================================================
  // PACKAGE CREATION AND LOADING
  // ============================================================================

  /**
   * Create a new folder-based Intel report package
   */
  async createPackage(
    folderPath: string,
    manifest: Partial<FolderPackageManifest>
  ): Promise<FolderIntelReportPackage> {
    try {
      // Ensure folder exists
      await fs.mkdir(folderPath, { recursive: true });
      
      // Create default directory structure
      const directories = manifest.directories || this.getDefaultDirectories();
      await this.createDirectoryStructure(folderPath, directories);
      
      // Create package manifest
      const fullManifest: FolderPackageManifest = {
        name: manifest.name || path.basename(folderPath),
        version: manifest.version || '1.0.0',
        description: manifest.description || '',
        keywords: manifest.keywords || [],
        main: manifest.main || 'main-report.intelReport',
        files: manifest.files || ['**/*'],
        directories,
        dependencies: manifest.dependencies || [],
        relatedPackages: manifest.relatedPackages || [],
        author: manifest.author || 'Unknown',
        contributors: manifest.contributors || [],
        license: manifest.license || 'Proprietary',
        classification: manifest.classification || 'internal',
        scripts: manifest.scripts || {},
        config: manifest.config || this.getDefaultConfig(),
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      };
      
      // Write manifest to package folder
      await this.writeManifest(folderPath, fullManifest);
      
      // Create package instance
      const packageInstance: FolderIntelReportPackage = {
        id: this.generatePackageId(),
        title: fullManifest.name,
        description: fullManifest.description,
        version: fullManifest.version,
        created: new Date(fullManifest.created),
        modified: new Date(fullManifest.modified),
        folderPath,
        packageManifest: fullManifest,
        reports: [],
        supportingIntel: [],
        assets: [],
        subPackages: [],
        classification: fullManifest.classification,
        tags: fullManifest.keywords,
        contributors: fullManifest.contributors,
        lastAccessed: new Date()
      };
      
      return packageInstance;
    } catch (error) {
      throw new FolderPackageError(
        `Failed to create package at ${folderPath}: ${error.message}`,
        'PACKAGE_CREATION_FAILED',
        folderPath,
        error
      );
    }
  }

  /**
   * Load an existing folder-based Intel report package
   */
  async loadPackage(folderPath: string): Promise<FolderIntelReportPackage> {
    try {
      // Check if folder exists
      const stats = await fs.stat(folderPath);
      if (!stats.isDirectory()) {
        throw new FolderPackageError(
          `Path is not a directory: ${folderPath}`,
          'INVALID_PACKAGE_PATH',
          folderPath
        );
      }
      
      // Load manifest
      const manifest = await this.loadManifest(folderPath);
      if (!manifest) {
        throw new FolderPackageError(
          `No package manifest found in: ${folderPath}`,
          'MANIFEST_NOT_FOUND',
          folderPath
        );
      }
      
      // Scan package contents
      const contents = await this.scanPackageContents(folderPath, manifest);
      
      // Create package instance
      const packageInstance: FolderIntelReportPackage = {
        id: this.generatePackageId(),
        title: manifest.name,
        description: manifest.description,
        version: manifest.version,
        created: new Date(manifest.created),
        modified: new Date(manifest.modified),
        folderPath,
        packageManifest: manifest,
        reports: contents.reports,
        supportingIntel: contents.intel,
        assets: contents.assets,
        subPackages: contents.subPackages,
        classification: manifest.classification,
        tags: manifest.keywords,
        contributors: manifest.contributors,
        lastAccessed: new Date()
      };
      
      return packageInstance;
    } catch (error) {
      if (error instanceof FolderPackageError) {
        throw error;
      }
      throw new FolderPackageError(
        `Failed to load package from ${folderPath}: ${error.message}`,
        'PACKAGE_LOAD_FAILED',
        folderPath,
        error
      );
    }
  }

  // ============================================================================
  // PACKAGE OPERATIONS
  // ============================================================================

  /**
   * Add an Intel report to the package
   */
  async addReport(
    packagePath: string,
    reportPath: string,
    content?: Record<string, unknown>
  ): Promise<void> {
    const targetPath = path.join(packagePath, 'reports', path.basename(reportPath));
    
    if (content) {
      await fs.writeFile(targetPath, JSON.stringify(content, null, 2));
    } else {
      await fs.copyFile(reportPath, targetPath);
    }
    
    await this.updateManifestTimestamp(packagePath);
  }

  /**
   * Add supporting Intel to the package
   */
  async addIntel(
    packagePath: string,
    intelPath: string,
    content?: Record<string, unknown>
  ): Promise<void> {
    const targetPath = path.join(packagePath, 'intel', path.basename(intelPath));
    
    if (content) {
      await fs.writeFile(targetPath, JSON.stringify(content, null, 2));
    } else {
      await fs.copyFile(intelPath, targetPath);
    }
    
    await this.updateManifestTimestamp(packagePath);
  }

  /**
   * Add an asset to the package
   */
  async addAsset(
    packagePath: string,
    assetPath: string,
    _assetType: AssetType
  ): Promise<void> {
    const targetPath = path.join(packagePath, 'assets', path.basename(assetPath));
    await fs.copyFile(assetPath, targetPath);
    await this.updateManifestTimestamp(packagePath);
  }

  /**
   * Calculate package size
   */
  async calculateSize(packagePath: string): Promise<PackageSize> {
    const result: PackageSize = {
      totalBytes: 0,
      reportBytes: 0,
      intelBytes: 0,
      assetBytes: 0,
      fileCount: 0,
      folderCount: 0
    };
    
    const calculateDir = async (dirPath: string, type: string) => {
      try {
        const items = await fs.readdir(dirPath);
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = await fs.stat(itemPath);
          
          if (stats.isDirectory()) {
            result.folderCount++;
            await calculateDir(itemPath, type);
          } else {
            result.fileCount++;
            result.totalBytes += stats.size;
            
            if (type === 'reports') result.reportBytes += stats.size;
            else if (type === 'intel') result.intelBytes += stats.size;
            else if (type === 'assets') result.assetBytes += stats.size;
          }
        }
      } catch {
        // Directory doesn't exist or inaccessible
      }
    };
    
    await calculateDir(path.join(packagePath, 'reports'), 'reports');
    await calculateDir(path.join(packagePath, 'intel'), 'intel');
    await calculateDir(path.join(packagePath, 'assets'), 'assets');
    
    return result;
  }

  /**
   * Validate package structure and contents
   */
  async validatePackage(packagePath: string): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    try {
      // Check if package directory exists
      const stats = await fs.stat(packagePath);
      if (!stats.isDirectory()) {
        errors.push({
          code: 'INVALID_PACKAGE_PATH',
          message: 'Package path is not a directory',
          path: packagePath,
          severity: 'error'
        });
      }
      
      // Validate manifest
      const manifest = await this.loadManifest(packagePath);
      if (!manifest) {
        errors.push({
          code: 'MANIFEST_NOT_FOUND',
          message: 'Package manifest (.intelPackage.json) not found',
          path: packagePath,
          severity: 'error'
        });
      } else {
        // Validate manifest structure
        if (!manifest.name) {
          errors.push({
            code: 'MISSING_PACKAGE_NAME',
            message: 'Package name is required',
            path: packagePath,
            severity: 'error'
          });
        }
        
        if (!manifest.version) {
          warnings.push({
            code: 'MISSING_VERSION',
            message: 'Package version not specified',
            path: packagePath,
            severity: 'warning',
            canIgnore: true
          });
        }
      }
      
      // Validate directory structure
      const expectedDirs = ['reports', 'intel', 'assets', 'docs'];
      for (const dir of expectedDirs) {
        const dirPath = path.join(packagePath, dir);
        try {
          await fs.access(dirPath);
        } catch {
          warnings.push({
            code: 'MISSING_DIRECTORY',
            message: `Recommended directory '${dir}' not found`,
            path: dirPath,
            severity: 'warning',
            canIgnore: true
          });
        }
      }
      
      const validationTime = Date.now() - startTime;
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        manifestValid: manifest !== null,
        structureValid: errors.filter(e => e.code.includes('STRUCTURE')).length === 0,
        contentValid: errors.filter(e => e.code.includes('CONTENT')).length === 0,
        validationTime
      };
      
    } catch (error) {
      errors.push({
        code: 'VALIDATION_ERROR',
        message: `Validation failed: ${error.message}`,
        path: packagePath,
        severity: 'error'
      });
      
      return {
        isValid: false,
        errors,
        warnings,
        manifestValid: false,
        structureValid: false,
        contentValid: false,
        validationTime: Date.now() - startTime
      };
    }
  }

  /**
   * Export package to DataVault
   */
  async exportToVault(
    packagePath: string,
    _options: ExportOptions = { format: 'vault', includeAssets: true, includeDependencies: false }
  ): Promise<DataVault> {
    // This would integrate with the DataVault service once it's available
    // For now, return a placeholder implementation
    throw new Error('DataVault export not yet implemented - requires DataVault service integration');
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Create default directory structure for new packages
   */
  private async createDirectoryStructure(
    packagePath: string,
    directories: FolderPackageDirectories
  ): Promise<void> {
    const dirs = [
      directories.reports,
      directories.intel,
      directories.assets,
      directories.docs,
      directories.temp,
      directories.archive
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(path.join(packagePath, dir), { recursive: true });
    }
  }

  /**
   * Get default directory structure
   */
  private getDefaultDirectories(): FolderPackageDirectories {
    return {
      reports: 'reports',
      intel: 'intel',
      assets: 'assets',
      docs: 'docs',
      temp: 'temp',
      archive: 'archive'
    };
  }

  /**
   * Get default package configuration
   */
  private getDefaultConfig(): FolderPackageConfig {
    return {
      defaultExportFormat: 'vault',
      includeAssets: true,
      compressionLevel: 6,
      accessRestrictions: [],
      requireAuthentication: false,
      validationRules: [],
      autoValidation: true,
      maxSize: 100 * 1024 * 1024, // 100MB
      cacheStrategy: 'selective'
    };
  }

  /**
   * Write package manifest to disk
   */
  private async writeManifest(
    packagePath: string,
    manifest: FolderPackageManifest
  ): Promise<void> {
    const manifestPath = path.join(packagePath, '.intelPackage.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  }

  /**
   * Load package manifest from disk
   */
  private async loadManifest(packagePath: string): Promise<FolderPackageManifest | null> {
    try {
      const manifestPath = path.join(packagePath, '.intelPackage.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      return JSON.parse(manifestContent);
    } catch {
      return null;
    }
  }

  /**
   * Update manifest timestamp
   */
  private async updateManifestTimestamp(packagePath: string): Promise<void> {
    const manifest = await this.loadManifest(packagePath);
    if (manifest) {
      manifest.modified = new Date().toISOString();
      await this.writeManifest(packagePath, manifest);
    }
  }

  /**
   * Scan package contents and categorize files
   */
  private async scanPackageContents(
    packagePath: string,
    manifest: FolderPackageManifest
  ): Promise<{
    reports: string[];
    intel: string[];
    assets: string[];
    subPackages: string[];
  }> {
    const result = {
      reports: [],
      intel: [],
      assets: [],
      subPackages: []
    };
    
    // Scan reports directory
    const reportsDir = path.join(packagePath, manifest.directories.reports);
    result.reports = await this.scanDirectory(reportsDir, '.intelReport');
    
    // Scan intel directory
    const intelDir = path.join(packagePath, manifest.directories.intel);
    result.intel = await this.scanDirectory(intelDir, '.intel');
    
    // Scan assets directory
    const assetsDir = path.join(packagePath, manifest.directories.assets);
    result.assets = await this.scanDirectoryAllFiles(assetsDir);
    
    // Scan for sub-packages
    result.subPackages = await this.scanForSubPackages(packagePath);
    
    return result;
  }

  /**
   * Scan directory for files with specific extension
   */
  private async scanDirectory(dirPath: string, extension: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath, { recursive: true });
      return files
        .filter(file => typeof file === 'string' && file.endsWith(extension))
        .map(file => path.join(dirPath, file as string));
    } catch {
      return [];
    }
  }

  /**
   * Scan directory for all files
   */
  private async scanDirectoryAllFiles(dirPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath, { recursive: true });
      const result = [];
      
      for (const file of files) {
        if (typeof file === 'string') {
          const filePath = path.join(dirPath, file);
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            result.push(filePath);
          }
        }
      }
      
      return result;
    } catch {
      return [];
    }
  }

  /**
   * Scan for sub-packages (directories containing .intelPackage.json)
   */
  private async scanForSubPackages(packagePath: string): Promise<string[]> {
    const result = [];
    
    try {
      const items = await fs.readdir(packagePath);
      
      for (const item of items) {
        const itemPath = path.join(packagePath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          const manifestPath = path.join(itemPath, '.intelPackage.json');
          try {
            await fs.access(manifestPath);
            result.push(itemPath);
          } catch {
            // Not a package directory
          }
        }
      }
    } catch {
      // Error reading directory
    }
    
    return result;
  }

  /**
   * Generate unique package ID
   */
  private generatePackageId(): string {
    return `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class FolderPackageError extends Error {
  constructor(
    message: string,
    public code: string,
    public packagePath?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'FolderPackageError';
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new FolderIntelReportPackageService instance
 */
export function createFolderIntelReportPackageService(
  workspaceRoot?: string
): FolderIntelReportPackageService {
  return new FolderIntelReportPackageService(workspaceRoot);
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default FolderIntelReportPackageService;
