import React, { useState, useEffect } from 'react';
import Globe from 'react-globe.gl';

interface DataPoint {
  lat: number;
  lng: number;
  size: number;
  color: string;
}

const GlobeComponent: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    // Example GeoJSON data (replace with real data later)
    const geoData: DataPoint[] = [
      { lat: 37.7749, lng: -122.4194, size: 1, color: 'red' }, // San Francisco
      { lat: 51.5074, lng: -0.1278, size: 1.5, color: 'blue' }, // London
      { lat: 35.6895, lng: 139.6917, size: 1.2, color: 'green' }, // Tokyo
    ];
    setData(geoData);
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        pointsData={data}
        pointAltitude="size"
        pointColor="color"
        onPointHover={(point) => {
          const dataPoint = point as DataPoint | null; // Cast point to DataPoint
          if (dataPoint) {
            console.log(`Hovered on point at: ${dataPoint.lat}, ${dataPoint.lng}`);
          }
        }}
        onPointClick={(point) => {
          const dataPoint = point as DataPoint; // Cast point to DataPoint
          alert(`Clicked on point at: ${dataPoint.lat}, ${dataPoint.lng}`);
        }}
      />
    </div>
  );
};

export default GlobeComponent;