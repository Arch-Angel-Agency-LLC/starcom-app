import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';

const GlobeView: React.FC = () => {
  const [globeData] = useState<any[]>([]);
  const globeRef = useRef<any>(null);

  useEffect(() => {
    const handleResize = () => {
      if (globeRef.current) {
        globeRef.current.renderer().setSize(window.innerWidth, window.innerHeight);
        globeRef.current.camera().aspect = window.innerWidth / window.innerHeight;
        globeRef.current.camera().updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call to set dimensions

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      <Globe
        ref={globeRef}
        pointsData={globeData}
        pointAltitude="size"
        pointColor="color"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
      />
    </div>
  );
};

export default GlobeView;