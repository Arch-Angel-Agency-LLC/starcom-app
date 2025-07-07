import React, { useState, useEffect } from 'react';
import { useCaseManager } from '../hooks/useCaseManager';
import CaseItem from './CaseItem';
import CaseFilter from './CaseFilter';
import CaseDetails from './CaseDetails';
import styles from './CaseManagerDashboard.module.css';
import { Case } from '../types/cases';

const CaseManagerDashboard: React.FC = () => {
  const { 
    loading, 
    error,
    filter,
    applyFilter,
    filteredCases,
    updateFilter,
    filterOptions
  } = useCaseManager({ autoLoad: true });
  
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);

  // Reset selected case when filtered cases change
  useEffect(() => {
    if (selectedCase && !filteredCases.find(c => c.id === selectedCase.id)) {
      setSelectedCase(null);
      setIsDetailsPanelOpen(false);
    }
  }, [filteredCases, selectedCase]);

  const handleCaseSelect = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsDetailsPanelOpen(true);
  };

  const handleCreateNewCase = () => {
    // In a real implementation, we would show a form to create a new case
    console.log('Create new case action triggered');
  };

  const handleCloseDetailsPanel = () => {
    setIsDetailsPanelOpen(false);
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Loading cases...</div>;
  }

  if (error) {
    return <div className={styles.errorContainer}>Error: {error.message}</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.mainContent}>
        <div className={styles.toolbarContainer}>
          <h2 className={styles.dashboardTitle}>Case Manager</h2>
          <button 
            className={styles.newCaseButton}
            onClick={handleCreateNewCase}
          >
            Create New Case
          </button>
        </div>
        
        <div className={styles.filterSection}>
          <CaseFilter 
            filter={filter}
            onFilterChange={updateFilter}
            onApplyFilter={applyFilter}
            availableTags={filterOptions.tags || []}
          />
        </div>
        
        <div className={styles.casesContainer}>
          {filteredCases.length === 0 ? (
            <div className={styles.noCasesMessage}>
              No cases match your filter criteria
            </div>
          ) : (
            <div className={styles.casesList}>
              {filteredCases.map(caseItem => (
                <CaseItem 
                  key={caseItem.id}
                  caseData={caseItem}
                  isSelected={selectedCase?.id === caseItem.id}
                  onClick={() => handleCaseSelect(caseItem)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {isDetailsPanelOpen && selectedCase && (
        <div className={styles.detailsPanel}>
          <CaseDetails
            caseData={selectedCase}
            onClose={handleCloseDetailsPanel}
          />
        </div>
      )}
    </div>
  );
};

export default CaseManagerDashboard;
