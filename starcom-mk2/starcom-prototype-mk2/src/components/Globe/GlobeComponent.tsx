import React, { useState, useEffect } from 'react';
import Globe from 'react-globe.gl';
import TimeScrubber from './TimeScrubber';

interface DataPoint {
  lat: number;
  lng: number;
  size: number;
  color: string;
  info: string;
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number; // Renamed from 'intensity' to 'weight'
}

const GlobeComponent: React.FC = () => {
  // State Hooks
  const [data, setData] = useState<DataPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [showMarkers, setShowMarkers] = useState(true);
  const [timeValue, setTimeValue] = useState(0);

  // Static Heatmap Data
  const heatmapData: HeatmapPoint[] = [
    { lat: 40.7128, lng: -74.006, weight: 0.6 }, // NYC
    { lat: 34.0522, lng: -118.2437, weight: 0.5 }, // LA
    { lat: 48.8566, lng: 2.3522, weight: 0.4 }, // Paris
  ];

  // Simulate time-based data changes
  useEffect(() => {
    const generateTimeBasedData = (time: number): DataPoint[] => {
      return [
        { lat: 37.7749, lng: -122.4194, size: 1 + time / 100, color: 'red', info: `San Francisco at time ${time}` },
        { lat: 51.5074, lng: -0.1278, size: 1.5 + time / 100, color: 'blue', info: `London at time ${time}` },
        { lat: 35.6895, lng: 139.6917, size: 1.2 + time / 100, color: 'green', info: `Tokyo at time ${time}` },
      ];
    };

    setData(generateTimeBasedData(timeValue));
  }, [timeValue]);

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      {/* UI Controls */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '10px',
          display: 'flex',
          gap: '10px',
        }}
      >
        <button
          style={{
            padding: '5px 10px',
            background: showMarkers ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
          onClick={() => setShowMarkers(!showMarkers)}
        >
          {showMarkers ? 'Hide Markers' : 'Show Markers'}
        </button>
      </div>

      {/* Time Scrubber */}
      <TimeScrubber onChange={(value) => setTimeValue(value)} />

      {/* Globe */}
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        pointsData={showMarkers ? data : []}
        pointAltitude="size"
        pointColor="color"
        onPointHover={(point) => setHoveredPoint(point as DataPoint | null)}
        heatmapsData={[heatmapData]} // Heatmap data as array
        heatmapPointLat="lat"
        heatmapPointLng="lng"
        heatmapPointWeight="weight" // Corrected property name
        heatmapTopAltitude={0.7} // Altitude of the heatmap
        heatmapsTransitionDuration={3000} // Smooth transitions
      />

      {/* Tooltip */}
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '5px',
            pointerEvents: 'none',
          }}
        >
          {hoveredPoint.info}
        </div>
      )}
    </div>
  );
};

export default GlobeComponent;