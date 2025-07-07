// AI-NOTE: Enhanced Intelligence Reports page migrated to use IntelReports3D components.
// This page now uses the new IntelReports3D Interactive components with legacy compatibility.

import React, { useEffect, useState, useMemo } from 'react';
import { IntelReportList } from '../components/IntelReports3D/Interactive';
import { IntelOverlay } from '../components/Intel/overlays/IntelOverlay';
import { fetchIntelReports } from '../api/intelligence';
import type { IntelReportOverlayMarker } from '../interfaces/IntelReportOverlay';
import type { IntelReport3DData } from '../types/intelligence/IntelReportTypes';

// Simple adapter to convert legacy markers to new format
const convertMarkersToReports3D = (markers: IntelReportOverlayMarker[]): IntelReport3DData[] => {
  return markers.map(marker => ({
    id: marker.pubkey || `marker-${Date.now()}-${Math.random()}`,
    title: marker.title || 'Untitled Report',
    classification: 'UNCLASSIFIED' as const,
    source: marker.author || 'Unknown',
    timestamp: new Date(marker.timestamp || Date.now()),

    location: {
      lat: marker.latitude || 0,
      lng: marker.longitude || 0,
      altitude: 0
    },

    content: {
      summary: marker.content || '',
      details: marker.content || '',
      keywords: marker.tags || []
    },

    visualization: {
      markerType: 'standard' as const,
      color: '#00ff88',
      size: 1.0,
      opacity: 0.8,
      priority: 'medium' as const,
      animation: {
        enabled: true,
        type: 'pulse' as const,
        duration: 2000
      }
    },

    metadata: {
      tags: marker.tags || [],
      confidence: 0.85,
      reliability: 0.8,
      freshness: 0.9,
      category: 'operational' as const,
      analyst: marker.author || 'Unknown'
    }
  }));
};

const IntelReportsPage: React.FC = () => {
  const [markers, setMarkers] = useState<IntelReportOverlayMarker[]>([]);

  // Convert markers to new format for the new component
  const reportsForNewComponent = useMemo(() => convertMarkersToReports3D(markers), [markers]);
  useEffect(() => {
    fetchIntelReports().then((data: unknown[]) => {
      // Map to overlay marker interface
      const overlayMarkers = data.map((r) => {
        const record = r as Record<string, unknown>;
        return {
          pubkey: (record.pubkey as string) || '',
          title: (record.title as string) || (record.label as string) || '',
          content: (record.content as string) || '',
          tags: (record.tags as string[]) || [],
          latitude: (record.lat as number) ?? (record.latitude as number) ?? 0,
          longitude: (record.long as number) ?? (record.longitude as number) ?? 0,
          timestamp: (record.timestamp as number) || Date.parse((record.date as string) || '') || 0,
          author: (record.author as string) || '',
        };
      });
      setMarkers(overlayMarkers);
    });
  }, []);
  return (
    <div>
      <h1>Intelligence Exchange Market</h1>
      <IntelReportList 
        reports={reportsForNewComponent} 
        loading={false}
        multiSelect={true}
        virtualized={true}
      />
      <IntelOverlay markers={markers} />
    </div>
  );
};

export default IntelReportsPage;
