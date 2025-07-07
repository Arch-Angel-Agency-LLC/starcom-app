// AI-NOTE: Artifact-driven UI component for intelligence overlays (SIGINT/HUMINT).
// This component displays intelligence markers with enhanced visualization and filtering.
// See artifacts/intel-report-overlays.artifact for overlay types, data sources, and migration plan.
// COMPLETED: Integrate with live Solana backend overlays using IntelReportService.

import React, { useState, useMemo } from 'react';
import type { IntelReportOverlayMarker } from '../../../interfaces/IntelReportOverlay';

// Props for overlay markers with enhanced functionality
interface IntelOverlayProps {
  markers?: IntelReportOverlayMarker[];
  showFilters?: boolean;
  maxMarkers?: number;
}

// Tag type mapping for styling and categorization
const TAG_CATEGORIES = {
  SIGINT: { label: 'Signals Intelligence', color: '#ff6b6b', icon: '📡' },
  HUMINT: { label: 'Human Intelligence', color: '#4ecdc4', icon: '👤' },
  GEOINT: { label: 'Geospatial Intelligence', color: '#45b7d1', icon: '🌍' },
  ELECTROMAGNETIC: { label: 'Electromagnetic', color: '#96ceb4', icon: '⚡' },
  SPACE_WEATHER: { label: 'Space Weather', color: '#ffeaa7', icon: '🌌' },
  MARITIME: { label: 'Maritime', color: '#74b9ff', icon: '🚢' },
  SURVEILLANCE: { label: 'Surveillance', color: '#fd79a8', icon: '👁️' },
  COMMS_DISRUPTION: { label: 'Communications', color: '#fdcb6e', icon: '📶' },
  PATTERN_ANALYSIS: { label: 'Pattern Analysis', color: '#e17055', icon: '📊' },
  GEOMAGNETIC: { label: 'Geomagnetic', color: '#a29bfe', icon: '🧲' },
  DEFAULT: { label: 'Intelligence', color: '#6c5ce7', icon: '🔍' }
};

export const IntelOverlay: React.FC<IntelOverlayProps> = ({ 
  markers = [], 
  showFilters = true,
  maxMarkers = 100 
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'timestamp' | 'location' | 'title'>('timestamp');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // Process and filter markers
  const processedMarkers = useMemo(() => {
    let filtered = markers;

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(marker => 
        marker.tags.some(tag => selectedTags.includes(tag))
      );
    }

    // Sort markers
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return b.timestamp - a.timestamp;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'location':
          return Math.sqrt(a.latitude ** 2 + a.longitude ** 2) - 
                 Math.sqrt(b.latitude ** 2 + b.longitude ** 2);
        default:
          return 0;
      }
    });

    // Limit markers
    return filtered.slice(0, maxMarkers);
  }, [markers, selectedTags, sortBy, maxMarkers]);

  // Get unique tags from all markers
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    markers.forEach(marker => marker.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [markers]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getTagInfo = (tag: string) => {
    return TAG_CATEGORIES[tag as keyof typeof TAG_CATEGORIES] || TAG_CATEGORIES.DEFAULT;
  };

  if (markers.length === 0) {
    return (
      <div className="intel-overlay empty">
        <h3>Intelligence Overlay</h3>
        <div className="empty-state">
          <p>No intelligence markers to display.</p>
          <p>Intelligence reports will appear here as they are submitted to the blockchain.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="intel-overlay">
      <div className="overlay-header">
        <h3>Intelligence Overlay ({processedMarkers.length}/{markers.length})</h3>
        
        {showFilters && (
          <div className="overlay-controls">
            <div className="sort-controls">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'timestamp' | 'location' | 'title')}>
                <option value="timestamp">Newest First</option>
                <option value="title">Title</option>
                <option value="location">Distance from Origin</option>
              </select>
            </div>
            
            <div className="view-controls">
              <button 
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </button>
              <button 
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
            </div>
          </div>
        )}
      </div>

      {showFilters && availableTags.length > 0 && (
        <div className="tag-filters">
          <h4>Filter by Intelligence Type:</h4>
          <div className="tag-buttons">
            {availableTags.map(tag => {
              const tagInfo = getTagInfo(tag);
              return (
                <button
                  key={tag}
                  className={`tag-filter ${selectedTags.includes(tag) ? 'active' : ''}`}
                  style={{ 
                    backgroundColor: selectedTags.includes(tag) ? tagInfo.color : 'transparent',
                    borderColor: tagInfo.color,
                    color: selectedTags.includes(tag) ? 'white' : tagInfo.color
                  }}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tagInfo.icon} {tagInfo.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={`markers-container ${viewMode}`}>
        {processedMarkers.map((marker) => {
          const primaryTag = marker.tags[0] || 'DEFAULT';
          const tagInfo = getTagInfo(primaryTag);
          
          return (
            <div key={marker.pubkey} className="intel-marker" style={{ borderLeftColor: tagInfo.color }}>
              <div className="marker-header">
                <div className="marker-icon" style={{ color: tagInfo.color }}>
                  {tagInfo.icon}
                </div>
                <div className="marker-title">
                  <h4>{marker.title}</h4>
                  <div className="marker-tags">
                    {marker.tags.map((tag, idx) => {
                      const info = getTagInfo(tag);
                      return (
                        <span key={idx} className="marker-tag" style={{ backgroundColor: info.color }}>
                          {info.icon} {tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="marker-content">
                <p>{marker.content}</p>
              </div>
              
              <div className="marker-meta">
                <div className="location">
                  📍 {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
                </div>
                <div className="author">👤 {marker.author}</div>
                <div className="timestamp">
                  🕒 {new Date(marker.timestamp).toLocaleString()}
                </div>
              </div>
              
              {marker.pubkey && (
                <div className="marker-blockchain">
                  <small>⛓️ {marker.pubkey.substring(0, 8)}...{marker.pubkey.slice(-4)}</small>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
