/**
 * 🌐 Offline Intel Report Service
 * 
 * Provides a comprehensive offline/online hybrid system for Intel Report creation:
 * - Allows creation without Web3 login
 * - Securely stores reports locally
 * - Handles sync/merge with Web3 data upon login
 * - Provides conflict resolution and data integrity
 */

import { IntelReportData, IntelReportFormData, IntelReportTransformer } from '../models/IntelReportData';
import { secureStorage } from '../security/storage/SecureStorageManager';
import { IntelReportService } from './IntelReportService';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

// Wallet interface for typing
export interface WalletAdapter {
  publicKey: PublicKey | null;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
}

// Storage keys for offline reports
const OFFLINE_STORAGE_KEYS = {
  OFFLINE_REPORTS: 'offline_intel_reports',
  SYNC_QUEUE: 'intel_sync_queue',
  SYNC_SETTINGS: 'intel_sync_settings',
  CONFLICT_RESOLUTION: 'intel_conflict_resolution'
} as const;

// Offline report states
export type OfflineReportStatus = 
  | 'draft'         // Being created/edited
  | 'pending'       // Ready for sync
  | 'syncing'       // Currently syncing
  | 'synced'        // Successfully synced
  | 'conflict'      // Merge conflict detected
  | 'error';        // Sync error

// Offline report structure
export interface OfflineIntelReport extends IntelReportData {
  // Offline-specific fields
  offlineId: string;                    // Unique offline identifier
  status: OfflineReportStatus;          // Current sync status
  createdOffline: boolean;              // Whether created offline
  lastModified: number;                 // Last modification timestamp
  syncAttempts: number;                 // Number of sync attempts
  conflictData?: ConflictData;          // Conflict resolution data
  
  // Metadata
  deviceInfo?: string;                  // Device/browser info
  userAgent?: string;                   // User agent string
  sessionId?: string;                   // Session identifier
}

// Conflict resolution data
export interface ConflictData {
  type: 'duplicate' | 'coordinate_mismatch' | 'content_mismatch' | 'timestamp_mismatch';
  onchainReport?: IntelReportData;      // Conflicting on-chain report
  resolution?: 'merge' | 'replace' | 'keep_both' | 'manual';
  resolvedAt?: number;                  // Resolution timestamp
  resolvedBy?: string;                  // User who resolved
}

// Sync settings
export interface SyncSettings {
  autoSync: boolean;                    // Auto-sync on wallet connect
  conflictResolution: 'ask' | 'merge' | 'replace' | 'keep_both';
  maxRetries: number;                   // Max sync retry attempts
  retryDelay: number;                   // Retry delay in ms
  batchSize: number;                    // Batch sync size
}

// Sync statistics
export interface SyncStats {
  totalOfflineReports: number;
  pendingSync: number;
  successfulSyncs: number;
  failedSyncs: number;
  conflicts: number;
  lastSyncAttempt?: number;
  lastSuccessfulSync?: number;
}

// Service events
export interface OfflineIntelServiceEvents {
  'report-created': OfflineIntelReport;
  'report-updated': OfflineIntelReport;
  'sync-started': { reportIds: string[] };
  'sync-progress': { completed: number; total: number };
  'sync-completed': { successful: number; failed: number };
  'conflict-detected': { report: OfflineIntelReport; conflict: ConflictData };
  'conflict-resolved': { report: OfflineIntelReport; resolution: string };
}

/**
 * Main Offline Intel Report Service
 */
export class OfflineIntelReportService {
  private static instance: OfflineIntelReportService;
  private intelReportService?: IntelReportService;
  private eventListeners: Map<keyof OfflineIntelServiceEvents, Set<(data: unknown) => void>> = new Map();
  private syncInProgress = false;
  private currentSession: string;

  private constructor() {
    this.currentSession = this.generateSessionId();
    this.initializeDefaultSettings();
  }

  static getInstance(): OfflineIntelReportService {
    if (!OfflineIntelReportService.instance) {
      OfflineIntelReportService.instance = new OfflineIntelReportService();
    }
    return OfflineIntelReportService.instance;
  }

  /**
   * Initialize Web3 service for syncing
   */
  initializeWeb3Service(connection: Connection, programId?: string): void {
    this.intelReportService = new IntelReportService(connection, programId);
    console.log('🔗 Web3 Intel Report Service initialized for syncing');
  }

  // =============================================================================
  // OFFLINE REPORT CREATION & MANAGEMENT
  // =============================================================================

  /**
   * Create a new offline intel report
   */
  async createOfflineReport(
    data: Partial<IntelReportData>,
    coordinates?: { lat: number; lng: number }
  ): Promise<OfflineIntelReport> {
    const offlineId = this.generateOfflineId();
    const timestamp = Date.now();

    const offlineReport: OfflineIntelReport = {
      // Core data
      id: offlineId,
      title: data.title || 'Untitled Report',
      content: data.content || '',
      tags: data.tags || [],
      latitude: coordinates?.lat || data.latitude || 0,
      longitude: coordinates?.lng || data.longitude || 0,
      timestamp: data.timestamp || timestamp,
      author: data.author || 'Anonymous',

      // Offline-specific fields
      offlineId,
      status: 'draft',
      createdOffline: true,
      lastModified: timestamp,
      syncAttempts: 0,

      // Metadata
      deviceInfo: this.getDeviceInfo(),
      userAgent: navigator.userAgent,
      sessionId: this.currentSession
    };

    // Store offline report
    await this.saveOfflineReport(offlineReport);
    
    // Emit event
    this.emit('report-created', offlineReport);

    console.log('📝 Offline intel report created:', {
      id: offlineId,
      coordinates: { lat: offlineReport.latitude, lng: offlineReport.longitude },
      title: offlineReport.title
    });

    return offlineReport;
  }

  /**
   * Create offline report from form data
   */
  async createOfflineReportFromForm(formData: IntelReportFormData): Promise<OfflineIntelReport> {
    const transformedData = IntelReportTransformer.formToBlockchain(formData);
    
    return this.createOfflineReport({
      title: transformedData.title,
      content: transformedData.content,
      tags: transformedData.tags,
      latitude: transformedData.latitude,
      longitude: transformedData.longitude,
      timestamp: transformedData.timestamp,
      author: transformedData.author
    });
  }

  /**
   * Update an existing offline report
   */
  async updateOfflineReport(
    offlineId: string, 
    updates: Partial<IntelReportData>
  ): Promise<OfflineIntelReport> {
    const reports = await this.getOfflineReports();
    const reportIndex = reports.findIndex(r => r.offlineId === offlineId);
    
    if (reportIndex === -1) {
      throw new Error(`Offline report not found: ${offlineId}`);
    }

    const updatedReport: OfflineIntelReport = {
      ...reports[reportIndex],
      ...updates,
      lastModified: Date.now(),
      status: reports[reportIndex].status === 'synced' ? 'pending' : reports[reportIndex].status
    };

    reports[reportIndex] = updatedReport;
    await this.saveOfflineReports(reports);
    
    this.emit('report-updated', updatedReport);
    
    return updatedReport;
  }

  /**
   * Get all offline reports
   */
  async getOfflineReports(): Promise<OfflineIntelReport[]> {
    try {
      const reports = await secureStorage.getItem<OfflineIntelReport[]>(
        OFFLINE_STORAGE_KEYS.OFFLINE_REPORTS
      );
      return reports || [];
    } catch (error) {
      console.error('Failed to load offline reports:', error);
      return [];
    }
  }

  /**
   * Get reports by status
   */
  async getReportsByStatus(status: OfflineReportStatus): Promise<OfflineIntelReport[]> {
    const reports = await this.getOfflineReports();
    return reports.filter(r => r.status === status);
  }

  /**
   * Get a specific offline report
   */
  async getOfflineReport(offlineId: string): Promise<OfflineIntelReport | null> {
    const reports = await this.getOfflineReports();
    return reports.find(r => r.offlineId === offlineId) || null;
  }

  /**
   * Delete an offline report
   */
  async deleteOfflineReport(offlineId: string): Promise<boolean> {
    const reports = await this.getOfflineReports();
    const filteredReports = reports.filter(r => r.offlineId !== offlineId);
    
    if (filteredReports.length === reports.length) {
      return false; // Report not found
    }

    await this.saveOfflineReports(filteredReports);
    return true;
  }

  // =============================================================================
  // SYNC & WEB3 INTEGRATION
  // =============================================================================

  /**
   * Sync all pending offline reports with Web3
   */
  async syncOfflineReports(wallet?: WalletAdapter): Promise<SyncStats> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    if (!this.intelReportService) {
      throw new Error('Web3 service not initialized');
    }

    this.syncInProgress = true;
    const stats: SyncStats = {
      totalOfflineReports: 0,
      pendingSync: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflicts: 0
    };

    try {
      const reports = await this.getOfflineReports();
      const pendingReports = reports.filter(r => r.status === 'pending' || r.status === 'error');
      
      stats.totalOfflineReports = reports.length;
      stats.pendingSync = pendingReports.length;

      if (pendingReports.length === 0) {
        console.log('🔄 No reports to sync');
        return stats;
      }

      // Emit sync start event
      this.emit('sync-started', { reportIds: pendingReports.map(r => r.offlineId) });

      // Get sync settings
      const settings = await this.getSyncSettings();
      
      // Process reports in batches
      const batches = this.chunkArray(pendingReports, settings.batchSize);
      let completed = 0;

      for (const batch of batches) {
        for (const report of batch) {
          try {
            await this.syncSingleReport(report, wallet);
            stats.successfulSyncs++;
          } catch (error) {
            console.error(`Failed to sync report ${report.offlineId}:`, error);
            stats.failedSyncs++;
            
            // Update report status
            await this.updateReportStatus(report.offlineId, 'error');
          }
          
          completed++;
          this.emit('sync-progress', { completed, total: pendingReports.length });
        }
      }

      // Update last sync timestamp
      await this.updateSyncTimestamp();
      
      // Emit completion event
      this.emit('sync-completed', { 
        successful: stats.successfulSyncs, 
        failed: stats.failedSyncs 
      });

    } finally {
      this.syncInProgress = false;
    }

    return stats;
  }

  /**
   * Sync a single offline report
   */
  private async syncSingleReport(report: OfflineIntelReport, wallet?: WalletAdapter): Promise<void> {
    if (!this.intelReportService || !wallet) {
      throw new Error('Web3 service or wallet not available');
    }

    // Update status to syncing
    await this.updateReportStatus(report.offlineId, 'syncing');

    try {
      // Check for conflicts
      const conflict = await this.detectConflicts(report);
      if (conflict) {
        report.conflictData = conflict;
        await this.updateReportStatus(report.offlineId, 'conflict');
        this.emit('conflict-detected', { report, conflict });
        return;
      }

      // Convert to blockchain format
      const blockchainData = IntelReportTransformer.formToBlockchain({
        title: report.title,
        content: report.content,
        tags: report.tags.join(','),
        categories: report.categories?.join(',') || '',
        lat: report.latitude.toString(),
        long: report.longitude.toString(),
        date: new Date(report.timestamp).toISOString(),
        author: report.author,
        subtitle: report.subtitle || '',
        metaDescription: report.metaDescription || ''
      });

      // Submit to blockchain
      const signature = await this.intelReportService.submitIntelReport(blockchainData, wallet);
      
      // Update report with blockchain data
      const updatedReport: OfflineIntelReport = {
        ...report,
        signature,
        status: 'synced',
        lastModified: Date.now(),
        syncAttempts: report.syncAttempts + 1
      };

      await this.updateOfflineReport(report.offlineId, updatedReport);
      
      console.log('✅ Report synced successfully:', {
        offlineId: report.offlineId,
        signature
      });

    } catch (error) {
      // Increment sync attempts
      const updatedReport: OfflineIntelReport = {
        ...report,
        syncAttempts: report.syncAttempts + 1,
        status: 'error',
        lastModified: Date.now()
      };

      await this.updateOfflineReport(report.offlineId, updatedReport);
      throw error;
    }
  }

  /**
   * Detect conflicts with existing on-chain data
   */
  private async detectConflicts(report: OfflineIntelReport): Promise<ConflictData | null> {
    if (!this.intelReportService) return null;

    try {
      // Fetch existing reports from blockchain
      const onchainReports = await this.intelReportService.fetchIntelReports();
      
      // Check for duplicates or conflicts
      for (const onchainReport of onchainReports) {
        // Check for coordinate conflicts (within 0.001 degrees)
        const latDiff = Math.abs(onchainReport.latitude - report.latitude);
        const lngDiff = Math.abs(onchainReport.longitude - report.longitude);
        
        if (latDiff < 0.001 && lngDiff < 0.001) {
          // Check content similarity
          const titleSimilarity = this.calculateSimilarity(onchainReport.title, report.title);
          const contentSimilarity = this.calculateSimilarity(onchainReport.content, report.content);
          
          if (titleSimilarity > 0.8 || contentSimilarity > 0.8) {
            return {
              type: 'duplicate',
              onchainReport,
              resolution: 'merge' // Default resolution
            };
          }
          
          if (titleSimilarity > 0.5 || contentSimilarity > 0.5) {
            return {
              type: 'coordinate_mismatch',
              onchainReport
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      return null;
    }
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(
    offlineId: string, 
    resolution: ConflictData['resolution']
  ): Promise<void> {
    const report = await this.getOfflineReport(offlineId);
    if (!report || !report.conflictData) {
      throw new Error('No conflict to resolve');
    }

    const conflictData: ConflictData = {
      ...report.conflictData,
      resolution,
      resolvedAt: Date.now(),
      resolvedBy: 'user'
    };

    let updatedReport: OfflineIntelReport;

    switch (resolution) {
      case 'merge':
        updatedReport = await this.mergeReports(report, report.conflictData.onchainReport!);
        break;
      
      case 'replace':
        updatedReport = {
          ...report,
          status: 'pending',
          conflictData: conflictData
        };
        break;
      
      case 'keep_both':
        // Keep offline report as separate entry
        updatedReport = {
          ...report,
          status: 'pending',
          conflictData: conflictData,
          title: `${report.title} (Offline Copy)`
        };
        break;
      
      default:
        throw new Error('Invalid resolution type');
    }

    await this.updateOfflineReport(offlineId, updatedReport);
    this.emit('conflict-resolved', { report: updatedReport, resolution: resolution || 'unknown' });
  }

  /**
   * Merge two reports intelligently
   */
  private async mergeReports(
    offlineReport: OfflineIntelReport,
    onchainReport: IntelReportData
  ): Promise<OfflineIntelReport> {
    // Intelligent merge logic
    const mergedReport: OfflineIntelReport = {
      ...offlineReport,
      
      // Use more recent content
      title: offlineReport.lastModified > onchainReport.timestamp 
        ? offlineReport.title 
        : onchainReport.title,
      
      content: offlineReport.lastModified > onchainReport.timestamp 
        ? offlineReport.content 
        : onchainReport.content,
      
      // Merge tags (unique)
      tags: [...new Set([...offlineReport.tags, ...onchainReport.tags])],
      
      // Use average coordinates if different
      latitude: (offlineReport.latitude + onchainReport.latitude) / 2,
      longitude: (offlineReport.longitude + onchainReport.longitude) / 2,
      
      // Use most recent timestamp
      timestamp: Math.max(offlineReport.timestamp, onchainReport.timestamp),
      
      // Keep offline metadata
      status: 'pending',
      lastModified: Date.now()
    };

    return mergedReport;
  }

  // =============================================================================
  // SETTINGS & CONFIGURATION
  // =============================================================================

  /**
   * Get sync settings
   */
  async getSyncSettings(): Promise<SyncSettings> {
    try {
      const settings = await secureStorage.getItem<SyncSettings>(
        OFFLINE_STORAGE_KEYS.SYNC_SETTINGS
      );
      return settings || this.getDefaultSyncSettings();
    } catch (error) {
      console.error('Failed to load sync settings:', error);
      return this.getDefaultSyncSettings();
    }
  }

  /**
   * Update sync settings
   */
  async updateSyncSettings(settings: Partial<SyncSettings>): Promise<void> {
    const currentSettings = await this.getSyncSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    
    await secureStorage.setItem(
      OFFLINE_STORAGE_KEYS.SYNC_SETTINGS,
      updatedSettings,
      { classification: 'CONFIDENTIAL' }
    );
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<SyncStats> {
    const reports = await this.getOfflineReports();
    
    return {
      totalOfflineReports: reports.length,
      pendingSync: reports.filter(r => r.status === 'pending').length,
      successfulSyncs: reports.filter(r => r.status === 'synced').length,
      failedSyncs: reports.filter(r => r.status === 'error').length,
      conflicts: reports.filter(r => r.status === 'conflict').length,
      lastSyncAttempt: await this.getLastSyncAttempt(),
      lastSuccessfulSync: await this.getLastSuccessfulSync()
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Generate unique offline ID
   */
  private generateOfflineId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get device info
   */
  private getDeviceInfo(): string {
    return `${navigator.platform} | ${navigator.language} | ${screen.width}x${screen.height}`;
  }

  /**
   * Calculate text similarity
   */
  private calculateSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    // Simple similarity calculation (can be improved with more sophisticated algorithms)
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Save offline reports
   */
  private async saveOfflineReports(reports: OfflineIntelReport[]): Promise<void> {
    await secureStorage.setItem(
      OFFLINE_STORAGE_KEYS.OFFLINE_REPORTS,
      reports,
      { classification: 'CONFIDENTIAL' }
    );
  }

  /**
   * Save single offline report
   */
  private async saveOfflineReport(report: OfflineIntelReport): Promise<void> {
    const reports = await this.getOfflineReports();
    const existingIndex = reports.findIndex(r => r.offlineId === report.offlineId);
    
    if (existingIndex >= 0) {
      reports[existingIndex] = report;
    } else {
      reports.push(report);
    }
    
    await this.saveOfflineReports(reports);
  }

  /**
   * Update report status
   */
  private async updateReportStatus(offlineId: string, status: OfflineReportStatus): Promise<void> {
    const reports = await this.getOfflineReports();
    const reportIndex = reports.findIndex(r => r.offlineId === offlineId);
    
    if (reportIndex >= 0) {
      reports[reportIndex] = {
        ...reports[reportIndex],
        status,
        lastModified: Date.now()
      };
      await this.saveOfflineReports(reports);
    }
  }

  /**
   * Get default sync settings
   */
  private getDefaultSyncSettings(): SyncSettings {
    return {
      autoSync: true,
      conflictResolution: 'ask',
      maxRetries: 3,
      retryDelay: 5000,
      batchSize: 5
    };
  }

  /**
   * Initialize default settings
   */
  private async initializeDefaultSettings(): Promise<void> {
    const settings = await this.getSyncSettings();
    if (!settings) {
      await this.updateSyncSettings(this.getDefaultSyncSettings());
    }
  }

  /**
   * Update sync timestamp
   */
  private async updateSyncTimestamp(): Promise<void> {
    await secureStorage.setItem('last_sync_timestamp', Date.now());
  }

  /**
   * Get last sync attempt
   */
  private async getLastSyncAttempt(): Promise<number | undefined> {
    return await secureStorage.getItem<number>('last_sync_timestamp');
  }

  /**
   * Get last successful sync
   */
  private async getLastSuccessfulSync(): Promise<number | undefined> {
    return await secureStorage.getItem<number>('last_successful_sync');
  }

  // =============================================================================
  // EVENT SYSTEM
  // =============================================================================

  /**
   * Add event listener
   */
  on<K extends keyof OfflineIntelServiceEvents>(
    event: K,
    listener: (data: OfflineIntelServiceEvents[K]) => void
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  /**
   * Emit event
   */
  private emit<K extends keyof OfflineIntelServiceEvents>(
    event: K,
    data: OfflineIntelServiceEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Clear all offline data (for testing/reset)
   */
  async clearAllOfflineData(): Promise<void> {
    await secureStorage.removeItem(OFFLINE_STORAGE_KEYS.OFFLINE_REPORTS);
    await secureStorage.removeItem(OFFLINE_STORAGE_KEYS.SYNC_QUEUE);
    await secureStorage.removeItem(OFFLINE_STORAGE_KEYS.SYNC_SETTINGS);
    await secureStorage.removeItem(OFFLINE_STORAGE_KEYS.CONFLICT_RESOLUTION);
    await secureStorage.removeItem('last_sync_timestamp');
    await secureStorage.removeItem('last_successful_sync');
    
    console.log('🗑️ All offline intel report data cleared');
  }
}

// Export singleton instance
export const offlineIntelReportService = OfflineIntelReportService.getInstance();
