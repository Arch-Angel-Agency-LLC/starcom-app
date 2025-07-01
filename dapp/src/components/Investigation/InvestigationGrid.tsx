// InvestigationGrid.tsx - Grid view for investigations
import React, { useState, useMemo } from 'react';
import { Investigation, InvestigationStatus, InvestigationPriority } from '../../interfaces/Investigation';
import { useInvestigation } from '../../hooks/useInvestigation';
import { useMemoryAwarePagination } from '../../hooks/useMemoryAware';
import styles from './InvestigationGrid.module.css';

interface InvestigationGridProps {
  investigations?: Investigation[];
  onSelect?: (investigation: Investigation) => void;
  selectedId?: string | null;
}

type SortField = 'title' | 'status' | 'priority' | 'created_at' | 'updated_at';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  status: InvestigationStatus | 'all';
  priority: InvestigationPriority | 'all';
  searchTerm: string;
}

const InvestigationGrid: React.FC<InvestigationGridProps> = ({
  investigations: propInvestigations,
  onSelect,
  selectedId,
}) => {
  const { state } = useInvestigation();
  
  // Use investigations from props or context
  const investigations = propInvestigations || state.investigations;
  
  // Memory-aware pagination
  const { currentPage, pageSize, canProceed, goToPage, nextPage, previousPage } = 
    useMemoryAwarePagination(20, 100); // Default 20, max 100 per page
  
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    priority: 'all',
    searchTerm: '',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter and sort investigations
  const filteredInvestigations = useMemo(() => {
    let filtered = [...investigations];

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(inv => inv.status === filters.status);
    }
    if (filters.priority !== 'all') {
      filtered = filtered.filter(inv => inv.priority === filters.priority);
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.title.toLowerCase().includes(term) ||
        inv.description.toLowerCase().includes(term)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'priority': {
          // Custom priority order
          const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
          aVal = priorityOrder[a.priority];
          bVal = priorityOrder[b.priority];
          break;
        }
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case 'updated_at':
        default:
          aVal = new Date(a.updated_at).getTime();
          bVal = new Date(b.updated_at).getTime();
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [investigations, filters, sortField, sortDirection]);

  // Apply pagination to filtered results
  const paginatedInvestigations = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredInvestigations.slice(startIndex, endIndex);
  }, [filteredInvestigations, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredInvestigations.length / pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleInvestigationClick = (investigation: Investigation) => {
    onSelect?.(investigation);
  };

  const getStatusIcon = (status: InvestigationStatus) => {
    switch (status) {
      case 'draft': return '📝';
      case 'active': return '🔍';
      case 'on_hold': return '⏸️';
      case 'completed': return '✅';
      case 'archived': return '📁';
      default: return '❓';
    }
  };

  const getPriorityIcon = (priority: InvestigationPriority) => {
    switch (priority) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className={styles.investigationGrid}>
      {/* Header Controls */}
      <div className={styles.gridHeader}>
        <div className={styles.gridTitle}>
          <h2>📁 Investigations ({filteredInvestigations.length})</h2>
          <button
            className={styles.createButton}
            onClick={() => setShowCreateModal(true)}
          >
            ➕ New Investigation
          </button>
        </div>

        {/* Filters and Search */}
        <div className={styles.gridControls}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search investigations..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filters}>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Sort Controls */}
        <div className={styles.sortControls}>
          <span>Sort by:</span>
          {[
            { field: 'title', label: 'Title' },
            { field: 'status', label: 'Status' },
            { field: 'priority', label: 'Priority' },
            { field: 'updated_at', label: 'Updated' },
            { field: 'created_at', label: 'Created' },
          ].map(({ field, label }) => (
            <button
              key={field}
              className={`${styles.sortButton} ${
                sortField === field ? styles.active : ''
              }`}
              onClick={() => handleSort(field as SortField)}
            >
              {label}
              {sortField === field && (
                <span className={styles.sortIcon}>
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Investigation Cards Grid */}
      <div className={styles.cardGrid}>
        {filteredInvestigations.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📁</div>
            <h3>No investigations found</h3>
            <p>
              {filters.searchTerm || filters.status !== 'all' || filters.priority !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Create your first investigation to get started.'}
            </p>
            <button
              className={styles.createButton}
              onClick={() => setShowCreateModal(true)}
            >
              ➕ Create Investigation
            </button>
          </div>
        ) : (
          paginatedInvestigations.map((investigation) => (
            <div
              key={investigation.id}
              className={`${styles.investigationCard} ${
                selectedId === investigation.id ? styles.selected : ''
              }`}
              onClick={() => handleInvestigationClick(investigation)}
            >
              {/* Card Header */}
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <h3>{investigation.title}</h3>
                  <div className={styles.cardActions}>
                    <button className={styles.actionButton} title="Edit">
                      ✏️
                    </button>
                    <button 
                      className={styles.actionButton} 
                      title="Archive"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle archive
                      }}
                    >
                      📁
                    </button>
                  </div>
                </div>

                <div className={styles.cardMeta}>
                  <span className={`${styles.status} ${styles[investigation.status]}`}>
                    {getStatusIcon(investigation.status)} {investigation.status}
                  </span>
                  <span className={`${styles.priority} ${styles[investigation.priority]}`}>
                    {getPriorityIcon(investigation.priority)} {investigation.priority}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className={styles.cardContent}>
                <p className={styles.description}>
                  {investigation.description.length > 150
                    ? `${investigation.description.substring(0, 150)}...`
                    : investigation.description}
                </p>

                {/* Progress indicators */}
                <div className={styles.progressInfo}>
                  <div className={styles.progressItem}>
                    <span className={styles.progressLabel}>Tasks:</span>
                    <span className={styles.progressValue}>
                      {/* TODO: Connect to actual task counts */}
                      0 / 0
                    </span>
                  </div>
                  <div className={styles.progressItem}>
                    <span className={styles.progressLabel}>Evidence:</span>
                    <span className={styles.progressValue}>
                      {/* TODO: Connect to actual evidence counts */}
                      0 items
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className={styles.cardFooter}>
                <div className={styles.cardDates}>
                  <span className={styles.dateLabel}>
                    Updated: {formatDate(investigation.updated_at)}
                  </span>
                  <span className={styles.dateLabel}>
                    Created: {formatDate(investigation.created_at)}
                  </span>
                </div>

                <div className={styles.cardTeam}>
                  <span className={styles.teamLabel}>Team: {investigation.team_id}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Memory-aware pagination controls */}
      {totalPages > 1 && (
        <div className={styles.paginationControls}>
          <div className={styles.paginationInfo}>
            <span>
              Page {currentPage} of {totalPages} 
              ({filteredInvestigations.length} total investigations)
            </span>
            <span className={styles.pageSize}>
              Showing {pageSize} per page
              {!canProceed && (
                <span className={styles.memoryWarning}>
                  ⚠️ Memory usage high - pagination optimized
                </span>
              )}
            </span>
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
              disabled={currentPage === totalPages || !canProceed}
            >
              Next ➡️
            </button>
            <button
              className={styles.paginationButton}
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages || !canProceed}
            >
              Last ⏭️
            </button>
          </div>
        </div>
      )}

      {/* Create Investigation Modal - Simple placeholder */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Create New Investigation</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Investigation creation form coming soon...</p>
              {/* TODO: Implement full create form */}
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestigationGrid;
