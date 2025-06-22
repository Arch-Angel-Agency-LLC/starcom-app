/**
 * Intelligence Report List Component
 * 
 * Professional implementation for displaying intelligence reports.
 * This component will integrate with secure backend services when available.
 */

import React, { useEffect, useState } from 'react';
import { fetchIntelReports } from '../api/intelligence';
import type { IntelReport } from '../models/IntelReport';

interface IntelReportListProps {
  className?: string;
}

export const IntelReportList: React.FC<IntelReportListProps> = ({ className }) => {
  const [reports, setReports] = useState<IntelReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIntelReports()
      .then((data) => {
        setReports(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load intelligence reports');
        setLoading(false);
        console.error('Intelligence reports fetch error:', err);
      });
  }, []);

  if (loading) {
    return (
      <div className={className} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        🔄 Loading intelligence reports...
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        ⚠️ {error}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className={className} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        📄 No intelligence reports available
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
        🔍 Intelligence Reports ({reports.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {reports.map((report, idx) => (
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
            <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>
              {report.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {report.date || 'Date not specified'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
