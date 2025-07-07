import React, { useRef, useEffect, useCallback } from 'react';
import { useGlobalCommand } from '../../../hooks/useUnifiedGlobalCommand';
import styles from './TimelineView.module.css';

interface TimelineViewProps {
  className?: string;
  fullscreen?: boolean;
}

const TimelineView: React.FC<TimelineViewProps> = ({ className, fullscreen }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state } = useGlobalCommand();

  const drawTimeline = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Timeline background
    ctx.fillStyle = 'rgba(0, 20, 40, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Main timeline axis
    const timelineY = canvas.height / 2;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, timelineY);
    ctx.lineTo(canvas.width - 50, timelineY);
    ctx.stroke();

    // Time markers
    const timeMarks = 10;
    const markerSpacing = (canvas.width - 100) / timeMarks;
    
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#66ccff';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'center';

    for (let i = 0; i <= timeMarks; i++) {
      const x = 50 + (i * markerSpacing);
      
      // Marker line
      ctx.beginPath();
      ctx.moveTo(x, timelineY - 10);
      ctx.lineTo(x, timelineY + 10);
      ctx.stroke();
      
      // Time label
      const hours = i * 2; // 2-hour intervals
      ctx.fillText(`${hours.toString().padStart(2, '0')}:00`, x, timelineY + 25);
    }

    // Sample events
    const events = [
      { time: 2, type: 'alert', label: 'SECURITY ALERT' },
      { time: 5, type: 'intel', label: 'INTEL UPDATE' },
      { time: 8, type: 'threat', label: 'THREAT DETECTED' },
      { time: 12, type: 'mission', label: 'MISSION START' },
      { time: 16, type: 'update', label: 'STATUS UPDATE' },
    ];

    events.forEach(event => {
      const x = 50 + (event.time / 2) * markerSpacing;
      const eventY = timelineY - 40;

      // Event marker
      ctx.fillStyle = getEventColor(event.type);
      ctx.beginPath();
      ctx.arc(x, eventY, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Event line
      ctx.strokeStyle = getEventColor(event.type);
      ctx.beginPath();
      ctx.moveTo(x, eventY + 6);
      ctx.lineTo(x, timelineY - 10);
      ctx.stroke();

      // Event label
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(event.label, x, eventY - 15);
    });

    // Current time indicator
    const currentX = 50 + (6 * markerSpacing); // Current time at 12:00
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(currentX, 20);
    ctx.lineTo(currentX, canvas.height - 20);
    ctx.stroke();

    // Current time label
    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CURRENT', currentX, 15);

    // Title
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('INTELLIGENCE TIMELINE', canvas.width / 2, 30);
  }, []);

  const getEventColor = (type: string): string => {
    switch (type) {
      case 'alert': return '#ff3333';
      case 'intel': return '#00ff88';
      case 'threat': return '#ff6600';
      case 'mission': return '#3366ff';
      case 'update': return '#ffff00';
      default: return '#ffffff';
    }
  };

  useEffect(() => {
    drawTimeline();
  }, [drawTimeline]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    // Calculate clicked time
    const timelineStart = 50;
    const timelineEnd = canvas.width - 50;
    const clickPosition = (x - timelineStart) / (timelineEnd - timelineStart);
    const clickedHour = Math.floor(clickPosition * 20); // 20 hours total
    
    console.log('Timeline clicked at hour:', clickedHour);
  };

  return (
    <div className={`${styles.timelineView} ${fullscreen ? styles.fullscreen : ''} ${className || ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.icon}>📊</span>
          Intelligence Timeline
        </h2>
        <div className={styles.controls}>
          <button className={styles.controlBtn}>◀◀</button>
          <button className={styles.controlBtn}>◀</button>
          <button className={styles.controlBtn}>⏸</button>
          <button className={styles.controlBtn}>▶</button>
          <button className={styles.controlBtn}>▶▶</button>
        </div>
      </div>
      
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={800}
          height={400}
          onClick={handleCanvasClick}
        />
        
        <div className={styles.overlay}>
          <div className={styles.contextInfo}>
            Context: {state.enhanced?.primaryContextId || 'GLOBAL'}
          </div>
          <div className={styles.stats}>
            <div>Time: 12:00</div>
            <div>Events: 5</div>
          </div>
        </div>
      </div>
      
      <div className={styles.footer}>
        <div className={styles.timeRange}>
          RANGE: 00:00 - 20:00 | RESOLUTION: 2h
        </div>
        <div className={styles.status}>
          TIMELINE ACTIVE
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
