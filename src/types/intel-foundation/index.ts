/**
 * Phase 1 Intel System Foundation - Type Exports
 * 
 * This index file exports all the missing core components identified
 * in the Intel System Implementation Roadmap for Phase 1.
 * 
 * These types enable the CyberCommand interface to work with:
 * - DataVault: Secure export/import functionality
 * - IntelWorkspace: File-based Intel management 
 * - IntelRepository: Git-based version control
 * - UnifiedIntelStorage: Single interface for all storage systems
 */

// =============================================================================
// DATAVAULT - SECURE EXPORT FORMAT
// =============================================================================

export type {
  // Core DataVault interfaces
  DataVault,
  IntelDataVault,
  IntelReportDataVault,
  IntelReportPackageDataVault,
  
  // Configuration interfaces
  EncryptionConfig,
  PasswordConfig,
  CompressionConfig,
  
  // Content interfaces
  ContentManifest,
  ContentFileInfo,
  ContentFolderInfo,
  
  // Metadata interfaces
  IntelExportMetadata,
  IntelReportExportMetadata,
  PackageExportMetadata,
  
  // Operation interfaces
  ExportOptions,
  ImportResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  
  // Supporting types
  SourceProtectionLevel,
  RetentionPolicy,
  AccessLogEntry,
  ApprovalEntry,
  CollaborationSettings,
  IntelQualityAssessment,
  AnalysisLock,
  DistributionEntry,
  PackageVersion,
  ImportedIntelInfo,
  ImportedReportInfo,
  ImportedPackageInfo
} from '../DataVault';

export {
  DEFAULT_ENCRYPTION_CONFIG,
  DEFAULT_PASSWORD_CONFIG,
  DEFAULT_COMPRESSION_CONFIG,
  DEFAULT_EXPORT_OPTIONS
} from '../DataVault';

// =============================================================================
// INTELWORKSPACE - FILE-BASED INTEL MANAGEMENT
// =============================================================================

export type {
  // Core workspace interfaces
  IntelWorkspace,
  WorkspaceStructure,
  WorkspaceSettings,
  GitRepositoryInfo,
  GitRemote,
  
  // File format interfaces
  IntelFile,
  IntelFrontmatter,
  IntelReportFile,
  IntelReportData as WorkspaceIntelReportData,
  
  // Package interfaces
  IntelReportPackage as WorkspaceIntelReportPackage,
  PackageStructure,
  AssetFile,
  PackageMetadata,
  PackageDependency,
  
  // Operation interfaces
  CreateWorkspaceOptions,
  FileOperationOptions,
  SearchOptions,
  SearchResult,
  SearchMatch,
  DateRange,
  
  // Validation interfaces
  WorkspaceValidationResult,
  FileValidationResult,
  ValidationError as WorkspaceValidationError,
  ValidationWarning as WorkspaceValidationWarning
} from '../IntelWorkspace';

export {
  DEFAULT_WORKSPACE_STRUCTURE,
  DEFAULT_WORKSPACE_SETTINGS,
  DEFAULT_PACKAGE_STRUCTURE
} from '../IntelWorkspace';

// =============================================================================
// INTELREPOSITORY - GIT WRAPPER FOR INTEL
// =============================================================================

export type {
  // Core repository interfaces
  IntelRepository,
  IntelCollaborationRepository,
  
  // Operation interfaces
  SaveOptions,
  FileFormat,
  
  // Git operation interfaces
  GitStatus,
  MergeResult,
  
  // File information interfaces
  IntelFileInfo,
  IntelReportFileInfo,
  IntelFileContent,
  IntelReportFileContent,
  
  // Conversion interfaces
  ConversionResult,
  
  // History and collaboration interfaces
  FileHistoryEntry,
  FileChange,
  FileDiff,
  DiffChunk,
  DiffLine,
  DiffSummary,
  TagInfo,
  ContributorInfo,
  
  // Collaboration interfaces
  ReviewRequest,
  ReviewComment,
  IntelComparison,
  IntelVersionInfo,
  IntelDifference,
  ComparisonSummary,
  PullRequest,
  IntelStats,
  FileActivityInfo,
  ContributorActivity,
  
  // Data interfaces (temporary)
  IntelData as RepositoryIntelData,
  IntelReportData as RepositoryIntelReportData
} from '../IntelRepository';

export {
  DEFAULT_SAVE_OPTIONS
} from '../IntelRepository';

// =============================================================================
// UNIFIED INTEL STORAGE - SINGLE INTERFACE
// =============================================================================

export type {
  // Core storage interface
  UnifiedIntelStorage,
  
  // Configuration interfaces
  StorageConfig,
  StorageHealthStatus,
  SystemStatus,
  HealthIssue,
  
  // Workspace management
  WorkspaceCreationOptions,
  WorkspaceInfo,
  
  // Filter interfaces
  IntelFilter,
  ReportFilter,
  PackageFilter,
  
  // Summary interfaces
  IntelSummary,
  IntelReportSummary,
  PackageSummary,
  
  // Export/Import interfaces
  ExportItem,
  ShareOptions,
  
  // Version control interfaces
  VersionHistoryEntry,
  ChangeInfo,
  
  // Transaction interfaces
  Transaction,
  TransactionOperation,
  
  // Performance interfaces
  CacheStatistics,
  OptimizationResult,
  
  // Backup interfaces
  BackupOptions,
  BackupInfo,
  
  // Package operations
  PackageContents,
  
  // Data interfaces (unified)
  IntelData as StorageIntelData,
  IntelReportData as StorageIntelReportData,
  IntelReportPackage as StorageIntelReportPackage
} from '../UnifiedIntelStorage';

export {
  DEFAULT_STORAGE_CONFIG
} from '../UnifiedIntelStorage';

// =============================================================================
// IMPLEMENTATION STATUS
// =============================================================================

/**
 * Phase 1 Implementation Status
 * 
 * ✅ DataVault: Interface and types completed
 * ✅ IntelWorkspace: File-based architecture defined
 * ✅ IntelRepository: Git wrapper interface completed
 * ✅ UnifiedIntelStorage: Single storage interface defined
 * 
 * Next Steps (Phase 1):
 * 1. Implement DataVault service class
 * 2. Implement IntelWorkspaceManager service class
 * 3. Implement IntelRepositoryManager service class
 * 4. Implement UnifiedIntelStorageManager service class
 * 5. Integration testing and validation
 * 
 * CyberCommand Readiness:
 * - Export/Upload: DataVault provides secure export functionality
 * - Import/Download: DataVault provides secure import functionality
 * - File Operations: IntelWorkspace enables .intel/.intelReport file management
 * - Version Control: IntelRepository enables Git-based operations
 * - Unified Access: UnifiedIntelStorage provides single point of access
 */
