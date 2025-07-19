// SolarSystemDebugPanel.tsx - Debug panel to show solar system integration status

import React from 'react';

interface SolarSystemDebugState {
  isActive: boolean;
  currentScale: string;
  sunVisible: boolean;
  cameraDistance: number;
  sunState?: {
    isVisible: boolean;
    scale: string;
    position: { x: number; y: number; z: number };
    radius: number;
  };
  planetsVisible?: number;
  activePlanets?: string[];
}

interface SolarSystemDebugPanelProps {
  solarSystemState: SolarSystemDebugState | null;
  style?: React.CSSProperties;
}

export const SolarSystemDebugPanel: React.FC<SolarSystemDebugPanelProps> = ({
  solarSystemState,
  style = {}
}) => {
  const defaultStyle: React.CSSProperties = {
    position: 'fixed',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#00ff00',
    padding: '10px',
    borderRadius: '5px',
    fontFamily: 'monospace',
    fontSize: '12px',
    zIndex: 1000,
    minWidth: '200px',
    ...style
  };

  if (!solarSystemState) {
    return (
      <div style={defaultStyle}>
        <div>🌞 Solar System Debug</div>
        <div style={{ color: '#ff6666' }}>Not initialized</div>
      </div>
    );
  }

  return (
    <div style={defaultStyle}>
      <div>🌞 Solar System Debug</div>
      <div>Status: {solarSystemState.isActive ? '✅ Active' : '❌ Inactive'}</div>
      <div>Scale: {solarSystemState.currentScale || 'unknown'}</div>
      <div>Camera Distance: {solarSystemState.cameraDistance?.toFixed?.(1) || 'N/A'}</div>
      <div>Sun Visible: {solarSystemState.sunVisible ? '☀️ Yes' : '🌙 No'}</div>
      
      {solarSystemState.planetsVisible !== undefined && (
        <div>Planets: {solarSystemState.planetsVisible} visible</div>
      )}
      
      {solarSystemState.activePlanets && solarSystemState.activePlanets.length > 0 && (
        <div style={{ fontSize: '10px' }}>
          Active: {solarSystemState.activePlanets.join(', ')}
        </div>
      )}
      
      {solarSystemState.sunState && (
        <div style={{ marginTop: '5px', fontSize: '11px' }}>
          <div>Sun Radius: {solarSystemState.sunState.radius?.toFixed?.(1) || 'N/A'}</div>
          <div>Sun Position: ({solarSystemState.sunState.position?.x?.toFixed?.(0) || '0'}, {solarSystemState.sunState.position?.y?.toFixed?.(0) || '0'}, {solarSystemState.sunState.position?.z?.toFixed?.(0) || '0'})</div>
        </div>
      )}
      
      <div style={{ marginTop: '5px', fontSize: '10px', color: '#888' }}>
        Scale Ranges:
        <div>Earth-Local: 150-1000</div>
        <div>Earth-Space: 200-8000</div>
        <div>Inner-Solar: 500-15000</div>
        <div>Solar-System: 1000-50000</div>
      </div>
    </div>
  );
};
