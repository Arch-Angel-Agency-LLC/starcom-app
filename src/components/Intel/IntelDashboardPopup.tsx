import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import styles from './IntelDashboardPopup.module.css';
import type { IntelReportUI } from '../../types/intel/IntelReportUI';
import { intelReportService } from '../../services/intel/IntelReportService';
import type { CreateIntelReportInput } from '../../types/intel/IntelReportUI';

interface FormErrors {
  title?: string;
  content?: string;
  tags?: string;
  latitude?: string;
  longitude?: string;
}

interface IntelDashboardPopupProps {
  onClose: () => void;
  filterMode?: 'PUBLIC' | 'TEAM' | 'PERSONAL' | 'ALL';
}

const IntelDashboardPopup: React.FC<IntelDashboardPopupProps> = ({ 
  onClose, 
  filterMode = 'ALL' 
}) => {
  const { publicKey } = useWallet();
  
  const [reports, setReports] = useState<IntelReportUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create report form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'OSINT',
    tags: '',
    latitude: '',
    longitude: ''
  });

  // Load intel reports via centralized intelReportService and subscribe to changes
  useEffect(() => {
    let unsubscribe: undefined | (() => void);
    const load = async () => {
      setLoading(true);
      try {
        const list = await intelReportService.listReports();
        setReports(list);
        // subscribe to changes
        unsubscribe = intelReportService.onChange((next) => setReports(next));
      } catch (error) {
        console.error('Failed to load intel reports:', error);
        setNotification({ type: 'error', message: 'Failed to load intel reports. Please try again.' });
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Form validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 200) {
      errors.title = 'Title must not exceed 200 characters';
    }

    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    } else if (formData.content.length < 10) {
      errors.content = 'Content must be at least 10 characters';
    } else if (formData.content.length > 50000) {
      errors.content = 'Content must not exceed 50,000 characters';
    }

    if (!formData.tags.trim()) {
      errors.tags = 'At least one tag is required';
    }

    if (formData.latitude && (isNaN(parseFloat(formData.latitude)) || parseFloat(formData.latitude) < -90 || parseFloat(formData.latitude) > 90)) {
      errors.latitude = 'Latitude must be a valid number between -90 and 90';
    }

    if (formData.longitude && (isNaN(parseFloat(formData.longitude)) || parseFloat(formData.longitude) < -180 || parseFloat(formData.longitude) > 180)) {
      errors.longitude = 'Longitude must be a valid number between -180 and 180';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateReport = async () => {
    if (!validateForm()) {
      setNotification({ type: 'error', message: 'Please fix the validation errors before submitting.' });
      return;
    }

    if (!publicKey) {
      setNotification({ type: 'error', message: 'Please connect your wallet to create reports.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateIntelReportInput = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        classification: 'UNCLASSIFIED',
        status: 'DRAFT'
      };
      await intelReportService.createReport(input, publicKey.toString());
      // Refresh list (onChange should handle this too, but ensure immediate UX update)
      const list = await intelReportService.listReports();
      setReports(list);

      // Reset form
      setFormData({
        title: '',
        content: '',
        category: 'OSINT',
        tags: '',
        latitude: '',
        longitude: ''
      });
      setFormErrors({});
      setShowCreateForm(false);
  setNotification({ type: 'success', message: 'Intelligence report created successfully!' });
    } catch (error) {
      console.error('Failed to create intel report:', error);
      setNotification({ type: 'error', message: 'Failed to create intel report. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Filter and sort reports based on filter mode
  const filteredReports = reports.filter(report => {
    // Apply filter mode
    if (filterMode === 'PUBLIC') {
      // Show all reports for public sharing
      return true;
    } else if (filterMode === 'TEAM') {
      // Show all reports for team collaboration
      return true;
    } else if (filterMode === 'PERSONAL') {
      // Show only user's own reports
      if (report.author !== publicKey?.toString()) return false;
    }
    
    // Apply category filter
    if (filterCategory !== 'ALL' && report.category !== filterCategory) return false;
    
    // Apply status filter
    if (filterStatus !== 'ALL' && report.status !== filterStatus) return false;
    
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'updatedAt':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return '#888';
      case 'SUBMITTED': return '#ffa500';
      case 'REVIEWED': return '#0099ff';
      case 'APPROVED': return '#00ff41';
      case 'ARCHIVED': return '#666';
      default: return '#888';
    }
  };

  const getFilterModeDisplay = () => {
    switch (filterMode) {
      case 'PUBLIC': return '🌐 Public Sharing';
      case 'TEAM': return '👥 Team Collaboration';
      case 'PERSONAL': return '👤 Personal Workspace';
      default: return '📊 All Intel';
    }
  };

  // Handle ESC key to close popup
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showCreateForm) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, showCreateForm]);

  if (loading) {
    return (
      <div className={styles.popupContainer}>
        <div className={styles.loading}>Loading intel reports...</div>
      </div>
    );
  }

  return (
    <div className={styles.popupContainer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1>Intelligence Dashboard</h1>
            <p>{getFilterModeDisplay()} - Create, manage, and share intelligence reports</p>
          </div>
          
          <div className={styles.headerActions}>
            <button 
              className={styles.primaryButton}
              onClick={() => setShowCreateForm(true)}
            >
              + New Report
            </button>
            <button 
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close Intel Dashboard"
            >
              ×
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.filters}>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="ALL">All Categories</option>
              <option value="OSINT">OSINT</option>
              <option value="THREAT_INTELLIGENCE">Threat Intelligence</option>
              <option value="VULNERABILITY_RESEARCH">Vulnerability Research</option>
              <option value="INCIDENT_ANALYSIS">Incident Analysis</option>
              <option value="GEOINT">GEOINT</option>
            </select>

            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="APPROVED">Approved</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="updatedAt">Last Updated</option>
              <option value="createdAt">Date Created</option>
              <option value="title">Title</option>
            </select>
          </div>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{filteredReports.length}</span>
              <span className={styles.statLabel}>Filtered Reports</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {filteredReports.filter(report => report.status === 'APPROVED').length}
              </span>
              <span className={styles.statLabel}>Approved</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {filteredReports.filter(report => report.status === 'DRAFT').length}
              </span>
              <span className={styles.statLabel}>Drafts</span>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className={styles.reportsContainer}>
          <div className={styles.reportsGrid}>
            {filteredReports.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No intel reports found</h3>
                <p>No reports match the current {getFilterModeDisplay()} filter.</p>
                <button 
                  className={styles.primaryButton}
                  onClick={() => setShowCreateForm(true)}
                >
                  Create Report
                </button>
              </div>
            ) : (
              filteredReports.map(report => (
                <div key={report.id} className={styles.reportCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{report.title}</h3>
                  <div className={styles.cardMeta}>
                    <span 
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(report.status) }}
                    >
                      {report.status}
                    </span>
                  </div>
                </div>                  <p className={styles.cardContent}>
                    {report.content.length > 150 
                      ? `${report.content.substring(0, 150)}...` 
                      : report.content
                    }
                  </p>
                  
                  <div className={styles.cardTags}>
                    {report.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className={styles.tag}>{tag}</span>
                    ))}
                    {report.tags.length > 3 && (
                      <span className={styles.tagMore}>+{report.tags.length - 3} more</span>
                    )}
                  </div>
                  
                  <div className={styles.cardFooter}>
                    <div className={styles.cardDetails}>
                      <span className={styles.category}>{report.category}</span>
                      <span className={styles.author}>By {report.author.substring(0, 8)}...</span>
                    </div>
                    <span className={styles.lastUpdated}>
                      Updated {new Date(report.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Report Modal */}
        {showCreateForm && (
          <div className={styles.createModal}>
            <div className={styles.createModalContent}>
              <div className={styles.createModalHeader}>
                <h3>Create Intelligence Report</h3>
                <button 
                  className={styles.createCloseButton}
                  onClick={() => setShowCreateForm(false)}
                >
                  ×
                </button>
              </div>
              
              <div className={styles.createModalBody}>
                <div className={styles.inputGroup}>
                  <label>Report Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter report title..."
                  />
                  {formErrors.title && <div className={styles.error}>{formErrors.title}</div>}
                </div>
                
                <div className={styles.inputGroup}>
                  <label>Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="Enter report content and analysis..."
                    rows={5}
                  />
                  {formErrors.content && <div className={styles.error}>{formErrors.content}</div>}
                </div>
                
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label>Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="OSINT">OSINT</option>
                    <option value="THREAT_INTELLIGENCE">Threat Intelligence</option>
                    <option value="VULNERABILITY_RESEARCH">Vulnerability Research</option>
                    <option value="INCIDENT_ANALYSIS">Incident Analysis</option>
                    <option value="GEOINT">GEOINT</option>
                  </select>
                </div>
              </div>                <div className={styles.inputGroup}>
                  <label>Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="threat-intel, malware, campaign..."
                  />
                  {formErrors.tags && <div className={styles.error}>{formErrors.tags}</div>}
                </div>
                
                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label>Latitude (optional)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                      placeholder="40.7128"
                    />
                    {formErrors.latitude && <div className={styles.error}>{formErrors.latitude}</div>}
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label>Longitude (optional)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                      placeholder="-74.0060"
                    />
                    {formErrors.longitude && <div className={styles.error}>{formErrors.longitude}</div>}
                  </div>
                </div>
              </div>
              
              <div className={styles.createModalFooter}>
                <button 
                  className={styles.secondaryButton}
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
                <button 
                  className={styles.primaryButton}
                  onClick={handleCreateReport}
                  disabled={!formData.title.trim() || !formData.content.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Creating Report...' : 'Create Report'}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Notification Toast */}
      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default IntelDashboardPopup;
