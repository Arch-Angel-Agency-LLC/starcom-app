// src/components/Globe/Globe.tsx
import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';

// Assuming you have a GlobeContext for sharing state
import { useGlobeContext } from '../../context/GlobeContext';
import { useVisualizationMode } from '../../context/VisualizationModeContext';

const GlobeView: React.FC = () => {
  const [globeData, setGlobeData] = useState<any[]>([]); // Markers data
  const globeRef = useRef<any>(null);
  const { setFocusLocation } = useGlobeContext(); // Context to share focus
  const { visualizationMode } = useVisualizationMode(); // Access global visualization mode

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

  useEffect(() => {
    if (globeRef.current) {
      const globeInstance = globeRef.current;

      // Check if the globe instance has a method to set the globe image URL
      if (typeof globeInstance.setGlobeImageUrl === 'function') {
        switch (visualizationMode) {
          case 'geoMagnetics':
            globeInstance.setGlobeImageUrl('//unpkg.com/three-globe/example/img/earth-day.jpg');
            break;
          case 'intelReports':
            globeInstance.setGlobeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg');
            break;
          case 'solarSystem':
            globeInstance.setGlobeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
            break;
          default:
            console.warn(`Unknown visualization mode: ${visualizationMode}`);
            break;
        }
      } else {
        console.error('setGlobeImageUrl is not a function on the globe instance.');
      }
    }
  }, [visualizationMode]);

  useEffect(() => {
    if (globeRef.current) {
      const globeInstance = globeRef.current;

      // Ensure the globe instance is properly initialized
      if (!globeInstance.scene || !globeInstance.renderer) {
        console.error('Globe instance is not fully initialized.');
        return;
      }

      // Add additional error handling for Intel Reports and Solar System modes
      if (visualizationMode === 'intelReports' || visualizationMode === 'solarSystem') {
        try {
          // Perform any specific setup for these modes
          console.log(`Switching to ${visualizationMode} mode.`);
        } catch (error) {
          console.error(`Error while switching to ${visualizationMode} mode:`, error);
        }
      }
    }
  }, [visualizationMode]);

  const handleGlobeClick = ({ lat, lng }: { lat: number; lng: number }) => {
    // Add a marker at the clicked location
    const newMarker = { lat, lng, size: 0.5, color: 'red' };
    setGlobeData([newMarker]); // For now, single marker; extend for multiple if needed

    // Update focus location in context
    setFocusLocation({ lat, lng });

    // Optionally, rotate the globe to focus on the clicked location
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
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg" // Default texture
        onGlobeClick={handleGlobeClick} // Add click handler
      />
    </div>
  );
};

export default GlobeView;