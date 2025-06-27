// AI-NOTE: Artifact-driven UI stub for intelligence report list.
// This component fetches and displays intelligence reports using the secure API stub.
// See artifacts/intel-report-api-integration.artifact and overlays artifact for integration plan.
// TODO: Integrate with Solana/secure backend and overlays when live.

import React, { useEffect, useState } from 'react';
import { fetchIntelReports } from '../../api/intelligence';
import type { IntelReportOverlayMarker } from '../../interfaces/IntelReportOverlay';

export const IntelReportList: React.FC = () => {
  const [reports, setReports] = useState<IntelReportOverlayMarker[]>([]);
  const [loading, setLoading] = useState(true);

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
      setReports(overlayMarkers);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading intelligence reports...</div>;
  if (reports.length === 0) return <div>No intelligence reports found.</div>;

  return (
    <div>
      <h2>Intelligence Reports</h2>
      <ul>
        {reports.map((report, idx) => (
          <li key={report.pubkey || idx}>
            <strong>{report.title}</strong> — {report.tags.join(', ')}<br />
            <em>{report.content}</em><br />
            <span>Location: {report.latitude}, {report.longitude}</span><br />
            <span>Author: {report.author}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
