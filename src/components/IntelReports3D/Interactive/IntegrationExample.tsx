/**
 * IntegrationExample.tsx
 * 
 * Example integration of Intel Reports 3D Interactive Components
 * Shows how to compose all interactive components into a complete UI
 * This serves as a reference for integrating into the main HUD
 */

import React, { useState, useCallback } from 'react';
import { IntelReport3DData } from '../../../types/intelligence/IntelReportTypes';
import {
  IntelReportList,
  IntelFilterControls,
  IntelSearchBar,
  IntelActionButtons,
  IntelStatusIndicator,
  IntelMetricsDisplay,
} from './';
import styles from './IntegrationExample.module.css';

// Mock data and types for the example
interface MockIntelReport {
  id: string;
  title: string;
  content: string;
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  tags: string[];
  timestamp: Date;
  confidence: number;
  source: string;
}

interface MockFilters {
  categories: string[];
  tags: string[];
  priorities: string[];
  classifications: string[];
  dateRange: { start: Date | null; end: Date | null };
  confidenceRange: { min: number; max: number };
}

interface IntegrationExampleProps {
  /** Layout mode for the example */
  layout?: 'dashboard' | 'sidebar' | 'fullscreen';
  /** Whether to show all components or a subset */
  componentsToShow?: ('search' | 'filters' | 'list' | 'actions' | 'status' | 'metrics')[];
}

/**
 * Complete integration example showing how to compose all Interactive components
 */
export const IntegrationExample: React.FC<IntegrationExampleProps> = ({
  layout = 'dashboard',
  componentsToShow = ['search', 'filters', 'list', 'actions', 'status', 'metrics']
}) => {
  // Mock state management
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<MockFilters>({
    categories: [],
    tags: [],
    priorities: [],
    classifications: [],
    dateRange: { start: null, end: null },
    confidenceRange: { min: 0, max: 100 }
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const mockReports: MockIntelReport[] = [
    {
      id: '1',
      title: 'Sample Intel Report 1',
      content: 'This is a sample intelligence report for testing.',
      classification: 'CONFIDENTIAL',
      priority: 'HIGH',
      category: 'SIGINT',
      tags: ['urgent', 'actionable'],
      timestamp: new Date(),
      confidence: 85,
      source: 'SIGINT-001'
    },
    {
      id: '2',
      title: 'Sample Intel Report 2',
      content: 'Another sample intelligence report.',
      classification: 'SECRET',
      priority: 'MEDIUM',
      category: 'HUMINT',
      tags: ['monitoring'],
      timestamp: new Date(),
      confidence: 72,
      source: 'HUMINT-005'
    }
  ];

  // Convert mock data to proper IntelReport3DData format
  const reports: IntelReport3DData[] = mockReports.map(mock => ({
    id: mock.id,
    title: mock.title,
    content: {
      summary: mock.title,
      details: mock.content,
      keywords: mock.tags,
      analysis: `Analysis for ${mock.title}`,
      recommendations: ['Monitor closely', 'Update periodically']
    },
    classification: mock.classification as 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET',
    priority: mock.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
    timestamp: mock.timestamp,
    confidence: mock.confidence,
    source: mock.source,
    location: {
      lat: 40.7128,
      lng: -74.0060,
      region: 'North America'
    },
    visualization: {
      markerType: 'standard',
      color: '#FF6B6B',
      size: 1.0,
      opacity: 0.8,
      priority: mock.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
      animation: {
        enabled: true,
        type: 'pulse',
        duration: 2000,
        loop: true,
        easing: 'ease-in-out'
      }
    },
    metadata: {
      category: 'cyber_threat',
      tags: mock.tags,
      confidence: mock.confidence / 100,
      reliability: 0.8,
      freshness: 0.9,
      threat_level: 'moderate',
      analyst: 'System'
    }
  }));

  // Event handlers
  const handleReportSelect = useCallback((selectedIds: Set<string>) => {
    setSelectedReportIds(selectedIds);
  }, []);

  const handleAction = useCallback(async (actionType: string, reports: IntelReport3DData[]) => {
    console.log(`Executing ${actionType} on reports:`, reports.map(r => r.id));
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Clear selection after action
    setSelectedReportIds(new Set());
  }, []);

  // Get selected reports objects
  const selectedReports = reports.filter(report => selectedReportIds.has(report.id));

  const handleFilterChange = useCallback((newFilters: Partial<MockFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const layoutClasses = layout === 'sidebar' ? styles.sidebarLayout :
    layout === 'fullscreen' ? styles.fullscreenLayout : styles.dashboardLayout;

  return (
    <div className={`${styles.integrationExample} ${layoutClasses}`}>
      {/* Header with Status and Metrics */}
      <div className={styles.header}>
        {componentsToShow.includes('status') && (
          <IntelStatusIndicator
            connectionStatus="connected"
            syncStatus="synced"
            animated={true}
            size="medium"
            autoHide={false}
          />
        )}
        
        {componentsToShow.includes('metrics') && (
          <IntelMetricsDisplay
            updateInterval={5000}
            variant="compact"
          />
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className={styles.controls}>
        {componentsToShow.includes('search') && (
          <IntelSearchBar
            query={searchQuery}
            onQueryChange={handleSearchChange}
            placeholder="Search intel reports..."
            showSuggestions={true}
            maxSuggestions={5}
          />
        )}
        
        {componentsToShow.includes('filters') && (
          <IntelFilterControls
            filters={filters}
            onFiltersChange={handleFilterChange}
            showAdvanced={true}
          />
        )}
      </div>

      {/* Action Controls */}
      {componentsToShow.includes('actions') && selectedReports.length > 0 && (
        <div className={styles.actions}>
          <IntelActionButtons
            selectedReports={selectedReports}
            onAction={handleAction}
            variant="horizontal"
            disabled={false}
          />
        </div>
      )}

      {/* Main Content - Report List */}
      <div className={styles.content}>
        {componentsToShow.includes('list') && (
          <IntelReportList
            reports={reports}
            loading={false}
            error={null}
            onSelectionChange={handleReportSelect}
            virtualized={true}
            multiSelect={true}
            itemHeight={120}
          />
        )}
      </div>

      {/* Footer with Summary */}
      <div className={styles.footer}>
        <div className={styles.summary}>
          {reports.length > 0 && (
            <span>
              Showing {reports.length} reports
              {selectedReports.length > 0 && (
                <> • {selectedReports.length} selected</>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegrationExample;
