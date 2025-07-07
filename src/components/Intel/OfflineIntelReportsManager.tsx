/**
 * 🌐 Offline Intel Reports Manager Component
 * 
 * Provides a comprehensive interface for managing offline Intel Reports:
 * - View all offline reports with status indicators
 * - Sync reports when wallet is connected
 * - Handle conflicts and merging
 * - Configure sync settings
 */

import React, { useState, useEffect } from 'react';
import { 
  offlineIntelReportService, 
  OfflineIntelReport,
  SyncStats,
  ConflictData,
  SyncSettings,
  WalletAdapter
} from '../../services/OfflineIntelReportService';

interface OfflineIntelReportsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  wallet?: WalletAdapter;
  onViewReport?: (report: OfflineIntelReport) => void;
  onEditReport?: (report: OfflineIntelReport) => void;
}

export const OfflineIntelReportsManager: React.FC<OfflineIntelReportsManagerProps> = ({
  isOpen,
  onClose,
  wallet,
  onViewReport,
  onEditReport
}) => {
  const [offlineReports, setOfflineReports] = useState<OfflineIntelReport[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [syncSettings, setSyncSettings] = useState<SyncSettings | null>(null);
  const [activeTab, setActiveTab] = useState('reports');
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  // Load data on mount and when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reports, stats, settings] = await Promise.all([
        offlineIntelReportService.getOfflineReports(),
        offlineIntelReportService.getSyncStats(),
        offlineIntelReportService.getSyncSettings()
      ]);
      
      setOfflineReports(reports);
      setSyncStats(stats);
      setSyncSettings(settings);
    } catch (error) {
      console.error('Failed to load offline data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up event listeners
  useEffect(() => {
    const unsubscribers = [
      offlineIntelReportService.on('report-created', loadData),
      offlineIntelReportService.on('report-updated', loadData),
      offlineIntelReportService.on('sync-started', ({ reportIds }) => {
        setSyncInProgress(true);
        setSyncProgress({ completed: 0, total: reportIds.length });
      }),
      offlineIntelReportService.on('sync-progress', (progress) => {
        setSyncProgress(progress);
      }),
      offlineIntelReportService.on('sync-completed', () => {
        setSyncInProgress(false);
        loadData(); // Refresh data
      }),
      offlineIntelReportService.on('conflict-detected', () => {
        loadData(); // Refresh to show conflict status
      })
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Sync all offline reports
  const handleSyncAll = async () => {
    if (!wallet) {
      alert('Please connect your wallet to sync reports');
      return;
    }

    try {
      setSyncInProgress(true);
      const stats = await offlineIntelReportService.syncOfflineReports(wallet);
      
      if (stats.conflicts > 0) {
        alert(`Sync completed with ${stats.conflicts} conflicts that need resolution.`);
      } else {
        alert(`Sync completed successfully! ${stats.successfulSyncs} reports synced.`);
      }
      
      loadData();
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setSyncInProgress(false);
    }
  };

  // Delete an offline report
  const handleDeleteReport = async (offlineId: string) => {
    if (confirm('Are you sure you want to delete this offline report?')) {
      try {
        await offlineIntelReportService.deleteOfflineReport(offlineId);
        loadData();
      } catch (error) {
        console.error('Failed to delete report:', error);
        alert('Failed to delete report');
      }
    }
  };

  // Resolve conflict
  const handleResolveConflict = async (
    report: OfflineIntelReport, 
    resolution: ConflictData['resolution']
  ) => {
    try {
      await offlineIntelReportService.resolveConflict(report.offlineId, resolution);
      loadData();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      alert('Failed to resolve conflict');
    }
  };

  // Update sync settings
  const handleUpdateSyncSettings = async (updates: Partial<SyncSettings>) => {
    try {
      await offlineIntelReportService.updateSyncSettings(updates);
      setSyncSettings(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Failed to update sync settings:', error);
    }
  };

  // Get status color and display
  const getStatusDisplay = (status: OfflineIntelReport['status']) => {
    switch (status) {
      case 'draft':
        return { color: '#6b7280', label: 'Draft' };
      case 'pending':
        return { color: '#eab308', label: 'Pending Sync' };
      case 'syncing':
        return { color: '#3b82f6', label: 'Syncing' };
      case 'synced':
        return { color: '#10b981', label: 'Synced' };
      case 'conflict':
        return { color: '#f59e0b', label: 'Conflict' };
      case 'error':
        return { color: '#ef4444', label: 'Error' };
      default:
        return { color: '#6b7280', label: 'Unknown' };
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          width: '1200px',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            📱 Offline Intel Reports Manager
            {syncStats && (
              <span style={{ 
                marginLeft: '12px', 
                fontSize: '14px', 
                backgroundColor: '#f3f4f6', 
                padding: '4px 8px', 
                borderRadius: '4px' 
              }}>
                {syncStats.totalOfflineReports} Reports
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '18px', marginBottom: '12px' }}>Loading...</div>
            <div>🔄</div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb' }}>
                {['reports', 'sync', 'settings'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                      color: activeTab === tab ? '#3b82f6' : '#6b7280',
                      fontWeight: activeTab === tab ? 'bold' : 'normal',
                      textTransform: 'capitalize'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0 }}>Offline Reports</h3>
                  <button
                    onClick={handleSyncAll}
                    disabled={syncInProgress || !wallet || offlineReports.filter(r => r.status === 'pending').length === 0}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: syncInProgress || !wallet ? '#d1d5db' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: syncInProgress || !wallet ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {syncInProgress ? `🔄 Syncing... (${syncProgress.completed}/${syncProgress.total})` : '☁️ Sync All'}
                  </button>
                </div>

                {offlineReports.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '48px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px' 
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
                    <h3 style={{ margin: '0 0 8px 0' }}>No Offline Reports</h3>
                    <p style={{ margin: 0, color: '#6b7280' }}>
                      Create Intel Reports while offline and they'll appear here for syncing later.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {offlineReports.map((report) => {
                      const statusDisplay = getStatusDisplay(report.status);

                      return (
                        <div 
                          key={report.offlineId}
                          style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '16px',
                            backgroundColor: 'white'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <h4 style={{ margin: 0, fontSize: '18px' }}>{report.title}</h4>
                                <span 
                                  style={{
                                    backgroundColor: statusDisplay.color,
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {statusDisplay.label}
                                </span>
                              </div>
                              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                                {report.content.length > 100 ? `${report.content.substring(0, 100)}...` : report.content}
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
                            <div>📍 {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</div>
                            <div>📅 {new Date(report.timestamp).toLocaleDateString()}</div>
                            <div>👤 {report.author}</div>
                            <div>🏷️ {report.tags.length} tags</div>
                          </div>

                          {report.status === 'conflict' && report.conflictData && (
                            <div style={{ 
                              backgroundColor: '#fef3c7', 
                              border: '1px solid #f59e0b', 
                              borderRadius: '6px', 
                              padding: '12px', 
                              marginBottom: '16px' 
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span>⚠️</span>
                                <strong style={{ color: '#92400e' }}>Conflict Detected</strong>
                              </div>
                              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#92400e' }}>
                                {report.conflictData.type === 'duplicate' && 'Similar report found on blockchain'}
                                {report.conflictData.type === 'coordinate_mismatch' && 'Coordinate conflict with existing report'}
                                {report.conflictData.type === 'content_mismatch' && 'Content differs from blockchain version'}
                              </p>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleResolveConflict(report, 'merge')}
                                  style={{ 
                                    padding: '4px 12px', 
                                    backgroundColor: '#10b981', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer', 
                                    fontSize: '12px' 
                                  }}
                                >
                                  Merge
                                </button>
                                <button
                                  onClick={() => handleResolveConflict(report, 'replace')}
                                  style={{ 
                                    padding: '4px 12px', 
                                    backgroundColor: '#f59e0b', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer', 
                                    fontSize: '12px' 
                                  }}
                                >
                                  Replace
                                </button>
                                <button
                                  onClick={() => handleResolveConflict(report, 'keep_both')}
                                  style={{ 
                                    padding: '4px 12px', 
                                    backgroundColor: '#6b7280', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer', 
                                    fontSize: '12px' 
                                  }}
                                >
                                  Keep Both
                                </button>
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {onViewReport && (
                                <button
                                  onClick={() => onViewReport(report)}
                                  style={{ 
                                    padding: '4px 8px', 
                                    backgroundColor: '#e5e7eb', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer' 
                                  }}
                                >
                                  👁️
                                </button>
                              )}
                              {onEditReport && report.status === 'draft' && (
                                <button
                                  onClick={() => onEditReport(report)}
                                  style={{ 
                                    padding: '4px 8px', 
                                    backgroundColor: '#e5e7eb', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer' 
                                  }}
                                >
                                  ✏️
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteReport(report.offlineId)}
                                style={{ 
                                  padding: '4px 8px', 
                                  backgroundColor: '#fee2e2', 
                                  color: '#dc2626', 
                                  border: 'none', 
                                  borderRadius: '4px', 
                                  cursor: 'pointer' 
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                              Modified: {new Date(report.lastModified).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sync Tab */}
            {activeTab === 'sync' && (
              <div>
                <h3 style={{ marginTop: 0 }}>Sync Status</h3>
                
                {syncStats && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{syncStats.totalOfflineReports}</div>
                      <div style={{ color: '#6b7280' }}>Total Reports</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#eab308' }}>{syncStats.pendingSync}</div>
                      <div style={{ color: '#6b7280' }}>Pending Sync</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{syncStats.successfulSyncs}</div>
                      <div style={{ color: '#6b7280' }}>Synced</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{syncStats.conflicts}</div>
                      <div style={{ color: '#6b7280' }}>Conflicts</div>
                    </div>
                  </div>
                )}

                {!wallet && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '48px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px' 
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
                    <h3 style={{ margin: '0 0 8px 0' }}>Wallet Not Connected</h3>
                    <p style={{ margin: 0, color: '#6b7280' }}>
                      Connect your wallet to sync offline reports to the blockchain.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h3 style={{ marginTop: 0 }}>Sync Settings</h3>
                
                {syncSettings && (
                  <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={syncSettings.autoSync}
                          onChange={(e) => handleUpdateSyncSettings({ autoSync: e.target.checked })}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold' }}>Auto-Sync on Wallet Connect</div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            Automatically sync reports when wallet is connected
                          </div>
                        </div>
                      </label>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Conflict Resolution Strategy
                      </label>
                      <select
                        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                        value={syncSettings.conflictResolution}
                        onChange={(e) => 
                          handleUpdateSyncSettings({ 
                            conflictResolution: e.target.value as SyncSettings['conflictResolution']
                          })
                        }
                      >
                        <option value="ask">Ask for each conflict</option>
                        <option value="merge">Auto-merge when possible</option>
                        <option value="replace">Replace with offline version</option>
                        <option value="keep_both">Keep both versions</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                          Max Retry Attempts
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                          value={syncSettings.maxRetries}
                          onChange={(e) => 
                            handleUpdateSyncSettings({ 
                              maxRetries: parseInt(e.target.value, 10) 
                            })
                          }
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                          Batch Size
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                          value={syncSettings.batchSize}
                          onChange={(e) => 
                            handleUpdateSyncSettings({ 
                              batchSize: parseInt(e.target.value, 10) 
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', padding: '24px', borderRadius: '8px' }}>
                  <h4 style={{ color: '#dc2626', marginTop: 0 }}>Danger Zone</h4>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure? This will delete ALL offline reports and cannot be undone.')) {
                        await offlineIntelReportService.clearAllOfflineData();
                        loadData();
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Clear All Offline Data
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
