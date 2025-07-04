import React, { useState } from 'react';
import { Globe, MapPin, Layers, Crosshair, Search, Filter } from 'lucide-react';
import styles from './MapPanel.module.css';

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
const MapPanel: React.FC<MapPanelProps> = ({ data, panelId }) => {
  const [activeLayer, setActiveLayer] = useState('satellite');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showPins, setShowPins] = useState(true);
  
  // In a real implementation, this would connect to the main globe component
  // For now, we're displaying a placeholder with controls
  
  return (
    <div className={styles.mapPanel}>
      <div className={styles.toolbar}>
        <div className={styles.toolSection}>
          <button 
            className={`${styles.layerButton} ${activeLayer === 'satellite' ? styles.activeLayer : ''}`}
            onClick={() => setActiveLayer('satellite')}
          >
            Satellite
          </button>
          <button 
            className={`${styles.layerButton} ${activeLayer === 'terrain' ? styles.activeLayer : ''}`}
            onClick={() => setActiveLayer('terrain')}
          >
            Terrain
          </button>
          <button 
            className={`${styles.layerButton} ${activeLayer === 'political' ? styles.activeLayer : ''}`}
            onClick={() => setActiveLayer('political')}
          >
            Political
          </button>
          <button 
            className={`${styles.layerButton} ${activeLayer === 'dark' ? styles.activeLayer : ''}`}
            onClick={() => setActiveLayer('dark')}
          >
            Dark
          </button>
        </div>
        
        <div className={styles.toolSection}>
          <button 
            className={`${styles.toolButton} ${showHeatmap ? styles.active : ''}`}
            onClick={() => setShowHeatmap(!showHeatmap)}
            title="Toggle heatmap"
          >
            <Layers size={16} />
          </button>
          <button 
            className={`${styles.toolButton} ${showPins ? styles.active : ''}`}
            onClick={() => setShowPins(!showPins)}
            title="Toggle location pins"
          >
            <MapPin size={16} />
          </button>
          <button 
            className={styles.toolButton}
            title="Search location"
          >
            <Search size={16} />
          </button>
          <button 
            className={styles.toolButton}
            title="Center on target"
          >
            <Crosshair size={16} />
          </button>
        </div>
      </div>
      
      <div className={styles.mapContainer}>
        <div className={styles.placeholder}>
          <Globe size={40} />
          <div className={styles.placeholderText}>
            <h3>Earth Alliance Global Intelligence</h3>
            <p>This panel will integrate with the 3D globe visualization</p>
            <p>Current mode: {activeLayer} {showHeatmap ? '+ heatmap' : ''} {showPins ? '+ pins' : ''}</p>
          </div>
        </div>
      </div>
      
      <div className={styles.locationInfo}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Coordinates:</span>
          <span className={styles.infoValue}>34.0522° N, 118.2437° W</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Location:</span>
          <span className={styles.infoValue}>Los Angeles, CA, USA</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Activity:</span>
          <span className={styles.infoValue}>
            <span className={styles.activityDot}></span>
            Medium (12 events)
          </span>
        </div>
      </div>
      
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
