import React, { useState } from 'react';
import Globe from 'react-globe.gl';
import Legend from '../HUD/Legend/Legend';
import Overlay from '../HUD/Overlay/Overlay';
import TimeScrubber from '../HUD/TimeScrubber/TimeScrubber';
import { useTimeData } from '../../context/TimeDataProvider';
// import { fetchAllConflictZones } from '../../services/api/FetchConflictZoneFeeds';
// import { fetchWeatherData } from '../../services/api/FetchWeatherDataFeeds';

const GlobeComponent: React.FC = () => {
  const { currentTime, isLive, setCurrentTime, toggleLive } = useTimeData();
  const [globeData] = useState<any[]>([]);
  const [showConflicts, setShowConflicts] = useState(true);
  const [showWeather, setShowWeather] = useState(true);

  // useEffect(() => {
  //   const updateData = async () => {
  //     await fetchDataForTime(currentTime);

  //     const conflictData = showConflicts ? await fetchAllConflictZones() : [];
  //     const weatherData = showWeather
  //       ? [
  //           await fetchWeatherData(40.7128, -74.006), // NYC
  //           await fetchWeatherData(34.0522, -118.2437), // LA
  //         ].map((weather) => ({
  //           lat: weather.lat,
  //           lng: weather.lng,
  //           size: 1,
  //           color: 'blue',
  //           info: `Temp: ${weather.temperature}°C`,
  //         }))
  //       : [];

  //     setGlobeData([...conflictData, ...weatherData]);
  //   };

  //   updateData();
  // }, [currentTime, showConflicts, showWeather]);

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      {/* Legend for Layer Toggles */}
      <Legend
        title="Data Layers"
        items={[
          { label: 'Conflict Zones', color: 'red', toggle: showConflicts, onToggle: setShowConflicts },
          { label: 'Weather Markers', color: 'blue', toggle: showWeather, onToggle: setShowWeather },
        ]}
        maxSize={2}
        collapsible={true}
      />

      {/* Overlay and Time Scrubber */}
      <Overlay
        stats={[
          { label: 'Active Conflict Zones', value: showConflicts ? globeData.filter((d) => d.color === 'red').length : 0 },
          { label: 'Weather Markers', value: showWeather ? globeData.filter((d) => d.color === 'blue').length : 0 },
        ]}
      />
      <TimeScrubber
        currentTime={currentTime}
        isLive={isLive}
        onTimeChange={(value: number) => setCurrentTime(value)}
        onToggleLive={toggleLive}
      />

      {/* Globe */}
      <Globe
        pointsData={globeData}
        pointAltitude="size"
        pointColor="color"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
      />
    </div>
  );
};

export default GlobeComponent;