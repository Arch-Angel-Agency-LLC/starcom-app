// Evidence Timeline Component - Modern Timeline View for Evidence Items
// Part of the Collaborative Operations Bridge MVP

import React, { useState, useMemo } from 'react';
import { Evidence, EvidenceType, EvidenceFilters } from '../../interfaces/Investigation';
import { useMemoryAwarePagination } from '../../hooks/useMemoryAware';
import styles from './EvidenceTimeline.module.css';

interface EvidenceTimelineProps {
  evidence: Evidence[];
  investigationId?: string;
  onEvidenceSelect?: (evidence: Evidence) => void;
  selectedEvidenceId?: string;
  onCreateEvidence?: () => void;
  readOnly?: boolean;
}

type TimelineGrouping = 'day' | 'week' | 'month';
type TimelineSorting = 'newest' | 'oldest' | 'type';

const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({
  evidence,
  investigationId,
  onEvidenceSelect,
  selectedEvidenceId,
  onCreateEvidence,
  readOnly = false,
}) => {
  // Memory-aware pagination for large evidence sets
  const { currentPage, pageSize, canProceed, goToPage, nextPage, previousPage } = 
    useMemoryAwarePagination(15, 50); // Smaller default for evidence items

  const [filters, setFilters] = useState<EvidenceFilters>({
    investigation_id: investigationId,
  });
  const [grouping, setGrouping] = useState<TimelineGrouping>('day');
  const [sorting, setSorting] = useState<TimelineSorting>('newest');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and group evidence
  const processedEvidence = useMemo(() => {
    const filtered = evidence.filter(item => {
      // Search filter
      if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !item.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filters.evidence_type && filters.evidence_type.length > 0) {
        if (!filters.evidence_type.includes(item.evidence_type)) {
          return false;
        }
      }

      // Investigation filter
      if (filters.investigation_id && item.investigation_id !== filters.investigation_id) {
        return false;
      }

      return true;
    });

    // Sort evidence
    filtered.sort((a, b) => {
      const dateA = new Date(a.collected_at).getTime();
      const dateB = new Date(b.collected_at).getTime();
      
      switch (sorting) {
        case 'newest':
          return dateB - dateA;
        case 'oldest':
          return dateA - dateB;
        case 'type':
          return a.evidence_type.localeCompare(b.evidence_type);
        default:
          return dateB - dateA;
      }
    });

    // Group by time period
    const groups: { [key: string]: Evidence[] } = {};
    
    filtered.forEach(item => {
      const date = new Date(item.collected_at);
      let groupKey: string;

      switch (grouping) {
        case 'day':
          groupKey = date.toDateString();
          break;
        case 'week': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          groupKey = `Week of ${weekStart.toDateString()}`;
          break;
        }
        case 'month':
          groupKey = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
          break;
        default:
          groupKey = date.toDateString();
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  }, [evidence, filters, searchTerm, grouping, sorting]);

  // Create paginated evidence list for memory management
  const paginatedEvidence = useMemo(() => {
    // Flatten all evidence items from groups
    const allEvidence = Object.values(processedEvidence).flat();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    // Apply pagination
    const paginatedItems = allEvidence.slice(startIndex, endIndex);
    
    // Re-group the paginated items
    const paginatedGroups: { [key: string]: Evidence[] } = {};
    
    paginatedItems.forEach(item => {
      const date = new Date(item.collected_at);
      let groupKey: string;

      switch (grouping) {
        case 'day':
          groupKey = date.toDateString();
          break;
        case 'week': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          groupKey = `Week of ${weekStart.toDateString()}`;
          break;
        }
        case 'month':
          groupKey = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
          break;
        default:
          groupKey = date.toDateString();
      }

      if (!paginatedGroups[groupKey]) {
        paginatedGroups[groupKey] = [];
      }
      paginatedGroups[groupKey].push(item);
    });

    return {
      groups: paginatedGroups,
      totalItems: allEvidence.length,
      currentItems: paginatedItems.length
    };
  }, [processedEvidence, currentPage, pageSize, grouping]);

  const getEvidenceIcon = (type: EvidenceType): string => {
    const icons = {
      document: '📄',
      image: '🖼️',
      video: '🎥',
      audio: '🎵',
      network_log: '🌐',
      system_log: '💻',
      screenshot: '📸',
      url: '🔗',
      other: '📋',
    };
    return icons[type] || '📋';
  };

  const getEvidenceTypeColor = (type: EvidenceType): string => {
    const colors = {
      document: '#4285f4',
      image: '#ea4335',
      video: '#34a853',
      audio: '#fbbc04',
      network_log: '#ff6d01',
      system_log: '#9c27b0',
      screenshot: '#00bcd4',
      url: '#607d8b',
      other: '#795548',
    };
    return colors[type] || '#607d8b';
  };

  const handleEvidenceClick = (evidence: Evidence) => {
    if (onEvidenceSelect) {
      onEvidenceSelect(evidence);
    }
  };

  const handleFilterChange = (filterType: keyof EvidenceFilters, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  return (
    <div className={styles.timeline}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>🔍 Evidence Timeline</h2>
          <span className={styles.count}>
            {evidence.length} items
          </span>
        </div>
        
        <div className={styles.headerControls}>
          {!readOnly && onCreateEvidence && (
            <button
              className={styles.addButton}
              onClick={onCreateEvidence}
            >
              ➕ Add Evidence
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search evidence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterControls}>
          <select
            value={grouping}
            onChange={(e) => setGrouping(e.target.value as TimelineGrouping)}
            className={styles.select}
          >
            <option value="day">Group by Day</option>
            <option value="week">Group by Week</option>
            <option value="month">Group by Month</option>
          </select>

          <select
            value={sorting}
            onChange={(e) => setSorting(e.target.value as TimelineSorting)}
            className={styles.select}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="type">By Type</option>
          </select>

          <select
            onChange={(e) => {
              const types = e.target.value ? [e.target.value as EvidenceType] : undefined;
              handleFilterChange('evidence_type', types);
            }}
            className={styles.select}
          >
            <option value="">All Types</option>
            <option value="document">Documents</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="network_log">Network Logs</option>
            <option value="system_log">System Logs</option>
            <option value="screenshot">Screenshots</option>
            <option value="url">URLs</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Timeline Content */}
      <div className={styles.timelineContent}>
        {Object.keys(processedEvidence).length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔍</div>
            <h3>No evidence found</h3>
            <p>
              {searchTerm || filters.evidence_type?.length 
                ? 'Try adjusting your filters or search terms.'
                : 'No evidence has been collected yet.'
              }
            </p>
          </div>
        ) : (
          Object.entries(paginatedEvidence.groups).map(([groupKey, items]) => (
            <div key={groupKey} className={styles.timelineGroup}>
              <div className={styles.groupHeader}>
                <h3>{groupKey}</h3>
                <span className={styles.groupCount}>{items.length} items</span>
              </div>

              <div className={styles.evidenceList}>
                {items.map((evidence, index) => (
                  <div
                    key={evidence.id}
                    className={`${styles.evidenceItem} ${
                      selectedEvidenceId === evidence.id ? styles.selected : ''
                    }`}
                    onClick={() => handleEvidenceClick(evidence)}
                  >
                    <div className={styles.timelineMarker}>
                      <div 
                        className={styles.markerDot}
                        style={{ backgroundColor: getEvidenceTypeColor(evidence.evidence_type) }}
                      />
                      {index < items.length - 1 && <div className={styles.timelineLine} />}
                    </div>

                    <div className={styles.evidenceContent}>
                      <div className={styles.evidenceHeader}>
                        <span className={styles.evidenceIcon}>
                          {getEvidenceIcon(evidence.evidence_type)}
                        </span>
                        <h4 className={styles.evidenceTitle}>{evidence.title}</h4>
                        <span 
                          className={styles.evidenceType}
                          style={{ color: getEvidenceTypeColor(evidence.evidence_type) }}
                        >
                          {evidence.evidence_type.replace('_', ' ')}
                        </span>
                      </div>

                      <p className={styles.evidenceDescription}>
                        {evidence.description}
                      </p>

                      <div className={styles.evidenceMeta}>
                        <span className={styles.collector}>
                          👤 {evidence.collected_by}
                        </span>
                        <span className={styles.collectionTime}>
                          🕐 {new Date(evidence.collected_at).toLocaleString()}
                        </span>
                        {evidence.source_url && (
                          <span className={styles.source}>
                            🔗 Source
                          </span>
                        )}
                        {evidence.file_path && (
                          <span className={styles.attachment}>
                            📎 Attachment
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Memory-aware pagination controls for evidence */}
      {paginatedEvidence.totalItems > pageSize && (
        <div className={styles.paginationControls}>
          <div className={styles.paginationInfo}>
            <span>
              Showing {paginatedEvidence.currentItems} of {paginatedEvidence.totalItems} evidence items
              (Page {currentPage} of {Math.ceil(paginatedEvidence.totalItems / pageSize)})
            </span>
            {!canProceed && (
              <span className={styles.memoryWarning}>
                ⚠️ Memory usage high - pagination optimized
              </span>
            )}
          </div>
          <div className={styles.paginationButtons}>
            <button
              className={styles.paginationButton}
              onClick={() => goToPage(1)}
              disabled={currentPage === 1 || !canProceed}
            >
              ⏮️ First
            </button>
            <button
              className={styles.paginationButton}
              onClick={previousPage}
              disabled={currentPage === 1 || !canProceed}
            >
              ⬅️ Previous
            </button>
            <button
              className={styles.paginationButton}
              onClick={nextPage}
              disabled={currentPage === Math.ceil(paginatedEvidence.totalItems / pageSize) || !canProceed}
            >
              Next ➡️
            </button>
            <button
              className={styles.paginationButton}
              onClick={() => goToPage(Math.ceil(paginatedEvidence.totalItems / pageSize))}
              disabled={currentPage === Math.ceil(paginatedEvidence.totalItems / pageSize) || !canProceed}
            >
              Last ⏭️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceTimeline;
