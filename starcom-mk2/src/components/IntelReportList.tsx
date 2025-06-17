// AI-NOTE: Artifact-driven UI stub for intelligence report list.
// This component fetches and displays intelligence reports using the secure API stub.
// See artifacts/intel-report-api-integration.artifact and overlays artifact for integration plan.
// TODO: Integrate with Solana/secure backend and overlays when live.

import React, { useEffect, useState } from 'react';
import { fetchIntelReports } from '../api/intelligence';
import type { IntelReport } from '../models/IntelReport';

export const IntelReportList: React.FC = () => {
  const [reports, setReports] = useState<IntelReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntelReports().then((data) => {
      setReports(data);
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
          <li key={idx}>
            <strong>{report.title}</strong> — {report.date || 'Unknown date'}
          </li>
        ))}
      </ul>
    </div>
  );
};
