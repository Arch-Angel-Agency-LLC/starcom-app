import React, { useState } from 'react'
import { DecentralizedIntelReport } from '../../lib/gun-db'
import { getIPFSClient } from '../../lib/ipfs-client'
import styles from './DecentralizedIntelForm.module.css'

interface DecentralizedIntelFormProps {
  teamId?: string
  onSubmit: (report: Omit<DecentralizedIntelReport, 'id' | 'author' | 'timestamp' | 'signature' | 'reviews'>) => Promise<void>
  onClose: () => void
}

export default function DecentralizedIntelForm({
  teamId,
  onSubmit,
  onClose
}: DecentralizedIntelFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    classification: 'UNCLASSIFIED' as DecentralizedIntelReport['classification'],
    tags: [] as string[],
    evidence: [] as { ipfsHash: string; description: string }[],
    crossReferences: [] as string[],
    location: undefined as { lat: number; lng: number; name?: string } | undefined
  })
  
  const [currentTag, setCurrentTag] = useState('')
  const [currentRef, setCurrentRef] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [evidenceDescription, setEvidenceDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    } else if (formData.content.length < 20) {
      newErrors.content = 'Content must be at least 20 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Failed to submit intel report:', error)
      setErrors({ submit: 'Failed to submit report. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add a tag
  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }))
      setCurrentTag('')
    }
  }

  // Remove a tag
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  // Add a cross-reference
  const addCrossReference = () => {
    if (currentRef.trim() && !formData.crossReferences.includes(currentRef.trim())) {
      setFormData(prev => ({
        ...prev,
        crossReferences: [...prev.crossReferences, currentRef.trim()]
      }))
      setCurrentRef('')
    }
  }

  // Remove a cross-reference
  const removeCrossReference = (ref: string) => {
    setFormData(prev => ({
      ...prev,
      crossReferences: prev.crossReferences.filter(r => r !== ref)
    }))
  }

  // Upload evidence to IPFS
  const uploadEvidence = async () => {
    if (!evidenceFile || !evidenceDescription) return
    
    setIsUploading(true)
    setUploadProgress(10)
    
    try {
      const ipfs = await getIPFSClient()
      setUploadProgress(30)
      
      const result = await ipfs.add(evidenceFile)
      setUploadProgress(90)
      
      const cid = result.cid.toString()
      
      setFormData(prev => ({
        ...prev,
        evidence: [...prev.evidence, {
          ipfsHash: cid,
          description: evidenceDescription
        }]
      }))
      
      setEvidenceFile(null)
      setEvidenceDescription('')
      setUploadProgress(100)
    } catch (error) {
      console.error('Failed to upload evidence:', error)
      setErrors({ evidence: 'Failed to upload evidence. Please try again.' })
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  // Remove evidence
  const removeEvidence = (ipfsHash: string) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter(e => e.ipfsHash !== ipfsHash)
    }))
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <h2 className={styles.title}>Submit Intel Report</h2>
          <p className={styles.subtitle}>
            {teamId ? 'Share with your team' : 'Share with the global network'}
          </p>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Title */}
          <div className={styles.field}>
            <label className={styles.label}>Report Title*</label>
            <input
              type="text"
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a descriptive title for your intel"
            />
            {errors.title && <span className={styles.errorText}>{errors.title}</span>}
          </div>

          {/* Content */}
          <div className={styles.field}>
            <label className={styles.label}>Report Content*</label>
            <textarea
              className={`${styles.textarea} ${errors.content ? styles.inputError : ''}`}
              value={formData.content}
              onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Provide detailed intelligence information..."
              rows={6}
            />
            {errors.content && <span className={styles.errorText}>{errors.content}</span>}
          </div>

          {/* Classification */}
          <div className={styles.field}>
            <label className={styles.label}>Classification</label>
            <select
              className={styles.select}
              value={formData.classification}
              onChange={e => setFormData(prev => ({ 
                ...prev, 
                classification: e.target.value as DecentralizedIntelReport['classification'] 
              }))}
            >
              <option value="UNCLASSIFIED">UNCLASSIFIED</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              <option value="SECRET">SECRET</option>
              <option value="TOP_SECRET">TOP SECRET</option>
            </select>
          </div>

          {/* Tags */}
          <div className={styles.field}>
            <label className={styles.label}>Tags</label>
            <div className={styles.tagInput}>
              <input
                type="text"
                className={styles.input}
                value={currentTag}
                onChange={e => setCurrentTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button 
                type="button" 
                className={styles.addButton}
                onClick={addTag}
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className={styles.tagList}>
                {formData.tags.map(tag => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button 
                      type="button" 
                      className={styles.removeTag}
                      onClick={() => removeTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Evidence Upload */}
          <div className={styles.field}>
            <label className={styles.label}>Evidence (IPFS)</label>
            <div className={styles.evidenceUpload}>
              <input
                type="file"
                id="evidence-file"
                className={styles.fileInput}
                onChange={e => setEvidenceFile(e.target.files?.[0] || null)}
              />
              <input
                type="text"
                className={styles.input}
                value={evidenceDescription}
                onChange={e => setEvidenceDescription(e.target.value)}
                placeholder="Evidence description..."
              />
              <button
                type="button"
                className={styles.uploadButton}
                onClick={uploadEvidence}
                disabled={isUploading || !evidenceFile || !evidenceDescription}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
            
            {uploadProgress > 0 && (
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            
            {formData.evidence.length > 0 && (
              <div className={styles.evidenceList}>
                <h4>Attached Evidence:</h4>
                {formData.evidence.map(ev => (
                  <div key={ev.ipfsHash} className={styles.evidenceItem}>
                    <span className={styles.evidenceDesc}>{ev.description}</span>
                    <span className={styles.evidenceHash}>
                      IPFS: {ev.ipfsHash.slice(0, 10)}...{ev.ipfsHash.slice(-4)}
                    </span>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removeEvidence(ev.ipfsHash)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cross References */}
          <div className={styles.field}>
            <label className={styles.label}>Cross References</label>
            <div className={styles.refInput}>
              <input
                type="text"
                className={styles.input}
                value={currentRef}
                onChange={e => setCurrentRef(e.target.value)}
                placeholder="Enter report ID to cross-reference..."
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addCrossReference())}
              />
              <button 
                type="button" 
                className={styles.addButton}
                onClick={addCrossReference}
              >
                Add
              </button>
            </div>
            {formData.crossReferences.length > 0 && (
              <div className={styles.refList}>
                {formData.crossReferences.map(ref => (
                  <span key={ref} className={styles.ref}>
                    {ref.slice(0, 8)}...{ref.slice(-4)}
                    <button 
                      type="button" 
                      className={styles.removeRef}
                      onClick={() => removeCrossReference(ref)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Intelligence'}
            </button>
          </div>
          
          {errors.submit && (
            <div className={styles.submitError}>
              {errors.submit}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

// AI-NOTE: This component provides a form for submitting decentralized intel reports
// - Uses IPFS for evidence storage
// - Gun.js for persistence (handled by parent through useDecentralizedIntel hook)
// - No server dependencies
// - Fully decentralized
