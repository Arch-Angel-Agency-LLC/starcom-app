import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { submitIntelReport } from '../../api/intelligence';
import { IntelReportFormData } from '../HUD/Corners/BottomRight/IntelReportFormData';
import styles from './IntelReportSubmission.module.css';

// AI-NOTE: Simplified intel report submission for OSINT cyber investigation teams
// Supports offline mode with local storage and sync when online

interface IntelReportSubmissionProps {
  teamId: string;
  investigationId: string;
  onlineStatus: boolean;
}

interface OfflineReport {
  id: string;
  formData: IntelReportFormData;
  timestamp: number;
  status: 'pending' | 'submitted' | 'failed';
}

const IntelReportSubmission: React.FC<IntelReportSubmissionProps> = ({
  teamId,
  investigationId,
  onlineStatus
}) => {
  const { connected, publicKey, signTransaction } = useWallet();
  const [formData, setFormData] = useState<IntelReportFormData>({
    title: '',
    subtitle: '',
    content: '',
    tags: '',
    categories: 'OSINT',
    lat: '',
    long: '',
    date: new Date().toISOString().split('T')[0],
    author: '',
    metaDescription: '',
  });

  const [status, setStatus] = useState('');
  const [offlineReports, setOfflineReports] = useState<OfflineReport[]>([]);

  // Load offline reports from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`offline-reports-${teamId}`);
    if (stored) {
      setOfflineReports(JSON.parse(stored));
    }
  }, [teamId]);

  // Auto-save draft
  useEffect(() => {
    if (formData.title || formData.content) {
      localStorage.setItem(`draft-report-${teamId}`, JSON.stringify(formData));
    }
  }, [formData, teamId]);

  // Load draft on component mount
  useEffect(() => {
    const draft = localStorage.getItem(`draft-report-${teamId}`);
    if (draft) {
      setFormData(JSON.parse(draft));
    }
  }, [teamId]);

  // Sync offline reports when coming online
  const syncOfflineReports = useCallback(async () => {
    if (!connected || !publicKey || !signTransaction) return;
    
    const pendingReports = offlineReports.filter(r => r.status === 'pending');
    
    for (const report of pendingReports) {
      try {
        const reportData = {
          title: report.formData.title,
          content: report.formData.content,
          tags: report.formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          latitude: parseFloat(report.formData.lat) || 0,
          longitude: parseFloat(report.formData.long) || 0,
        };

        await submitIntelReport(reportData, { publicKey, signTransaction });
        
        // Update status to submitted
        setOfflineReports(prev => 
          prev.map(r => r.id === report.id ? { ...r, status: 'submitted' } : r)
        );
      } catch (error) {
        console.error('Failed to sync offline report:', error);
        // Mark as failed
        setOfflineReports(prev => 
          prev.map(r => r.id === report.id ? { ...r, status: 'failed' } : r)
        );
      }
    }
  }, [connected, publicKey, signTransaction, offlineReports]);

  useEffect(() => {
    if (onlineStatus && connected && offlineReports.length > 0) {
      syncOfflineReports();
    }
  }, [onlineStatus, connected, offlineReports.length, syncOfflineReports]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      setStatus('Title and content are required');
      return;
    }

    // Add team and investigation metadata
    const enhancedFormData = {
      ...formData,
      tags: `${formData.tags},TEAM:${teamId},INV:${investigationId}`.trim(),
      author: formData.author || publicKey?.toString() || 'Unknown',
    };

    if (!onlineStatus || !connected) {
      // Save offline
      const offlineReport: OfflineReport = {
        id: `offline-${Date.now()}`,
        formData: enhancedFormData,
        timestamp: Date.now(),
        status: 'pending'
      };

      const updated = [...offlineReports, offlineReport];
      setOfflineReports(updated);
      localStorage.setItem(`offline-reports-${teamId}`, JSON.stringify(updated));
      
      setStatus('Report saved offline. Will sync when online.');
      clearForm();
      return;
    }

    if (!publicKey || !signTransaction) {
      setStatus('Please connect your wallet to submit reports online.');
      return;
    }

    setStatus('Submitting report to blockchain...');
    
    try {
      const reportData = {
        title: enhancedFormData.title,
        content: enhancedFormData.content,
        tags: enhancedFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        latitude: parseFloat(enhancedFormData.lat) || 0,
        longitude: parseFloat(enhancedFormData.long) || 0,
      };

      const signature = await submitIntelReport(reportData, { publicKey, signTransaction });
      
      setStatus(`Report submitted successfully! Tx: ${signature.substring(0, 8)}...`);
      clearForm();
      
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error submitting report:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      content: '',
      tags: '',
      categories: 'OSINT',
      lat: '',
      long: '',
      date: new Date().toISOString().split('T')[0],
      author: '',
      metaDescription: '',
    });
    localStorage.removeItem(`draft-report-${teamId}`);
  };

  const handleAutoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          lat: position.coords.latitude.toString(),
          long: position.coords.longitude.toString(),
        }));
      }, (error) => {
        setStatus(`Location error: ${error.message}`);
      });
    } else {
      setStatus('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Submit Intel Report</h2>
        <div className={styles.metadata}>
          <span>Team: {teamId}</span>
          <span>Investigation: {investigationId}</span>
          <span className={onlineStatus ? styles.online : styles.offline}>
            {onlineStatus ? '🟢 Online' : '🔴 Offline'}
          </span>
        </div>
      </div>

      {offlineReports.length > 0 && (
        <div className={styles.offlineStatus}>
          <h3>Offline Reports ({offlineReports.length})</h3>
          {offlineReports.map(report => (
            <div key={report.id} className={styles.offlineReport}>
              <span>{report.formData.title}</span>
              <span className={`${styles.status} ${styles[report.status]}`}>
                {report.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Suspicious Domain Registration"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Content *</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Detailed findings from OSINT investigation..."
            rows={6}
            required
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Tags</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="OSINT, domain, suspicious"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Category</label>
            <select name="categories" value={formData.categories} onChange={handleChange}>
              <option value="OSINT">OSINT</option>
              <option value="SIGINT">SIGINT</option>
              <option value="HUMINT">HUMINT</option>
              <option value="GEOINT">GEOINT</option>
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Latitude</label>
            <input
              type="number"
              name="lat"
              value={formData.lat}
              onChange={handleChange}
              step="any"
              placeholder="0.000000"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Longitude</label>
            <input
              type="number"
              name="long"
              value={formData.long}
              onChange={handleChange}
              step="any"
              placeholder="0.000000"
            />
          </div>

          <button 
            type="button" 
            onClick={handleAutoLocation}
            className={styles.locationButton}
          >
            📍 Auto-locate
          </button>
        </div>

        <div className={styles.formGroup}>
          <label>Author</label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleChange}
            placeholder="Your investigator ID"
          />
        </div>

        {status && (
          <div className={`${styles.status} ${status.includes('Error') ? styles.error : styles.success}`}>
            {status}
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" onClick={clearForm} className={styles.clearButton}>
            Clear Form
          </button>
          <button type="submit" className={styles.submitButton}>
            {onlineStatus && connected ? 'Submit to Blockchain' : 'Save Offline'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IntelReportSubmission;
