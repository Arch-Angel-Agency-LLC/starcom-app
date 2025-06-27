// Create Investigation Modal Component - Modern Form Modal
// Part of the Collaborative Operations Bridge MVP

import React, { useState } from 'react';
import { 
  CreateInvestigationRequest, 
  InvestigationPriority 
} from '../../interfaces/Investigation';
import styles from './CreateInvestigationModal.module.css';

interface CreateInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInvestigationRequest) => Promise<void>;
  teamId: string;
  isLoading?: boolean;
}

const CreateInvestigationModal: React.FC<CreateInvestigationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teamId,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateInvestigationRequest>({
    title: '',
    description: '',
    priority: 'medium',
    team_id: teamId,
    metadata: {},
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Failed to create investigation:', error);
      setErrors({ submit: 'Failed to create investigation. Please try again.' });
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      team_id: teamId,
      metadata: {},
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: keyof CreateInvestigationRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const getPriorityColor = (priority: InvestigationPriority): string => {
    const colors = {
      low: '#00d2d3',
      medium: '#ffa502',
      high: '#ff6b6b',
      critical: '#ff3838',
    };
    return colors[priority];
  };

  const getPriorityIcon = (priority: InvestigationPriority): string => {
    const icons = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    };
    return icons[priority];
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>🚀 Create New Investigation</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Title Field */}
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              Investigation Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`${styles.input} ${errors.title ? styles.error : ''}`}
              placeholder="Enter investigation title..."
              disabled={isLoading}
              maxLength={200}
            />
            {errors.title && (
              <span className={styles.errorText}>{errors.title}</span>
            )}
            <div className={styles.charCount}>
              {formData.title.length}/200
            </div>
          </div>

          {/* Description Field */}
          <div className={styles.field}>
            <label htmlFor="description" className={styles.label}>
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`${styles.textarea} ${errors.description ? styles.error : ''}`}
              placeholder="Provide a detailed description of the investigation..."
              disabled={isLoading}
              rows={6}
              maxLength={2000}
            />
            {errors.description && (
              <span className={styles.errorText}>{errors.description}</span>
            )}
            <div className={styles.charCount}>
              {formData.description.length}/2000
            </div>
          </div>

          {/* Priority Field */}
          <div className={styles.field}>
            <label htmlFor="priority" className={styles.label}>
              Priority Level
            </label>
            <div className={styles.priorityOptions}>
              {(['low', 'medium', 'high', 'critical'] as InvestigationPriority[]).map(priority => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => handleInputChange('priority', priority)}
                  className={`${styles.priorityButton} ${
                    formData.priority === priority ? styles.selected : ''
                  }`}
                  style={{
                    borderColor: formData.priority === priority 
                      ? getPriorityColor(priority)
                      : 'rgba(255, 255, 255, 0.2)',
                    backgroundColor: formData.priority === priority
                      ? `${getPriorityColor(priority)}20`
                      : 'transparent',
                  }}
                  disabled={isLoading}
                >
                  <span className={styles.priorityIcon}>
                    {getPriorityIcon(priority)}
                  </span>
                  <span className={styles.priorityLabel}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Team ID (Read-only) */}
          <div className={styles.field}>
            <label htmlFor="teamId" className={styles.label}>
              Team
            </label>
            <input
              id="teamId"
              type="text"
              value={formData.team_id}
              className={`${styles.input} ${styles.readonly}`}
              disabled
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className={styles.submitError}>
              ⚠️ {errors.submit}
            </div>
          )}

          {/* Form Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading || !formData.title.trim() || !formData.description.trim()}
            >
              {isLoading ? (
                <>
                  <div className={styles.spinner} />
                  Creating...
                </>
              ) : (
                <>
                  🚀 Create Investigation
                </>
              )}
            </button>
          </div>
        </form>

        {/* Instructions */}
        <div className={styles.instructions}>
          <h4>💡 Tips for Creating Investigations</h4>
          <ul>
            <li>Use clear, descriptive titles that summarize the focus</li>
            <li>Include relevant context and background in the description</li>
            <li>Set appropriate priority based on urgency and impact</li>
            <li>You can add tasks and evidence after creation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateInvestigationModal;
