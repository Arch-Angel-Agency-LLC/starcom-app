/**
 * CaseDetails Component
 * 
 * Displays detailed information about a selected case.
 */

import React from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, Info, Tag, Map, Link, User, Shield, FileText, AlertCircle, MessageSquare } from 'lucide-react';
import { Case, CaseStatus, CasePriority, ClassificationLevel } from '../types/cases';
import styles from './CaseDetails.module.css';

// Status color mapping
const statusColorMap: Record<CaseStatus, string> = {
  'active': '#41c7e4',
  'pending': '#e4c641',
  'closed': '#9ea7b8',
  'archived': '#6e7f9e'
};

// Priority color mapping
const priorityColorMap: Record<CasePriority, string> = {
  'low': '#72b879',
  'medium': '#e4c641',
  'high': '#e49a41',
  'critical': '#e44141'
};

// Classification color mapping
const classificationColorMap: Record<ClassificationLevel, string> = {
  'unclassified': '#72b879',
  'restricted': '#e4c641',
  'confidential': '#e49a41',
  'secret': '#e44141',
  'top-secret': '#9c41e4'
};

interface CaseDetailsProps {
  caseData: Case;
  onClose: () => void;
}

const CaseDetails: React.FC<CaseDetailsProps> = ({ 
  caseData, 
  onClose 
}) => {
  if (!caseData) return null;
  
  const createdDate = format(parseISO(caseData.created), 'MMMM d, yyyy HH:mm:ss');
  const updatedDate = format(parseISO(caseData.updated), 'MMMM d, yyyy HH:mm:ss');
  const statusColor = statusColorMap[caseData.status];
  const priorityColor = priorityColorMap[caseData.priority];
  const classificationColor = classificationColorMap[caseData.classification];
  
  return (
    <div className={styles.detailsContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>{caseData.title}</h3>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>
      
      <div className={styles.content}>
        <div className={styles.metadataBar}>
          <div 
            className={styles.status}
            style={{ backgroundColor: statusColor }}
          >
            {caseData.status}
          </div>
          
          <div 
            className={styles.priority}
            style={{ backgroundColor: priorityColor }}
          >
            <AlertCircle size={12} />
            {caseData.priority}
          </div>
          
          <div 
            className={styles.classification}
            style={{ backgroundColor: classificationColor }}
          >
            <Shield size={12} />
            {caseData.classification}
          </div>
        </div>
        
        <div className={styles.infoSection}>
          <div className={styles.sectionTitle}>
            <Info size={16} />
            Description
          </div>
          <div className={styles.sectionContent}>
            <p className={styles.descriptionText}>{caseData.description}</p>
          </div>
        </div>
        
        <div className={styles.infoSection}>
          <div className={styles.sectionTitle}>
            <Clock size={16} />
            Timeline
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Created:</span>
              <span className={styles.metaValue}>{createdDate}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Updated:</span>
              <span className={styles.metaValue}>{updatedDate}</span>
            </div>
          </div>
        </div>
        
        {caseData.assignedTo && caseData.assignedTo.length > 0 && (
          <div className={styles.infoSection}>
            <div className={styles.sectionTitle}>
              <User size={16} />
              Assigned To
            </div>
            <div className={styles.sectionContent}>
              {caseData.assignedTo.map(userId => (
                <div key={userId} className={styles.metaItem}>
                  <span className={styles.metaValue}>{userId}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {caseData.tags && caseData.tags.length > 0 && (
          <div className={styles.infoSection}>
            <div className={styles.sectionTitle}>
              <Tag size={16} />
              Tags
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.tagsContainer}>
                {caseData.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {caseData.relatedCases && caseData.relatedCases.length > 0 && (
          <div className={styles.infoSection}>
            <div className={styles.sectionTitle}>
              <Link size={16} />
              Related Cases
            </div>
            <div className={styles.sectionContent}>
              {caseData.relatedCases.map(caseId => (
                <div key={caseId} className={styles.metaItem}>
                  <span className={styles.metaValue}>{caseId}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {caseData.evidenceItems && caseData.evidenceItems.length > 0 && (
          <div className={styles.infoSection}>
            <div className={styles.sectionTitle}>
              <FileText size={16} />
              Evidence Items
            </div>
            <div className={styles.sectionContent}>
              {caseData.evidenceItems.map(itemId => (
                <div key={itemId} className={styles.metaItem}>
                  <span className={styles.metaValue}>{itemId}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {caseData.notes && caseData.notes.length > 0 && (
          <div className={styles.infoSection}>
            <div className={styles.sectionTitle}>
              <MessageSquare size={16} />
              Case Notes
            </div>
            <div className={styles.sectionContent}>
              {caseData.notes.map(note => (
                <div key={note.id} className={styles.metaItem}>
                  <div>
                    <div><strong>{note.author}</strong> {format(parseISO(note.created), 'MMM d, yyyy HH:mm')}</div>
                    <div className={styles.metaValue}>{note.text}</div>
                    {note.isPrivate && <div><em>Private</em></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {caseData.location && (
          <div className={styles.infoSection}>
            <div className={styles.sectionTitle}>
              <Map size={16} />
              Location
            </div>
            <div className={styles.sectionContent}>
              {caseData.location.name && (
                <div className={styles.metaItem}>{caseData.location.name}</div>
              )}
              {caseData.location.coordinates && (
                <div className={styles.metaItem}>
                  {caseData.location.coordinates[1].toFixed(6)}, {caseData.location.coordinates[0].toFixed(6)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.actionButtons}>
        <button className={`${styles.actionButton} ${styles.deleteButton}`}>
          Delete Case
        </button>
        <button className={`${styles.actionButton} ${styles.editButton}`}>
          Edit Case
        </button>
      </div>
    </div>
  );
};

export default CaseDetails;
