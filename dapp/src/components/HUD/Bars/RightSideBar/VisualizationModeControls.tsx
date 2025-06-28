import React from 'react';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import styles from './VisualizationModeControls.module.css';

const VisualizationModeControls: React.FC = () => {
  const { visualizationMode, setVisualizationMode, setPrimaryMode } = useVisualizationMode();

  return (
    <div className={styles.container}>
      <div className={styles.sectionTitle}>Visualization Mode</div>
      
      {/* Primary Mode Buttons */}
      <div className={styles.primaryModeContainer}>
        <button 
          className={`${styles.primaryButton} ${visualizationMode.mode === 'EcoNatural' ? styles.active : ''}`}
          onClick={() => setPrimaryMode('EcoNatural')}
          title="Eco Natural"
        >
          🌎 Eco Natural
        </button>
        <button 
          className={`${styles.primaryButton} ${visualizationMode.mode === 'CyberCommand' ? styles.active : ''}`}
          onClick={() => setPrimaryMode('CyberCommand')}
          title="Cyber Command"
        >
          📑 Cyber Command
        </button>
        <button 
          className={`${styles.primaryButton} ${visualizationMode.mode === 'GeoPolitical' ? styles.active : ''}`}
          onClick={() => setPrimaryMode('GeoPolitical')}
          title="Geo Political"
        >
          ☀️ Geo Political
        </button>
      </div>
      
      {/* Secondary Mode Buttons */}
      <div className={styles.secondaryModeContainer}>
        {/* CyberCommand submodes */}
        {visualizationMode.mode === 'CyberCommand' && (
          <>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'IntelReports' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'CyberCommand', subMode: 'IntelReports' })}
              title="Intel Reports"
            >
              📑 Intel Reports
            </button>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'Timelines' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'CyberCommand', subMode: 'Timelines' })}
              title="Timelines"
            >
              ⏱️ Timelines
            </button>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'CrisisZones' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'CyberCommand', subMode: 'CrisisZones' })}
              title="Crisis Zones"
            >
              🚨 Crisis Zones
            </button>
          </>
        )}
        
        {/* GeoPolitical submodes */}
        {visualizationMode.mode === 'GeoPolitical' && (
          <>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'NationalTerritories' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'GeoPolitical', subMode: 'NationalTerritories' })}
              title="National Territories"
            >
              🗺️ National Territories
            </button>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'DiplomaticEvents' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'GeoPolitical', subMode: 'DiplomaticEvents' })}
              title="Diplomatic Events"
            >
              🤝 Diplomatic Events
            </button>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'ResourceZones' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'GeoPolitical', subMode: 'ResourceZones' })}
              title="Resource Zones"
            >
              💎 Resource Zones
            </button>
          </>
        )}
        
        {/* EcoNatural submodes */}
        {visualizationMode.mode === 'EcoNatural' && (
          <>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'SpaceWeather' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'EcoNatural', subMode: 'SpaceWeather' })}
              title="Space Weather"
            >
              🌎 Space Weather
            </button>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'EcologicalDisasters' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'EcoNatural', subMode: 'EcologicalDisasters' })}
              title="Ecological Disasters"
            >
              🌪️ Ecological Disasters
            </button>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'EarthWeather' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'EcoNatural', subMode: 'EarthWeather' })}
              title="Earth Weather"
            >
              🌤️ Earth Weather
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VisualizationModeControls;
