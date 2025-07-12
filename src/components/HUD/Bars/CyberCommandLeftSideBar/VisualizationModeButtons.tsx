import React from 'react';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import styles from './VisualizationModeButtons.module.css';

const VisualizationModeButtons: React.FC = () => {
  const { visualizationMode, setVisualizationMode, setPrimaryMode } = useVisualizationMode();

  return (
    <div className={styles.container}>
      {/* Primary Mode Buttons - 3 main visualization modes */}
      <div className={styles.buttonContainer}>
        <button 
          className={`${styles.shaderButton} ${visualizationMode.mode === 'EcoNatural' ? styles.active : ''}`}
          onClick={() => setPrimaryMode('EcoNatural')}
          title="Eco Natural"
        >
          🌎
        </button>
        <button 
          className={`${styles.shaderButton} ${visualizationMode.mode === 'CyberCommand' ? styles.active : ''}`}
          onClick={() => setPrimaryMode('CyberCommand')}
          title="Cyber Command"
        >
          📑
        </button>
        <button 
          className={`${styles.shaderButton} ${visualizationMode.mode === 'GeoPolitical' ? styles.active : ''}`}
          onClick={() => setPrimaryMode('GeoPolitical')}
          title="Geo Political"
        >
          ☀️
        </button>
      </div>
      
      {/* Secondary Mode Buttons - 3 buttons that change based on primary mode selection */}
      <div className={styles.secondaryButtonContainer}>
        {/* CyberCommand submodes */}
        {visualizationMode.mode === 'CyberCommand' && (
          <>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'IntelReports' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'CyberCommand', subMode: 'IntelReports' })}
              title="Intel Reports"
            >
              📑
            </button>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'Timelines' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'CyberCommand', subMode: 'Timelines' })}
              title="Timelines"
            >
              ⏱️
            </button>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'CrisisZones' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'CyberCommand', subMode: 'CrisisZones' })}
              title="Crisis Zones"
            >
              🚨
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
              🗺️
            </button>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'DiplomaticEvents' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'GeoPolitical', subMode: 'DiplomaticEvents' })}
              title="Diplomatic Events"
            >
              🤝
            </button>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'ResourceZones' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'GeoPolitical', subMode: 'ResourceZones' })}
              title="Resource Zones"
            >
              💎
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
              🌎
            </button>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'EcologicalDisasters' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'EcoNatural', subMode: 'EcologicalDisasters' })}
              title="Ecological Disasters"
            >
              🌪️
            </button>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'EarthWeather' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'EcoNatural', subMode: 'EarthWeather' })}
              title="Earth Weather"
            >
              🌤️
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VisualizationModeButtons;
