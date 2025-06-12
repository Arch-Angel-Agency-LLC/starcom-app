// src/components/Globe/Globe.tsx
import React, { useState, useEffect, useRef } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { useGlobeContext } from '../../context/GlobeContext';
import { useVisualizationMode } from '../../context/VisualizationModeContext';
import * as THREE from 'three';

// Define types for config
interface VisualizationConfig {
  globeImageUrl: string;
  eventData: object[];
}

const visualizationConfig = {
  CyberCommand: {
    IntelReports: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-dark.jpg',
      eventData: [/* Example IntelReports events */],
    },
    Timelines: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-dark.jpg',
      eventData: [/* Example Timelines events */],
    },
    CrisisZones: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-dark.jpg',
      eventData: [/* Example CrisisZones events */],
    },
  },
  GeoPolitical: {
    NationalTerritories: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      eventData: [/* Example NationalTerritories events */],
    },
    DiplomaticEvents: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      eventData: [/* Example DiplomaticEvents events */],
    },
    ResourceZones: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      eventData: [/* Example ResourceZones events */],
    },
  },
  EcoNatural: {
    SpaceWeather: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-day.jpg',
      eventData: [/* Example SpaceWeather events */],
    },
    EcologicalDisasters: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-day.jpg',
      eventData: [/* Example EcologicalDisasters events */],
    },
    EarthWeather: {
      globeImageUrl: '//unpkg.com/three-globe/example/img/earth-day.jpg',
      eventData: [/* Example EarthWeather events */],
    },
  },
};

const GlobeView: React.FC = () => {
  const [globeData, setGlobeData] = useState<object[]>([]);
  const globeRef = useRef<GlobeMethods>();
  const { setFocusLocation } = useGlobeContext();
  const { visualizationMode } = useVisualizationMode();

  // Type-safe access to config
  let currentConfig: VisualizationConfig | undefined;
  const modeConfig = (visualizationConfig as Record<string, Record<string, VisualizationConfig>>)[visualizationMode.mode];
  if (modeConfig && visualizationMode.subMode in modeConfig) {
    currentConfig = modeConfig[visualizationMode.subMode];
  } else {
    currentConfig = undefined;
  }

  useEffect(() => {
    const handleResize = () => {
      if (globeRef.current) {
        globeRef.current.renderer().setSize(window.innerWidth, window.innerHeight);
        const camera = globeRef.current.camera() as THREE.PerspectiveCamera;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentConfig) {
      setGlobeData(currentConfig.eventData);
    } else {
      console.warn(`Unknown visualization mode or sub-mode: ${visualizationMode.mode}, ${visualizationMode.subMode}`);
    }
  }, [visualizationMode, currentConfig]);

  const handleGlobeClick = ({ lat, lng }: { lat: number; lng: number }) => {
    const newMarker = { lat, lng, size: 0.5, color: 'red' };
    setGlobeData((prevData) => [...prevData, newMarker]);
    setFocusLocation({ lat, lng });

    if (globeRef.current) {
      globeRef.current.pointOfView({ lat, lng, altitude: 1.5 });
    }
  };

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      <Globe
        ref={globeRef}
        pointsData={globeData}
        pointAltitude="size"
        pointColor="color"
        globeImageUrl={currentConfig?.globeImageUrl}
        onGlobeClick={handleGlobeClick}
      />
    </div>
  );
};

export default GlobeView;