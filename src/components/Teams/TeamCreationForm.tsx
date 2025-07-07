import React, { useState } from 'react';
import styles from './TeamCreationForm.module.css';

interface TeamCreationData {
  name: string;
  description: string;
  collaborationMode: 'OPEN' | 'INVITE_ONLY' | 'ENTERPRISE';
  maxMembers: number;
}

interface TeamCreationFormProps {
  onSubmit: (teamData: TeamCreationData) => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  description?: string;
  maxMembers?: string;
}

const TeamCreationForm: React.FC<TeamCreationFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<TeamCreationData>({
    name: '',
    description: '',
    collaborationMode: 'INVITE_ONLY',
    maxMembers: 20
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Team name must be at least 3 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Team name must not exceed 100 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must not exceed 500 characters';
    }

    if (formData.maxMembers < 2) {
      newErrors.maxMembers = 'Team must allow at least 2 members';
    } else if (formData.maxMembers > 1000) {
      newErrors.maxMembers = 'Maximum members cannot exceed 1000';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to create team:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof TeamCreationData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Create New Team</h2>
        <p className={styles.subtitle}>Set up a new cyber investigation team</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Team Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`${styles.input} ${errors.name ? styles.error : ''}`}
            placeholder="e.g., Team Alpha, SOC Team 1"
          />
          {errors.name && <span className={styles.errorText}>{errors.name}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className={`${styles.textarea} ${errors.description ? styles.error : ''}`}
            placeholder="Describe the team's purpose and focus area"
            rows={3}
          />
          {errors.description && <span className={styles.errorText}>{errors.description}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Collaboration Mode</label>
          <select
            value={formData.collaborationMode}
            onChange={(e) => handleChange('collaborationMode', e.target.value)}
            className={styles.select}
          >
            <option value="OPEN">Open - Anyone can join with invite link</option>
            <option value="INVITE_ONLY">Invite Only - Manual approval required</option>
            <option value="ENTERPRISE">Enterprise - Requires RelayNode and DID verification</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Maximum Members</label>
          <input
            type="number"
            value={formData.maxMembers}
            onChange={(e) => handleChange('maxMembers', parseInt(e.target.value) || 20)}
            className={`${styles.input} ${errors.maxMembers ? styles.error : ''}`}
            min="2"
            max="1000"
          />
          {errors.maxMembers && <span className={styles.errorText}>{errors.maxMembers}</span>}
        </div>

        <div className={styles.actions}>
          <button 
            type="button" 
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting || !formData.name.trim() || !formData.description.trim()}
          >
            {isSubmitting ? 'Creating Team...' : 'Create Team'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeamCreationForm;