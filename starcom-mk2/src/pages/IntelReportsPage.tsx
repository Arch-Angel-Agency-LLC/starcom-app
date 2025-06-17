// AI-NOTE: Artifact-driven route/page for intelligence reports and overlays.
// This page displays the IntelReportList and IntelOverlay components.
// See artifacts/intel-report-api-integration.artifact and overlays artifact for integration plan.
// TODO: Integrate with Solana/secure backend and live overlays when available.

import React, { useEffect, useState } from 'react';
import { IntelReportList } from '../components/Intel/IntelReportList';
import { IntelOverlay } from '../components/Intel/overlays/IntelOverlay';
import { fetchIntelReports } from '../api/intelligence';
import type { IntelReportOverlayMarker } from '../interfaces/IntelReportOverlay';

const IntelReportsPage: React.FC = () => {
  const [markers, setMarkers] = useState<IntelReportOverlayMarker[]>([]);
  useEffect(() => {
    fetchIntelReports().then((data: any[]) => {
      // Map to overlay marker interface
      const overlayMarkers = data.map((r) => ({
        pubkey: r.pubkey || '',
        title: r.title || r.label || '',
        content: r.content || '',
        tags: r.tags || [],
        latitude: r.lat ?? r.latitude ?? 0,
        longitude: r.long ?? r.longitude ?? 0,
        timestamp: r.timestamp || Date.parse(r.date || '') || 0,
        author: r.author || '',
      }));
      setMarkers(overlayMarkers);
    });
  }, []);
  return (
    <div>
      <h1>Intelligence Exchange Market</h1>
      <IntelReportList />
      <IntelOverlay markers={markers} />
    </div>
  );
};

export default IntelReportsPage;
