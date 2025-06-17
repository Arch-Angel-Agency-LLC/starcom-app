// AI-NOTE: Artifact-driven UI stub for intelligence overlays (SIGINT/HUMINT).
// This component will display intelligence markers on the globe or map UI.
// See artifacts/intel-report-overlays.artifact for overlay types, data sources, and migration plan.
// TODO: Integrate with live Solana/secure backend overlays when available.

import React from 'react';
import type { IntelReportOverlayMarker } from '../../../interfaces/IntelReportOverlay';

// Placeholder props for overlay markers
interface IntelOverlayProps {
  markers?: IntelReportOverlayMarker[];
}

export const IntelOverlay: React.FC<IntelOverlayProps> = ({ markers = [] }) => {
  if (markers.length === 0) return <div>No intelligence markers to display.</div>;

  return (
    <div>
      <h3>Intelligence Overlay</h3>
      <ul>
        {markers.map((marker) => (
          <li key={marker.pubkey}>
            <strong>{marker.title}</strong> — {marker.tags.join(', ')}<br />
            <span>Location: {marker.latitude}, {marker.longitude}</span><br />
            <span>Type: {marker.tags[0]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
