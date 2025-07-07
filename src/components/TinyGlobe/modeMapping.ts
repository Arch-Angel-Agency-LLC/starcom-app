// src/components/TinyGlobe/modeMapping.ts
import { VisualizationMode } from '../../context/VisualizationModeContext';

export function mapVisualizationModeToTinyGlobeMode(mode: VisualizationMode): 'hologram' | 'dayNight' | 'blueMarble' {
  switch (mode.mode) {
    case 'CyberCommand':
      if (mode.subMode === 'IntelReports') return 'hologram';
      return 'dayNight';
    case 'GeoPolitical':
      return 'blueMarble';
    case 'EcoNatural':
      if (mode.subMode === 'SpaceWeather') return 'blueMarble';
      return 'dayNight';
    default:
      console.warn('Unknown VisualizationMode:', mode);
      return 'dayNight'; // fallback
  }
}
