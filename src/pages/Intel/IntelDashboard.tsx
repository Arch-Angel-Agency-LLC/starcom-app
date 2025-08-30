import React, { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import styles from './IntelDashboard.module.css';
import { intelReportService } from '../../services/intel/IntelReportService';
import { IntelReportUI } from '../../types/intel/IntelReportUI';

interface FormErrors {
  title?: string;
  content?: string;
  tags?: string;
  latitude?: string;
  longitude?: string;
}

const IntelDashboard: React.FC = () => {
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
    classification: 'UNCLASSIFIED' as const,
    latitude: '',
    longitude: ''
  });

  // Initial load + migration
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const load = async () => {
      setLoading(true);
      try {
        await intelReportService.migrateLegacyIfNeeded();
        const list = await intelReportService.listReports();
        setReports(list);
        unsubscribe = intelReportService.onChange(setReports);
      } catch (e) {
        console.error('Failed to load intel reports', e);
        setNotification({ type: 'error', message: 'Failed to load intel reports.' });
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  // Form validation (unchanged logic)
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
      await intelReportService.createReport({
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        classification: formData.classification,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
      }, publicKey.toString());

      // Reset form
      setFormData({
        title: '',
        content: '',
        category: 'OSINT',
        tags: '',
        classification: 'UNCLASSIFIED',
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

  // Filter and sort reports
  const filteredReports = useMemo(() => reports.filter(report => {
    if (filterCategory !== 'ALL' && report.category !== filterCategory) return false;
    if (filterStatus !== 'ALL' && report.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'createdAt':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'updatedAt':
      default:
        return b.updatedAt.getTime() - a.updatedAt.getTime();
    }
  }), [reports, filterCategory, filterStatus, sortBy]);

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

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'UNCLASSIFIED': return '#00ff41';
      case 'CONFIDENTIAL': return '#ffa500';
      case 'SECRET': return '#ff6600';
      case 'TOP_SECRET': return '#ff0000';
      default: return '#888';
    }
  };

  if (loading) {
    return (
      <div className={styles.intelDashboard}>
        <div className={styles.loading}>Loading intel reports...</div>
      </div>
    );
  }

  return (
    <div className={styles.intelDashboard}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1>Intelligence Reports</h1>
          <p>Create, manage, and share intelligence reports and analysis</p>
        </div>
        
        <div className={styles.headerActions}>
          <button 
            className={styles.primaryButton}
            onClick={() => setShowCreateForm(true)}
          >
            + New Report
          </button>
        </div>
      </div>

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
            <span className={styles.statValue}>{reports.length}</span>
            <span className={styles.statLabel}>Total Reports</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {reports.filter(report => report.status === 'APPROVED').length}
            </span>
            <span className={styles.statLabel}>Approved</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {reports.filter(report => report.status === 'DRAFT').length}
            </span>
            <span className={styles.statLabel}>Drafts</span>
          </div>
        </div>
      </div>

      <div className={styles.reportsGrid}>
        {filteredReports.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No intel reports found</h3>
            <p>Start by creating your first intelligence report.</p>
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
                  <span 
                    className={styles.classificationBadge}
                    style={{ color: getClassificationColor(report.classification) }}
                  >
                    {report.classification}
                  </span>
                </div>
              </div>
              
              <p className={styles.cardContent}>
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
                  Updated {report.updatedAt.toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Report Modal */}
      {showCreateForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Create Intelligence Report</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
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
                
                <div className={styles.inputGroup}>
                  <label>Classification</label>
                  <select 
                    value={formData.classification}
                    onChange={(e) => setFormData({...formData, classification: e.target.value as typeof formData.classification})}
                  >
                    <option value="UNCLASSIFIED">Unclassified</option>
                    <option value="CONFIDENTIAL">Confidential</option>
                    <option value="SECRET">Secret</option>
                    <option value="TOP_SECRET">Top Secret</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.inputGroup}>
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
            
            <div className={styles.modalFooter}>
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

export default IntelDashboard;
