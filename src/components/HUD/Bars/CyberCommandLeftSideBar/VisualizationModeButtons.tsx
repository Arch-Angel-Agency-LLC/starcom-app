import React from 'react';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import styles from './VisualizationModeButtons.module.css';

const VisualizationModeButtons: React.FC = () => {
  const { visualizationMode, setVisualizationMode, setPrimaryMode } = useVisualizationMode();

  return (
    <div className={styles.container}>
      {/* Primary Mode Buttons - 3 main visualization modes - CyberCommand first as default */}
      <div className={styles.buttonContainer}>
        <button 
          className={`${styles.shaderButton} ${visualizationMode.mode === 'CyberCommand' ? styles.active : ''}`}
          onClick={() => setPrimaryMode('CyberCommand')}
          title="Cyber Command"
        >
          📑
        </button>
        <button 
          className={`${styles.shaderButton} ${visualizationMode.mode === 'EcoNatural' ? styles.active : ''}`}
          onClick={() => setPrimaryMode('EcoNatural')}
          title="Eco Natural"
        >
          🌎
        </button>
        <button 
          className={`${styles.shaderButton} ${visualizationMode.mode === 'GeoPolitical' ? styles.active : ''}`}
          onClick={() => setPrimaryMode('GeoPolitical')}
          title="Geo Political"
        >
          ☀️
        </button>
      </div>
      
      {/* Secondary Mode Buttons - 3 core CyberCommand modes */}
      <div className={styles.secondaryButtonContainer}>
        {/* CyberCommand submodes - 3 core cyber intelligence modes - Icons only for space efficiency */}
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
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'CyberThreats' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'CyberCommand', subMode: 'CyberThreats' })}
              title="Cyber Threat Zones"
            >
              🔒
            </button>
            <button 
              className={`${styles.secondaryButton} ${visualizationMode.subMode === 'CyberAttacks' ? styles.active : ''}`}
              onClick={() => setVisualizationMode({ mode: 'CyberCommand', subMode: 'CyberAttacks' })}
              title="Cyber Attacks"
            >
              ⚡
            </button>
          </>
        )}
        
        {/* GeoPolitical submodes - Icons only for space efficiency */}
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
        
        {/* EcoNatural submodes - Icons only for space efficiency */}
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
