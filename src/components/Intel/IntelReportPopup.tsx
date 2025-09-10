import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { intelReportService } from '../../services/intel/IntelReportService';
import type { CreateIntelReportInput } from '../../types/intel/IntelReportUI';
import { IntelReportFormData } from '../HUD/Corners/CyberCommandBottomRight/IntelReportFormData';
import MapSelectorPopup from '../HUD/Corners/CyberCommandBottomRight/MapSelectorPopup';
import { useIntelDashboard } from '../../hooks/useIntelDashboard';
import styles from './IntelReportPopup.module.css';

interface IntelReportPopupProps {
  onClose: () => void;
}

const IntelReportPopup: React.FC<IntelReportPopupProps> = ({ onClose }) => {
  const { connected: _connected, publicKey } = useWallet();
  const { openIntelDashboard } = useIntelDashboard();
  const [status, setStatus] = useState('');
  const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);
  
  const [formData, setFormData] = useState<IntelReportFormData>({
    title: '',
    subtitle: '',
    content: '',
    tags: '',
    categories: '',
    lat: '',
    long: '',
    date: new Date().toISOString().split('T')[0],
    author: '',
    metaDescription: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('Creating Intel Report...');
    
    try {
      // Map form fields to centralized CreateIntelReportInput
      const input: CreateIntelReportInput = {
        title: formData.title,
        content: formData.content,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        category: (formData.categories.split(',').map(c => c.trim()).filter(Boolean)[0]) || 'OSINT',
        classification: 'UNCLASSIFIED',
        status: 'DRAFT',
        latitude: parseFloat(formData.lat) || 0,
        longitude: parseFloat(formData.long) || 0,
        summary: formData.subtitle || formData.metaDescription || '',
        conclusions: [],
        recommendations: [],
        methodology: [],
  confidence: 0.5,
        priority: 'ROUTINE',
        targetAudience: [],
        sourceIntelIds: []
      };

      const author = formData.author || publicKey?.toString() || 'Anonymous';
      const created = await intelReportService.createReport(input, author);
      
      setStatus(`Report created: ${created.id}`);
      console.log('Intel Report created via centralized service:', created);
      
      // Reset form and close popup after success
      setTimeout(() => {
        setStatus('');
        onClose();
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting intel report:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAutoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          lat: position.coords.latitude.toString(),
          long: position.coords.longitude.toString(),
        }));
      });
    }
  };

  const handleMapSelect = (lat: string, long: string) => {
    setFormData(prev => ({ ...prev, lat, long }));
  };

  return (
    <div className={styles.popup}>
      <div className={styles.popupContent}>
        <div className={styles.popupLayout}>
          {/* Left: Intel Report Form */}
          <form onSubmit={handleSubmit} className={styles.formSection}>
            <div className={styles.headerRow}>
              <h2 className={styles.header}>Create Intelligence Report</h2>
              <button 
                type="button"
                onClick={() => openIntelDashboard({ filterMode: 'ALL' })}
                className={styles.dashboardButton}
                title="Open Intel Dashboard"
              >
                📊 Intel Dashboard
              </button>
            </div>
            
            <div className={styles.formFields}>
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={formData.title}
                onChange={handleChange}
                required
                autoComplete="off"
                className={styles.input}
              />
              
              <input
                type="text"
                name="subtitle"
                placeholder="Subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                autoComplete="off"
                className={styles.input}
              />
              
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                autoComplete="off"
                className={styles.input}
              />
              
              <input
                type="text"
                name="author"
                placeholder="Author"
                value={formData.author}
                onChange={handleChange}
                required
                autoComplete="off"
                className={styles.input}
              />
              
              <textarea
                name="content"
                placeholder="Content"
                value={formData.content}
                onChange={handleChange}
                required
                autoComplete="off"
                className={styles.textarea}
                rows={4}
              />
              
              <input
                type="text"
                name="tags"
                placeholder="Tags (comma-separated)"
                value={formData.tags}
                onChange={handleChange}
                autoComplete="off"
                className={styles.input}
              />
              
              <input
                type="text"
                name="categories"
                placeholder="Categories (comma-separated)"
                value={formData.categories}
                onChange={handleChange}
                autoComplete="off"
                className={styles.input}
              />
              
              <textarea
                name="metaDescription"
                placeholder="Meta Description"
                value={formData.metaDescription}
                onChange={handleChange}
                autoComplete="off"
                className={styles.textarea}
                rows={2}
              />
              
              {/* Location Controls */}
              <div className={styles.locationControls}>
                <input
                  type="text"
                  name="lat"
                  placeholder="Latitude"
                  value={formData.lat}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  className={styles.coordinateInput}
                />
                
                <input
                  type="text"
                  name="long"
                  placeholder="Longitude"
                  value={formData.long}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  className={styles.coordinateInput}
                />
                
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    onChange={handleAutoLocation} 
                    className={styles.checkbox}
                  />
                  <span>Use my location</span>
                </label>
                
                <button 
                  type="button" 
                  onClick={() => setIsMapPopupOpen(true)}
                  className={styles.mapButton}
                >
                  🗺️ Map
                </button>
              </div>
              
              <div className={styles.formActions}>
                <button type="submit" className={styles.submitButton}>
                  Submit Report
                </button>
                <button 
                  type="button" 
                  onClick={onClose}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
          {status && (
            <div className={styles.statusDisplay}>
              {status}
            </div>
          )}
        </div>
      </div>
      
      {/* Map Selector Popup */}
      <MapSelectorPopup
        isOpen={isMapPopupOpen}
        lat={formData.lat}
        long={formData.long}
        onSelect={handleMapSelect}
        onClose={() => setIsMapPopupOpen(false)}
      />
    </div>
  );
};

export default IntelReportPopup;
