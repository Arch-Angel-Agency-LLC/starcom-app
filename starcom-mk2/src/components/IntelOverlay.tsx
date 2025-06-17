// AI-NOTE: Artifact-driven UI stub for intelligence overlays (SIGINT/HUMINT).
// This component will display intelligence markers on the globe or map UI.
// See artifacts/intel-report-overlays.artifact for overlay types, data sources, and migration plan.
// TODO: Integrate with live Solana/secure backend overlays when available.

import React from 'react';

// Placeholder props for overlay markers
interface IntelOverlayProps {
  markers?: Array<{ lat: number; lng: number; type: string; label?: string }>;
}

export const IntelOverlay: React.FC<IntelOverlayProps> = ({ markers = [] }) => {
  if (markers.length === 0) return <div>No intelligence markers to display.</div>;

  return (
    <div>
      <h3>Intelligence Overlay</h3>
      <ul>
        {markers.map((marker, idx) => (
          <li key={idx}>
            [{marker.type}] {marker.label || 'Unknown'} @ ({marker.lat}, {marker.lng})
          </li>
        ))}
      </ul>
    </div>
  );
};
