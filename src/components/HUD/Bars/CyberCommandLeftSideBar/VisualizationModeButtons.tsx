import React from 'react';
import { useVisualizationMode } from '../../../../context/VisualizationModeContext';
import styles from './VisualizationModeButtons.module.css';

const VisualizationModeButtons: React.FC = () => {
  const { visualizationMode, setPrimaryMode } = useVisualizationMode();

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
    </div>
  );
};

export default VisualizationModeButtons;
