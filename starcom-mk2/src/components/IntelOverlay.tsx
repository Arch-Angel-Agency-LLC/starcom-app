/**
 * Intelligence Overlay Component
 * 
 * Professional implementation for displaying intelligence markers on maps and globes.
 * This component will integrate with live intelligence data sources when available.
 */

import React from 'react';

interface IntelOverlayProps {
  markers?: Array<{ lat: number; lng: number; type: string; label?: string }>;
  className?: string;
}

export const IntelOverlay: React.FC<IntelOverlayProps> = ({ markers = [], className }) => {
  if (markers.length === 0) {
    return (
      <div className={className} style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#64748b',
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(64, 224, 255, 0.3)',
        borderRadius: '8px'
      }}>
        📍 No intelligence markers to display
      </div>
    );
  }

  return (
    <div className={className} style={{ padding: '1rem' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem', 
        marginBottom: '1rem',
        color: '#0ea5e9',
        fontSize: '1.1rem',
        fontWeight: 600
      }}>
        🎯 Intelligence Overlay ({markers.length} markers)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {markers.map((marker, idx) => (
          <div 
            key={idx}
            style={{
              padding: '0.8rem',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(64, 224, 255, 0.3)',
              borderRadius: '6px',
              color: '#e2e8f0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>
                {marker.label || `${marker.type.toUpperCase()} Signal`}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {marker.lat.toFixed(2)}°, {marker.lng.toFixed(2)}°
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Type: {marker.type}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
