import React, { useState, useEffect, useMemo } from 'react';
import styles from './ThreatAssessmentPanel.module.css';

interface ThreatAssessmentPanelProps {
  data?: {
    threats?: Array<{
      id: string;
      type: 'debris' | 'solar-storm' | 'communication-blackout' | 'radiation-spike';
      severity: 'low' | 'medium' | 'high' | 'critical';
      region: string;
      eta: string;
      probability: number;
      description: string;
      recommendations: string[];
    }>;
  };
}

const ThreatAssessmentPanel: React.FC<ThreatAssessmentPanelProps> = ({ data }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alertLevel, setAlertLevel] = useState<'green' | 'yellow' | 'orange' | 'red'>('green');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const threats = useMemo(() => data?.threats || [
    {
      id: 'SOL-2025-001',
      type: 'solar-storm' as const,
      severity: 'high' as const,
      region: 'Northern Hemisphere',
      eta: '02:34:17',
      probability: 87,
      description: 'Class X2.4 solar flare detected with Earth-directed CME',
      recommendations: ['Activate satellite safe mode', 'Monitor power grids', 'Issue aviation advisory']
    },
    {
      id: 'DEB-2025-003',
      type: 'debris' as const,
      severity: 'medium' as const,
      region: 'LEO Corridor 440-460km',
      eta: '14:22:09',
      probability: 45,
      description: 'Fragmentation event creating 200+ trackable objects',
      recommendations: ['Update conjunction screening', 'Notify ISS operations', 'Track debris evolution']
    },
    {
      id: 'RAD-2025-007',
      type: 'radiation-spike' as const,
      severity: 'low' as const,
      region: 'South Atlantic Anomaly',
      eta: '06:15:44',
      probability: 23,
      description: 'Enhanced particle flux in SAA region predicted',
      recommendations: ['Monitor astronaut exposure', 'Adjust EVA timeline', 'Brief crew on protocols']
    }
  ], [data?.threats]);

  useEffect(() => {
    const maxSeverity = threats.reduce((max, threat) => {
      const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
      return Math.max(max, severityLevels[threat.severity]);
    }, 0);

    if (maxSeverity >= 4) setAlertLevel('red');
    else if (maxSeverity >= 3) setAlertLevel('orange');
    else if (maxSeverity >= 2) setAlertLevel('yellow');
    else setAlertLevel('green');
  }, [threats]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff6600';
      case 'medium': return '#ffaa00';
      case 'low': return '#00ff88';
      default: return '#888888';
    }
  };

  const getThreatIcon = (type: string) => {
    switch (type) {
      case 'solar-storm': return '☀️';
      case 'debris': return '💥';
      case 'communication-blackout': return '📡';
      case 'radiation-spike': return '☢️';
      default: return '⚠️';
    }
  };

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case 'red': return '#ff0000';
      case 'orange': return '#ff6600';
      case 'yellow': return '#ffff00';
      case 'green': return '#00ff88';
      default: return '#888888';
    }
  };

  const formatTime = (date: Date) => {
    return date.toUTCString().slice(17, 25) + ' UTC';
  };

  return (
    <div className={styles.threatPanel}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon}>🛡️</span>
          THREAT ASSESSMENT
        </div>
        <div className={styles.alertLevel} style={{ color: getAlertLevelColor(alertLevel) }}>
          ALERT: {alertLevel.toUpperCase()}
        </div>
      </div>

      <div className={styles.statusBar}>
        <div className={styles.timestamp}>{formatTime(currentTime)}</div>
        <div className={styles.threatCount}>
          {threats.length} ACTIVE THREATS
        </div>
      </div>

      <div className={styles.threatList}>
        {threats.map((threat) => (
          <div key={threat.id} className={styles.threatCard}>
            <div className={styles.threatHeader}>
              <div className={styles.threatIcon} style={{ color: getSeverityColor(threat.severity) }}>
                {getThreatIcon(threat.type)}
              </div>
              <div className={styles.threatId}>{threat.id}</div>
              <div className={styles.severity} style={{ color: getSeverityColor(threat.severity) }}>
                {threat.severity.toUpperCase()}
              </div>
            </div>

            <div className={styles.threatType}>
              {threat.type.replace('-', ' ').toUpperCase()}
            </div>

            <div className={styles.threatDetails}>
              <div className={styles.detailRow}>
                <span className={styles.label}>REGION:</span>
                <span className={styles.value}>{threat.region}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>ETA:</span>
                <span className={styles.etaValue}>{threat.eta}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>PROBABILITY:</span>
                <span className={styles.probability}>{threat.probability}%</span>
              </div>
            </div>

            <div className={styles.description}>
              {threat.description}
            </div>

            <div className={styles.recommendations}>
              <div className={styles.recTitle}>RECOMMENDED ACTIONS:</div>
              <ul className={styles.recList}>
                {threat.recommendations.map((rec, index) => (
                  <li key={index} className={styles.recItem}>
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.threatActions}>
              <button className={styles.actionBtn}>📋 Details</button>
              <button className={styles.actionBtn}>📊 Analysis</button>
              <button className={styles.actionBtn}>🚨 Alert Team</button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.systemStatus}>
          <div className={styles.statusLight} style={{ backgroundColor: getAlertLevelColor(alertLevel) }}></div>
          <span>MONITORING ACTIVE</span>
        </div>
        <div className={styles.commandLine}>
          <span className={styles.prompt}>THREAT&gt;</span>
          <span className={styles.command}>assess_all_vectors</span>
          <span className={styles.cursor}>_</span>
        </div>
      </div>
    </div>
  );
};

export default ThreatAssessmentPanel;
