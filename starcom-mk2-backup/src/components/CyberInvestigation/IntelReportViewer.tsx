import React, { useState, useEffect, useCallback } from 'react';
import { fetchIntelReports } from '../../api/intelligence';
import { IntelReportData } from '../../models/IntelReportData';
import styles from './IntelReportViewer.module.css';

// AI-NOTE: Intel report viewer for cyber investigation teams
// Easy viewing and scrubbing through reports with offline support

interface IntelReportViewerProps {
  teamId: string;
  investigationId: string;
  onlineStatus: boolean;
}

interface FilterOptions {
  tags: string[];
  dateRange: { start: string; end: string };
  author: string;
  searchTerm: string;
}

const IntelReportViewer: React.FC<IntelReportViewerProps> = ({
  teamId,
  investigationId,
  onlineStatus
}) => {
  const [reports, setReports] = useState<IntelReportData[]>([]);
  const [filteredReports, setFilteredReports] = useState<IntelReportData[]>([]);
  const [selectedReport, setSelectedReport] = useState<IntelReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    tags: [],
    dateRange: { start: '', end: '' },
    author: '',
    searchTerm: ''
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'map'>('list');

  // Callback functions defined first
  const extractAvailableTags = useCallback((reportList: IntelReportData[]) => {
    const tagSet = new Set<string>();
    reportList.forEach(report => {
      report.tags.forEach(tag => {
        if (!tag.startsWith('TEAM:') && !tag.startsWith('INV:')) {
          tagSet.add(tag);
        }
      });
    });
    setAvailableTags(Array.from(tagSet).sort());
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...reports];

    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(term) ||
        report.content.toLowerCase().includes(term) ||
        report.author.toLowerCase().includes(term)
      );
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(report =>
        filters.tags.every(tag => report.tags.includes(tag))
      );
    }

    // Author filter
    if (filters.author) {
      filtered = filtered.filter(report =>
        report.author.toLowerCase().includes(filters.author.toLowerCase())
      );
    }

    // Date range filter
    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start).getTime();
      filtered = filtered.filter(report => report.timestamp >= startDate);
    }
    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end).getTime();
      filtered = filtered.filter(report => report.timestamp <= endDate);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    setFilteredReports(filtered);
  }, [reports, filters]);

  const loadReports = useCallback(async () => {
    if (!onlineStatus) {
      // Use cached data when offline
      return;
    }

    setLoading(true);
    try {
      const fetchedReports = await fetchIntelReports();
      
      // Transform to IntelReportData format
      const transformedReports: IntelReportData[] = fetchedReports.map((report, index) => ({
        id: `report-${Date.now()}-${index}`,
        title: report.title,
        content: report.content,
        tags: report.tags || [],
        latitude: report.lat || 0,
        longitude: report.long || 0,
        timestamp: Date.parse(report.date) || Date.now(),
        author: report.author || 'Unknown',
        subtitle: report.subtitle,
        date: report.date,
        categories: report.categories || [],
        metaDescription: report.metaDescription
      }));

      // Filter by team and investigation
      const teamReports = transformedReports.filter(report =>
        report.tags.includes(`TEAM:${teamId}`) || 
        report.tags.includes(`INV:${investigationId}`) ||
        !report.tags.some(tag => tag.startsWith('TEAM:')) // Include reports without team tags
      );

      setReports(teamReports);
      setFilteredReports(teamReports);
      extractAvailableTags(teamReports);

      // Cache reports for offline use
      localStorage.setItem(`reports-cache-${teamId}`, JSON.stringify(teamReports));
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  }, [onlineStatus, teamId, investigationId, extractAvailableTags]);

  // Load reports on component mount
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Load cached reports from localStorage
  useEffect(() => {
    const cached = localStorage.getItem(`reports-cache-${teamId}`);
    if (cached) {
      const cachedReports = JSON.parse(cached);
      setReports(cachedReports);
      setFilteredReports(cachedReports);
      extractAvailableTags(cachedReports);
    }
  }, [teamId, extractAvailableTags]);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderReportCard = (report: IntelReportData) => (
    <div 
      key={report.id} 
      className={`${styles.reportCard} ${selectedReport?.id === report.id ? styles.selected : ''}`}
      onClick={() => setSelectedReport(report)}
    >
      <div className={styles.reportHeader}>
        <h3 className={styles.reportTitle}>{report.title}</h3>
        <span className={styles.reportDate}>{formatDate(report.timestamp)}</span>
      </div>
      
      <div className={styles.reportMeta}>
        <span className={styles.author}>By: {report.author}</span>
        {report.latitude !== 0 && report.longitude !== 0 && (
          <span className={styles.location}>
            📍 {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
          </span>
        )}
      </div>
      
      <div className={styles.reportContent}>
        {report.content.substring(0, 150)}
        {report.content.length > 150 && '...'}
      </div>
      
      <div className={styles.reportTags}>
        {report.tags.filter(tag => !tag.startsWith('TEAM:') && !tag.startsWith('INV:')).map(tag => (
          <span key={tag} className={styles.tag}>{tag}</span>
        ))}
      </div>
    </div>
  );

  const renderReportDetail = () => {
    if (!selectedReport) {
      return (
        <div className={styles.noSelection}>
          Select a report to view details
        </div>
      );
    }

    return (
      <div className={styles.reportDetail}>
        <div className={styles.detailHeader}>
          <h2>{selectedReport.title}</h2>
          <button 
            className={styles.closeButton}
            onClick={() => setSelectedReport(null)}
          >
            ✕
          </button>
        </div>
        
        <div className={styles.detailMeta}>
          <div><strong>Author:</strong> {selectedReport.author}</div>
          <div><strong>Date:</strong> {formatDate(selectedReport.timestamp)}</div>
          {selectedReport.latitude !== 0 && selectedReport.longitude !== 0 && (
            <div><strong>Location:</strong> {selectedReport.latitude}, {selectedReport.longitude}</div>
          )}
          <div><strong>ID:</strong> {selectedReport.id}</div>
        </div>
        
        <div className={styles.detailContent}>
          <h3>Content</h3>
          <div className={styles.contentText}>
            {selectedReport.content}
          </div>
        </div>
        
        <div className={styles.detailTags}>
          <h3>Tags</h3>
          <div className={styles.tagList}>
            {selectedReport.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Intel Reports</h2>
        <div className={styles.metadata}>
          <span>Team: {teamId}</span>
          <span>Investigation: {investigationId}</span>
          <span className={onlineStatus ? styles.online : styles.offline}>
            {onlineStatus ? '🟢 Online' : '🔴 Offline (Cached)'}
          </span>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.viewModes}>
          <button 
            className={`${styles.viewMode} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 List
          </button>
          <button 
            className={`${styles.viewMode} ${viewMode === 'timeline' ? styles.active : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            📅 Timeline
          </button>
          <button 
            className={`${styles.viewMode} ${viewMode === 'map' ? styles.active : ''}`}
            onClick={() => setViewMode('map')}
          >
            🗺️ Map
          </button>
        </div>

        <button 
          onClick={loadReports} 
          disabled={loading || !onlineStatus}
          className={styles.refreshButton}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search reports..."
          value={filters.searchTerm}
          onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
          className={styles.searchInput}
        />

        <input
          type="text"
          placeholder="Filter by author..."
          value={filters.author}
          onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
          className={styles.authorInput}
        />

        <div className={styles.dateFilters}>
          <input
            type="date"
            value={filters.dateRange.start}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              dateRange: { ...prev.dateRange, start: e.target.value }
            }))}
          />
          <input
            type="date"
            value={filters.dateRange.end}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              dateRange: { ...prev.dateRange, end: e.target.value }
            }))}
          />
        </div>

        <div className={styles.tagFilters}>
          {availableTags.slice(0, 10).map(tag => (
            <button
              key={tag}
              className={`${styles.tagFilter} ${filters.tags.includes(tag) ? styles.active : ''}`}
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.reportsList}>
          <div className={styles.resultsCount}>
            {filteredReports.length} reports
          </div>
          
          {loading ? (
            <div className={styles.loading}>Loading reports...</div>
          ) : filteredReports.length === 0 ? (
            <div className={styles.noReports}>
              No reports found matching your filters
            </div>
          ) : (
            <div className={styles.reportsGrid}>
              {filteredReports.map(renderReportCard)}
            </div>
          )}
        </div>

        <div className={styles.detailPane}>
          {renderReportDetail()}
        </div>
      </div>
    </div>
  );
};

export default IntelReportViewer;
