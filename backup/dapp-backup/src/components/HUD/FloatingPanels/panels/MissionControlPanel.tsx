import React, { useState, useEffect } from 'react';
import { FloatingPanelData } from '../FloatingPanelContext';
import styles from './MissionControlPanel.module.css';

interface MissionControlPanelProps {
  data?: FloatingPanelData;
}

interface MissionData {
  operationId: string;
  status: 'ACTIVE' | 'STANDBY' | 'CRITICAL' | 'NOMINAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  region: string;
  timeRemaining: number;
  operationType: 'SURVEILLANCE' | 'ANALYSIS' | 'MONITORING' | 'RESPONSE';
}

const MissionControlPanel: React.FC<MissionControlPanelProps> = () => {
  const [missions, setMissions] = useState<MissionData[]>([
    {
      operationId: 'NOAA-WATCH-001',
      status: 'ACTIVE',
      priority: 'HIGH',
      region: 'Arctic Sector',
      timeRemaining: 3600,
      operationType: 'MONITORING'
    },
    {
      operationId: 'SOLAR-TRACK-07',
      status: 'CRITICAL',
      priority: 'URGENT',
      region: 'Global',
      timeRemaining: 1200,
      operationType: 'SURVEILLANCE'
    },
    {
      operationId: 'GEO-SURVEY-15',
      status: 'NOMINAL',
      priority: 'MEDIUM',
      region: 'Pacific Rim',
      timeRemaining: 7200,
      operationType: 'ANALYSIS'
    }
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Update mission timers
      setMissions(prev => prev.map(mission => ({
        ...mission,
        timeRemaining: Math.max(0, mission.timeRemaining - 1)
      })));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#00ff88';
      case 'CRITICAL': return '#ff4444';
      case 'STANDBY': return '#ffaa00';
      case 'NOMINAL': return '#4488ff';
      default: return '#888';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'LOW': return '○';
      case 'MEDIUM': return '◐';
      case 'HIGH': return '●';
      case 'URGENT': return '⚠';
      default: return '○';
    }
  };

  return (
    <div className={styles.missionControlPanel}>
      <div className={styles.statusHeader}>
        <div className={styles.timestamp}>
          {currentTime.toISOString().slice(0, 19).replace('T', ' ')} UTC
        </div>
      </div>

      <div className={styles.operationsGrid}>
        {missions.map((mission) => (
          <div key={mission.operationId} className={styles.operationCard}>
            <div className={styles.operationHeader}>
              <span className={styles.priorityIcon} style={{ color: getStatusColor(mission.status) }}>
                {getPriorityIcon(mission.priority)}
              </span>
              <span className={styles.operationId}>{mission.operationId}</span>
              <span 
                className={styles.status}
                style={{ color: getStatusColor(mission.status) }}
              >
                {mission.status}
              </span>
            </div>
            
            <div className={styles.operationDetails}>
              <div className={styles.detailRow}>
                <span className={styles.label}>TYPE:</span>
                <span className={styles.value}>{mission.operationType}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>REGION:</span>
                <span className={styles.value}>{mission.region}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>TIME:</span>
                <span className={`${styles.value} ${mission.timeRemaining < 1800 ? styles.timeWarning : ''}`}>
                  {formatTime(mission.timeRemaining)}
                </span>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button className={styles.actionBtn} title="View Details">📊</button>
              <button className={styles.actionBtn} title="Adjust Parameters">⚙️</button>
              <button className={styles.actionBtn} title="Emergency Override">🚨</button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.systemStatus}>
        <div className={styles.statusIndicator}>
          <span className={styles.statusLight} style={{ backgroundColor: '#00ff88' }}></span>
          <span>ALL SYSTEMS NOMINAL</span>
        </div>
        <div className={styles.commandLine}>
          <span className={styles.prompt}>STARCOM&gt;</span>
          <span className={styles.cursor}>_</span>
        </div>
      </div>
    </div>
  );
};

export default MissionControlPanel;
