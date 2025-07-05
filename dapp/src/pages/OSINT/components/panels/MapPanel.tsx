import React, { useState } from 'react';
import { Globe, MapPin, Layers, Crosshair, Search, RefreshCw } from 'lucide-react';
import styles from './MapPanel.module.css';
import { useMapData } from '../../hooks/useMapData';
import { MapLayerType, MapVisualizationType } from '../../services/map/mapService';
import ErrorDisplay from '../common/ErrorDisplay';

interface MapPanelProps {
  data: Record<string, unknown>;
  panelId: string;
}

/**
 * Geospatial Intelligence Panel
 * 
 * This panel will integrate with the existing 3D globe for location-based intelligence
 * Currently showing a placeholder with planned integration points
 */
const MapPanel: React.FC<MapPanelProps> = () => {
  const {
    mapData,
    loading,
    error,
    config,
    setConfig,
    refreshMapData,
    searchLocations,
    selectedLocation,
    setSelectedLocation,
    locationDetails,
    loadingOperations
  } = useMapData({ autoLoad: true });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Toggle layer
  const setActiveLayer = (layer: MapLayerType) => {
    setConfig({ activeLayer: layer });
  };
  
  // Toggle visualization
  const toggleVisualization = (vis: MapVisualizationType) => {
    const newVisualizations = config.visualizations.includes(vis)
      ? config.visualizations.filter(v => v !== vis)
      : [...config.visualizations, vis];
    
    setConfig({ visualizations: newVisualizations });
  };
  
  // Check if visualization is active
  const isVisualizationActive = (vis: MapVisualizationType) => {
    return config.visualizations.includes(vis);
  };
  
  // Search for locations
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchLocations(searchQuery);
      setSearchResults(results.map(loc => ({
        id: loc.id,
        name: loc.name,
        description: loc.description
      })));
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Get location details to display
  const locationToDisplay = locationDetails || (
    selectedLocation && mapData.locations.find(loc => loc.id === selectedLocation)
  );
  
  // Activity level to string
  const getActivityLevel = (activity: number) => {
    if (activity >= 0.75) return 'High';
    if (activity >= 0.4) return 'Medium';
    return 'Low';
  };
  
  // Activity color
  const getActivityColor = (activity: number) => {
    if (activity >= 0.75) return '#e44141';
    if (activity >= 0.4) return '#e4c641';
    return '#41c7e4';
  };
  
  return (
    <div className={styles.mapPanel}>
      <div className={styles.toolbar}>
        <div className={styles.toolSection}>
          <button 
            className={`${styles.layerButton} ${config.activeLayer === 'satellite' ? styles.activeLayer : ''}`}
            onClick={() => setActiveLayer('satellite')}
          >
            Satellite
          </button>
          <button 
            className={`${styles.layerButton} ${config.activeLayer === 'terrain' ? styles.activeLayer : ''}`}
            onClick={() => setActiveLayer('terrain')}
          >
            Terrain
          </button>
          <button 
            className={`${styles.layerButton} ${config.activeLayer === 'political' ? styles.activeLayer : ''}`}
            onClick={() => setActiveLayer('political')}
          >
            Political
          </button>
          <button 
            className={`${styles.layerButton} ${config.activeLayer === 'dark' ? styles.activeLayer : ''}`}
            onClick={() => setActiveLayer('dark')}
          >
            Dark
          </button>
        </div>
        
        <div className={styles.toolSection}>
          <button 
            className={`${styles.toolButton} ${isVisualizationActive('heatmap') ? styles.active : ''}`}
            onClick={() => toggleVisualization('heatmap')}
            title="Toggle heatmap"
          >
            <Layers size={16} />
          </button>
          <button 
            className={`${styles.toolButton} ${isVisualizationActive('pins') ? styles.active : ''}`}
            onClick={() => toggleVisualization('pins')}
            title="Toggle location pins"
          >
            <MapPin size={16} />
          </button>
          <button 
            className={`${styles.toolButton} ${isVisualizationActive('connections') ? styles.active : ''}`}
            onClick={() => toggleVisualization('connections')}
            title="Toggle connections"
          >
            <Crosshair size={16} />
          </button>
          <button 
            className={styles.toolButton}
            onClick={refreshMapData}
            disabled={loading}
            title="Refresh map data"
          >
            <RefreshCw size={16} className={loadingOperations['loadMapData'] ? styles.spinning : ''} />
          </button>
        </div>
      </div>
      
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button 
          className={styles.searchButton}
          onClick={handleSearch}
          disabled={isSearching}
        >
          {loadingOperations['searchLocations'] ? (
            <div className={styles.buttonSpinner}></div>
          ) : (
            <Search size={16} />
          )}
        </button>
      </div>
      
      {searchResults.length > 0 && (
        <div className={styles.searchResults}>
          {searchResults.map(result => (
            <div 
              key={result.id} 
              className={styles.searchResultItem}
              onClick={() => {
                setSelectedLocation(result.id);
                setSearchResults([]);
                setSearchQuery('');
              }}
            >
              <div className={styles.searchResultName}>{result.name}</div>
              <div className={styles.searchResultDesc}>{result.description}</div>
            </div>
          ))}
        </div>
      )}
      
      {error && (
        <div className={styles.errorWrapper}>
          <ErrorDisplay 
            error={error}
            onRetry={refreshMapData}
            className={styles.mapError}
          />
        </div>
      )}
      
      <div className={styles.mapContainer}>
        {loading && !error && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <div className={styles.loadingText}>Loading map data...</div>
          </div>
        )}
        
        {mapData.locations.length === 0 && !loading ? (
          <div className={styles.placeholder}>
            <Globe size={40} />
            <div className={styles.placeholderText}>
              <h3>Earth Alliance Global Intelligence</h3>
              <p>This panel will integrate with the 3D globe visualization</p>
              <p>No locations found. Try adjusting filters.</p>
            </div>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <Globe size={40} />
            <div className={styles.placeholderText}>
              <h3>Earth Alliance Global Intelligence</h3>
              <p>{mapData.locations.length} locations found</p>
              <p>Layer: {config.activeLayer} | 
                 Visualizations: {config.visualizations.join(', ') || 'none'}</p>
            </div>
          </div>
        )}
      </div>
      
      {locationToDisplay && (
        <div className={styles.locationInfo}>
          <h3 className={styles.locationTitle}>{locationToDisplay.name}</h3>
          <p className={styles.locationDescription}>{locationToDisplay.description}</p>
          <div className={styles.locationDetails}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Coordinates:</span>
              <span className={styles.infoValue}>
                {locationToDisplay.coordinates.latitude.toFixed(4)}°, 
                {locationToDisplay.coordinates.longitude.toFixed(4)}°
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Type:</span>
              <span className={styles.infoValue}>{locationToDisplay.type}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Activity:</span>
              <span className={styles.infoValue}>
                <span 
                  className={styles.activityDot} 
                  style={{ backgroundColor: getActivityColor(locationToDisplay.activity) }}
                ></span>
                {getActivityLevel(locationToDisplay.activity)} ({locationToDisplay.events} events)
              </span>
            </div>
            {locationToDisplay.category && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Category:</span>
                <span className={styles.infoValue}>{locationToDisplay.category}</span>
              </div>
            )}
            {locationToDisplay.tags && locationToDisplay.tags.length > 0 && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Tags:</span>
                <div className={styles.tagsList}>
                  {locationToDisplay.tags.map(tag => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendMarker} style={{ backgroundColor: '#e44141' }}></span>
          <span className={styles.legendLabel}>High Activity</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendMarker} style={{ backgroundColor: '#e4c641' }}></span>
          <span className={styles.legendLabel}>Medium Activity</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendMarker} style={{ backgroundColor: '#41c7e4' }}></span>
          <span className={styles.legendLabel}>Low Activity</span>
        </div>
      </div>
    </div>
  );
};

export default MapPanel;
