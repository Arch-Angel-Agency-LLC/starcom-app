import React, { useEffect } from 'react';
import Globe from 'react-globe.gl';
import Legend from '../HUD/Legend';
import Overlay from '../HUD/Overlay';
import TimeScrubber from '../HUD/TimeScrubber';
import { useTimeData } from '../../context/TimeDataProvider';

const GlobeComponent: React.FC = () => {
  const { currentTime, isLive, setCurrentTime, toggleLive, fetchDataForTime } = useTimeData();
  const [globeData, setGlobeData] = React.useState<any[]>([]);

  useEffect(() => {
    const updateData = async () => {
      await fetchDataForTime(currentTime);
      const data = await fetchGlobeDataForTime(currentTime);
      setGlobeData(data);
    };

    updateData();
  }, [currentTime]);

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      <Legend
        title="Data Legend"
        items={[
          { label: 'Conflict Zone', color: 'red', size: 2 },
          { label: 'Weather Marker', color: 'blue', size: 1 },
          { label: 'High Intensity', color: 'orange' },
          { label: 'Medium Intensity', color: 'yellow' },
          { label: 'Low Intensity', color: 'green' },
        ]}
        maxSize={2}
        collapsible={true}
      />
      <Overlay
        stats={[
          { label: 'Active Conflict Zones', value: 42 },
          { label: 'Live Data Points', value: 132 },
          { label: 'Users Online', value: 25 },
        ]}
        notifications={[
          { id: '1', message: 'New conflict detected in Middle East', type: 'info', priority: 1, timestamp: '2024-12-25 14:30' },
          { id: '2', message: 'Weather alert in NYC', type: 'warning', priority: 2, timestamp: '2024-12-25 14:35' },
          { id: '3', message: 'Data fetch error: Check logs', type: 'error', priority: 1, timestamp: '2024-12-25 14:40' },
        ]}
        onNotificationClick={(id) => console.log(`Notification ${id} clicked`)}
        onClearNotifications={() => console.log('Notifications cleared')}
        onStatsUpdate={async () => {
          return [
            { label: 'Active Conflict Zones', value: 45 },
            { label: 'Live Data Points', value: 140 },
            { label: 'Users Online', value: 30 },
          ];
        }}
        theme="dark"
      />
      <TimeScrubber
        currentTime={currentTime}
        isLive={isLive}
        onTimeChange={(value: number) => setCurrentTime(value)}
        onToggleLive={toggleLive}
      />
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

async function fetchGlobeDataForTime(time: number): Promise<any[]> {
  console.log(`Fetching data for time: ${time}`);
  return [{ lat: 10, lng: 20, size: 1, color: 'blue' }];
}