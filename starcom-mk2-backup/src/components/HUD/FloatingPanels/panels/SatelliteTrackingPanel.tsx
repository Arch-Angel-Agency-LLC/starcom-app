import React, { useState, useEffect } from 'react';
import styles from './SatelliteTrackingPanel.module.css';

interface SatelliteTrackingPanelProps {
  data?: {
    satellites?: Array<{
      id: string;
      name: string;
      altitude: number;
      velocity: number;
      lat: number;
      lng: number;
      status: 'operational' | 'maintenance' | 'offline';
      purpose: string;
      nextPass?: string;
    }>;
  };
}

const SatelliteTrackingPanel: React.FC<SatelliteTrackingPanelProps> = ({ data }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedSatellite, setSelectedSatellite] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const satellites = data?.satellites || [
    {
      id: 'ISS',
      name: 'International Space Station',
      altitude: 408,
      velocity: 27600,
      lat: 45.2,
      lng: -75.6,
      status: 'operational' as const,
      purpose: 'Research Laboratory',
      nextPass: '23:42 UTC'
    },
    {
      id: 'HUBBLE',
      name: 'Hubble Space Telescope',
      altitude: 547,
      velocity: 27300,
      lat: 28.5,
      lng: -80.6,
      status: 'operational' as const,
      purpose: 'Space Observatory',
      nextPass: '02:15 UTC'
    },
    {
      id: 'NOAA-20',
      name: 'NOAA-20 Weather Satellite',
      altitude: 824,
      velocity: 27000,
      lat: 65.8,
      lng: 120.4,
      status: 'operational' as const,
      purpose: 'Weather Monitoring',
      nextPass: '01:33 UTC'
    },
    {
      id: 'GPS-IIF-12',
      name: 'GPS Block IIF-12',
      altitude: 20200,
      velocity: 14000,
      lat: 35.0,
      lng: -45.2,
      status: 'maintenance' as const,
      purpose: 'Navigation',
      nextPass: '04:27 UTC'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return '#00ff88';
      case 'maintenance': return '#ffaa00';
      case 'offline': return '#ff4444';
      default: return '#888888';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return '🛰️';
      case 'maintenance': return '⚠️';
      case 'offline': return '❌';
      default: return '❓';
    }
  };

  const formatTime = (date: Date) => {
    return date.toUTCString().slice(17, 25) + ' UTC';
  };

  return (
    <div className={styles.satellitePanel}>
      <div className={styles.statusBar}>
        <div className={styles.timestamp}>
          {formatTime(currentTime)}
        </div>
      </div>

      <div className={styles.trackingGrid}>
        {satellites.map((satellite) => (
          <div 
            key={satellite.id}
            className={`${styles.satelliteCard} ${selectedSatellite === satellite.id ? styles.selected : ''}`}
            onClick={() => setSelectedSatellite(selectedSatellite === satellite.id ? null : satellite.id)}
          >
            <div className={styles.satelliteHeader}>
              <div className={styles.statusIcon} style={{ color: getStatusColor(satellite.status) }}>
                {getStatusIcon(satellite.status)}
              </div>
              <div className={styles.satelliteId}>{satellite.id}</div>
              <div className={styles.status} style={{ color: getStatusColor(satellite.status) }}>
                {satellite.status.toUpperCase()}
              </div>
            </div>

            <div className={styles.satelliteName}>{satellite.name}</div>
            <div className={styles.purpose}>{satellite.purpose}</div>

            <div className={styles.telemetryData}>
              <div className={styles.dataRow}>
                <span className={styles.label}>ALT:</span>
                <span className={styles.value}>{satellite.altitude.toLocaleString()} km</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.label}>VEL:</span>
                <span className={styles.value}>{satellite.velocity.toLocaleString()} km/h</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.label}>LAT:</span>
                <span className={styles.value}>{satellite.lat.toFixed(2)}°</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.label}>LNG:</span>
                <span className={styles.value}>{satellite.lng.toFixed(2)}°</span>
              </div>
            </div>

            {selectedSatellite === satellite.id && (
              <div className={styles.expandedInfo}>
                <div className={styles.nextPass}>
                  <span className={styles.label}>Next Pass:</span>
                  <span className={styles.passTime}>{satellite.nextPass}</span>
                </div>
                <div className={styles.quickActions}>
                  <button className={styles.actionBtn}>📡 Track</button>
                  <button className={styles.actionBtn}>📊 Telemetry</button>
                  <button className={styles.actionBtn}>🎯 Focus</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.trackingStatus}>
          <div className={styles.statusLight} style={{ backgroundColor: '#00ff88' }}></div>
          <span>TRACKING {satellites.filter(s => s.status === 'operational').length} ACTIVE</span>
        </div>
        <div className={styles.commandPrompt}>
          <span className={styles.prompt}>SAT&gt;</span>
          <span className={styles.command}>monitor_all</span>
          <span className={styles.cursor}>_</span>
        </div>
      </div>
    </div>
  );
};

export default SatelliteTrackingPanel;
