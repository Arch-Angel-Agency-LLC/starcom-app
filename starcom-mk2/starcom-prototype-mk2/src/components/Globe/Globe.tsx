// src/components/Globe/Globe.tsx
import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { useGlobeContext } from '../../context/GlobeContext';
import { useVisualizationMode } from '../../context/VisualizationModeContext';

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
  const [globeData, setGlobeData] = useState<any[]>([]);
  const globeRef = useRef<any>(null);
  const { setFocusLocation } = useGlobeContext();
  const { visualizationMode } = useVisualizationMode();

  useEffect(() => {
    const handleResize = () => {
      if (globeRef.current) {
        globeRef.current.renderer().setSize(window.innerWidth, window.innerHeight);
        globeRef.current.camera().aspect = window.innerWidth / window.innerHeight;
        globeRef.current.camera().updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentConfig = visualizationConfig[visualizationMode.mode][visualizationMode.subMode];

  useEffect(() => {
    if (currentConfig) {
      setGlobeData(currentConfig.eventData);
    } else {
      console.warn(`Unknown visualization mode or sub-mode: ${visualizationMode.mode}, ${visualizationMode.subMode}`);
    }
  }, [visualizationMode]);

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