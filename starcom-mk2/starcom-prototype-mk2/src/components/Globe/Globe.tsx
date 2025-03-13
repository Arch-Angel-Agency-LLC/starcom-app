// src/components/Globe/Globe.tsx
import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';

// Assuming you have a GlobeContext for sharing state
import { useGlobeContext } from '../../context/GlobeContext';

const GlobeView: React.FC = () => {
  const [globeData, setGlobeData] = useState<any[]>([]); // Markers data
  const globeRef = useRef<any>(null);
  const { setFocusLocation } = useGlobeContext(); // Context to share focus

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
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        onGlobeClick={handleGlobeClick} // Add click handler
      />
    </div>
  );
};

export default GlobeView;