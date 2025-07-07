import React, { useState, useEffect } from 'react';
import { Folder, Star, Clock, Users, Search, ChevronDown, ChevronUp, Plus, File } from 'lucide-react';
import styles from './InvestigationSelector.module.css';
import { Investigation } from '../types/osint';

interface InvestigationSelectorProps {
  activeInvestigation: Investigation | null;
  onSelectInvestigation: (investigation: Investigation) => void;
  onCreateInvestigation: () => void;
  className?: string;
}

/**
 * InvestigationSelector - Investigation management dropdown
 * 
 * Allows users to select, manage, and create investigations.
 * Each investigation acts as a container for OSINT operations.
 */
const InvestigationSelector: React.FC<InvestigationSelectorProps> = ({
  activeInvestigation,
  onSelectInvestigation,
  onCreateInvestigation,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [filter, setFilter] = useState('');

  // Load investigations
  useEffect(() => {
    // In a real implementation, this would come from a data service
    const mockInvestigations: Investigation[] = [
      {
        id: 'inv-001',
        name: 'Operation Bluebird',
        description: 'Investigation into suspicious financial activity',
        created: new Date('2025-06-15T10:30:00'),
        modified: new Date('2025-07-01T14:22:00'),
        tags: ['financial', 'priority'],
        shared: ['agent.smith', 'dana.scully'],
        status: 'active'
      },
      {
        id: 'inv-002',
        name: 'Project Sunflower',
        description: 'Social media presence analysis',
        created: new Date('2025-06-20T08:15:00'),
        modified: new Date('2025-06-28T11:45:00'),
        tags: ['social-media', 'personal'],
        shared: [],
        status: 'active'
      },
      {
        id: 'inv-003',
        name: 'Case #XF-2207',
        description: 'Domain infrastructure mapping',
        created: new Date('2025-05-10T16:20:00'),
        modified: new Date('2025-06-30T09:10:00'),
        tags: ['infrastructure', 'network'],
        shared: ['fox.mulder'],
        status: 'archived'
      },
      {
        id: 'inv-004',
        name: 'Cerberus Analysis',
        description: 'Cryptocurrency transaction tracking',
        created: new Date('2025-07-01T12:00:00'),
        modified: new Date('2025-07-03T15:30:00'),
        tags: ['crypto', 'blockchain', 'priority'],
        shared: [],
        status: 'active'
      }
    ];
    
    setInvestigations(mockInvestigations);
    
    // Set the first active investigation if none is selected
    if (!activeInvestigation && mockInvestigations.length > 0) {
      onSelectInvestigation(mockInvestigations[0]);
    }
  }, [activeInvestigation, onSelectInvestigation]);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const element = event.target as Element;
      if (!element.closest(`.${styles.container}`)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: '2-digit' 
      });
    }
  };

  // Filter investigations based on search
  const filteredInvestigations = investigations.filter(inv => 
    inv.name.toLowerCase().includes(filter.toLowerCase()) ||
    inv.description.toLowerCase().includes(filter.toLowerCase()) ||
    inv.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
  );

  // Get icon for investigation
  const getInvestigationIcon = (investigation: Investigation) => {
    if (investigation.tags.includes('priority')) {
      return <Star size={16} className={styles.priorityIcon} />;
    }
    return <File size={16} />;
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <button 
        className={styles.selector}
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Folder size={18} />
        <span className={styles.current}>
          {activeInvestigation ? activeInvestigation.name : 'Select Investigation'}
        </span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchContainer}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search investigations..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className={styles.list}>
            {filteredInvestigations.length > 0 ? (
              filteredInvestigations.map(investigation => (
                <div
                  key={investigation.id}
                  className={`${styles.investigation} ${activeInvestigation?.id === investigation.id ? styles.active : ''}`}
                  onClick={() => {
                    onSelectInvestigation(investigation);
                    setIsOpen(false);
                  }}
                >
                  <div className={styles.investigationHeader}>
                    {getInvestigationIcon(investigation)}
                    <span className={styles.name}>{investigation.name}</span>
                    {investigation.shared.length > 0 && (
                      <div className={styles.shared}>
                        <Users size={14} />
                        <span>{investigation.shared.length}</span>
                      </div>
                    )}
                  </div>
                  <p className={styles.description}>{investigation.description}</p>
                  <div className={styles.meta}>
                    <span className={styles.date}>
                      <Clock size={14} />
                      {formatDate(investigation.modified)}
                    </span>
                    <div className={styles.tags}>
                      {investigation.tags.map(tag => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.empty}>
                <Search size={24} />
                <p>No investigations found</p>
              </div>
            )}
          </div>
          
          <button 
            className={styles.createButton}
            onClick={() => {
              onCreateInvestigation();
              setIsOpen(false);
            }}
          >
            <Plus size={16} />
            <span>New Investigation</span>
          </button>
        </div>
      )}
    </div>
  );
};

export { InvestigationSelector };
