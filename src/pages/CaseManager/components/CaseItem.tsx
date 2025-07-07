/**
 * CaseItem Component
 * 
 * Displays a single case in the list view.
 */

import React from 'react';
import { format, parseISO } from 'date-fns';
import { AlertCircle, Clock, Tag, User } from 'lucide-react';
import { Case, CasePriority, CaseStatus, ClassificationLevel } from '../types/cases';
import styles from './CaseItem.module.css';

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

interface CaseItemProps {
  caseData: Case;
  isSelected: boolean;
  onClick: () => void;
}

const CaseItem: React.FC<CaseItemProps> = ({ 
  caseData, 
  isSelected, 
  onClick 
}) => {
  const createdDate = format(parseISO(caseData.created), 'MMM d, yyyy');
  const updatedDate = format(parseISO(caseData.updated), 'MMM d, yyyy HH:mm');
  const statusColor = statusColorMap[caseData.status];
  const priorityColor = priorityColorMap[caseData.priority];
  const classificationColor = classificationColorMap[caseData.classification];
  
  return (
    <div 
      className={`${styles.caseItem} ${isSelected ? styles.selected : ''}`} 
      onClick={onClick}
    >
      <div className={styles.header}>
        <div className={styles.title}>
          <span 
            className={styles.priority} 
            style={{ backgroundColor: priorityColor }}
            title={`Priority: ${caseData.priority}`}
          >
            <AlertCircle size={12} />
          </span>
          {caseData.title}
        </div>
        <div 
          className={styles.status}
          style={{ backgroundColor: statusColor }}
        >
          {caseData.status}
        </div>
      </div>
      
      <div className={styles.description}>{caseData.description}</div>
      
      <div className={styles.meta}>
        <div className={styles.dates}>
          <div className={styles.createdDate} title="Created">
            <Clock size={12} />
            {createdDate}
          </div>
          <div className={styles.updatedDate} title="Last updated">
            {updatedDate}
          </div>
        </div>
        
        {caseData.assignedTo && caseData.assignedTo.length > 0 && (
          <div className={styles.assigned} title="Assigned to">
            <User size={12} />
            {caseData.assignedTo.length} assigned
          </div>
        )}
        
        <div 
          className={styles.classification}
          style={{ color: classificationColor }}
          title="Classification level"
        >
          {caseData.classification}
        </div>
      </div>
      
      {caseData.tags && caseData.tags.length > 0 && (
        <div className={styles.tags}>
          <Tag size={12} />
          {caseData.tags.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaseItem;
