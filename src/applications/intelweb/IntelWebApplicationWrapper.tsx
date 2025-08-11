/**
 * IntelWebApplicationWrapper
 * 
 * Adapts IntelWebApplication to work with the Enhanced Application Router
 * by providing the ApplicationContext interface compatibility.
 */

import React, { useEffect, useState } from 'react';
import { ApplicationContext } from '../../components/Router/EnhancedApplicationRouter';
import { IntelWebApplication } from './IntelWebApplication';
import './IntelWeb.css';
import { IntelWebIntegrationService } from '../../services/intelweb/IntelWebIntegrationService';
import { IntelReportData } from '../../models/IntelReportData';
import { VirtualFileSystem } from '../../types/DataPack';

// Wrapper component that adapts IntelWebApplication to ApplicationContext
export const IntelWebApplicationWrapper: React.FC<ApplicationContext> = (context) => {
  // Build a small demo vault from IntelReportData using the integration service
  const [vault, setVault] = useState<VirtualFileSystem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const integration = new IntelWebIntegrationService();
        const demoReports: IntelReportData[] = [
          {
            title: 'Regional Threat Assessment',
            content: 'Initial analysis of activities across the region. Entities involved: Acme Corporation, John Doe.',
            tags: ['analysis', 'threat-assessment', 'q3-2025'],
            latitude: 40.7128,
            longitude: -74.006,
            timestamp: Date.now() - 86400000,
            author: 'analyst_001',
            classification: 'SECRET',
            confidence: 82,
            summary: 'Elevated activity with multiple corroborating sources',
            // Ad-hoc entities list for mapping (not part of IntelReportData):
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...( { entities: ['Acme Corporation', 'John Doe'] } as any )
          },
          {
            title: 'Financial Movement Report',
            content: 'Observed transfers to offshore accounts linked to Acme Corporation.',
            tags: ['finance', 'osint'],
            latitude: 25.7617,
            longitude: -80.1918,
            timestamp: Date.now() - 43200000,
            author: 'analyst_002',
            classification: 'CONFIDENTIAL',
            confidence: 70,
            summary: 'Suspicious fund flows detected',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...( { entities: ['Acme Corporation'] } as any )
          }
        ];

        const result = await integration.buildFromReports(demoReports);
        if (!mounted) return;
        setVault(result.vfs);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to build demo vault');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <div style={{ padding: 16, color: 'var(--intel-text)' }}>Preparing IntelWeb demo vault…</div>;
  }

  if (error) {
    return <div style={{ padding: 16, color: 'var(--intel-text)' }}>Error: {error}</div>;
  }
  
  return (
    <IntelWebApplication 
      // packageId can be passed through context if needed
      packageId={typeof context.packageId === 'string' ? context.packageId : undefined}
      // Provide the prepared vault to bootstrap the app
      initialVault={vault || undefined}
    />
  );
};

export default IntelWebApplicationWrapper;
